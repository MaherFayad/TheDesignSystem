# Angular proof (order 0.15)

Result: Angular renders the same DOM as React for Button, IconButton and
Dialog, the shared CSS applies with no change, the contract suite passes
against the Angular gallery (73 of 73), and the screenshots match the React
baselines pixel for pixel (0 differing pixels in all 15 images).

No file in `packages/css` or `packages/styles` was changed.

## What was built

| Path | What |
| --- | --- |
| `packages/angular/src/theme/` | `DsTheme` (`[dsTheme]`), `DsThemeService` (resolved axes as a signal, `optionalPart(component, part)`), `resolveTheme`, `themeAttributes`, `applyDocumentTheme` (stamps `<html>`), `styleIds`, `DEFAULT_STYLE`. Each dsTheme provides the CDK `Directionality` and the icon style to its subtree. |
| `packages/angular/src/components/button/` | `DsButton` (`button[dsButton], a[dsButton]`) on the shared base directive `DsButtonBase`. |
| `packages/angular/src/components/icon-button/` | `DsIconButton` (`button[dsIconButton], a[dsIconButton]`). |
| `packages/angular/src/components/dialog/` | `DsDialog` (on an `ng-container`), `DsDialogTrigger`, `DsDialogContent` (on an `ng-template`), `DsDialogClose`, `DsDialogBody`, `DsDialogFooter`, `DsDialogTitle`, `DsDialogDescription`, and the internal portal layer. |
| `packages/angular/src/components/title-bar/`, `window-controls/` | The minimum Dialog needs for the Desk chrome, same DOM as React. No demo yet. |
| `packages/angular/src/components/field/`, `input/` | The minimum the Dialog demo needs (label, required mark, description, error; the input box and its control). No demo yet. Their manifests are not in this order. |
| `packages/angular/src/behavior/` | The modal behavior on the CDK: Tab wrapping with the CDK `InteractivityChecker`, scroll lock, hiding the rest of the page, waiting for exit animations. |
| `packages/angular/src/demo/` | The demo kit: `section[data-demo=case]`, `div[data-demo=row]`, the same `sample` copy. |
| `packages/angular/src/internal/host.ts` | Removes static input attributes and selector markers from host elements (see findings). |
| `packages/icons/templates/angular/icon.ts.tpl` | Now a Directive. `label` check equals React (`!== undefined`). Stale set attributes are removed on a set change. The icon style is a signal, so icons follow a style change. Generated to `packages/icons/src/angular/`. |
| `apps/gallery-angular/` | Angular CLI app, zoneless, the same routes and query keys as React (`/`, `/all`, `/c/<slug>`, the axes, `case`, `chrome`). The same three CSS entry points, plus `demo.css` and the React shell's `gallery.css` imported by path. `npm run dev` honors `PORT` and an explicit `--port`. |

Unit tests: `button.spec.ts`, `icon-button.spec.ts`, `dialog.spec.ts`,
`theme.spec.ts` (21 tests) on Angular's unit test builder with Vitest and
jsdom. `npm run check -w @the-system/angular` runs `ngc` (strict templates,
host binding type checks) and the tests in about 15 seconds. The gallery's
check is a development build (about 7 seconds).

Manifests: the `angular` block of Button, IconButton, Dialog and Theme is
`ready`. TitleBar, WindowControls and Icon stay `planned` with notes: a port
exists, but no Angular demo covers it on its own yet.

## Versions and TypeScript

| Package | Version | Where |
| --- | --- | --- |
| `@angular/core`, `@angular/common` | 22.2.6 | `packages/angular` dependencies, gallery |
| `@angular/cdk` | 22.2.7 | `packages/angular` dependencies, gallery (brings `@angular/forms` 22.2.6 as its own dependency) |
| `@angular/compiler`, `@angular/compiler-cli`, `@angular/platform-browser`, `@angular/build`, `@angular/cli` | 22.2.6 | dev, both workspaces |
| `rxjs` ^7.8.2, `tslib` ^2.9.1 | | gallery, as Angular's peers |

Not installed: `@angular/aria` (not needed, see below), `@angular/router`
(the gallery uses a small History API router like the React one), zone.js
(zoneless), ng-packagr.

TypeScript: Angular 22 asks for `>=6.0 <6.1`. The root has TypeScript 6.0.3
(not 7.x as the order expected), so there is one shared copy and nothing is
nested. `@angular/build` is nested in each Angular workspace because it pins
its own Vite (8.3.5) next to the root Vite. The root `npm run check` passes.

## DOM comparison

Method: both galleries in Chromium through Playwright. For each page the
script walks every `[data-demo-case]` section, or with a dialog open the
`[data-dialog-layer]` portal, and writes one line per element: tag name and
attributes sorted by name, plus trimmed text. Ids and the attributes that
point at ids (`for`, `aria-labelledby`, `aria-describedby`,
`aria-controls`) are renamed in order of appearance, so Radix and Angular
ids compare. Dropped: `data-aria-hidden` and `style="pointer-events: ..."`
(Radix internals). Comments are ignored. The script is
`docs/reports/shots/angular/compare-dom.mjs`.

| Pages | Comparisons | Lines compared | Differences |
| --- | --- | --- | --- |
| Button, IconButton, Dialog page (closed), Studio, Desk, Desk rtl ar | 9 | about 4,200 | none |
| Every dialog trigger open (19 triggers), Studio, Desk, Desk rtl ar | 57 | about 2,200 | `aria-modal="true"` on the panel only |

The one difference is on purpose: the order asks for `aria-modal`. Radix
does not set it (it hides the rest of the page with `aria-hidden`). The
Angular panel does both. React could add it too.

## Pixel comparison

Viewport 1280 by 800, device scale 1, reduced motion, `animations:
'disabled'`, fonts loaded. Button and IconButton are full page shots; the
dialog shot opens the `md` trigger. pixelmatch threshold 0.1. Files:
`react-<id>.png`, `angular-<id>.png`, `diff-<id>.png` and `results.json` in
`docs/reports/shots/angular/`. Script: `compare-shots.mjs`.

| Image | Size | Differing pixels | Percent |
| --- | --- | --- | --- |
| button, studio dark | 1280x2011 | 0 | 0 |
| button, studio light | 1280x2011 | 0 | 0 |
| button, desk dark | 1280x2011 | 0 | 0 |
| button, desk light | 1280x2011 | 0 | 0 |
| button, desk dark rtl ar | 1280x2057 | 0 | 0 |
| icon-button, studio dark | 1280x1693 | 0 | 0 |
| icon-button, studio light | 1280x1693 | 0 | 0 |
| icon-button, desk dark | 1280x1693 | 0 | 0 |
| icon-button, desk light | 1280x1693 | 0 | 0 |
| icon-button, desk dark rtl ar | 1280x1726 | 0 | 0 |
| dialog open, studio dark | 1280x800 | 0 | 0 |
| dialog open, studio light | 1280x800 | 0 | 0 |
| dialog open, desk dark | 1280x800 | 0 | 0 |
| dialog open, desk light | 1280x800 | 0 | 0 |
| dialog open, desk dark rtl ar | 1280x800 | 0 | 0 |

## Contract suite

`npm run contract -- --framework angular` starts the gallery with
`npm run dev -- --port <port>` and runs the same suite as React, with no
Angular special case: Button 21, IconButton 21, Dialog 31, all passed
(anatomy in both styles, variant and state attributes, the keyboard map with
the modal Tab loop and Escape, target size, reflow at 320px, axe in every
style, scheme and direction, closed and open). Report:
`docs/reports/contract-angular.json`. The suite needed no change.

## The CDK decision

The CDK Dialog does not fit the DOM. It renders a `cdk-dialog-container`
element around the content, which would sit between the root and the panel
and break every `[data-ds='dialog'] > [data-part='panel']` selector, plus
the overlay container, the global wrapper and the pane. The CDK FocusTrap
inserts two focusable anchor elements next to the trapped element, which
would become children of the dialog root.

Chosen: a CDK `ComponentPortal` attached through a `DomPortalOutlet` to
`document.body`. The portal component's selector is `div[data-dialog-layer]`,
so Angular creates its host element with exactly that attribute: the host is
the themed portal wrapper itself, with every axis copied from the opening
dsTheme. Inside: the root, the backdrop and the panel, as in React. The
focus trap wraps Tab itself and asks the CDK `InteractivityChecker` what is
tabbable. Escape and Tab go to the top dialog of a stack, so nested dialogs
close one at a time. The exit sets `data-state="closed"`, waits one render,
then waits for `getAnimations()` on the panel and the backdrop (none under
reduced motion, so it closes at once) and then detaches.

A trap found on the way: `DomPortalOutlet.dispose()` removes its outlet
element. With `document.body` as the outlet it removed the body. The layer
detaches instead of disposing.

## What the contract could not express in Angular

1. **The `style` input.** A directive input named `style` works with a
   binding (`[style]="'desk'"`), but a static `style="desk"` never reaches
   it: the compiler parses a static style attribute as inline CSS at build
   time and drops "desk". The theme then silently follows its parent. dsTheme
   keeps the React names (`style`, plus `css` for inline styles) and also
   takes the style on its selector, `dsTheme="desk"`. Suggest the contract
   name `dsTheme="<id>"` as the Angular form.
2. **Static attributes stay in the DOM.** Angular writes every static
   attribute to the element, also the ones a directive consumes as inputs,
   and the selector marker: `<button dsButton tone="accent" disabled>` gets
   `dsbutton=""`, `tone="accent"` and the native `disabled`, which takes the
   button out of the tab order, against "actions use aria-disabled and stay
   focusable". Each directive removes its marker and input attributes from
   its host once created (`internal/host.ts`). With that, the DOM matches
   React attribute for attribute. Suggest the contract say so for Angular.
3. **Input names equal React prop names, with three exceptions.**
   `asChild` has no Angular form: the attribute selector already makes
   `a[dsButton]` the link. `onOpenChange` is the `openChange` output of the
   `open` model (`[(open)]`). WindowControls keeps `onClose`, `onMinimize`,
   `onZoom` as function inputs, because a light with no handler must be
   disabled and an output cannot tell whether anyone listens.
4. **Nodes as props.** React passes nodes to `start`, `end`, `icon`,
   `title`. Angular takes an icon name or a `TemplateRef`; TitleBar also
   takes its title as an `ng-template dsTitleBarTitle`.
5. **Native props on an inner element.** React spreads native props on the
   `<input>` inside Input. Angular cannot forward attributes from the host
   to an element in the template, so `type`, `placeholder`, `value` and
   `autofocus` (data-autofocus) are inputs.
6. **DI follows the declaration, not the projection.** A dsTheme inside a
   component's template stamps the attributes on the DOM (the CSS follows),
   but it is not the DI parent of content projected into it. React's
   `DemoCase lang="ar"` wraps its children in a Theme; the Angular demos
   write that `div dsTheme data-demo="content"` themselves, else a dialog
   opened inside would copy the outer theme.
7. **Title lifting.** React lifts a DialogTitle child into the Desk title
   bar. Angular content cannot be inspected that way; the `title` input of
   `dsDialogContent` is the Angular form, and a `dsDialogTitle` renders in
   place, like a React DialogTitle that is not a direct child.
8. **`as` is a template keyword.** TitleBar keeps the input name `as`, but
   the template reads it through a computed.
9. **Gate case.** `ds/no-native-title` (packages/lint/src/rules/no-native-title.ts)
   flags `<div dsTitleBar [title]="...">`, a property binding to a directive
   input that never reaches the DOM as an attribute. The Dialog uses
   `ng-template dsTitleBarTitle` instead, so the gate passes. Suggest: skip
   `[title]` (not `title` or `[attr.title]`) on an element that carries a
   system directive.

## Angular Aria today

`@angular/aria` 22.2.7 is stable: the Angular roadmap says it moved from
developer preview (v21) to stable in v22. Its patterns are Accordion,
Autocomplete, Combobox, Grid, Listbox, Menu, Menubar, Multiselect, Select,
Tabs, Toolbar and Tree. It has no Dialog and no Button, so it is not
installed for this order. Wave 1 Select, Menu, Tabs and Combobox should use
it, imported only inside `packages/angular/src/behavior/`.

## What wave 1 should take from this

- The pattern works: attribute selectors, host bindings, a template that
  renders the parts in React's order, and the input attribute cleanup. Port
  DOM first, then compare with `compare-dom.mjs` before looking at pixels.
- Overlays: CDK Portal plus own behavior gives the exact DOM; the CDK Dialog
  and Overlay pane do not. Popovers will need CDK positioning without the
  pane wrapper; check `FlexibleConnectedPositionStrategy` on our own element.
- Theme resolution, axis types and the dialog focus rule are now written
  twice (React and Angular). They are pure TypeScript and belong in
  `packages/shared`.
- Bind inputs that collide with native attributes (`disabled`, `title`,
  `style`, `lang`, `hidden`) or let the directive strip them; a gate could
  check that every static attribute on a `ds*` host is an input or a
  contract attribute.
- Angular's unit test builder (Vitest, jsdom) needs tsconfig `paths` to the
  workspace sources, else it loads them as external packages untranspiled.
- The Angular dev server needs `prebundle: false` for workspace packages
  that export TypeScript source.
