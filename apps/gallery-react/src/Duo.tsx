// The /platforms/duo page (order DU3, docs/plan/reset-duo.md section 6,
// proposed): the foldable iPhone in our own drawn frames. Six frames (the
// outer screen, the inner screen and the inner screen partly folded, each in
// portrait and landscape), each in two modes:
//
// - In Safari: the iframe is the page size Safari gives (S8 in the plan),
//   and the rest of the screen is Safari's own chrome, drawn as inert
//   placeholders in the page background colour.
// - Full screen: the iframe is the whole screen, as a Home Screen web app or
//   a native shell would have it. The screen inside sets a gallery only
//   override of the safe area insets on its own Theme element, and on the
//   folded frames a gallery only fold attribute.
//
// Each iframe loads /platforms/duo/screen on the ios platform. The screen is
// a PageShell (the size container `ds-shell` of the plan) with the iOS phone
// demo of /platforms inside: a top bar, a list, a button that opens a sheet
// and a tab bar, over our own coloured content. Every look here is a
// proposal to the owner. The frames are our own drawings: a rounded body,
// the screen, a plain dot for the camera, a band for the fold. No vendor
// artwork.
//
// URL keys of this page (the axes as on every gallery page, plus these):
//   screen=outer|inner  orient=portrait|landscape  fold=flat|folded
//   mode=safari|full    view=settings|sheet        placement=auto|bottom|side
// A key left out shows every value.
import { type CSSProperties } from 'react';
import {
  Button,
  Field,
  Input,
  Link,
  List,
  ListItem,
  Navbar,
  PageShell,
  SegmentedControl,
  SegmentedControlItem,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
  Switch,
  TabBar,
  TabBarItem,
  Theme,
  useTheme,
} from '@the-system/react';
import { navigate, withBase } from './router';
import './platforms.css';
import './duo.css';

/* ------------------------------------------------------------ geometry */

type ScreenKind = 'outer' | 'inner';
type Orient = 'portrait' | 'landscape';
type Fold = 'flat' | 'folded';
type Mode = 'safari' | 'full';
type View = 'settings' | 'sheet';
type Placement = 'auto' | 'bottom' | 'side';

/** A rectangle in points, physical: x from the left edge, y from the top. */
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Safe area insets in points, physical sides. */
interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface Frame {
  id: string;
  name: string;
  screen: ScreenKind;
  orient: Orient;
  fold: Fold;
  /** The whole screen in points (plan section 2). */
  w: number;
  h: number;
  /** The corner on the hinge side is square on the outer screen. */
  hinge?: 'left' | 'top';
  /** The camera dot, its centre in points. Outer: always there. Inner: only while in use, drawn faint. */
  camera: { x: number; y: number; inner: boolean };
  /** The page Safari gives (S8, small viewport height), where it sits, and Safari's own chrome. */
  safari: { page: Rect; chrome: { kind: 'bar' | 'column'; rect: Rect }[] };
  /** The insets the full screen mode sets (plan section 2.1, kit; proposed, not measured on a device). */
  full: Insets;
  /** The fold band across the middle of the inner screen, 40 points (kit). */
  band?: { axis: 'x' | 'y'; start: number; size: number };
}

/*
 * Safari's chrome: the plan gives the page width and the small and large
 * viewport heights, not where the chrome sits. Our split, proposed: on the
 * outer screen the status strip on top is the screen height less the large
 * viewport height, and the bar at the bottom is the rest; the column is the
 * screen width less the page width (84 in both orientations). On the inner
 * screen the whole difference is a bar at the top, as on an iPad.
 */
const outerPortrait: Frame = {
  id: 'outer-portrait',
  name: 'Outer screen, portrait',
  screen: 'outer',
  orient: 'portrait',
  fold: 'flat',
  w: 466,
  h: 678,
  hinge: 'left',
  camera: { x: 424, y: 46, inner: false },
  safari: {
    page: { x: 0, y: 60, w: 382, h: 580 },
    chrome: [
      { kind: 'bar', rect: { x: 0, y: 0, w: 382, h: 60 } },
      { kind: 'bar', rect: { x: 0, y: 640, w: 382, h: 38 } },
      { kind: 'column', rect: { x: 382, y: 0, w: 84, h: 678 } },
    ],
  },
  full: { top: 0, right: 84, bottom: 0, left: 0 },
};

const outerLandscape: Frame = {
  id: 'outer-landscape',
  name: 'Outer screen, landscape',
  screen: 'outer',
  orient: 'landscape',
  fold: 'flat',
  w: 678,
  h: 466,
  hinge: 'top',
  camera: { x: 636, y: 420, inner: false },
  safari: {
    page: { x: 0, y: 60, w: 594, h: 368 },
    chrome: [
      { kind: 'bar', rect: { x: 0, y: 0, w: 594, h: 60 } },
      { kind: 'bar', rect: { x: 0, y: 428, w: 594, h: 38 } },
      { kind: 'column', rect: { x: 594, y: 0, w: 84, h: 466 } },
    ],
  },
  full: { top: 0, right: 84, bottom: 0, left: 0 },
};

/*
 * Inner screen, full screen insets: the status strip on top and the home
 * indicator at the bottom in portrait; the column at the end in landscape.
 * The kit's 84 and 95 in portrait are our own bars' guides, not insets.
 */
const innerPortrait: Frame = {
  id: 'inner-portrait',
  name: 'Inner screen, portrait',
  screen: 'inner',
  orient: 'portrait',
  fold: 'flat',
  w: 669,
  h: 951,
  camera: { x: 602, y: 42, inner: true },
  safari: {
    page: { x: 0, y: 84, w: 669, h: 867 },
    chrome: [{ kind: 'bar', rect: { x: 0, y: 0, w: 669, h: 84 } }],
  },
  full: { top: 24, right: 0, bottom: 20, left: 0 },
};

const innerLandscape: Frame = {
  id: 'inner-landscape',
  name: 'Inner screen, landscape',
  screen: 'inner',
  orient: 'landscape',
  fold: 'flat',
  w: 951,
  h: 669,
  camera: { x: 909, y: 60, inner: true },
  safari: {
    page: { x: 0, y: 84, w: 951, h: 585 },
    chrome: [{ kind: 'bar', rect: { x: 0, y: 0, w: 951, h: 84 } }],
  },
  full: { top: 0, right: 84, bottom: 20, left: 0 },
};

/* Partly folded: Safari's page sizes are not published (plan section 12); the flat sizes stand in. */
const frames: readonly Frame[] = [
  outerPortrait,
  outerLandscape,
  innerPortrait,
  innerLandscape,
  { ...innerPortrait, id: 'inner-folded-portrait', name: 'Inner screen, partly folded, portrait', fold: 'folded', band: { axis: 'y', start: 455.5, size: 40 } },
  { ...innerLandscape, id: 'inner-folded-landscape', name: 'Inner screen, partly folded, landscape', fold: 'folded', band: { axis: 'x', start: 455.5, size: 40 } },
];

const modes: readonly { id: Mode; name: string }[] = [
  { id: 'safari', name: 'In Safari' },
  { id: 'full', name: 'Full screen' },
];

/** The gallery keys of this page, in the order of the controls. */
const duoKeys = [
  { key: 'screen', label: 'Screen', values: ['outer', 'inner'] },
  { key: 'orient', label: 'Orientation', values: ['portrait', 'landscape'] },
  { key: 'fold', label: 'Fold', values: ['flat', 'folded'] },
  { key: 'mode', label: 'Mode', values: ['safari', 'full'] },
  { key: 'view', label: 'Screen shown', values: ['settings', 'sheet'] },
  { key: 'placement', label: 'Bar placement', values: ['auto', 'bottom', 'side'] },
] as const;

type DuoKey = (typeof duoKeys)[number]['key'];

function pick<T extends string>(params: URLSearchParams, key: DuoKey, values: readonly T[]): T | undefined {
  const value = params.get(key);
  return values.includes(value as T) ? (value as T) : undefined;
}

function frameById(id: string | null): Frame {
  return frames.find((f) => f.id === id) ?? outerPortrait;
}

/** Unitless point numbers as custom properties; duo.css multiplies them by the 1px token. */
function vars(entries: Record<string, number>): CSSProperties {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(entries)) out[`--duo-${k}`] = v;
  return out as CSSProperties;
}

function rectVars(r: Rect): CSSProperties {
  return vars({ x: r.x, y: r.y, w: r.w, h: r.h });
}

/* ------------------------------------------------------------ the page */

/** The axes of this page minus the platform and the shell, for the frames, which run on ios. */
function frameQuery(params: URLSearchParams, frame: Frame, mode: Mode, view: View, placement: Placement): string {
  const q = new URLSearchParams();
  const own = new Set<string>(['platform', 'chrome', 'frame', ...duoKeys.map((k) => k.key)]);
  for (const [k, v] of params) if (!own.has(k)) q.set(k, v);
  q.set('frame', frame.id);
  q.set('mode', mode);
  q.set('view', view);
  if (placement !== 'auto') q.set('placement', placement);
  q.set('platform', 'ios');
  q.set('chrome', '0');
  return q.toString();
}

export function DuoPage({ params }: { params: URLSearchParams }) {
  const screen = pick(params, 'screen', ['outer', 'inner'] as const);
  const orient = pick(params, 'orient', ['portrait', 'landscape'] as const);
  const fold = pick(params, 'fold', ['flat', 'folded'] as const);
  const mode = pick(params, 'mode', ['safari', 'full'] as const);
  const view = pick(params, 'view', ['settings', 'sheet'] as const) ?? 'settings';
  const placement = pick(params, 'placement', ['auto', 'bottom', 'side'] as const) ?? 'auto';
  const shown = frames.filter((f) => (!screen || f.screen === screen) && (!orient || f.orient === orient) && (!fold || f.fold === fold));
  const shownModes = modes.filter((m) => !mode || m.id === mode);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const s = next.toString();
    navigate(`${window.location.pathname}${s ? `?${s}` : ''}`, { replace: true });
  };

  return (
    <div data-gallery="duo">
      <h1>Foldable iPhone</h1>
      <p data-gallery="platforms-note">
        The iOS phone screen in our own drawn frames of the foldable iPhone: the outer screen, the inner screen and the inner screen partly folded, in
        portrait and landscape. In Safari shows the page size Safari gives, with Safari&apos;s own chrome drawn as inert placeholders. Full screen
        shows the whole screen, as a Home Screen web app or a native shell would have it, with the camera column and the fold set as gallery only
        overrides. Proposed, waiting for the owner and a check on a real device.
      </p>
      <form data-gallery="duo-controls" aria-label="Device frames" onSubmit={(e) => e.preventDefault()}>
        {duoKeys.map((control) => (
          <label key={control.key} data-gallery="axis">
            <span>{control.label}</span>
            <select value={params.get(control.key) ?? ''} onChange={(e) => set(control.key, e.target.value)}>
              <option value="">{control.key === 'view' ? 'settings' : control.key === 'placement' ? 'auto' : 'All'}</option>
              {control.values
                .filter((v) => !((control.key === 'view' && v === 'settings') || (control.key === 'placement' && v === 'auto')))
                .map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
            </select>
          </label>
        ))}
      </form>
      {shown.length === 0 && <p data-gallery="platforms-note">No frame matches. The outer screen does not fold: choose fold flat, or the inner screen.</p>}
      {shown.map((frame) => (
        <section key={frame.id} data-gallery="platforms-screen" aria-labelledby={`duo-${frame.id}`}>
          <h2 id={`duo-${frame.id}`}>{frame.name}</h2>
          <div data-gallery="duo-row">
            {shownModes.map((m) => (
              <DeviceFigure key={m.id} frame={frame} mode={m.id} name={m.name} src={withBase(`/platforms/duo/screen?${frameQuery(params, frame, m.id, view, placement)}`)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** One drawn device with its screen. Physical hardware: always left to right, whatever the page direction. */
function DeviceFigure({ frame, mode, name, src }: { frame: Frame; mode: Mode; name: string; src: string }) {
  const page = mode === 'safari' ? frame.safari.page : { x: 0, y: 0, w: frame.w, h: frame.h };
  const size = mode === 'safari' ? `${page.w} by ${page.h}` : `${frame.w} by ${frame.h}`;
  return (
    <figure data-gallery="duo-figure" data-duo-frame={frame.id} data-duo-mode={mode}>
      <div
        data-gallery="duo-device"
        data-duo-screen={frame.screen}
        data-duo-orient={frame.orient}
        data-duo-hinge={frame.hinge}
        dir="ltr"
        style={vars({ w: frame.w, h: frame.h })}
      >
        <div data-gallery="duo-screen">
          <iframe title={`${frame.name}, ${name}`} src={src} width={page.w} height={page.h} style={rectVars(page)} />
          {mode === 'safari' &&
            frame.safari.chrome.map((c, i) => (
              // Safari's own chrome: not ours to draw, so a plain shape in the page colour. Inert and hidden from assistive tech.
              <div key={i} data-gallery="duo-chrome" data-kind={c.kind} aria-hidden="true" inert style={rectVars(c.rect)}>
                <span data-gallery="duo-chrome-shape" />
                {c.kind === 'column' && <span data-gallery="duo-chrome-shape" />}
              </div>
            ))}
          <span data-gallery="duo-camera" data-inner={frame.camera.inner || undefined} aria-hidden="true" style={vars({ cx: frame.camera.x, cy: frame.camera.y })} />
          {frame.band && (
            <span data-gallery="duo-fold" data-axis={frame.band.axis} aria-hidden="true" style={vars({ start: frame.band.start, size: frame.band.size })} />
          )}
        </div>
      </div>
      <figcaption>
        {name}, {size}
        {frame.fold === 'folded' && mode === 'safari' ? ', flat size, folded size not published' : ''}
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------ the screen inside a frame */

const copy = {
  en: {
    title: 'Settings',
    edit: 'Edit list',
    range: 'Sync range',
    day: 'Day',
    week: 'Week',
    month: 'Month',
    sync: 'Sync',
    mobile: 'Sync over mobile data',
    previews: 'Show previews',
    account: 'Account',
    privacy: 'Privacy',
    share: 'Share board',
    sheetTitle: 'Share Spring launch',
    sheetText: 'People with the link can view the board.',
    invite: 'Invite by email',
    discard: 'Discard invite',
    send: 'Send invite',
    tabs: 'Main',
    home: 'Home',
    search: 'Search',
    inbox: 'Inbox',
    boards: 'Recent boards',
    more: 'More boards',
    cards: [
      { id: 'dawn', title: 'Spring launch', note: '24 cards' },
      { id: 'tide', title: 'Brand review', note: '12 cards' },
    ],
    rows: [
      { id: 'dawn', title: 'Launch plan', note: 'Edited today' },
      { id: 'ember', title: 'Colour study', note: 'Edited yesterday' },
      { id: 'lake', title: 'Store page', note: 'Edited on Monday' },
      { id: 'moss', title: 'Field notes', note: 'Edited last week' },
    ],
  },
  ar: {
    title: 'الإعدادات',
    edit: 'تعديل القائمة',
    range: 'مدة المزامنة',
    day: 'يوم',
    week: 'أسبوع',
    month: 'شهر',
    sync: 'المزامنة',
    mobile: 'المزامنة ببيانات الجوال',
    previews: 'عرض المعاينات',
    account: 'الحساب',
    privacy: 'الخصوصية',
    share: 'مشاركة اللوحة',
    sheetTitle: 'مشاركة لوحة إطلاق الربيع',
    sheetText: 'أي أحد عنده الرابط يقدر يشوف اللوحة.',
    invite: 'الدعوة بالبريد',
    discard: 'إلغاء الدعوة',
    send: 'إرسال الدعوة',
    tabs: 'التنقل الرئيسي',
    home: 'الرئيسية',
    search: 'البحث',
    inbox: 'الوارد',
    boards: 'آخر اللوحات',
    more: 'لوحات أكثر',
    cards: [
      { id: 'dawn', title: 'إطلاق الربيع', note: '24 بطاقة' },
      { id: 'tide', title: 'مراجعة الهوية', note: '12 بطاقة' },
    ],
    rows: [
      { id: 'dawn', title: 'خطة الإطلاق', note: 'تعديل اليوم' },
      { id: 'ember', title: 'دراسة الألوان', note: 'تعديل أمس' },
      { id: 'lake', title: 'صفحة المتجر', note: 'تعديل يوم الاثنين' },
      { id: 'moss', title: 'ملاحظات الميدان', note: 'تعديل الأسبوع الماضي' },
    ],
  },
};

type Words = (typeof copy)['en'];

/*
 * The art is the M6 content of /platforms (Platforms.tsx does not export its
 * pieces, so the markup is repeated here; the drawing is the shared
 * platforms.css, shown on ios only).
 */
function ArtTop({ w }: { w: Words }) {
  return (
    <section data-gallery="phone-art" aria-label={w.boards}>
      <div data-gallery="phone-art-cards">
        {w.cards.map((c) => (
          <figure key={c.id} data-gallery="phone-art-card">
            <div data-gallery="phone-art-cover" data-art={c.id} />
            <figcaption>
              <strong>{c.title}</strong>
              <span>{c.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function ArtBottom({ w }: { w: Words }) {
  return (
    <section data-gallery="phone-art" aria-label={w.more}>
      <div data-gallery="phone-art-tiles">
        {(['ember', 'moss', 'dusk', 'lake'] as const).map((t) => (
          <div key={t} data-gallery="phone-art-cover" data-art={t} />
        ))}
      </div>
      <ul data-gallery="phone-art-list">
        {w.rows.map((r) => (
          <li key={r.title}>
            <div data-gallery="phone-art-cover" data-art={r.id} />
            <span>
              <strong>{r.title}</strong>
              <span>{r.note}</span>
            </span>
          </li>
        ))}
      </ul>
      <div data-gallery="phone-art-cover" data-art="wide" />
    </section>
  );
}

/** The insets of the full screen mode as token overrides. Physical sides: the right inset is the end in English and the start in Arabic. */
function insetOverrides(insets: Insets, rtl: boolean): Record<string, string> {
  const px = (n: number) => `calc(${n} * var(--ds-space-px))`;
  return {
    '--ds-inset-safe-top': px(insets.top),
    '--ds-inset-safe-bottom': px(insets.bottom),
    '--ds-inset-safe-end': px(rtl ? insets.left : insets.right),
    '--ds-inset-safe-start': px(rtl ? insets.right : insets.left),
  };
}

/**
 * The gallery only fold attribute and band, for the folded frames. It
 * stands for what `(horizontal-viewport-segments: 2)` (landscape, a band
 * down the middle) and `(vertical-viewport-segments: 2)` (portrait, a band
 * across) turn on. The offset is from the page's own top or left edge.
 */
function foldOverrides(frame: Frame, mode: Mode): { attr?: 'horizontal' | 'vertical'; style: Record<string, string> } {
  if (!frame.band) return { style: {} };
  const page = mode === 'safari' ? frame.safari.page : { x: 0, y: 0 };
  const offset = frame.band.start - (frame.band.axis === 'x' ? page.x : page.y);
  return {
    attr: frame.band.axis === 'x' ? 'horizontal' : 'vertical',
    style: {
      '--gallery-fold-start': `calc(${offset} * var(--ds-space-px))`,
      '--gallery-fold-size': `calc(${frame.band.size} * var(--ds-space-px))`,
    },
  };
}

/** One screen inside a device frame. */
export function DuoScreen({ params }: { params: URLSearchParams }) {
  const frame = frameById(params.get('frame'));
  const mode = pick(params, 'mode', ['safari', 'full'] as const) ?? 'safari';
  const view = pick(params, 'view', ['settings', 'sheet'] as const) ?? 'settings';
  const placement = pick(params, 'placement', ['auto', 'bottom', 'side'] as const) ?? 'auto';
  const theme = useTheme();
  const rtl = theme.dir === 'rtl';
  const fold = foldOverrides(frame, mode);
  const css = { ...(mode === 'full' ? insetOverrides(frame.full, rtl) : {}), ...fold.style } as CSSProperties;
  return (
    <Theme data-gallery="duo-theme" data-gallery-segments={fold.attr} data-duo-mode={mode} css={css}>
      <DuoPhone words={theme.lang === 'ar' || theme.lang.startsWith('ar-') ? copy.ar : copy.en} view={view} placement={placement} />
    </Theme>
  );
}

function DuoPhone({ words: w, view, placement }: { words: Words; view: View; placement: Placement }) {
  // PageShell is the size container the iOS layer reads (ds-shell). Its
  // placement reaches the TabBar and the Navbar through its context (DU1);
  // until the bars read it, they stay where M1 put them.
  return (
    <PageShell data-gallery="duo-shell" placement={placement}>
      <div data-gallery="phone">
        <Navbar
          label="App"
          brand={
            <Link href="#home" standalone size="lg">
              {w.title}
            </Link>
          }
          items={[]}
          end={<Button emphasis="ghost">{w.edit}</Button>}
        />
        <div data-gallery="phone-body">
          <ArtTop w={w} />
          <SegmentedControl aria-label={w.range} defaultValue="week" fullWidth>
            <SegmentedControlItem value="day">{w.day}</SegmentedControlItem>
            <SegmentedControlItem value="week">{w.week}</SegmentedControlItem>
            <SegmentedControlItem value="month">{w.month}</SegmentedControlItem>
          </SegmentedControl>
          <List variant="inset" aria-label={w.sync}>
            <ListItem start="download" title={w.mobile} actions={<Switch aria-label={w.mobile} defaultChecked />} />
            <ListItem start="bell" title={w.previews} actions={<Switch aria-label={w.previews} />} />
            <ListItem start="user" title={w.account} description="sara@example.com" href="#account" />
            <ListItem start="lock" title={w.privacy} href="#privacy" />
          </List>
          <Sheet defaultOpen={view === 'sheet'}>
            <SheetTrigger>
              <Button tone="accent" emphasis="solid">
                {w.share}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle>{w.sheetTitle}</SheetTitle>
              <SheetDescription>{w.sheetText}</SheetDescription>
              <SheetBody>
                <Field label={w.invite}>
                  <Input placeholder="name@example.com" />
                </Field>
              </SheetBody>
              <SheetFooter>
                <SheetClose>
                  <Button>{w.discard}</Button>
                </SheetClose>
                <SheetClose>
                  <Button tone="accent" emphasis="solid">
                    {w.send}
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <ArtBottom w={w} />
        </div>
        <div data-gallery="phone-tabs">
          <TabBar aria-label={w.tabs}>
            <TabBarItem href="#home" icon="home" label={w.home} />
            <TabBarItem href="#search" icon="search" label={w.search} />
            <TabBarItem href="#inbox" icon="inbox" label={w.inbox} badge={3} />
            <TabBarItem href="#settings" icon="settings" label={w.title} active />
          </TabBar>
        </div>
      </div>
    </PageShell>
  );
}
