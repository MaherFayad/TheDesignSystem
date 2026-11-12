# Accessibility sweep, react

Made by `npm run a11y -- --framework react`. axe with wcag2a, wcag2aa, wcag21aa, wcag22aa on every gallery page, every style and scheme, English ltr and Arabic rtl, overlays closed and with the first trigger's root open. `/` and `/all` keep the gallery shell; component pages use chrome=0. Rules a manifest lists in contract.skipAxeRules are skipped on its page.

112 runs on 12 pages: 112 pass, 0 fail. No gallery route: Bidi, Theme.

| Page | desk dark en ltr | desk dark ar rtl | desk light en ltr | desk light ar rtl | studio dark en ltr | studio dark ar rtl | studio light en ltr | studio light ar rtl |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| / | pass | pass | pass | pass | pass | pass | pass | pass |
| /all | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/button | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/dialog | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/field | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/icon-button | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/icon | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/input | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/title-bar | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/toast | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/window-controls | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/window | pass | pass | pass | pass | pass | pass | pass | pass |
