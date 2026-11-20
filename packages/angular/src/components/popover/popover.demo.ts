// The Popover demo: the same cases, ids, triggers and copy as
// packages/react/src/components/Popover/Popover.demo.tsx. React's
// RenamePopover and DetailsPopover render no element of their own, so here
// they are templates; the Arabic ones are declared inside the Arabic theme,
// because DI follows declaration and the portal copies the theme it is
// opened in.
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsField } from '../field/field';
import { DsIconButton } from '../icon-button/icon-button';
import { DsInput } from '../input/input';
import { DS_POPOVER, type PopoverSide, type PopoverSize } from './popover';

const sizeNames: Record<PopoverSize, string> = { sm: 'small', md: 'medium', lg: 'large' };
const bySize = (['sm', 'md', 'lg'] as const).map((size) => ({ size, side: 'bottom' as PopoverSide, trigger: `Open ${sizeNames[size]} popover` }));
const bySide = (['top', 'bottom', 'start', 'end'] as const).map((side) => ({ size: 'md' as PopoverSize, side, trigger: `Open popover on ${side}` }));
const folders = [1, 2, 3].flatMap((round) => sample.en.items.map((item) => `${item} ${round}`));

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DS_POPOVER, DsButton, DsField, DsIconButton, DsInput, DsTheme, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- A small rename form: title, one field, two actions. Focus opens on the field. -->
    <ng-template #rename let-r>
      <ng-container dsPopover [size]="r.size">
        <button dsButton dsPopoverTrigger [attr.data-demo-trigger]="r.trigger">{{ r.trigger }}</button>
        <ng-template dsPopoverContent [side]="r.side" title="Rename layer">
          <div dsPopoverBody><div dsField label="Layer name"><div dsInput value="Hero image"></div></div></div>
          <div dsPopoverFooter>
            <button dsButton dsPopoverClose size="sm">Cancel rename</button>
            <button dsButton dsPopoverClose size="sm" tone="accent" emphasis="solid">Rename layer</button>
          </div>
        </ng-template>
      </ng-container>
    </ng-template>

    <!-- Details only: a title and text, no actions. Focus opens on the root. -->
    <ng-template #details let-d>
      <ng-container dsPopover [size]="d.size ?? 'md'">
        <button dsButton dsPopoverTrigger [attr.data-demo-trigger]="d.trigger">{{ d.trigger }}</button>
        <ng-template dsPopoverContent [title]="d.title" [aria-label]="d.title ? undefined : d.trigger">
          <div dsPopoverBody><p>{{ d.text }}</p></div>
        </ng-template>
      </ng-container>
    </ng-template>

    <section data-demo="case" data-demo-case="variants" heading="Sizes sm, md and lg; sides top, bottom, start and end (start and end follow the reading direction)">
      <div data-demo="row" label="Size">
        @for (r of bySize; track r.trigger) {
          <ng-container [ngTemplateOutlet]="rename" [ngTemplateOutletContext]="{ $implicit: r }" />
        }
      </div>
      <div data-demo="row" label="Side">
        @for (r of bySide; track r.trigger) {
          <ng-container [ngTemplateOutlet]="rename" [ngTemplateOutletContext]="{ $implicit: r }" />
        }
        <ng-container dsPopover size="sm">
          <button dsIconButton dsPopoverTrigger icon="more" label="Show layer options" data-demo-trigger="icon"></button>
          <ng-template dsPopoverContent [arrow]="false" aria-label="Layer options">
            <div dsPopoverBody><p>No arrow, opened from an IconButton.</p></div>
          </ng-template>
        </ng-container>
      </div>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row" label="عربي">
          <ng-container dsPopover>
            <button dsButton dsPopoverTrigger data-demo-trigger="ar">إعادة التسمية</button>
            <ng-template dsPopoverContent side="end" title="تسمية الطبقة">
              <div dsPopoverBody><div dsField label="اسم الطبقة"><div dsInput value="صورة الغلاف"></div></div></div>
              <div dsPopoverFooter>
                <button dsButton dsPopoverClose size="sm">إلغاء التسمية</button>
                <button dsButton dsPopoverClose size="sm" tone="accent" emphasis="solid">حفظ الاسم</button>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Nothing to show yet: the body says what to do next">
      <div data-demo="row">
        <ng-container [ngTemplateOutlet]="details"
          [ngTemplateOutletContext]="{ $implicit: { trigger: 'Show comments', title: 'Comments', text: 'No comments on this layer yet. Select text on the canvas and press C to add one.' } }" />
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One line of details, no title: the popover is named by aria-label">
      <div data-demo="row">
        <ng-container [ngTemplateOutlet]="details" [ngTemplateOutletContext]="{ $implicit: { trigger: 'Show last edit', text: 'Edited by Sara Ahmed 5 minutes ago.', size: 'sm' } }" />
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="A short form: focus opens on the first field">
      <div data-demo="row">
        <ng-container dsPopover>
          <button dsButton dsPopoverTrigger data-demo-trigger="many">Set size</button>
          <ng-template dsPopoverContent title="Frame size">
            <div dsPopoverBody>
              <div dsField label="Width"><div dsInput value="1440" end="px"></div></div>
              <div dsField label="Height"><div dsInput value="900" end="px"></div></div>
            </div>
            <div dsPopoverFooter><button dsButton dsPopoverClose size="sm" tone="accent" emphasis="solid">Apply size</button></div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Long content: the body scrolls inside the room left in the viewport">
      <div data-demo="row">
        <ng-container dsPopover>
          <button dsButton dsPopoverTrigger data-demo-trigger="too-many">Show folders</button>
          <ng-template dsPopoverContent title="Folders">
            <div dsPopoverBody tabindex="0" aria-label="Folder list">
              <ul>
                @for (f of folders; track f) {
                  <li>{{ f }}</li>
                }
              </ul>
            </div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long title and a long unbroken word: they wrap">
      <div data-demo="row">
        <ng-container [ngTemplateOutlet]="details"
          [ngTemplateOutletContext]="{ $implicit: { trigger: 'Show long details', title: 'Brand guidelines for the spring launch campaign across every channel', text: sample.en.long + ' ' + sample.en.word } }" />
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          <ng-container dsPopover>
            <button dsButton dsPopoverTrigger data-demo-trigger="تفاصيل الملف">تفاصيل الملف</button>
            <ng-template dsPopoverContent title="إرشادات الهوية لحملة إطلاق الربيع في كل القنوات">
              <div dsPopoverBody><p>{{ sample.ar.long }}</p></div>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Loading: the action runs and the popover stays open until it ends">
      <div data-demo="row">
        <ng-container dsPopover [open]="loadingOpen()" (openChange)="!saving() && loadingOpen.set($event)">
          <button dsButton dsPopoverTrigger data-demo-trigger="loading">Set link</button>
          <ng-template dsPopoverContent title="Link to a page" [close]="!saving()">
            <div dsPopoverBody><div dsField label="Address"><div dsInput value="northwind.example.com/spring" [readOnly]="saving()"></div></div></div>
            <div dsPopoverFooter>
              <button dsButton size="sm" tone="accent" emphasis="solid" [loading]="saving()" loadingLabel="Saving link" (click)="save()">Save link</button>
            </div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Error: the message shows on the field">
      <div data-demo="row">
        <ng-container dsPopover>
          <button dsButton dsPopoverTrigger data-demo-trigger="error">Edit link</button>
          <ng-template dsPopoverContent title="Link to a page">
            <div dsPopoverBody>
              <div dsField label="Address" [error]="linkError() ?? undefined" [invalid]="linkError() !== null">
                <div dsInput [value]="link()" (valueChange)="link.set($event ?? '')"></div>
              </div>
            </div>
            <div dsPopoverFooter>
              <button dsButton size="sm" tone="accent" emphasis="solid" (click)="checkLink()">Save link</button>
            </div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled trigger: it stays focusable and does not open">
      <div data-demo="row">
        <ng-container dsPopover>
          <button dsButton dsPopoverTrigger disabled>Rename layer</button>
          <ng-template dsPopoverContent title="Rename layer"><div dsPopoverBody><p>Never shown.</p></div></ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="readonly" heading="Read only details">
      <div data-demo="row">
        <ng-container dsPopover>
          <button dsButton dsPopoverTrigger data-demo-trigger="readonly">Show file details</button>
          <ng-template dsPopoverContent title="File details">
            <div dsPopoverBody><div dsField label="Owner" readOnly><div dsInput value="Sara Ahmed" readOnly></div></div></div>
          </ng-template>
        </ng-container>
      </div>
    </section>
  `,
})
export default class PopoverDemo {
  protected readonly bySize = bySize;
  protected readonly bySide = bySide;
  protected readonly folders = folders;
  protected readonly sample = sample;
  protected readonly loadingOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly link = signal('northwind');
  protected readonly linkError = signal<string | null>('Enter an address that starts with https://');
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  /** Saves after a short wait: the primary action shows loading and the popover stays open until it ends. */
  protected save(): void {
    this.saving.set(true);
    this.timer = setTimeout(() => {
      this.saving.set(false);
      this.loadingOpen.set(false);
    }, 2000);
  }

  protected checkLink(): void {
    this.linkError.set(this.link().startsWith('https://') ? null : 'Enter an address that starts with https://');
  }
}
