// The host of the iOS test screens (order M10.0, docs/plan/reset-ios-families.md
// section 5). Three pages under one route:
//
//   /screens/ios                  the index: every screen, its order, status,
//                                 families, references and frames
//   /screens/ios/<id>             one screen in its device frames
//   /screens/ios/<id>/screen      the screen alone, as each frame's iframe
//                                 loads it (chrome=0, platform=ios, or
//                                 platform=android when the URL asks)
//
// URL keys, besides the axes every gallery page reads (style, scheme, dir,
// lang, density, contrast, glass):
//
//   frame=phone|duo-outer|duo-inner   left out: the default set of frames
//   orient=portrait|landscape         the folding iPhone only, default portrait
//   mode=full|safari                  the folding iPhone only, default full
//
// The screen renders inside a Theme with platform ios (android when the URL
// has platform=android, so the screens can be audited there), in a PageShell with
// placement auto (kit.tsx, ScreenShell), so on the folding iPhone the bars
// move to the side column by themselves. In full screen mode the screen sets
// the frame's safe area insets as token overrides on its Theme element, as
// the /platforms/duo screen does.
//
// The frames are drawn here, from the point sizes of Duo.tsx (frames.ts):
// Duo.tsx exports no frame part to reuse.
import type { CSSProperties } from 'react';
import { Theme, useTheme } from '@the-system/react';
import { axisControls } from '../axes';
import { Link, withBase } from '../router';
import { DEFAULT_VARIANTS, VARIANTS, readVariant, variantQuery, type FrameVariant, type Insets, type Rect } from './frames';
import { ART_NAMES, Art, langOf } from './kit';
import { screenById, screens } from './screens';
import type { ScreenModule } from './types';
import '../ios-screens.css';

const BASE_PATH = '/screens/ios';

/* ------------------------------------------------------------ URLs */

/**
 * The platform the screens run on: ios, or android when the URL asks for it.
 * Any other value (web, macos, auto) gives ios, the platform they are built for.
 */
function screenPlatform(params: URLSearchParams): 'ios' | 'android' {
  return params.get('platform') === 'android' ? 'android' : 'ios';
}

/** The axes of the current URL. Platform is kept only when it is android: the screens run on ios otherwise. */
function axesOf(params: URLSearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const control of axisControls) {
    if (control.key === 'platform') {
      if (screenPlatform(params) === 'android') out.set('platform', 'android');
      continue;
    }
    const value = params.get(control.key);
    if (value) out.set(control.key, value);
  }
  return out;
}

function withQuery(path: string, q: URLSearchParams): string {
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

/** The framed page of a screen, keeping the current axes. No variant: every default frame. */
export function screenHref(id: string, params: URLSearchParams, variant?: FrameVariant): string {
  const q = axesOf(params);
  if (variant) for (const [k, v] of Object.entries(variantQuery(variant))) q.set(k, v);
  return withQuery(`${BASE_PATH}/${id}`, q);
}

/** The screen alone, for a frame's iframe. */
function bareHref(id: string, params: URLSearchParams, variant: FrameVariant): string {
  const q = axesOf(params);
  for (const [k, v] of Object.entries(variantQuery(variant))) q.set(k, v);
  q.set('platform', screenPlatform(params));
  q.set('chrome', '0');
  return withBase(withQuery(`${BASE_PATH}/${id}/screen`, q));
}

/* ------------------------------------------------------------ the route */

/** Every path under /screens/ios. App.tsx sends them all here. */
export function IosScreensRoute({ path, params }: { path: string; params: URLSearchParams }) {
  const parts = path
    .slice(BASE_PATH.length)
    .split('/')
    .filter(Boolean)
    .map((p) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return '';
      }
    });
  const screen = parts[0] !== undefined ? screenById(parts[0]) : undefined;

  if (parts.length === 0) return <IosScreensIndex params={params} />;
  if (!screen || parts.length > 2 || (parts.length === 2 && parts[1] !== 'screen')) return <NoScreen params={params} />;
  if (parts.length === 2) return <BareScreen screen={screen} params={params} />;
  return <FramedScreen screen={screen} params={params} />;
}

function NoScreen({ params }: { params: URLSearchParams }) {
  return (
    <div data-gallery="ios-screens-index">
      <h1>No screen at this address</h1>
      <p>
        <Link href={withQuery(BASE_PATH, axesOf(params))}>Open the list of iOS screens</Link>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ the index */

function IosScreensIndex({ params }: { params: URLSearchParams }) {
  return (
    <div data-gallery="ios-screens-index">
      <h1>iOS screens</h1>
      <p data-gallery="ios-note">
        Whole screens built only from our components, each rebuilt from one reference screen of a native iOS app: the same structure, proportion
        and behaviour, with our own names, places and generated artwork. Each screen shows on the phone, 393 by 852, and on the folding
        iPhone&apos;s outer and inner screens. The style, scheme, direction and language come from the address, as on every gallery page.
      </p>
      <div data-gallery="ios-table-box">
        <table data-gallery="ios-table">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Screen</th>
              <th scope="col">Families it proves</th>
              <th scope="col">References</th>
              <th scope="col">Frames</th>
            </tr>
          </thead>
          <tbody>
            {screens.map(({ meta }) => (
              <tr key={meta.id}>
                <td>{meta.order}</td>
                <td>
                  <p>
                    <Link href={screenHref(meta.id, params)}>{meta.id}</Link>
                  </p>
                  <p>
                    {meta.title}. {meta.status === 'stub' ? 'Not built yet.' : 'Built.'}
                  </p>
                </td>
                <td>{meta.families.join(', ')}</td>
                <td>
                  <ul data-gallery="ios-links">
                    {meta.references.map((r) => (
                      <li key={r.href}>
                        <a href={r.href} rel="noreferrer" target="_blank">
                          {r.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  <ul data-gallery="ios-links">
                    {DEFAULT_VARIANTS.filter((v) => meta.frames.includes(v.frame)).map((v) => (
                      <li key={v.key}>
                        <Link href={screenHref(meta.id, params, v)}>{shortName(v)}</Link>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section aria-labelledby="ios-kit-art">
        <h2 id="ios-kit-art">Artwork in the content kit</h2>
        <p data-gallery="ios-note">Gradients and plain shapes in the chart colours of the current style, for covers, banners and people.</p>
        <ul data-gallery="ios-art-sheet">
          {ART_NAMES.map((name) => (
            <li key={name}>
              <Art art={name} />
              <span>{name}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** A short name for a frame link. */
function shortName(v: FrameVariant): string {
  if (v.frame === 'phone') return 'Phone';
  const screen = v.frame === 'duo-outer' ? 'Outer' : 'Inner';
  return `${screen}, ${v.orient}, ${v.mode === 'full' ? 'full screen' : 'Safari'}`;
}

/* ------------------------------------------------------------ one screen in its frames */

function FramedScreen({ screen, params }: { screen: ScreenModule; params: URLSearchParams }) {
  const { meta } = screen;
  const asked = readVariant(params);
  const supported = (v: FrameVariant) => meta.frames.includes(v.frame);
  const shown = asked ? [asked].filter(supported) : DEFAULT_VARIANTS.filter(supported);
  return (
    <div data-gallery="ios-screens">
      <h1>
        {meta.order} {meta.id}
      </h1>
      <p data-gallery="ios-note">
        {meta.title}. {meta.status === 'stub' ? 'Not built yet: the empty screen of the host.' : ''}
      </p>
      <dl data-gallery="ios-meta">
        <div>
          <dt>Families</dt>
          <dd>{meta.families.join(', ')}</dd>
        </div>
        <div>
          <dt>References</dt>
          <dd>
            <ul data-gallery="ios-links">
              {meta.references.map((r) => (
                <li key={r.href}>
                  <a href={r.href} rel="noreferrer" target="_blank">
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>Frames</dt>
          <dd>
            <ul data-gallery="ios-links">
              <li>
                <Link href={screenHref(meta.id, params)} aria-current={asked ? undefined : 'page'}>
                  Every frame
                </Link>
              </li>
              {VARIANTS.filter(supported).map((v) => (
                <li key={v.key}>
                  <Link href={screenHref(meta.id, params, v)} aria-current={asked?.key === v.key ? 'page' : undefined}>
                    {shortName(v)}
                  </Link>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      {shown.length === 0 && <p data-gallery="ios-note">This screen is not shown in that frame.</p>}
      <div data-gallery="ios-row">
        {shown.map((v) => (
          <Device key={v.key} variant={v} title={`${meta.id}, ${v.name}`} src={bareHref(meta.id, params, v)} />
        ))}
      </div>
    </div>
  );
}

/** Unitless point numbers as custom properties; ios-screens.css multiplies them by the 1px token. */
function vars(entries: Record<string, number>): CSSProperties {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(entries)) out[`--ios-${k}`] = v;
  return out as CSSProperties;
}

function rectVars(r: Rect): CSSProperties {
  return vars({ x: r.x, y: r.y, w: r.w, h: r.h });
}

/** One drawn device with the screen in it. Physical hardware: always left to right. */
function Device({ variant: v, title, src }: { variant: FrameVariant; title: string; src: string }) {
  return (
    <figure data-gallery="ios-figure" data-variant={v.key}>
      <div data-gallery="ios-device" data-frame={v.frame} data-orient={v.orient} data-hinge={v.hinge} dir="ltr" style={vars({ w: v.w, h: v.h })}>
        <div data-gallery="ios-display" data-variant={v.key}>
          <iframe title={title} src={src} width={v.page.w} height={v.page.h} style={rectVars(v.page)} />
          {v.chrome.map((c, i) => (
            // Safari's own chrome: not ours to draw, so plain shapes in the page colour. Inert and hidden from assistive tech.
            <div key={i} data-gallery="ios-chrome" data-kind={c.kind} aria-hidden="true" inert style={rectVars(c.rect)}>
              <span data-gallery="ios-chrome-shape" />
              {c.kind === 'column' && <span data-gallery="ios-chrome-shape" />}
            </div>
          ))}
          <span data-gallery="ios-camera" data-shape={v.camera.shape} data-faint={v.camera.faint || undefined} aria-hidden="true" style={vars({ cx: v.camera.x, cy: v.camera.y })} />
          {v.homeBar && <span data-gallery="ios-home-bar" aria-hidden="true" />}
        </div>
      </div>
      <figcaption>
        {v.name}, {v.page.w} by {v.page.h}
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------ the screen alone */

/** The insets of the frame as token overrides. Physical sides: the right inset is the end in English and the start in Arabic. */
function insetOverrides(insets: Insets, rtl: boolean): CSSProperties {
  const px = (n: number) => `calc(${n} * var(--ds-space-px))`;
  return {
    '--ds-inset-safe-top': px(insets.top),
    '--ds-inset-safe-bottom': px(insets.bottom),
    '--ds-inset-safe-end': px(rtl ? insets.left : insets.right),
    '--ds-inset-safe-start': px(rtl ? insets.right : insets.left),
  } as CSSProperties;
}

function BareScreen({ screen, params }: { screen: ScreenModule; params: URLSearchParams }) {
  const variant = readVariant(params) ?? DEFAULT_VARIANTS[0] ?? VARIANTS[0];
  const theme = useTheme();
  if (!variant) return null;
  const lang = langOf(theme.lang);
  const { Screen } = screen;
  return (
    <Theme
      platform={screenPlatform(params)}
      data-gallery="ios-screen-theme"
      data-ios-screen={screen.meta.id}
      data-variant={variant.key}
      css={variant.mode === 'full' ? insetOverrides(variant.insets, theme.dir === 'rtl') : undefined}
    >
      <Screen variant={variant} lang={lang} />
    </Theme>
  );
}
