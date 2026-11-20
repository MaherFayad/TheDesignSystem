// M10.1 music-library: a library of songs with a large title, play and
// shuffle buttons, sections by first letter with an index bar beside them,
// a long press menu on each song with a quick action row, a mini player over
// the tab bar and its search tab (docs/plan/reset-ios-families.md section 5).
// Order C2: the top bar is the Navbar's pushed screen form (a back button and
// a group of bar buttons, the large title under them), the mini player is
// the TabBar's accessory in its compact form, and Play and Shuffle are soft
// buttons with a neutral fill.
// On the folding iPhone's inner screen in landscape the library also shows
// its Sidebar.
//
// Rebuilt from the structure of the references in `meta.references`: their
// proportions and behaviour, never their pictures or words. Every control
// and surface is a system component; music-library.css lays out the page
// only. Content comes from ./kit, with more songs of our own below so most
// letters hold more than one song.
import { useMemo, useState } from 'react';
import { Icon } from '@the-system/icons/react';
import {
  Button,
  ButtonGroup,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuQuickAction,
  ContextMenuQuickActions,
  ContextMenuSeparator,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuQuickAction,
  DropdownMenuQuickActions,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  List,
  ListItem,
  ListSection,
  Navbar,
  ProgressBar,
  SectionIndex,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  Spinner,
  TabBar,
  TabBarItem,
  TabBarSearch,
  Toolbar,
  ToolbarButton,
  type SectionIndexSection,
} from '@the-system/react';
import { groupByInitial, indexAlphabet, indexEntries } from '@the-system/shared';
import { Art, ScreenShell, artistById, localeOf, t, tracks as kitTracks, type ArtName, type Lang, type Text, type Track } from './kit';
import type { ScreenMeta, ScreenProps } from './types';
import './music-library.css';

export const meta: ScreenMeta = {
  id: 'music-library',
  order: 'M10.1',
  title: 'A library of tracks with a large title, play and shuffle buttons, sections by first letter and an index bar; long press a track',
  families: ['top bar with large title', 'glass buttons', 'capsule buttons', 'grouped list', 'section header', 'index bar', 'context menu with quick action row', 'tab bar', 'search tab', 'progress bar', 'activity indicator', 'bottom toolbar', 'sidebar (inner screen, landscape)'],
  references: [
    { label: 'A list of songs', href: 'https://mobbin.com/screens/3a938b4d-3b4e-43b7-8de3-cb039a924e31' },
    { label: 'Contacts with an index bar', href: 'https://mobbin.com/screens/b1f60825-edc1-40e4-92ed-0c2d8a79fe60' },
    { label: 'A menu with a quick action row', href: 'https://mobbin.com/screens/9bbd868b-2e15-4da4-a7db-0b2124ec9e7e' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'built',
};

/* ------------------------------------------------------------ content */

/**
 * More songs of our own, so a letter holds two or three songs as a real
 * library does. Kit request: these could move to kit.tsx for M10.2.
 */
const moreTracks: readonly Track[] = [
  { id: 'ashes-oud', title: { en: 'Ashes of an old oud', ar: 'رماد عود قديم' }, artist: 'night-caravan', length: 243, art: 'dusk' },
  { id: 'below-tuwaiq', title: { en: 'Below Tuwaiq', ar: 'تحت طويق' }, artist: 'rawabi-strings', length: 276, art: 'sand' },
  { id: 'coffee-pot', title: { en: 'Coffee pot on the fire', ar: 'دلة على النار' }, artist: 'maha-saleh', length: 192, art: 'ember' },
  { id: 'date-harvest', title: { en: 'Date harvest', ar: 'صرام النخل' }, artist: 'juniper-trio', length: 208, art: 'palm' },
  { id: 'farasan-light', title: { en: 'Farasan light', ar: 'ضوء فرسان' }, artist: 'maha-saleh', length: 231, art: 'tide' },
  { id: 'gulf-wind', title: { en: 'Gulf wind', ar: 'هوا الخليج' }, artist: 'night-caravan', length: 255, art: 'lake' },
  { id: 'hail-road', title: { en: 'Hail road at dawn', ar: 'طريق حائل مع الفجر' }, artist: 'rawabi-strings', length: 219, art: 'dawn' },
  { id: 'jasmine-door', title: { en: 'Jasmine by the door', ar: 'ياسمين عند الباب' }, artist: 'maha-saleh', length: 201, art: 'mint' },
  { id: 'last-train', title: { en: 'Last train to Qassim', ar: 'آخر قطار للقصيم' }, artist: 'juniper-trio', length: 284, art: 'night' },
  { id: 'moon-over-najd', title: { en: 'Moon over Najd', ar: 'قمر على نجد' }, artist: 'night-caravan', length: 262, art: 'dune' },
  { id: 'nine-wells', title: { en: 'Nine wells', ar: 'تسع آبار' }, artist: 'rawabi-strings', length: 237, art: 'moss' },
  { id: 'old-souq', title: { en: 'Old souq at noon', ar: 'السوق القديم وقت الظهر' }, artist: 'juniper-trio', length: 196, art: 'coral' },
];

const allTracks: readonly Track[] = [...kitTracks, ...moreTracks];

/** The song the mini player holds at first, and the one being downloaded. A tap on a row plays that song (order C1). */
const NOW_PLAYING = 'blue-diriyah';
const DOWNLOADING = 'cardamom-morning';
/** Songs saved to the phone: a download glyph after them. */
const DOWNLOADED = new Set(['amber-gate', 'below-tuwaiq', 'dunes-rain', 'falcon-road', 'ink-palm', 'moon-over-najd']);

const words = {
  en: {
    title: 'Songs',
    bar: 'Library',
    sort: 'Sort songs',
    more: 'More options',
    barActions: 'Song actions',
    play: 'Play all',
    shuffle: 'Shuffle all',
    list: 'Songs in your library',
    index: 'Songs index',
    downloading: (title: string) => `Downloading ${title}`,
    downloaded: 'Downloaded',
    loadingMore: 'Loading more songs',
    rowMore: (title: string) => `More for ${title}`,
    quick: 'Quick actions',
    add: 'Add',
    favourite: 'Favourite',
    share: 'Share',
    addToPlaylist: 'Add to a playlist',
    playNext: 'Play next',
    playLast: 'Play last',
    goToArtist: 'Go to artist',
    download: 'Download',
    remove: 'Delete from library',
    tabs: 'Main',
    home: 'Home',
    newTab: 'New',
    radio: 'Radio',
    library: 'Library',
    search: 'Search',
    player: 'Now playing',
    pause: 'Pause',
    next: 'Next song',
    sidebar: 'Library',
    recent: 'Recently added',
    artists: 'Artists',
    albums: 'Albums',
    songs: 'Songs',
    saved: 'Downloaded',
    playlists: 'Playlists',
    roadTrip: 'Road to Abha',
    evenings: 'Quiet evenings',
  },
  ar: {
    title: 'الأغاني',
    bar: 'المكتبة',
    sort: 'ترتيب الأغاني',
    more: 'خيارات إضافية',
    barActions: 'خيارات الأغاني',
    play: 'تشغيل الكل',
    shuffle: 'تشغيل عشوائي',
    list: 'الأغاني في مكتبتك',
    index: 'فهرس الأغاني',
    downloading: (title: string) => `جاري تنزيل ${title}`,
    downloaded: 'تم تنزيلها',
    loadingMore: 'جاري تحميل أغاني إضافية',
    rowMore: (title: string) => `خيارات ${title}`,
    quick: 'إجراءات سريعة',
    add: 'إضافة',
    favourite: 'إضافة للمفضلة',
    share: 'مشاركة',
    addToPlaylist: 'إضافة لقائمة تشغيل',
    playNext: 'تشغيل التالي',
    playLast: 'تشغيل في الأخير',
    goToArtist: 'صفحة الفنان',
    download: 'تنزيل',
    remove: 'حذف من المكتبة',
    tabs: 'التنقل الرئيسي',
    home: 'الرئيسية',
    newTab: 'الجديد',
    radio: 'الراديو',
    library: 'المكتبة',
    search: 'البحث',
    player: 'قيد التشغيل',
    pause: 'إيقاف مؤقت',
    next: 'الأغنية التالية',
    sidebar: 'المكتبة',
    recent: 'المضاف حديثا',
    artists: 'الفنانون',
    albums: 'الألبومات',
    songs: 'الأغاني',
    saved: 'التنزيلات',
    playlists: 'قوائم التشغيل',
    roadTrip: 'طريق أبها',
    evenings: 'أمسيات هادئة',
  },
} as const;

type Words = (typeof words)[Lang];

function artistName(track: Track, lang: Lang): string {
  const artist = artistById(track.artist);
  return artist ? t(artist.name as Text, lang) : '';
}

/* ------------------------------------------------------------ parts */

/** A cover for a row or the mini player. Decoration: the title next to it names the song. */
function Cover({ art }: { art: ArtName }) {
  return (
    <span data-gallery="ml-cover">
      <Art art={art} />
    </span>
  );
}

/** The menu of a song: the quick action row, then the actions. One builder for the long press and the more button. */
function SongMenuItems({ w, kind, downloaded }: { w: Words; kind: 'context' | 'dropdown'; downloaded: boolean }) {
  const Quick = kind === 'context' ? ContextMenuQuickActions : DropdownMenuQuickActions;
  const QuickAction = kind === 'context' ? ContextMenuQuickAction : DropdownMenuQuickAction;
  const Item = kind === 'context' ? ContextMenuItem : DropdownMenuItem;
  const Separator = kind === 'context' ? ContextMenuSeparator : DropdownMenuSeparator;
  return (
    <>
      <Quick label={w.quick}>
        <QuickAction icon="plus">{w.add}</QuickAction>
        <QuickAction icon="star">{w.favourite}</QuickAction>
        <QuickAction icon="share">{w.share}</QuickAction>
      </Quick>
      <Item start="list">{w.addToPlaylist}</Item>
      <Separator />
      <Item start="chevrons-forward">{w.playNext}</Item>
      <Item start="arrow-down">{w.playLast}</Item>
      <Separator />
      <Item start="user">{w.goToArtist}</Item>
      {!downloaded && <Item start="download">{w.download}</Item>}
      <Item start="trash" tone="danger">
        {w.remove}
      </Item>
    </>
  );
}

function SongRow({ track, lang, w, playing, onPlay }: { track: Track; lang: Lang; w: Words; playing: boolean; onPlay: (id: string) => void }) {
  const title = t(track.title, lang);
  const downloaded = DOWNLOADED.has(track.id);
  const end =
    track.id === DOWNLOADING ? (
      <span data-gallery="ml-progress">
        <ProgressBar value={42} size="sm" showValue={false} aria-label={w.downloading(title)} />
      </span>
    ) : downloaded ? (
      <span data-gallery="ml-saved" role="img" aria-label={w.downloaded}>
        <Icon name="download" size="sm" />
      </span>
    ) : undefined;
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <ListItem
          start={<Cover art={track.art} />}
          title={title}
          description={artistName(track, lang)}
          onSelect={() => onPlay(track.id)}
          active={playing}
          end={end}
          actions={
            <DropdownMenu>
              <DropdownMenuTrigger>
                <IconButton icon="more" label={w.rowMore(title)} emphasis="ghost" size="sm" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <SongMenuItems w={w} kind="dropdown" downloaded={downloaded} />
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <SongMenuItems w={w} kind="context" downloaded={downloaded} />
      </ContextMenuContent>
    </ContextMenu>
  );
}

function LibrarySidebar({ w }: { w: Words }) {
  return (
    <Sidebar label={w.sidebar} collapsible={false}>
      <SidebarGroup label={w.sidebar}>
        <SidebarItem href="#recent" start="clock">
          {w.recent}
        </SidebarItem>
        <SidebarItem href="#artists" start="user">
          {w.artists}
        </SidebarItem>
        <SidebarItem href="#albums" start="grid">
          {w.albums}
        </SidebarItem>
        <SidebarItem href="#songs" start="list" active>
          {w.songs}
        </SidebarItem>
        <SidebarItem href="#downloaded" start="download">
          {w.saved}
        </SidebarItem>
      </SidebarGroup>
      <SidebarGroup label={w.playlists}>
        <SidebarItem href="#road-to-abha" start="list">
          {w.roadTrip}
        </SidebarItem>
        <SidebarItem href="#quiet-evenings" start="list">
          {w.evenings}
        </SidebarItem>
      </SidebarGroup>
    </Sidebar>
  );
}

/* ------------------------------------------------------------ the screen */

export function Screen({ variant, lang }: ScreenProps) {
  const w = words[lang];
  const locale = localeOf(lang);
  const groups = useMemo(() => groupByInitial(allTracks, (track) => t(track.title, lang), locale), [lang, locale]);
  const sections = useMemo<SectionIndexSection[]>(() => {
    const ids = new Map(groups.map((g, i) => [g.key, `ml-section-${i}`]));
    return indexEntries(indexAlphabet(locale), groups.map((g) => g.key)).flatMap((e) => {
      const target = ids.get(e.target);
      return target ? [{ key: e.key, target }] : [];
    });
  }, [groups, locale]);
  const [nowPlaying, setNowPlaying] = useState(NOW_PLAYING);
  const playing = allTracks.find((track) => track.id === nowPlaying);
  // The Sidebar is the regular width form: only the inner screen in landscape has the room (plan section 5).
  const wide = variant.frame === 'duo-inner' && variant.orient === 'landscape';

  return (
    <ScreenShell
      nav={wide ? <LibrarySidebar w={w} /> : undefined}
      header={
        // Order C2: the pushed screen form. The back button (not beside the Sidebar, which shows where the page is) and the bar group on one row, the large title, the page's h1, under it.
        <Navbar
          label={w.bar}
          items={[]}
          back={wide ? undefined : { label: w.library, href: '#library' }}
          heading={w.title}
          end={
            <ButtonGroup attached aria-label={w.barActions}>
              <IconButton icon="sort" label={w.sort} />
              <IconButton icon="more" label={w.more} />
            </ButtonGroup>
          }
        />
      }
    >
      <div data-gallery="ml-page">
        <div data-gallery="ml-actions">
          <Button start="play" tone="accent" emphasis="soft" fill="neutral" shape="pill" fullWidth wrap>
            {w.play}
          </Button>
          <Button start="shuffle" tone="accent" emphasis="soft" fill="neutral" shape="pill" fullWidth wrap>
            {w.shuffle}
          </Button>
        </div>
        <div data-gallery="ml-index">
          <SectionIndex sections={sections} label={w.index} />
        </div>
        <div data-gallery="ml-songs">
          <List variant="flush" aria-label={w.list}>
            {groups.map((g, i) => (
              <ListSection key={g.key} id={`ml-section-${i}`} header={g.key} level={2}>
                {g.items.map((track) => (
                  <SongRow key={track.id} track={track} lang={lang} w={w} playing={track.id === nowPlaying} onPlay={setNowPlaying} />
                ))}
              </ListSection>
            ))}
          </List>
          <div data-gallery="ml-loading">
            <Spinner label={w.loadingMore} size="md" />
          </div>
        </div>
      </div>
      <div data-gallery="ml-dock">
        {/*
         * Order C2: the mini player is the tab bar's accessory, and this pushed
         * screen draws the compact bar (the current tab, the player, the search
         * disc). Beside the Sidebar the full bar stays.
         */}
        <TabBar
          aria-label={w.tabs}
          compact={!wide}
          accessory={
            playing && (
              <Toolbar aria-label={w.player} overflow="wrap" emphasis="ghost" data-gallery="ml-player">
                {/* The song itself is the first command: it opens the player. */}
                <ToolbarButton start={<Cover art={playing.art} />} data-gallery="ml-player-song">
                  {t(playing.title, lang)}
                </ToolbarButton>
                <ToolbarButton icon="pause" label={w.pause} />
                <ToolbarButton icon="next-track" label={w.next} />
              </Toolbar>
            )
          }
        >
          <TabBarItem href="#home" icon="home" label={w.home} />
          <TabBarItem href="#new" icon="grid" label={w.newTab} />
          <TabBarItem href="#radio" icon="radio" label={w.radio} />
          <TabBarItem href="#library" icon="library" label={w.library} active />
          <TabBarSearch href="#search" label={w.search} />
        </TabBar>
      </div>
    </ScreenShell>
  );
}
