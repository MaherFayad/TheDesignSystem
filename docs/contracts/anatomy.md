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
- The root part is the element with `data-ds`. It does not also carry
  `data-part`.
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
