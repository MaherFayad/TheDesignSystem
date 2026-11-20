// The portal life of a modal overlay (order A5), shared by Sheet and
// AlertDialog. The same steps as dsDialogContent and dsDrawerContent
// (components/dialog/dialog.ts): a CDK ComponentPortal of the layer
// component attached straight into document.body, so its host is the themed
// portal wrapper; the layer joins the one modal stack (behavior/
// dialog-behavior.ts); document keydown and focusin go to the layer; the page
// does not scroll and is hidden from assistive tech; on close the root plays
// its exit (the Web Animations API `finished` promise, never animationend)
// and focus goes back to the trigger, else to what had focus before.
import {
  ApplicationRef,
  DestroyRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  untracked,
  type InjectionToken,
  type Signal,
  type Type,
  type WritableSignal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ComponentPortal, DomPortalOutlet } from '@angular/cdk/portal';
import { captureFocusReturn, focusReturnTarget, type FocusReturn } from '@the-system/shared';
import { durationMs, readDuration, readEasing } from '@the-system/motion';
import { animationsDone, hideOthers, lockScroll, popModalLayer, pushModalLayer } from '../behavior';
import type { DsMotionApi } from './motion';

/** What a layer component gives the portal. */
export interface ModalPortalLayer {
  /** True while the exit plays. */
  readonly closing: WritableSignal<boolean>;
  onDocumentKeydown(event: KeyboardEvent): void;
  onDocumentFocusin(event: FocusEvent): void;
  /** Runs the focus rule once the panel has rendered. */
  focusInitial(): void;
  /** The elements whose exit the close waits for. */
  animated(): Element[];
}

export interface ModalPortalOptions<L extends ModalPortalLayer, D> {
  open: Signal<boolean>;
  component: Type<L>;
  token: InjectionToken<D>;
  /** The data the layer injects, read on each open. */
  data: () => D;
  /** The trigger, where focus returns. */
  trigger: () => HTMLElement | null;
}

/** The layer while it is mounted. */
export interface ModalPortal<L> {
  readonly layer: () => L | null;
}

/** Opens and closes the layer with `open`. Call in an injection context (a content directive's constructor). */
export function connectModalPortal<L extends ModalPortalLayer, D>(options: ModalPortalOptions<L, D>): ModalPortal<L> {
  const injector = inject(Injector);
  const appRef = inject(ApplicationRef);
  const doc = inject(DOCUMENT);
  let outlet: DomPortalOutlet | null = null;
  let layer: L | null = null;
  let undo: (() => void)[] = [];
  let returnTo: { active: FocusReturn; trigger: FocusReturn } | null = null;
  let generation = 0;

  const mount = () => {
    generation += 1;
    if (layer) {
      // Reopened while the exit played: stay mounted and open again.
      layer.closing.set(false);
      return;
    }
    returnTo = { active: captureFocusReturn(doc.activeElement), trigger: captureFocusReturn(options.trigger()) };
    const child = Injector.create({ parent: injector, providers: [{ provide: options.token, useValue: options.data() }] });
    outlet = new DomPortalOutlet(doc.body, appRef, child);
    const ref = outlet.attach(new ComponentPortal(options.component, null, child));
    ref.changeDetectorRef.detectChanges();
    const current = ref.instance;
    layer = current;
    pushModalLayer(current);
    const keydown = (e: KeyboardEvent) => current.onDocumentKeydown(e);
    const focusin = (e: FocusEvent) => current.onDocumentFocusin(e);
    doc.addEventListener('keydown', keydown);
    doc.addEventListener('focusin', focusin);
    undo = [
      () => doc.removeEventListener('keydown', keydown),
      () => doc.removeEventListener('focusin', focusin),
      lockScroll(doc),
      hideOthers(ref.location.nativeElement as Element),
    ];
    afterNextRender(() => current.focusInitial(), { injector: child });
  };

  const dispose = (returnFocus: boolean) => {
    const current = layer;
    if (!current) return;
    popModalLayer(current);
    for (const fn of undo.reverse()) fn();
    undo = [];
    // detach, not dispose: DomPortalOutlet.dispose removes its outlet element, here document.body.
    outlet?.detach();
    outlet = null;
    layer = null;
    const memo = returnTo;
    returnTo = null;
    if (!returnFocus) return;
    const trigger = options.trigger();
    const target = trigger?.isConnected
      ? trigger
      : memo
        ? focusReturnTarget(memo.active.target ? memo.active : memo.trigger, doc)
        : null;
    if (target?.isConnected) target.focus();
  };

  const unmountAfterExit = () => {
    const current = layer;
    if (!current) return;
    const at = generation;
    current.closing.set(true);
    afterNextRender(
      () => {
        void animationsDone(current.animated()).then(() => {
          if (at === generation && layer === current) dispose(true);
        });
      },
      { injector },
    );
  };

  effect(() => {
    const open = options.open();
    untracked(() => (open ? mount() : unmountAfterExit()));
  });
  inject(DestroyRef).onDestroy(() => dispose(false));
  return { layer: () => layer };
}

/**
 * The refused nudge (interaction dialog-refuse), as React's DialogBase
 * refuse(): a shake along the inline axis inside duration.roll on ease.out.
 * Cancels the previous one; returns the new one, or null when the style's
 * mode or reduced motion leaves the panel still.
 */
export function playRefusal(panel: HTMLElement, motion: DsMotionApi, dir: string, previous: Animation | null): Animation | null {
  previous?.cancel();
  if (typeof panel.animate !== 'function' || motion.mode('dialog-refuse') !== 'full') return null;
  // Without the token (a page with no token CSS) the base value; under reduced motion the token is 0.
  const set = typeof getComputedStyle === 'function' && getComputedStyle(panel).getPropertyValue('--ds-duration-roll').trim() !== '';
  const duration = set ? readDuration(panel, 'duration.roll') : durationMs['duration.roll'];
  if (duration <= 0) return null;
  const sign = dir === 'rtl' ? -1 : 1;
  const at = (k: number) => ({ transform: `translateX(calc(var(--_dialog-refuse-shift) * ${sign * k}))` });
  return panel.animate([{ transform: 'none' }, at(1), at(-0.7), at(0.35), { transform: 'none' }], {
    duration,
    easing: readEasing(panel, 'ease.out'),
    id: 'ds-motion:dialog-refuse',
  });
}
