<!-- ds:init start. Written by `ds init`. A new run replaces the text up to the end marker. -->

# Design: The system

Framework: React with Vite. System source: the `@the-system/*` packages.

## Setup

In the entry file (`src/main.tsx`), the system CSS first, then the app CSS:

```ts
import '@the-system/tokens/css';
import '@the-system/css';
import '@the-system/styles';
```

Wrap the app once in `Theme`, and mount `Toaster` once inside it:

```tsx
import { Theme, Toaster } from '@the-system/react';

<Theme style="studio" scheme="dark" lang="en">
  <Toaster />
  {/* the app */}
</Theme>
```

## Theme axes

Set them on the one root theme. Nested themes may change any axis for a part of the page.

| Axis | Values |
| --- | --- |
| style | `desk`, `neutral`, `studio` (`npx ds style list`) |
| scheme | `dark`, `light` |
| density | `compact`, `default`, `comfortable` |
| contrast | `default`, `more` |
| platform | `web`, `ios`, `android` |
| dir, lang | `ltr` or `rtl`, `en` or `ar` |

## Where to look

- `/llms.txt` on the docs site root: every component, for agents. `/llms-full.txt` has the full text.
- `npx ds docs <Name>` and `npx ds manifest <Name>`: one component, from its manifest.
- `npx ds doctor`: checks this app against the rules in AGENTS.md.

<!-- ds:init end -->
