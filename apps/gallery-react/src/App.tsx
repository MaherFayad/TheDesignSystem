import { Suspense, lazy, useEffect, type ComponentType, type LazyExoticComponent } from 'react';
import { Theme, themeAttributes, useTheme, type ThemeAxesInput } from '@the-system/react';
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
  const axes = readAxes(params);
  const chrome = params.get('chrome') !== '0';
  const caseId = readCase(params);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const slug = path.startsWith('/c/') ? decodeURIComponent(path.slice(3)) : undefined;
  const route = slug !== undefined ? routes.find((r) => r.slug === slug) : undefined;
  useDocumentTheme(axes);

  useEffect(() => {
    document.title = route ? `${route.name}, gallery` : path === '/all' ? 'Every demo, gallery' : 'Gallery';
  }, [route, path]);

  let page;
  if (path === '/') page = <Index query={axisQuery(params)} />;
  else if (path === '/all') page = <KitchenSink />;
  else if (route) page = <DemoView slug={route.slug} />;
  else page = <NotFound />;

  return (
    <Theme {...axes} id="gallery-root" data-gallery="root">
      {chrome && <Shell params={params} title={route?.name} />}
      <main data-gallery="stage" data-gallery-case={caseId}>
        {caseId && (
          <style>{`[data-gallery-case='${caseId}'] [data-demo-case]:not([data-demo-case='${caseId}']) { display: none; }`}</style>
        )}
        <Suspense fallback={<p data-gallery="loading">Loading the demo</p>}>{page}</Suspense>
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

function DemoView({ slug }: { slug: string }) {
  const Demo = demos.get(slug);
  return Demo ? <Demo /> : <NotFound />;
}

/** Every demo on one page, for screenshots. */
function KitchenSink() {
  return (
    <div data-gallery="sink">
      {routes.map((r) => {
        const Demo = demos.get(r.slug);
        return (
          <section key={r.slug} data-gallery="sink-item" data-gallery-slug={r.slug}>
            <h1>{r.name}</h1>
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
