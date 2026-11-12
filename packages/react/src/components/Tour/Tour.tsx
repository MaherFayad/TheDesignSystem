'use client';
// Tour: a short guided tour that points at real parts of the screen, one
// step at a time. Never modal: the page stays usable, nothing dims it, and
// skip is always there.
//
// Behavior: Radix Popover, anchored to each step's target through a virtual
// anchor (the target's box), so the panel follows the target when the page
// scrolls or resizes. The step state is local (current, next, back) until
// `packages/shared/src/stepper.ts` (order 1.7.7, lane 4B) is merged; then it
// moves onto that machine in free mode with no change to the props.
//
// Sources: no source (the order says so). Designed from the dials table of
// PLAN.md 3.7 and the nearest components: Popover (the surface, the arrow,
// the motion, the themed portal) and Stepper (the "Step 2 of 4" progress).
//
// The DOM:
//
//   <body>
//     <div data-ds="theme" data-tour-layer>               the portal Theme, display: contents
//       <div data-ds="tour" data-size data-state>          root: a fixed layer over the viewport, takes no pointer
//         <div data-part="highlight">                       the ring around the target
//         <div data-radix-popper-content-wrapper>
//           <div data-part="panel" role="dialog" data-side data-align>   Radix Content
//             <h2 data-part="title">
//             <div data-part="body">
//             <div data-part="footer">
//               <p data-part="progress">
//               <button data-ds="button" data-part="skip">
//               <button data-ds="button" data-part="back">  from the second step
//               <button data-ds="button" data-part="next">  "Finish tour" on the last step
//             <span><svg data-part="arrow"></span>
//
// Why the root is a layer and the content is part `panel` (the order made the
// content the root): the highlight must sit outside the Radix wrapper, which
// is positioned with a transform, and still belong to the tour (a part
// belongs to the nearest root). As in Dialog, the root holds both.
//
// Focus: on open and on every step, focus moves to the panel, so the title
// and the body are read; Tab then reaches skip, back and next. Escape ends
// the tour. A click on the page does not end it. On close, focus returns to
// the element that had it when the tour started.
//
// The target scrolls into view on each step: smoothly, or at once under
// reduced motion.
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { Popover as RadixPopover } from 'radix-ui';
import type { Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { Button } from '../Button';
import { ArrowShape, ThemedPortal, isArabic, physicalSide, useLayerPresence, type FloatingAlign, type FloatingSide } from '../Popover/FloatingLayer';
import { useControllable } from '../Window/useControllable';

export type TourSize = Extract<Size, 'sm' | 'md'>;
export type TourSide = FloatingSide;
export type TourAlign = FloatingAlign;

/** Where a step points: a CSS selector, a ref, or a function that returns the element. */
export type TourTarget = string | RefObject<HTMLElement | null> | (() => HTMLElement | null);

export interface TourStep {
  /** The element the step points at. When it is missing, the panel shows in the middle of the viewport with no ring. */
  target: TourTarget;
  /** The step title: what this part of the screen is. */
  title: ReactNode;
  /** One or two short sentences: what to do with it. */
  body?: ReactNode;
  /** The preferred side of the target. start and end follow the reading direction. Default bottom. */
  side?: TourSide;
  /** Alignment along the target. Default center. */
  align?: TourAlign;
}

export interface TourLabels {
  next: string;
  back: string;
  skip: string;
  finish: string;
  /** The progress text for step `current` of `total`, both counted from 1. */
  progress: (current: number, total: number) => string;
}

const tourLabels: Record<'en' | 'ar', TourLabels> = {
  en: {
    next: 'Next step',
    back: 'Previous step',
    skip: 'Skip tour',
    finish: 'Finish tour',
    progress: (current, total) => `Step ${current} of ${total}`,
  },
  ar: {
    next: 'الخطوة التالية',
    back: 'الخطوة السابقة',
    skip: 'تخطي الجولة',
    finish: 'إنهاء الجولة',
    progress: (current, total) => `الخطوة ${current} من ${total}`,
  },
};

/** The step state Tour uses until stepper.ts lands: the index, clamped to the steps. */
export function clampStep(step: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max(Math.trunc(step), 0), total - 1);
}

function resolveTarget(target: TourTarget, doc: Document): HTMLElement | null {
  if (typeof target === 'string') return doc.querySelector<HTMLElement>(target);
  if (typeof target === 'function') return target();
  return target.current;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** The ring box in logical coordinates of the viewport. */
interface Ring {
  inlineStart: number;
  blockStart: number;
  inlineSize: number;
  blockSize: number;
}

export interface TourProps {
  /** The steps, in order. */
  steps: readonly TourStep[];
  /** Controlled open state, with onOpenChange. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  /** Called with false on Escape, Skip tour and Finish tour. */
  onOpenChange?: (open: boolean) => void;
  /** Controlled step index from 0, with onStepChange. */
  step?: number;
  /** Default 0. */
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  /** Called when Finish tour is pressed on the last step, before onOpenChange(false). */
  onFinish?: () => void;
  /** The panel width: sm 240, md 320 px. Default md. */
  size?: TourSize;
  /** Button and progress words. Default English, Arabic under lang ar. */
  labels?: Partial<TourLabels>;
  /** Class name and inline style of the root layer. */
  className?: string;
  style?: CSSProperties;
}

/**
 * The whole tour: no trigger part. Open it from any Button with open and
 * onOpenChange; it starts at defaultStep (or the controlled step).
 */
export function Tour({
  steps,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  step: stepProp,
  defaultStep = 0,
  onStepChange,
  onFinish,
  size = 'md',
  labels,
  className,
  style,
}: TourProps) {
  const theme = useTheme();
  const words = { ...tourLabels[isArabic(theme.lang) ? 'ar' : 'en'], ...labels };
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [rawStep, setStep] = useControllable(stepProp, defaultStep, onStepChange);
  const total = steps.length;
  const index = clampStep(rawStep, total);
  const current = steps[index];
  const shown = open && current !== undefined;

  const [mounted, presenceRef] = useLayerPresence(shown);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const openedFrom = useRef<HTMLElement | null>(null);
  const setPanelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && !panelRef.current) {
        const active = node.ownerDocument.activeElement;
        openedFrom.current = active instanceof HTMLElement && active !== node.ownerDocument.body ? active : null;
      }
      panelRef.current = node;
      presenceRef(node);
    },
    [presenceRef],
  );

  // The target of this step, found after render (it lives in the page).
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!shown || !current) {
      setTarget(null);
      return;
    }
    setTarget(resolveTarget(current.target, document));
  }, [shown, current]);

  // Scroll the target into view on each step, without motion under reduced motion.
  useEffect(() => {
    if (!shown || !target || typeof target.scrollIntoView !== 'function') return;
    target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [shown, target]);

  // The ring follows the target box in logical viewport coordinates.
  const [ring, setRing] = useState<Ring | null>(null);
  useLayoutEffect(() => {
    if (!shown || !target) {
      setRing(null);
      return;
    }
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = target.getBoundingClientRect();
        const width = layerRef.current?.clientWidth ?? document.documentElement.clientWidth;
        const rtl = theme.dir === 'rtl';
        setRing({
          inlineStart: rtl ? width - box.right : box.left,
          blockStart: box.top,
          inlineSize: box.width,
          blockSize: box.height,
        });
      });
    };
    measure();
    window.addEventListener('scroll', measure, { capture: true, passive: true });
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(target);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', measure, { capture: true });
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [shown, target, theme.dir]);

  // The anchor: the target's box, or the middle of the viewport when the target is missing.
  const anchor = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () => {
          if (target?.isConnected) return target.getBoundingClientRect();
          const w = typeof window === 'undefined' ? 0 : window.innerWidth;
          const h = typeof window === 'undefined' ? 0 : window.innerHeight;
          return new DOMRect(w / 2, h / 2, 0, 0);
        },
        contextElement: target ?? undefined,
      },
    }),
    [target],
  );

  // Each new step: focus moves to the panel, so its title and body are read.
  useEffect(() => {
    if (shown) panelRef.current?.focus();
  }, [shown, index]);

  const titleId = useId();
  const bodyId = useId();
  const progressId = useId();

  if (!mounted || !current) return null;

  const last = index === total - 1;
  const end = () => setOpen(false);
  const next = () => {
    if (last) {
      onFinish?.();
      end();
    } else setStep(index + 1);
  };
  const back = () => setStep(Math.max(index - 1, 0));
  const missing = target === null;
  const ringStyle = ring
    ? ({
        '--_tour-target-inline-start': `${ring.inlineStart}px`,
        '--_tour-target-block-start': `${ring.blockStart}px`,
        '--_tour-target-inline-size': `${ring.inlineSize}px`,
        '--_tour-target-block-size': `${ring.blockSize}px`,
      } as CSSProperties)
    : undefined;

  return (
    <ThemedPortal layer="tour">
      <div ref={layerRef} className={className} style={style} data-ds="tour" data-size={size} data-state={shown ? 'open' : 'closed'}>
        {ring && <div data-part="highlight" aria-hidden="true" style={ringStyle} />}
        <RadixPopover.Root open={shown} onOpenChange={(next) => !next && end()} modal={false}>
          <RadixPopover.Anchor virtualRef={anchor} />
          <RadixPopover.Content
            ref={setPanelRef}
            data-part="panel"
            aria-labelledby={titleId}
            aria-describedby={current.body ? `${bodyId} ${progressId}` : progressId}
            side={physicalSide(current.side ?? 'bottom', theme.dir)}
            align={current.align ?? 'center'}
            sideOffset={missing ? 0 : 12}
            collisionPadding={8}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              panelRef.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              const back = openedFrom.current;
              openedFrom.current = null;
              if (back?.isConnected) back.focus();
            }}
            // The page stays usable: a click or focus elsewhere never ends the tour.
            onInteractOutside={(event) => event.preventDefault()}
          >
            <h2 id={titleId} data-part="title">
              {current.title}
            </h2>
            {current.body && (
              <div id={bodyId} data-part="body">
                {current.body}
              </div>
            )}
            <div data-part="footer">
              <p id={progressId} data-part="progress">
                {words.progress(index + 1, total)}
              </p>
              <Button data-part="skip" size="sm" emphasis="ghost" onClick={end}>
                {words.skip}
              </Button>
              {index > 0 && (
                <Button data-part="back" size="sm" onClick={back}>
                  {words.back}
                </Button>
              )}
              <Button data-part="next" size="sm" tone="accent" emphasis="solid" onClick={next}>
                {last ? words.finish : words.next}
              </Button>
            </div>
            {!missing && (
              <RadixPopover.Arrow asChild>
                <ArrowShape />
              </RadixPopover.Arrow>
            )}
          </RadixPopover.Content>
        </RadixPopover.Root>
      </div>
    </ThemedPortal>
  );
}
