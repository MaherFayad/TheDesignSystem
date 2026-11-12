// Round 2 motion of Form (order 1.22): form-summary-enter and
// form-submit-success, with React's beats, and the field errors that enter
// with the summary. jsdom has no Web Animations API, so Element.animate is
// a stand in that records each call.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { token } from '../../internal/motion-fields';
import { DsTheme } from '../../theme/theme';
import { DsInput } from '../input/input';
import { DsForm } from './form';
import { DsFormField } from './form-field';
import { DsFormSubmit } from './form-submit';

interface Call {
  el: Element;
  frames: Keyframe[];
  opts: KeyframeAnimationOptions;
}

let calls: Call[] = [];
const ids = (id: string) => calls.filter((c) => String(c.opts.id) === `ds-motion:${id}`);

beforeEach(() => {
  calls = [];
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value: vi.fn(function (this: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
      calls.push({ el: this, frames, opts });
      return { id: String(opts?.id ?? ''), finished: new Promise(() => undefined), cancel: vi.fn() } as unknown as Animation;
    }),
  });
});

afterEach(() => {
  Reflect.deleteProperty(Element.prototype, 'animate');
  document.documentElement.removeAttribute('data-motion');
});

@Component({
  imports: [DsTheme, DsForm, DsFormField, DsFormSubmit, DsInput],
  template: `
    <div [dsTheme]="style()">
      <form dsForm [actions]="actions">
        <div dsFormField name="name" label="Full name"><div dsInput name="name" required></div></div>
        <div dsFormField name="email" label="Email"><div dsInput name="email" type="email" required></div></div>
        <ng-template #actions><button dsFormSubmit>Send request</button></ng-template>
      </form>
    </div>
  `,
})
class Host {
  readonly style = signal('desk');
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

async function setup(style = 'desk') {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.style.set(style);
  await fixture.whenStable();
  const form = (fixture.nativeElement as HTMLElement).querySelector('form') as HTMLFormElement;
  const send = async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    await tick();
    await fixture.whenStable();
  };
  const fill = () => {
    for (const [name, value] of [['name', 'Sara Ali'], ['email', 'sara@example.com']] as const) {
      const input = form.querySelector(`input[name="${name}"]`) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };
  return { fixture, form, send, fill };
}

describe('form motion, order 1.22', () => {
  it('form-summary-enter: the summary rows arrive from the inline start, one stagger step apart; the field errors enter too', async () => {
    const { form, send } = await setup();
    await send();
    const rows = [...form.querySelectorAll(':scope > [data-part="summary"] li')];
    expect(rows).toHaveLength(2);
    const played = ids('stagger');
    expect(played.map((c) => c.el)).toEqual(rows);
    expect(String(played[0]?.frames[0]?.transform)).toContain('translateX(calc(-1 * var(--ds-distance-shift');
    expect(ids('field-error-enter')).toHaveLength(2);
  });

  it('form-summary-enter reduced: the rows fade in together', async () => {
    const { form, send } = await setup();
    document.documentElement.setAttribute('data-motion', 'reduce');
    await send();
    const played = ids('stagger');
    expect(played).toHaveLength(2);
    expect(played.every((c) => c.frames.every((f) => f.transform === undefined))).toBe(true);
    expect(form.querySelector('[data-part="summary"]')).not.toBeNull();
  });

  it('form-submit-success: a submit that passes gives each action button one celebrate beat, once', async () => {
    const { form, send, fill } = await setup();
    fill();
    await send();
    expect(form.getAttribute('data-state')).toBe('submitted');
    const [call, ...more] = ids('form-submit-success');
    expect(more).toHaveLength(0);
    expect(call?.el).toBe(form.querySelector(':scope > [data-part="actions"] > *'));
    expect(call?.frames.map((f) => f.transform)).toEqual(['none', `scale(${token.pop})`, 'none']);
    expect(call?.frames[1]?.offset).toBe(0.35);
    expect(call?.opts.easing).toBe('linear');
    await send();
    expect(ids('form-submit-success')).toHaveLength(1);
  });

  it('form-submit-success reduced, and in Studio (pop plays reduced): no motion', async () => {
    const studio = await setup('studio');
    studio.fill();
    await studio.send();
    expect(ids('form-submit-success')).toHaveLength(0);
    studio.fixture.destroy();
    const { send, fill } = await setup();
    document.documentElement.setAttribute('data-motion', 'reduce');
    fill();
    await send();
    expect(ids('form-submit-success')).toHaveLength(0);
  });
});
