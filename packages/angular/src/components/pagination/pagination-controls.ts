// The two controls Pagination draws that are not a plain Button or
// IconButton: a page number and a dot. Both are the Button root itself
// (DsButtonBase), with the parts React's ButtonRoot `render` builds for
// them in packages/react/src/components/Pagination/. Internal: only
// nav[dsPagination] renders them, so they are not in the package barrel.
//
//   <button data-ds="button" data-part="page" aria-label="Page 3" data-active? aria-current?>
//     <span aria-hidden="true">                 the current page's fill, for the sliding pill
//     <span data-part="label"><span aria-hidden="true">3</span></span>
//     <span data-part="hit" aria-hidden="true">
//
//   <button data-ds="button" data-part="dot" aria-label="Page 2 of 5">
//     <span aria-hidden="true">                 the drawn dot
//     <span data-part="hit" aria-hidden="true">
import { ChangeDetectionStrategy, Component, DestroyRef, booleanAttribute, inject, input } from '@angular/core';
import { DsButtonBase, type ButtonEmphasis } from '../button/button-base';
import { consumeHostAttributes } from '../../internal/host';
import { writePressOrigin } from '../../internal/press-origin';

/** One page number. The number sits in an aria-hidden host the digit roll owns; aria-label names the page. */
@Component({
  selector: 'button[dsPaginationPage], a[dsPaginationPage]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-ds': 'button' },
  template: `
    @if (active()) {
      <span aria-hidden="true"></span>
    }
    <span data-part="label">
      @for (t of [text()]; track t) {
        <span aria-hidden="true">{{ t }}</span>
      }
    </span>
    @if (spinnerLeaving()) {
      <span data-part="spinner" aria-hidden="true"></span>
    }
    <span data-part="hit" aria-hidden="true"></span>
  `,
})
export class DsPaginationPage extends DsButtonBase {
  /** soft for the current page, ghost for the others. */
  readonly emphasis = input<ButtonEmphasis | undefined>(undefined);
  protected readonly defaultEmphasis: ButtonEmphasis = 'soft';
  /** The current page: draws the fill the pill slides. */
  readonly active = input(false, { transform: booleanAttribute });
  /** The number, with Western digits. */
  readonly text = input.required<string>();

  constructor() {
    super();
    consumeHostAttributes(['dsPaginationPage', 'active', 'text']);
    // The press point for a platform ripple, as React's onPointerDown: never while inert.
    const down = (event: PointerEvent) => {
      if (!this.inert()) writePressOrigin(this.host, event, 'pagination');
    };
    this.host.addEventListener('pointerdown', down);
    inject(DestroyRef).onDestroy(() => this.host.removeEventListener('pointerdown', down));
  }
}

/** One dot of the dots form. Its box is the 24 by 24 target; the dot drawn inside is smaller. */
@Component({
  selector: 'button[dsPaginationDot]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-ds': 'button' },
  template: `
    <span aria-hidden="true"></span>
    @if (spinnerLeaving()) {
      <span data-part="spinner" aria-hidden="true"></span>
    }
    <span data-part="hit" aria-hidden="true"></span>
  `,
})
export class DsPaginationDot extends DsButtonBase {
  readonly emphasis = input<ButtonEmphasis | undefined>(undefined);
  protected readonly defaultEmphasis: ButtonEmphasis = 'ghost';

  constructor() {
    super();
    consumeHostAttributes(['dsPaginationDot']);
  }
}
