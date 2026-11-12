# Interaction round (order 1.21)

Agent: ds-style, leading the round, with five family agents (ds-component).
Branch `claude/ds-order-1-21`. Every interaction in this report is
**proposed**: it waits for the owner.

## 1. What was studied

Both sites were reached on 2026-11-12. A plain fetch returned an empty shell
for each (both render on the client), so both were read in headless Chromium
through Playwright.

**khagwal.com/interactions.** A dated list of about 150 short screen
recordings, one interaction each, from April 2024 to November 2026. Each
recording is a square 960 px clip at 60 frames a second, about 5 to 19
seconds long, that loops one control through its states with a visible
pointer. Nineteen clips were downloaded and measured frame by frame (a
frame difference count on 64 px gray frames, then contact sheets read by
eye): Copy Confirmation, Stateful Button, Micro Progress Button, Morphing
Button, Discrete Tabs, Fluid Tabs, Inline Toast, Clamped Slider, Reveal and
Copy, Save Toggle, Pop Stepper, Scale to Cue Focus, Timed Undo Action,
Switch Mode, Stepper, Morphing Action Feedback, Confirm to Delete, Invite
Code and License Key. The clips were deleted after measuring; nothing from
them is in the repo.

What the collection shows, as kinds of feedback:

| Kind | Seen in | Timing measured |
| --- | --- | --- |
| A label or glyph swaps in place in answer to an action, old out and new in at once, then swaps back after about a second | Copy Confirmation, Stateful Button, Save Toggle, Reveal and Copy | Each swap about 250 to 270 ms; success held about 1 s |
| An indicator slides between items; the labels it leaves and reaches change color while it moves | Fluid Tabs, Discrete Tabs, Switch Mode | Slide about 250 to 330 ms; a two item switch 100 to 250 ms |
| A control answers the press before the release: a small scale down, or a thumb that widens | Scale to Cue Focus, Switch Mode, Stepper | The press lands within about 100 ms |
| A short message grows out of the control that caused it, waits, then folds back | Inline Toast, Timed Undo Action, Inline Feedback Action | Enter about 350 to 450 ms, held several seconds, exit about 300 ms |
| A value steps with a roll of its digits in the direction of the change | Pop Stepper, Stepper, Conditional Stepper | Each step about 180 to 300 ms; held steps repeat without stacking |
| A value fills cell by cell as it is typed or pasted | Invite Code, License Key | Each cell about 250 ms; a paste fills in a short run |
| A drag that pushes past the end resists and springs back on release | Clamped Slider, Adaptive Slider | The spring back about 300 to 400 ms |
| A button morphs into its own progress and back | Micro Progress Button, Morphing Button, Morphing Action Feedback | Each morph about 450 to 500 ms |
| A destructive action asks a second time in place | Confirm to Delete, Inline Action Confirmation | The second state appears in about 300 ms |

The pattern under all of them: feedback starts on the same frame as the
input, the state change is never held back by the motion, and motion that
answers a direct action (press, swap, slide) is short, 100 to 300 ms, while
motion that announces something (a toast, a morph) may run to about 450 ms.

**bestdesignsonx.com.** A feed of design posts collected from X, Instagram,
Dribbble and Behance (about 10 000 items, 84 pages), shown as image and
video thumbnails with the author's handle. The posts themselves carry almost
no text, so the feed gives no timing to measure. The page's own chrome shows
two kinds that are useful here: a subscriber count drawn as per digit
columns that roll to the new value, and a pill switch for the feed filter.
Both are already in the scope list (number roll, the sliding indicator).

Nothing was copied: no code, no asset, no name of an interaction. Only the
kind of feedback and its timing were taken, and every timing below comes
from the tokens of this system.

## 2. Ideas, mapped to a component and a catalog pattern

| Idea | Component | Pattern | Why | Status |
| --- | --- | --- | --- | --- |
| Press feedback: scale to `scale.press` on press, back on release | Button, IconButton, ToggleButton, CopyButton | `press` | The press lands before the release, as in every press seen; 70 ms is under the 100 ms a direct action should answer in | proposed |
| Copy success swap: the copy glyph rolls out, the check rolls in, both at once | CopyButton | `swap` | The most common feedback in the collection; the clipboard write and the announcement do not wait | proposed |
| A check mark that draws from the inline start | Checkbox | `fade` (wipe) | Drawing a stroke needs `stroke-dashoffset`, which may not animate here; a transform only wipe reads the same | proposed |
| A switch thumb that widens while pressed and slides on toggle | Switch | `press` | Answers the press before the release and shows the direction of travel | proposed |
| Stars that pop in a short run up to the chosen one | Rating | `pop` | A value that fills mark by mark, capped so the run ends quickly | proposed |
| A focus glow that fades in and grows to its ring | Input, PasswordField, OTPField, NumberField | `fade` | The ring itself shows at once (WCAG 2.4.7); only the glow moves | proposed |
| An error shake, once, two swings | Input, PasswordField, OTPField, NumberField | `shake` | A refused value is felt on the field, not only read; one play per error, no luminance change | proposed |
| A password reveal: the eye glyph swaps and the text fades back | PasswordField | `swap` | The type change is instant; the swap makes the new state legible | proposed |
| OTP cells that pop as they fill, a paste fills in a short run | OTPField | `pop` | As in the code entry clips; focus moves on at once | proposed |
| A value that rolls in the direction of a step | NumberField, Stat | `number-roll` | As in the steppers; a held key does not stack rolls | proposed |
| Menus and popovers that scale out of their trigger side | DropdownMenu, Popover | `menu-scale` | The surface reads as coming from the control that opened it | proposed |
| A tooltip that rises a few px from its side | Tooltip | `fade-rise` | Small, quick, and instant inside a delay group | proposed |
| A toast stack that shifts to make room and a swipe that follows the finger | Toast | `toast` | As in the inline toast clips, with the pause on hover kept | proposed |
| Dialog and sheet entries on a spring like curve | Dialog, Sheet, Drawer | `dialog`, `sheet` | Spring tokens exist; CSS needs an ease token to use them | proposed |
| A tab indicator that slides between triggers | Tabs | `tab-indicator` | As in the tab clips | proposed |
| An accordion that reveals without squashing its text | Accordion | `accordion-height` | Closes note N9 of the catalog review | proposed |
| A skeleton that stops shimmering before five seconds and fades to the content | Skeleton | `skeleton-shimmer` | Closes note N10; WCAG 2.2.2 | proposed |
| A list that staggers in on first paint only | List | `list-stagger` | Content is there and readable at once; the stagger is capped | proposed |
| A slider thumb that lifts while held and nudges at the ends | Slider, RangeSlider | `press`, `shake` | The pull and release of the slider clips, kept to transforms on the thumb | proposed |

## 3. Rejected ideas

| Idea | Seen in | Why it is rejected |
| --- | --- | --- |
| Blur while an indicator or a label moves | Fluid Tabs, Copy Confirmation | `filter` may not animate (only `transform` and `opacity`), and blur costs a paint on every frame |
| A button that morphs its width into a progress pill | Micro Progress Button, Morphing Button | Animating width breaks the transform and opacity rule; a scale of the whole button distorts its label and radius |
| A stroke that draws (a signature, a check, a chart line) | Draw Signature, Save Toggle | `stroke-dashoffset` may not animate; the check uses a transform only wipe instead |
| A color shift through the hue wheel while waiting | Chromatic Thinking | A color loop is a luminance change that can pass three flashes a second; and color may not animate |
| Height that grows to show more detail | Expand Details, Card Splitting Accordion | Height may not animate; the accordion uses a clip and a counter transform |
| Cards that wiggle to show they can move | Wiggling Cards | A loop with no end and no pause control (WCAG 2.2.2), and no information |
| A rubber band that follows the pointer past the end of a slider | Clamped Slider | It needs the drag position outside the range, which Radix clamps; the end nudge gives the same message from the key and the drag |
