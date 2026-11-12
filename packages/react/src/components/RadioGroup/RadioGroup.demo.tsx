import { Theme } from '../../theme/Theme';
import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { RadioGroup, RadioGroupItem, type RadioGroupSize, type RadioGroupTone } from './index';

const sizes: RadioGroupSize[] = ['sm', 'md', 'lg'];
const tones: RadioGroupTone[] = ['neutral', 'accent'];

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

/** RadioGroup in every content case, English and Arabic. */
export default function RadioGroupDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, tones and orientations">
        <DemoGrid min="14rem">
          {tones.flatMap((tone) =>
            sizes.map((size) => (
              <RadioGroup key={`${tone}-${size}`} label={`Board view, ${size}, ${tone}`} size={size} tone={tone} defaultValue="grid">
                <RadioGroupItem value="grid" label="Grid" />
                <RadioGroupItem value="list" label="List" />
              </RadioGroup>
            )),
          )}
        </DemoGrid>
        <RadioGroup label="Sort comments by" orientation="horizontal" defaultValue="recent" tone="accent">
          <RadioGroupItem value="recent" label="Most recent" />
          <RadioGroupItem value="oldest" label="Oldest first" />
          <RadioGroupItem value="unresolved" label="Unresolved first" />
        </RadioGroup>
        <RadioGroup label="Export format" description="Pick the file type you share with your team." defaultValue="png" required>
          <RadioGroupItem value="png" label="PNG" description="Best for images with sharp edges." />
          <RadioGroupItem value="pdf" label="PDF" description="Keeps text selectable and prints well." />
        </RadioGroup>
        <Theme lang="ar">
          <RadioGroup label="عرض اللوحة" defaultValue="grid" orientation="horizontal">
            <RadioGroupItem value="grid" label="شبكة" />
            <RadioGroupItem value="list" label="قائمة" />
            <RadioGroupItem value="board" label="أعمدة" />
          </RadioGroup>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="No option checked yet">
        <RadioGroup label="Plan">
          <RadioGroupItem value="free" label="Free" />
          <RadioGroupItem value="team" label="Team" />
        </RadioGroup>
      </DemoCase>

      <DemoCase id="one" title="A group with a description">
        <RadioGroup label="Who can comment" description="You can change this later in board settings." defaultValue="team">
          <RadioGroupItem value="team" label="People in your team" />
          <RadioGroupItem value="anyone" label="Anyone with the link" />
          <RadioGroupItem value="none" label="No one" />
        </RadioGroup>
      </DemoCase>

      <DemoCase id="many" title="Five options">
        <RadioGroup label="Notify me about" defaultValue="mentions" tone="accent">
          <RadioGroupItem value="all" label="All activity" />
          <RadioGroupItem value="mentions" label="Mentions and replies" />
          <RadioGroupItem value="replies" label="Replies only" />
          <RadioGroupItem value="digest" label="A daily digest" />
          <RadioGroupItem value="none" label="Nothing" />
        </RadioGroup>
      </DemoCase>

      <DemoCase id="too-many" title="Twelve options: use a Select instead">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <RadioGroup label="Time zone" size="sm" defaultValue={timeZones[0]}>
            {timeZones.map((zone) => (
              <RadioGroupItem key={zone} value={zone} label={zone} />
            ))}
          </RadioGroup>
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long labels and descriptions">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <RadioGroup
            label="When someone outside your workspace opens a shared link to this board"
            description={sample.en.long}
            defaultValue="ask"
          >
            <RadioGroupItem
              value="ask"
              label="Ask an owner to approve every person before they can see the board"
              description={sample.en.long}
            />
            <RadioGroupItem value="word" label={sample.en.word} />
          </RadioGroup>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <RadioGroup label="صلاحية التعليق" description={sample.ar.long} defaultValue="team" required>
            <RadioGroupItem value="team" label="أعضاء الفريق" description="يقدرون يعلقون ويردون على التعليقات." />
            <RadioGroupItem value="anyone" label="أي شخص عنده الرابط" description={sample.ar.long} />
            <RadioGroupItem value="none" label="محد" />
          </RadioGroup>
        </div>
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message">
        <RadioGroup label="Billing period" required error="Pick a billing period, so we can show the price.">
          <RadioGroupItem value="monthly" label="Monthly" />
          <RadioGroupItem value="yearly" label="Yearly" description="Two months free." />
        </RadioGroup>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled group and one disabled option">
        <DemoGrid min="14rem">
          <RadioGroup label="Workspace role" disabled defaultValue="editor" description="Only owners can change roles.">
            <RadioGroupItem value="viewer" label="Viewer" />
            <RadioGroupItem value="editor" label="Editor" />
          </RadioGroup>
          <RadioGroup label="Storage region" defaultValue="me">
            <RadioGroupItem value="me" label="Middle East" />
            <RadioGroupItem value="eu" label="Europe" />
            <RadioGroupItem value="us" label="United States" disabled description="Not on your plan." />
          </RadioGroup>
        </DemoGrid>
      </DemoCase>
    </DemoPage>
  );
}
