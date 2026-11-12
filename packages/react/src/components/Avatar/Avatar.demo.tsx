import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Avatar, type AvatarShape, type AvatarSize, type AvatarStatusTone } from './index';

const sizes: AvatarSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: AvatarShape[] = ['default', 'square'];
const statuses: AvatarStatusTone[] = ['success', 'warning', 'danger', 'neutral'];

/** Arabic status words, noun forms, no diacritics. */
const statusAr: Record<AvatarStatusTone, string> = {
  success: 'متصل',
  warning: 'بعيد',
  danger: 'مشغول',
  neutral: 'غير متصل',
};

/**
 * A stand in portrait drawn as an inline svg, so the demo needs no network.
 * Demo only: product code passes a real image URL.
 */
function portrait(skin: string, back: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${back}"/><circle cx="32" cy="25" r="12" fill="${skin}"/><path d="M10 64c2-14 11-21 22-21s20 7 22 21z" fill="${skin}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const photos = [portrait('#c99a7a', '#3d5a80'), portrait('#8d5b3e', '#98c1d9'), portrait('#e8c4a8', '#5c4d7d')];

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

const peopleAr = ['ماهر فياض', 'سارة القحطاني', 'عمر حداد', 'لينا صالح', 'فهد العتيبي', 'نورة الحربي'];

export default function AvatarDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: sizes, shapes, image, initials and icon">
        {shapes.map((shape) => (
          <DemoRow key={shape} label={`Shape ${shape}`}>
            {sizes.map((size) => (
              <Avatar key={`img-${size}`} name="Maher Fayad" src={photos[0]} size={size} shape={shape} />
            ))}
            {sizes.map((size) => (
              <Avatar key={`ini-${size}`} name="Sara Alqahtani" size={size} shape={shape} />
            ))}
            {sizes.map((size) => (
              <Avatar key={`icon-${size}`} name="Design team" icon="folder" size={size} shape={shape} />
            ))}
          </DemoRow>
        ))}
        <DemoRow label="Status">
          {statuses.map((status) => (
            <Avatar key={status} name="Omar Haddad" status={status} size="lg" />
          ))}
          {statuses.map((status) => (
            <Avatar key={`img-${status}`} name="Lina Saleh" src={photos[1]} status={status} />
          ))}
        </DemoRow>
        <DemoRow label="Arabic">
          {peopleAr.slice(0, 4).map((name, i) => (
            <Avatar key={name} name={name} size="lg" lang="ar" status={statuses[i]} statusLabel={statusAr[statuses[i]!]} />
          ))}
          <Avatar name="فريق التصميم" icon="folder" shape="square" size="lg" lang="ar" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="empty" title="Empty: a name with no letters shows the person icon">
        <DemoRow>
          {sizes.map((size) => (
            <Avatar key={size} name="42" size={size} />
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="One: the avatar next to the name it shows is decorative">
        <DemoRow>
          <Avatar name="Maher Fayad" src={photos[0]} decorative />
          <span>Maher Fayad</span>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many: each name keeps its own color">
        <DemoRow>
          {people.map((name, i) => (
            <Avatar key={name} name={name} src={i % 4 === 0 ? photos[i % photos.length] : undefined} />
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text: a long name still gives two letters">
        <DemoRow>
          <Avatar name="Alexandria Montgomery Whitfield Ashworth Kensington" size="lg" />
          <Avatar name="Supercalifragilisticexpialidocious" size="lg" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <Avatar name="عبدالرحمن بن محمد بن عبدالعزيز الشمراني" size="lg" status="success" statusLabel="متصل" />
          <Avatar name="والمستخدمين" size="lg" />
          {peopleAr.map((name) => (
            <Avatar key={name} name={name} />
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="error" title="Error: the image fails and the initials show">
        <DemoRow>
          <Avatar name="Noura Alharbi" src="/missing-avatar.png" size="lg" />
          <Avatar name="Design team" src="/missing-logo.png" icon="folder" shape="square" size="lg" />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
