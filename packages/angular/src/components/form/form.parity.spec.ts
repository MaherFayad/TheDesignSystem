// Order 1.29 Angular parity for FormSubmit, as React's FormSubmit (a Button):
// the button family's hit part (review B10) is its last child.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsForm } from './form';
import { DsFormSubmit } from './form-submit';

@Component({
  imports: [DsForm, DsFormSubmit],
  template: `
    <form dsForm [actions]="actions">
      <ng-template #actions><button dsFormSubmit id="send">Send request</button></ng-template>
    </form>
  `,
})
class Host {}

describe('FormSubmit parity, order 1.29', () => {
  it('renders the label, then the empty aria-hidden hit part last (B10)', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const send = fixture.nativeElement.querySelector('#send') as HTMLElement;
    expect(Array.from(send.children).map((c) => c.getAttribute('data-part'))).toEqual(['label', 'hit']);
    expect(send.lastElementChild?.getAttribute('aria-hidden')).toBe('true');
    expect(send.lastElementChild?.childNodes).toHaveLength(0);
  });
});
