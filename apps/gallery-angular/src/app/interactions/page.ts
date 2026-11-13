// The /interactions page of the Angular gallery (orders 1.21 and 1.22): the
// twin of apps/gallery-react/src/Interactions.tsx, with the same DOM hooks,
// so the recorder and the timing sampler drive both galleries the same way.
// One card per interaction of the registry in packages/motion, grouped by
// the six families, with a live stage, its beats, its timing and its reduced
// form. The bar holds a reduced motion switch (data-motion="reduce" on
// <html>) and a control that replays every stage; each card has its own
// replay control.
//
// `/interactions?focus=<id>` shows that one stage only, centred and drawn
// large, with a dot that follows the pointer (headless Chromium draws no
// cursor), as in React.
//
// Stages live in ./<family>.ts, one file per family (inputs has two: the
// controls and the form parts), each a map from the
// interaction id to a standalone component. A component the Angular port
// does not have yet has no stage; its card says so.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
  type Type,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { INTERACTION_FAMILIES, interactionRecipes, interactions, type Interaction, type InteractionFamily } from '@the-system/motion';
import desk from '@the-system/styles/desk/motion';
import neutral from '@the-system/styles/neutral/motion';
import studio from '@the-system/styles/studio/motion';
import { DsButton, DsSwitch, DsThemeService, DsToaster } from '@the-system/angular';
import { stages as actions } from './actions';
import { stages as feedback } from './feedback';
import { stages as inputs } from './inputs';
import { stages as inputsForms } from './inputs-forms';
import { stages as navigation } from './navigation';
import { stages as overlays } from './overlays';
import { stages as selection } from './selection';

/** Live stages by interaction id, from every family file. */
export const stages: Record<string, Type<unknown>> = { ...actions, ...inputs, ...inputsForms, ...selection, ...overlays, ...navigation, ...feedback };

/** The recipes that turn off the CSS interactions each style plays reduced or not at all. */
const recipes = [interactionRecipes('studio', studio), interactionRecipes('desk', desk), interactionRecipes('neutral', neutral)].join('\n');

/** Puts the page's recipes in one style element while the page is shown. */
function useRecipes(): void {
  const el = document.createElement('style');
  el.setAttribute('data-gallery', 'interaction-recipes');
  el.textContent = recipes;
  document.head.append(el);
  inject(DestroyRef).onDestroy(() => el.remove());
}

@Component({
  selector: 'div[data-gallery=pointer-dot]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: ``,
})
export class PointerDot {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const move = (e: PointerEvent) => (el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`);
    const down = () => el.setAttribute('data-down', '');
    const up = () => el.removeAttribute('data-down');
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('pointerup', up, true);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointerup', up, true);
    });
  }
}

@Component({
  selector: 'div[data-gallery=interactions-focus]',
  imports: [NgComponentOutlet, PointerDot, DsToaster],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-focus]': 'id()' },
  template: `
    <div data-gallery="interactions-focus-stage" data-interaction-stage="">
      @if (stage(); as s) {
        <ng-container *ngComponentOutlet="s" />
      } @else {
        <p>No stage for {{ id() }}.</p>
      }
    </div>
    <div data-gallery="pointer-dot"></div>
    <ng-container dsToaster />
  `,
})
export class FocusStage {
  readonly id = input.required<string>();
  protected readonly stage = computed(() => stages[this.id()]);
  constructor() {
    useRecipes();
  }
}

@Component({
  selector: 'article[data-interaction]',
  imports: [NgComponentOutlet, DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-interaction]': 'i().id', '[attr.aria-labelledby]': '"i-" + i().id' },
  template: `
    <header data-interaction-head="">
      <h3 [id]="'i-' + i().id">{{ i().id }}</h3>
      @if (stage()) {
        <button dsButton size="sm" emphasis="ghost" start="refresh" [attr.aria-describedby]="'i-' + i().id" data-interaction-replay="" (click)="replay()">
          Replay
        </button>
      }
    </header>
    <p>{{ summary() }}</p>
    @for (r of runs(); track r) {
      <div data-interaction-stage="" #stageEl>
        @if (stage(); as s) {
          <ng-container *ngComponentOutlet="s" />
        } @else {
          <p>No Angular stage yet: {{ i().components.join(', ') }} {{ i().components.length > 1 ? 'are' : 'is' }} not ported or not in this round.</p>
        }
      </div>
    }
    <p>Trigger: {{ i().trigger }}</p>
    @if (i().beats; as beats) {
      <ol data-interaction-beats="">
        @for (b of beats; track b) {
          <li>{{ b }}</li>
        }
      </ol>
    } @else {
      <p>Feedback: {{ i().feedback }}</p>
    }
    @if (styles(); as s) {
      <p>Styles: {{ s }}</p>
    }
    <p>Reduced motion: {{ i().reduced }}</p>
  `,
})
export class Card {
  readonly i = input.required<Interaction>();
  readonly replayAll = input(0);
  protected readonly stage = computed(() => stages[this.i().id]);
  private readonly run = signal(0);
  /** One key per mount: a new key mounts the stage again, so first paint motion plays again. */
  protected readonly runs = computed(() => [this.run()]);
  private readonly stageEl = viewChild<ElementRef<HTMLElement>>('stageEl');
  private pressAfterMount = false;
  protected readonly summary = computed(() => {
    const i = this.i();
    const how = i.primitive ? `Primitive ${i.primitive}, pattern ${i.pattern}` : `Pattern ${i.pattern}`;
    return `${i.components.join(', ')}. ${how}, ${i.drive === 'css' ? 'CSS' : 'Web Animations API'}. Round ${i.round ?? 1}. Proposed.`;
  });
  protected readonly styles = computed(() => {
    const s = this.i().styles;
    if (!s) return '';
    return (['studio', 'desk', 'neutral'] as const)
      .filter((k) => s[k])
      .map((k) => `${k} ${s[k]}`)
      .join('; ');
  });

  constructor() {
    // The bar's replay control counts up from 0; 0 is the first paint. It
    // mounts every stage again and presses nothing, so overlays do not open
    // on top of each other.
    let first = true;
    effect(() => {
      this.replayAll();
      if (first) {
        first = false;
        return;
      }
      this.run.update((n) => n + 1);
    });
    // Replay: after the new stage is drawn, press its first trigger, so an
    // interaction that answers a press plays too.
    effect(() => {
      const el = this.stageEl()?.nativeElement;
      if (!el || !this.pressAfterMount) return;
      this.pressAfterMount = false;
      requestAnimationFrame(() => el.querySelector<HTMLElement>('[data-interaction-trigger]')?.click());
    });
  }

  protected replay(): void {
    this.pressAfterMount = true;
    this.run.update((n) => n + 1);
  }
}

@Component({
  selector: 'div[data-gallery=interactions]',
  imports: [Card, DsButton, DsSwitch, DsToaster],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header data-gallery="interactions-bar">
      <h1 style="margin: 0">Interactions</h1>
      <div dsSwitch label="Reduce motion" [(checked)]="reduced" data-interactions-reduce=""></div>
      <button dsButton size="sm" emphasis="soft" start="refresh" data-interactions-replay-all="" (click)="replayAll.set(replayAll() + 1)">
        Replay every stage
      </button>
      <p style="margin: 0">Style {{ style() }}. Every interaction here is proposed and waits for the owner.</p>
    </header>
    @for (g of grouped; track g.id) {
      <section data-gallery="interactions-family" [attr.aria-labelledby]="'family-' + g.id">
        <h2 [id]="'family-' + g.id" style="margin: 0">{{ g.title }}</h2>
        <div data-gallery="interactions-grid">
          @for (i of g.rows; track i.id) {
            <article data-interaction [i]="i" [replayAll]="replayAll()"></article>
          }
        </div>
      </section>
    }
    <ng-container dsToaster />
  `,
})
export class InteractionsList {
  protected readonly reduced = signal(document.documentElement.getAttribute('data-motion') === 'reduce');
  protected readonly replayAll = signal(0);
  protected readonly style = computed(() => this.theme.value().style);
  private readonly theme = inject(DsThemeService);
  protected readonly grouped = (Object.keys(INTERACTION_FAMILIES) as InteractionFamily[])
    .map((id) => ({ id, title: INTERACTION_FAMILIES[id], rows: interactions.filter((i) => i.family === id) }))
    .filter((g) => g.rows.length > 0);

  constructor() {
    useRecipes();
    const html = document.documentElement;
    effect(() => {
      if (this.reduced()) html.setAttribute('data-motion', 'reduce');
      else html.removeAttribute('data-motion');
    });
    inject(DestroyRef).onDestroy(() => html.removeAttribute('data-motion'));
  }
}
