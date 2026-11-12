// The RadioGroup demo: the same cases, ids and copy as
// packages/react/src/components/RadioGroup/RadioGroup.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsRadioGroup, DsRadioGroupItem, type RadioGroupSize, type RadioGroupTone } from './radio-group';

const timeZones = [
  'Arabia Standard Time, Riyadh',
  'Gulf Standard Time, Dubai',
  'Eastern European Time, Cairo',
  'Central European Time, Berlin',
  'Greenwich Mean Time, London',
  'Eastern Time, New York',
  'Pacific Time, Los Angeles',
  'India Standard Time, Mumbai',
  'Singapore Time, Singapore',
  'Japan Standard Time, Tokyo',
  'Australian Eastern Time, Sydney',
  'Coordinated Universal Time',
];

@Component({
  selector: 'ds-radio-group-demo',
  imports: [DEMO, DsTheme, DsRadioGroup, DsRadioGroupItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-demo="page">
      <section data-demo="case" data-demo-case="variants" heading="Sizes, tones and orientations">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(14rem, 100%), 1fr));">
          @for (tone of tones; track tone) {
            @for (size of sizes; track size) {
              <div dsRadioGroup [label]="'Board view, ' + size + ', ' + tone" [size]="size" [tone]="tone" defaultValue="grid">
                <div dsRadioGroupItem value="grid" label="Grid"></div>
                <div dsRadioGroupItem value="list" label="List"></div>
              </div>
            }
          }
        </div>
        <div dsRadioGroup label="Sort comments by" orientation="horizontal" defaultValue="recent" tone="accent">
          <div dsRadioGroupItem value="recent" label="Most recent"></div>
          <div dsRadioGroupItem value="oldest" label="Oldest first"></div>
          <div dsRadioGroupItem value="unresolved" label="Unresolved first"></div>
        </div>
        <div dsRadioGroup label="Export format" description="Pick the file type you share with your team." defaultValue="png" required>
          <div dsRadioGroupItem value="png" label="PNG" description="Best for images with sharp edges."></div>
          <div dsRadioGroupItem value="pdf" label="PDF" description="Keeps text selectable and prints well."></div>
        </div>
        <div dsTheme lang="ar">
          <div dsRadioGroup label="عرض اللوحة" defaultValue="grid" orientation="horizontal">
            <div dsRadioGroupItem value="grid" label="شبكة"></div>
            <div dsRadioGroupItem value="list" label="قائمة"></div>
            <div dsRadioGroupItem value="board" label="أعمدة"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="empty" heading="No option checked yet">
        <div dsRadioGroup label="Plan">
          <div dsRadioGroupItem value="free" label="Free"></div>
          <div dsRadioGroupItem value="team" label="Team"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="A group with a description">
        <div dsRadioGroup label="Who can comment" description="You can change this later in board settings." defaultValue="team">
          <div dsRadioGroupItem value="team" label="People in your team"></div>
          <div dsRadioGroupItem value="anyone" label="Anyone with the link"></div>
          <div dsRadioGroupItem value="none" label="No one"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Five options">
        <div dsRadioGroup label="Notify me about" defaultValue="mentions" tone="accent">
          <div dsRadioGroupItem value="all" label="All activity"></div>
          <div dsRadioGroupItem value="mentions" label="Mentions and replies"></div>
          <div dsRadioGroupItem value="replies" label="Replies only"></div>
          <div dsRadioGroupItem value="digest" label="A daily digest"></div>
          <div dsRadioGroupItem value="none" label="Nothing"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Twelve options: use a Select instead">
        <div style="max-inline-size: var(--ds-dialog-width-sm);">
          <div dsRadioGroup label="Time zone" size="sm" [defaultValue]="timeZones[0]">
            @for (zone of timeZones; track zone) {
              <div dsRadioGroupItem [value]="zone" [label]="zone"></div>
            }
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long labels and descriptions">
        <div style="max-inline-size: var(--ds-dialog-width-sm);">
          <div dsRadioGroup
            label="When someone outside your workspace opens a shared link to this board"
            [description]="sample.en.long"
            defaultValue="ask">
            <div dsRadioGroupItem
              value="ask"
              label="Ask an owner to approve every person before they can see the board"
              [description]="sample.en.long"></div>
            <div dsRadioGroupItem value="word" [label]="sample.en.word"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
        <div dsTheme lang="ar" data-demo="content">
          <div style="max-inline-size: var(--ds-dialog-width-sm);">
            <div dsRadioGroup label="صلاحية التعليق" [description]="sample.ar.long" defaultValue="team" required>
              <div dsRadioGroupItem value="team" label="أعضاء الفريق" description="يقدرون يعلقون ويردون على التعليقات."></div>
              <div dsRadioGroupItem value="anyone" label="أي شخص عنده الرابط" [description]="sample.ar.long"></div>
              <div dsRadioGroupItem value="none" label="محد"></div>
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="error" heading="Invalid with a message">
        <div dsRadioGroup label="Billing period" required error="Pick a billing period, so we can show the price.">
          <div dsRadioGroupItem value="monthly" label="Monthly"></div>
          <div dsRadioGroupItem value="yearly" label="Yearly" description="Two months free."></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled group and one disabled option">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(14rem, 100%), 1fr));">
          <div dsRadioGroup label="Workspace role" disabled defaultValue="editor" description="Only owners can change roles.">
            <div dsRadioGroupItem value="viewer" label="Viewer"></div>
            <div dsRadioGroupItem value="editor" label="Editor"></div>
          </div>
          <div dsRadioGroup label="Storage region" defaultValue="me">
            <div dsRadioGroupItem value="me" label="Middle East"></div>
            <div dsRadioGroupItem value="eu" label="Europe"></div>
            <div dsRadioGroupItem value="us" label="United States" disabled description="Not on your plan."></div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class RadioGroupDemo {
  protected readonly sizes: RadioGroupSize[] = ['sm', 'md', 'lg'];
  protected readonly tones: RadioGroupTone[] = ['neutral', 'accent'];
  protected readonly timeZones = timeZones;
  protected readonly sample = sample;
}
