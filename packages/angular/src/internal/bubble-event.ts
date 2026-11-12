/**
 * Radix bubble inputs: after the state of a hidden form input changes, Radix
 * dispatches an event on it so a form (dsForm, a native listener) sees the
 * change. Radio and checkbox inputs get `click`, a slider input gets `input`.
 * The first value seen for an element is its starting state, not a change.
 */
export class BubbleEvent<T> {
  private readonly seen = new WeakMap<HTMLInputElement, T>();

  constructor(private readonly type: 'click' | 'input') {}

  /** Call after the element shows `value`. Dispatches when it differs from the last value seen. */
  update(el: HTMLInputElement | undefined, value: T): void {
    if (!el) return;
    const had = this.seen.has(el);
    const prev = this.seen.get(el);
    this.seen.set(el, value);
    if (had && prev !== value) el.dispatchEvent(new Event(this.type, { bubbles: true }));
  }
}
