# Framework contract

Full detail: sections 3.1 and 3.5 of PLAN.md.

## Layers

| Layer | Shared | Per framework |
| --- | --- | --- |
| Tokens | DTCG JSON, one build | CSS variables (web), theme objects (native) |
| Look | `packages/css`, used by React and Angular byte for byte | Native: a style function per component |
| Logic | `packages/shared`, pure TypeScript | None |
| Behavior | Anatomy and keyboard map in the manifest | Radix (React), CDK and Angular Aria (Angular), RN Primitives (native) |

- Anything that can be pure TypeScript goes in `packages/shared`.
- React writes the component CSS. Angular may not change it. If the Angular
  DOM cannot match the CSS, that is a contract bug: stop and report.
- React Native never imports from `packages/css`.

## React

- React 19: `ref` is a prop, no `forwardRef`.
- Interactive files start with `"use client"`.
- No `window` access at module scope.
- Behavior from `radix-ui` (the unified package). No primitives marked Preview.
- Files: `packages/react/src/components/<Name>/` with `<Name>.tsx`,
  `<Name>.test.tsx`, `<Name>.demo.tsx`, `index.ts`.
- Props spread onto the root. `className` and `style` pass through.

## Angular

- Standalone components, signal inputs (`input()`), OnPush, zoneless safe.
- Attribute selectors so the host is the part: `button[dsButton]`,
  `[dsDialogTitle]`. No wrapper element that React does not have.
- Host bindings set `data-ds`, `data-part` and the variant and state
  attributes. Input names equal the React prop names.
- Behavior from `@angular/cdk` first, then `@angular/aria`. Angular Aria is
  imported only inside `packages/angular/src/behavior/`.
- Direction through the CDK `Directionality`.
- Files: `packages/angular/src/components/<name>/` with `<name>.ts`,
  `<name>.spec.ts`, `<name>.demo.ts`, `index.ts`.

## React Native

- Same component names, prop names and values as React.
- `testID="ds-<component>-<part>"`. States through `accessibilityState`.
- Behavior from `@rn-primitives/*`. Animation from Reanimated 4.
- Styles: `create<Component>Styles(theme, variants)` in `<Component>.styles.ts`
  with `StyleSheet`. No inline color or size literals. A gate enforces this.
- Style recipes: `packages/styles/<id>/native/<Component>.ts`.
- Touch targets: 44pt on iOS, 48dp on Android.
- Respect safe areas, the keyboard, font scale to 200%, reduce motion and
  reduce transparency.
- RTL through `I18nManager`. A direction change needs an app restart.
- Glass: `expo-glass-effect` when available, otherwise the designed fallback.

## Runtime axes

| Axis | Web attribute | Values |
| --- | --- | --- |
| Style | `data-style` | `studio`, `desk`, `neutral`, `liquid`, `paper`, any custom id |
| Scheme | `data-scheme` | `dark`, `light` |
| Density | `data-density` | `compact`, `default`, `comfortable` |
| Contrast | `data-contrast` | `default`, `more` |
| Platform | `data-platform` | `web`, `ios`, `android` |
| Glass | `data-glass` | `clear`, `regular`, `tinted` |
| Direction and language | `dir`, `lang` | `ltr` or `rtl`, `en` or `ar` |

On React Native a `ThemeProvider` passes the resolved theme object through
context and takes the same axis names as props.

## Package imports

Packages export source during development (see DECISIONS.md).

```ts
import { Button, Theme } from '@the-system/react';
import '@the-system/tokens/css';      // tokens for every style
import '@the-system/css';             // reset, base, components
import '@the-system/styles';          // recipes for every style
```
