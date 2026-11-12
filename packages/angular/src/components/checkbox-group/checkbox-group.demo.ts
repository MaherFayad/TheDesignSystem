// The CheckboxGroup demo: the same cases, ids and copy as
// packages/react/src/components/CheckboxGroup/CheckboxGroup.demo.tsx.
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsCheckbox } from '../checkbox/checkbox';
import { DsCheckboxGroup, type CheckboxGroupSize } from './checkbox-group';

const channels = [
  ['email', 'Email'],
  ['push', 'Push notifications'],
  ['sms', 'Text messages'],
] as const;

const channelsAr = [
  ['email', 'البريد'],
  ['push', 'الإشعارات'],
  ['sms', 'الرسائل النصية'],
] as const;

const regions = [
  'Riyadh',
  'Makkah',
  'Eastern Province',
  'Madinah',
  'Qassim',
  'Asir',
  'Tabuk',
  'Hail',
  'Northern Borders',
  'Jazan',
  'Najran',
  'Al Bahah',
  'Al Jawf',
];

@Component({
  selector: 'ds-checkbox-group-demo',
  imports: [DEMO, DsTheme, DsCheckbox, DsCheckboxGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-demo="page">
      <section data-demo="case" data-demo-case="variants" heading="Sizes, orientations and select all">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
          @for (size of sizes; track size) {
            <fieldset dsCheckboxGroup [legend]="'Channels, ' + size" [size]="size" [defaultValue]="['email']">
              @for (c of channels; track c[0]) {
                <div dsCheckbox [value]="c[0]" [label]="c[1]"></div>
              }
            </fieldset>
          }
          <fieldset dsCheckboxGroup legend="Channels, horizontal" orientation="horizontal" [defaultValue]="['push']">
            @for (c of channels; track c[0]) {
              <div dsCheckbox [value]="c[0]" [label]="c[1]"></div>
            }
          </fieldset>
          <fieldset dsCheckboxGroup legend="Channels, select all" selectAll="All channels" [defaultValue]="['email']">
            @for (c of channels; track c[0]) {
              <div dsCheckbox [value]="c[0]" [label]="c[1]"></div>
            }
          </fieldset>
          <div dsTheme lang="ar">
            <fieldset dsCheckboxGroup legend="قنوات التنبيه" selectAll="كل القنوات" [defaultValue]="['email', 'sms']">
              @for (c of channelsAr; track c[0]) {
                <div dsCheckbox [value]="c[0]" [label]="c[1]"></div>
              }
            </fieldset>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="empty" heading="Nothing checked">
        <fieldset dsCheckboxGroup legend="Channels" description="Pick at least one way to reach you.">
          @for (c of channels; track c[0]) {
            <div dsCheckbox [value]="c[0]" [label]="c[1]"></div>
          }
        </fieldset>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One item">
        <fieldset dsCheckboxGroup legend="Terms" [defaultValue]="['terms']">
          <div dsCheckbox value="terms" label="I agree to the terms of use"></div>
        </fieldset>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Controlled, with select all">
        <fieldset dsCheckboxGroup legend="Notify me about" [description]="pickedText()" [(value)]="picked" selectAll="All notifications">
          <div dsCheckbox value="comments" label="Comments"></div>
          <div dsCheckbox value="mentions" label="Mentions"></div>
          <div dsCheckbox value="shares" label="Shared boards"></div>
        </fieldset>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="A long list that wraps">
        <fieldset dsCheckboxGroup legend="Regions" orientation="horizontal" size="sm" selectAll="All regions" [defaultValue]="['Riyadh', 'Asir']">
          @for (region of regions; track region) {
            <div dsCheckbox [value]="region" [label]="region"></div>
          }
        </fieldset>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long legend, description and items">
        <div style="max-inline-size: var(--ds-dialog-width-sm);">
          <fieldset dsCheckboxGroup
            legend="Which of these should we send to every person on the board, including guests who joined from a shared link"
            [description]="sample.en.long"
            error="Pick at least one, so people hear about changes.">
            <div dsCheckbox value="a" [label]="sample.en.long"></div>
            <div dsCheckbox value="b" [label]="sample.en.word"></div>
          </fieldset>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
        <div dsTheme lang="ar" data-demo="content">
          <div style="max-inline-size: var(--ds-dialog-width-sm);">
            <fieldset dsCheckboxGroup
              legend="وش تبي نرسل لكل أعضاء اللوحة، حتى الضيوف اللي دخلوا من رابط مشاركة"
              [description]="sample.ar.long"
              error="اختار وحدة على الأقل، عشان يوصلهم خبر التغييرات."
              selectAll="كل التنبيهات"
              [defaultValue]="['b']">
              <div dsCheckbox value="a" label="التعليقات والإشارات في الملفات المشتركة"></div>
              <div dsCheckbox value="b" [label]="sample.ar.word"></div>
            </fieldset>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="error" heading="Invalid with a message">
        <fieldset dsCheckboxGroup legend="Channels" error="Pick at least one way to reach you.">
          @for (c of channels; track c[0]) {
            <div dsCheckbox [value]="c[0]" [label]="c[1]"></div>
          }
        </fieldset>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <fieldset dsCheckboxGroup legend="Channels" disabled description="Only owners can change this." [defaultValue]="['email']">
          @for (c of channels; track c[0]) {
            <div dsCheckbox [value]="c[0]" [label]="c[1]"></div>
          }
        </fieldset>
      </section>

      <section data-demo="case" data-demo-case="readonly" heading="Read only">
        <fieldset dsCheckboxGroup legend="Channels" readOnly description="Set by your workspace." [defaultValue]="['email', 'push']">
          @for (c of channels; track c[0]) {
            <div dsCheckbox [value]="c[0]" [label]="c[1]"></div>
          }
        </fieldset>
      </section>
    </div>
  `,
})
export default class CheckboxGroupDemo {
  protected readonly sizes: CheckboxGroupSize[] = ['sm', 'md', 'lg'];
  protected readonly channels = channels;
  protected readonly channelsAr = channelsAr;
  protected readonly regions = regions;
  protected readonly sample = sample;
  protected readonly picked = signal<readonly string[] | undefined>(['comments']);
  protected readonly pickedText = computed(() => {
    const n = this.picked()?.length ?? 0;
    return n === 0 ? 'Nothing picked. You get no notifications.' : `${n} picked.`;
  });
}
