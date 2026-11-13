// Order 1.29 Angular parity for Field and Form, as React's Field.tsx and
// Form.tsx: a floating field writes the measured box of its control
// (placeFloatingLabel, review B6) and clears it on teardown; a Field glides
// what follows it when a message enters (FollowGlide.watch, review N12),
// unless it sits in a Form, which glides all of its rows at once
// (FollowGlide.watchChildren). jsdom has no layout and no ResizeObserver, so
// offsetHeight is stubbed and a ResizeObserver records what it watches.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DsForm } from '../form/form';
import { DsInput } from '../input/input';
import { DsField } from './field';

/** Every element a ResizeObserver of the page observes, by observer. */
let observers: { targets: Element[]; disconnected: boolean }[] = [];

class RecordingObserver {
  private readonly entry = { targets: [] as Element[], disconnected: false };
  constructor(_cb: ResizeObserverCallback) {
    observers.push(this.entry);
  }
  observe(el: Element): void {
    this.entry.targets.push(el);
  }
  unobserve(): void {}
  disconnect(): void {
    this.entry.disconnected = true;
  }
}

const watched = () => observers.filter((o) => !o.disconnected).flatMap((o) => o.targets);
/** A live observer that watches only `el`: the glide of a single field (FollowGlide.watch). */
const glides = (el: Element) => observers.some((o) => !o.disconnected && o.targets.length === 1 && o.targets[0] === el);

@Component({
  imports: [DsField, DsInput, DsForm],
  template: `
    @if (shown()) {
      <div dsField id="floating" label="Board name" [floating]="floating()"><div dsInput></div></div>
    }
    <div dsField id="plain" label="Owner"><div dsInput></div></div>
    <form dsForm id="form">
      <div dsField id="inner" label="Team"><div dsInput></div></div>
    </form>
    <div data-ds="form" id="bare">
      <div dsField id="direct" label="Region"><div dsInput></div></div>
    </div>
  `,
})
class Host {
  readonly floating = signal(true);
  readonly shown = signal(true);
}

let hadObserver: unknown;
let hadHeight: PropertyDescriptor | undefined;

beforeEach(() => {
  observers = [];
  hadObserver = (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = RecordingObserver;
  hadHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute('data-ds') === 'input' ? 44 : 0;
    },
  });
});

afterEach(() => {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = hadObserver;
  if (hadHeight) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', hadHeight);
  else Reflect.deleteProperty(HTMLElement.prototype, 'offsetHeight');
});

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

describe('Field parity, order 1.29', () => {
  it('a floating field writes its control box and text inset, and watches its children for a resize (B6)', async () => {
    const { q } = await setup();
    const field = q('floating');
    expect(field.style.getPropertyValue('--_field-float-box')).toBe('44px');
    expect(field.style.getPropertyValue('--_field-float-inset')).toBe('0px');
    for (const child of Array.from(field.children)) expect(watched()).toContain(child);
    // A field that does not float writes nothing.
    expect(q('plain').style.getPropertyValue('--_field-float-box')).toBe('');
  });

  it('turning floating off clears both properties and stops watching the children', async () => {
    const { fixture, host, q } = await setup();
    const field = q('floating');
    const input = field.querySelector('[data-ds="input"]')!;
    host.floating.set(false);
    await fixture.whenStable();
    expect(field.style.getPropertyValue('--_field-float-box')).toBe('');
    expect(field.style.getPropertyValue('--_field-float-inset')).toBe('');
    expect(watched()).not.toContain(input);
  });

  it('a field glides what follows it, a field inside a form does not, and a form watches its rows (N12)', async () => {
    const { q } = await setup();
    expect(glides(q('floating'))).toBe(true);
    expect(glides(q('plain'))).toBe(true);
    // A field anywhere inside a [data-ds="form"] leaves the glide to the form, as React.
    expect(glides(q('direct'))).toBe(false);
    // In DsForm a field sits in the body part; the form glides it, so it has no glide of its own.
    expect(q('inner').parentElement?.getAttribute('data-part')).toBe('body');
    expect(glides(q('inner'))).toBe(false);
    // FollowGlide.watchChildren observes the form and each of its rows (the status, the body).
    const form = q('form');
    expect(observers.some((o) => !o.disconnected && o.targets[0] === form && o.targets.includes(form.querySelector(':scope > [data-part="body"]')!))).toBe(true);
  });

  it('a field that leaves stops its glide and its resize watch', async () => {
    const { fixture, host, q } = await setup();
    const field = q('floating');
    host.shown.set(false);
    await fixture.whenStable();
    expect(glides(field)).toBe(false);
    expect(watched().some((el) => field.contains(el))).toBe(false);
  });
});
