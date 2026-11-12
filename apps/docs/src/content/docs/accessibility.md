---
title: Accessibility
description: The WCAG 2.2 AA rules every component follows.
---

Every component meets WCAG 2.2 AA in every style, scheme and direction. The
same criteria apply to React Native screens; roles and states map to
VoiceOver and TalkBack through the manifest.

| WCAG 2.2 | Rule |
| --- | --- |
| 1.4.3 | Text at 4.5:1 on every surface it can sit on, glass over its worst backdrop included |
| 1.4.11 | Control borders, focus rings and chart marks at 3:1 |
| 1.4.4, 1.4.10 | Never block page zoom. No sideways scroll at 320px. Native text scales to 200%. |
| 1.4.13 | Hints come from the Tooltip component only. No native `title`. |
| 2.1.1 | Every component has a written keyboard map |
| 2.2.2, 2.3.1 | A pause control for anything that plays longer than five seconds. Nothing flashes more than three times a second. |
| 2.4.7, 2.4.11 | A 2px focus ring. Sticky and floating bars reserve scroll padding. |
| 2.5.7 | Every drag and every swipe has a button or key path |
| 2.5.8 | 24px minimum targets on the web, 44px in touch templates, 44pt on iOS, 48dp on Android |
| 3.3.7, 3.3.8 | No asking twice. OTP fields allow paste and password managers. |
| 4.1.3 | Toasts and chat turns announce once |

## On each component page

The "Accessibility" section lists the role, the focus behavior, what a screen
reader announces and the full keyboard map from the manifest. In right to
left pages, arrow keys follow the reading direction.

## How it is checked

- `npm run contract` runs the contract suite generated from the manifests:
  anatomy, keyboard map and axe for every component.
- `npm run a11y` runs axe on every gallery page in English and Arabic.
- Contrast pairs are a gate on every style and scheme.
