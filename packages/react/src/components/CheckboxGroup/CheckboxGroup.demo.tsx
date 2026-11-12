import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Checkbox } from '../Checkbox/Checkbox';
import { CheckboxGroup } from './index';

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

function Controlled() {
  const [value, setValue] = useState<string[]>(['comments']);
  return (
    <CheckboxGroup
      legend="Notify me about"
      description={value.length === 0 ? 'Nothing picked. You get no notifications.' : `${value.length} picked.`}
      value={value}
      onValueChange={setValue}
      selectAll="All notifications"
    >
      <Checkbox value="comments" label="Comments" />
      <Checkbox value="mentions" label="Mentions" />
      <Checkbox value="shares" label="Shared boards" />
    </CheckboxGroup>
  );
}

/** CheckboxGroup in every content case. Tab moves between items; Space toggles one. */
export default function CheckboxGroupDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, orientations and select all">
        <DemoGrid min="16rem">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <CheckboxGroup key={size} legend={`Channels, ${size}`} size={size} defaultValue={['email']}>
              {channels.map(([value, label]) => (
                <Checkbox key={value} value={value} label={label} />
              ))}
            </CheckboxGroup>
          ))}
          <CheckboxGroup legend="Channels, horizontal" orientation="horizontal" defaultValue={['push']}>
            {channels.map(([value, label]) => (
              <Checkbox key={value} value={value} label={label} />
            ))}
          </CheckboxGroup>
          <CheckboxGroup legend="Channels, select all" selectAll="All channels" defaultValue={['email']}>
            {channels.map(([value, label]) => (
              <Checkbox key={value} value={value} label={label} />
            ))}
          </CheckboxGroup>
          <Theme lang="ar">
            <CheckboxGroup legend="قنوات التنبيه" selectAll="كل القنوات" defaultValue={['email', 'sms']}>
              {channelsAr.map(([value, label]) => (
                <Checkbox key={value} value={value} label={label} />
              ))}
            </CheckboxGroup>
          </Theme>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="empty" title="Nothing checked">
        <CheckboxGroup legend="Channels" description="Pick at least one way to reach you.">
          {channels.map(([value, label]) => (
            <Checkbox key={value} value={value} label={label} />
          ))}
        </CheckboxGroup>
      </DemoCase>

      <DemoCase id="one" title="One item">
        <CheckboxGroup legend="Terms" defaultValue={['terms']}>
          <Checkbox value="terms" label="I agree to the terms of use" />
        </CheckboxGroup>
      </DemoCase>

      <DemoCase id="many" title="Controlled, with select all">
        <Controlled />
      </DemoCase>

      <DemoCase id="too-many" title="A long list that wraps">
        <CheckboxGroup legend="Regions" orientation="horizontal" size="sm" selectAll="All regions" defaultValue={['Riyadh', 'Asir']}>
          {regions.map((region) => (
            <Checkbox key={region} value={region} label={region} />
          ))}
        </CheckboxGroup>
      </DemoCase>

      <DemoCase id="long-text" title="Long legend, description and items">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <CheckboxGroup
            legend="Which of these should we send to every person on the board, including guests who joined from a shared link"
            description={sample.en.long}
            error="Pick at least one, so people hear about changes."
          >
            <Checkbox value="a" label={sample.en.long} />
            <Checkbox value="b" label={sample.en.word} />
          </CheckboxGroup>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <CheckboxGroup
            legend="وش تبي نرسل لكل أعضاء اللوحة، حتى الضيوف اللي دخلوا من رابط مشاركة"
            description={sample.ar.long}
            error="اختار وحدة على الأقل، عشان يوصلهم خبر التغييرات."
            selectAll="كل التنبيهات"
            defaultValue={['b']}
          >
            <Checkbox value="a" label="التعليقات والإشارات في الملفات المشتركة" />
            <Checkbox value="b" label={sample.ar.word} />
          </CheckboxGroup>
        </div>
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message">
        <CheckboxGroup legend="Channels" error="Pick at least one way to reach you.">
          {channels.map(([value, label]) => (
            <Checkbox key={value} value={value} label={label} />
          ))}
        </CheckboxGroup>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <CheckboxGroup legend="Channels" disabled description="Only owners can change this." defaultValue={['email']}>
          {channels.map(([value, label]) => (
            <Checkbox key={value} value={value} label={label} />
          ))}
        </CheckboxGroup>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <CheckboxGroup legend="Channels" readOnly description="Set by your workspace." defaultValue={['email', 'push']}>
          {channels.map(([value, label]) => (
            <Checkbox key={value} value={value} label={label} />
          ))}
        </CheckboxGroup>
      </DemoCase>
    </DemoPage>
  );
}
