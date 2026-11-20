// M10.2 music-search: the search tab of a music app, expanded into its
// field, with recent searches and categories to browse; a query shows scope
// segments (all music or your library), an activity indicator while results
// come, the results by kind, and an empty result with a way out
// (docs/plan/reset-ios-families.md section 5).
//
// Rebuilt from the structure of the references in `meta.references`: a
// large title, the tab bar drawn compact with the search item turned into a
// field at the bottom, recent searches as rows, categories as a two column
// grid of covers, and with a query, scope segments at the top over rows of
// songs and artists. Their proportions and behaviour, never their pictures
// or words.
//
// Every control and surface is a component of @the-system/react:
// - top bar: Navbar with the large title as its heading;
// - the search tab: TabBar (compact) with TabBarSearch active and a
//   SearchField as its field, which also shows the loading state;
// - scope: SegmentedControl;
// - recent searches and results: List with ListSection and ListItem;
// - categories: Card with CardMedia and CardLink, in a grid of the page;
// - while results come: Spinner;
// - no result: EmptyState with a Button that clears the search.
// This file's CSS (./music-search.css) is page layout only.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardLink,
  CardMedia,
  CardTitle,
  EmptyState,
  IconButton,
  List,
  ListItem,
  ListSection,
  Navbar,
  SearchField,
  SegmentedControl,
  SegmentedControlItem,
  Spinner,
  TabBar,
  TabBarItem,
  TabBarSearch,
} from '@the-system/react';
import { Art, ScreenShell, artistById, artists, durationText, localeOf, t, tracks, type ArtName, type Artist, type Lang, type Text, type Track } from './kit';
import type { ScreenMeta, ScreenProps } from './types';
import './music-search.css';

export const meta: ScreenMeta = {
  id: 'music-search',
  order: 'M10.2',
  title: 'The search tab expanded into the field, scope chips, results, an empty result',
  families: ['search tab', 'search field', 'segmented control', 'empty state', 'activity indicator'],
  references: [
    { label: 'The search tab', href: 'https://mobbin.com/screens/38013fe5-6e15-4038-9c0f-039bf66715c7' },
    { label: 'Search with the field open', href: 'https://mobbin.com/screens/0fdc7e6a-e4aa-4c5a-8879-84396df1a589' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'built',
};

/* ------------------------------------------------------------ content */

interface Category {
  id: string;
  name: Text;
  art: ArtName;
}

/** Categories of our own to browse. */
const categories: readonly Category[] = [
  { id: 'calm', name: { en: 'Calm evenings', ar: 'أمسيات هادئة' }, art: 'dusk' },
  { id: 'road', name: { en: 'Road trips', ar: 'رحلات الطريق' }, art: 'sand' },
  { id: 'focus', name: { en: 'Focus', ar: 'تركيز' }, art: 'lake' },
  { id: 'strings', name: { en: 'Strings', ar: 'أوتار' }, art: 'moss' },
  { id: 'morning', name: { en: 'Morning coffee', ar: 'قهوة الصباح' }, art: 'dawn' },
  { id: 'coast', name: { en: 'By the sea', ar: 'على البحر' }, art: 'tide' },
];

/** Recent searches: a song, an artist, a song. */
const RECENT = [
  { kind: 'track', id: 'dunes-rain' },
  { kind: 'artist', id: 'maha-saleh' },
  { kind: 'track', id: 'kite-abha' },
] as const;

/** Songs saved to the library, for the library scope. */
const IN_LIBRARY = new Set(['amber-gate', 'dunes-rain', 'ink-palm', 'juniper-slope', 'lantern-market']);

/** How long the results take to come, so the activity indicator shows. */
const LOAD_MS = 700;

type Scope = 'all' | 'library';

const words = {
  en: {
    title: 'Search',
    nav: 'Search',
    account: 'Your account',
    placeholder: 'Songs, artists and lyrics',
    searching: 'Searching',
    scope: 'Search in',
    all: 'All music',
    library: 'Your library',
    recent: 'Recently searched',
    clearRecent: 'Clear recent searches',
    browse: 'Browse categories',
    songs: 'Songs',
    artistsTitle: 'Artists',
    song: (artist: string, length: number) => `Song, ${artist}, ${durationText(length)}`,
    artist: 'Artist',
    results: 'Search results',
    loading: 'Loading results',
    noneTitle: (q: string) => `No results for “${q}”`,
    noneBody: 'Check the spelling, or search all music instead of your library.',
    noneBodyAll: 'Check the spelling, or try a song or an artist name.',
    clear: 'Clear search',
    searchAll: 'Search all music',
    tabs: 'Main',
    home: 'Home',
    libraryTab: 'Library',
    radio: 'Radio',
  },
  ar: {
    title: 'البحث',
    nav: 'البحث',
    account: 'حسابك',
    placeholder: 'أغاني وفنانين وكلمات',
    searching: 'جاري البحث',
    scope: 'البحث في',
    all: 'كل الموسيقى',
    library: 'مكتبتك',
    recent: 'عمليات البحث الأخيرة',
    clearRecent: 'مسح عمليات البحث الأخيرة',
    browse: 'تصفح الفئات',
    songs: 'الأغاني',
    artistsTitle: 'الفنانون',
    song: (artist: string, length: number) => `أغنية، ${artist}، ${durationText(length)}`,
    artist: 'فنان',
    results: 'نتائج البحث',
    loading: 'جاري تحميل النتائج',
    noneTitle: (q: string) => `ما فيه نتائج لـ «${q}»`,
    noneBody: 'ممكن الكتابة فيها خطأ، أو النتيجة موجودة في كل الموسيقى بدل مكتبتك.',
    noneBodyAll: 'ممكن الكتابة فيها خطأ، أو البحث باسم أغنية أو فنان يطلع نتائج أكثر.',
    clear: 'مسح البحث',
    searchAll: 'البحث في كل الموسيقى',
    tabs: 'التنقل الرئيسي',
    home: 'الرئيسية',
    libraryTab: 'المكتبة',
    radio: 'الراديو',
  },
} as const;

function artistName(track: Track, lang: Lang): string {
  const artist = artistById(track.artist);
  return artist ? t(artist.name, lang) : '';
}

/** Case and mark blind matching in both languages. */
function fold(s: string, locale: string): string {
  return s.toLocaleLowerCase(locale).normalize('NFKD').replace(/\p{M}/gu, '');
}

/* ------------------------------------------------------------ parts */

function Cover({ art, round = false }: { art: ArtName; round?: boolean }) {
  return (
    <span data-gallery="ms-cover">
      <Art art={art} shape={round ? 'circle' : 'square'} />
    </span>
  );
}

/* ------------------------------------------------------------ the screen */

export function Screen({ lang }: ScreenProps) {
  const w = words[lang];
  const locale = localeOf(lang);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [recent, setRecent] = useState(true);
  /** The query the shown results are for: it lags the field while results come. */
  const [settled, setSettled] = useState('');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (query.trim() === '') {
      setSettled('');
      return;
    }
    timer.current = window.setTimeout(() => setSettled(query), LOAD_MS);
    return () => window.clearTimeout(timer.current);
  }, [query]);

  const q = settled.trim();
  const loading = query.trim() !== '' && query !== settled;

  const found = useMemo(() => {
    if (q === '') return { songs: [] as Track[], people: [] as Artist[] };
    const needle = fold(q, locale);
    const songs = tracks.filter((track) => (scope === 'all' || IN_LIBRARY.has(track.id)) && (fold(t(track.title, lang), locale).includes(needle) || fold(artistName(track, lang), locale).includes(needle)));
    const people = artists.filter((a) => fold(t(a.name, lang), locale).includes(needle) && (scope === 'all' || tracks.some((track) => track.artist === a.id && IN_LIBRARY.has(track.id))));
    return { songs, people };
  }, [q, scope, lang, locale]);

  const clear = () => setQuery('');

  const header = (
    <Navbar label={w.nav} items={[]} heading={w.title} end={<IconButton icon="user" label={w.account} />} />
  );

  let body;
  if (query.trim() === '') {
    body = (
      <>
        {recent && (
          <List variant="flush" aria-label={w.recent} data-gallery="ms-list">
            <ListSection
header={w.recent} level={2}
            >
              {RECENT.map((r) => {
                if (r.kind === 'track') {
                  const track = tracks.find((x) => x.id === r.id);
                  if (!track) return null;
                  return <ListItem key={r.id} href={`#${r.id}`} start={<Cover art={track.art} />} title={t(track.title, lang)} description={w.song(artistName(track, lang), track.length)} />;
                }
                const a = artistById(r.id);
                if (!a) return null;
                return <ListItem key={r.id} href={`#${r.id}`} start={<Cover art={a.art} round />} title={t(a.name, lang)} description={w.artist} />;
              })}
            </ListSection>
          </List>
        )}
        {recent && (
          <div data-gallery="ms-clear-recent">
            <Button size="sm" emphasis="ghost" tone="accent" onClick={() => setRecent(false)}>
              {w.clearRecent}
            </Button>
          </div>
        )}
        <section aria-labelledby="ms-browse" data-gallery="ms-browse">
          <h2 id="ms-browse" data-gallery="ms-heading">
            {w.browse}
          </h2>
          <ul data-gallery="ms-grid">
            {categories.map((c) => (
              <li key={c.id}>
                <Card emphasis="soft" size="sm">
                  <CardMedia>
                    <Art art={c.art} shape="wide" />
                  </CardMedia>
                  <CardHeader>
                    {/* The documented whole card link: CardLink inside CardTitle (Card.css stretches only that form). ds doctor's slot rule reads the title as text only: reported to the lead. */}
                    <CardTitle level={3}>
                      <CardLink href={`#${c.id}`}>{t(c.name, lang)}</CardLink>
                    </CardTitle>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </>
    );
  } else {
    const none = !loading && found.songs.length === 0 && found.people.length === 0;
    body = (
      <>
        <div data-gallery="ms-scope">
          <SegmentedControl value={scope} onValueChange={(v) => setScope(v as Scope)} aria-label={w.scope} fullWidth>
            <SegmentedControlItem value="all">{w.all}</SegmentedControlItem>
            <SegmentedControlItem value="library">{w.library}</SegmentedControlItem>
          </SegmentedControl>
        </div>
        {loading ? (
          <div data-gallery="ms-loading">
            <Spinner label={w.loading} size="lg" />
          </div>
        ) : none ? (
          <div data-gallery="ms-empty">
            <EmptyState
              icon="search"
              title={w.noneTitle(q)}
              headingLevel={2}
              live
              actions={
                scope === 'library' ? (
                  <Button shape="pill" tone="accent" emphasis="soft" onClick={() => setScope('all')}>
                    {w.searchAll}
                  </Button>
                ) : (
                  <Button shape="pill" tone="accent" emphasis="soft" onClick={clear}>
                    {w.clear}
                  </Button>
                )
              }
            >
              {scope === 'library' ? w.noneBody : w.noneBodyAll}
            </EmptyState>
          </div>
        ) : (
          <List variant="flush" aria-label={w.results} data-gallery="ms-list">
            {found.songs.length > 0 && (
              <ListSection header={w.songs} level={2}>
                {found.songs.map((track) => (
                  <ListItem key={track.id} href={`#${track.id}`} start={<Cover art={track.art} />} title={t(track.title, lang)} description={w.song(artistName(track, lang), track.length)} />
                ))}
              </ListSection>
            )}
            {found.people.length > 0 && (
              <ListSection header={w.artistsTitle} level={2}>
                {found.people.map((a) => (
                  <ListItem key={a.id} href={`#${a.id}`} start={<Cover art={a.art} round />} title={t(a.name, lang)} description={w.artist} />
                ))}
              </ListSection>
            )}
          </List>
        )}
      </>
    );
  }

  return (
    <ScreenShell header={header}>
      <div data-gallery="ms-page">{body}</div>
      <div data-gallery="ms-dock">
        {/* The search tab is the current one and has turned into its field; the bar is compact, so only the field and the current item show. */}
        <TabBar aria-label={w.tabs} compact>
          <TabBarItem href="#home" icon="home" label={w.home} />
          <TabBarItem href="#radio" icon="radio" label={w.radio} />
          <TabBarItem href="#library" icon="library" label={w.libraryTab} />
          <TabBarSearch
            href="#search"
            label={w.title}
            active
            field={<SearchField shape="pill" placeholder={w.placeholder} value={query} onValueChange={setQuery} clearLabel={w.clear} loading={loading} loadingLabel={w.searching} />}
          />
        </TabBar>
      </div>
    </ScreenShell>
  );
}
