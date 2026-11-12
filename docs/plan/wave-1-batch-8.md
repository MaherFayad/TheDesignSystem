# Wave 1, batch 8: layout (12)

Rules, standard set, checklist and constraints: `docs/plan/wave-1.md`. Every
order is owned by ds-component, `installs: no`. Starts when batch 7 is green.

Layout components are mostly not interactive: their demos still show every
content case that applies (empty, one, many, too many, long text, long
Arabic), and they use only `space`, `size` and `breakpoint` tokens. Gap and
padding props take token step names (`2xs` to `12xl`), never numbers.

## Lanes

| Step | Lane | Components (in order) | Starts when |
| --- | --- | --- | --- |
| 1 | 8A Primitives | Stack, Grid, Container, AspectRatio, Separator | batch 7 green |
| 1 | 8B Surfaces | Surface, Section, Bento | batch 7 green |
| 1 | 8C Panes | ScrollArea, ResizablePanels, SplitView, PageShell | batch 7 green |

Slot 4 runs 1.13 Registry, then 1.14 CLI. PageShell renders SkipLink (1.7.11).

## 1.8.1 Stack

- Goal: one dimension layout with a token gap.
- Behavior: hand built; `asChild` through Radix Slot or an `as` prop for the
  element.
- Anatomy: root (`data-ds="stack"`).
- Props: `direction` (`block`, `inline`), `gap`, `align`, `justify`, `wrap`.
- States: `data-orientation`.
- Keys: none.
- Read: FK2 `Stack/` (all files).
- Owns: standard set for Stack.
- Depends: none.
- Accept: checklist; logical alignment words (`start`, `end`) only.

## 1.8.2 Grid

- Goal: a two dimension layout with responsive columns.
- Behavior: hand built.
- Anatomy: root (`data-ds="grid"`), `item` (optional span wrapper).
- Props: `columns` (number or `auto-fit` with a min item size token), `gap`,
  `rowGap`.
- States: none.
- Keys: none.
- Read: GB css `.st-tile-grid` (lines 976 to 984).
- Owns: standard set for Grid.
- Depends: 1.8.1 (same lane).
- Accept: checklist; one column under `breakpoint.phone` unless told
  otherwise; no sideways scroll at 320px.

## 1.8.3 Container

- Goal: the centered max width wrapper with the page gutter.
- Behavior: hand built.
- Anatomy: root (`data-ds="container"`).
- Props: `size` (`sm`, `md`, `lg`, `xl`, `full` as max inline sizes), `gutter`.
- States: none.
- Keys: none.
- Read: GB site/`landing.css` (page widths), `breakpoint` tokens.
- Owns: standard set for Container.
- Depends: 1.8.2 (same lane).
- Accept: checklist; 16px gutter on phones (fluid `space` token).

## 1.8.4 Section

- Goal: a titled region of a page or panel, optionally collapsible.
- Behavior: hand built `section` with a heading; collapsible form on Radix
  Collapsible.
- Anatomy: root (`data-ds="section"`), `header`, `title`, `description`,
  `actions`, `toggle`, `body`.
- Axes: size (`sm`, `md`).
- States: `data-state` (`open`, `closed`) when collapsible.
- Keys: toggle Enter and Space.
- Read: GB css lines 1068 to 1135 (`.st-section`), FK2 `Section/` (all
  files), GB admin/`ui.tsx` (`Section`).
- Owns: standard set for Section.
- Depends: 1.8.5 (same lane).
- Accept: checklist; heading level is a prop (`level`), never guessed;
  `accordion-height` motion when collapsible.

## 1.8.5 Surface

- Goal: a plain background box on a surface step (body, surface 1 to 5) with
  optional border and elevation.
- Behavior: hand built.
- Anatomy: root (`data-ds="surface"`).
- Props: `level` (`body`, `1` to `5`), `bordered`, `elevation` (`none`,
  `card`, `panel`), `radius` (token names), `padding`.
- States: none.
- Keys: none.
- Read: GB `studio-tokens.css` surface steps (via
  `docs/contracts/token-mapping.md`), FK2 `Widget/`.
- Owns: standard set for Surface.
- Depends: none.
- Accept: checklist; Liquid note in the manifest (content surfaces stay
  solid).

## 1.8.6 Separator

- Goal: a line between groups.
- Behavior: Radix Separator (decorative or semantic).
- Anatomy: root (`data-ds="separator"`), `label` (optional centered text).
- Axes: none. `data-orientation`.
- States: `data-orientation`.
- Keys: none.
- Read: FK2 `Separator/`, GB css `.st-menu-sep` (lines 521 to 528).
- Owns: standard set for Separator.
- Depends: 1.8.10 (same lane).
- Accept: checklist; `color.border.subtle`; 3:1 only when it carries meaning.

## 1.8.7 ScrollArea

- Goal: a scroll container with styled scrollbars that keeps native
  scrolling.
- Behavior: Radix ScrollArea.
- Anatomy: root (`data-ds="scroll-area"`), `viewport`, `scrollbar`, `thumb`,
  `corner`, `fade-start`, `fade-end` (edge fades).
- Axes: size (scrollbar `sm`, `md`).
- States: `data-orientation`, `data-overflow-start`, `data-overflow-end`.
- Keys: native scrolling; the viewport is focusable when it has no
  focusable child (`tabindex="0"`, labelled).
- Read: GB admin/`ui.tsx` (`TableScroll`), FK2 `FilterBar/FilterBar.tsx`
  (edge fades).
- Owns: standard set for ScrollArea.
- Depends: none.
- Accept: checklist; scrollbar on the inline end flips in RTL; no custom
  wheel handling.

## 1.8.8 ResizablePanels

- Goal: two or more panels with draggable dividers (editor layouts).
- Behavior: hand built on the WAI-ARIA window splitter pattern
  (`role="separator"`, `aria-valuenow`, focusable).
- Anatomy: root (`data-ds="resizable-panels"`), `panel`, `handle`,
  `handle-grip`.
- Axes: none. `data-orientation`.
- States: `data-orientation`; handles `data-dragging`; panels
  `data-collapsed`.
- Keys: ArrowLeft and ArrowRight (or Up and Down) resize by a step
  (reading direction); Home and End to min and max; Enter collapses and
  restores. The drag has this key path (WCAG 2.5.7).
- Shared: `packages/shared/src/resize.ts`: sizes in percent, `clampSizes`,
  `resizeBy(handle, delta)`, collapse thresholds, pure.
- Read: no source: design from the dials table and the nearest existing
  component (Slider keys). Studio inspector widths in
  `packages/tokens/src/base/component.json`.
- Owns: standard set for ResizablePanels, `packages/shared/src/resize.ts`.
- Depends: 1.8.7 (same lane).
- Accept: checklist; `contract.keys` hints for arrows as `value-changes`;
  handle target 24px though the line is 1px; layout persists through an
  `onLayout` callback, no storage in the component.

## 1.8.9 SplitView

- Goal: list and detail side by side, stacked on phones (a mail reader).
- Behavior: hand built on ResizablePanels.
- Anatomy: root (`data-ds="split-view"`), `primary`, `secondary`,
  `handle`, `back` (a Button root shown when stacked).
- Axes: none.
- States: `data-state` (`split`, `primary`, `secondary`) by width.
- Keys: as ResizablePanels; back returns focus to the item that opened the
  detail.
- Read: GB desktop/`MailApp.tsx`, GB desktop/`desktop.css` lines 1040 to
  1168.
- Owns: standard set for SplitView.
- Depends: 1.8.8 (same lane).
- Accept: checklist; stacks under `breakpoint.tablet`; no sideways scroll at
  320px.

## 1.8.10 AspectRatio

- Goal: keep media at a ratio.
- Behavior: Radix AspectRatio.
- Anatomy: root (`data-ds="aspect-ratio"`).
- Props: `ratio`.
- States: none.
- Keys: none.
- Read: no source: design from the dials table and the nearest existing
  component (Surface).
- Owns: standard set for AspectRatio.
- Depends: 1.8.3 (same lane).
- Accept: checklist; manifest notes the native `aspect-ratio` property as
  the plain alternative.

## 1.8.11 Bento

- Goal: a grid of tiles of mixed sizes for overviews and landing sections.
- Behavior: hand built on CSS grid.
- Anatomy: root (`data-ds="bento"`), `item` (spans `1x1`, `2x1`, `1x2`,
  `2x2` through `data-span`).
- Axes: none.
- States: none.
- Keys: none (items hold their own controls).
- Read: GB css `.st-tile-grid` and `.st-tile` (lines 974 to 1066), GB
  site/`landing.css`.
- Owns: standard set for Bento.
- Depends: 1.8.4 (same lane).
- Accept: checklist; reading order equals visual order; one column on
  phones; Studio separates by the 1px gap.

## 1.8.12 PageShell

- Goal: the page frame: skip link, header, sidebar or rail, main, aside,
  footer, with landmarks.
- Behavior: hand built.
- Anatomy: root (`data-ds="page-shell"`), `skip` (a SkipLink root),
  `header`, `nav`, `main`, `aside`, `footer`.
- Axes: none.
- States: `data-sidebar` (`expanded`, `collapsed`, `hidden`).
- Keys: SkipLink first.
- Read: GB `banana-server/app/(site)/[locale]/layout.tsx`, GB admin/`AdminNav.tsx`.
- Owns: standard set for PageShell.
- Depends: 1.8.9 (same lane), 1.7.11, 1.7.2.
- Accept: checklist; one `main` with `id="main"`; landmarks labelled; the
  sidebar becomes a Drawer under `breakpoint.tablet`.
