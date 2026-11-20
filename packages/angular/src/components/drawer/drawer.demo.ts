// The Drawer demo: the same cases, ids, triggers and copy as
// packages/react/src/components/Drawer/Drawer.demo.tsx. React's FilterDrawer
// and ArabicDrawer render no element of their own, so here they are
// templates; the Arabic ones are declared inside the Arabic theme, because
// DI follows declaration and the portal copies the theme it is opened in.
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsField } from '../field/field';
import { DsInput } from '../input/input';
import { DS_DRAWER, type DrawerSide, type DrawerSize } from './drawer';

const sizes: DrawerSize[] = ['sm', 'md', 'lg', 'xl'];

const filterFields: [string, string][] = [
  ['Owner', 'Sara Ahmed'],
  ['Team', 'Design'],
  ['Tag', 'Launch'],
  ['Updated after', '1 March'],
  ['Updated before', '30 March'],
];

interface Filter {
  trigger: string;
  label: string;
  size?: DrawerSize;
  side?: DrawerSide;
  fields: [string, string][];
}

const filters = {
  start: { trigger: 'start', label: 'Open drawer at the start', side: 'start', fields: filterFields.slice(0, 2) },
  one: { trigger: 'one', label: 'Filter by owner', size: 'sm', fields: filterFields.slice(0, 1) },
  many: { trigger: 'many', label: 'Filter boards', fields: filterFields },
} satisfies Record<string, Filter>;

const bySize: Filter[] = sizes.map((size) => ({ trigger: size, label: `Open ${size} drawer`, size, fields: filterFields.slice(0, 2) }));

const notes = Array.from({ length: 16 }, (_, i) => i);

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DS_DRAWER, DsButton, DsField, DsInput, DsTheme, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Filters for the board list: the common drawer. -->
    <ng-template #filter let-f>
      <ng-container dsDrawer [size]="f.size ?? 'md'" [side]="f.side ?? 'end'">
        <button dsButton dsDrawerTrigger [attr.data-demo-trigger]="f.trigger">{{ f.label }}</button>
        <ng-template dsDrawerContent title="Filter boards" description="Only boards that match every filter show in the list.">
          <div dsDrawerBody>
            <div style="display: grid; gap: var(--ds-space-l)">
              @for (field of f.fields; track field[0]) {
                <div dsField [label]="field[0]"><div dsInput [value]="field[1]"></div></div>
              }
            </div>
          </div>
          <div dsDrawerFooter>
            <button dsButton dsDrawerClose>Discard changes</button>
            <button dsButton dsDrawerClose tone="accent" emphasis="solid">Apply filters</button>
          </div>
        </ng-template>
      </ng-container>
    </ng-template>

    <!-- Loading or failing content: the body shows the state, the drawer stays usable. -->
    <ng-template #stateDrawer let-state>
      <ng-container dsDrawer>
        <button dsButton dsDrawerTrigger [attr.data-demo-trigger]="state">{{ state === 'loading' ? 'Show activity' : 'Show activity offline' }}</button>
        <ng-template dsDrawerContent title="Board activity" description="Every change to Spring launch, newest first." [aria-busy]="state === 'loading'">
          <div dsDrawerBody>
            @if (state === 'loading') {
              <p role="status">Loading the activity of this board.</p>
            } @else {
              <p role="alert">{{ attempt() > 0 ? 'Still could not load the activity. Check your connection.' : 'Could not load the activity. Check your connection, then try again.' }}</p>
            }
          </div>
          @if (state === 'error') {
            <div dsDrawerFooter>
              <button dsButton tone="accent" emphasis="solid" (click)="attempt.set(attempt() + 1)">Load activity</button>
            </div>
          }
        </ng-template>
      </ng-container>
    </ng-template>

    <section data-demo="case" data-demo-case="variants" heading="Sizes sm to xl at the end, one at the start, and a non modal drawer">
      <div data-demo="row">
        @for (f of bySize; track f.trigger) {
          <ng-container [ngTemplateOutlet]="filter" [ngTemplateOutletContext]="{ $implicit: f }" />
        }
        <ng-container [ngTemplateOutlet]="filter" [ngTemplateOutletContext]="{ $implicit: filters.start }" />
        <!-- Details of one board, next to the page: non modal. -->
        <ng-container dsDrawer [modal]="false" size="sm">
          <button dsButton dsDrawerTrigger data-demo-trigger="non-modal">Show board details</button>
          <ng-template dsDrawerContent title="Spring launch" description="Owned by Sara Ahmed. Updated today.">
            <div dsDrawerBody>
              <p>12 frames, 34 comments, shared with the Design team.</p>
              <p>The page stays usable while this drawer is open.</p>
            </div>
          </ng-template>
        </ng-container>
      </div>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <ng-template #arabic let-a>
          <ng-container dsDrawer [side]="a.side ?? 'end'">
            <button dsButton dsDrawerTrigger [attr.data-demo-trigger]="a.trigger">فتح الفلاتر</button>
            <ng-template dsDrawerContent
              [title]="a.long ? 'فلترة اللوحات حسب المالك والفريق وتاريخ آخر تعديل' : 'فلترة اللوحات'"
              [description]="a.long ? sample.ar.long : 'تظهر بس اللوحات اللي تطابق كل الفلاتر.'">
              <div dsDrawerBody>
                <div style="display: grid; gap: var(--ds-space-l)">
                  <div dsField label="المالك"><div dsInput value="سارة أحمد"></div></div>
                  <div dsField label="الفريق"><div dsInput value="التصميم"></div></div>
                </div>
              </div>
              <div dsDrawerFooter>
                <button dsButton dsDrawerClose wrap>تجاهل التغييرات</button>
                <button dsButton dsDrawerClose wrap tone="accent" emphasis="solid">{{ a.long ? 'تطبيق الفلاتر على كل اللوحات' : 'تطبيق الفلاتر' }}</button>
              </div>
            </ng-template>
          </ng-container>
        </ng-template>
        <div data-demo="row" label="عربي، من النهاية">
          <ng-container [ngTemplateOutlet]="arabic" [ngTemplateOutletContext]="{ $implicit: arabicEnd }" />
        </div>
        <div data-demo="row" label="عربي، من البداية">
          <ng-container [ngTemplateOutlet]="arabic" [ngTemplateOutletContext]="{ $implicit: arabicStart }" />
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty: nothing to show yet">
      <div data-demo="row">
        <ng-container dsDrawer>
          <button dsButton dsDrawerTrigger data-demo-trigger="empty">Show comments</button>
          <ng-template dsDrawerContent title="Comments" description="Comments on Spring launch.">
            <div dsDrawerBody><p>No comments yet. Select a frame and press C to add one.</p></div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One field and one action">
      <div data-demo="row">
        <ng-container [ngTemplateOutlet]="filter" [ngTemplateOutletContext]="{ $implicit: filters.one }" />
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many fields: focus opens on the first one">
      <div data-demo="row">
        <ng-container [ngTemplateOutlet]="filter" [ngTemplateOutletContext]="{ $implicit: filters.many }" />
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Long content: the body scrolls, the header and the footer stay">
      <div data-demo="row">
        <ng-container dsDrawer size="lg">
          <button dsButton dsDrawerTrigger data-demo-trigger="too-many">Show release notes</button>
          <ng-template dsDrawerContent title="Release notes" description="What changed in the last 12 releases.">
            <div dsDrawerBody>
              @for (i of notes; track i) {
                <p>{{ sample.en.long }}</p>
              }
            </div>
            <div dsDrawerFooter><button dsButton dsDrawerClose>Close notes</button></div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long title, description and labels: they wrap">
      <div data-demo="row">
        <ng-container dsDrawer size="sm">
          <button dsButton dsDrawerTrigger data-demo-trigger="long-text">Filter by owner</button>
          <ng-template dsDrawerContent
            title="Filter the boards of the Northwind design and research archive by owner and team"
            [description]="sample.en.long">
            <div dsDrawerBody>
              <div dsField [label]="sample.en.word"><div dsInput [value]="sample.en.word"></div></div>
            </div>
            <div dsDrawerFooter>
              <button dsButton dsDrawerClose wrap>Clear every filter on this list</button>
              <button dsButton dsDrawerClose wrap tone="accent" emphasis="solid">Apply the filters to every board</button>
            </div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          <ng-container dsDrawer>
            <button dsButton dsDrawerTrigger data-demo-trigger="long-arabic">فتح الفلاتر</button>
            <ng-template dsDrawerContent title="فلترة اللوحات حسب المالك والفريق وتاريخ آخر تعديل" [description]="sample.ar.long">
              <div dsDrawerBody>
                <div style="display: grid; gap: var(--ds-space-l)">
                  <div dsField label="المالك"><div dsInput value="سارة أحمد"></div></div>
                  <div dsField label="الفريق"><div dsInput value="التصميم"></div></div>
                </div>
              </div>
              <div dsDrawerFooter>
                <button dsButton dsDrawerClose wrap>تجاهل التغييرات</button>
                <button dsButton dsDrawerClose wrap tone="accent" emphasis="solid">تطبيق الفلاتر على كل اللوحات</button>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Loading: the body says so and is marked busy">
      <div data-demo="row">
        <ng-container [ngTemplateOutlet]="stateDrawer" [ngTemplateOutletContext]="{ $implicit: 'loading' }" />
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Error: the body says what failed and offers a retry">
      <div data-demo="row">
        <ng-container [ngTemplateOutlet]="stateDrawer" [ngTemplateOutletContext]="{ $implicit: 'error' }" />
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Not dismissible while an action runs: the close control is disabled, Escape and the backdrop wait">
      <div data-demo="row">
        <!-- Apply runs for two seconds: nothing dismisses the drawer until it ends. -->
        <ng-container dsDrawer [(open)]="busyOpen" [dismissible]="!busy()">
          <button dsButton dsDrawerTrigger data-demo-trigger="disabled">Filter boards slowly</button>
          <ng-template dsDrawerContent title="Filter boards" description="Applying filters to 2,400 boards takes a moment.">
            <div dsDrawerBody>
              <div dsField label="Owner"><div dsInput value="Sara Ahmed" [disabled]="busy()"></div></div>
            </div>
            <div dsDrawerFooter>
              <button dsButton dsDrawerClose [disabled]="busy()">Discard changes</button>
              <button dsButton tone="accent" emphasis="solid" [loading]="busy()" loadingLabel="Applying filters" (click)="apply()">Apply filters</button>
            </div>
          </ng-template>
        </ng-container>
      </div>
    </section>
  `,
})
export default class DrawerDemo {
  protected readonly sample = sample;
  protected readonly bySize = bySize;
  protected readonly filters: Record<keyof typeof filters, Filter> = filters;
  protected readonly notes = notes;
  protected readonly arabicEnd = { trigger: 'arabic' };
  protected readonly arabicStart = { trigger: 'arabic-start', side: 'start' };
  protected readonly attempt = signal(0);
  protected readonly busyOpen = signal(false);
  protected readonly busy = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected apply(): void {
    this.busy.set(true);
    this.timer = setTimeout(() => {
      this.busy.set(false);
      this.busyOpen.set(false);
    }, 2000);
  }
}
