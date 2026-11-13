# Interaction round 3 (order 1.23)

Status: proposed. Every interaction, hook and decision below is proposed to
the owner. Branch `claude/ds-order-1-23`, built from
`claude/relaxed-hypatia-7gseap` with the lead branch merged twice.

The owner tested round 2 on a phone and asked for more: a check that is
drawn, a glass thumb and a growing dot on the switch, a copy control that
turns into the word "Copied", better toasts and popups, and motion that is
specific to each control instead of a generic scale and fade. This round
answers that in six families, each built by its own agent, each with a
state machine a person can feel: rest, hover, press, release, selected,
back.

## The ruling

Motion may now animate `transform`, `opacity`, `clip-path`,
`stroke-dashoffset`, `stroke-dasharray`, `filter`, `backdrop-filter`,
`color`, `background-color`, `border-color`, `outline-color` and
`box-shadow`. Layout never animates. The lint rule
`ds/animate-transform-opacity-only` (file name kept) allows the list, with a
fixture for an allowed and a refused property in a rule and in keyframes.
`docs/contracts/anatomy.md` says the same, and that `filter` and
`backdrop-filter` need a fallback under `@supports not`, reduced
transparency and more contrast.

## Proof

- `npm run check`: green (13 of 13 steps), run once at the end on the
  final tree.
- Contract suite (React): passes for every component touched, after
  `npm run gen`. Toggles 6, actions 8, inputs 8 and more, selection 13,
  overlays 14, navigation and feedback 23.
- Unit tests: every changed behaviour has a test (states and parts, not
  timings). Per family: toggles 387, actions 397, inputs 630, selection all
  owned, overlays 531, navigation and feedback 714, motion 292.
- Recordings: `docs/reports/shots/interactions-3/`. One sheet per
  interaction and style (`sheets/<id>.<style>.png`: one band of twelve
  frames 40ms apart per beat, cropped to the control and drawn at up to 4x)
  and one stitched clip per family and style (`clips/<family>.<style>.webm`)
  in Neutral, Studio and Desk, light. The recorder is `record.cjs`; each
  family drives its stages from `drives/<family>.cjs`. Every Neutral sheet
  was read by its agent; weak ones were fixed and recorded again (listed
  per family).

## Families

### Switches, checks and radios (toggles)

**switch-stretch** (review B7)
- Hover: the thumb leans `distance.nudge` toward its travel (hover devices
  only).
- Press: the thumb grows to `--_switch-thumb-size-pressed` (`scale.pop`) and
  stretches to `scale.stretch` toward its travel; the track dips to
  `scale.press`. `duration.instant`, `ease.out`.
- Release: the state changes at once. The thumb travels on
  `ease.spring-bouncy` over `duration.spring-bouncy` (220ms Neutral, about
  6% overshoot).
- Selected: the on fill sweeps behind the thumb with a `clip-path` inset
  whose edge rides the thumb's far edge, on the same transition, so the
  track under the thumb is filled in every frame. The thumb colour crosses
  over `duration.quick`.
- Back: the fill retracts behind the thumb on the same spring.
- Animates transform, clip-path, opacity, background-color, border-color,
  box-shadow.
- B7: the thumb is on its fill in every frame of
  `switch-stretch.neutral.png` and `.desk.png`.

**switch-drag** (new)
- Past a 3px slop the thumb follows the pointer with no transition; past
  either end it moves 30% of the overshoot, at most 12% of the travel. The
  fill and the thumb colour follow the progress (`color-mix`).
- Release snaps by velocity (above 0.006 travels per ms), else to the
  nearer end, and springs there. A tap, Space and Enter still toggle; the
  click that ends a drag toggles nothing.
- Root gets `data-dragging` and `--_switch-drag-progress`.

**check-draw**
- Press: the box dips to `scale.anticipate`. Release: it springs back; the
  fill grows from the centre (`clip-path: circle()`) over half of
  `duration.morph`.
- Draw: the check strokes with `stroke-dashoffset` (`pathLength=1`), short
  arm over 40% of `duration.morph`, then the long arm (about 250ms in all).
- Back: reverse and faster, `duration.quick` (100ms) on `ease.in`.
- CheckboxGroup select all cascades one `delay.stagger` apart, capped at
  three steps; turning it off runs from the last box.

**check-mixed** (new): the dash and the check are the same two strokes,
turned about one joint, on `ease.spring-snappy` over `duration.morph`.
Mixed to unchecked collapses the dash to its centre.

**radio-pop**: the checked ring is an inset `box-shadow` that closes from
the border to the dot over `duration.spring-snappy`. The new dot springs in
from the old option's side and the old dot leaves toward the new one. Pure
CSS with `:has()` and sibling selectors, both orientations and RTL.

**radio-card-lift**: border, inner line and fill cross over
`duration.morph`; the indicator is a badge that fills inward and draws a
check with `stroke-dashoffset`. The card it leaves crosses back over
`duration.quick`.

**toggle-pop** (the generic pop is gone): a state layer pools under the
pointer while held. Turning on floods from the press point across the
button (WAAPI clip-path and opacity, `duration.morph`); off drains to the
press point over `duration.quick`. From the keyboard the flood starts at the
centre. Studio keeps its flat `pop` pattern.

Reduced: each component zeroes its own motion under both reduced forms
(`--_switch-motion`, `--_radio-group-motion`, `--_radio-card-motion`,
`--_checkbox-duration`, `--_checkbox-motion`, `--_toggle-button-flood`).
Forced colours hide the fill layers and draw marks and thumb in system
colours. The glass thumb falls back to solid under `@supports not`, reduced
transparency and both more-contrast forms.

### Actions

**button-press**: press over `duration.instant` on `ease.out`: the root dips
to `scale.press`, the parts sink by `--_button-press-y` (1px at xs and sm,
`distance.nudge` at md, nudge plus 1px at lg and on the FAB) and an inner
shade fades in. Release: the root on the bouncy spring, the parts on the
snappy spring. Hover looks sit behind `@media (hover: hover)`; touch presses
through `:active`. Reduced: no scale or sink.

**button-glow** (new): a radial highlight on `::before` follows the pointer
(ButtonRoot writes `--_button-glow-x` and `-y` with no re-render). 0.8 of
`--_button-glow` on hover, full on press, fading over `duration.morph`. On
by default on solid fills; off under reduced motion, more contrast and
forced colours.

**segment-press**: the pressed segment keeps its box; its parts dip to
`scale.anticipate`, sink and shade, and bounce back on release. Neighbours
and seams stay still.

**button-loading**: unchanged; the width holds.

**button-result** (new): props `result` (`success` | `error`) and
`resultLabel`. The label rolls up over `duration.quick`; the result part
lands from `scale.morph` on the bouncy spring; the glyph strokes draw over
`duration.morph` (a check, or a two-stroke cross). An error shakes once
(`distance.nudge`, `duration.celebrate`). One status says the result once.

**copy-swap**: the copy glyph closes into its centre (clip-path circle,
minus 45 degrees, `scale.morph`), the check wipes in left to right with a
bouncy pop, and the icon colour eases to success. The label rolls from
"Copy link" to "Copied" like a counter; all words share one grid cell so
the width never moves. Failure rolls to "Could not copy" and shakes once.
After `delay.feedback` everything rolls back. A second copy restarts the
hold and redraws. One polite status with a new text node per copy; the
accessible name never changes.

**copy-bubble** (new): the icon-only form shows an aria-hidden bubble with
the word; it rises `distance.enter` on the snappy spring, holds, and rises
as it fades.

**button-nudge**: unchanged, hover gated to hover devices.

**close-turn**: a round fill blooms from the glyph (clip-path circle) while
the cross turns a quarter turn; press pinches to `scale.anticipate`.

**split-chevron**: the chevron drops on hover, drops `distance.shift` while
held, then flips half a turn as the menu opens.

**fab-morph**: hover lifts `distance.lift`, the glow follows the pointer,
the plus turns into a close mark, and the extended label is unveiled by a
clip-path from the icon side in reading order.

**link-underline** (one of the ten weakest): the line draws with clip-path
from the inline start (right to left in Arabic) and is erased toward the
inline end; press thickens it from its foot (`--_link-press-weight` 1.5)
and springs back; the text colour eases.

Reduced (B1 for this family): Button, CopyButton, CloseButton, SplitButton,
FAB, ButtonGroup and Link set their own durations to 0 and travel off under
both forms.

Re-recorded after reading the sheets: button-result (label rolled over the
check, error mark read as "I"), button-glow (too faint), split-chevron
(crop cut the chevron).

### Text inputs, sliders and forms (inputs)

**focus-glow**: the ring shows at once. The border colour eases over
`duration.base`; a `::before` halo in `primary.tint-hover` blooms from 0 to
`space.s` on the soft spring and draws back on blur over `duration.quick`.
Invalid blooms in `danger.tint-10`. Input, Textarea, PasswordField,
SearchField, NumberField, PhoneField, ScrubInput, OTPField (the bloom
follows the active cell).

**error-shake**: the shake plus the border easing to danger.

**field-error-enter**: the message comes out from under the control
(`translateY(-100%)` and clip-path `inset(100% 0 0 0)` to `inset(0)`, soft
spring); the icon lands a stagger step later. Reduced: fade.

**field-label-focus** (one of the ten weakest): the label rises
`distance.shift` on the snappy spring and its colour eases to
`primary.on-surface` (`danger.text` when invalid).

**password-reveal**: the style's two glyphs trade places along a 45 degree
line (five-point clip-path polygon, `duration.morph`): showing draws the
slash from the top left, hiding wipes it off from the bottom right.

**rating-preview**: a colour sweep, each star's `fill` glyph opening with
clip-path, star n waiting n times `delay.stagger`; the star under the
pointer dips as the sweep reaches it. RTL sweeps from the right; Studio
fills together. **rating-fill**: the run pops as one; new stars land from
`scale.morph`, the chosen star on the bouncy spring; emptied stars dip.

**slider-pull**: hover spreads a halo; press grows the thumb to
`scale.stretch` on the snappy spring; release overshoots back on the bouncy
spring.

**slider-fill** (new): the fill is the track's `::before`, cut with
clip-path from `--_slider-from` to `--_slider-to`. A key, a track press or a
controlled change glides fill and thumb on the snappy spring; a drag
follows exactly and cancels any glide.

**slider-rubber-band** (new): a drag past an end pulls the thumb and
stretches the fill with resistance `1 - 1/(1 + d/thumb)`, up to
`--_slider-pull-max` (3 x `distance.enter`), and springs back.

**slider-nudge** (one of the ten weakest): a key at an end plays the rubber
band at half reach, holds one snappy spring and springs back; the value
never changes. The Neutral sheets of slider-rubber-band and slider-nudge
show the earlier 2x reach; Studio and Desk show the final 3x.

**slider-bubble** (review B4): the Arabic bubble read "%206" and "SAR
2,070"; it now takes its direction from its own text.

**form-submit-success** and **wizard-done**: a `success-mark` lands from
`scale.morph`, its ring draws with `stroke-dashoffset`, then its tick.

Unchanged and checked on sheets: OTP fill, caret and complete, field-step,
scrub-roll, search-clear, search-submit, inline-edit-morph,
form-summary-enter, wizard-step, field-message-enter, consent-check (its pop
now targets the Checkbox `mark`).

Reduced: every field file plus Field, Slider and Rating sets its own
durations to 0s under both forms; Form and FormWizard marks use
`animation: none`.

### Menus, lists and collections (selection)

**highlight-marker** (new): one marker (part `highlight`) per list in
DropdownMenu, ContextMenu, Menubar menus, Select, ListBox and
CommandPalette. On open it jumps to the first lit row and fades in over
`duration.fast`; pointer moves slide on the snappy spring, key moves over
`duration.fast`; when a filter moves the lit row the marker follows.

**menu-origin**: the surface opens from its trigger side: it travels, grows
from 0.97, is opaque by 40%, and a clip-path opens it from the trigger edge,
on the snappy spring. Rows stagger and read within about 200ms in Neutral.
Closing takes 100ms on `ease.exit`.

**Exit copy (review B6)**: the real content leaves the DOM at once and an
inert aria-hidden copy plays the exit, so a press on the trigger during the
exit reopens at once. DropdownMenu, ContextMenu, Menubar and the Combobox,
Autocomplete, MultiSelect and TagField popups.

**check-draw-pick** (new): the picked row's check draws (stroke-dashoffset,
or a four-step clip-path wipe on pixel icons) and pops from 0.6 on the
bouncy spring.

**picker-value-roll** (one of the ten weakest): Select's value rolls like a
drum, the old label leaving one line up on an inert copy while the new one
comes from below, both clipped to the value box.

**combobox-results** (new): on a new query rows that stay slide to their
place and new rows pop in a short stagger; rows that were out of view
arrive as new.

**chip-check-pop** (one of the ten weakest): selecting draws the check and
slides the label over; clearing slides it back.

**menu-submenu-nudge** (one of the ten weakest; review B2, B3): the lean is
`distance.shift`; reduced rules win and the chevron is not left shifted.

**list-stagger** (one of the ten weakest) and **command-palette-results**:
first paint uses the stagger primitive, so Neutral cascades and Studio
rises together.

CommandPalette's backdrop used keyframes `Dialog.css` had renamed, so the
closed backdrop stayed over the page; it now has its own.

Reduced: no travel, clip, stagger or slide; the marker jumps, the check
fades, durations and lean are 0 under both forms.

### Overlays and toasts

**toast-enter**: from its own edge (`--_toast-enter-y`, its height) and from
`scale.enter`, on the bouncy spring, readable by 30%; the front toast steps
back; the icon pops `--_toast-icon-delay` later. Exit over
`duration.toast-exit`.

**toast-stack**: toasts share one grid cell; each one behind sits
`--_toast-peek` (`space.s`) beyond the one in front and one `--_toast-depth`
step smaller, clipped to the strip that shows, on the snappy spring. Hidden
from the fourth back.

**toast-expand** (new): hover or focus in the stack sets `data-expanded`;
toasts travel to a list and unclip, the front one never moves; the gaps
keep it open; timers pause.

**toast-swipe**: the Toaster's own swipe (`swipe.ts`). It follows the
finger toward its edge, rubber bands the other way (24px cap), closes past
50px or on a flick over 0.3px/ms in the last 100ms, else springs back.

**toast-timer** (new, WCAG 2.2.1): a `progress` line scales from 1 to 0 over
the toast's life, linear. `data-paused` on the toaster pauses it from the
same boolean that pauses the store (hover, focus inside, window blur,
hidden tab), so the line and the timer never drift. Danger toasts and
toasts with an action have no line.

**dialog-spring**: the backdrop blur grows from 0 to
`--_dialog-backdrop-blur` (`blur.backdrop`) as it fades; the panel rises
`distance.enter` on the soft spring, opaque by 33%; parts arrive
`--_dialog-stagger` apart, capped so the last reads by 200ms. Solid scrim
under `@supports not (backdrop-filter)`, reduced transparency and both
more-contrast forms.

**dialog-refuse** (new): a backdrop press on an AlertDialog or a
`dismissible={false}` dialog, or Escape on the latter, shakes the panel
along the inline axis (WAAPI: `--_dialog-refuse-shift`, back 0.7, 0.35,
rest) inside `duration.roll`. A second refusal cancels the first. No light
change, so it is not a flash.

**sheet-spring**: edge slide plus blur and stagger; a drag against the
dismiss direction follows a third of the pointer.

**popover-spring** and **tooltip-rise**: the surface unfolds out of the
trigger side, stretched along the axis away from it
(`--_<c>-enter-stretch`), from the Radix transform origin; the exit folds
back faster. Tooltip opens on a 500ms touch long press with 8px slop.

Kept and re-recorded: tooltip-follow, lightbox-zoom, tour-spotlight,
window-settle, window-lights, notification-change.

Fixed in every stagger rule (Dialog family, Popover, Tour, Lightbox): a
part replayed its arrival when focus left it.

Reduced: no motion, places at once; swipe still follows the finger.

### Navigation, feedback and content

**tab-slide** (Tabs, SegmentedControl, ToggleGroup): press fills at once and
changes the value; the pill slides on the snappy spring, stretching by
`scale.stretch` at 45%. Ink: aria-hidden twins (part `label-ink`) are cut
with clip-path on the slide's own keyframes, so the text under the pill
takes the selected colour exactly where the pill is. The round 2 label dip
is gone.

**nav-current-slide**: the same ink on Navbar.

**sidebar-collapse**: expand uncovers the panel with clip-path on the soft
spring; labels and counts wipe in from the inline start, staggered and
capped at six.

**stepper-travel**: a step that completes draws its check
(stroke-dashoffset), `duration.spring-soft`.

**toc-travel** (one of the ten weakest): the bar travels from where it is
drawn to the new link as one WAAPI run (translateY and scaleY), stretched
at 45%.

**pagination-roll** (review B5, B4): each slot's text comes from the data
and the digit host is keyed by it, so React never writes into a host the
roll owns. RTL numbers read correctly after two changes 40ms apart.

**accordion-reveal**: content revealed with clip-path while it settles
`distance.shift`; height never animates; the chevron leans on hover.

**alert-entrance** (Alert, Banner, Callout): the surface wipes in from the
inline start while it rises; the icon pop sends out one box-shadow ring.

**alert-dismiss** and **skeleton-swap**: the ghost wipes off toward the
inline end; both check the mode explicitly (B1).

**progress-spring**: the bar is cut with `clip-path: inset(... round)`, so
its end stays round; the ring is an SVG (part `arc`) drawn with
stroke-dashoffset. **progress-celebrate**: one halo ring.

**avatar-status**: a thin box-shadow ring pulses three times and stops.

**card-lift**: shadow with the lift; the pointer highlight lights only the
edge; press settles to half the lift.

**meter-fill** (one of the ten weakest): a second beat at
`--_meter-value-at` settles the value text from `distance.nudge` and brings
its colour up on the bouncy spring.

**split-view-pane** (one of the ten weakest): the pane that shows is
uncovered with clip-path from its side while it slides `distance.enter`.

Review B2 fixed in TabBar, Toolbar, EmptyState, ErrorState and SplitView;
review B8 fixed (the soft tabs have panels).

Unchanged and checked: stat-roll, badge-count, nav-hover-follow, dock-lift,
language-roll, skip-link-slide, kbd-press, handle-grip, spinner-loop,
avatar-group-change, error-state-details.

## Hooks for styles and platforms

All are new. Nothing that existed before this round was renamed or removed.
Working values (written by the component) are marked "now".

**Switch**
- Parts `thumb-lens` (glass layer, painted by `--_switch-thumb-highlight`)
  and `thumb-icon` (svg from the new `thumbIcon` prop: check on, cross off).
- `--_switch-thumb-size`, `--_switch-travel-max`.
- `--_switch-thumb-size-rest`, `-on`, `-pressed`, `-now`: the growing dot
  by transform.
- `--_switch-thumb-shadow`, `-backdrop`, `-highlight`,
  `-highlight-opacity`, `-highlight-opacity-pressed`, `-opacity-pressed`.
- `--_switch-thumb-solid`, `-solid-pressed`, `-solid-now`: glass lowers the
  pressed value.
- `--_switch-lean`, `-lean-now`; `--_switch-sweep` (0 shows the fill whole);
  `--_switch-duration-color`.
- `--_switch-thumb-icon-opacity`, `-icon-off-opacity`, `-icon-color`.
- `--_switch-cut`, `--_switch-drag-progress` (now); state `data-dragging`.

**Checkbox**: part `mark` (`data-glyph="check|minus"`);
`--_checkbox-motion`, `-stagger`, `-fill-ease`, `-land-ease`,
`-morph-ease`, `-mark`, `-stroke-width`; now values `-fill-now`, `-joint`,
`-short-turn`, `-long-turn`, `-short-cut`, `-long-cut`.

**RadioGroup**: `--_radio-group-motion`, `-dot-travel`, `-dot-ease`,
`-fill-ease`, `-land-ease`; now `-fill-now`, `-side`, `-axis-x`, `-axis-y`.

**RadioCard**: part `badge`; `--_radio-card-motion`, `-check`,
`-stroke-width`, `-lift-ease`, `-draw-ease`; now `-fill-now`, `-check-cut`.

**ToggleButton**: part `state-layer`; `--_toggle-button-layer`,
`-layer-opacity`, `-press-radius`, `-color-duration`, `-flood`; now `-x`,
`-y`, `-pool-now`.

**Button**: part `result`; `--_button-press-y` (sink depth),
`-part-y`, `-press-shade`, `-press-layer`; glow `--_button-glow`,
`-glow-rest`, `-glow-now`, `-glow-x`, `-glow-y`, `-glow-color`,
`-glow-size`; ripple origin `--_button-ripple-x`, `-ripple-y` (px from the
inline and block start, set on pointerdown for every family member);
`--_button-press-ease`, `-release-ease`, `-release-duration`; result
`--_button-roll`, `-shake`, `-stroke-width`, `-draw`, `-result-ease`,
`-draw-ease`. `--_button-press-y` was already the sink depth, so the ripple
origin is `--_button-ripple-*`, not `--_button-press-x`/`-y`.

**ButtonGroup**: `--_button-group-release-ease`, `-release-duration`.

**CopyButton**: part `bubble`; `--_copy-button-motion`, `-roll`, `-wipe`,
`-turn`, `-close`, `-erase`, `-shrink`, `-fade`, `-rise`, `-bubble-bg`,
`-bubble-fg`, `-bubble-border-color`, `-bubble-shadow`, `-ease-in`,
`-ease-out`, `-pop-ease`, `-overshoot`.

**CloseButton**: `--_close-button-bloom`, `-bloom-now`, `-pinch`.
**FloatingActionButton**: `--_floating-action-button-lift`, `-reveal`.
**SplitButton**: `--_split-button-drop-press`.
**Link**: `--_link-clip-now`, `-clip-start`, `-clip-end`,
`-duration-color`, `-press-weight`, `-press-duration`, `-release-ease`.

**Fields** (Input, Textarea, PasswordField, SearchField, NumberField,
PhoneField): `--_<c>-bloom`, `-bloom-invalid`, `-bloom-spread` (0px turns
it off), `-bloom-now`, `-duration`, `-ease`. OTPField and ScrubInput: the
same, with `-border-duration`, `-border-ease`.

**Input**: prop `variant` (`outlined` | `filled`) as `data-variant`.

**Field**: `--_field-fg-focus`, `-fg-invalid`, `-fg-now`. Floating label
(prop `floating`, states `data-floating`, `data-filled`):
`--_field-float-box`, `-float-inset`, `-float-drop`, `-float-scale`,
`-float-now`, `-float-dir`.

**Slider and RangeSlider**: `--_slider-from`, `-to`, `-pull-start`,
`-pull-end`, `-pull-max`, `-pull-now`, `-clip-start`, `-clip-end`,
`-clip-left`, `-clip-right`, `-halo`, `-halo-spread`, `-halo-now`,
`-thumb-bg`, `-stretch`, `-stretch-now`, `-glide` (0 turns it off). The
fill is now the track's `::before`.

**Rating**: part `fill`; `--_rating-index`, `-sweep`, `-sweep-duration`,
`-sweep-ease`, `-sweep-now`.

**Form**: part `success-mark`; `--_form-mark`, `-mark-size`, `-mark-wait`,
`-mark-duration`, `-mark-ease`, `-mark-land`. **FormWizard**: the same with
`--_form-wizard-*`.

**Menus** (DropdownMenu, ContextMenu, Menubar): part `highlight`;
`--_menu-highlight-bg`, `-highlight-duration`, `-highlight-ease`,
`--_menu-item-shadow` (rim for a lens), `--_menu-clip-room`, `-clip-from`,
`-clip-to`, `--_menu-nudge-duration-in`, `-nudge-duration-out`.

**Select**: part `highlight`; `--_select-highlight-bg`, `-highlight-duration`,
`-highlight-ease`, `--_select-item-shadow`; the reveal uses `--_menu-shift`,
`-enter-y`, `-clip-*`. Combobox, Autocomplete, MultiSelect and TagField
popups take the same reveal names.

**ListBox**: part `highlight`; `--_list-box-highlight-bg`,
`-highlight-duration`, `-highlight-ease`, `--_list-box-option-shadow`.

**CommandPalette**: part `highlight`; `--_command-palette-highlight-bg`,
`-highlight-duration`, `-highlight-ease`, `--_command-palette-item-shadow`.

**Chip**: `--_chip-press-x`, `-press-y`. **List**: `--_list-press-x`,
`-press-y` (on the pressed row).

**Toast**: part `progress`; `--_toast-peek`, `-depth`, `-stack-duration`,
`-stack-ease`, `-progress`, `-progress-thickness`, `-shadow-room`,
`-swipe-duration-out`, `-swipe-ease-out`, `-icon-delay`; now `-index`,
`-height`, `-offset`, `-front-height`, `-life`, `-strip`,
`-stack-transform`, `-swipe-duration-now`, `-swipe-ease-now`.
**Toaster**: `--_toaster-gap`, `-dir` (-1 bottom, 1 top), `-align`; now
`-front-height`, `-height`; states `data-stacked`, `data-expanded`,
`data-paused`; prop `position="auto"` (top centre on iOS, bottom end
elsewhere).

**Dialog family**: `--_dialog-backdrop-blur`, `-part-fade`,
`-stagger-max`, `-stagger`, `-part-duration`, `-part-ease`,
`-refuse-shift` (0px for no travel), `-handle-radius` (on the new Sheet
part `handle-bar`); now `-part-delay`.

**Popover, HoverCard, Tooltip**: `--_<c>-enter-stretch`; now
`-enter-sx`, `-enter-sy`.

**Tabs, SegmentedControl, ToggleGroup, Navbar**: part `label-ink`;
`--_tabs-ink`, `--_segmented-control-ink`, `--_toggle-group-ink`,
`--_navbar-ink` (1 or 0). SegmentedControl:
`--_segmented-control-indicator-filter` (backdrop-filter for the thumb,
with fallbacks).

**ProgressCircle**: part `arc`; `--_progress-circle-duration`, `-ease`,
`-dash`. **Accordion**: `--_accordion-reveal`, `-icon-nudge`,
`-icon-nudge-now` (defaults of `-shift`, `-duration`, `-ease` changed).
**Alert, Banner**: `--_alert-reveal`, `--_banner-reveal`,
`--_alert-icon-halo`, `--_banner-icon-halo`. **Callout**:
`--_callout-icon-halo`. **Card, Tile**: `--_card-glow-edge`,
`--_tile-glow-edge`. **TabBar**: `--_tab-bar-stagger`, `-press-x`,
`-press-y`. **Pagination**: `--_pagination-press-x`, `-press-y`.
**EmptyState, ErrorState**: `--_<c>-duration-in`, `-ease-in`,
`-text-duration`, `-stagger`. **SplitView**: `--_split-view-duration`,
`-ease`, `-reveal-end`, `-reveal-start`. **Meter**:
`--_meter-reveal-duration`, `-reveal-ease`, `-value-at`. **Skeleton**:
`--_skeleton-ease`. **StatusDot**: `--_status-dot-duration`, `-ease`.

**How a style changes the kind of motion** (review N2): every beat reads
private ease and duration properties (curve shape and overshoot), the scale
and distance properties set the amount, and a zero switch removes a beat
(`-motion: 0`, `-sweep: 0`, `-bloom-spread: 0px`, `-pull-max: 0px`,
`-glide: 0`, `-refuse-shift: 0px`, `-flood: 0`, `--_checkbox-stagger: 0s`).
Script beats take the style preset's mode (full, reduced or none).

## Round 2 review blockers

| Blocker | Status | Where |
| --- | --- | --- |
| B1 tokens not zeroed under reduced motion | Fixed by the lead in the token build; every family also zeroes its own private durations under both reduced forms | `packages/tokens/build.ts`; each component CSS |
| B2 eleven reduced blocks lose on specificity | Fixed: Dialog, Popover, Lightbox, Tour, WindowControls, DropdownMenu, TabBar, Toolbar, EmptyState, ErrorState, SplitView. A probe found no overlay animation under either reduced form | overlays, selection, navigation |
| B3 window lights dip and submenu nudge under reduced motion | Fixed | `WindowControls.css`, `DropdownMenu.css` |
| B4 digit roll reverses numbers in RTL and splits Arabic | Fixed in the primitive (number runs isolated left to right, words whole); Pagination checked in RTL; the slider bubble fixed separately | `packages/motion/src/primitives/digit-roll.ts`, `Slider.tsx` |
| B5 Pagination wrong numbers after rapid changes | Fixed (keyed digit hosts) | `Pagination.tsx` |
| B6 a menu trigger click lost near close | Fixed (exit copy) | `ListBox/highlightMarker.tsx` |
| B7 Switch thumb vanishes on release | Fixed (fill sweeps behind the thumb) | `Switch.css`, `Switch.tsx` |
| B8 Tabs stage without a panel | Fixed | `apps/gallery-react/src/interactions/navigation.tsx` |
| B9 recordings missing | Fixed: sheets and clips for every family in Neutral, Studio and Desk | `docs/reports/shots/interactions-3/` |

The ten weakest of round 2 (toc-travel, menu-submenu-nudge, slider-nudge,
list-stagger, meter-fill, split-view-pane, link-underline,
field-label-focus, chip-check-pop, picker-value-roll) are each reworked
above.

Known weak spots in the evidence, not in the behaviour:
- `picker-value-roll.neutral.png` was recorded under heavy load and shows
  the new label landing within a frame; the outgoing copy was confirmed in
  the browser.
- At sheet size the password wipe and the wizard tick are a few pixels
  tall; a browser probe confirmed they draw to the end.
- The Neutral slider-rubber-band and slider-nudge sheets predate the 3x
  reach.
- `window-settle` is still a fade in Studio and Neutral; that comes from
  their motion presets in `packages/styles`.
- In Desk the button label rolls on hover from the Desk recipe
  (`packages/styles/desk/recipes/Button.css`). Its label `transform` sits in
  the recipe layer, so it takes the place of the press sink on the label in
  Desk; the root dip, shade and glow still play. If Desk wants the sink as
  well, the recipe can add `translate: 0 var(--_button-part-y)` to its
  label rule.

## Recorder

`record.cjs` draws the page with CSS zoom on the root because Playwright
video ignores the device scale. Radix popper overlays (menus, pickers,
popovers, tooltips) land away from their trigger under root zoom, so a
drive can now fix `zoom: 1` and the crop is scaled up instead; `grow`
widens the region for what opens later (a submenu). The selection menus use
both. The overlays drive records its popper stages unzoomed for the same
reason, and pads each drive with 1.2s of stillness because a band that runs
past the clip end makes `sheet()` fail; the recorder should guard that.

## What needs Angular or native work

Angular needs the new DOM and behaviour to keep parity:
- Switch: parts `thumb-lens`, `thumb-icon`, the `thumbIcon` input, the drag.
- Checkbox: the `mark` svg and fill span; RadioCard `badge`; ToggleButton
  `state-layer` and press point. Without these the shared CSS falls back to
  an instant fill and the radial dot.
- Button: `result`, `resultLabel`, the `result` part and status, glow and
  ripple handlers. CopyButton: stacked glyphs and words, `bubble`, a fixed
  `aria-label`, the per-copy status.
- Rating `fill` and `--_rating-index`; Slider inline variables, glide,
  rubber band and key pull; Form and FormWizard `success-mark`; Field
  `floating`; Input `variant`.
- Menus: the `highlight` part and placement, the exit copy (B6), the pick
  check, the Select drum roll, the results flip, the per-side reveal.
- Toast: the stack (`data-stacked` and place values), the swipe
  (`swipe.ts` is pure and could move to `@the-system/shared`), the progress
  line with `data-paused`, the refused shake.
- ProgressCircle `arc`, Pagination keyed digit hosts, tab ink twins, press
  origin, step check draw, TOC travel, sidebar wipe, meter value beat,
  skeleton wipe.

Native needs the same behaviour, with equivalents of the stroke draws (check,
arc, success mark) and the switch drag.

## Token requests

None block this round. Requested for clarity:
- `scale.thumb-press` (the switch thumb press size).
- `opacity.state.pressed` (the toggle pool is a raw 0.12).
- `distance.refuse` (the dialog shake uses `space.m`).
- `scale.unfold` (the popover stretch is a product of two scale tokens).

Raw unitless values in use: 1, 0.6, 0.7, 0.35, 0.12, and the check path
length 24.

## Changes needed from the lead

In files no family agent owns:

1. `packages/styles/liquid/recipes/Button.css`: replace the specular
   highlight block (`::before`, lines 24 to 58) with, on the solid button
   family: `--_button-glow: 1; --_button-glow-color:
   var(--ds-color-glass-highlight); --_button-glow-rest: 0.35;` and
   optionally `--_button-glow-x: 22%; --_button-glow-y: 0%` (78% under
   `:dir(rtl)`). Its reduced-transparency rule becomes `--_button-glow: 0`.
2. `packages/styles/liquid/recipes/Switch.css`: replace the direct thumb
   `box-shadow`, `backdrop-filter` and the `:active` `--_switch-thumb-bg`
   swap with `--_switch-thumb-backdrop`, `-highlight`, `-solid-pressed` and
   `-shadow`.
3. `packages/styles/liquid/recipes/Slider.css`: set `--_slider-thumb-bg`
   (and transparent while held) instead of the thumb `background-color`;
   add the halo to its `::after` shadow or set `--_slider-halo-spread:
   0px`.
4. `packages/styles/liquid/recipes/SegmentedControl.css`: set
   `--_segmented-control-indicator-filter: brightness(1.12) saturate(1.6)`
   instead of writing `backdrop-filter`.
5. `packages/styles/liquid/recipes/Toast.css`: set `--_toaster-gap` instead
   of `gap`.
6. `packages/css/src/platform/android.css`:
   - Buttons: `--_button-glow: 0` (its 48dp `::before` hit area collides
     with the glow layer) and `--_button-press-shade: transparent`; draw its
     ripple from `var(--_button-ripple-x) var(--_button-ripple-y)`.
   - Switch: drop the thumb `transform` rule and `--_switch-stretch-now`;
     set `--_switch-thumb-size-rest: calc(16 / 28)`, `-on: calc(24 / 28)`,
     `-pressed: 1`, `--_switch-stretch: 1`; use `--_switch-thumb-size`
     instead of `padding-inline: 0`; optionally
     `--_switch-thumb-icon-opacity: 1` with `thumbIcon`.
   - Field: on `[data-ds='field'][data-floating]` set `--_field-float-box:
     calc(var(--ds-size-touch-android) + var(--ds-space-fixed-m))` and
     `--_field-float-inset: var(--ds-space-3xl)`; it can use
     `data-variant`.
7. `packages/css/src/platform/ios.css`: Switch moves its thumb shadow into
   `--_switch-thumb-shadow` and sets `--_switch-thumb-size-pressed: 1`; the
   toaster rule adds `--_toaster-dir: 1; --_toaster-align: start;` or the
   stacked toasts peek off screen. Optionally `--_button-press-y: 0px` on
   both platforms.
8. `docs/contracts/anatomy.md` rule 11: add Input `data-variant`, Field
   `data-floating` and `data-filled`, Toaster `data-stacked`,
   `data-expanded`, `data-paused`, Switch `data-dragging` if not listed.
9. AGENTS.md line 50 and `docs/plan/lane-session-brief.md` still say only
   `transform` and `opacity` animate; they should name the widened list.
10. The `interactionRecipes` CSS should be generated into
    `packages/styles/<id>/motion.css` rather than injected by the gallery.
11. Recipes in `@layer ds.recipes` beat `ds.base`, so a recipe that sets a
    component duration (for example `--_menu-duration-in`) overrides that
    component's reduced zeroing. Either recipes set durations only through
    tokens, or the reduced blocks move to a later layer.
12. `window-settle` is a fade in Studio and Neutral because of their motion
    presets; raising it is a `packages/styles` change.

Declined by the agents, proposed as their own orders: Sheet `detents` and
`data-detent`, Drawer swipe to dismiss (both need Angular and native
parity), Navbar `largeTitle` and `data-scrolled` (a heading decision and a
scroll owner), and a Toolbar or TabBar edge fade (it belongs on ScrollArea
or PageShell, and Liquid already draws one on the TabBar root).
