# Final screenshot compare, React with Angular, order 1.29

`npm run shots -- --compare react angular` on the final tree (HEAD a49feaa).
Table and diff images: `docs/reports/shots/matrix/compare-react-angular/`.

## How the shots were taken

The committed captures dated from 07:49, before most order 1.29 commits, so
both matrices were captured again first. The compare reads the work folders.

- React: `npm run shots -- --framework react --url http://127.0.0.1:5196`, a
  production build of the React gallery (`vite build`) served statically.
  2376 shots, 13:53 to 14:24 UTC, load 5.54 at the start and 6.17 at the end
  (4 CPUs). 17 shots were not byte equal across two captures, with 0 pixels
  different (FloatingActionButton, ScrollArea, Switch, Tabs, Toast).
- Angular: `npm run shots -- --framework angular --url http://127.0.0.1:5195`,
  a static development build (`ng build --configuration development`) served
  with an index fallback. 1312 shots, 14:24 to 14:57 UTC, load 6.17 to 7.51.
  2 shots were not byte equal, with 0 pixels different (FloatingActionButton,
  Switch).
- Compare: 14:57 to 14:59 UTC, load 7.51 to 1.82.

## Result

1312 pairs, 1312 pass, 0 fail (limit: 0.5 percent of pixels at threshold
0.1). 1256 pairs are pixel equal. 56 pairs differ by 1 to 1231 pixels (at
most 0.120 percent). 1064 shots are only in React. 0 are only in Angular.

### The 56 pairs that differ

All 56 come from the React production build, not from a component. As a
check, the 8 components with a difference (Alert, Banner, Button,
CopyButton, InputGroup, SplitButton, Toast, ToggleButton) were captured
again from the React development server (port 5198, into a scratch folder).
Against the Angular shots, all 200 of those pairs are pixel equal. The
committed compare, made from development builds, also had 0 differing
pixels.

- InputGroup, 24 pairs, 471 to 1231 pixels (the row of the Arabic demo, in
  every style, scheme, direction and density): a bug in the React production
  CSS. Vite's CSS minifier rewrites
  `[data-ds='input']:dir(rtl) > [data-part='control']:is([type='url'], ...)
  { text-align: end }` (`packages/css/src/components/Input.css:277`) into a
  `:is(:lang(ar), :lang(he), ...)` fallback. The rewritten rule matches any
  input under `lang="ar"`, even inside a group with `dir="ltr"`. So in
  production the url value sits at the right edge, while Angular and the
  React development build keep it at the left edge. Measured with the
  DevTools matched rules: React production matches the `:lang(...)` rule,
  computed `text-align: end`. Angular matches only the `text-align: start`
  rule. The production CSS has 109 such `:lang(...)` rewrites, from the 46
  `:dir(rtl)` rules in `packages/css/src/components`. Any layout that sets
  `dir` against the page language (a ltr field in an Arabic page) gets the
  wrong side in a Vite production build. This is a real bug, but in the
  build, not in parity: the CSS build should keep `:dir()`, for example
  with a browser target that supports it. A decision for the lead.
- Alert, Banner, Button, CopyButton, SplitButton, Toast and ToggleButton,
  32 pairs, 1 to 13 pixels each: edge antialiasing in Desk and a few Liquid
  and Neutral dark shots, under the same production CSS transform. They are
  0 pixels against the React development build.

| File | Pixels | Percent | Where | Cause |
| --- | --- | --- | --- | --- |
| alert/desk-dark-ltr-comfortable.png | 2 | 0.000 | x 73 to 127, y 894 to 894 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| alert/desk-dark-rtl.png | 4 | 0.000 | x 1144 to 1222, y 904 to 909 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| alert/desk-light-ltr.png | 27 | 0.002 | x 943 to 983, y 97 to 360 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| banner/desk-dark-ltr.png | 1 | 0.000 | x 1104 to 1104, y 719 to 719 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| banner/liquid-dark-ltr.png | 1 | 0.000 | x 32 to 32, y 302 to 302 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| banner/liquid-dark-rtl.png | 2 | 0.000 | x 1240 to 1241, y 434 to 434 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| banner/neutral-dark-rtl.png | 1 | 0.000 | x 1244 to 1244, y 185 to 185 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| button/desk-dark-ltr-comfortable.png | 4 | 0.000 | x 327 to 968, y 269 to 1243 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| button/desk-dark-ltr-compact.png | 3 | 0.000 | x 146 to 1174, y 253 to 993 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| button/desk-light-ltr.png | 6 | 0.000 | x 387 to 905, y 194 to 1063 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| button/desk-light-rtl.png | 13 | 0.001 | x 750 to 1109, y 182 to 1243 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| copy-button/desk-dark-ltr-comfortable.png | 1 | 0.000 | x 357 to 357, y 216 to 216 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| copy-button/desk-dark-ltr-compact.png | 2 | 0.000 | x 278 to 312, y 208 to 209 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| copy-button/desk-dark-ltr.png | 5 | 0.000 | x 180 to 389, y 147 to 244 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| copy-button/desk-light-ltr.png | 9 | 0.001 | x 133 to 576, y 139 to 348 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| copy-button/desk-light-rtl.png | 4 | 0.000 | x 995 to 1147, y 139 to 142 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| input-group/desk-dark-ltr-comfortable.png | 1231 | 0.120 | x 103 to 1207, y 314 to 326 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/desk-dark-ltr-compact.png | 1218 | 0.119 | x 87 to 1225, y 254 to 266 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/desk-dark-ltr.png | 1230 | 0.120 | x 95 to 1216, y 283 to 295 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/desk-dark-rtl.png | 1230 | 0.120 | x 95 to 1216, y 290 to 302 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/desk-light-ltr.png | 1073 | 0.105 | x 96 to 1216, y 283 to 295 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/desk-light-rtl.png | 1073 | 0.105 | x 96 to 1216, y 290 to 302 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/liquid-dark-ltr-comfortable.png | 564 | 0.055 | x 107 to 1211, y 311 to 324 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/liquid-dark-ltr-compact.png | 564 | 0.055 | x 91 to 1227, y 253 to 266 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/liquid-dark-ltr.png | 564 | 0.055 | x 107 to 1211, y 311 to 324 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/liquid-dark-rtl.png | 561 | 0.055 | x 107 to 1211, y 318 to 331 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/liquid-light-ltr.png | 544 | 0.053 | x 107 to 1211, y 311 to 324 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/liquid-light-rtl.png | 544 | 0.053 | x 107 to 1211, y 318 to 331 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/neutral-dark-ltr-comfortable.png | 549 | 0.054 | x 103 to 1211, y 307 to 318 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/neutral-dark-ltr-compact.png | 549 | 0.054 | x 87 to 1227, y 249 to 260 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/neutral-dark-ltr.png | 549 | 0.054 | x 103 to 1211, y 307 to 318 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/neutral-dark-rtl.png | 547 | 0.053 | x 103 to 1211, y 314 to 325 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/neutral-light-ltr.png | 543 | 0.053 | x 103 to 1211, y 307 to 318 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/neutral-light-rtl.png | 543 | 0.053 | x 103 to 1211, y 314 to 325 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/studio-dark-ltr-comfortable.png | 471 | 0.046 | x 99 to 1212, y 303 to 313 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/studio-dark-ltr-compact.png | 471 | 0.046 | x 83 to 1228, y 245 to 255 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/studio-dark-ltr.png | 471 | 0.046 | x 91 to 1220, y 273 to 283 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/studio-dark-rtl.png | 471 | 0.046 | x 91 to 1220, y 280 to 290 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/studio-light-ltr.png | 453 | 0.044 | x 91 to 1220, y 273 to 283 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| input-group/studio-light-rtl.png | 453 | 0.044 | x 91 to 1220, y 280 to 290 | React production CSS: the url field in the Arabic row (`dir="ltr"` group inside `lang="ar"`) is right aligned; see below |
| split-button/desk-dark-ltr-open.png | 4 | 0.000 | x 500 to 757, y 144 to 150 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| split-button/desk-dark-ltr.png | 5 | 0.000 | x 752 to 812, y 143 to 150 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| split-button/desk-dark-rtl-open.png | 2 | 0.000 | x 783 to 802, y 153 to 155 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| split-button/desk-dark-rtl.png | 17 | 0.002 | x 404 to 480, y 145 to 158 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| split-button/desk-light-ltr-open.png | 1 | 0.000 | x 762 to 762, y 285 to 285 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| split-button/desk-light-ltr.png | 6 | 0.001 | x 880 to 960, y 94 to 210 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| split-button/desk-light-rtl-open.png | 1 | 0.000 | x 314 to 314, y 103 to 103 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| split-button/desk-light-rtl.png | 3 | 0.000 | x 266 to 431, y 103 to 154 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| toast/desk-light-ltr.png | 1 | 0.000 | x 23 to 23, y 263 to 263 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| toast/desk-light-rtl-open.png | 1 | 0.000 | x 651 to 651, y 184 to 184 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| toast/desk-light-rtl.png | 1 | 0.000 | x 651 to 651, y 184 to 184 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| toggle-button/desk-dark-ltr-comfortable.png | 9 | 0.001 | x 186 to 1048, y 162 to 1052 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| toggle-button/desk-dark-ltr.png | 4 | 0.000 | x 176 to 563, y 224 to 257 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| toggle-button/desk-dark-rtl.png | 1 | 0.000 | x 604 to 604, y 150 to 150 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| toggle-button/desk-light-ltr.png | 4 | 0.000 | x 163 to 211, y 146 to 148 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |
| toggle-button/desk-light-rtl.png | 1 | 0.000 | x 635 to 635, y 150 to 150 | React production CSS: antialiasing of a few edge pixels; 0 px against the React dev build |

### The 1064 shots only in React

They come from 51 components whose manifest says `planned` for Angular, so
the Angular gallery has no route for them. Every one of the 51 was checked:
accordion, alert-dialog, aspect-ratio, avatar, avatar-group, badge, bento, breadcrumbs, card, chip, command-palette, container, context-menu, description-list, dock, drawer, empty-state, grid, hover-card, icon, kbd, language-switch, lightbox, list, menubar, navbar, page-shell, pagination, popover, rail, resizable-panels, scroll-area, section, separator, sheet, sidebar, skip-link, split-view, stack, stat, surface, tab-bar, table-of-contents, tabs, tile, title-bar, toolbar, tooltip, tour, window, window-controls.

TitleBar and WindowControls are among them: they have no Angular demo.

### Known gaps that do not show here

- The CheckboxGroup select all `data-enter` gap does not show in the
  matrix. The shots are taken with animations off and reduced motion, after
  the enter has settled, and every CheckboxGroup pair is pixel equal.
- No difference points to a real component bug in Angular.
