---
title: Setup
description: Install, the CSS import order, the TypeScript note and the root Theme for React, Angular and React Native.
sidebar:
  order: 1
---

The packages export TypeScript and CSS source during development. Vite,
Vitest, Next (`transpilePackages`) and the Angular builder compile it. The
token CSS is a build output: run the token build before the first dev run.

## React

```json
"dependencies": {
  "@the-system/react": "0.0.0",
  "@the-system/tokens": "0.0.0",
  "@the-system/css": "0.0.0",
  "@the-system/styles": "0.0.0",
  "react": "^19.3.1",
  "react-dom": "^19.3.1"
}
```

Import components from the package entry point only:

```tsx
import { Button, Dialog, Field, Input, Theme } from '@the-system/react';
```

## CSS import order

At the top of the entry file, before anything else:

```ts
import '@the-system/tokens/css'; // tokens for every style
import '@the-system/css';        // reset, base, components
import '@the-system/styles';     // recipes and fonts for every style
```

Your own CSS comes after. It sits outside any `@layer`, so it wins over the
system layers without `!important`. Pass a class to a component through
`className`; it lands on the component root.

## The TypeScript note

Each CSS entry point carries a `types` condition in its `package.json`
exports, so TypeScript resolves the three imports above with no `.d.ts`
declaration of your own.

## The root Theme

Wrap the app once. The Theme stamps the axes on its element and provides
direction to every component inside it.

```tsx
<Theme style="neutral" scheme="dark" lang="en">
  <App />
</Theme>
```

To theme the whole viewport from the first paint (for example in a Next
layout), spread the attributes on `<html>`:

```tsx
import { themeAttributes } from '@the-system/react';

<html {...themeAttributes({ style: 'desk', lang: 'ar' })}>
```

A portal lands outside any Theme element, so overlays wrap their content in a
Theme that copies the axes from `useTheme()`. System overlays already do.

## Angular

Standalone components with attribute selectors, so the host element is the
part: `button[dsButton]`, `[dsDialogTitle]`. Input names equal the React prop
names. The same three CSS imports go in the global styles.

```html
<div dsTheme="neutral" scheme="dark" lang="en">
  <button dsButton tone="accent" emphasis="solid">Save changes</button>
</div>
```

Write the style as `dsTheme="<id>"` or `[style]="id"`. A static
`style="desk"` is read as inline CSS and never reaches the input.

## React Native

Same component names, prop names and values as React. Styles come from
generated theme objects, never from `packages/css`.

```tsx
import { Button, ThemeProvider } from '@the-system/native';

<ThemeProvider style="neutral" scheme="dark">
  <Button tone="accent" emphasis="solid">Save changes</Button>
</ThemeProvider>
```

Direction follows `I18nManager`; a change needs an app restart.
