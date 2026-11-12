# Anatomy contract

React and Angular render the same DOM. The CSS in `packages/css` styles that
DOM and nothing else. Full detail: section 3.5 of PLAN.md.

## Attributes

| What | Attribute | Values |
| --- | --- | --- |
| Root element | `data-ds="<component-kebab>"` | for example `button`, `dialog`, `icon-button` |
| Part | `data-part="<part>"` | names from the manifest `anatomy` list |
| Size | `data-size` | `xs`, `sm`, `md`, `lg` (overlays may add `xl`, `2xl`) |
| Tone | `data-tone` | `neutral`, `accent`, `success`, `warning`, `danger`, `info` |
| Emphasis | `data-emphasis` | `solid`, `soft`, `outline`, `ghost`, `link` |
| Shape | `data-shape` | `default`, `pill`, `square` |
| State | `data-state`, `data-disabled`, `data-orientation`, `data-loading`, `data-invalid`, `data-readonly`, `data-selected`, `data-dragging` | never a class |

- No component invents another word for size, tone, emphasis or shape.
- Boolean state attributes are present with an empty value when true and
  absent when false.
- The root part is the element with `data-ds`. It does not carry
  `data-part="root"`.
- A component used as a named part of a parent may carry both: its own
  `data-ds` and the parent's `data-part` (for example the close IconButton of
  a Window: `data-ds="icon-button" data-part="close"`).
- A part belongs to the nearest ancestor root, not counting the element
  itself. A manifest lists only its own parts. Parts of a nested component
  (the `title` inside a TitleBar inside a Window) belong to that component's
  manifest.
- A component may add boolean state attributes of its own (for example
  `data-zoomed`, `data-minimized`) when its manifest lists them under
  `states`. They follow the same rule: present and empty when true.
- A presentational example that has no open or closed behavior does not
  stamp `data-state`.
- Every interactive element comes from the system. No bare `<button>` outside
  the Button implementation.
- Controls are at least 24 by 24 CSS px (`size.target-min`). `lg` is 44px.

## CSS file shape

One file per component: `packages/css/src/components/<Name>.css`.

```css
@layer ds.base {
  [data-ds='button'] { ... }
  [data-ds='button'][data-size='sm'] { ... }
  [data-ds='button'] > [data-part='label'] { ... }
}
```

- Base rules go in `ds.base`. Style pack recipes go in `ds.recipes` and are
  scoped with `[data-style='<id>']` on an ancestor.
- Tokens only. Logical properties only. Only `transform` and `opacity`
  animate. Durations and eases come from tokens.
- Everything collapses under `prefers-reduced-motion`.
- Translucent surfaces turn solid under `prefers-reduced-transparency` and
  `prefers-contrast: more`, and under `[data-contrast='more']`.
- No `!important`.

## One convention for component CSS and props

Decided on 2026-11-12 after the review of Button and Input. Every component
follows it.

1. **Two kinds of custom property.**
   - Public component tokens, `--ds-<component>-<part>-<property>`, come only
     from the token build. Component CSS never declares a `--ds-*` name.
   - Private plumbing, `--_<component>-<name>`, is declared on the root in
     the component CSS. `<component>` is the full `data-ds` value. A private
     property defaults to a public component token where one exists, else
     to a semantic token. Names, in this order of preference:
     - The base list: `height`, `padding-inline`, `padding-block`, `gap`,
       `font-size`, `font-weight`, `radius`, `bg`, `fg`, `border-color`,
       `border-style`, `ring`, `shadow`, with the state suffixes `-hover`,
       `-active`, `-focus`, `-disabled`, `-invalid`, `-checked`,
       `-readonly`.
     - A part name in front of a base name, for a part's own look:
       `-<part>-<base name>` (`--_alert-title-fg`, `--_bento-item-bg`,
       `--_phone-field-code-bg`, `--_description-list-term-fg`), or a part
       name alone when the part has one color (`--_alert-icon`,
       `--_toast-edge`, `--_spinner-arc`, `--_spinner-track`,
       `--_scroll-area-thumb`). The part need not be in the anatomy list
       when it is drawn by a pseudo element or a nested root
       (`--_otp-field-separator-color`, `--_input-autofill-bg`).
     - A working value that only state rules set, read by the declaration:
       `-<name>-now` (`--_radio-group-border-now`, `--_rating-now`). Recipes do not set it.
     - A tone group for the colors a tone swaps as a set:
       `-tone-border`, `-tone-edge`, `-tone-text`, `-tone-tint`,
       `-tone-tint-strong`, `-tone-solid`, `-tone-solid-hover`,
       `-tone-on-solid`, `-tone-on-tint`.
     - Layout plumbing: `columns`, `row`, `template`, `span`, `row-span`,
       `row-gap`, `column-gap`, `min`, `max`, `width`, `size`, `padding`,
       `gutter`, `inset`, `justify`, `label-align`, `label-flex`,
       `fraction`, `fill`, `track`, `fit`, `wrap`, and `item-*` for the
       items of a container.
     - Motion plumbing, read by keyframes or transitions: `duration`,
       `ease`, `duration-in`, `duration-out`, `ease-in`, `ease-out`,
       `enter-scale`, `enter-y`, `lift`, `shift`.
     - Drawing extras: `decoration`, `decoration-hover`, `thickness`,
       `ring-color`, `ring-width`, `veil`, `select`, `backdrop`, `scrim`,
       `scrim-filter`, `blur`, `cursor`, `stroke-width`.
     Any other name needs a line in the component CSS header saying what it
     is.
   - One shared family: every menu surface (DropdownMenu, ContextMenu,
     Menubar, the Combobox, Autocomplete, Select, MultiSelect and TagField
     popups) reads `--_menu-*`, so one recipe shape draws them all. No other
     component may declare `--_menu-*`, and no other shared family exists
     without a line here.
   - Recipes override the private properties. They do not restyle
     declarations directly unless no property covers the need.
2. **States swap properties.** A state selector sets `--_<c>-bg` and friends.
   It does not write `background` or `border-color` itself.
3. **Pseudo elements.** `::before` is the focus or glow layer. `::after` is
   the hover veil. The same in every component.
4. **Focus.** The ring comes from the `focus` tokens. The transparent outline
   for forced colors is set only inside the focus selector, never at rest.
   Every motion or shadow trick has a `forced-colors: active` fallback.
5. **Disabled.** Actions use `aria-disabled` and stay focusable. Text entry
   uses native `disabled`. Both draw disabled with `opacity.disabled`.
6. **Leading and trailing content** is `start` and `end` on every component:
   a system icon name or a node. No `iconStart`, `leftIcon` or `prefix`.
7. **`label`** means visible text, except on icon only components, where it
   is the accessible name and is required.
8. **Prop spread.** For a form control, the native element gets `ref` and the
   rest props, while `className`, `style` and `rootProps` go to the root. For
   everything else, props spread onto the root.
9. **Shared axis types** `Size`, `Tone`, `Emphasis` and `Shape` come from
   `@the-system/shared` (`axes.ts`). A component narrows them with `Extract`.
10. **One CSS file per `data-ds`.** The one exception: a component built on
    another's base (IconButton on Button) is styled in the base's file and
    keeps a thin file of its own for what differs.
11. **Layout and component attributes.** Beyond the anatomy table, a
    component may stamp attributes of its own for layout or for a value a
    prop sets. Each is listed in its manifest `props` or `states` and
    follows the boolean rule above. Pseudo classes (hover, active,
    focus-visible) are not listed under manifest `states`. In use today:

    | Component | Attributes |
    | --- | --- |
    | Controls that can fill their row | `data-full-width` |
    | Stack | `data-gap`, `data-align`, `data-justify`, `data-wrap`, and `data-orientation` for `direction` |
    | Grid | `data-columns`, `data-min`, `data-gap`, `data-row-gap`, `data-keep-columns`; its `item` part `data-span`, `data-row-span` |
    | Bento | `data-columns`, `data-span` |
    | Container | `data-width` (`sm`, `md`, `lg`, `xl`, `full`), `data-gutter` |
    | Surface | `data-level`, `data-padding`, `data-radius`, `data-elevation`, `data-bordered` |
    | AspectRatio | `data-fit` |
    | Separator | `data-decorative`, `data-labelled` |
    | ButtonGroup | `data-attached` |
    | Banner | `data-sticky` |
    | FloatingActionButton | `data-position`, `data-extended` |
    | Toast | `data-position`, `data-swipe` |
    | Accordion, List, Skeleton | `data-variant` |
    | Card, Tile | `data-interactive` |
    | List | `data-linked` |
    | Link | `data-standalone` |
    | StatusDot | `data-pulse`, `data-hide-label` |
    | Stat | `data-trend` |
    | Meter | `data-level` |
    | ScrollArea | `data-overflow-start`, `data-overflow-end` |
    | ResizablePanels | `data-collapsed` |
    | Window | `data-kind`, `data-movable`, `data-layered`, `data-zoomed`, `data-minimized` |
    | NotificationCenter | `data-unread`, `data-list`, `data-entry` |

    `data-variant` names a layout or look that is not one of the shared
    axes. It never stands in for size, tone, emphasis or shape. A page or
    content width is `data-width`, never `data-size`, because `size` is the
    control axis (`xs` to `lg`).
12. **Default size is `md`.** For controls (an element a person presses
    or types in) `md` is 32px (`size.control.md`) at default density, per
    the size table in PLAN.md, even where a source defaulted to 28px. Every
    other component's `md` is the middle of its own scale, named in its
    manifest, and its sizes come from tokens (Icon 16px, Spinner 24px,
    Kbd 24px, ProgressCircle 44px, StatusDot and the ProgressBar track
    8px). A control that must meet a touch target (FloatingActionButton,
    Rail on touch platforms) takes its floor from `size.touch.*` or the
    platform axis, not from `md`.

## Theme element

`Theme` (React) and `dsTheme` (Angular) stamp every axis on their own element
and resolve what is not passed from the nearest parent:

`data-style`, `data-scheme`, `data-density`, `data-contrast`, `data-platform`,
`data-glass`, `dir`, `lang`. It also carries `data-ds="theme"`.

## Demos and the gallery

- Each component has a demo: `<Name>.demo.tsx` (React, default export),
  `<name>.demo.ts` (Angular, default export), `<Name>.demo.tsx` (native).
- A demo renders one section per content case. Each section is an element
  with `data-demo-case="<id>"`. Ids, in order, where they apply:
  `variants`, `empty`, `one`, `many`, `too-many`, `long-text`, `long-arabic`,
  `loading`, `error`, `disabled`, `readonly`.
- The `variants` case shows the matrix of the shared variant axes.
- Gallery URL, the same in React and Angular:
  `/c/<component-kebab>?style=&scheme=&density=&platform=&dir=&lang=&contrast=&glass=`
  Extra query keys: `case=<id>` shows one case only, `chrome=0` hides the
  gallery shell for screenshots.

## React Native

No DOM. Each part gets `testID="ds-<component>-<part>"`. The root gets
`testID="ds-<component>"`. States go through `accessibilityState` and
`accessibilityRole`, from the manifest.
