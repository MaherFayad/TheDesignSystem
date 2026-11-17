// M10.5 inbox-swipe: a list of saved articles with swipe actions on both
// sides, a filter menu from a button in the top bar, a notification banner
// after an action, and a bottom toolbar (docs/plan/reset-ios-families.md
// section 5).
//
// Rebuilt from a saved articles list of a native iOS reading app (Mobbin
// links in `meta.references`): a large title at the leading edge with one
// button at the trailing edge, full width rows of a square cover, a title of
// up to three lines and a byline, a hairline between rows, and one row
// swiped open to show its actions at full row height. Our own articles,
// names and artwork come from ./kit.
//
// Every control and surface is a component of @the-system/react:
// - top bar: Navbar with the large title as its brand and the filter
//   IconButton at its end, which opens a DropdownMenu (a quick action row
//   for the sort, then a radio group for the filter);
// - rows: List (divided) with ListItem `swipe` and SwipeActions, start side
//   read and favourite, end side archive (first, on the full swipe, it can
//   be undone) and delete (never on the full swipe); variant flush with
//   titles of up to three lines (titleLines), no chevron on the rows
//   (chevron false), and a footer under the byline with a listen capsule
//   and a more button (order C1);
// - the banner: Toaster with position auto and toast() with start, meta and
//   closable;
// - the bottom toolbar: Toolbar in the PageShell footer;
// - an emptied list: EmptyState.
//
// This file's CSS (./inbox-swipe.css) is page layout only.
import { useMemo, useState, type ReactNode } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuQuickAction,
  DropdownMenuQuickActions,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  IconButton,
  List,
  ListItem,
  Navbar,
  StatusDot,
  SwipeActions,
  Toaster,
  Toolbar,
  ToolbarButton,
  TOAST_ACTION_MIN_DURATION,
  toast,
  type SwipeAction,
} from '@the-system/react';
import { Art, ScreenShell, articles, countText, t, type Article, type Lang } from './kit';
import type { ScreenMeta, ScreenProps } from './types';
import './inbox-swipe.css';

export const meta: ScreenMeta = {
  id: 'inbox-swipe',
  order: 'M10.5',
  title: 'A list of saved items with swipe actions on both sides, filter menu, a banner after an action',
  families: ['list swipe actions', 'menu from a button', 'notification banner', 'bottom toolbar', 'top bar'],
  references: [
    { label: 'A list of saved articles', href: 'https://mobbin.com/screens/e97a2ae1-ef94-4f8d-bdfb-f85b325a9936' },
    { label: 'Swipe actions on a row', href: 'https://mobbin.com/screens/0abd5c81-4cd1-450b-bf9a-1cb0990bdca5' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'built',
};

type Filter = 'all' | 'unread' | 'favourites';
type Sort = 'newest' | 'oldest' | 'shortest';

/** Minutes to read, the number kept on one line with its unit. Arabic counts 3 to 10 with the plural, 11 and up with the singular. */
function readingTime(minutes: number, lang: Lang): string {
  const n = countText(minutes, lang);
  if (lang === 'en') return `${n}\u00a0min read`;
  return `قراءة ${n}\u00a0${minutes >= 3 && minutes <= 10 ? 'دقائق' : 'دقيقة'}`;
}

const words = {
  en: {
    title: 'Saved',
    nav: 'Saved articles',
    list: 'Saved articles',
    filter: 'Filter and sort',
    sort: 'Sort',
    newest: 'Newest',
    oldest: 'Oldest',
    shortest: 'Shortest',
    show: 'Show',
    all: 'All items',
    unread: 'Unread',
    favourites: 'Favourites',
    read: 'Mark read',
    markUnread: 'Mark unread',
    favourite: 'Favourite',
    unfavourite: 'Unfavourite',
    archive: 'Archive',
    del: 'Delete',
    menu: (title: string) => `Actions for ${title}`,
    listen: 'Listen',
    pause: 'Pause',
    more: (title: string) => `More for ${title}`,
    unreadDot: 'Unread',
    byline: (a: Article, lang: Lang) => `${t(a.source, lang)}, ${readingTime(a.minutes, lang)}`,
    archived: 'Article archived',
    undo: 'Undo archive',
    undoAlt: 'Restore it with Restore archived in the toolbar',
    deleted: 'Article deleted',
    favoured: 'Added to favourites',
    unfavoured: 'Removed from favourites',
    readDone: 'Marked as read',
    unreadDone: 'Marked as unread',
    allRead: 'All articles marked as read',
    restored: (n: number) => (n === 1 ? '1 article restored' : `${n} articles restored`),
    tools: 'Saved list tools',
    markAll: 'Mark all read',
    restore: 'Restore archived',
    emptyTitle: 'Nothing saved here',
    emptyBody: 'Articles you save show up here. Archived articles come back with Restore archived.',
    emptyFiltered: 'No articles match this filter.',
    showAll: 'Show all items',
  },
  ar: {
    title: 'المحفوظات',
    nav: 'المقالات المحفوظة',
    list: 'المقالات المحفوظة',
    filter: 'التصفية والترتيب',
    sort: 'الترتيب',
    newest: 'الأحدث',
    oldest: 'الأقدم',
    shortest: 'الأقصر',
    show: 'العرض',
    all: 'الكل',
    unread: 'غير المقروءة',
    favourites: 'المفضلة',
    read: 'تعليم كمقروء',
    markUnread: 'تعليم كغير مقروء',
    favourite: 'تفضيل',
    unfavourite: 'إزالة من المفضلة',
    archive: 'أرشفة',
    del: 'حذف',
    menu: (title: string) => `خيارات ${title}`,
    listen: 'استماع',
    pause: 'إيقاف مؤقت',
    more: (title: string) => `المزيد عن ${title}`,
    unreadDot: 'غير مقروء',
    byline: (a: Article, lang: Lang) => `${t(a.source, lang)}، ${readingTime(a.minutes, lang)}`,
    archived: 'انحفظ المقال في الأرشيف',
    undo: 'تراجع',
    undoAlt: 'تقدر ترجعه من استرجاع المؤرشف في الشريط السفلي',
    deleted: 'انحذف المقال',
    favoured: 'انضاف للمفضلة',
    unfavoured: 'انشال من المفضلة',
    readDone: 'صار مقروء',
    unreadDone: 'صار غير مقروء',
    allRead: 'كل المقالات صارت مقروءة',
    restored: (n: number) => `رجعت ${n} مقالات`,
    tools: 'أدوات القائمة',
    markAll: 'تعليم الكل كمقروء',
    restore: 'استرجاع المؤرشف',
    emptyTitle: 'ما فيه شي محفوظ هنا',
    emptyBody: 'المقالات اللي تحفظها تطلع هنا. والمؤرشفة ترجع من استرجاع المؤرشف.',
    emptyFiltered: 'ما فيه مقالات تطابق هذي التصفية.',
    showAll: 'عرض الكل',
  },
} as const;

/** Articles saved first are unread. */
const INITIAL_UNREAD = ['mud-walls', 'night-sky', 'coffee-roast'];
const INITIAL_FAVOURITES = ['red-sea-reefs'];

function sorted(list: readonly Article[], sort: Sort): Article[] {
  const out = [...list];
  if (sort === 'newest') out.sort((a, b) => b.saved.localeCompare(a.saved));
  if (sort === 'oldest') out.sort((a, b) => a.saved.localeCompare(b.saved));
  if (sort === 'shortest') out.sort((a, b) => a.minutes - b.minutes);
  return out;
}

export function Screen({ lang }: ScreenProps) {
  const w = words[lang];
  const [ids, setIds] = useState<string[]>(() => articles.map((a) => a.id));
  const [archived, setArchived] = useState<string[]>([]);
  const [unread, setUnread] = useState<Set<string>>(() => new Set(INITIAL_UNREAD));
  const [favourites, setFavourites] = useState<Set<string>>(() => new Set(INITIAL_FAVOURITES));
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('newest');
  /** The article read aloud, if any: its listen capsule turns into a pause capsule. */
  const [listening, setListening] = useState<string | null>(null);

  /** A timed banner with no close button: it leaves by its timer, a swipe up, or Escape when focused. */
  const banner = (title: string, start: string, description?: string) => toast({ title, description, start, meta: new Date(), lang, closable: false });

  const toggle = (set: Set<string>, id: string): Set<string> => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  const archive = (a: Article) => {
    setIds((all) => all.filter((id) => id !== a.id));
    setArchived((all) => [...all, a.id]);
    // The undo banner times out as the native one does (order C3): 10 s at least, paused on hover and focus,
    // and the toolbar's Restore archived is the other way back (altText). Timed, it has no close button on ios.
    toast({
      title: w.archived,
      description: t(a.title, lang),
      start: 'inbox',
      duration: TOAST_ACTION_MIN_DURATION,
      meta: new Date(),
      lang,
      action: {
        label: w.undo,
        altText: w.undoAlt,
        onAction: () => {
          setArchived((all) => all.filter((id) => id !== a.id));
          setIds((all) => (all.includes(a.id) ? all : [...all, a.id]));
        },
      },
    });
  };

  const remove = (a: Article) => {
    setIds((all) => all.filter((id) => id !== a.id));
    banner(w.deleted, 'trash', t(a.title, lang));
  };

  const markRead = (a: Article) => {
    const was = unread.has(a.id);
    setUnread((set) => toggle(set, a.id));
    banner(was ? w.readDone : w.unreadDone, 'mail');
  };

  const favour = (a: Article) => {
    const was = favourites.has(a.id);
    setFavourites((set) => toggle(set, a.id));
    banner(was ? w.unfavoured : w.favoured, was ? 'star' : 'star-filled');
  };

  const markAllRead = () => {
    setUnread(new Set());
    banner(w.allRead, 'check-double');
  };

  const restoreArchived = () => {
    const n = archived.length;
    setIds((all) => [...all, ...archived.filter((id) => !all.includes(id))]);
    setArchived([]);
    banner(w.restored(n), 'history');
  };

  const shown = useMemo(() => {
    const live = articles.filter((a) => ids.includes(a.id));
    const kept = live.filter((a) => (filter === 'unread' ? unread.has(a.id) : filter === 'favourites' ? favourites.has(a.id) : true));
    return sorted(kept, sort);
  }, [ids, filter, unread, favourites, sort]);

  // StatusDot's name is its `label` prop; ds doctor reads the label slot as children (reported to the lead).
  const unreadDot = { tone: 'accent', label: w.unreadDot, hideLabel: true } as const;

  const startActions = (a: Article): SwipeAction[] => [
    { label: unread.has(a.id) ? w.read : w.markUnread, icon: 'mail', tone: 'accent', onSelect: () => markRead(a) },
    { label: favourites.has(a.id) ? w.unfavourite : w.favourite, icon: 'star', tone: 'warning', onSelect: () => favour(a) },
  ];

  const endActions = (a: Article): SwipeAction[] => [
    { label: w.archive, icon: 'inbox', tone: 'accent', undoable: true, onSelect: () => archive(a) },
    { label: w.del, icon: 'trash', tone: 'danger', onSelect: () => remove(a) },
  ];

  // The trigger and the menu are passed as expressions: ds doctor reads the DropdownMenu root slot (the
  // items) as the children of DropdownMenu itself and flags its two real children (reported to the lead).
  const filterTrigger = (
    <DropdownMenuTrigger>
      <IconButton icon="filter" label={w.filter} />
    </DropdownMenuTrigger>
  );

  const filterContent = (
    <DropdownMenuContent align="end">
      <DropdownMenuQuickActions label={w.sort}>
        <DropdownMenuQuickAction icon="arrow-down" onSelect={() => setSort('newest')} aria-current={sort === 'newest' ? 'true' : undefined}>
          {w.newest}
        </DropdownMenuQuickAction>
        <DropdownMenuQuickAction icon="arrow-up" onSelect={() => setSort('oldest')} aria-current={sort === 'oldest' ? 'true' : undefined}>
          {w.oldest}
        </DropdownMenuQuickAction>
        <DropdownMenuQuickAction icon="clock" onSelect={() => setSort('shortest')} aria-current={sort === 'shortest' ? 'true' : undefined}>
          {w.shortest}
        </DropdownMenuQuickAction>
      </DropdownMenuQuickActions>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>{w.show}</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <DropdownMenuRadioItem value="all" start="list">
          {w.all}
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="unread" start="mail">
          {w.unread}
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="favourites" start="star">
          {w.favourites}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  );

  const filterMenu = (
    <DropdownMenu>
      {filterTrigger}
      {filterContent}
    </DropdownMenu>
  );

  const header = <Navbar label={w.nav} brand={<h1 data-gallery="inbox-title">{w.title}</h1>} items={[]} end={filterMenu} />;

  const footer = (
    <div data-gallery="inbox-footer">
      <Toolbar aria-label={w.tools} size="lg">
        <ToolbarButton icon="check-double" label={w.markAll} onClick={markAllRead} disabled={unread.size === 0} />
        <ToolbarButton icon="history" label={w.restore} onClick={restoreArchived} disabled={archived.length === 0} />
      </Toolbar>
    </div>
  );

  let body: ReactNode;
  if (shown.length === 0) {
    const filtered = ids.length > 0;
    body = (
      <div data-gallery="inbox-empty">
        <EmptyState
          size="lg"
          icon="inbox"
          title={w.emptyTitle}
          headingLevel={2}
          live
          actions={
            filtered ? (
              <Button onClick={() => setFilter('all')}>{w.showAll}</Button>
            ) : archived.length > 0 ? (
              <Button onClick={restoreArchived}>{w.restore}</Button>
            ) : undefined
          }
        >
          {filtered ? w.emptyFiltered : w.emptyBody}
        </EmptyState>
      </div>
    );
  } else {
    body = (
      <List variant="flush" titleLines={3} aria-label={w.list} data-gallery="inbox-list">
        {shown.map((a) => {
          const title = t(a.title, lang);
          const playing = listening === a.id;
          return (
            <ListItem
              key={a.id}
              href={`#${a.id}`}
              chevron={false}
              start={
                <span data-gallery="inbox-cover">
                  <Art art={a.art} />
                </span>
              }
              title={title}
              description={w.byline(a, lang)}
              end={unread.has(a.id) ? <StatusDot {...unreadDot} /> : undefined}
              swipe={<SwipeActions start={startActions(a)} end={endActions(a)} menuLabel={w.menu(title)} />}
              footer={
                <>
                  <Button size="sm" shape="pill" emphasis="soft" start={playing ? 'pause' : 'play'} onClick={() => setListening(playing ? null : a.id)}>
                    {playing ? w.pause : w.listen}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <IconButton icon="more" label={w.more(title)} emphasis="ghost" size="sm" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {[...startActions(a), ...endActions(a)].map((action) => (
                        <DropdownMenuItem key={action.label} start={action.icon} tone={action.tone === 'danger' ? 'danger' : undefined} onSelect={action.onSelect}>
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              }
            />
          );
        })}
      </List>
    );
  }

  return (
    <ScreenShell header={header} footer={footer}>
      <div data-gallery="inbox-main">{body}</div>
      <Toaster position="auto" />
    </ScreenShell>
  );
}
