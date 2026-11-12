# Accessibility sweep, react

Made by `npm run a11y -- --framework react`. axe with wcag2a, wcag2aa, wcag21aa, wcag22aa on every gallery page, every style and scheme, English ltr and Arabic rtl, overlays closed and with the first trigger's root open. `/` and `/all` keep the gallery shell; component pages use chrome=0. Rules a manifest lists in contract.skipAxeRules are skipped on its page.

744 runs on 49 pages: 696 pass, 48 fail. No gallery route: OTPField.

| Page | desk dark en ltr | desk dark ar rtl | desk light en ltr | desk light ar rtl | neutral dark en ltr | neutral dark ar rtl | neutral light en ltr | neutral light ar rtl | studio dark en ltr | studio dark ar rtl | studio light en ltr | studio light ar rtl |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /c/accordion | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error |
| /c/alert-dialog | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/aspect-ratio | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/avatar | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/bento | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/breadcrumbs | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error |
| /c/button-group | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/card | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/chip | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/combobox | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/container | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/dialog | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/dock | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/drawer | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/dropdown-menu | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/empty-state | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/error-state | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/form-wizard | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/hover-card | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/kbd | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/label | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/link | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/list | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/meter | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/navbar | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error |
| /c/notification-center | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/pagination | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/popover | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/progress-bar | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/progress-circle | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/rail | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/range-slider | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/rating | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/resizable-panels | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/scroll-area | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/separator | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/sheet | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/sidebar | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error | pass, open FAIL error |
| /c/skeleton | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/split-view | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/stat | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/surface | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/switch | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/table-of-contents | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/tabs | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/tile | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/toggle-button | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/tour | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/window | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |

## /c/accordion, desk dark en ltr open

`/c/accordion?style=desk&scheme=dark&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/accordion, desk dark ar rtl open

`/c/accordion?style=desk&scheme=dark&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/accordion, desk light en ltr open

`/c/accordion?style=desk&scheme=light&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/accordion, desk light ar rtl open

`/c/accordion?style=desk&scheme=light&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/accordion, neutral dark en ltr open

`/c/accordion?style=neutral&scheme=dark&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/accordion, neutral dark ar rtl open

`/c/accordion?style=neutral&scheme=dark&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/accordion, neutral light en ltr open

`/c/accordion?style=neutral&scheme=light&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/accordion, neutral light ar rtl open

`/c/accordion?style=neutral&scheme=light&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/accordion, studio dark en ltr open

`/c/accordion?style=studio&scheme=dark&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/accordion, studio dark ar rtl open

`/c/accordion?style=studio&scheme=dark&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/accordion, studio light en ltr open

`/c/accordion?style=studio&scheme=light&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/accordion, studio light ar rtl open

`/c/accordion?style=studio&scheme=light&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/breadcrumbs, desk dark en ltr open

`/c/breadcrumbs?style=desk&scheme=dark&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/breadcrumbs, desk dark ar rtl open

`/c/breadcrumbs?style=desk&scheme=dark&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/breadcrumbs, desk light en ltr open

`/c/breadcrumbs?style=desk&scheme=light&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/breadcrumbs, desk light ar rtl open

`/c/breadcrumbs?style=desk&scheme=light&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/breadcrumbs, neutral dark en ltr open

`/c/breadcrumbs?style=neutral&scheme=dark&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/breadcrumbs, neutral dark ar rtl open

`/c/breadcrumbs?style=neutral&scheme=dark&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/breadcrumbs, neutral light en ltr open

`/c/breadcrumbs?style=neutral&scheme=light&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/breadcrumbs, neutral light ar rtl open

`/c/breadcrumbs?style=neutral&scheme=light&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/breadcrumbs, studio dark en ltr open

`/c/breadcrumbs?style=studio&scheme=dark&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/breadcrumbs, studio dark ar rtl open

`/c/breadcrumbs?style=studio&scheme=dark&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/breadcrumbs, studio light en ltr open

`/c/breadcrumbs?style=studio&scheme=light&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/breadcrumbs, studio light ar rtl open

`/c/breadcrumbs?style=studio&scheme=light&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/navbar, desk dark en ltr open

`/c/navbar?style=desk&scheme=dark&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/navbar, desk dark ar rtl open

`/c/navbar?style=desk&scheme=dark&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/navbar, desk light en ltr open

`/c/navbar?style=desk&scheme=light&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/navbar, desk light ar rtl open

`/c/navbar?style=desk&scheme=light&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/navbar, neutral dark en ltr open

`/c/navbar?style=neutral&scheme=dark&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/navbar, neutral dark ar rtl open

`/c/navbar?style=neutral&scheme=dark&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/navbar, neutral light en ltr open

`/c/navbar?style=neutral&scheme=light&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/navbar, neutral light ar rtl open

`/c/navbar?style=neutral&scheme=light&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/navbar, studio dark en ltr open

`/c/navbar?style=studio&scheme=dark&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/navbar, studio dark ar rtl open

`/c/navbar?style=studio&scheme=dark&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/navbar, studio light en ltr open

`/c/navbar?style=studio&scheme=light&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/navbar, studio light ar rtl open

`/c/navbar?style=studio&scheme=light&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/sidebar, desk dark en ltr open

`/c/sidebar?style=desk&scheme=dark&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/sidebar, desk dark ar rtl open

`/c/sidebar?style=desk&scheme=dark&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/sidebar, desk light en ltr open

`/c/sidebar?style=desk&scheme=light&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/sidebar, desk light ar rtl open

`/c/sidebar?style=desk&scheme=light&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/sidebar, neutral dark en ltr open

`/c/sidebar?style=neutral&scheme=dark&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/sidebar, neutral dark ar rtl open

`/c/sidebar?style=neutral&scheme=dark&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/sidebar, neutral light en ltr open

`/c/sidebar?style=neutral&scheme=light&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/sidebar, neutral light ar rtl open

`/c/sidebar?style=neutral&scheme=light&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/sidebar, studio dark en ltr open

`/c/sidebar?style=studio&scheme=dark&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/sidebar, studio dark ar rtl open

`/c/sidebar?style=studio&scheme=dark&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/sidebar, studio light en ltr open

`/c/sidebar?style=studio&scheme=light&dir=ltr&lang=en&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.

## /c/sidebar, studio light ar rtl open

`/c/sidebar?style=studio&scheme=light&dir=rtl&lang=ar&chrome=0`

- error: locator.click: Timeout 30000ms exceeded.
