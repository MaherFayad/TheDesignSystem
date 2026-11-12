// The RadioCard demo: the same cases, ids and copy as
// packages/react/src/components/RadioCard/RadioCard.demo.tsx. React's Group
// helper (a grid with a heading that names the group) is written out here.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsRadioCard, DsRadioCardItem, type RadioCardSize, type RadioCardTone } from './radio-card';

const plans = Array.from({ length: 12 }, (_, i) => ({ value: `seat-${i + 1}`, title: `${(i + 1) * 5} seats`, price: `$${(i + 1) * 40} a month` }));


@Component({
  selector: 'ds-radio-card-demo',
  imports: [DEMO, DsTheme, DsRadioCard, DsRadioCardItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-demo="page">
      <section data-demo="case" data-demo-case="variants" heading="Sizes, tones, icons and end content">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));">
          @for (tone of tones; track tone) {
            @for (size of sizes; track size) {
              <div style="display: grid; align-content: start; gap: var(--ds-space-xs);">
                <p data-demo="label" [id]="'rc-plan-' + tone + '-' + size">{{ 'Plan, ' + size + ', ' + tone }}</p>
                <div dsRadioCard [attr.aria-labelledby]="'rc-plan-' + tone + '-' + size" [size]="size" [tone]="tone" defaultValue="team">
                  <button dsRadioCardItem value="free" title="Free" description="Up to 3 boards." end="$0"></button>
                  <button dsRadioCardItem value="team" title="Team" description="Unlimited boards and comments." end="$12" icon="user"></button>
                </div>
              </div>
            }
          }
        </div>
        <div style="display: grid; align-content: start; gap: var(--ds-space-xs);">
          <p data-demo="label" id="rc-shipping">Shipping</p>
          <div dsRadioCard aria-labelledby="rc-shipping" orientation="horizontal" defaultValue="standard" tone="accent">
            <button dsRadioCardItem value="standard" title="Standard" description="Arrives in 4 to 6 days." end="Free" icon="clock"></button>
            <button dsRadioCardItem value="express" title="Express" description="Arrives in 1 to 2 days." end="$15" icon="send"></button>
            <button dsRadioCardItem value="pickup" title="Store pickup" description="Ready tomorrow." end="Free" icon="home"></button>
          </div>
        </div>
        <div dsTheme lang="ar">
          <div style="display: grid; align-content: start; gap: var(--ds-space-xs);">
            <p data-demo="label" id="rc-plan-ar">الباقة</p>
            <div dsRadioCard aria-labelledby="rc-plan-ar" orientation="horizontal" defaultValue="team">
              <button dsRadioCardItem value="free" title="مجانية" description="حتى 3 لوحات." end="0 ر.س"></button>
              <button dsRadioCardItem value="team" title="الفريق" description="لوحات وتعليقات بلا حد." end="45 ر.س" icon="user"></button>
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="empty" heading="No card checked yet">
        <div style="display: grid; align-content: start; gap: var(--ds-space-xs);">
          <p data-demo="label" id="rc-empty">Plan</p>
          <div dsRadioCard aria-labelledby="rc-empty">
            <button dsRadioCardItem value="free" title="Free" description="Up to 3 boards."></button>
            <button dsRadioCardItem value="team" title="Team" description="Unlimited boards."></button>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="Title only">
        <div style="display: grid; align-content: start; gap: var(--ds-space-xs);">
          <p data-demo="label" id="rc-template">Board template</p>
          <div dsRadioCard aria-labelledby="rc-template" defaultValue="blank" orientation="horizontal">
            <button dsRadioCardItem value="blank" title="Blank board" icon="file"></button>
            <button dsRadioCardItem value="grid" title="Moodboard grid" icon="grid"></button>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Four plans">
        <div style="display: grid; align-content: start; gap: var(--ds-space-xs);">
          <p data-demo="label" id="rc-many">Plan</p>
          <div dsRadioCard aria-labelledby="rc-many" defaultValue="team" tone="accent">
            <button dsRadioCardItem value="free" title="Free" description="Up to 3 boards and 2 people." end="$0"></button>
            <button dsRadioCardItem value="pro" title="Pro" description="Unlimited boards for one person." end="$8 a month"></button>
            <button dsRadioCardItem value="team" title="Team" description="Shared boards, comments and roles." end="$12 a seat"></button>
            <button dsRadioCardItem value="enterprise" title="Enterprise" description="Single sign on and audit logs." end="Talk to sales"></button>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Twelve cards: use a Select instead">
        <div style="display: grid; align-content: start; gap: var(--ds-space-xs);">
          <p data-demo="label" id="rc-seats">Seats</p>
          <div dsRadioCard aria-labelledby="rc-seats" size="sm" orientation="horizontal" defaultValue="seat-1">
            @for (p of plans; track p.value) {
              <button dsRadioCardItem [value]="p.value" [title]="p.title" [end]="p.price"></button>
            }
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long title, text and end content">
        <div style="max-inline-size: var(--ds-dialog-width-sm);">
          <div style="display: grid; align-content: start; gap: var(--ds-space-xs);">
            <p data-demo="label" id="rc-delivery">Delivery</p>
            <div dsRadioCard aria-labelledby="rc-delivery" defaultValue="long">
              <button dsRadioCardItem
                value="long"
                title="Scheduled delivery to the front desk of your office building"
                [description]="sample.en.long"
                end="$4 for each delivery after the first"
                icon="calendar"></button>
              <button dsRadioCardItem value="word" [title]="sample.en.word" [description]="sample.en.word" [end]="sample.en.word"></button>
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
        <div dsTheme lang="ar" data-demo="content">
          <div style="max-inline-size: var(--ds-dialog-width-sm);">
            <div style="display: grid; align-content: start; gap: var(--ds-space-xs);">
              <p data-demo="label" id="rc-delivery-ar">طريقة التوصيل</p>
              <div dsRadioCard aria-labelledby="rc-delivery-ar" defaultValue="office">
                <button dsRadioCardItem value="office" title="التوصيل لمكتب الاستقبال في المبنى" [description]="sample.ar.long" end="15 ر.س" icon="calendar"></button>
                <button dsRadioCardItem value="pickup" title="الاستلام من الفرع" description="جاهز بكرة بعد الساعة 4 العصر." end="مجاني" icon="home"></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="error" heading="Invalid with a message">
        <div style="display: grid; align-content: start; gap: var(--ds-space-xs);">
          <p data-demo="label" id="rc-billing">Billing period</p>
          <div dsRadioCard aria-labelledby="rc-billing" aria-describedby="rc-billing-error" invalid required orientation="horizontal">
            <button dsRadioCardItem value="monthly" title="Monthly" end="$12"></button>
            <button dsRadioCardItem value="yearly" title="Yearly" description="Two months free." end="$120"></button>
          </div>
          <p id="rc-billing-error" style="margin: 0px; color: var(--ds-color-state-danger-text); font-size: var(--ds-font-size-s);">
            Pick a billing period, so we can show the price.
          </p>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled group and one disabled card">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));">
          <div style="display: grid; align-content: start; gap: var(--ds-space-xs);">
            <p data-demo="label" id="rc-disabled">Plan</p>
            <div dsRadioCard aria-labelledby="rc-disabled" disabled defaultValue="team">
              <button dsRadioCardItem value="free" title="Free" description="Up to 3 boards."></button>
              <button dsRadioCardItem value="team" title="Team" description="Only owners can change the plan."></button>
            </div>
          </div>
          <div style="display: grid; align-content: start; gap: var(--ds-space-xs);">
            <p data-demo="label" id="rc-region">Storage region</p>
            <div dsRadioCard aria-labelledby="rc-region" defaultValue="me">
              <button dsRadioCardItem value="me" title="Middle East" description="Riyadh and Dammam."></button>
              <button dsRadioCardItem value="us" title="United States" description="Not on your plan." disabled></button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class RadioCardDemo {
  protected readonly sizes: RadioCardSize[] = ['sm', 'md', 'lg'];
  protected readonly tones: RadioCardTone[] = ['neutral', 'accent'];
  protected readonly plans = plans;
  protected readonly sample = sample;
}
