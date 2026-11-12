import { Component, Suspense, lazy, useEffect, type ComponentType, type ErrorInfo, type LazyExoticComponent, type ReactNode } from 'react';
import { DEFAULT_STYLE, Theme, styleIds, themeAttributes, useTheme, type ThemeAxesInput } from '@the-system/react';
import { axisControls, axisQuery, readAxes, readCase } from './axes';
import { Link, navigate, useUrl } from './router';
import { routes } from './routes.gen';

const demos = new Map<string, LazyExoticComponent<ComponentType>>(routes.map((r) => [r.slug, lazy(r.load)]));

/** Stamps the resolved axes on <html> too, so the whole viewport is themed and lang and dir are right. */
function useDocumentTheme(axes: ThemeAxesInput): void {
  const { style, scheme, density, contrast, platform, glass, dir, lang } = axes;
  useEffect(() => {
    const attrs = themeAttributes({ style, scheme, density, contrast, platform, glass, dir, lang });
    const html = document.documentElement;
    for (const [name, value] of Object.entries(attrs)) html.setAttribute(name, value);
  }, [style, scheme, density, contrast, platform, glass, dir, lang]);
}

export function App() {
  const url = useUrl();
  const params = url.searchParams;
  const asked = readAxes(params);
  // A style id that is not in the registry has no token CSS, so nothing would
  // paint. The gallery uses the default style instead and says so.
  const unknownStyle = asked.style !== undefined && !styleIds.includes(asked.style) ? asked.style : undefined;
  const axes = unknownStyle ? { ...asked, style: DEFAULT_STYLE } : asked;
  const chrome = params.get('chrome') !== '0';
  const caseId = readCase(params);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const slug = path.startsWith('/c/') ? safeDecode(path.slice(3)) : undefined;
  const route = slug !== undefined ? routes.find((r) => r.slug === slug) : undefined;
  useDocumentTheme(axes);

  useEffect(() => {
    document.title = route ? `${route.name}, gallery` : path === '/all' ? 'Every demo, gallery' : 'Gallery';
  }, [route, path]);

  let page;
  if (path === '/') page = <Index query={axisQuery(params)} />;
  else if (path === '/all') page = <KitchenSink />;
  else if (route) page = <DemoView slug={route.slug} name={route.name} />;
  else page = <NotFound />;

  return (
    <Theme {...axes} id="gallery-root" data-gallery="root">
      {chrome && <Shell params={params} title={route?.name} />}
      <main data-gallery="stage" data-gallery-case={caseId}>
        {unknownStyle && (
          <p data-gallery="note" role="status">
            No style called {unknownStyle}. Showing {DEFAULT_STYLE}.
          </p>
        )}
        {caseId && (
          <style>{`[data-gallery-case='${caseId}'] [data-demo-case]:not([data-demo-case='${caseId}']) { display: none; }`}</style>
        )}
        <DemoBoundary key={path}>
          <Suspense fallback={<p data-gallery="loading">Loading the demo</p>}>{page}</Suspense>
        </DemoBoundary>
      </main>
    </Theme>
  );
}

/** The bar with navigation and one select per axis. Always English, left to right. */
function Shell({ params, title }: { params: URLSearchParams; title: string | undefined }) {
  const resolved = useTheme();
  const query = axisQuery(params);
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const s = next.toString();
    // replaceState, not pushState: an axis change is a view setting, so the
    // back button leaves the demo instead of stepping through every select.
    navigate(`${window.location.pathname}${s ? `?${s}` : ''}`, { replace: true });
  };
  return (
    <Theme as="header" lang="en" data-gallery="shell">
      <nav data-gallery="nav" aria-label="Gallery">
        <Link href={`/${query}`}>Components</Link>
        <Link href={`/all${query}`}>Every demo</Link>
        {title && <span data-gallery="current">{title}</span>}
      </nav>
      <form data-gallery="axes" aria-label="Theme axes" onSubmit={(e) => e.preventDefault()}>
        {axisControls.map((control) => (
          <label key={control.key} data-gallery="axis">
            <span>{control.label}</span>
            <select value={params.get(control.key) ?? ''} onChange={(e) => set(control.key, e.target.value)}>
              <option value="">Auto: {String(resolved[control.key])}</option>
              {control.values.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        ))}
      </form>
    </Theme>
  );
}

function Index({ query }: { query: string }) {
  return (
    <div data-gallery="index">
      <h1>Components</h1>
      <ul>
        {routes.map((r) => (
          <li key={r.slug}>
            <Link href={`/c/${r.slug}${query}`}>{r.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One demo under its name as the page heading (small, so it works with chrome=0 too). */
function DemoView({ slug, name }: { slug: string; name: string }) {
  const Demo = demos.get(slug);
  if (!Demo) return <NotFound />;
  return (
    <div data-gallery="demo">
      <h1 data-gallery="demo-title">{name}</h1>
      <Demo />
    </div>
  );
}

/** Every demo on one page, for screenshots. */
function KitchenSink() {
  return (
    <div data-gallery="sink">
      <h1>Every demo</h1>
      {routes.map((r) => {
        const Demo = demos.get(r.slug);
        return (
          <section key={r.slug} data-gallery="sink-item" data-gallery-slug={r.slug}>
            <h2>{r.name}</h2>
            {Demo && <Demo />}
          </section>
        );
      })}
    </div>
  );
}

function NotFound() {
  return (
    <div data-gallery="index">
      <h1>No demo at this address</h1>
      <p>
        <Link href="/">Open the component list</Link>
      </p>
    </div>
  );
}

/** A malformed path such as /c/%E0 is not a demo: it shows the not found page. */
function safeDecode(part: string): string | undefined {
  try {
    return decodeURIComponent(part);
  } catch {
    return undefined;
  }
}

/** Shows a message when a demo throws, instead of a blank page. Reset by the key on navigation. */
class DemoBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  override state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  override render() {
    if (this.state.error) {
      return (
        <div data-gallery="index" role="alert">
          <h1>This demo failed to render</h1>
          <p>{this.state.error.message}</p>
          <p>
            <Link href="/">Open the component list</Link>
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
