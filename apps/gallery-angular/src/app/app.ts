// The Angular gallery: the same routes, query keys and shell DOM as the React
// gallery (apps/gallery-react/src/App.tsx), so screenshots and the contract
// suite compare like for like. A tiny History API router: `/`, `/all` and
// `/c/<slug>`.
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
  type Type,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { DsTheme, DsThemeService, applyDocumentTheme, styleIds } from '@the-system/angular';
import { GALLERY_STYLE, axisControls, axisQuery, nameOf, readAxes, readCase } from './axes';
import { routes } from './routes.gen';

const EVENT = 'gallery:navigate';

function navigate(to: string, replace = false): void {
  if (replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  window.dispatchEvent(new Event(EVENT));
}

/** The shell's select values read the resolved theme of the shell's parent, like React's useTheme. */
@Component({
  selector: 'header[data-gallery=shell]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav data-gallery="nav" aria-label="Gallery">
      <a [href]="'/' + query()" (click)="go($event, '/' + query())">Components</a>
      <a [href]="'/all' + query()" (click)="go($event, '/all' + query())">Every demo</a>
      @if (current(); as c) {
        <span data-gallery="current">{{ c }}</span>
      }
    </nav>
    <form data-gallery="axes" aria-label="Theme axes" (submit)="$event.preventDefault()">
      @for (control of controls; track control.key) {
        <label data-gallery="axis">
          <span>{{ control.label }}</span>
          <select (change)="set(control.key, $any($event.target).value)">
            <option value="" [selected]="!params().get(control.key)">Auto: {{ resolved()[control.key] }}</option>
            @for (v of control.values; track v) {
              <option [value]="v" [selected]="params().get(control.key) === v">{{ v }}</option>
            }
          </select>
        </label>
      }
    </form>
  `,
})
export class Shell {
  readonly params = input.required<URLSearchParams>();
  readonly current = input<string | undefined>(undefined);
  protected readonly controls = axisControls;
  protected readonly query = computed(() => axisQuery(this.params()));
  // The theme around the shell element (the gallery root), as React reads it.
  protected readonly resolved = inject(DsThemeService, { skipSelf: true }).value;

  protected go(event: MouseEvent, to: string): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  }

  protected set(key: string, value: string): void {
    const next = new URLSearchParams(this.params());
    if (value) next.set(key, value);
    else next.delete(key);
    const s = next.toString();
    navigate(`${window.location.pathname}${s ? `?${s}` : ''}`, true);
  }
}

@Component({
  selector: 'div#app',
  imports: [DsTheme, Shell, NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div dsTheme id="gallery-root" data-gallery="root"
      [style]="axes().style" [scheme]="axes().scheme" [density]="axes().density" [contrast]="axes().contrast"
      [platform]="axes().platform" [glass]="axes().glass" [dir]="axes().dir" [lang]="axes().lang">
      @if (chrome()) {
        <header dsTheme [lang]="'en'" data-gallery="shell" [params]="params()" [current]="route()?.name"></header>
      }
      <main #stage data-gallery="stage" [attr.data-gallery-case]="caseId() ?? null">
        @if (unknownStyle(); as u) {
          <p data-gallery="note" role="status">No style called {{ u }}. Showing {{ defaultStyle }}.</p>
        }
        @switch (page()) {
          @case ('index') {
            <div data-gallery="index">
              <h1>Components</h1>
              <ul>
                @for (r of list; track r.slug) {
                  <li><a [href]="'/c/' + r.slug + query()" (click)="go($event, '/c/' + r.slug + query())">{{ r.name }}</a></li>
                }
              </ul>
            </div>
          }
          @case ('all') {
            <div data-gallery="sink">
              <h1>Every demo</h1>
              @for (r of list; track r.slug) {
                <section data-gallery="sink-item" [attr.data-gallery-slug]="r.slug">
                  <h2>{{ r.name }}</h2>
                  @if (loaded()[r.slug]; as demo) {
                    <ng-container *ngComponentOutlet="demo" />
                  }
                </section>
              }
            </div>
          }
          @case ('demo') {
            @if (route(); as r) {
              @if (loaded()[r.slug]; as demo) {
                <div data-gallery="demo">
                  <h1 data-gallery="demo-title">{{ r.name }}</h1>
                  <ng-container *ngComponentOutlet="demo" />
                </div>
              } @else if (failed()) {
                <div data-gallery="index" role="alert">
                  <h1>This demo failed to render</h1>
                  <p>{{ failed() }}</p>
                  <p><a href="/" (click)="go($event, '/')">Open the component list</a></p>
                </div>
              } @else {
                <p data-gallery="loading">Loading the demo</p>
              }
            }
          }
          @default {
            <div data-gallery="index">
              <h1>No demo at this address</h1>
              <p><a href="/" (click)="go($event, '/')">Open the component list</a></p>
            </div>
          }
        }
      </main>
    </div>
  `,
})
export class App {
  private readonly href = signal(window.location.href);
  private readonly url = computed(() => new URL(this.href()));
  protected readonly params = computed(() => this.url().searchParams);
  private readonly asked = computed(() => readAxes(this.params()));
  protected readonly unknownStyle = computed(() => {
    const s = this.asked().style;
    return s !== undefined && !styleIds.includes(s) ? s : undefined;
  });
  // No style asked, or one not in the registry: the gallery shows GALLERY_STYLE.
  protected readonly axes = computed(() =>
    this.asked().style === undefined || this.unknownStyle() ? { ...this.asked(), style: GALLERY_STYLE } : this.asked(),
  );
  protected readonly chrome = computed(() => this.params().get('chrome') !== '0');
  protected readonly caseId = computed(() => readCase(this.params()));
  protected readonly query = computed(() => axisQuery(this.params()));
  private readonly path = computed(() => this.url().pathname.replace(/\/+$/, '') || '/');
  protected readonly list = routes.map((r) => ({ ...r, name: nameOf(r.slug) }));
  protected readonly route = computed(() => {
    const path = this.path();
    if (!path.startsWith('/c/')) return undefined;
    let slug: string;
    try {
      slug = decodeURIComponent(path.slice(3));
    } catch {
      return undefined;
    }
    return this.list.find((r) => r.slug === slug);
  });
  protected readonly page = computed(() => {
    const path = this.path();
    if (path === '/') return 'index';
    if (path === '/all') return 'all';
    if (this.route()) return 'demo';
    return 'missing';
  });
  protected readonly loaded = signal<Record<string, Type<unknown>>>({});
  protected readonly failed = signal<string | null>(null);
  protected readonly defaultStyle = GALLERY_STYLE;
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private caseStyle: HTMLStyleElement | null = null;

  constructor() {
    const sync = () => this.href.set(window.location.href);
    window.addEventListener('popstate', sync);
    window.addEventListener(EVENT, sync);

    // Stamps the resolved axes on <html> too, so the whole viewport is themed.
    effect(() => applyDocumentTheme(this.axes()));

    effect(() => {
      const r = this.route();
      const path = this.path();
      document.title = r ? `${r.name}, gallery` : path === '/all' ? 'Every demo, gallery' : 'Gallery';
    });

    // Loads the demos the page needs.
    effect(() => {
      const page = this.page();
      const wanted = page === 'all' ? this.list : page === 'demo' && this.route() ? [this.route()!] : [];
      for (const r of wanted) {
        if (this.loaded()[r.slug]) continue;
        r.load().then(
          (type) => this.loaded.update((m) => ({ ...m, [r.slug]: type })),
          (err: unknown) => {
            console.error(err);
            this.failed.set(err instanceof Error ? err.message : String(err));
          },
        );
      }
    });

    // case=<id>: the same style rule the React gallery renders in a style element.
    effect(() => {
      const id = this.caseId();
      const stage = this.stage().nativeElement;
      if (!id) {
        this.caseStyle?.remove();
        this.caseStyle = null;
        return;
      }
      if (!this.caseStyle) {
        this.caseStyle = document.createElement('style');
        stage.prepend(this.caseStyle);
      }
      this.caseStyle.textContent = `[data-gallery-case='${id}'] [data-demo-case]:not([data-demo-case='${id}']) { display: none; }`;
    });
  }

  protected go(event: MouseEvent, to: string): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  }
}
