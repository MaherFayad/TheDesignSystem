---
title: Installation
description: Install the packages for React, Angular or React Native, import the CSS in order, wrap the app in one Theme and render the first Button.
eyebrow: Getting started
---

Four steps take an app from nothing to its first component. The packages are
private for now and live in this repository's npm workspaces.

## 1. Add the packages

Pick the framework. Every framework reads the same tokens and the same style
packs.

### React

```bash
npm install @the-system/react @the-system/tokens @the-system/css @the-system/styles react react-dom
```

### Angular

```bash
npm install @the-system/angular @the-system/tokens @the-system/css @the-system/styles
```

### React Native

```bash
npm install @the-system/native @the-system/tokens react react-native
```

React Native reads generated theme objects, not CSS, so it needs no CSS
import.

## 2. Import the CSS in this order

At the top of the entry file of a React or Angular app, before anything
else. The token build must have run once: `npx tsx packages/tokens/build.ts`.

```ts
import '@the-system/tokens/css'; // tokens for every style
import '@the-system/css';        // reset, base, components
import '@the-system/styles';     // recipes and fonts for every style
```

Your own CSS comes after. It sits outside any `@layer`, so it wins over the
system layers with no `!important`. In Angular, the same three files go in
`styles` in `angular.json`, in the same order.

## 3. Wrap the app in one Theme

The Theme stamps the axes (style, scheme, density, direction, language) on its
element and gives every component inside it the direction.

```tsx
import { Theme } from '@the-system/react';

export function Root() {
  return (
    <Theme style="neutral" scheme="light" lang="en">
      <App />
    </Theme>
  );
}
```

In Angular the Theme is an attribute:

```html
<div dsTheme="neutral" scheme="light" lang="en">
  <app-shell />
</div>
```

In React Native the root is a provider:

```tsx
import { ThemeProvider } from '@the-system/native';

<ThemeProvider style="neutral" scheme="light">
  <App />
</ThemeProvider>
```

For Arabic, set `lang="ar"`. The Theme sets `dir="rtl"`, and every component
mirrors with logical properties.

## 4. Render the first Button

A button label is a verb plus a noun, in sentence case.

```tsx
import { Button } from '@the-system/react';

<Button tone="accent" emphasis="solid">Save changes</Button>
```

```html
<button dsButton tone="accent" emphasis="solid">Save changes</button>
```

```tsx
import { Button } from '@the-system/native';

<Button tone="accent" emphasis="solid">Save changes</Button>
```

The props and their values are the same in all three frameworks. The
[Button page](/components/button/) shows every case with live previews and the
code for each framework.

## Next

- [Pick a style](/styles/) and compare them side by side.
- Read the [runtime axes](/foundations/axes/) to switch scheme, density and
  language at run time.
- See the full [framework setup](/frameworks/setup/), with the TypeScript note
  and how portals keep the theme.
