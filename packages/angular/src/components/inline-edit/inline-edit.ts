// InlineEdit: text that turns into an Input to edit in place, such as the
// name of a board in its header. The twin of
// packages/react/src/components/InlineEdit/InlineEdit.tsx.
//
//   <div dsInlineEdit label="Board name" [(value)]="name" [validate]="required"></div>
//
// Viewing, the display part is a ghost Button that shows the value. A press,
// Enter or Space starts editing: the nested dsInput (the control part) takes
// focus with its text selected, with a save and a cancel IconButton. Enter
// or save keeps the value, Escape or cancel drops it; both return focus to
// the display. Leaving the editor saves, but never an invalid value: the
// editor stays open with the message.
//
// React's value, defaultValue and onValueChange are the value model
// (`[(value)]`), whose valueChange fires on save only. onEditingChange is the
// editingChange output. validate is a function input. error takes a string
// or a TemplateRef. It implements ControlValueAccessor: a save is a change.
//
// Motion (interaction inline-edit-morph, order 1.22, proposed), as React:
// starting to edit morphs the edit glyph into the save check (iconMorph) and
// the cancel mark lands one stagger step later (iconParts). Saving morphs
// the check back into the pencil; cancelling morphs the close mark into it.
// The leaving glyph is kept for one morph in an unnamed aria-hidden span
// after the new one, in the same icon part, so the button keeps its size.
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  type OnInit,
  type TemplateRef,
  untracked,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DsIcon } from '@the-system/icons/angular';
import { iconMorph, iconParts, settled } from '@the-system/motion';
import type { Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { DsButton } from '../button/button';
import { DsIconButton } from '../icon-button/icon-button';
import { DsInputGroupContext } from '../input-group/input-group-context';
import { DsInput } from '../input/input';

export type InlineEditSize = Size;
export type InlineEditState = 'viewing' | 'editing';
/** A message that says how to fix the value: a string, or a template. */
export type InlineEditError = string | TemplateRef<unknown>;

let nextId = 0;

/** The interaction id of the glyph morph in the registry and the style presets. */
const INLINE_EDIT_MORPH = 'inline-edit-morph';

type MorphIcon = 'edit' | 'check' | 'close';

const ATTRIBUTES = [
  'dsInlineEdit',
  'label',
  'value',
  'defaultEditing',
  'validate',
  'placeholder',
  'editLabel',
  'saveLabel',
  'cancelLabel',
  'savedLabel',
  'size',
  'disabled',
  'invalid',
  'error',
];

@Component({
  selector: 'div[dsInlineEdit]',
  exportAs: 'dsInlineEdit',
  imports: [DsButton, DsIcon, DsIconButton, DsInput, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsInlineEdit), multi: true }],
  viewProviders: [{ provide: DsInputGroupContext, useValue: null }],
  host: {
    'data-ds': 'inline-edit',
    '[attr.data-size]': 'size()',
    '[attr.data-state]': 'editing() ? "editing" : "viewing"',
    '[attr.data-empty]': 'empty() ? "" : null',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '(focusout)': 'onRootBlur($event)',
  },
  template: `
    @if (editing()) {
      <div
        dsInput
        data-part="control"
        [aria-label]="label()"
        [size]="size()"
        [value]="draft()"
        (valueChange)="onDraft($event ?? '')"
        (keydown)="onInputKeyDown($event)"
        [invalid]="isInvalid()"
        [aria-describedby]="describedBy()"
      ></div>
      <button dsIconButton data-part="save" [icon]="saveIcon" [label]="saveLabel()" [size]="iconSize()" (mousedown)="$event.preventDefault()" (click)="save(true)"></button>
      <button dsIconButton data-part="cancel" icon="close" [label]="cancelLabel()" [size]="iconSize()" (mousedown)="$event.preventDefault()" (click)="cancel()"></button>
    } @else {
      <button
        #display
        dsButton
        data-part="display"
        emphasis="ghost"
        [size]="size()"
        [end]="displayEnd"
        [disabled]="isDisabled()"
        [attr.aria-label]="name()"
        [attr.aria-describedby]="describedBy() ?? null"
        (click)="start()"
      >{{ empty() ? placeholder() : current() }}</button>
    }
    @if (message(); as m) {
      <p data-part="error" [id]="errorId">
        <svg dsIcon name="danger" size="md"></svg>
        <span>
          @if (isText(m)) {
            {{ m }}
          } @else {
            <ng-container [ngTemplateOutlet]="m" />
          }
        </span>
      </p>
    }
    <span data-part="status" role="status">{{ status() }}</span>
    <ng-template #saveIcon>
      <svg dsIcon name="check" size="md"></svg>
      @for (l of leavingFrom('edit'); track l.id) {
        <span aria-hidden="true"><svg dsIcon name="edit" size="md"></svg></span>
      }
    </ng-template>
    <ng-template #displayEnd>
      <svg dsIcon name="edit" size="md"></svg>
      @for (l of leavingFrom('check', 'close'); track l.id) {
        <span aria-hidden="true"><svg dsIcon [name]="l.icon" size="md"></svg></span>
      }
    </ng-template>
  `,
})
export class DsInlineEdit implements ControlValueAccessor, OnInit {
  /** The name of what is edited: the editor's name, and part of the display's. Required. */
  readonly label = input.required<string>();
  /** The value. Two way: `[(value)]`; valueChange fires when a new value is saved. Default empty. */
  readonly value = model<string>('');
  /** Opens in the editor, for a new item named right away. Focus moves only when editing starts later. */
  readonly defaultEditing = input(false, { transform: booleanAttribute });
  /** Checks a value before it is saved. Return a message that says how to fix it, or nothing when it is fine. */
  readonly validate = input<((value: string) => string | undefined | null) | undefined>(undefined);
  /** Shown in the display while the value is empty. Default "Add a name". */
  readonly placeholder = input('Add a name');
  /** The display's name after the value. Default "Edit" plus the label in lower case. */
  readonly editLabel = input<string | undefined>(undefined);
  /** The save button's name. Default "Save changes". Arabic: "حفظ التغييرات". */
  readonly saveLabel = input('Save changes');
  /** The cancel button's name. Default "Discard changes". Arabic: "إلغاء التغييرات". */
  readonly cancelLabel = input('Discard changes');
  /** Said once by a polite status after a save. Default "Saved". Arabic: "تم الحفظ". */
  readonly savedLabel = input('Saved');
  /** Height from size.control. Default md. */
  readonly size = input<InlineEditSize>('md');
  /** The display cannot start editing; it keeps aria-disabled and stays focusable. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks the value invalid from outside, for example after a server check. Pair it with error. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** A message from outside (a server check). Shown under the display or the editor and linked to both. */
  readonly error = input<InlineEditError | null | undefined>(undefined);

  /** Editing started (true) or ended (false). */
  readonly editingChange = output<boolean>();

  private readonly injector = inject(Injector);
  private readonly _consumed = consumeHostAttributes(ATTRIBUTES);
  private readonly inputRef = viewChild(DsInput);
  private readonly displayRef = viewChild('display', { read: ElementRef });
  private readonly formDisabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected readonly errorId = `ds-inline-edit-${++nextId}-error`;
  protected readonly editing = signal(false);
  protected readonly draft = signal('');
  private readonly ownError = signal<string | null>(null);
  protected readonly status = signal('');

  protected readonly current = computed(() => this.value() ?? '');
  protected readonly empty = computed(() => this.current() === '');
  protected readonly message = computed<InlineEditError | null>(() => {
    const own = this.ownError();
    if (own) return own;
    const outside = this.error();
    return outside === undefined || outside === null || outside === '' ? null : outside;
  });
  protected readonly isInvalid = computed(() => this.invalid() || this.message() !== null);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly name = computed(
    () => `${this.empty() ? this.placeholder() : this.current()}, ${this.editLabel() ?? `Edit ${this.label().toLowerCase()}`}`,
  );
  protected readonly describedBy = computed(() => (this.message() !== null ? this.errorId : undefined));
  protected readonly iconSize = computed(() => (this.size() === 'lg' ? 'sm' : 'xs'));

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = injectMotion();
  /** The glyph that leaves on the last change of state, kept for one morph. */
  private readonly leaving = signal<{ id: number; icon: MorphIcon } | null>(null);
  private morphs = 0;

  /** The leaving glyph as a list of zero or one, when it is one of `icons`, so each morph gets a new span. */
  protected leavingFrom(...icons: MorphIcon[]): { id: number; icon: MorphIcon }[] {
    const l = this.leaving();
    return l && icons.includes(l.icon) ? [l] : [];
  }

  private morphFrom(icon: MorphIcon): void {
    if (typeof this.host.animate !== 'function' || this.motion.mode(INLINE_EDIT_MORPH) === 'none') return;
    this.morphs += 1;
    this.leaving.set({ id: this.morphs, icon });
  }

  constructor() {
    // inline-edit-morph: plays on the glyphs just drawn, before the next paint.
    afterRenderEffect((onCleanup) => {
      const leaving = this.leaving();
      if (!leaving) return;
      untracked(() => {
        const root = this.host;
        const mode = this.motion.mode(INLINE_EDIT_MORPH);
        const anims: Animation[] = [];
        if (leaving.icon === 'edit') {
          const part = root.querySelector(':scope > [data-part="save"] > [data-part="icon"]');
          anims.push(...iconMorph({ from: part?.querySelector(':scope > span[aria-hidden="true"]'), to: part?.firstElementChild, turn: 90, mode }));
          anims.push(...iconParts([null, root.querySelector(':scope > [data-part="cancel"] > [data-part="icon"]')], { mode }));
        } else {
          const part = root.querySelector(':scope > [data-part="display"] > [data-part="end"]');
          anims.push(
            ...iconMorph({
              from: part?.querySelector(':scope > span[aria-hidden="true"]'),
              to: part?.firstElementChild,
              turn: leaving.icon === 'check' ? -90 : 90,
              mode,
            }),
          );
        }
        let live = true;
        onCleanup(() => (live = false));
        void Promise.all(anims.map((a) => settled(a))).then(() => {
          if (live) this.leaving.update((l) => (l?.id === leaving.id ? null : l));
        });
      });
    });
    // Escape cancels. Overlays listen for Escape on the document; a window
    // capture listener comes first, cancels and marks the key handled, so a
    // dialog around the editor stays open.
    if (typeof window !== 'undefined') {
      const listener = (event: KeyboardEvent) => {
        if (event.key !== 'Escape' || !this.editing() || event.target !== this.inputRef()?.nativeInput) return;
        if (event.isComposing || event.keyCode === 229 || event.defaultPrevented) return;
        event.preventDefault();
        event.stopPropagation();
        this.cancel();
      };
      window.addEventListener('keydown', listener, { capture: true });
      inject(DestroyRef).onDestroy(() => window.removeEventListener('keydown', listener, { capture: true }));
    }
  }

  /** A page that opens with an editor keeps its own focus: no focus move here. */
  ngOnInit(): void {
    if (this.defaultEditing()) {
      this.draft.set(this.current());
      this.editing.set(true);
    }
  }

  /** True while the editor is open. */
  get isEditing(): boolean {
    return this.editing();
  }

  protected isText(m: InlineEditError): m is string {
    return typeof m === 'string';
  }

  private setEditing(next: boolean, focus: 'input' | 'display' | 'none'): void {
    this.editing.set(next);
    this.editingChange.emit(next);
    if (focus === 'none') return;
    afterNextRender(
      () => {
        if (focus === 'input') {
          const el = this.inputRef()?.nativeInput;
          el?.focus();
          el?.select();
        } else {
          (this.displayRef()?.nativeElement as HTMLElement | undefined)?.focus();
        }
      },
      { injector: this.injector },
    );
  }

  /** Opens the editor with the current value, focused and selected. */
  start(): void {
    if (this.isDisabled()) return;
    this.draft.set(this.current());
    this.ownError.set(null);
    this.status.set('');
    this.morphFrom('edit');
    this.setEditing(true, 'input');
  }

  private check(next: string): string | null {
    return this.validate()?.(next) || null;
  }

  /** Saves the draft. Returns false and keeps editing when it is invalid. */
  save(focusBack: boolean): boolean {
    const draft = this.draft();
    const message = this.check(draft);
    if (message) {
      this.ownError.set(message);
      // Focus stays in the editor; the status reads the message once.
      this.status.set(message);
      return false;
    }
    if (draft !== this.current()) {
      this.value.set(draft);
      this.onChange(draft);
      this.status.set(this.savedLabel());
    }
    this.morphFrom('check');
    this.setEditing(false, focusBack ? 'display' : 'none');
    return true;
  }

  /** Drops the draft and returns focus to the display. */
  cancel(): void {
    this.ownError.set(null);
    this.morphFrom('close');
    this.setEditing(false, 'display');
  }

  protected onDraft(next: string): void {
    this.draft.set(next);
    // Once a message shows, it follows the value, so it goes away when fixed.
    if (this.ownError() !== null) this.ownError.set(this.check(next));
  }

  protected onInputKeyDown(event: KeyboardEvent): void {
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      this.save(true);
    }
  }

  /** Leaving the editor saves a valid value. Focus that moves to the save or cancel button stays inside. */
  protected onRootBlur(event: FocusEvent): void {
    this.onTouched();
    if (!this.editing()) return;
    // Opening the editor removes the focused display button, and the browser
    // fires focusout on it with no relatedTarget. That is not leaving the
    // editor: only a focusout from the editor's own parts may close it.
    const from = event.target as Element | null;
    if (!from || !from.isConnected || from.getAttribute('data-part') === 'display') return;
    const next = event.relatedTarget as Node | null;
    if (next && (event.currentTarget as Element).contains(next)) return;
    // Nothing changed: close without a check, so an empty new item never traps the editor.
    if (this.draft() === this.current()) {
      this.ownError.set(null);
      this.setEditing(false, 'none');
      return;
    }
    this.save(false);
  }

  writeValue(value: unknown): void {
    this.value.set(value === null || value === undefined ? '' : String(value));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
