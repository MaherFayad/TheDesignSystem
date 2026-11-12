// Stages of the /interactions page for the selection controls and lists family
// (orders 1.21 and 1.22). One live stage per interaction id of
// packages/motion/src/interactions. Each stage marks the control that plays
// it with data-interaction-trigger, so the page's replay control can press
// it again. Owned by the family agent of order 1.22.
import { useState, type ReactNode } from 'react';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Chip,
  Combobox,
  FilterBar,
  List,
  ListBox,
  ListItem,
  MultiSelect,
  RadioCard,
  RadioCardItem,
  RadioGroup,
  RadioGroupItem,
  RangeSlider,
  Select,
  Slider,
  TagField,
} from '@the-system/react';

const fruit = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
];

const stack = { display: 'grid', gap: 'var(--ds-space-m)', inlineSize: '100%' } as const;
const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--ds-space-xs)', alignItems: 'center' } as const;

function ListStage() {
  const [key, setKey] = useState(0);
  return (
    <>
      <List key={key} aria-label="Inbox">
        <ListItem start="mail" title="Sara Alqahtani" description="Brand review moved to Thursday" />
        <ListItem start="file" title="Omar Alharbi" description="Invoice 2041 is ready to download" />
        <ListItem start="bell" title="Design team" description="New comments on the onboarding board" />
      </List>
      <Button size="sm" data-interaction-trigger="" onClick={() => setKey((k) => k + 1)}>
        Paint the list again
      </Button>
    </>
  );
}

const people = ['Sara Alqahtani', 'Omar Alharbi', 'Lina Haddad', 'Faisal Alotaibi', 'Noura Alsaud'];

function CollectionStage() {
  const [rows, setRows] = useState(people.slice(0, 3));
  const [next, setNext] = useState(3);
  return (
    <div style={stack}>
      <List aria-label="Reviewers" variant="inset">
        {rows.map((name) => (
          <ListItem key={name} start="user" title={name} />
        ))}
      </List>
      <div style={row}>
        <Button
          size="sm"
          data-interaction-trigger=""
          onClick={() => {
            setRows((r) => [...r.slice(0, 1), people[next % people.length]!, ...r.slice(1)].filter((v, i, a) => a.indexOf(v) === i));
            setNext((n) => n + 1);
          }}
        >
          Add a reviewer
        </Button>
        <Button size="sm" emphasis="soft" onClick={() => setRows((r) => r.slice(1))}>
          Remove the first
        </Button>
        <Button size="sm" emphasis="soft" onClick={() => setRows((r) => [...r].reverse())}>
          Reverse the order
        </Button>
      </div>
      <TagField aria-label="Tags" defaultValue={['Design', 'Research', 'Copy']} placeholder="Add a tag" />
    </div>
  );
}

function ChipStage() {
  const [on, setOn] = useState<string[]>(['images']);
  const chips = [
    ['images', 'Images'],
    ['video', 'Video'],
    ['shared', 'Shared with me'],
  ] as const;
  return (
    <div style={row}>
      {chips.map(([value, label], i) => (
        <Chip
          key={value}
          selected={on.includes(value)}
          data-interaction-trigger={i === 1 ? '' : undefined}
          onClick={() => setOn((list) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]))}
        >
          {label}
        </Chip>
      ))}
    </div>
  );
}

function FilterStage() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <FilterBar
      aria-label="Files"
      filters={[
        { value: 'images', label: 'Images' },
        { value: 'video', label: 'Video' },
        { value: 'docs', label: 'Documents' },
      ]}
      value={value}
      onValueChange={setValue}
      resultCount={128 - value.length * 37}
      data-interaction-trigger=""
    />
  );
}

/** Live stages by interaction id. */
export const stages: Record<string, () => ReactNode> = {
  'check-draw': () => (
    <div style={stack}>
      <Checkbox label="Snap frames to the grid" data-interaction-trigger="" />
      <CheckboxGroup legend="Notify me about" selectAll="All notifications">
        <Checkbox value="comments" label="Comments" />
        <Checkbox value="mentions" label="Mentions" />
        <Checkbox value="invites" label="Invites" />
        <Checkbox value="reviews" label="Reviews" />
      </CheckboxGroup>
    </div>
  ),
  'radio-pop': () => (
    <RadioGroup label="Export as" defaultValue="png">
      <RadioGroupItem value="png" label="PNG" data-interaction-trigger="" />
      <RadioGroupItem value="svg" label="SVG" />
      <RadioGroupItem value="pdf" label="PDF" />
    </RadioGroup>
  ),
  'radio-card-lift': () => (
    <RadioCard aria-label="Plan" defaultValue="team" orientation="horizontal">
      <RadioCardItem value="solo" title="Solo" description="One seat" end="$12" data-interaction-trigger="" />
      <RadioCardItem value="team" title="Team" description="Five seats" end="$48" />
    </RadioCard>
  ),
  'slider-nudge': () => (
    <div style={{ inlineSize: '100%' }}>
      <Slider label="Volume" unit="%" defaultValue={100} data-interaction-trigger="" />
    </div>
  ),
  'slider-pull': () => (
    <div style={stack}>
      <Slider label="Opacity" unit="%" defaultValue={40} data-interaction-trigger="" />
      <RangeSlider label="Price" unit="SAR" min={0} max={1000} step={50} defaultValue={[200, 800]} thumbLabels={['Minimum price', 'Maximum price']} />
    </div>
  ),
  'slider-bubble': () => (
    <div style={stack}>
      <Slider label="Zoom" unit="%" min={10} max={400} defaultValue={120} data-interaction-trigger="" />
      <RangeSlider label="Budget" unit="SAR" min={0} max={5000} step={10} defaultValue={[900, 3200]} thumbLabels={['Lowest budget', 'Highest budget']} />
    </div>
  ),
  'picker-chevron-turn': () => (
    <div style={stack}>
      <Select aria-label="Fruit" items={fruit} defaultValue="apple" data-interaction-trigger="" />
      <Combobox aria-label="Fruit search" items={fruit} placeholder="Find a fruit" />
    </div>
  ),
  'menu-rows': () => (
    <div style={stack}>
      <Select aria-label="Sort by" items={fruit} placeholder="Pick a fruit" data-interaction-trigger="" />
      <MultiSelect aria-label="Fruit basket" items={fruit} defaultValue={['apple']} />
    </div>
  ),
  'picker-value-roll': () => <Select aria-label="Size" items={fruit} defaultValue="banana" data-interaction-trigger="" />,
  'row-glide': () => (
    <div style={stack}>
      <ListBox aria-label="Fruit" items={fruit.slice(0, 4)} style={{ inlineSize: '16rem' }} data-interaction-trigger="" />
      <List aria-label="Pages">
        <ListItem start="file" title="Overview" href="#overview" />
        <ListItem start="file" title="Pricing" href="#pricing" />
        <ListItem start="file" title="Changelog" href="#changelog" />
      </List>
    </div>
  ),
  'collection-flip': () => <CollectionStage />,
  'chip-check-pop': () => <ChipStage />,
  'filter-count-roll': () => <FilterStage />,
  'list-stagger': () => <ListStage />,
};
