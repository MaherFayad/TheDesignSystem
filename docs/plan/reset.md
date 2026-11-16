# Reset plan

Status: **proposed, for the owner's review.** Nothing in this file is built
until the owner has read it and said go (ruling 22 in `DECISIONS.md`).

Wave 1 built 111 React components, 59 Angular components, four styles, a
platform axis and a docs site. The owner judged the result: it looks bad, it
does not look or work like GoBanana or Figma-Killer-2, mobile is not premium
and lacks phone components, and the interactions are not there. Seven audits
in `docs/reports/audit/` agree. The owner then ruled on 22 decisions ("Reset
rulings (owner, 2026-11-16)" in `DECISIONS.md`). This plan turns those rulings
into work orders.

Read first, as every order does: `CLAUDE.md`, `PLAN.md`, `AGENTS.md`,
`DECISIONS.md` (the reset rulings are binding), `STATE.md`,
`docs/reports/audit/summary.md` and the audit report each order names,
`docs/contracts/`, and the header of `docs/plan/wave-1.md` ("Rules every order
inherits").

Short names used below:

- GB: GoBanana at `/home/user/gobanana`, read only.
- FK2: Figma-Killer-2 at `/home/user/maherfayad-stack/figma-killer-2`, read
  only. Nothing under its `vendor/alm-design-system` is read, copied or cited.
- Audits: `fid-gb` (`fidelity-gobanana.md`), `fid-fk2`
  (`fidelity-figma-killer-2.md`), `mobile` (`mobile.md`), `motion`
  (`interactions.md`), `liquid` (`liquid-guidelines.md`), `material`
  (`material-guidelines.md`), `native` (`native.md`), all in
  `docs/reports/audit/`.
- Ruling N: item N of "Reset rulings" in `DECISIONS.md`.
- Phone viewports: iPhone 390 by 844 at scale 3, Pixel 412 by 915 at scale
  2.625, touch on, no CSS zoom. Desktop: 1440 by 900. Narrow: 320 wide.

## Contents

1. Phases and why they run in this order
2. Rules every reset order inherits
3. The acceptance harness (ruling 5)
4. Phase R0: foundations
5. Phase R1: source fidelity
6. Phase R2: source screens as templates
7. Phase R3: motion
8. Phase R4: the web phone
9. Phase R5: React Native
10. Closing gate (replaces gate 1)
11. Phase R6: the `tonal` style (after the closing gate)
12. What happens to the old wave 2 scope
13. What is reverted, what is kept
14. What the owner must do, and when
15. Risks
16. Size of each phase
17. Questions the rulings do not settle

## 1. Phases and why they run in this order

| Phase | Goal | Gate in one line | Starts when |
| --- | --- | --- | --- |
| R0 Foundations | Close the open gate 1 faults, add the follow up gates, build the acceptance harness, platform detection, `macos`, the token platform layer, the style and platform shape split | Harness and gates run; platform resolves on phones; contract updated | The owner approves this plan |
| R1 Source fidelity | Studio back to FK2 and Desk back to GB, motion included, with the 3:1 rule by alpha only | Every audit pair within tolerance; owner signs | R0 gate |
| R2 Source screens as templates | The GB desk, Finder and canvas editor, the FK2 editor shell, with the parts they need | Each template within tolerance of its source screen; owner signs | R1 gate |
| R3 Motion | Press under the finger; Neutral and Liquid motion a person can see; Angular level | Perception gate green; owner signs phone recordings | R1 gate (runs beside R2) |
| R4 The web phone | Safe areas, bars, stack, sheets, phone forms, gestures, profiles per platform, Liquid structure, a phone demo app | Device check on the owner's phones; owner signs | R0, R3.1 and R3.2, and R3 gate for the motion parts |
| R5 React Native | Fix the 28 defects, hybrid native chrome, drawn brand controls, icon images, device verification | Owner device checklists green | R5.1 to R5.6 after R0; the rest after R1 and R3 gates |
| Closing gate | Replaces gate 1 | Section 10 | R1 to R5 gates |
| R6 `tonal` | A Material based style, proposed | Section 11 | Closing gate |

Where this order differs from the proposal, and why:

1. **Studio and Desk motion moves from R3 into R1** (orders R1.4 and R1.10).
   Ruling 1 says the two styles return to their sources exactly, and both
   fidelity audits score motion as part of fidelity (`fid-gb` scorecard,
   Motion 1; `fid-fk2` scorecard, Motion 1). R2 accepts templates side by side
   with the source, so the source motion must be in place before R2. R3 keeps
   Neutral, Liquid, the press hook and Angular.
2. **The Desk danger AlertDialog title contrast moves from R0 into R1.8.** The
   fault sits in the Desk dialog title band (`docs/reports/wave-1.md`, "Open
   when work paused", item 2), and R1.8 deletes that band (`fid-gb` section
   11). Fixing a recipe that the next phase removes is wasted work. R1.8 must
   end with axe at 0 findings on that page.
3. **R2 and R3 run side by side.** R2 builds new parts and templates; R3
   changes motion blocks of existing components and the Neutral and Liquid
   presets. The schedule in each phase keeps one owner per CSS file per
   round, and section 2 lists the files that pass between them.
4. **R5 starts its infrastructure right after R0.** The theme defects, the app
   root, the icon pipeline and device verification touch only
   `packages/native`, `packages/icons` and `apps/gallery-native`, and the
   owner's Expo account takes time to set up (ruling 12). The drawn brand
   controls (R5.11 onward) wait for the R1 and R3 gates, since they draw the
   looks and motion those phases settle.
5. **R6 runs after the closing gate, not before it.** Ruling 14 says the
   `tonal` style is added after the reset. The closing gate therefore does not
   wait for it. The contract work it needs that the platforms also need
   (corner scale, state opacities, elevation levels, springs, insets) lands
   earlier, in R0.13.
6. **Angular ports of the templates and of most phone parts move to the
   rebuilt wave 2.** Angular has no Sheet, Drawer, Sidebar, Rail, Toolbar,
   Menubar, Dock, TabBar, Navbar, List or Popover (`mobile`, inventory
   notes). The templates and the phone family stand on those. R3 and R4 port
   what Angular can carry now (motion, press, Sheet, Drawer, back handling,
   safe areas, toast forms). Section 12 says where the rest goes.

## 2. Rules every reset order inherits

Everything in "Rules every order inherits" of `docs/plan/wave-1.md` still
holds, and so do the hard limits and the "do not use" list of `PLAN.md`
section 4 and of `AGENTS.md`. These rules are added for the reset.

**Acceptance (ruling 5).** An order is accepted side by side with its source
or reference, never by test counts.

- Every order names a source screen or a reference, a viewport, and the
  harness command that captures both (section 3).
- A measured tolerance applies where one makes sense (section 3,
  "Tolerances").
- Anything a finger touches gets a phone recording in the recording pack, and
  the owner signs the pack. Until then the order is "built, waiting on the
  owner", not done.
- `npm run check` passing is necessary and never sufficient. So is the
  contract suite.
- Looks are always "proposed" until the owner approves them (ruling 17).

**React first.** React is built and reviewed before its Angular port starts.
Angular orders name the React order and its review as a dependency. Angular
never changes `packages/css`.

**One owner per CSS file per round.** Each phase has a schedule. A CSS file
appears in one running order only. The files that move between phases:

| File | R1 owner | R2 owner | R3 owner | R4 owner |
| --- | --- | --- | --- | --- |
| `packages/css/src/components/Dialog.css` | R1.5 (eyebrow part) | none | R3.6 (morph) | R4.8, then R4.9 |
| `packages/css/src/components/Button.css` | R1.11 (roll) | none | R3.1, then R3.7 | none |
| `packages/css/src/components/Tooltip.css` | R1.5 | none | R3.8 | none |
| `packages/css/src/components/Toolbar.css` | none | R2.4, then R2.9 | none | R4.17 |
| `packages/css/src/components/Menubar.css` | none | R2.6 | none | none |
| `packages/css/src/components/DropdownMenu.css` | none | none | R3.6 | R4.11 |
| `packages/css/src/components/Toast.css` | none | none | R3.7 | R4.12 |
| `packages/css/src/components/Sidebar.css` | none | none | none | R4.19 |
| `packages/css/src/components/TabBar.css`, `Navbar.css` | none | none | none | R4.7, R4.5 |
| `packages/css/src/platform/*.css` | R0.14, R0.15 (in R0) | none | none | R4.16 |
| `packages/styles/studio/**`, `desk/**` | R1 orders (split in R1's schedule) | R2.5, R2.7 may add a recipe file each, new files only | none | none |
| `packages/styles/neutral/**`, `liquid/**` | none | none | R3.4, R3.5 | R4.18 (liquid) |

**Lanes, branches and pushing.** Each lane runs in its own session on its own
branch `claude/ds-reset-<order id>` (dots become dashes, for example
`claude/ds-reset-r1-2`), started from the lead's branch with the brief in
`docs/plan/lane-session-brief.md` plus this section. A lane commits each
finished order as `wo-<id>: <title>` and pushes its branch after every lane of
work. Never another branch, never a pull request, never a force push. The lead
merges, runs `npm run gen` and `npm run check`, spawns a fresh `ds-qa`
review, and deploys the branch to a preview URL for the owner. The production
docs site moves only after a phase gate.

**Models.** Every agent and session runs with the model and effort that
`AGENTS.md` and `CLAUDE.md` set. This file names no model.

**Evidence.** Each order writes its evidence to
`docs/reports/reset/<order id>/` (harness output, tables, recordings index)
and its report to `docs/reports/lanes/reset-<order id>.md`. Video clips over
2 MB stay on the preview deploy; the repo keeps the contact sheet, the
measurement JSON and the link.

**Names and limits.** The style id is `liquid` and its name is "Liquid"; the
vendor's product name for its material never appears in a style name, a
token, a prop or docs prose. The Material based style is `tonal`. No vendor
font is shipped or referenced by file, no vendor symbol set, no vendor mark.
Icons stay `pixelarticons` and `lucide-static` (ruling 11). Both source repos
stay read only (ruling 21). Any runtime dependency outside `PLAN.md` section
4 and ruling 9 is a HUMAN GATE: stop and report it.

**Writing.** No em dash or en dash anywhere. Plain words, sentence case, no
marketing adjectives, no exclamation marks. Arabic: Gulf modern standard
Arabic in docs prose, white Saudi dialect in demos (ruling 19).

**Order fields.** Each order below gives: owner, files it may touch, depends
on, the audit finding it answers, whether it can run in parallel, whether it
stops at a HUMAN GATE, steps, and acceptance a reviewer can run.

## 3. The acceptance harness (ruling 5)

Built in R0.7 to R0.9. Every later order uses it.

**Compare (side by side).** `npm run compare -- --pair <id>` (root script
added by the lead in R0.7). A pair file in
`packages/contract-tests/src/compare/pairs/<id>.json` names: the source
screen and how to reach it, the system URL, the viewport, the regions to crop
(by selector on each side), the properties to probe per region, and the
tolerance profile. Output in `docs/reports/reset/compare/<id>/`: the two
captures, one sheet with source left and system right, and a table of every
probed property with source value, system value, difference and pass or fail.

- GB runs from a copy in the scratch folder, as `fid-gb` did: `npm ci
  --ignore-scripts`, `next dev` with the repo's own e2e bypass and its seeded
  board mock. Nothing is written to `/home/user/gobanana`.
- FK2 cannot run as an app (it needs its vendor package at install). Its
  screens come from the harness `fid-fk2` used: FK2's own primitives,
  `src/styles/globals.css` and the shell CSS modules rendered from its source
  tree through Vite aliases, in the scratch folder, with any import of the
  vendor folder replaced by an empty module. The pair file says which screens
  are reconstructions.
- Both sides run in the same browser, the same viewport and the same blur
  state. GB turns blur off on a software GPU (`fid-gb`, "What I could not
  check"), so glass regions are compared by computed CSS, and their pixels
  are masked.

**Tolerances** (the default profile; a pair may tighten it):

| Probe | Tolerance |
| --- | --- |
| Box size and position of a control or part | 1px |
| Box size and position of a screen region | 2px |
| Colour (fill, text, border, shadow colour) | Delta E 2000 at most 2 (`culori`) |
| Radius, border width | Equal |
| Font size and weight | Equal |
| Line height | 1px |
| Letter spacing | 0.01em |
| Duration | 10ms or 10 percent, the larger |
| Travel | 1px; scale 0.01 |
| Easing | Same curve, each control point within 0.02 |
| Pixels of a template region, text and images masked | At most 3 percent of the region's pixels differ at pixelmatch threshold 0.1 |

A value that differs on purpose (the 3:1 alpha of ruling 2, the 2px focus
ring of `PLAN.md` section 12, the accessible toast timing) is listed in the
pair file as an allowed difference with its reason, and shows as "allowed" in
the table.

**Perceive (motion a person can see).** `npm run perceive -- --component
<slug> --style <id> --platform <id>` (R0.8). It drives real touch events at a
phone viewport, samples every frame at 1x, and reports latency from
`pointerdown` to the first visual change, the headline part's travel, scale
or fill area, the duration of the main change, and which secondary elements
react. Two profiles:

- **Rich** (Neutral and Liquid, ruling 3), from `motion`, "How to verify
  motion from now on": latency at most 32ms (Android ripples follow the
  platform's touch delay, so at most 150ms plus 32ms there); the headline part
  moves 8px or more, or scales 6 percent or more, or changes fill over 30
  percent of its area; the main change lasts 200 to 500ms; at least one
  secondary element reacts; anything that carries meaning and finishes under
  150ms or moves under 3px fails.
- **Quiet** (Studio and Desk, ruling 3): durations, travel, scale and easing
  equal the source's within the motion tolerances above, and latency at most
  32ms.

**Recording pack.** `npm run record -- --order <id>` (R0.9). One 60 frames a
second clip per interaction at 1x, real time, in an iPhone and a Pixel frame,
touch driven, light and dark, labelled with the style, the platform and what
the finger does. An index page shows the clips in a grid at real speed, each
next to its source clip where a source exists. The sign sheet
`docs/reports/reset/signoff/<order id>.md` has one line per clip. The lead
writes the owner's answer into the sheet with the date; the owner does not
need to edit the repo.

**Device check.** For anything where emulation is known to differ (press
timing under a real finger, safe areas, the keyboard, haptics, glass cost,
native views), the order adds a short device script: the preview URL or build,
the steps, and what to record with the phone's own screen recording. The
owner sends the recordings back. This is a HUMAN GATE.

## 4. Phase R0: foundations

Goal: close the gate 1 faults that stay valid, add the gates wave 1 lacked,
build the acceptance harness, and put in the platform foundations the later
phases stand on.

Schedule (one owner per file per step):

| Step | Orders that run together | Starts when |
| --- | --- | --- |
| 0 | R0.1 (lead) | Owner approves this plan |
| 1 | R0.2, R0.3, R0.5, R0.6 | R0.1 committed |
| 2 | R0.7, R0.10, R0.13, R0.4 (after R0.3 review) | Step 1 green |
| 3 | R0.8, R0.11, R0.12 (after R0.10 review), R0.14 (after R0.13) | R0.7 and R0.13 green |
| 4 | R0.9, R0.15 | R0.8 and R0.14 green |
| 5 | R0.16 | All of R0 green |

### R0.1 Contract changes for the reset (lead)

- Files: `docs/contracts/frameworks.md`, `tokens.md`, `anatomy.md`,
  `style-pack.md`, `DECISIONS.md`, `STATE.md`, `scripts/gen-index.ts` (the
  layer statement it writes into `packages/css/src/index.css`).
- Depends on: owner approval of this plan.
- Answers: rulings 7, 8, 13, 16; `liquid` "What a desktop form needs";
  `material` "Proposal (a)"; `native` section 8 item 2.
- Parallel: no, it runs alone first. HUMAN GATE: no (lead decisions inside the
  rulings).
- Steps:
  1. Platform axis: values `web`, `ios`, `android`, `macos`, plus `auto` as an
     input that resolves to one of them (rulings 7, 13). Resolution order:
     explicit prop, URL key in the galleries and docs, stored choice, device.
  2. Token platform layer: platform token files, what a platform may set
     (type ramp, control heights, corner scale, state opacities, elevation
     levels, spring numbers, inset tokens, system font mapping), and what it
     may never set (colour, font family on the web, surface material).
  3. New contract names: `shape.corner.none` to `full`, `opacity.state.*`,
     `elevation.level0` to `level5`, `spring.spatial.*` and
     `spring.effects.*`, `inset.*` fed by `env()`, `breakpoint.compact` to
     `extra-large`, `type.<role>` composites per platform.
  4. Shape split (ruling 16): the layer statement becomes
     `ds.reset, ds.tokens, ds.base, ds.platform, ds.recipes, ds.chrome,
     ds.overrides`. `ds.platform` holds platform rules for controls (the
     style recipe wins over them). `ds.chrome` holds platform rules for
     sheets, bars (navigation bar, tab bar, bottom toolbar) and alerts (the
     platform wins over the style). Written in `anatomy.md` with the list of
     components on each side.
  5. Record the plan's lead decisions in `DECISIONS.md`: the six order
     changes of section 1, the perceive profiles of section 3, the allowed
     differences (2px focus ring, accessible toast timing).
- Accept: a reviewer finds each ruling 7, 8, 13 and 16 written as a rule in
  `docs/contracts/` with an example; `npm run gen` writes the new layer
  statement; `npm run check` green.

### R0.2 Slider and RangeSlider reflow at 320px (ds-component)

- Files: `packages/css/src/components/Slider.css` (RangeSlider shares it),
  `packages/react/src/components/Slider/**`,
  `packages/react/src/components/RangeSlider/**` (tests and demo only).
- Depends on: R0.1. Parallel: yes (step 1). HUMAN GATE: no.
- Answers: order 1.31 item 1; `docs/reports/wave-1.md`, "Open when work
  paused", item 1 (the fill `::before` reaches 36px past the track,
  `Slider.css:205`).
- Steps: clip or inset the fill to the track box; test at 320 wide in every
  style, both schemes, three densities, LTR and RTL, `web`, `ios`, `android`.
- Accept: at 320 wide, `document.documentElement.scrollWidth` equals the
  viewport width on `/c/slider` and `/c/range-slider` in all 4 styles by 2
  schemes by 3 platforms by 2 directions (48 runs, 0 overflow); the fill's
  box never passes the track box by more than 0px (measured); a recording of a
  thumb drag at the Pixel viewport in Liquid and Desk shows the fill inside the
  track; `npm run contract -- --framework react --component
  Slider,RangeSlider` green.

### R0.3 Tab slide long task, React (ds-component)

- Files: `packages/react/src/components/ToggleGroup/**`,
  `packages/motion/src/helpers/` (the follow helper only, if it must change).
- Depends on: R0.1. Parallel: yes (step 1). HUMAN GATE: no.
- Answers: order 1.31 item 3; `wave-1-followups.md` round 5 item 2 (ToggleGroup
  calls `followIndicator` directly).
- Steps: move ToggleGroup onto `inFrame` with `planFollow` and `planInk`, as
  Tabs does; add a performance test fixture.
- Accept: a Chrome trace at 4x CPU slowdown, 20 taps across the segments in
  Neutral and Liquid at the Pixel viewport: median long task under 50ms and
  none over 100ms (trace and table in the evidence folder); the indicator
  still lands on the pressed segment (recording).

### R0.4 Tab slide long task, Angular (ds-angular)

- Files: `packages/angular/src/components/toggle-group/**`.
- Depends on: R0.3 and its review. Parallel: yes (step 2). HUMAN GATE: no.
- Answers: as R0.3, in Angular (`wave-1-followups.md` round 5 item 2).
- Accept: the same trace measure against the Angular gallery under 50ms;
  `npm run shots -- --compare react angular` for `toggle-group` 0 pixels over
  the threshold; Angular contract run green.

### R0.5 Gates that wave 1 lacked (ds-qa)

- Files: `packages/lint/**`, `packages/contract-tests/**`, their tests.
- Depends on: R0.1. Parallel: yes (step 1). HUMAN GATE: no.
- Answers: order 1.31 item 4 (reflow runs only in the default style);
  `wave-1-followups.md` round 3 item 1 (conflict markers), round 5 item 1
  (`:dir()` count); `docs/reports/wave-1.md`, "What the wave taught".
- Steps:
  1. The contract suite's reflow check runs in every style and every
     platform, at 320 wide.
  2. A gate that fails on a line that starts with seven `<`, `=` or `>`
     characters in any source file, and a CSS parse of every file under
     `packages/css/src/` and `packages/styles/`.
  3. A test that builds the gallery and fails if the output holds fewer
     `:dir(rtl)` selectors than the source.
- Accept: each gate has a passing and a failing fixture; a planted conflict
  marker in a scratch copy of `Dialog.css` fails `npm run check`; the reflow
  run lists 4 styles by 4 platforms and finds the Slider fault on a tree
  without R0.2 and none with it.

### R0.6 CLI snapshot on a fixture (ds-docs)

- Files: `packages/cli/**` (tests and a fixture folder).
- Depends on: R0.1. Parallel: yes (step 1). HUMAN GATE: no.
- Answers: `wave-1-followups.md` round 3 item 2 (the `ds add --framework
  angular` snapshot breaks on every Angular merge).
- Accept: the snapshot reads a fixture folder; adding a file to
  `packages/angular/src/components/` in a scratch copy leaves the CLI tests
  green; `npm run check` green.

### R0.7 Compare harness (ds-qa)

- Files: `packages/contract-tests/src/compare/**`, its tests,
  `docs/reports/reset/compare/`; the lead adds the `compare` script to the
  root `package.json`.
- Depends on: R0.1. Parallel: yes (step 2). HUMAN GATE: no.
- Answers: ruling 5; summary root cause 5 ("no check compared the result with
  the sources").
- Steps: build the runner, the GB and FK2 source runners in the scratch folder
  (section 3), the pair file schema, the tolerance profiles, and three sample
  pairs: `gb-button-desk` (`fid-gb` shot 04), `fk2-menu-studio` (`fid-fk2`
  shot 14), `gb-dialog-desk` (`fid-gb` shot 08).
- Accept: the three sample pairs run from a clean checkout with one command
  each; on today's tree they fail on the values the audits name (Desk md
  button 36 against 28, tracking -0.52px against normal; Studio menu radius 0
  against 16; Desk dialog with lights against a plain panel), which proves the
  harness sees the gap; a grep shows no path under FK2's vendor folder in any
  harness file; nothing is written under either source repo (checked with
  `git status` in both).

### R0.8 Perception gate (ds-qa)

- Files: `packages/contract-tests/src/perceive/**`, its tests; the lead adds
  the `perceive` script.
- Depends on: R0.7 (shares the runner). Parallel: yes (step 3). HUMAN GATE:
  no.
- Answers: `motion`, "How to verify motion from now on", items 1, 2 and 6;
  suspect (l), "the reviews measured presence, not perception".
- Steps: turn the audit's frame sampler into the gate; both profiles of
  section 3; a calibration run on the audit's twenty components.
- Accept: on today's tree in Neutral at the Pixel viewport the run reproduces
  the audit's table within 10 percent (Button press 0.98 over 70ms, starting
  at release; dialog rise 4px), and marks 9 of 20 invisible and 4 wrong, as
  the audit did; the report states numbers a person can picture ("rises 12px
  over 280ms"), never token names.

### R0.9 Recording pack and sign sheet (ds-qa)

- Files: `packages/contract-tests/src/record/**`, `docs/reports/reset/signoff/`
  (the template); the lead adds the `record` script.
- Depends on: R0.8. Parallel: yes (step 4). **HUMAN GATE: the owner approves
  the pack format once**, on a sample pack of five clips (Button press, Switch,
  Dialog open, Sheet drag, Toast swipe) in Neutral on both phone frames.
- Answers: ruling 5; `motion` verification items 3 to 5.
- Accept: one command writes the pack for an order; clips play at real speed
  at 1x with no zoom; each clip shows its style, platform and gesture; the
  index places a source clip beside ours where a pair exists; the sign sheet
  lists every clip; the device script template exists. The owner's approval of
  the format is written into the sample sign sheet.

### R0.10 Platform detection with override, React and gallery (ds-component)

- Files: `packages/shared/src/platform.ts` and its test (new),
  `packages/shared/src/theme.ts`, `packages/react/src/theme/**`,
  `apps/gallery-react/src/axes.ts`, `App.tsx`, `router.tsx`.
- Depends on: R0.1. Parallel: yes (step 2). HUMAN GATE: no.
- Answers: ruling 7; `motion` cause (k) ("a phone gets the web platform");
  `motion` change 9.
- Steps: a pure resolver from user agent client hints, the user agent string
  and `maxTouchPoints` (iPadOS that reports a desktop agent with touch
  resolves to `ios`); `platform="auto"` on `Theme`, resolved once on mount and
  stamped as `data-platform`; the gallery reads `?platform=`, falls back to a
  stored choice, then to `auto`; the gallery bar shows what was detected and
  lets the person switch.
- Accept: unit tests with fixtures for iPhone Safari, iPad in desktop mode,
  Android Chrome, Mac Safari, Mac Chrome, Windows Chrome and Linux Firefox;
  Playwright with the iPhone and Pixel descriptors and no query gives
  `data-platform="ios"` and `"android"` on `/c/switch`; `?platform=web`
  overrides on both; a recording of the iPhone frame shows the iOS switch
  travel (17px, `motion` cause k). Device check (HUMAN GATE, short): the owner
  opens the preview on each phone and reads the detected platform in the bar.

### R0.11 Platform detection in the docs site (ds-docs)

- Files: `apps/docs/**`.
- Depends on: R0.10 and its review. Parallel: yes (step 3). HUMAN GATE: no.
- Answers: ruling 7; `motion` suspect (g) and cause (k).
- Accept: the docs top bar shows the detected platform and an override; the
  choice is kept across pages and passed to every preview iframe; Playwright
  with the iPhone descriptor shows `data-platform="ios"` inside a preview with
  no query; axe clean on the sample pages in four styles.

### R0.12 Platform detection in Angular (ds-angular)

- Files: `packages/angular/src/theme/**`, `apps/gallery-angular/src/app/**`.
- Depends on: R0.10 and its review. Parallel: yes (step 3). HUMAN GATE: no.
- Answers: ruling 7, in Angular.
- Accept: `dsTheme` takes `platform="auto"` through the shared resolver; the
  same device descriptor tests as R0.10 pass against the Angular gallery;
  Angular contract run green.

### R0.13 Token platform layer (ds-tokens)

- Files: `packages/tokens/**` (new `src/platform/{web,ios,android,macos}.json`,
  `build.ts`, snapshots, `src/contract.json`).
- Depends on: R0.1. Parallel: yes (step 2). HUMAN GATE: no.
- Answers: ruling 8; `native` defects 18, 19, 20 and section 8 item 2;
  `material` "Proposal (a)" (corner scale, state opacities, elevation levels,
  springs, insets, breakpoints); `liquid` section 9 of "Detailed comparison"
  (type ramp by platform); `mobile` change 8 (phone text ramp 34, 22, 17, 15,
  13, 11).
- Steps: platform token files with values cited from the audits' measured
  tables (iOS body 17 and large title 34; Material type roles and corner
  scale; macos body 13 and controls 22 to 28); CSS under
  `[data-platform='<id>']` in `ds.tokens`; native theme objects keyed by
  style, scheme and platform; system font stacks map to the platform font
  (`undefined`) on native, never the first named family; springs as numbers on
  native and baked `linear()` on the web.
- Accept: snapshot tests for CSS and native objects; a table in the evidence
  folder lists every platform value with the audit line it comes from; no
  native theme names `Segoe UI` or `SFMono-Regular` (grep); `dist/native/index.ts`
  exposes `themes[style][scheme][platform]`; the build is deterministic (two
  runs, byte equal); `npm run check` green.

### R0.14 The `macos` platform (ds-style)

- Files: `packages/css/src/platform/macos.css` (new) and its wiring.
- Depends on: R0.13. Parallel: yes (step 3). **HUMAN GATE: the look is
  proposed.**
- Answers: ruling 13; `liquid` "What a desktop form needs" and change 9
  (desktop ramp 13 body, about 28 tall controls, square checkboxes with a
  mixed state, window controls at the leading top, sheets that drop from the
  top of the window).
- Accept: on `/c/button`, `/c/checkbox`, `/c/window` and `/c/sheet` with
  `platform=macos` at 1440 wide, measured values equal the platform tokens
  (body 13px, md control 28px, checkbox square with 4 to 5px radius, lights at
  the inline start of the title bar, sheet entering from the top of its
  window), in all four styles; side by side sheet against `platform=web`;
  marked proposed.

### R0.15 Shape split between styles and platforms (ds-style)

- Files: `packages/css/src/platform/ios.css`, `android.css` (split each into a
  controls part in `ds.platform` and a chrome part in `ds.chrome`), the style
  recipes that guard platform shapes with `[data-platform='web']`
  (`packages/styles/*/recipes/{Switch,Dialog,TabBar,Navbar,Toast}.css`).
- Depends on: R0.1, R0.14. Parallel: yes (step 4), but it is the only order
  in R0 that touches style recipes. HUMAN GATE: no (no new look; the rule
  decides).
- Answers: ruling 16; `material` scorecard "Platform under other styles" 1
  (Liquid's capsule bar and round checks on Android, Desk lights on the
  sheet); `hook-wiring.md`, "Platform shape against style recipes"; `mobile`
  change 10 (no window lights on phone sheets and alerts).
- Accept: a matrix of 4 styles by `ios` and `android` on `/platforms/screen`
  for the sheet, alert, tab bar and toast screens: sheet, alert and bar
  geometry (radius, height, title size, action layout) equal the platform's
  values in every style within 1px; on the same screens a Button and a
  Checkbox keep the style's shape; Desk on a phone shows no window lights on
  sheets or alerts; a recording of the sheet screen in Desk and Liquid on both
  phone frames.

### R0.16 R0 gate review (ds-qa)

- Files: `docs/reports/reset/r0-gate.md`.
- Depends on: every R0 order. Parallel: no. HUMAN GATE: the owner sees the
  report with the R0.9 sample.
- Accept, the R0 gate:
  1. Reflow at 320 wide: 0 overflow in every style and platform.
  2. Tab slide long task under 50ms median at 4x CPU, React and Angular.
  3. Conflict marker, CSS parse, `:dir()` count and CLI fixture gates run in
     `npm run check`.
  4. Compare, perceive and record each run from one command, and the owner has
     approved the pack format.
  5. A phone resolves its platform with no query, in the gallery, the docs and
     Angular, and the override works.
  6. The token build emits the platform layer for the web and native.
  7. `macos` exists and is proposed; the shape split matrix passes.
  8. `npm run check` and both contract suites green.

## 5. Phase R1: source fidelity

Goal: Studio looks and moves like FK2 and Desk looks and moves like GB,
undoing the drift of orders 1.24 to 1.29 (ruling 1). Where a source control
boundary falls under 3:1, keep the hue and raise only the alpha to the lowest
value that passes (ruling 2). Recheck Desk dark glass over bright content
(ruling 18).

Schedule:

| Step | Orders | Starts when |
| --- | --- | --- |
| 1 | R1.1, R1.6, R1.5, R1.11 | R0 gate |
| 2 | R1.2, R1.7, R1.12 | R1.1 and R1.6 green |
| 3 | R1.3, R1.8, R1.13 (after the owner's choice) | step 2 green |
| 4 | R1.4, R1.9 | step 3 green |
| 5 | R1.10, R1.14, R1.15 (after R1.5 and R1.11 reviews) | step 4 green |
| 6 | R1.16 | all of R1 green |

Inside a style, the recipe orders run one after another because they share
`packages/styles/<id>/style.json` and `motion.ts`; Studio and Desk run side by
side.

### R1.1 Studio tokens back to FK2 (ds-tokens)

- Files: `packages/styles/studio/tokens.dark.json`, `tokens.light.json`.
- Depends on: R0 gate. Parallel: yes, with R1.6. HUMAN GATE: no (a source
  look, not a new one; the owner signs at R1.16).
- Answers: `fid-fk2` "Colour and surfaces", "Borders, separation and radius",
  ten changes item 1 and 3; `fid-fk2` "How the gap happened" item 3 (tokens
  override the FK2 values).
- Steps: surfaces `#1b1b1b`, `#282828`, `#323232` and the rest from FK2
  `src/styles/globals.css:76-81`; text values with the GB "A11y change" kept;
  radius scale from `globals.css:200-205, 308` (control and field 1em, panel
  12, card 16, menu 16 with 12 rows, tooltip 6, inspector field 8);
  elevations from `globals.css:343-355`; `blur.panel` 24px; Studio light from
  FK2's `[data-editor-theme='light']` block (`globals.css:670-687`) with the
  GB A11y changes; motion tokens from FK2 (menu 130ms enter and 100ms exit on
  `cubic-bezier(0.16, 1, 0.3, 1)`, 4px rise, scale 0.97; toast 140ms from 6px
  and 0.98; tooltip 80ms; tab panel 120ms and 4px; no `steps()`). Control
  border: FK2's white at 20 percent, raised to the lowest alpha that reaches
  3:1 on every surface it sits on (ruling 2); hover and focus steps raised by
  the same rule only where they fall under 3:1.
- Accept: a token diff table in the evidence folder, one row per changed
  token, with the FK2 file and line, our value, and "equal", "A11y change" or
  "ruling 2: alpha raised from 0.20 to N"; the contrast gate passes; `npm run
  compare -- --pair fk2-shell-studio` (`fid-fk2` shot 01 at 1440) shows every
  surface colour within Delta E 2; the light pair (`fid-fk2` shot 02) the same.

### R1.2 Studio controls (ds-style)

- Files: `packages/styles/studio/recipes/{Button,Checkbox,Switch,Field,Rating,Bento}.css`
  and new `recipes/{Input,Select,SegmentedControl,Tabs,Tile}.css`.
- Depends on: R1.1. Parallel: yes, with R1.7. HUMAN GATE: no.
- Answers: `fid-fk2` "Buttons and icon buttons", "Inputs, number and scrub
  fields", "Selects and menus" (trigger), "Tabs and segmented controls",
  ten changes items 2 and 5; "Things the system invented" items 1, 2, 8.
- Steps: FK2 button fills (primary white 20 percent, secondary 10 percent with
  muted label, ghost, destructive danger tint), no border, weight 700, colour
  transitions 150ms ease, no press inversion; inputs and select triggers as
  transparent pills with the ruling 2 border; segmented group 12px with 8px
  segments and overlay fills; tiles borderless at 16px with the uppercase 11px
  label and tint dot (the part comes from R1.5); keep the 2px focus ring
  (allowed difference).
- Accept: compare pairs `fk2-buttons` (shot 06), `fk2-inputs` (08),
  `fk2-scrub` (09), `fk2-segmented` (10), `fk2-tabs` (11), `fk2-tiles` (12) at
  1440 and 390 within the default tolerances; recording of press, hover (on
  desktop), toggle and focus on Button, Switch, Checkbox and SegmentedControl
  in the Pixel frame (quiet profile); `npm run contract -- --framework react
  --component Button,IconButton,Input,Select,SegmentedControl,Switch,Checkbox,Tile`
  green.

### R1.3 Studio overlays (ds-style)

- Files: `packages/styles/studio/recipes/{DropdownMenu,Dialog,Tooltip,Toast,Popover,CommandPalette,Lightbox,Window}.css`,
  new `recipes/ListBox.css`, `packages/styles/studio/style.json` (optional
  parts).
- Depends on: R1.2. Parallel: yes, with R1.8. HUMAN GATE: no.
- Answers: `fid-fk2` "Context menus, dialogs, popovers and tooltips",
  "Toasts", ten changes items 3 and 10; "Things the system invented" items 4
  to 6 and 9 (window parts in Studio).
- Steps: menus and select lists on surface 3, 16px radius, 12px rows, 4px
  panel padding, no border, the FK2 shadow; dialogs at 12px with surface 2
  header and footer bands, eyebrow, right aligned footer; tooltip on body with
  a hairline, 6px radius, the arrow part (R1.5) and the tooltip shadow; toast
  as a rounded card with a 2px start edge, blur and shadow, title 12px 500,
  body clamped to 3 lines; Window, Menubar and Dock out of Studio demos
  (gallery notes, not removal).
- Accept: compare pairs `fk2-menu` (shot 14), `fk2-select` (15), `fk2-dialog`
  (16), `fk2-toast` (18), `fk2-tooltip` (20) at 1440 and 390; recording of
  each opening and closing in the Pixel frame; axe clean on those pages.

### R1.4 Studio motion preset (ds-style)

- Files: `packages/styles/studio/motion.ts`, `recipes/Motion.css`.
- Depends on: R1.3. Parallel: yes, with R1.9. HUMAN GATE: no.
- Answers: `fid-fk2` "Motion and micro interactions", ten changes item 4;
  `motion` suspect (f) (Studio turns every distance and scale off); ruling 3.
- Steps: map every Studio pattern to the FK2 timing in the table of
  `fid-fk2`; drop the step eases; rail indicator 140ms from scale 0.6;
  section chevron 120ms; sidebar width change by transform where the shell
  needs it (R2).
- Accept: `npm run perceive` in the quiet profile for menu, select, tooltip,
  toast, tabs and dialog in Studio: every duration, travel, scale and curve
  equals FK2's within tolerance (table against `fid-fk2` "Motion"); a side by
  side recording of the FK2 harness menu and ours at 1x; reduced motion still
  collapses (0 interactions move).

### R1.5 Parts Studio needs (ds-component)

- Files: `packages/react/src/components/{Dialog,Tooltip,Rail,Tile}/**`, their
  CSS files (`Dialog.css`, `Tooltip.css`, `Rail.css`, `Tile.css`) and
  manifests.
- Depends on: R0 gate. Parallel: yes (step 1). HUMAN GATE: no.
- Answers: `fid-fk2` Dialog header (eyebrow), Tooltip (arrow, opens at once),
  Rail (tint per item, icon only, indicator), Tile (uppercase label with a
  tint dot); `fid-gb` section 14 (step tile with the accent dot).
- Steps: Dialog `eyebrow` part; Tooltip `arrow` part and an open delay read
  from a new token `delay.tooltip-open` (Studio 0ms, others keep 500ms), focus
  still opens at once; Rail `tint` per item from `color.accent.N`, an
  `iconOnly` prop and an `indicator` part; Tile `label` part with a `tint`
  dot. Token names go to the lead for the contract first.
- Accept: unit tests and the contract suite for the four components; compare
  pair `fk2-rail` (shot 04) at 1440 with the R1.2 recipes in place; the
  Tooltip opens in 0ms in Studio and 500ms elsewhere (perceive); keyboard focus
  opens it at once in every style.

### R1.6 Desk tokens back to GB (ds-tokens)

- Files: `packages/styles/desk/tokens.dark.json`, `tokens.light.json`.
- Depends on: R0 gate. Parallel: yes, with R1.1. HUMAN GATE: no.
- Answers: `fid-gb` sections 2, 5, 6 and 17, ten changes items 2 to 4; summary
  root cause 2.
- Steps: tracking normal on controls, -0.04em on display only; control sizes
  xs 24, sm 28 (the default demo size), md 32, lg 44; button radius 1em (12px
  at sm and md, 8px at xs), pill only for the `pill` shape; menu panel 16 and
  menubar menu 0.6rem; dialog and toast 12; dock 17.6 with 13.6 tiles; motion
  from GB (menu 120ms on `cubic-bezier(0.16, 1, 0.3, 1)` from -4px and 0.97;
  menubar menu 140ms from -0.25rem and 0.98; dialog 120ms from 4px and 0.98;
  toast 140ms from 6px and 0.98; window open 300ms on
  `cubic-bezier(0.2, 0.8, 0.2, 1)`; close 220ms; zoom 280ms; minimize 320ms;
  no overshoot); `scale.dialog-enter` 0.98 and `scale.menu-enter` 0.97.
- Accept: a token diff table against `banana-server/styles/studio-tokens.css`,
  `studio-components.css` and `desktop.css` with file and line per row;
  contrast gate green; compare pair `gb-button-desk` passes its height,
  padding, radius and tracking rows.

### R1.7 Desk controls (ds-style)

- Files: `packages/styles/desk/recipes/{Button,Input,Density,Checkbox,Tabs,Card,Tile}.css`.
- Depends on: R1.6. Parallel: yes, with R1.2. HUMAN GATE: no.
- Answers: `fid-gb` sections 8, 9, 13, 14, ten changes items 4, 5, 9;
  "Things the system invented" items 1, 2, 5, 7, 11.
- Steps: delete the `+ space.3xs` density rule; buttons as GB `.st-btn` (flat
  fill, secondary overlay 10 to 20 to 30, ghost, yellow primary with dark
  text, destructive as the 10 percent red tint), tone change only on hover and
  press, no transform, no glow, no inner rings; the roll only with the `roll`
  prop (R1.11); success, warning and info solid and soft draw as their 10
  percent tint, so Desk shows GB's two colour language; inputs transparent at
  28px with the GB border and focus glow; segmented selected at overlay 20
  with a 1px overlay 50 ring; tile on a 1px gap grid with a 2px hover lift.
- Accept: compare pairs `gb-button-desk` (shot 04), `gb-segmented` (14),
  `gb-cards` (11) at 1440 and 390 within tolerance; a recording of press and
  toggle in the Pixel frame (quiet profile, no movement on press); contract
  suite green for the touched components.

### R1.8 Desk dialogs, toasts and popups (ds-style)

- Files: `packages/styles/desk/recipes/{Dialog,Toast,Tooltip,Popover,HoverCard,Tour,Lightbox}.css`,
  `packages/styles/desk/style.json` (optional parts).
- Depends on: R1.7. Parallel: yes, with R1.3. HUMAN GATE: no.
- Answers: `fid-gb` sections 11 and 12, ten changes items 6 and 8; "Things the
  system invented" items 3 and 4; order 1.31 item 2 (danger AlertDialog title
  at 4.42:1, moved here, see section 1).
- Steps: Dialog, AlertDialog and Sheet lose the `controls` and `titlebar`
  optional parts in Desk (Window keeps them); solid surface, surface 2 header
  and footer bands with 1px dividers, 12px radius, title 14px 700, backdrop
  body colour at 50 percent with no blur; toast as GB: flat panel, 1px overlay
  10 border, 2px coloured start edge, bare 16px icon, plain close, title 12px
  500, body clamped to 3 lines, no timer line.
- Accept: compare pairs `gb-dialog-desk` (shot 08) and `gb-toast` (09) at 1440
  and 390; axe on `/platforms` 0 findings (the danger title passes 4.5:1);
  recording of dialog and toast open and close in the Pixel frame.

### R1.9 Desk menus, sidebar and window chrome (ds-style)

- Files: `packages/styles/desk/recipes/{DropdownMenu,ListBox,Select,Combobox,MultiSelect,TagField,CommandPalette,Menubar,Dock,Window}.css`,
  new `recipes/Sidebar.css`.
- Depends on: R1.8. Parallel: yes, with R1.4. HUMAN GATE: no.
- Answers: `fid-gb` sections 1 (Finder sidebar), 10, 16, ten changes item 7;
  "Things the system invented" items 8 and 9; `fid-gb` section 3 (the inner
  top light on windows is an addition).
- Steps: every Desk menu takes the menubar menu (glass strong,
  `blur(40px) saturate(1.6)`, 0.6rem radius, 28px rows, the highlighted row
  solid yellow with ink text, following pointer and arrow keys); Desk
  Sidebar as GB's inset glass sidebar (white 6 percent fill, 7 percent
  hairline, 9.6px radius, 36px rows at 14.4px, current row weight 600 on
  overlay 10, no bar); window glass without the added inner top light; dock
  tiles 52px.
- Accept: compare pairs `gb-menu` (shot 06), `gb-menubar` (07), `gb-dock` (10),
  `gb-sidebar` (12) at 1440 and 390; recording of a menu opened by touch and
  moved by arrow keys; contract suite green.

### R1.10 Desk motion preset (ds-style)

- Files: `packages/styles/desk/motion.ts`, `recipes/Motion.css`.
- Depends on: R1.9. Parallel: yes, with R1.14. HUMAN GATE: no.
- Answers: `fid-gb` section 17 and ten changes item 2; "Things the system
  invented" item 6 (overshoot on every entrance); ruling 3.
- Accept: perceive in the quiet profile for menu, menubar menu, dialog,
  toast, window open, close, zoom and minimize in Desk: each equals the GB
  value in the `fid-gb` motion table within tolerance, with 0 percent
  overshoot; a side by side recording of the GB window grow and ours at 1x
  from the same trigger position.

### R1.11 Button roll as an opt in (ds-component)

- Files: `packages/react/src/components/Button/**`, `Button.css` (the roll
  block), `Button.manifest.json`.
- Depends on: R0 gate. Parallel: yes (step 1). HUMAN GATE: no.
- Answers: `fid-gb` section 8 and ten changes item 5 (the roll belongs to the
  hero CTA and the menubar pill only, `RollButton.tsx`).
- Steps: a `roll` boolean prop (default false) draws the label roll; the Desk
  recipe reads `[data-roll]`, never every button.
- Accept: unit test; perceive on a Desk `roll` button: the label rolls up over
  0.3s on `cubic-bezier(0.22, 1, 0.36, 1)` on hover, as `desktop.css:126-152`;
  a Desk button without `roll` does not move; contract suite green.

### R1.12 Contrast table: ruling 2 alphas and Desk dark glass (ds-qa)

- Files: `docs/reports/reset/r1-12/`, `packages/lint/src/rules/contrast.ts`
  pairs (measurement only).
- Depends on: R1.1, R1.6. Parallel: yes, with R1.2 and R1.7. **HUMAN GATE:
  the owner chooses the Desk glass values** (ruling 18).
- Answers: ruling 2; ruling 18; `STATE.md` "Waiting on owner" item 2 (muted
  and subtle text on Desk glass at 3.04 to 4.33 over bright content);
  `fid-fk2` "What could not be checked" (FK2's 20 percent border).
- Steps: for each source control boundary under 3:1 (Studio and Desk, dark
  and light), list the hue, the source alpha, the surfaces it sits on and the
  lowest alpha that passes on all of them; for Desk dark glass, measure text
  and controls over the brightest and darkest backdrops, and propose the
  lowest glass alpha that brings muted text to 4.5:1 while keeping the hue
  (see question 3 in section 17).
- Accept: the table covers every boundary pair the contrast gate knows; each
  proposed alpha is the lowest passing step at 0.01; the glass proposal shows
  before and after captures over a white, a black and a saturated backdrop.

### R1.13 Apply the owner's contrast choices (ds-tokens)

- Files: `packages/styles/{studio,desk}/tokens.*.json`, the contrast gate's
  known failure list.
- Depends on: R1.12 and the owner's answer. Parallel: yes (step 3). HUMAN
  GATE: waits on R1.12's gate.
- Accept: the known failures for Desk glass are gone from the gate; the
  contrast gate green; compare pairs touched by the change rerun and still
  within tolerance, with the changed alphas listed as allowed differences.

### R1.14 Studio Light and Desk Light, proposed again (ds-style)

- Files: `packages/styles/{studio,desk}/tokens.light.json` (only the values
  the dark revert moved), `packages/styles/{studio,desk}/recipes/*.css` light
  rules, `docs/reports/reset/r1-14/`.
- Depends on: R1.10, R1.13. Parallel: yes (step 5). **HUMAN GATE: both
  lights are proposed looks** (ruling 17).
- Answers: ruling 17; `fid-fk2` "Light scheme" (restore the FK2 light block);
  `fid-gb` "What I could not check" (GB is dark only, so Desk Light stays a
  derived design); `STATE.md` item 1 (the three open Desk Light choices).
- Accept: compare pair `fk2-shell-light` (shot 02) for Studio Light; for Desk
  Light, side by side sheets against Desk dark for every R1 component and the
  three open choices shown each way; contrast gate green.

### R1.15 Angular sync for R1 (ds-angular)

- Files: `packages/angular/src/components/{dialog,button}/**` (the eyebrow
  part, the `roll` input).
- Depends on: R1.5 and R1.11 and their reviews. Parallel: yes (step 5).
  HUMAN GATE: no.
- Answers: rule "React first"; `docs/reports/wave-1.md` "Ports go stale".
- Accept: `npm run shots -- --compare react angular` for every Angular
  component in Studio and Desk, dark and light: 0 pairs over the threshold;
  Angular contract run green.

### R1.16 R1 gate review and rescore (ds-qa)

- Files: `docs/reports/reset/r1-gate.md`, the pack and sign sheet for R1.
- Depends on: all of R1. **HUMAN GATE: the owner signs the side by side
  sheets and the recording pack for Studio and Desk.**
- Accept, the R1 gate:
  1. Every pair from the screenshot indexes of `fid-gb` (shots 04 to 14) and
     `fid-fk2` (shots 04, 06, 08 to 20) passes its tolerance table, with only
     listed allowed differences.
  2. A fresh rescore by a new `ds-qa` against both audits' scorecards: every
     area at 4 or more, except Shell (R2) and Behaviour items that R2 builds.
  3. Quiet profile perceive green for Studio and Desk.
  4. Contrast gate green with the R1.13 values; axe 0 findings.
  5. Angular pixel compare 0 over the threshold.
  6. The owner's signature is in the sign sheet.

## 6. Phase R2: source screens as templates

Goal: the GB desk, the GB Finder window, the GB canvas editor and the FK2
editor shell ship as templates and are the acceptance target (ruling 4), with
the parts they need. React only in this phase (section 1, change 6).

Schedule:

| Step | Orders | Starts when |
| --- | --- | --- |
| 0 | R2.1 (lead) | R1 gate |
| 1 | R2.2, R2.3, R2.6, R2.9 | R2.1 committed |
| 2 | R2.4 (after R2.9 releases Toolbar.css), R2.10, R2.8 | step 1 green |
| 3 | R2.5, R2.7, R2.11 | the parts each needs are green |
| 4 | R2.12, then R2.13 | step 3 green |

### R2.1 Template contract (lead)

- Files: `docs/contracts/manifest.md`, `anatomy.md`, `DECISIONS.md`,
  `packages/manifest/schema.json` (the `template` kind), `scripts/gen-index.ts`
  (template routes `/t/<slug>`).
- Answers: ruling 4; `fid-gb` ten changes item 1; `fid-fk2` "How the gap
  happened" item 4.
- Steps: where templates live (`packages/react/src/templates/<Name>/` with a
  manifest under `packages/manifest/src/template/`), the `regions` and `uses`
  keys, demo data rules (the system's sample data and synthetic images, as the
  source's own seeded mocks are; see question 11), a scope attribute for the
  inspector field skin (`data-skin="inspector"`, `fid-fk2` "Inspector"), and
  the Desk font scope (question 1).
- Accept: the schema validates a sample template manifest; `npm run gen`
  writes `/t/<slug>` routes; `npm run check` green.

### R2.2 Tree for layers (ds-component)

- Files: new `packages/react/src/components/Tree/**`, `Tree.css`, manifest,
  `packages/shared/src/tree.ts` and test, Studio and Desk recipes for Tree
  (new files).
- Depends on: R2.1. Parallel: yes (step 1). HUMAN GATE: no.
- Answers: `fid-fk2` "Layer tree" (missing), ten changes item 9; "Missing in
  the system" items 4 and 16 (SkeletonTree).
- Steps: 28px rows (36 comfortable), 8px radius, overlay 10 hover and
  selection, 14px chevron turning 90 degrees in 120ms, indentation by depth,
  hidden rows at 35 percent, roving focus and expand keys, rename in place,
  drag with drop lines and a keyboard move path (WCAG 2.5.7), a skeleton tree
  form.
- Accept: compare pair `fk2-layers` (shot 05) at 1440 for rows, chevron and
  indentation; contract suite with key hints for expand, collapse, move and
  rename; recording of a touch drag with drop lines and of the keyboard move.

### R2.3 Inspector skin, ControlRow and PropertyList (ds-component)

- Files: new `ControlRow`, `PropertyList` component folders, CSS and
  manifests; `Input.css`, `Select.css`, `SegmentedControl.css`,
  `ScrubInput.css`, `Section.css` (the `[data-skin='inspector']` blocks only;
  this order owns these files for the round).
- Depends on: R2.1. Parallel: yes (step 1). HUMAN GATE: no.
- Answers: `fid-fk2` "Inspector", "Segmented in inspector" (missing), ten
  changes item 8; "Missing in the system" items 5, 6 and 12 (MixedValue).
- Steps: inside `[data-skin='inspector']`, fields fill `#212426` (as a token),
  8px corners, 32px rows, border on hover and focus only, 12px side padding,
  8px group gap; Section swaps its icon to a chevron on hover (100ms) and turns
  the chevron in 120ms; ScrubInput turns its border canvas green while
  dragging.
- Accept: compare pair `fk2-inspector` (shot 09) at 1440: row height, fill,
  radius and padding within 1px and Delta E 2; recording of a scrub drag and a
  section toggle; contract suite green for every touched component.

### R2.4 Editor chrome parts (ds-component)

- Files: `Toolbar` (a `notch` optional part and a `peek` prop),
  `ResizablePanels` (collapse with a transform transition), a `canvas-sheet`
  region part on `PageShell`; their CSS files and manifests.
- Depends on: R2.9 (Toolbar.css passes from R2.9 to this order). Parallel:
  yes (step 2). HUMAN GATE: no.
- Answers: `fid-fk2` "Canvas toolbar" (CanvasNotch, missing), "Left panel",
  "Frame", ten changes item 6.
- Steps: the notch hangs from the canvas top centre with 16px bottom corners
  and inverse top corners, `0 12px 28px` shadow, peek rolls it up after a
  600ms delay over 180ms and back at once on hover or focus; panel collapse
  and open over 180ms.
- Accept: compare pair `fk2-shell` crop of the notch at 1440; perceive in the
  quiet profile for the peek (600ms delay, 180ms roll); keyboard focus brings
  the notch back; recording.

### R2.5 FK2 editor shell template (ds-component)

- Files: new `packages/react/src/templates/EditorShell/**`, its manifest, an
  optional `packages/styles/studio/recipes/EditorShell.css` (new file).
- Depends on: R2.2, R2.3, R2.4, R1.5 (Rail tint). Parallel: yes (step 3).
  HUMAN GATE: no.
- Answers: `fid-fk2` "Shell and layout" (Shell 1), "Missing in the system"
  item 1; ruling 4.
- Steps: 36px top bar on body with sm pill buttons, 42px tinted rail, 320px
  resizable left panel with the layer tree, the canvas sheet on surface 2 with
  a 16px top start corner (12px top end when the inspector is open), the
  notch, a 290px inspector in the inspector skin; under 900px the left panel
  folds to the rail when the inspector is open, under 760px the inspector
  overlays.
- Accept: compare pairs `fk2-shell` (shot 01) at 1440 and 390 and
  `fk2-shell-light` (shot 02): regions within 2px, colours within Delta E 2,
  masked pixel diff at most 3 percent; recording of panel resize, notch peek,
  a layer select and a scrub in the inspector; axe clean; keyboard path
  through every region.

### R2.6 GoBanana desk parts (ds-component)

- Files: new `DisplayHeading` component (two tone), `Menubar` (a `clock`
  part, a `pill` item, folding into one Menu below 768px), new
  `NotificationStack`, a `loading` skeleton form of `Window`; their CSS files
  and manifests.
- Depends on: R2.1. Parallel: yes (step 1). HUMAN GATE: no.
- Answers: `fid-gb` "Missing from the system" items 2, 3, 6 (NotificationStack),
  11 (skeleton windows); section 18 (the menubar fold).
- Steps: two tone heading from `TwoToneHeading.tsx` and `desktop.css:72-114`
  (63.4px, 500, 0.95, -0.04em, two tones); clock as `MenuClock.tsx`; the fold
  below 768px with arrow keys and pointer moving the yellow row; the stack
  fans out on hover or focus as `NotificationStack.tsx`.
- Accept: compare pairs `gb-menubar` (shot 07) at 1440 and 390 (the 390 shot
  shows the fold) and a crop of the hero heading from shot 01; recording of
  the fold menu by touch and of the stack fan.

### R2.7 GoBanana desk template (ds-component)

- Files: new `packages/react/src/templates/Desk/**`, manifest, an optional new
  `packages/styles/desk/recipes/DeskTemplate.css`.
- Depends on: R2.6, R1 gate. Parallel: yes (step 3). HUMAN GATE: no.
- Answers: `fid-gb` section 1 "Desk page" (Shell 1), ten changes item 1;
  ruling 4.
- Steps: black desk with grain, 28px glass menu bar, free glass windows on the
  window layer, the dock at the bottom centre with magnify on hover, the phone
  home screen below 768px (full width stacked windows, the folded menu).
- Accept: compare pair `gb-landing` (shot 01) at 1440 and 390; recording of a
  window growing from its dock tile and closing, and of the phone home screen
  scroll; axe clean; the GB keyboard paths (arrow keys move a window, Escape
  closes).

### R2.8 GoBanana Finder template (ds-component)

- Files: new `packages/react/src/templates/Finder/**`, manifest; a
  `selectFirst` behaviour on `Card` (first press selects and fills the
  inspector, second opens, `aria-pressed`) in `Card/**` and `Card.css`.
- Depends on: R1.9 (Desk Sidebar), R2.1. Parallel: yes (step 2). HUMAN GATE:
  no.
- Answers: `fid-gb` section 1 "Finder window", section 14, section 18 (card
  first press selects), "Missing from the system" item 4.
- Steps: glass window with the inset sidebar, a toolbar with the title, a 36px
  pill search, an Icons and List segmented switch and a New canvas button,
  cards with a 2 by 2 collage, an Inspector column with a full width yellow
  Open canvas pill; 56px list rows with a collage thumbnail on a phone.
- Accept: compare pair `gb-finder` (shot 02) and `gb-cards` (11) at 1440 and
  390; recording of select then open on a card by touch; contract suite green
  for Card.

### R2.9 Board surface, zoom and the floating tool pill (ds-component)

- Files: new `Board` and `ZoomControl` components, `Toolbar` (a `floating`
  placement), their CSS files and manifests, `packages/shared/src/zoom.ts` and
  test.
- Depends on: R2.1. Parallel: yes (step 1). HUMAN GATE: no.
- Answers: `fid-gb` section 1 "Canvas editor", section 18 (Ctrl or Cmd plus
  wheel zooms the board, never the page), "Missing from the system" item 5.
- Steps: a board on surface 2 that pans and zooms (pointer, wheel with a
  modifier, pinch, keyboard), the zoom control (out, value, in, fit), the
  floating glass tool pill (40px tall, 20px radius, `blur(24px)
  saturate(1.3)`).
- Accept: compare crop of the tool pill and zoom from `gb-editor` (shot 03) at
  1440; unit tests for the zoom math; the page never zooms on Ctrl plus wheel
  over the board; recording of pinch zoom in the Pixel frame.

### R2.10 Board cards (ds-component)

- Files: new `BoardNote`, `ImageTile`, `LinkCard`, `SwatchCard`, `TypeSample`,
  `BoardFrame` folders, CSS and manifests.
- Depends on: R2.9. Parallel: yes (step 2). HUMAN GATE: no.
- Answers: `fid-gb` "Missing from the system" item 5 (notes in paper colours,
  image tile with a source chip, link card fallback with stripes, swatch card
  with contrast chips, type sample card, section frame).
- Accept: compare crops of each card from `gb-editor` (shot 03) at 1440;
  the swatch chips compute AA, UI only and Fails from the shared contrast
  function and match a hand calculation for five colour pairs.

### R2.11 GoBanana canvas editor template (ds-component)

- Files: new `packages/react/src/templates/CanvasEditor/**`, manifest.
- Depends on: R2.9, R2.10, R1 gate. Parallel: yes (step 3). HUMAN GATE: no.
- Answers: `fid-gb` section 1 "Canvas editor" (missing), ten changes item 1;
  ruling 4.
- Steps: a window inset `clamp(0.5rem, 2.2vw, 2.25rem)` with a 44px top bar
  (lights, title, saved dot, Images and Notes switch, Phone frames switch,
  zoom, Share, more), the six step progress rail, the 42px left rail with a
  results badge, the board with seeded cards, the floating tool pill.
- Accept: compare pair `gb-editor` (shot 03) at 1440 and 390; recording of the
  board pan and zoom and the share dialog; axe clean.

### R2.12 Templates first in the gallery and docs (ds-docs)

- Files: `apps/docs/**`, `packages/registry/**`; the gallery home route in
  `apps/gallery-react/src/App.tsx` (handed over by the lead for this order).
- Depends on: R2.5, R2.7, R2.8, R2.11. Parallel: no (step 4). HUMAN GATE:
  no.
- Answers: `fid-gb` section 1 "Gallery presentation" ("the owner is judging a
  catalogue page against a product"), ten changes item 1.
- Accept: the gallery and the docs open on the four templates, each in its
  own style; a registry block per template that a fresh Vite app can add;
  link check green; axe clean.

### R2.13 R2 gate review (ds-qa)

- Files: `docs/reports/reset/r2-gate.md`, the pack and sign sheet for R2.
- Depends on: all of R2. **HUMAN GATE: the owner signs the side by side
  sheets of the four templates and the recording pack.**
- Accept, the R2 gate: the four template pairs (`fk2-shell`, `gb-landing`,
  `gb-finder`, `gb-editor`) pass at 1440 and 390; a fresh rescore of Shell and
  Behaviour in both fidelity audits at 4 or more; keyboard paths, axe, RTL and
  Arabic content cases on every template; quiet profile perceive green for
  each template's moving parts; the owner's signature.

## 7. Phase R3: motion

Goal: a press shows under the finger in every style; Neutral and Liquid carry
interactions a person sees on a phone; Studio and Desk stay quiet (ruling 3);
Angular gets the same motion.

Schedule:

| Step | Orders | Starts when |
| --- | --- | --- |
| 1 | R3.1, R3.3 | R1 gate |
| 2 | R3.2, R3.4, R3.5 | R3.1 and R3.3 green |
| 3 | R3.6, R3.9 | step 2 green |
| 4 | R3.7, R3.8 | R3.6 green (Button.css and DropdownMenu.css released) |
| 5 | R3.10 (after the React reviews), then R3.11 | step 4 green |

Every R3 order also proves that Studio and Desk did not move: the R1 quiet
profile perceive run is repeated and must be unchanged.

### R3.1 Press under the finger: the press state and the Button family (ds-component)

- Files: new `packages/shared/src/press.ts` and test,
  `packages/react/src/internal/usePress.ts` (new),
  `packages/react/src/components/{Button,IconButton,ToggleButton,SplitButton,CopyButton,CloseButton,FloatingActionButton}/**`,
  `Button.css`.
- Depends on: R1 gate. Parallel: yes, with R3.3. HUMAN GATE: no.
- Answers: `motion` suspect (i) and change 1; `material` "State layers and
  ripple" and ten changes item 1; summary root cause 4.
- Steps: `data-pressed` set on `pointerdown` (and on Space or Enter down),
  cleared on `pointerup`, `pointercancel` and leave, held at least 120ms (225ms
  on `android`, with the 150ms touch delay that cancels on scroll); CSS reads
  `[data-pressed]`, never `:active`; the android ripple grows from the press
  point while held.
- Accept: perceive on a 90ms tap in the Pixel frame: latency at most 32ms in
  Neutral, Liquid, Studio and Desk (182ms for the android ripple); the press
  look lasts at least 120ms; during a 600ms hold the press look is on the whole
  time (today it is off, `material` "State layers and ripple"); a scroll that
  starts on a button cancels the ripple; recording; device check on both
  phones (press under a real finger).

### R3.2 Press under the finger: the other pressables (ds-component)

- Files: `Chip`, `Card`, `Tabs`, `SegmentedControl`, `ToggleGroup`, `List`,
  `DropdownMenu` items, `Pagination`, `Switch`, `Checkbox`, `RadioGroup` (the
  press wiring and their CSS press blocks; `DropdownMenu.css` returns to R3.6
  after this order).
- Depends on: R3.1. Parallel: yes (step 2). HUMAN GATE: no.
- Answers: `motion` suspects (b) and (i), change 6 (Card press on touch);
  `material` ten changes item 11 (press shown on touch on selection controls).
- Accept: the R3.1 measures on each component; Card on touch presses to 0.97
  with a shadow drop on `pointerdown` in Neutral and Liquid (perceive), and
  its hover lift is gated by `(hover: hover)`; recording.

### R3.3 Neutral and Liquid motion tokens and spring baking (ds-tokens)

- Files: `packages/tokens/build.ts` (spring baking), `packages/styles/{neutral,liquid}/tokens.*.json`
  (motion groups only).
- Depends on: R1 gate. Parallel: yes, with R3.1. **HUMAN GATE: the values
  are a proposed look** (`motion` change 2 calls it an owner decision).
- Answers: `motion` change 2, change 10 and suspect (h) (Neutral's springs
  peak at 1.0); `material` "Motion" (springs baked from stiffness and damping).
- Steps: springs baked to `linear()` with 40 or more stops from the spring
  solver; Neutral starting values to judge on a phone: press 0.94 to 0.96,
  `distance.enter` 12 to 16px, `scale.enter` 0.9 for popups, snappy 240 to
  280ms, bouncy 350 to 450ms with 4 to 8 percent overshoot, colour fades 150ms
  or more; Liquid keeps its springs with real overshoot.
- Accept: a spring test that measures overshoot from the baked curve within 1
  percent of the solver; snapshot tests; no `steps(1)` in Neutral or Liquid
  motion tokens (grep).

### R3.4 Neutral motion preset (ds-style)

- Files: `packages/styles/neutral/motion.ts`, `recipes/Motion.css`,
  `recipes/Switch.css` (track colour fade), `recipes/Checkbox.css`.
- Depends on: R3.3. Parallel: yes, with R3.5. **HUMAN GATE: proposed.**
- Answers: `motion` "The twenty components" (Neutral, nine invisible),
  changes 2 and 3.
- Accept: perceive in the rich profile on the twenty components of `motion`
  in Neutral, Pixel and iPhone frames: at least 18 of 20 pass, and every one of
  the six signature moments that R3.6 and R3.7 own is listed as pending there;
  the switch track and radio ring fade over 150ms or more (no cut); recording
  pack; the owner signs on a device (device check).

### R3.5 Liquid motion preset (ds-style)

- Files: `packages/styles/liquid/motion.ts`, `recipes/Motion.css`.
- Depends on: R3.3. Parallel: yes, with R3.4. **HUMAN GATE: proposed.**
- Answers: `motion` "By style" (Liquid is close to perceivable); `liquid`
  scorecard Motion 2 and "Detailed comparison" section 7.
- Accept: as R3.4, in Liquid; sheets and menus show overshoot of 2 to 8
  percent where the spring says so; reduced motion turns morph and stretch
  into fades only (`liquid` "What Liquid on the web should be", fallback 5).

### R3.6 Open from the trigger (ds-component)

- Files: `packages/motion/src/patterns/morph.ts` (new) and test,
  `DropdownMenu.css`, `Select.css`, `Popover.css`, `Dialog.css` (the open and
  close blocks), their React folders where the trigger box must be measured.
- Depends on: R3.2, R3.4, R3.5. Parallel: yes, with R3.9. HUMAN GATE:
  proposed (motion look).
- Answers: `motion` change 4 and the reference rows `share_sheet` and
  `dropdown_disclosure`; `liquid` ten changes item 4 (overlays that morph out
  of their source).
- Steps: a `morph` pattern that starts at the trigger's box, scales to the
  panel with FLIP on transform, with a 4 to 8px blur that clears, and closes
  back into the trigger; on in Neutral and Liquid, off in Studio and Desk.
- Accept: perceive on menu, select, popover and sheet from a button in
  Neutral and Liquid: the panel's first frame sits within 2px of the trigger
  box; the main change lasts 250 to 450ms; Studio and Desk unchanged from R1;
  recording beside the reference clip names in `motion`.

### R3.7 Signature controls and result states (ds-component)

- Files: `Switch`, `Checkbox`, `CopyButton`, `Toast`, `Tabs` folders and CSS;
  `Button` (a result state when `onClick` returns a promise) and `Button.css`.
- Depends on: R3.6 (Button.css and Toast.css free). Parallel: yes, with R3.8.
  HUMAN GATE: proposed.
- Answers: `motion` change 3 (six signature moments), change 5 (change the
  whole control on a result), "What should move from the stages into the
  defaults".
- Accept: each signature moment has two or three beats over 300 to 500ms and
  one secondary reaction (perceive, rich profile); CopyButton changes its fill
  over the whole control and rolls the label to the copied word; a Button
  whose handler returns a promise shows loading then success or error; Studio
  and Desk unchanged; recording pack.

### R3.8 Neighbours and touch equivalents (ds-component)

- Files: `Tabs` (panel), `Accordion`, `List`, `Tooltip` folders and CSS.
- Depends on: R3.6. Parallel: yes, with R3.7 (no shared files: Tabs CSS
  panel block belongs to this order, the indicator block to R3.7; the lead
  hands the file over between them). HUMAN GATE: proposed.
- Answers: `motion` change 7 (move the neighbours: the 49px Accordion jump,
  the Tabs panel cut), change 6 (Tooltip on touch: entrance, stays about 1.5s
  after the finger lifts).
- Accept: perceive: the Accordion items below glide on transform with no
  frame jump over 2px; the Tabs panel slides 16 to 24px in the direction of
  travel; a Tooltip long press plays the entrance and stays 1.5s after lift;
  recording.

### R3.9 Feedback helper: haptics and optional sound (ds-component)

- Files: new `packages/shared/src/feedback.ts` and test, its wiring in
  `packages/react/src/theme/**`.
- Depends on: R3.2. Parallel: yes, with R3.6. **HUMAN GATE: the owner decides
  on sound** (`motion` change 8 calls it an owner decision).
- Answers: `motion` change 8; `mobile` "Haptics hooks" (missing); `material`
  "What must change in components" (haptics row).
- Steps: `haptic(kind)` with `confirm`, `reject`, `tick`, `toggle`,
  `long-press`: a 10 to 15ms `navigator.vibrate` on Android web, a no op on iOS
  web, off when the theme says so; sound through Web Audio with short
  synthesised clicks and no files, off by default, behind a theme setting.
- Accept: unit tests; on the Pixel device check the switch and slider tick;
  sound plays only when turned on; no dependency added.

### R3.10 Angular press and motion (ds-angular)

- Files: `packages/angular/src/internal/` (press directive),
  `packages/angular/src/components/**` for the components R3.1 to R3.8
  touched that Angular has.
- Depends on: R3.1 to R3.8 and their reviews. Parallel: no. HUMAN GATE: no.
- Answers: the R3 brief ("Angular gets the same motion"); `wave-1-followups.md`
  round 4 (an Angular motion order).
- Accept: perceive against the Angular gallery gives the same numbers as React
  within the motion tolerances for every ported component; `npm run shots --
  --compare react angular` 0 over the threshold; Angular contract run green.

### R3.11 R3 gate review and blind comparison (ds-qa)

- Files: `docs/reports/reset/r3-gate.md`, the R3 pack and sign sheet.
- Depends on: all of R3. **HUMAN GATE: the owner signs the recordings and
  does the device check on both phones.**
- Accept, the R3 gate:
  1. Rich profile perceive: 20 of 20 components pass in Neutral and Liquid on
     both phone frames.
  2. Quiet profile: Studio and Desk equal their R1 numbers.
  3. Latency at most 32ms everywhere (182ms for android ripples).
  4. Blind comparison: each signature clip next to the reference page the
     owner opens on the phone (the reference clips stay out of the repo), and
     ours is not picked as weaker in most pairs.
  5. Reduced motion: 0 interactions move; Angular equal to React.

## 8. Phase R4: the web phone

Goal: the web components become a phone app (ruling 6): safe areas, bars and
a stack, sheets with detents, phone forms of overlays, row gestures, back
handling, behaviour profiles for `ios`, `android` and `macos`, Liquid's
structure, and a phone demo app that proves it.

Schedule:

| Step | Orders | Starts when |
| --- | --- | --- |
| 0 | R4.1 (lead) | R0 gate, R3.2 green |
| 1 | R4.2, R4.4, R4.13, R4.17 | R4.1 committed |
| 2 | R4.3, R4.5, R4.8, R4.10 | step 1 green |
| 3 | R4.6, R4.7, R4.9 (after R4.8), R4.11, R4.12 | step 2 green |
| 4 | R4.14, R4.15, R4.16, R4.18, R4.19 | step 3 green; R3 gate for R4.18 |
| 5 | R4.20, then R4.21; R4.22 | step 4 green; R4.22 after the React reviews |
| 6 | R4.23 | all of R4 green |

### R4.1 Contract additions for the phone (lead)

- Files: `docs/contracts/anatomy.md`, `frameworks.md`, `tokens.md`,
  `DECISIONS.md`.
- Answers: `liquid` "Changes in components" (a concentric radius rule, a
  `glass` part role), `material` "What must change in components" (window
  class `data-window`, inset tokens written by bars, a `state-layer` and a
  `ripple` part), `mobile` "Proposed mobile component set".
- Steps: write the concentric rule (each container exposes `--_radius` and
  `--_inset`, children compute their own, floor `radius.min-concentric`); the
  `glass` part role; `data-window` (`compact` to `extra-large`) on the Theme
  element; inset tokens a bar writes while mounted
  (`--ds-inset-bottom-navigation`, `--ds-inset-fab`); whether Button gains
  `glass` emphases for Liquid bars or Liquid draws an existing emphasis as
  glass inside bars (a lead decision recorded here).
- Accept: each rule written with an example; `npm run check` green.

### R4.2 Phone foundation: viewport, safe areas, keyboard, touch hygiene (ds-component)

- Files: `apps/gallery-react/index.html`, `apps/gallery-react/src/platforms.css`
  and `gallery.css` (phone frame padding), `packages/css/src/base.css`, new
  `SafeArea` and `KeyboardAvoider` components, `packages/react/src/theme/**`
  (insets provider, `data-window`), the overlay focus rule in
  `packages/shared/src/dialog-focus.ts`.
- Depends on: R4.1. Parallel: yes (step 1). HUMAN GATE: no.
- Answers: `mobile` change 1 and change 9, "Safe areas and home indicator",
  "Keyboard avoidance", "Tap highlight", "Overscroll", "Focus ring on tap";
  `material` "Edge to edge and insets on the web".
- Steps: viewport meta with `viewport-fit=cover` and
  `interactive-widget=resizes-content`; insets as CSS variables; a keyboard
  inset from `visualViewport`; transparent tap highlight and
  `touch-action: manipulation` on all controls; `user-select: none` and
  `-webkit-touch-callout: none` on interactive rows; `overscroll-behavior: none`
  on the app root of a phone template; overlays do not autofocus a text field
  when opened by touch, and a touch focus shows no ring; gallery phone screens
  drop the 34px frame gutter for 16 to 20px.
- Accept: on `/platforms/screen` in the iPhone frame the inset variables
  resolve to the emulated insets; a sheet opened by tap leaves
  `document.activeElement` off any text field; no list row or switch shows the
  blue tap flash; screen gutters measure 16 to 20px; device check on the
  owner's iPhone in Safari added to the home screen: bars sit under the status
  bar and above the home indicator (recording).

### R4.3 Phone viewport and safe areas in the docs site (ds-docs)

- Files: `apps/docs/**` (the layout's viewport meta and the preview frames).
- Depends on: R4.2. Parallel: yes (step 2). HUMAN GATE: no.
- Answers: `mobile` change 1 (the docs `Layout.astro` lacks `viewport-fit`).
- Accept: the docs viewport meta matches the gallery's; previews show insets
  on the iPhone descriptor; axe clean.

### R4.4 Back handling for every modal surface (ds-component)

- Files: new `packages/shared/src/back.ts` and test,
  `packages/react/src/internal/useBackClose.ts` (new), the open state wiring in
  `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, `DropdownMenu`, `Popover`,
  `ContextMenu` React folders (no CSS).
- Depends on: R4.1. Parallel: yes (step 1). HUMAN GATE: no.
- Answers: `material` "Back gesture" (score 0) and ten changes item 2;
  `mobile` "Navigation stack and back gesture".
- Steps: a close watcher where the browser has one, otherwise a history entry
  on open that closes on `popstate`; nested surfaces close top first; closing
  by other means removes the entry.
- Accept: Playwright `page.goBack()` with a dialog open on `/c/dialog` closes
  the dialog and stays on the page, for each listed component; with a sheet
  over a dialog, two backs close both in order; device check on the Pixel:
  the system back gesture closes a sheet first (recording).

### R4.5 NavigationBar (ds-component)

- Files: new `NavigationBar` folder, CSS and manifest (wraps Navbar parts);
  `Navbar.css` (shared parts).
- Depends on: R4.2. Parallel: yes (step 2). HUMAN GATE: proposed look.
- Answers: `mobile` change 2 and "Top app bar" (squeezed); `liquid` ten
  changes item 3; `material` ten changes item 7.
- Steps: sticky, edge to edge under the status bar, a leading back, a plain
  text title (17 semibold on `ios`, 22 on `android`, from the platform type
  ramp), trailing actions, a large title part that collapses on scroll, a
  search slot, a scroll edge material; never an underlined link title, never a
  hamburger on a phone.
- Accept: on the iPhone frame the title is 17px semibold text, not a link; a
  scroll of 100px collapses the large title (34 to 17) and fills the bar
  (perceive); the bar stays at the top while scrolling; Android title 22px;
  recording on both frames.

### R4.6 NavigationStack (ds-component)

- Files: new `NavigationStack` folder, CSS, manifest, `packages/shared/src/stack.ts`
  and test.
- Depends on: R4.4, R4.5. Parallel: yes (step 3). HUMAN GATE: proposed.
- Answers: `mobile` "Navigation stack and back gesture" (missing), change 6;
  `liquid` "Navigation stack with back and edge swipe" (missing).
- Steps: push and pop with a shared bar, a back button, an edge swipe back on
  `ios` that follows the finger, system back on `android` through R4.4, state
  kept per tab, the title moving between bars; a button path for every swipe.
- Accept: recording of push, back button, edge swipe (half and full, with
  release before and past the threshold) on the iPhone frame and back on the
  Pixel frame; the swipe follows the finger 1:1 (perceive); keyboard and
  screen reader path to go back.

### R4.7 Phone TabBar and NavigationSuite (ds-component)

- Files: `TabBar` folder and `TabBar.css`, new `NavigationSuite` folder, CSS
  and manifest, `FloatingActionButton` placement (its React folder only).
- Depends on: R4.2. Parallel: yes (step 3). HUMAN GATE: proposed.
- Answers: `mobile` change 3 (24px icons, filled or heavier current item, lift
  toasts and the FAB); `liquid` ten changes item 7 (minimise on scroll, an
  accessory, a separate search item); `material` ten changes items 3 and 5
  (bar below 600, rail from 840, expanded rail from 1200).
- Steps: 24px icons with a heavier stroke on the current item (Lucide has no
  filled forms; Material allows a heavier stroke, `material` licences note);
  the bar writes `--ds-inset-bottom-navigation`; the FAB and toaster read it;
  minimise on scroll down; NavigationSuite renders bar, rail or expanded rail
  by `data-window`.
- Accept: on the Pixel frame the FAB sits above the bar with a gap and never
  overlaps the last item (today it does, `mobile` finding 3); icons measure
  24px; at 600, 840 and 1200 wide the suite switches (screenshots); recording
  of minimise on scroll.

### R4.8 Sheet on the phone (ds-component)

- Files: `Sheet` React folder, `Dialog.css` (this order owns it for the
  round; R4.9 takes it next).
- Depends on: R4.2, R4.4. Parallel: yes (step 2). HUMAN GATE: proposed.
- Answers: `mobile` change 4 and "Bottom sheet with detents and drag"
  (partial); `liquid` ten changes item 5; `material` "Bottom sheets and
  snackbars" and component change 6.
- Steps: inset 6px at the medium detent with 34px top corners and concentric
  bottom corners on `ios`; 28px corners and a plain scrim on `android`; drag
  from the content when scrolled to the top; a non modal detent where the page
  stays usable; actions in the bar or a full width primary pinned above the
  home indicator at every detent; a 17px centred title and a circular close on
  `ios`; a handle tap cycles heights on `android`; more opaque at the large
  detent in Liquid.
- Accept: at the half detent on both frames the primary action is on screen
  (today it is below the edge); a drag that starts in the body at scroll top
  moves the sheet; a non modal sheet leaves the page scrollable; geometry
  equals the platform tokens in all four styles (the R0.15 matrix); recording
  of open, detent drag, flick close and handle tap.

### R4.9 Phone forms of Dialog and Alert, and ActionSheet (ds-component)

- Files: `Dialog`, `AlertDialog` React folders, new `ActionSheet` folder and
  manifest, `Dialog.css` (after R4.8).
- Depends on: R4.8. Parallel: yes (step 3). HUMAN GATE: proposed.
- Answers: `mobile` change 5, "Modal sheet and full screen cover" (missing),
  finding 2 (a five field form in a 270pt alert); `material` component change
  7 (text actions, a full screen dialog for forms); `liquid` "Action sheet or
  confirmation dialog from its source" (missing).
- Steps: Dialog with a form on a compact phone becomes a page sheet on `ios`
  and a full screen dialog on `android` with Cancel, the title and the primary
  in the bar; an Alert is never a form, Android actions are text buttons; an
  ActionSheet with a separate cancel and destructive rows in the danger tone,
  anchored to its source on `ios` (morph from R3.6); a discard confirm when a
  sheet with changes is swiped down.
- Accept: the `/platforms/screen` form screen on the iPhone frame shows a page
  sheet, not a 270 wide alert; the Android alert's actions are text buttons
  with no ring on open; recording of each form and of the discard confirm.

### R4.10 Select, WheelPicker and the Popover fallback (ds-component)

- Files: `Select` folder and `Select.css`, new `WheelPicker` folder, CSS and
  manifest, `Popover` folder and `Popover.css`.
- Depends on: R4.2. Parallel: yes (step 2). HUMAN GATE: proposed.
- Answers: `mobile` "Picker and wheel picker" (missing), "Popup and popover on
  a phone" (squeezed), change 5; `liquid` "Popover (tablet), sheet on a
  compact phone".
- Steps: on a compact phone Select opens a pull down menu (`ios`), a sheet
  with a list (`android`) or a WheelPicker when asked; WheelPicker snaps with a
  haptic tick (R3.9) and has a keyboard path; Popover falls back to a sheet on
  a compact phone.
- Accept: on both phone frames no 224px floating listbox opens; the wheel
  snaps to an item after a flick (perceive); keyboard arrows step the wheel;
  recording.

### R4.11 Menus on touch and LongPressMenu (ds-component)

- Files: `DropdownMenu`, `ContextMenu` folders, `DropdownMenu.css`.
- Depends on: R3 gate (R3.6 released the file). Parallel: yes (step 3).
  HUMAN GATE: proposed.
- Answers: `mobile` finding 2 (shortcuts shown on touch, no lifted preview);
  `liquid` recipe change 8; `material` component change 9 (long press menus
  stay open after the finger lifts).
- Accept: under `(hover: none) and (pointer: coarse)` no shortcut hint shows;
  a long press lifts a preview of the pressed item, dims and blurs the page,
  and the menu stays open after lift; recording on both frames.

### R4.12 Toast on the phone (ds-component)

- Files: `Toast` folder and `Toast.css`.
- Depends on: R4.7 (the inset tokens), R3 gate. Parallel: yes (step 3).
  HUMAN GATE: proposed.
- Answers: `mobile` finding 3 (the snackbar sits on the tab bar);
  `material` component change 2 and ten changes item 3.
- Steps: Android snackbar on the inverse surface, no icon, one text action,
  above the navigation bar and above a FAB, one at a time; iOS compact banner
  from the top with no icon frame and no outlined action.
- Accept: on the Pixel frame the snackbar's bottom edge sits above the bar's
  top edge and the FAB moves up with it (measured, today y 646 over y 639);
  only one snackbar shows; recording of show, undo and swipe.

### R4.13 ListSection and SwipeActions (ds-component)

- Files: `List` folder and `List.css` (a `section` part with header, footer
  and value column), new `SwipeActions` folder, CSS and manifest.
- Depends on: R4.1. Parallel: yes (step 1). HUMAN GATE: proposed.
- Answers: `mobile` change 7, "Swipe actions on rows" and "Section headers
  and footers" (missing), "List rows" (60 and 64 tall for one line);
  `material` component change 14.
- Steps: inset groups with header and footer, a value column, disclosure;
  rows 44 on `ios` and 56 on `android`; leading and trailing actions with a
  full swipe, a button path and screen reader actions; no inline trash buttons
  on touch.
- Accept: one line rows measure 44 and 56; a swipe reveals the actions and a
  full swipe runs the first; a screen reader actions menu lists them
  (contract key hint); recording.

### R4.14 PullToRefresh, ScrollEdge, PageIndicator and Carousel (ds-component)

- Files: new `PullToRefresh`, `ScrollEdge`, `PageIndicator`, `Carousel`
  folders, CSS and manifests; `packages/react/src/internal/useScrollEdge.ts`
  (from R4.17, read only here).
- Depends on: R4.2, R4.17. Parallel: yes (step 4). HUMAN GATE: proposed.
- Answers: `mobile` "Pull to refresh", "Page indicator and carousel",
  "Onboarding" (missing).
- Accept: pull past the threshold shows the spinner from the top edge with a
  rubber band and refreshes; the page never reloads (overscroll contained);
  carousel pages snap and the indicator follows; each gesture has a button
  path; recording.

### R4.15 SearchBar, BottomToolbar, QuantityStepper and FAB menu (ds-component)

- Files: new `SearchBar`, `BottomToolbar`, `QuantityStepper` folders, CSS and
  manifests; `FloatingActionButton` (a menu form) and its block in
  `Button.css` (released by R3).
- Depends on: R4.5, R4.7. Parallel: yes (step 4). HUMAN GATE: proposed.
- Answers: `mobile` "Search bar" (squeezed), "Bottom toolbar", "Stepper (plus
  and minus)", "Speed dial" (missing); `material` component change 3 (a FAB
  menu); `material` "Text fields" (the SearchField 56 inside 28 defect).
- Accept: the search bar sits in the bar or the tab bar with cancel and scope
  chips; its box height equals its field height on every platform (the
  defect is gone); the FAB menu opens two to four labelled actions; recording.

### R4.16 Platform profiles for the new parts (ds-style)

- Files: `packages/css/src/platform/{ios,android,macos}.css` (both layers).
- Depends on: R4.5 to R4.15. Parallel: yes (step 4). HUMAN GATE: proposed.
- Answers: ruling 6; `material` "Structural recommendation", option 3 (the
  platform owns behaviour and proportion); `liquid` "What a desktop form
  needs"; ruling 16 for every new part.
- Accept: the R0.15 matrix rerun with every new part: chrome parts take the
  platform's values in every style, controls keep the style's; `macos` sizes
  on the new desktop parts; recording on both phone frames.

### R4.17 Liquid hooks and Toolbar groups (ds-component)

- Files: new `packages/react/src/internal/{useBackdropTone,useScrollEdge,usePressPoint}.ts`
  and tests, `Toolbar` folder and `Toolbar.css` (`group` and `spacer` parts),
  the concentric radius wiring in container components named by R4.1.
- Depends on: R4.1. Parallel: yes (step 1). HUMAN GATE: no (structure).
- Answers: `liquid` "Changes in components" (hooks, Toolbar groups), ten
  changes items 1, 3 and 6.
- Accept: unit tests for each hook; Toolbar renders one capsule per group;
  the five concentric breaks of `liquid` (dialog, ios segmented control, sheet,
  dock, toast) measure inner radius equal to outer minus inset, within 1px.

### R4.18 Liquid material and structure (ds-style)

- Files: `packages/styles/liquid/**`.
- Depends on: R4.17, R3 gate. Parallel: yes (step 4). **HUMAN GATE:
  proposed.**
- Answers: `liquid` "Proposal (a)" and "(b)", ten changes items 1, 2, 5, 6, 7
  and 10; `liquid` scorecard Adaptivity 1.
- Steps: adaptive glass (a 60 percent fill on small bars with ink that flips
  light and dark by backdrop tone, measured 4.90 for muted text), the two tone
  inner edge, a specular highlight from pointer and press point, a scroll edge
  mask, `tinted` as a tint on one prominent control, Window body solid with
  glass only on a unified toolbar band, Dock as a capsule, sidebar as large
  floating glass; refraction stays an opt in behind `data-refraction`,
  Chromium only, off by default.
- Accept: the contrast gate over white, black and five saturated backdrops
  with the adaptive fill: text 4.5:1 and muted text 4.5:1; no glass on any
  content surface (Window body, cards, tables, charts); reduced transparency,
  more contrast and `data-transparency="reduce"` give solid surfaces; the
  phone demo screens of `liquid` "Demo screens that prove it" 1 to 5 captured
  over plain, busy, bright and dark backdrops; device check on the iPhone for
  blur cost (recording while scrolling).

### R4.19 macOS desktop parts (ds-component)

- Files: new `Inspector` folder, CSS and manifest; `TitleBar` (a unified
  toolbar mode), `Sidebar` (a source list variant) and `Sidebar.css`.
- Depends on: R0.14, R4.17. Parallel: yes (step 4). HUMAN GATE: proposed.
- Answers: `liquid` "What a desktop form needs" (Inspector, source list,
  unified toolbar missing), ten changes items 8 and 9.
- Accept: with `platform=macos` at 1440 wide, a three column window renders
  from system parts (floating sidebar, content, inspector, unified toolbar
  with three groups, controls at the leading top); an inactive window shows
  grey controls; screenshots over a busy backdrop. Table, OutlineView and the
  settings window go to wave 2 (section 12).

### R4.20 Phone demo app, part 1: Home, Search, Detail (ds-component)

- Files: new `examples/phone-web/**` (Vite app, plain CSS).
- Depends on: R4.5 to R4.16. Parallel: no (step 5). HUMAN GATE: no (it shows
  proposed parts).
- Answers: `mobile` "What a phone demo app must prove" items 1 to 3.
- Steps: four tabs, built only from system parts; Home with a collapsing large
  title, pull to refresh, list sections with swipe actions and a FAB that
  clears the tab bar; Search with the search bar, scope chips, results and an
  empty state; Detail pushed on the stack, back by button, edge swipe and
  system back, share opens an action sheet, a long press menu with a preview.
- Accept: `ds doctor` on the app: 0 findings; the app runs in four styles,
  both platforms, light and dark, English and Arabic (URL keys); recording of
  every gesture on both frames.

### R4.21 Phone demo app, part 2: Create, Settings, Onboarding (ds-component)

- Files: `examples/phone-web/**`.
- Depends on: R4.20. Parallel: no. HUMAN GATE: no.
- Answers: `mobile` "What a phone demo app must prove" items 4 to 6.
- Steps: Create as a full screen form with the keyboard inset, a wheel
  picker and the platform date input (the phone DatePicker waits for the wave
  2 date family, section 12), and a discard confirm on swipe down; Settings as
  a grouped inset list with switches, a medium detent sheet that stays usable
  and a snackbar with undo; Onboarding on first launch with a page indicator
  and a permission pre prompt.
- Accept: as R4.20; the keyboard never covers the focused field or the
  primary action (device check on both phones, recording).

### R4.22 Angular phone ports in reach (ds-angular)

- Files: new `packages/angular/src/components/{sheet,drawer}/**`, the back
  handling and safe area wiring in `packages/angular/src/theme/**` and
  `internal/`, the Angular toast for the phone forms.
- Depends on: R4.2, R4.4, R4.8, R4.12 and their reviews. Parallel: yes (step
  5). HUMAN GATE: no.
- Answers: `wave-1-followups.md` round 5 item 3 (Angular has no Sheet or
  Drawer); `mobile` "Angular on a phone" (score 1).
- Accept: Angular Sheet and Drawer pass the contract suite with detents and
  swipe to dismiss; `page.goBack()` closes them; Angular pixel compare 0 over
  the threshold; perceive equal to React.

### R4.23 R4 gate review and device check (ds-qa)

- Files: `docs/reports/reset/r4-gate.md`, the R4 pack, sign sheet and device
  script.
- Depends on: all of R4. **HUMAN GATE: the owner runs the phone demo on the
  iPhone in Safari added to the home screen and on the Android phone in
  Chrome, records each gesture, and signs.**
- Accept, the R4 gate:
  1. A fresh rescore against the `mobile` scorecard: every area 4 or more
     except React Native (R5); against `material` for the web rows and
     `liquid` for phone bars, overlays and adaptivity: 4 or more.
  2. The R0.15 matrix with every phone part passes.
  3. Perceive rich profile green for every gesture in Neutral and Liquid;
     quiet profile unchanged in Studio and Desk.
  4. Every swipe and drag has a button or key path (contract hints).
  5. The owner's device recordings and signature.

## 9. Phase R5: React Native

Goal: a native build that is right on a device (rulings 8 to 12): the 28
defects fixed, an app root, system chrome through the approved packages,
isolated and pinned, drawn brand controls with a behaviour profile per
platform, icons rendered to images, and device verification through cloud
builds and flows on an Android emulator and an iOS simulator, plus the owner's
device checklists.

Schedule:

| Step | Orders | Starts when |
| --- | --- | --- |
| 1 | R5.1 (lead, installs) | R0 gate |
| 2 | R5.2, R5.4, R5.5 | R5.1 done |
| 3 | R5.3, R5.6 (needs the owner's Expo account and token) | R5.2 green |
| 4 | R5.7, R5.8 | R5.4, R5.5 and R5.6 green |
| 5 | R5.9, R5.10 | step 4 green |
| 6 | R5.11, R5.12, R5.13 | R1 and R3 gates, step 5 green |
| 7 | R5.14, then R5.15, then R5.16 | step 6 green |

Rules for every R5 order: no native component is "done" until its row in the
device checklist is green (`native` section 8 item 10). Web export screenshots
are never native evidence (`native` section 6).

### R5.1 Install the approved native packages (lead)

- Files: root `package.json`, the lockfile, `packages/native/package.json`,
  `apps/gallery-native/package.json` and `app.json`,
  `packages/manifest/schema.json`, `DECISIONS.md`, `THIRD_PARTY_NOTICES.md`.
- Installs: yes, alone.
- Answers: ruling 9; `native` defect 23 (no `peerDependencies`), section 7,
  section 8 items 1, 7 and 8.
- Steps: install, pinned to exact versions matched to Expo SDK 58:
  `react-native-screens`, `expo-router`, `@expo/ui`,
  `react-native-keyboard-controller`, `expo-status-bar` (ruling 9), and the
  already allowed `react-native-gesture-handler`, `expo-haptics`,
  `expo-glass-effect`, `expo-blur`; declare peers in `packages/native`; a lint
  rule (ds-qa writes it in R5.15) that only `packages/native/src/platform/`
  imports `@expo/ui` and `react-native-screens`; the manifest schema gains
  `frameworks.native.implementation` per platform (`platform-view`, `drawn`,
  `wrapped:<package>`).
- Accept: `npx expo-doctor` in `apps/gallery-native` passes every check but
  the known two React copies; the licences are in `THIRD_PARTY_NOTICES.md`;
  `npm run check` green.

### R5.2 Theme defects (ds-native)

- Files: `packages/native/src/theme/**`, `packages/native/jest.config.cjs`.
- Depends on: R5.1, R0.13. Parallel: yes (step 2). HUMAN GATE: no.
- Answers: `native` defects 15, 16, 17, 18, 19, 20, 21, 24.
- Steps: follow the system scheme by default; read font scale, bold text and
  cross fade; settle accessibility settings before the first frame or render a
  neutral first frame; read `themes[style][scheme][platform]`; system fonts as
  the platform font; springs as numbers; a style without native themes warns
  and uses Neutral, never Studio silently; jest under both `jest-expo/ios` and
  `jest-expo/android` in `npm run check`.
- Accept: both jest presets green; a test per defect, named with the defect
  number; no theme asks for `Segoe UI` or `SFMono-Regular`.

### R5.3 Button and IconButton on the platform press (ds-native)

- Files: `packages/native/src/components/{Button,IconButton}/**`, new
  `packages/native/src/feedback/haptics.ts` (the native side of R3.9's
  `haptic(kind)`).
- Depends on: R5.2, R3.9 (the shared names). Parallel: yes (step 3). HUMAN
  GATE: device row.
- Answers: `native` defects 1 to 14.
- Steps: Gesture Handler 3 `Touchable` (ripple from the touch point on
  Android, highlight on iOS, on the platform thread), pressed colours from a
  shared value, `disabled` passed through, a visible focus state, overridable
  unique test ids, a spinner that keeps moving under reduce motion with a non
  moving cue, the large content viewer on icon only buttons, labels that wrap
  at large text, platform metrics from the platform layer (iOS 17pt label,
  Android 14 and 40 tall), the view bounds at the touch size, haptics where
  named.
- Accept: jest under both presets with a test per defect; Maestro flow on the
  emulator and simulator (R5.6) with screenshots per style and scheme; device
  checklist rows "Button press" green on both phones.

### R5.4 App root (ds-native)

- Files: new `packages/native/src/app/**`, `apps/gallery-native/src/App.tsx`.
- Depends on: R5.1. Parallel: yes (step 2). HUMAN GATE: device rows.
- Answers: `native` section 8 item 5, defects 25 and 26.
- Steps: `AppRoot` with `GestureHandlerRootView`, `SafeAreaProvider`, the
  status and navigation bar style per scheme, edge to edge insets and the
  keyboard provider; the gallery's axis options announce selection through
  `accessibilityState`.
- Accept: jest; simulator and emulator screenshots show content under
  transparent bars with insets applied; device rows "Edge to edge" and "Notch
  and home indicator" green.

### R5.5 Icon to image pipeline (ds-style)

- Files: `packages/icons/**` (a build step and its test).
- Depends on: R5.1. Parallel: yes (step 2). HUMAN GATE: no.
- Answers: ruling 11; `native` section 7 (native tab and toolbar icons take
  images; no vendor symbol set).
- Steps: render each system icon from `lucide-static` and `pixelarticons` to
  PNG at 1x, 2x and 3x with the Chromium that Playwright already provides (no
  new rasteriser), pixel icons without smoothing, a heavier stroke form of
  each Lucide icon for the current tab item; a typed map for native chrome.
- Accept: every system icon exists at three scales in the build output;
  pixel icons have only fully on or fully off edge pixels at 1x (a test);
  deterministic output (two runs, byte equal).

### R5.6 Device verification: cloud builds and flows (ds-qa)

- Files: `apps/gallery-native/eas.json`, `apps/gallery-native/.maestro/**`,
  `apps/gallery-native/.eas/workflows/**`, `docs/reports/reset/native-devices.md`.
- Depends on: R5.4. Parallel: yes (step 3). **HUMAN GATE: the owner creates
  the Expo account and saves its access token as a network secret on the
  environment (ruling 12).** The token never enters the repo or a chat.
- Answers: ruling 12; `native` section 6 and section 8 items 9 and 10.
- Steps: build profiles for a development build, an iOS simulator build and an
  Android emulator build; Maestro flows per native component and per demo
  screen; a workflow that runs the flows on an Android emulator and an iOS
  simulator and saves screenshots per style and scheme; the two device
  checklists of `native` section 6 written as sign sheets.
- Accept: one workflow run from this session builds both targets, runs the
  Button flow on both and returns screenshots; a grep of the repo finds no
  token; the checklists exist as sign sheets.

### R5.7 NavigationStack and NavigationBar on the native stack (ds-native)

- Files: `packages/native/src/platform/stack/**`, `apps/gallery-native/app/`
  (the router tree).
- Depends on: R5.4, R5.5, R5.6. Parallel: yes (step 4). HUMAN GATE: device
  rows.
- Answers: `native` section 5 (NavigationStack and NavigationBar as platform
  views), ruling 10 (Studio and Desk keep the platform bars and supply tint,
  fonts and content; drawn chrome is an opt in).
- Accept: Maestro flow of push, back and edge swipe on the simulator and back
  on the emulator; the large title collapses; the drawn chrome mode renders
  only when asked; device rows "Push a screen", "Large title", "Back closes
  sheets first" green.

### R5.8 TabBar on native tabs (ds-native)

- Files: `packages/native/src/platform/tabs/**`, the gallery's tab layout.
- Depends on: R5.5, R5.7. Parallel: yes (step 4). HUMAN GATE: device rows.
- Answers: `native` section 5 (TabBar as a platform view), ruling 11 (our own
  icons as images).
- Accept: five tabs or fewer, our icons as images with the heavier current
  form, minimise on scroll and a search tab on iOS; Material bar on Android;
  device rows "Tab bar" and "Bottom navigation" green.

### R5.9 Sheets, dialogs and alerts (ds-native)

- Files: `packages/native/src/platform/sheet/**`, `platform/alert/**`, drawn
  content parts in `packages/native/src/components/{Sheet,Dialog,AlertDialog}/**`.
- Depends on: R5.7. Parallel: yes (step 5). HUMAN GATE: device rows.
- Answers: `native` section 5 (Dialog on a phone and Sheet as platform views,
  AlertDialog as the system alert), section 8 item 7.
- Accept: route sheets as form and page sheets with detents and a grabber;
  in place sheets through `@expo/ui`; the keyboard never covers the primary
  action (device row); alerts are system alerts; Maestro flows on both
  targets.

### R5.10 Menus, context menus, pickers and the action sheet (ds-native)

- Files: `packages/native/src/platform/{menu,picker,date}/**`, drawn triggers
  in `packages/native/src/components/{DropdownMenu,ContextMenu,Select,ActionSheet}/**`.
- Depends on: R5.7. Parallel: yes (step 5). HUMAN GATE: device rows.
- Answers: `native` section 5 (menus, context menu with the lifted preview,
  Select on the system menu or picker, ActionSheet per platform, date pickers);
  `native` "What I could not check" (Hijri in native pickers).
- Accept: system menus on both targets; the context menu lifts a preview on
  iOS; a test of Hijri support in the date picker on both, with the result
  written down (a drawn calendar on `@internationalized/date` where it fails);
  device rows "Context menu" and "Menus and date picker" green.

### R5.11 Drawn actions and selection controls (ds-native)

- Files: `packages/native/src/components/{ToggleButton,CloseButton,CopyButton,Link,FloatingActionButton,Switch,Checkbox,RadioGroup,Slider,SegmentedControl}/**`,
  `packages/styles/<id>/native/*.ts` for the four styles.
- Depends on: R1 and R3 gates, R5.3. Parallel: yes (step 6). HUMAN GATE:
  device rows, proposed looks.
- Answers: `native` section 5 ("Native subset", J rows), defect 22 (only Desk
  has a native recipe).
- Accept: jest under both presets; Maestro screenshots per style, scheme and
  platform beside the web component at the same size (a token check, not a
  native proof); press, toggle and drag recordings from the emulator and
  simulator; device rows green.

### R5.12 Text fields (ds-native)

- Files: `packages/native/src/components/{Field,Label,Input,Textarea,PasswordField,NumberField,SearchField,PhoneField,OTPField,FieldError}/**`.
- Depends on: R5.4, R5.11. Parallel: yes (step 6). HUMAN GATE: device rows.
- Answers: `native` section 5 (fields on core `TextInput` with
  `textContentType`, `autoComplete`, `keyboardType`, `enterKeyHint`).
- Accept: OTP autofill and paste on both phones (device row); the keyboard
  provider keeps the focused field visible; jest under both presets.

### R5.13 Lists, swipe rows, pull to refresh, toasts and content parts (ds-native)

- Files: `packages/native/src/components/{List,ListSection,SwipeActions,PullToRefresh,Toast,Card,Avatar,Badge,Chip,EmptyState,Skeleton,Spinner}/**`.
- Depends on: R5.8, R5.11. Parallel: yes (step 6). HUMAN GATE: device rows.
- Answers: `native` section 5 (SwipeActions with `ReanimatedSwipeable` and
  screen reader actions, `RefreshControl`, Toast placed above the tab bar).
- Accept: swipe rows offer a menu path to TalkBack and VoiceOver (device row);
  the toast clears the tab bar on both targets; jest under both presets.

### R5.14 Native phone demo app (ds-native)

- Files: `apps/gallery-native/app/**` (a demo route group).
- Depends on: R5.7 to R5.13. Parallel: no. HUMAN GATE: no (R5.16 checks it).
- Answers: `mobile` "What a phone demo app must prove", proof line ("and as
  an Expo build").
- Accept: the same tabs and screens as R4.20 and R4.21 from native parts;
  Maestro flows for each screen on both targets with screenshots in four
  styles, light and dark, English and Arabic.

### R5.15 R5 review, manifest honesty and the native lint rules (ds-qa)

- Files: `packages/lint/**` (overridable `testID`, the platform folder import
  rule), `docs/reports/reset/r5-gate.md`.
- Depends on: R5.14. Parallel: no. HUMAN GATE: no.
- Answers: `native` defect 27 (Button says native ready while Neutral and
  Liquid have no native look), section 8 item 8.
- Accept: every native manifest block states its status and implementation
  per platform honestly (a reviewer checks each against the device sheet);
  both lint rules have passing and failing fixtures.

### R5.16 Owner device checklists (lead)

- Files: `docs/reports/reset/native-devices.md` (the owner's answers).
- Depends on: R5.15. **HUMAN GATE: the owner installs the development builds
  on the iPhone and the Android phone, runs both checklists of `native`
  section 6 and sends recordings.**
- Accept, the R5 gate: every row of both checklists green with a recording;
  the Maestro workflow green on both targets; a fresh rescore against the
  `native` grades: no "Missing", "Weak" or "Defect" left in the table of
  section 1 for the parts R5 built.

## 10. Closing gate (replaces gate 1)

Gate 1 of `PLAN.md` section 7 is not passed (`docs/reports/wave-1.md`) and is
replaced by this gate. The name and scope stay `@the-system` until it passes
(ruling 20).

### RC.1 Full matrix and the seven audits rerun (ds-qa)

- Files: `docs/reports/reset/closing/**`.
- Depends on: R1 to R5 gates.
- Steps: a fresh session reruns each of the seven audits with its own method,
  against the same sources and references, and scores the same tables; the
  full screenshot matrix, both contract suites, axe in English and Arabic,
  the size report.
- Accept: every area of every scorecard at 4 or more, except where the owner
  has accepted a lower score in writing.

### RC.2 Closing gate report (lead)

- Files: `docs/reports/reset/closing.md`, `STATE.md`.
- Conditions:
  1. R0 to R5 gates passed, each with the owner's signature.
  2. Studio and Desk within tolerance of FK2 and GB on every audit pair, and
     the four templates within tolerance of their source screens.
  3. Perceive: rich profile green in Neutral and Liquid, quiet profile green in
     Studio and Desk, on both phone frames.
  4. The web phone demo and the native demo signed after device checks on the
     owner's phones; both native checklists green.
  5. The old gate 1 conditions still hold: both web example apps use only
     system components and `ds doctor` is clean on both; every Angular
     component passes the contract suite and matches React within the
     threshold.
  6. `npm run check`, both contract suites, axe, reflow at 320 in every style,
     the contrast gate: all green.
  7. Every look is either approved by the owner or listed as proposed.
- HUMAN GATE: the owner reviews the report, decides the final name and scope
  (ruling 20), and real adoption in GB and FK2 (`docs/adoption/`).

## 11. Phase R6: the `tonal` style (after the closing gate)

Goal: a style on Material's colour roles, type roles and shapes, with the id
`tonal`, marked proposed (rulings 14 and 15). Its name and docs say it follows
Google's public Material 3 guidance; the system is not presented as a Google
product, and "Material" is not the style's name (`material` "Naming").

### R6.1 Contract and the build time package (lead)

- Files: `docs/contracts/tokens.md`, `style-pack.md`, `packages/tokens/src/contract.json`
  (through ds-tokens if the lead prefers), root `package.json`, lockfile,
  `DECISIONS.md`, `THIRD_PARTY_NOTICES.md`.
- Installs: yes, alone: `@material/material-color-utilities` as a dev
  dependency used at build time only (ruling 15).
- Answers: `material` "Proposal (a)" (colour roles: primary, secondary and
  tertiary with containers; surface dim and bright; the container ladder
  documented on `surface` to `surface-5`; inverse roles; `type.<role>`).
- Accept: a gate that fails if any runtime package imports the colour
  utilities; `npm run check` green.

### R6.2 Scheme from a seed colour (ds-tokens)

- Files: `packages/tokens/**` (a generator), `packages/styles/tonal/tokens.dark.json`,
  `tokens.light.json` (written by the generator and committed as source).
- Depends on: R6.1. HUMAN GATE: no.
- Accept: the generator writes every contract name from one seed in
  `style.json`; two runs are byte equal; the contrast gate passes at both
  contrast levels; the roles for five seeds match the published scheme rules
  (a test against the package's own output).

### R6.3 The `tonal` style pack (ds-style)

- Files: `packages/styles/tonal/**`.
- Depends on: R6.2. **HUMAN GATE: proposed look.**
- Answers: `material` "Option 3" (the style owns colour roles, surface
  containers, type roles, the corner scale for content surfaces, elevation
  levels, icon weights); `material` scorecard rows for the web.
- Accept: `ds style check tonal` passes; compare against the measured values
  in `material` "Components (dp)" at the Pixel viewport for button, field,
  navigation bar, FAB, dialog, sheet and snackbar (numbers only, no vendor
  image in the repo); recording pack.

### R6.4 Parts `tonal` needs (ds-component)

- Files: `Button`, `IconButton`, `ToggleButton`, `ButtonGroup`, `SplitButton`
  folders and `Button.css` (corner morph hooks driven by a spring), new
  `LoadingIndicator` folder.
- Depends on: R6.3. HUMAN GATE: proposed.
- Answers: `material` "What must change in components" (corner morph,
  neighbour push), ten changes item 10.
- Accept: perceive on press and select: the corner morph runs on the spatial
  spring; the group pushes neighbours; contract suite green; other styles
  unchanged (R1 and R3 numbers).

### R6.5 Seed colour demo and docs (ds-docs)

- Files: `apps/docs/**`.
- Depends on: R6.3.
- Answers: `material` "What the demos should show" item 9.
- Accept: a seed picker that regenerates the scheme live in the docs preview;
  the style page states the guidance it follows; axe clean.

### R6.6 `tonal` on native (ds-native)

- Files: `packages/styles/tonal/native/*.ts`.
- Depends on: R6.3, R5 gate. HUMAN GATE: device rows.
- Accept: native themes for `tonal` from the token build; the R5 drawn
  controls in `tonal` on the emulator with screenshots; device check on the
  Android phone.

### R6.7 R6 review (ds-qa)

- Depends on: R6.1 to R6.6. **HUMAN GATE: the owner signs the `tonal` look.**
- Accept: contrast gates, the compare table of R6.3, the recording pack, and
  the Figma capacity note (question 12) answered.

## 12. What happens to the old wave 2 scope

Wave 2 in `PLAN.md` section 8 is not started. After the closing gate the lead
asks for a new `docs/plan/wave-2.md` that applies the reset's acceptance
rules. What the reset already covers is struck from it.

| Old wave 2 item | Where it goes |
| --- | --- |
| Mobile family (12) | Done in R4 (web) and R5 (native) |
| Liquid style | Rebuilt in R3.5 and R4.18 |
| Desk Light | Proposed again in R1.14 |
| React Native core (about 60) | The phone demo subset in R5; the rest in the new wave 2 |
| Window chrome (5) | Window, TitleBar, WindowControls exist; MenuBar clock and notification stack done in R2.6; StatusBar and DeviceFrame in the new wave 2 |
| Angular batches 6 to 9 (50) | New wave 2, first, because the templates and the phone family stand on them; then the Angular ports of R2 templates and R4 phone parts |
| Dates, colour, files (13) | New wave 2; the phone DatePicker joins them |
| Data display B (12), including Table | New wave 2; Table, OutlineView and the settings window of `liquid` join here |
| Charts tier 1 (13) | New wave 2 |
| Style generator and Paper | New wave 2; the generator learns from `tonal`'s seed generator |

## 13. What is reverted, what is kept

| Wave 1 work | Reverted | Kept |
| --- | --- | --- |
| Order 1.24, styles apart | Studio: square radii, white primary cell, zero shadows and blur, inverted rows and tooltips, split dialog footers, the toast strip, step motion. Desk: tracking on controls, 36px density rule, glass pill buttons with gradient and rings, dialog title bar with lights, yellow menu ring, icon tile toasts | Neutral's 1.24 values as the starting point of its next proposal; the before and after sheets as history |
| Order 1.28, hook wiring | The values Studio and Desk set on the hooks (glow, press sink, steps, overshoot, yellow timer line, yellow start bar) | Every hook in the components; Neutral and Liquid values until R3 retunes them; the `[data-platform='web']` guards until R0.15 replaces them with the layer split |
| Orders 1.21 to 1.23, interaction rounds | Overshoot springs in Desk, the roll on every Desk button, the pointer glow on Desk buttons | The mechanisms: drawn check, switch hooks and lens thumb, CopyButton morph, toast swipe and stack, Sheet drag with detents, the `/interactions` stages, the motion catalog |
| Order 1.25, platform axis | Style derived corner arithmetic for platforms; the layer place for chrome rules | The axis, `ios.css` and `android.css` as the base of R0.15, the Material and iOS sizes read from public sources |
| Order 1.26, Liquid | Glass on the Window body, the fixed blue `tinted` cast, the flush sheet, the long single capsule toolbar | The material recipe, the solid fallbacks, the floating tab bar, the lens thumbs, every contrast measure |
| Order 1.29, fix round | Nothing | All fixes; their tests stay as regression tests |
| Orders 1.27 and 1.30, docs site | Nothing | The redesign and the style switch; R0.11 and R2.12 add to them |
| Order 0.17, Desk Light | The approval request (ruling 17) | The design notes as input to R1.14 |
| Order 1.10, Neutral | The approval request (ruling 17) | The style, proposed again after R3 |
| Angular sync and A-motion | Nothing | All; R1.15, R3.10 and R4.22 bring Angular level again |
| Tokens and contracts | The Studio overrides of FK2 values in `tokens.dark.json` (surfaces, radius, elevation) | The type and space scales, the contract, the manifests, the keyboard models, the gates, the docs pipeline, the GB "A11y change" values, the 2px focus ring, the accessible toast timing |
| React Native proof | The Button press, metrics and font handling (R5.3) | The ThemeProvider shape, the cascade port with its tests, logical styles, the theme cache, the direction handling |

## 14. What the owner must do, and when

| When | What | Why it cannot wait |
| --- | --- | --- |
| Now | Read this plan, answer the questions in section 17, say go | Ruling 22: nothing is built before the owner sees the plan |
| Now, in parallel | Create an Expo account and save its access token as a network secret on this environment (the session asks for it through the secure form; never in chat or in a file) | R5.6 needs it; account setup has lead time (ruling 12) |
| Now | Say which phones will be used (iPhone model and iOS version, Android model and version), and whether Reduce Motion is on | Device checks and perceive profiles depend on them (`motion` suspect (e)) |
| Now | Choose the iOS route: Expo Go for SDK 58 if it is in the App Store, or an Apple developer account for development builds | `native` defect 28 and section 6 item 2 |
| End of R0 | Approve the recording pack format on the sample (R0.9); test platform detection on both phones (R0.10) | Every later sign off uses the format |
| During R1 | Choose the Desk dark glass values (R1.12) | R1.13 and the R1 gate wait on it |
| End of R1 | Sign the Studio and Desk side by side sheets and recordings; answer Studio Light and Desk Light (R1.14) | R2 is accepted against the R1 looks |
| End of R2 | Sign the four templates | Closing gate condition 2 |
| During R3 | Decide on sound feedback (R3.9); judge the Neutral and Liquid motion values on a phone (R3.3 to R3.5) | `motion` change 2 and 8 are owner decisions |
| End of R3 | Sign the R3 recordings; device check on both phones; open the reference pages for the blind comparison | R3 gate |
| End of R4 | Run the phone demo on both phones, record each gesture, sign; judge Liquid's material | R4 gate |
| During R5 | Install development builds; run the two native checklists; send recordings | R5 gate; no native part is done without them |
| Closing gate | Review the report; decide the name and scope; decide on real adoption in GB and FK2 | Ruling 20 |
| R6 | Approve the `tonal` look and its wording | Ruling 14 |

## 15. Risks

The three rated highest:

1. **Fidelity cannot be measured as tightly as the tolerances say.** FK2 does
   not run as an app (its vendor package blocks it), so its screens are a
   reconstruction from its own CSS modules; GB turns blur off on a software
   GPU; the two products show different content. A pixel tolerance may fail
   for reasons that are not ours, or pass on a masked image that still looks
   wrong. Mitigation: probe computed values first and pixels second, mark
   reconstructed screens in the pair file, compare glass by CSS, and keep the
   owner's signature as the final word.
2. **Native work cannot be checked here, and the owner's devices are the
   bottleneck.** The container has no Android SDK, no KVM and no iOS build.
   Everything native depends on the Expo account, cloud builds, the young
   `@expo/ui` (Compose on a beta), and the owner's time with two phones. A
   slow round trip stalls R5. Mitigation: start R5.1 to R5.6 right after R0,
   pin and isolate `@expo/ui` in `packages/native/src/platform/`, keep a drawn
   fallback for every platform view, and batch device checks once per step.
3. **Sign off loops and taste.** Every look is proposed, every touch needs a
   signed recording, and motion "a person can see" is judged by eye. Many
   HUMAN GATEs in a row can leave lanes idle or cause rework when a look is
   turned down late. Mitigation: show the owner the R0.9 sample early, run
   file disjoint orders while one waits, make each recording pack small and
   comparable with its source, and keep the perceive numbers as the shared
   language for "rich" and "quiet".

Others:

4. **Shared CSS collisions.** Dialog.css, Button.css and the platform files
   pass between many orders. Mitigation: the ownership table in section 2,
   handed over by the lead between steps.
5. **The layer split ripples.** Moving chrome rules after the recipes (R0.15)
   may change shots in every style. Mitigation: the R0.15 matrix before and
   after, and the old `[data-platform='web']` guards removed in the same order.
6. **Safari behaviour is untested here.** No WebKit browser is installed and
   the lane brief forbids `playwright install` (question 9). Press timing, safe
   areas and blur cost on iOS rest on the owner's device checks.
7. **Angular drift.** Angular lags by a phase and lacks the overlay and
   navigation families. Mitigation: React first, then a pixel compare at 0 over
   the threshold in every Angular order; the missing families first in the new
   wave 2.
8. **Template scope creep.** The editor templates invite canvas behaviour
   (selection, marquee, snap). Mitigation: R2 ships pan and zoom only; the rest
   stays in the wave 3 editor family.
9. **Blur cost on phones.** Adaptive glass and several bars at once may drop
   frames on a mid range Android. Mitigation: at most three bar sized glass
   layers and one panel (`liquid` "Limits on the web"), and a device recording
   while scrolling in R4.18.
10. **Licences.** FK2's solid pixel icon set has no licence (question 4); the
    native fonts need a loader that is not on the allow list (question 5).
    Both stay HUMAN GATEs.

## 16. Size of each phase

Rough agent sessions include up to three fix rounds where reviews usually
find blockers, and the fresh review session for each order. No calendar
promises: the owner's sign offs and device checks set the pace.

| Phase | Orders | Lead orders | Rough agent sessions | Waits on the owner |
| --- | --- | --- | --- | --- |
| R0 Foundations | 16 | 1 | 18 to 24 | Pack format, platform check |
| R1 Source fidelity | 16 | 0 | 22 to 30 | Glass values, sign off, lights |
| R2 Templates | 13 | 1 | 18 to 26 | Sign off |
| R3 Motion | 11 | 0 | 15 to 22 | Values, sound, device check |
| R4 Web phone | 23 | 1 | 32 to 44 | Device check, sign off |
| R5 React Native | 16 | 2 | 22 to 32 | Account, builds, checklists |
| Closing gate | 2 | 1 | 3 to 5 | Review, name |
| Reset total | 97 | 6 | 130 to 183 | |
| R6 `tonal` (after the gate) | 7 | 1 | 9 to 14 | Look, wording |

Each order is sized so one session can finish it. Where an order lists more
than eight components (R5.11, R5.12, R5.13), its lane may split it into two
sessions on the same branch.

## 17. Questions the rulings do not settle

Each has a proposed answer. The lead uses the proposed answer if the owner
says nothing, and records it in `DECISIONS.md`.

1. **Desk's font inside the canvas editor.** GB uses Inter for the app and
   the canvas, and Instrument Sans only on the desk site (`fid-gb` section 2).
   Desk today uses Instrument Sans everywhere. Proposed: Desk's `sans` stays
   Instrument Sans; the canvas editor template sets a font scope to Inter
   through a token alias decided in R2.1.
2. **Does a Mac desktop browser detect `macos` by itself?** Ruling 7 speaks of
   phones. Proposed: `auto` detects `ios` and `android` only; `macos` is chosen
   by the override, so the docs do not change for every Mac visitor.
3. **Ruling 2 for text on Desk glass.** Ruling 2 covers control boundaries.
   Desk muted text on glass over bright content is a text contrast fault
   (ruling 18). Proposed: apply the same rule, raise the glass alpha only, to
   the lowest value that brings muted text to 4.5:1.
4. **FK2's icon set.** FK2 uses a different, solid pixel set whose vendored
   copy declares no licence (`fid-fk2` "Icons"). Proposed: keep
   `pixelarticons`, and list the icon set as the one allowed difference from
   FK2 unless the owner can confirm a licence.
5. **Fonts on native.** Ruling 10 says Studio and Desk supply fonts in native
   chrome, but loading Inter or Instrument Sans on a device needs font files
   and a loader (`expo-font`) that is not on the allow list (`native` defect
   12). Proposed: native uses the platform font in every style until the owner
   approves the loader and TTF or OTF files.
6. **Which phones.** Device checks and the perceive frames should match the
   owner's phones (section 14).
7. **Sound.** Should Neutral and Liquid offer synthesised sounds (off by
   default, a setting to turn on), as the reference site does? Proposed: build
   the hook, off by default, and show it in one demo.
8. **Angular ports of the templates and the phone family.** Proposed: they go
   to the new wave 2 after Angular batches 6 to 9 (section 1, change 6).
9. **A WebKit browser for tests.** Playwright can download WebKit, which
   would let the harness see Safari's `:active`, safe areas and blur. The lane
   brief forbids `playwright install`. Proposed: allow one WebKit download as
   a dev tool, for the harness only.
10. **The toast timing difference.** FK2 auto closes errors after 8s; the
    system keeps danger toasts until closed (WCAG 2.2.1, `DECISIONS.md`
    "Components" 2). Proposed: keep the system's timing as an allowed
    difference.
11. **Source copy and brand in templates.** GB and FK2 are the owner's own
    products. May the templates reuse their strings and wordmarks?
    Proposed: no; the templates use the system's sample content and synthetic
    images, so they stay neutral starting points.
12. **Figma capacity.** `PLAN.md` section 11 gives five styles ten modes, all
    of the Professional plan. `tonal` is a sixth style and needs a second
    library or a mode budget change. Proposed: decide when the Figma track
    starts; no Figma work is in this plan.
13. **Studio density default.** FK2 reads compact; Studio's default density is
    `default` (`DECISIONS.md` "Theme and styles" 3). Proposed: keep `default`,
    since its values are FK2's own sizes.
