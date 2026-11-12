import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Avatar, type AvatarSize } from '../Avatar';
import { AvatarGroup } from './index';

const sizes: AvatarSize[] = ['xs', 'sm', 'md', 'lg'];

const people = [
  'Maher Fayad',
  'Sara Alqahtani',
  'Omar Haddad',
  'Lina Saleh',
  'Fahad Alotaibi',
  'Noura Alharbi',
  'Yousef Kamal',
  'Reem Aldosari',
  'Tariq Nasser',
  'Huda Alshehri',
  'Khalid Mansour',
  'Dana Abbas',
];

const peopleAr = ['ماهر فياض', 'سارة القحطاني', 'عمر حداد', 'لينا صالح', 'فهد العتيبي', 'نورة الحربي', 'يوسف كمال'];

/** "N people" in English. */
function count(n: number): string {
  return n === 1 ? '1 person' : `${n} people`;
}

/** "N أشخاص" with the Arabic plural rules for small counts, Western digits. */
function countAr(n: number): string {
  if (n === 1) return 'شخص واحد';
  if (n === 2) return 'شخصين';
  if (n <= 10) return `${n} أشخاص`;
  return `${n} شخص`;
}

/** "N others" with the Arabic plural rules, Western digits. */
function othersAr(n: number): string {
  if (n === 1) return 'واحد ثاني';
  if (n === 2) return 'شخصين ثانيين';
  if (n <= 10) return `${n} آخرين`;
  return `${n} شخص ثاني`;
}

function Group({ names, size, max, total }: { names: string[]; size?: AvatarSize; max?: number; total?: number }) {
  return (
    <AvatarGroup label={count(total ?? names.length)} size={size} max={max} total={total}>
      {names.map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </AvatarGroup>
  );
}

function ClickableGroup() {
  const [opened, setOpened] = useState(0);
  return (
    <>
      <AvatarGroup label={count(people.length)} onOverflowClick={() => setOpened((n) => n + 1)}>
        {people.map((name) => (
          <Avatar key={name} name={name} />
        ))}
      </AvatarGroup>
      <span>{opened === 0 ? 'The count opens the full list' : `List opened ${opened} times`}</span>
    </>
  );
}

export default function AvatarGroupDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: every size, a count, and a count you can press">
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <Group names={people.slice(0, 6)} size={size} />
          </DemoRow>
        ))}
        <DemoRow label="Count button">
          <ClickableGroup />
        </DemoRow>
        <DemoRow label="Arabic">
          <AvatarGroup label={countAr(peopleAr.length)} lang="ar" dir="rtl" overflowLabel={othersAr}>
            {peopleAr.map((name) => (
              <Avatar key={name} name={name} />
            ))}
          </AvatarGroup>
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="One person">
        <Group names={people.slice(0, 1)} />
      </DemoCase>

      <DemoCase id="many" title="Many: four avatars and a count">
        <Group names={people.slice(0, 8)} />
      </DemoCase>

      <DemoCase id="too-many" title="Too many: a server count larger than the list">
        <DemoRow>
          <Group names={people} total={1280} />
          <Group names={people} total={1280} size="xs" max={3} />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <AvatarGroup label={countAr(48)} total={48} overflowLabel={othersAr}>
          {peopleAr.map((name) => (
            <Avatar key={name} name={name} />
          ))}
        </AvatarGroup>
      </DemoCase>
    </DemoPage>
  );
}
