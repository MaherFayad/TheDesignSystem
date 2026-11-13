# Accessibility sweep, react

Made by `npm run a11y -- --framework react`. axe with wcag2a, wcag2aa, wcag21aa, wcag22aa on every gallery page, every style and scheme, English ltr and Arabic rtl, overlays closed and with the first trigger's root open. `/` and `/all` keep the gallery shell; component pages use chrome=0. Rules a manifest lists in contract.skipAxeRules are skipped on its page.

2240 runs on 113 pages: 2238 pass, 2 fail. No gallery route: Bidi, Theme.

| Page | desk dark en ltr | desk dark ar rtl | desk light en ltr | desk light ar rtl | liquid dark en ltr | liquid dark ar rtl | liquid light en ltr | liquid light ar rtl | neutral dark en ltr | neutral dark ar rtl | neutral light en ltr | neutral light ar rtl | studio dark en ltr | studio dark ar rtl | studio light en ltr | studio light ar rtl |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| / | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /all | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/accordion | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/alert-dialog | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/alert | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/aspect-ratio | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/autocomplete | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/avatar-group | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/avatar | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/badge | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/banner | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/bento | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/breadcrumbs | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/button-group | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/button | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/callout | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/card | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/checkbox-group | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/checkbox | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/chip | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/close-button | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/combobox | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/command-palette | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/consent-field | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/container | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/context-menu | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/copy-button | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/description-list | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/dialog | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/dock | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/drawer | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/dropdown-menu | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/empty-state | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/error-state | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/field-error | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/field | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/fieldset | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/filter-bar | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/floating-action-button | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/form-wizard | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/form | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/grid | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/hover-card | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/icon-button | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/icon | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/inline-edit | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/input-group | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/input | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/kbd | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/label | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/language-switch | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/lightbox | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/link | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/list-box | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/list | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/menubar | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/meter | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/multi-select | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/navbar | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/notification-center | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/number-field | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/otp-field | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/page-shell | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/pagination | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/password-field | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/phone-field | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/popover | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/progress-bar | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/progress-circle | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/radio-card | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/radio-group | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/rail | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/range-slider | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/rating | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/resizable-panels | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/scroll-area | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/scrub-input | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/search-field | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/section | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/segmented-control | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/select | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/separator | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/sheet | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/sidebar | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/skeleton | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/skip-link | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/slider | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/spinner | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/split-button | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/split-view | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/stack | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/stat | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/status-dot | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/stepper | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/surface | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/switch | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/tab-bar | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/table-of-contents | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/tabs | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/tag-field | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/textarea | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/tile | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/title-bar | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/toast | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/toggle-button | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/toggle-group | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/toolbar | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/tooltip | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/tour | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/window-controls | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/window | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /interactions | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /platforms | FAIL 2 | FAIL 1 | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |

## Violations by criterion, rule and owner

| WCAG criterion | Rule | Owner | Runs | Nodes | Modes |
| --- | --- | --- | ---: | ---: | --- |
| 1.4.3 Contrast (minimum) | color-contrast | /platforms | 2 | 3 | desk dark en ltr; desk dark ar rtl |

## /platforms, desk dark en ltr

`/platforms?style=desk&scheme=dark&dir=ltr&lang=en`

- WCAG 1.4.3 Contrast (minimum): color-contrast: section[aria-labelledby="screen-alert"] > div[data-gallery="platforms-row"] > figure:nth-child(1) > iframe #radix-_r_e_: text #f87171 on #3a3525, 4.42:1, needs 4.5:1 (10.5pt (14px) normal) <span data-dialog-title="" id="radix-_r_e_">Delete Spring launch?</span>
- WCAG 1.4.3 Contrast (minimum): color-contrast: section[aria-labelledby="screen-alert"] > div[data-gallery="platforms-row"] > figure:nth-child(3) > iframe #radix-_r_e_: text #f87171 on #3a3525, 4.42:1, needs 4.5:1 (10.5pt (14px) normal) <span data-dialog-title="" id="radix-_r_e_">Delete Spring launch?</span>

## /platforms, desk dark ar rtl

`/platforms?style=desk&scheme=dark&dir=rtl&lang=ar`

- WCAG 1.4.3 Contrast (minimum): color-contrast: section[aria-labelledby="screen-alert"] > div[data-gallery="platforms-row"] > figure:nth-child(1) > iframe #radix-_r_e_: text #f87171 on #3a3525, 4.42:1, needs 4.5:1 (10.5pt (14px) normal) <span data-dialog-title="" id="radix-_r_e_">Delete Spring launch?</span>
