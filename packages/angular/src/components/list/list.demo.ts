// The List demo: the same cases, ids and copy as
// packages/react/src/components/List/List.demo.tsx. Differences, until the
// Angular ports exist: the song and article covers are a decorative icon
// (no Avatar), and the swipe rows of the variants case are left out (no
// SwipeActions).
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsIcon } from '@the-system/icons/angular';
import { DsButton } from '../button/button';
import { DsIconButton } from '../icon-button/icon-button';
import { DsSlider } from '../slider/slider';
import { DsList, DsListItem, DsListSection, type ListSize, type ListVariant } from './list';

const variants: ListVariant[] = ['plain', 'divided', 'inset', 'flush'];
const sizes: ListSize[] = ['md', 'sm'];

const mail = [
  { from: 'Sara Alqahtani', subject: 'Brand review moved to Thursday', time: '09:24', icon: 'mail' as const },
  { from: 'Omar Alharbi', subject: 'Invoice 2041 is ready to download', time: 'Yesterday', icon: 'file' as const },
  { from: 'Design team', subject: 'New comments on the onboarding board', time: 'Mon', icon: 'bell' as const },
];

const mailAr = [
  { from: 'سارة القحطاني', subject: 'تأجيل مراجعة الهوية ليوم الخميس', time: '09:24', icon: 'mail' as const },
  { from: 'عمر الحربي', subject: 'الفاتورة 2041 جاهزة للتنزيل', time: 'أمس', icon: 'file' as const },
];

const songs = [
  { id: 'amber', title: 'Amber gate', artist: 'Maha Saleh' },
  { id: 'blue', title: 'Blue Diriyah', artist: 'Night Caravan' },
  { id: 'cardamom', title: 'Cardamom morning', artist: 'Juniper Trio' },
];

const songsAr = [
  { id: 'amber-ar', title: 'بوابة العنبر', artist: 'مها صالح' },
  { id: 'blue-ar', title: 'الدرعية الزرقاء', artist: 'قافلة الليل' },
];

const folders = ['Inbox', 'Drafts', 'Sent', 'Archive', 'Trash', 'Spam', 'Starred', 'Important', 'Scheduled', 'All mail', 'Templates', 'Snoozed'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsTheme, DsIcon, DsButton, DsIconButton, DsSlider, DsList, DsListItem, DsListSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #cover><svg dsIcon name="music" size="lg"></svg></ng-template>
    <ng-template #bell><svg dsIcon name="bell" size="md"></svg></ng-template>
    <ng-template #volumeTplEn><div dsSlider aria-label="Bell volume" [min]="0" [max]="100" [step]="5" [(value)]="volume"></div></ng-template>
    <ng-template #volumeTplAr><div dsSlider aria-label="مستوى الصوت" [min]="0" [max]="100" [step]="5" [(value)]="volumeAr"></div></ng-template>

    <section data-demo="case" data-demo-case="variants" heading="Variants: plain, divided and inset, two sizes, links with actions, and Arabic">
      @for (size of sizes; track size) {
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));">
          @for (variant of variants; track variant) {
            <ul dsList [size]="size" [variant]="variant" [attr.aria-label]="'Inbox, ' + variant + ', ' + size">
              @for (m of mail; track m.from; let i = $index) {
                <li dsListItem [href]="'#mail-' + i" [start]="m.icon" [title]="m.from" [description]="m.subject" [end]="m.time" [active]="i === 0" [actions]="del"></li>
                <ng-template #del><button dsIconButton size="xs" icon="trash" [label]="'Delete mail from ' + m.from"></button></ng-template>
              }
            </ul>
          }
        </div>
      }
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));">
        @for (variant of variants; track variant) {
          <ul dsList [variant]="variant" [attr.aria-label]="'Settings in sections, ' + variant">
            <li dsListSection header="Notifications" footer="Previews show the first line of each message.">
              <ng-container>
                <li dsListItem start="bell" title="Show previews" [href]="'#previews-' + variant" end="Always"></li>
                <li dsListItem start="mail" title="Mail" [href]="'#mail-alerts-' + variant"></li>
              </ng-container>
            </li>
            <li dsListSection header="Account">
              <ng-container>
                <li dsListItem start="user" title="Profile" [href]="'#profile-' + variant"></li>
              </ng-container>
            </li>
          </ul>
        }
      </div>
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));">
        <ul dsList variant="flush" aria-label="Songs">
          @for (song of songs; track song.id) {
            <li dsListItem [start]="cover" [title]="song.title" [description]="song.artist" [active]="song.id === playing()" [onSelect]="play(song.id)" [actions]="more"></li>
            <ng-template #more><button dsIconButton size="sm" emphasis="ghost" icon="more" [label]="'More for ' + song.title"></button></ng-template>
          }
        </ul>
        <ul dsList variant="flush" aria-label="Boards, no chevrons">
          <li dsListItem href="#board-brand" start="grid" title="Brand board" description="Edited today" [chevron]="false"></li>
          <li dsListItem href="#board-launch" start="grid" title="Launch plan" description="Edited Monday" [chevron]="false"></li>
        </ul>
        <ul dsList variant="inset" aria-label="Sound">
          <li dsListSection header="Bell volume" footer="The bell follows this level even on silent.">
            <ng-container>
              <li dsListItem start="bell-off" [end]="bell" [control]="volumeTplEn"></li>
            </ng-container>
          </li>
        </ul>
      </div>
      <div dsTheme [lang]="'ar'">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));">
          <ul dsList variant="divided" aria-label="الوارد">
            @for (m of mailAr; track m.from; let i = $index) {
              <li dsListItem [href]="'#mail-' + i" [start]="m.icon" [title]="m.from" [description]="m.subject" [end]="m.time" [active]="i === 0" [actions]="delAr"></li>
              <ng-template #delAr><button dsIconButton size="xs" icon="trash" [label]="'حذف رسالة ' + m.from"></button></ng-template>
            }
          </ul>
          <ul dsList variant="inset" aria-label="الوارد">
            @for (m of mailAr; track m.from; let i = $index) {
              <li dsListItem [href]="'#mail-' + i" [start]="m.icon" [title]="m.from" [description]="m.subject" [end]="m.time" [active]="i === 0" [actions]="delAr2"></li>
              <ng-template #delAr2><button dsIconButton size="xs" icon="trash" [label]="'حذف رسالة ' + m.from"></button></ng-template>
            }
          </ul>
          <ul dsList variant="flush" aria-label="الأغاني">
            @for (song of songsAr; track song.id) {
              <li dsListItem [start]="cover" [title]="song.title" [description]="song.artist" [active]="song.id === playingAr()" [onSelect]="playAr(song.id)" [actions]="moreAr"></li>
              <ng-template #moreAr><button dsIconButton size="sm" emphasis="ghost" icon="more" [label]="'خيارات ' + song.title"></button></ng-template>
            }
          </ul>
          <ul dsList variant="inset" aria-label="الصوت">
            <li dsListSection header="مستوى صوت الجرس">
              <ng-container>
                <li dsListItem start="bell-off" [end]="bell" [control]="volumeTplAr"></li>
              </ng-container>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty">
      <div dsList variant="inset" empty="No mail yet. Mail you get from your team shows here."></div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One row, no link">
      <ul dsList variant="divided" aria-label="Members">
        <li dsListItem start="user" title="Sara Alqahtani" description="Owner"></li>
      </ul>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many: ordered steps with no links">
      <ol dsList variant="divided" aria-label="Setup steps">
        <li dsListItem start="check-circle" title="Create the workspace" end="Done"></li>
        <li dsListItem start="check-circle" title="Invite your team" end="Done"></li>
        <li dsListItem start="dot" title="Connect a domain" description="Point your DNS to the address in Settings." end="Next"></li>
        <li dsListItem start="dot" title="Publish the first page"></li>
      </ol>
      <div style="max-inline-size: 24rem">
        <ul dsList variant="inset" aria-label="Settings">
          <li dsListSection header="Network" footer="Large files wait for Wi-Fi unless you turn on mobile data.">
            <ng-container>
              <li dsListItem start="download" title="Sync over mobile data" href="#sync" end="Off"></li>
              <li dsListItem start="file" title="Wi-Fi only for large files" href="#wifi" end="On"></li>
            </ng-container>
          </li>
          <li dsListSection header="Privacy" footer="Boards you share keep the access you gave them.">
            <ng-container>
              <li dsListItem start="lock" title="Lock with passcode" href="#lock"></li>
              <li dsListItem start="eye" title="Who can see your boards" href="#visibility" end="Team"></li>
              <li dsListItem start="user" title="Blocked people" href="#blocked" end="2"></li>
            </ng-container>
          </li>
          <li dsListSection header="Empty section" empty="No devices yet. Devices you sign in on show here."></li>
        </ul>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Too many: twelve folders">
      <div style="max-inline-size: 20rem">
        <ul dsList size="sm" variant="plain" aria-label="Folders">
          @for (name of folders; track name; let i = $index) {
            <li dsListItem [href]="'#folder-' + i" start="folder" [title]="name" [end]="'' + ((i * 7) % 23)" [active]="i === 0"></li>
          }
        </ul>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text">
      <ul dsList variant="divided" aria-label="Long rows">
        <li
          dsListItem
          href="#long"
          start="file"
          title="Quarterly brand guidelines review with the regional marketing teams and the agency"
          description="Your changes are saved to your account. Open the board on any other device to see the same version, with every comment and every reference in place."
          end="12:40"
          [actions]="longMore"
        ></li>
        <li dsListItem start="link" title="https://example.com/boards/brand/2026/q4/guidelines-final-reviewed-copy"></li>
      </ul>
      <ng-template #longMore><button dsIconButton size="xs" icon="more" label="Open actions for the guidelines review"></button></ng-template>
      <div style="max-inline-size: 20rem">
        <ul dsList variant="flush" titleLines="3" aria-label="Saved articles">
          <li
            dsListItem
            href="#article-walls"
            [chevron]="false"
            [start]="cover"
            title="Why mud walls keep old houses in Najd cool through the longest summer afternoons"
            description="Rawdah Review, 8 min read"
            [footer]="articleFooter"
          ></li>
          <li dsListItem title="Number of sessions in one focus block" titleLines="2" [actions]="addSession"></li>
        </ul>
      </div>
      <ng-template #articleFooter>
        <button dsButton size="sm" shape="pill" emphasis="soft" start="play">Listen</button>
        <button dsIconButton size="sm" emphasis="ghost" icon="more" label="More for Why mud walls keep old houses cool"></button>
      </ng-template>
      <ng-template #addSession><button dsIconButton size="sm" icon="plus" label="Add a session"></button></ng-template>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <ul dsList variant="divided" aria-label="الملفات">
          <li
            dsListItem
            href="#long-ar"
            start="file"
            title="مراجعة دليل الهوية للربع الرابع مع فرق التسويق في المناطق والوكالة"
            [description]="arDescription"
            end="12:40"
            [actions]="arMore"
          ></li>
        </ul>
        <ng-template #arDescription>لو خلصت من تعديل الملف، احفظه وارجع للوحة عشان تشوف كل التغييرات في مكان واحد. وإذا تبي تشاركه مع فريقك، نزله بصيغة <bdi>JSON</bdi> وأرسله لهم.</ng-template>
        <ng-template #arMore><button dsIconButton size="xs" icon="more" label="عرض خيارات مراجعة الدليل"></button></ng-template>
        <div style="max-inline-size: 20rem">
          <ul dsList variant="flush" titleLines="3" aria-label="المقالات المحفوظة">
            <li
              dsListItem
              href="#article-walls-ar"
              [chevron]="false"
              [start]="cover"
              title="ليش بيوت الطين في نجد تبقى باردة حتى في أطول عصريات الصيف"
              description="مجلة الروضة، قراءة 8 دقائق"
              [footer]="arArticleFooter"
            ></li>
          </ul>
        </div>
        <ng-template #arArticleFooter>
          <button dsButton size="sm" shape="pill" emphasis="soft" start="play">استماع</button>
          <button dsIconButton size="sm" emphasis="ghost" icon="more" label="خيارات مقال بيوت الطين"></button>
        </ng-template>
        <div style="max-inline-size: 24rem">
          <ul dsList variant="inset" aria-label="الإعدادات">
            <li dsListSection header="الإشعارات" footer="المعاينة تعرض أول سطر من كل رسالة، وتقدر توقفها لأي محادثة من إعداداتها.">
              <ng-container>
                <li dsListItem start="bell" title="عرض المعاينة" href="#previews-ar" end="دايم"></li>
                <li dsListItem start="mail" title="البريد" href="#mail-ar" end="12"></li>
              </ng-container>
            </li>
            <li dsListSection header="الخصوصية وأمان الحساب على كل الأجهزة اللي سجلت دخولك منها">
              <ng-container>
                <li dsListItem start="lock" title="قفل التطبيق برمز" href="#lock-ar"></li>
              </ng-container>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled row">
      <ul dsList variant="divided" aria-label="Boards">
        <li dsListItem href="#open" start="grid" title="Brand board" description="Open"></li>
        <li dsListItem href="#locked" start="lock" title="Finance board" description="You need access from an admin" disabled></li>
        <li dsListItem start="music" title="Offline mix" description="Download it first to play it here" [onSelect]="noop" disabled></li>
      </ul>
    </section>
  `,
})
export default class ListDemo {
  protected readonly sizes = sizes;
  protected readonly variants = variants;
  protected readonly mail = mail;
  protected readonly mailAr = mailAr;
  protected readonly songs = songs;
  protected readonly songsAr = songsAr;
  protected readonly folders = folders;
  protected readonly playing = signal(songs[0]!.id);
  protected readonly playingAr = signal(songsAr[0]!.id);
  protected readonly volume = signal<number | undefined>(60);
  protected readonly volumeAr = signal<number | undefined>(60);
  private readonly players = new Map<string, () => void>();
  protected readonly noop = () => undefined;

  /** One handler per song, kept, so the row's onSelect input does not change on every pass. */
  protected play(id: string): () => void {
    return this.handler(`en:${id}`, () => this.playing.set(id));
  }

  protected playAr(id: string): () => void {
    return this.handler(`ar:${id}`, () => this.playingAr.set(id));
  }

  private handler(key: string, run: () => void): () => void {
    let h = this.players.get(key);
    if (!h) {
      h = run;
      this.players.set(key, h);
    }
    return h;
  }
}
