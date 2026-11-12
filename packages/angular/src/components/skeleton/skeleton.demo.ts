// Skeleton demo: the same cases, ids and copy as
// packages/react/src/components/Skeleton/Skeleton.demo.tsx. Every group of
// skeletons sits in a container that carries aria-busy; a visually hidden
// status line next to it (outside it) says once what is loading.
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DEMO } from '../../demo/demo';
import { consumeHostAttributes } from '../../internal/host';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsSkeleton } from './skeleton';

const HIDDEN = 'position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap;';

/** The loading case: a button swaps the skeleton for the loaded content. The host is the case's grid. */
@Component({
  selector: 'div[data-skeleton-load-demo]',
  imports: [DEMO, DsButton, DsSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: grid; gap: var(--ds-space-m); max-inline-size: 24rem;' },
  template: `
    <div data-demo="row">
      <button dsButton size="sm" (click)="loading.set(!loading())">{{ loading() ? 'Show loaded profile' : 'Show loading profile' }}</button>
    </div>
    <span role="status" style="${HIDDEN}" data-demo="loading-status">{{ loading() ? 'Loading profile' : '' }}</span>
    <section [attr.aria-busy]="loading() ? 'true' : 'false'" aria-label="Profile">
      @if (loading()) {
        <div style="display: flex; gap: var(--ds-space-m); align-items: flex-start;">
          <span dsSkeleton variant="circle"></span>
          <div style="flex: 1 1 0%; min-inline-size: 0px;">
            <span dsSkeleton size="lg" width="60%"></span>
            <span dsSkeleton></span>
            <span dsSkeleton width="80%"></span>
          </div>
        </div>
      } @else {
        <p style="margin: 0px;">Sara Alqahtani, product designer. Joined in March 2024.</p>
      }
    </section>
  `,
})
export class SkeletonLoadDemo {
  protected readonly loading = signal(true);

  constructor() {
    consumeHostAttributes(['data-skeleton-load-demo']);
  }
}

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsSkeleton, DsTheme, NgTemplateOutlet, SkeletonLoadDemo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #card>
      <div style="display: flex; gap: var(--ds-space-m); align-items: flex-start;">
        <span dsSkeleton variant="circle"></span>
        <div style="flex: 1 1 0%; min-inline-size: 0px;">
          <span dsSkeleton size="lg" width="60%"></span>
          <span dsSkeleton></span>
          <span dsSkeleton width="80%"></span>
        </div>
      </div>
    </ng-template>

    <section data-demo="case" data-demo-case="variants" heading="Variants: text in three sizes, circle and rect">
      <div>
        <span role="status" style="${HIDDEN}" data-demo="loading-status">Loading variants</span>
        <div aria-busy="true" aria-label="Variants" role="group">
          <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));">
            <div>
              <span dsSkeleton size="sm"></span>
              <span dsSkeleton size="md"></span>
              <span dsSkeleton size="lg"></span>
            </div>
            <div data-demo="row">
              <span dsSkeleton variant="circle" [width]="24"></span>
              <span dsSkeleton variant="circle"></span>
              <span dsSkeleton variant="circle" [width]="48"></span>
            </div>
            <span dsSkeleton variant="rect" [height]="96"></span>
          </div>
        </div>
      </div>
      <h3 data-demo="title">Variants in Arabic</h3>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div>
          <span role="status" style="${HIDDEN}" data-demo="loading-status">جار تحميل البطاقة</span>
          <div aria-busy="true" aria-label="بطاقة" role="group">
            <div style="max-inline-size: 24rem;">
              <ng-container [ngTemplateOutlet]="card" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One: a single title line">
      <div>
        <span role="status" style="${HIDDEN}" data-demo="loading-status">Loading title</span>
        <div aria-busy="true" aria-label="Title" role="group">
          <div style="max-inline-size: 16rem;">
            <span dsSkeleton size="lg"></span>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many: a list of cards">
      <div>
        <span role="status" style="${HIDDEN}" data-demo="loading-status">Loading members</span>
        <div aria-busy="true" aria-label="Members" role="group">
          <div style="display: grid; gap: var(--ds-space-l); max-inline-size: 28rem;">
            <ng-container [ngTemplateOutlet]="card" />
            <ng-container [ngTemplateOutlet]="card" />
            <ng-container [ngTemplateOutlet]="card" />
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Too many: a grid of twelve tiles">
      <div>
        <span role="status" style="${HIDDEN}" data-demo="loading-status">Loading files</span>
        <div aria-busy="true" aria-label="Files" role="group">
          <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));">
            @for (i of twelve; track i) {
              <div>
                <span dsSkeleton variant="rect" [height]="72"></span>
                <span dsSkeleton size="sm" width="70%"></span>
              </div>
            }
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text: a paragraph of lines, the last one short">
      <div>
        <span role="status" style="${HIDDEN}" data-demo="loading-status">Loading article</span>
        <div aria-busy="true" aria-label="Article" role="group">
          <div style="max-inline-size: 28rem;">
            @for (i of six; track i) {
              <span dsSkeleton></span>
            }
            <span dsSkeleton width="30%"></span>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text: the shimmer runs toward the inline end">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div>
          <span role="status" style="${HIDDEN}" data-demo="loading-status">جار تحميل المقال</span>
          <div aria-busy="true" aria-label="مقال" role="group">
            <div style="max-inline-size: 28rem;">
              <span dsSkeleton size="lg" width="50%"></span>
              <span dsSkeleton></span>
              <span dsSkeleton></span>
              <span dsSkeleton></span>
              <span dsSkeleton width="40%"></span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Loading: the container carries aria-busy, then the content replaces the skeleton">
      <div data-skeleton-load-demo></div>
    </section>
  `,
})
export default class SkeletonDemo {
  protected readonly twelve = Array.from({ length: 12 }, (_, i) => i);
  protected readonly six = Array.from({ length: 6 }, (_, i) => i);
}
