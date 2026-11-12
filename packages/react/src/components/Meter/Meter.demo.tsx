import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { Theme } from '../../theme';
import { Meter } from './index';
import type { MeterSize } from './index';

const sizes: MeterSize[] = ['sm', 'md', 'lg'];

/** Storage: low use is best. Thresholds at 60 and 85 GB of 100. */
const storage = { max: 100, low: 60, high: 85, optimum: 0 };
const gb = (v: number, _min: number, max: number) => `${v} GB of ${max} GB`;
const gbAr = (v: number, _min: number, max: number) => `${v} من ${max} جيجابايت`;

/** A score: high is best. */
const score = { max: 10, low: 4, high: 7, optimum: 10 };
const outOf10 = (v: number) => `${v} of 10`;
const scoreLevels = { low: 'Low', medium: 'Medium', high: 'High' };

const storageLevels = {
  low: 'Plenty of room',
  medium: 'Filling up',
  high: 'Almost full',
};
const storageLevelsAr = {
  low: 'المساحة كافية',
  medium: 'المساحة تقل',
  high: 'المساحة قربت تخلص',
};

const members = [
  ['Design team', 34],
  ['Marketing', 71],
  ['Research', 52],
  ['Engineering', 93],
  ['Support', 12],
] as const;

export default function MeterDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: the tone follows the thresholds, the level is in words">
        <DemoGrid min="20rem">
          <Meter value={32} {...storage} valueText={gb} levelLabels={storageLevels} label="Storage used" />
          <Meter value={72} {...storage} valueText={gb} levelLabels={storageLevels} label="Storage used" />
          <Meter value={94} {...storage} valueText={gb} levelLabels={storageLevels} label="Storage used" />
        </DemoGrid>
        <DemoGrid min="20rem">
          <Meter value={9} {...score} valueText={outOf10} levelLabels={scoreLevels} label="Accessibility score" />
          <Meter value={5} {...score} valueText={outOf10} levelLabels={scoreLevels} label="Accessibility score" />
          <Meter value={2} {...score} valueText={outOf10} levelLabels={scoreLevels} label="Accessibility score" />
        </DemoGrid>
        <DemoGrid min="20rem">
          {sizes.map((size) => (
            <Meter key={size} size={size} value={46} label={`Size ${size}, no thresholds`} />
          ))}
        </DemoGrid>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <DemoGrid min="20rem">
            <Meter value={32} {...storage} valueText={gbAr} levelLabels={storageLevelsAr} label="المساحة المستخدمة" />
            <Meter value={72} {...storage} valueText={gbAr} levelLabels={storageLevelsAr} label="المساحة المستخدمة" />
            <Meter value={94} {...storage} valueText={gbAr} levelLabels={storageLevelsAr} label="المساحة المستخدمة" />
            <Meter
              value={9}
              {...score}
              valueText={(v) => `${v} من 10`}
              levelLabels={{ low: 'منخفض', medium: 'متوسط', high: 'مرتفع' }}
              label="تقييم سهولة الوصول"
            />
            <Meter value={46} label="نسبة الاستخدام" />
          </DemoGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty: the value is at the minimum">
        <Meter value={0} {...storage} valueText={gb} levelLabels={storageLevels} label="Storage used" />
      </DemoCase>

      <DemoCase id="one" title="One meter">
        <Meter value={72} {...storage} valueText={gb} levelLabels={storageLevels} label="Storage used" />
      </DemoCase>

      <DemoCase id="many" title="Many meters, one per team">
        <DemoGrid min="20rem">
          {members.map(([name, value]) => (
            <Meter
              key={name}
              size="sm"
              value={value}
              {...storage}
              valueText={gb}
              levelLabels={storageLevels}
              label={name}
            />
          ))}
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-text" title="Long text in the label">
        <Meter value={58} {...storage} valueText={gb} levelLabels={storageLevels} label={sample.en.long} />
        <Meter value={21} label={sample.en.word} size="sm" />
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Meter value={58} {...storage} valueText={gbAr} levelLabels={storageLevelsAr} label={sample.ar.long} />
        <Meter
          value={88}
          {...storage}
          valueText={gbAr}
          levelLabels={storageLevelsAr}
          label="المساحة المستخدمة في حساب الفريق لكل اللوحات والملفات"
          size="lg"
        />
      </DemoCase>

      <DemoCase id="error" title="Error: the value is in the worst region">
        <Meter value={99} {...storage} valueText={gb} levelLabels={{ high: 'Full' }} label="Storage used" />
        <p>Storage is full. Delete files or add storage to keep uploading.</p>
        <Theme lang="ar" data-demo="content">
          <Meter value={99} {...storage} valueText={gbAr} levelLabels={{ high: 'ممتلئة' }} label="المساحة المستخدمة" />
          <p>المساحة ممتلئة. احذف بعض الملفات أو زود المساحة عشان تكمل الرفع.</p>
        </Theme>
      </DemoCase>
    </DemoPage>
  );
}
