"use client";
// PageShell: the frame of a page. A skip link, a header, the navigation
// column (a Sidebar or a Rail), the main content, an aside and a footer,
// each in its landmark.
//
// Sources: GoBanana `[locale]/layout.tsx` and admin `AdminNav.tsx` were not
// reachable in this session. The frame follows the dials table in PLAN.md
// 3.7 (Studio: rail, sidebars, inspector; Neutral: sidebar, top bar, cards)
// and the nearest components: SkipLink, Sidebar, Rail, Navbar, Drawer.
//
//   <div data-ds="page-shell" data-sidebar>
//     <a data-ds="skip-link" data-part="skip" href="#main">     the first tab stop
//     <header data-part="header">                              banner
//       <button data-ds="icon-button" data-part="menu">        opens the navigation Drawer; only while the column is hidden
//       ...header
//     <div data-part="nav">                                    holds a Sidebar or a Rail, itself the nav landmark
//     <main data-part="main" id="main">                        the one main, the skip target
//     <aside data-part="aside" aria-label>                     complementary
//     <footer data-part="footer">                              contentinfo
//
// Decisions:
// - The nav part is a plain element: Sidebar and Rail are each a labelled
//   nav landmark already, and a second nav around them would read twice.
// - data-sidebar is expanded, collapsed or hidden. hidden means the column
//   is not drawn: under breakpoint.tablet always, and on wide screens when
//   the app hides it. While hidden, the menu button opens the same
//   navigation in a Drawer from the inline start.
// - The app keeps one state for the column through usePageShell(): pass
//   `collapsed={sidebar === 'collapsed'}` to the Sidebar so the toggle in it
//   and the shell agree.
// - `embedded` draws the same frame without landmarks, for a page shown
//   inside another page (a gallery, docs, a template picker). Landmarks must
//   be unique on a page, and main must not sit inside another main.
import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from "react";
import { useTheme } from "../../theme/hooks";
import { useControllable } from "../../internal/useControllable";
import { Drawer, DrawerBody, DrawerContent, DrawerTrigger } from "../Drawer";
import { IconButton } from "../IconButton";
import { SkipLink } from "../SkipLink";

/** The navigation column: drawn full, drawn as icons, or not drawn (reached through the menu button). */
export type PageShellSidebar = "expanded" | "collapsed" | "hidden";

const shellWords = {
  en: {
    menu: "Open navigation",
    drawer: "Navigation",
    main: "Main content",
    aside: "More on this page",
  },
  ar: {
    menu: "فتح التنقل",
    drawer: "التنقل",
    main: "المحتوى الرئيسي",
    aside: "تفاصيل إضافية",
  },
} as const;

/** The query for breakpoint.tablet. Media queries cannot read custom properties. */
const NARROW_QUERY = "(width < 48rem)"; // breakpoint.tablet

interface PageShellContextValue {
  /** The state the root shows: hidden on narrow screens whatever the app set. */
  sidebar: PageShellSidebar;
  /** The state the app set for wide screens. */
  wideSidebar: PageShellSidebar;
  setSidebar: (next: PageShellSidebar) => void;
  /** True under breakpoint.tablet: the navigation lives in the Drawer. */
  narrow: boolean;
  /** Opens or closes the navigation Drawer. */
  setDrawerOpen: (open: boolean) => void;
}

const PageShellContext = createContext<PageShellContextValue | null>(null);

/** The column state of the nearest PageShell, to wire a Sidebar's collapsed prop. */
export function usePageShell(): PageShellContextValue {
  const ctx = use(PageShellContext);
  if (!ctx) throw new Error("usePageShell must be used inside a PageShell.");
  return ctx;
}

/** True under breakpoint.tablet, after hydration. The server draws the wide frame; CSS hides the column on narrow screens from the first paint. */
function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia(NARROW_QUERY);
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return narrow;
}

export interface PageShellProps extends Omit<
  ComponentProps<"div">,
  "title" | "children"
> {
  /** The top bar: a Navbar, or a brand and actions. Rendered in the header landmark. */
  header?: ReactNode;
  /** The navigation: a Sidebar or a Rail (each its own labelled nav landmark). */
  nav?: ReactNode;
  /** Secondary content next to main: an inspector, related links. On narrower screens it goes under main. */
  aside?: ReactNode;
  /** The accessible name of the aside landmark. Default "More on this page". */
  asideLabel?: string;
  /** Rendered in the footer landmark. */
  footer?: ReactNode;
  /** The page content, in main. */
  children?: ReactNode;
  /** The id of main, the skip link target. Default "main". Keep one per page. */
  mainId?: string;
  /** The skip link text. Default "Skip to main content". */
  skipLabel?: string;
  /** The column state on wide screens, controlled, with onSidebarChange. */
  sidebar?: PageShellSidebar;
  /** Default expanded. */
  defaultSidebar?: PageShellSidebar;
  onSidebarChange?: (next: PageShellSidebar) => void;
  /** The accessible name of the menu button. Default "Open navigation". */
  menuLabel?: string;
  /** The title of the navigation Drawer, visually its header. Default "Navigation". */
  drawerTitle?: string;
  /**
   * A preview of a page inside another page: the same frame, with no
   * landmarks (main becomes a labelled region). Default false.
   */
  embedded?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/** The frame of a page, with its landmarks and a skip link first. */
export function PageShell({
  header,
  nav,
  aside,
  asideLabel,
  footer,
  children,
  mainId = "main",
  skipLabel,
  sidebar: sidebarProp,
  defaultSidebar = "expanded",
  onSidebarChange,
  menuLabel,
  drawerTitle,
  embedded = false,
  ref,
  ...rest
}: PageShellProps) {
  const theme = useTheme();
  const words =
    theme.lang === "ar" || theme.lang.startsWith("ar-")
      ? shellWords.ar
      : shellWords.en;
  const [wideSidebar, setSidebar] = useControllable(
    sidebarProp,
    defaultSidebar,
    onSidebarChange,
  );
  const narrow = useNarrow();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hasNav = nav !== undefined && nav !== null && nav !== false;
  const hasHeader = header !== undefined && header !== null && header !== false;
  const sidebar: PageShellSidebar = !hasNav || narrow ? "hidden" : wideSidebar;

  // The Drawer is for a hidden column only: it closes when the column shows again.
  useEffect(() => {
    if (sidebar !== "hidden") setDrawerOpen(false);
  }, [sidebar]);

  const value = useMemo<PageShellContextValue>(
    () => ({ sidebar, wideSidebar, setSidebar, narrow, setDrawerOpen }),
    [sidebar, wideSidebar, setSidebar, narrow],
  );

  const Header = embedded ? "div" : "header";
  const Main = embedded ? "div" : "main";
  const Aside = embedded ? "div" : "aside";
  const Footer = embedded ? "div" : "footer";

  return (
    <PageShellContext value={value}>
      <div {...rest} ref={ref} data-ds="page-shell" data-sidebar={sidebar}>
        <SkipLink data-part="skip" href={`#${mainId}`}>
          {skipLabel}
        </SkipLink>
        {(hasNav || hasHeader) && (
          <Header data-part="header">
            {hasNav && (
              <Drawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                side="start"
                size="sm"
              >
                <IconButton
                  data-part="menu"
                  icon="menu"
                  label={menuLabel ?? words.menu}
                  aria-haspopup="dialog"
                  aria-expanded={drawerOpen}
                  // Not a DrawerTrigger: that would stamp data-state on a part of a shell that has no open state.
                  // Focus still returns here on close: DialogBase gives it back to what had it on open.
                  onClick={() => setDrawerOpen(true)}
                />
                <DrawerContent title={drawerTitle ?? words.drawer}>
                  <DrawerBody>{nav}</DrawerBody>
                </DrawerContent>
              </Drawer>
            )}
            {header}
          </Header>
        )}
        {hasNav && (
          // The column is not drawn while hidden: its links are in the Drawer then, never twice in the page.
          <div data-part="nav" hidden={sidebar === "hidden" || undefined}>
            {sidebar !== "hidden" && nav}
          </div>
        )}
        <Main
          data-part="main"
          id={mainId}
          tabIndex={-1}
          role={embedded ? "region" : undefined}
          aria-label={embedded ? words.main : undefined}
        >
          {children}
        </Main>
        {aside !== undefined && aside !== null && aside !== false && (
          <Aside
            data-part="aside"
            aria-label={asideLabel ?? words.aside}
            role={embedded ? "group" : undefined}
          >
            {aside}
          </Aside>
        )}
        {footer !== undefined && footer !== null && footer !== false && (
          <Footer data-part="footer">{footer}</Footer>
        )}
      </div>
    </PageShellContext>
  );
}
