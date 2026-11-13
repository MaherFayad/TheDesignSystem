// dialog-refuse (order 1.23), as React's DialogBase.tsx refuse(): a press on
// the backdrop of a dialog with dismissible false, or Escape on it, shakes
// the panel along the inline axis with the Web Animations API; a second
// refusal cancels the first; reduced motion leaves it still.
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { durationMs, readEasing } from '@the-system/motion';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DS_DIALOG } from './dialog';

@Component({
  imports: [DS_DIALOG, DsButton, DsTheme],
  template: `
    <div dsTheme="neutral" [dir]="dir()">
      <ng-container dsDialog [dismissible]="dismissible()" [(open)]="open">
        <button id="trigger" dsButton dsDialogTrigger>Leave the board</button>
        <ng-template dsDialogContent title="Leave this board?" description="You lose access until someone invites you again.">
          <div dsDialogFooter>
            <button dsButton dsDialogClose>Stay on board</button>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
class Host {
  readonly dismissible = signal(false);
  readonly open = signal(false);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
}

interface Call {
  target: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  cancelled: boolean;
}

/** Records el.animate on Element, HTMLElement and SVGElement, restored by descriptor. */
function recorder() {
  const calls: Call[] = [];
  const protos = [Element.prototype, HTMLElement.prototype, SVGElement.prototype];
  const saved = protos.map((p) => Object.getOwnPropertyDescriptor(p, 'animate'));
  const animate = function (this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    const call: Call = { target: this, keyframes, options, cancelled: false };
    calls.push(call);
    return {
      id: options.id,
      playState: 'running',
      finished: Promise.resolve(),
      cancel() {
        call.cancelled = true;
      },
    } as unknown as Animation;
  };
  for (const p of protos) Object.defineProperty(p, 'animate', { configurable: true, writable: true, value: animate });
  return {
    calls,
    restore() {
      protos.forEach((p, i) => {
        const d = saved[i];
        if (d) Object.defineProperty(p, 'animate', d);
        else delete (p as unknown as Record<string, unknown>)['animate'];
      });
    },
  };
}

let rec: ReturnType<typeof recorder>;
let fixture: ComponentFixture<Host> | null = null;

async function settle(): Promise<void> {
  await fixture?.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  await fixture?.whenStable();
}

async function open(dismissible = false, dir: 'ltr' | 'rtl' = 'ltr'): Promise<Host> {
  fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  const host = fixture.componentInstance;
  host.dismissible.set(dismissible);
  host.dir.set(dir);
  host.open.set(true);
  await settle();
  return host;
}

const panel = () => document.body.querySelector('[data-ds="dialog"] > [data-part="panel"]') as HTMLElement;
const backdrop = () => document.body.querySelector('[data-ds="dialog"] > [data-part="backdrop"]') as HTMLElement;
const refusals = () => rec.calls.filter((c) => c.options.id === 'ds-motion:dialog-refuse');
const press = () => backdrop().dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

beforeEach(() => {
  rec = recorder();
});
afterEach(() => {
  rec.restore();
  fixture?.destroy();
  fixture = null;
  for (const el of Array.from(document.body.querySelectorAll('[data-dialog-layer]'))) el.remove();
  document.documentElement.removeAttribute('data-motion');
});

describe('dialog-refuse', () => {
  it('a backdrop press on a dialog that will not close shakes the panel, with React arguments', async () => {
    const host = await open();
    press();
    expect(host.open()).toBe(true);
    const [call] = refusals();
    expect(call?.target).toBe(panel());
    expect(call!.keyframes).toEqual([
      { transform: 'none' },
      { transform: 'translateX(calc(var(--_dialog-refuse-shift) * 1))' },
      { transform: 'translateX(calc(var(--_dialog-refuse-shift) * -0.7))' },
      { transform: 'translateX(calc(var(--_dialog-refuse-shift) * 0.35))' },
      { transform: 'none' },
    ]);
    // jsdom has no token CSS: the base value of duration.roll.
    expect(call!.options).toEqual({ duration: durationMs['duration.roll'], easing: readEasing(panel(), 'ease.out'), id: 'ds-motion:dialog-refuse' });
  });

  it('Escape refuses too, and a second refusal cancels the first', async () => {
    const host = await open();
    press();
    escape();
    expect(host.open()).toBe(true);
    const [first, second] = refusals();
    expect(first!.cancelled).toBe(true);
    expect(second!.cancelled).toBe(false);
  });

  it('in rtl the panel swings the other way first', async () => {
    await open(false, 'rtl');
    press();
    expect(refusals()[0]!.keyframes[1]).toEqual({ transform: 'translateX(calc(var(--_dialog-refuse-shift) * -1))' });
  });

  it('a dismissible dialog closes and does not shake', async () => {
    const host = await open(true);
    escape();
    await settle();
    expect(host.open()).toBe(false);
    expect(refusals()).toEqual([]);
  });

  it('reduced motion leaves the panel still', async () => {
    document.documentElement.setAttribute('data-motion', 'reduce');
    const host = await open();
    press();
    escape();
    expect(host.open()).toBe(true);
    expect(refusals()).toEqual([]);
  });
});
