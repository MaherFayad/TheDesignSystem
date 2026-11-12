# Interaction round 2 (order 1.22)

Agent: ds-style, leading the round, with six family agents (ds-component).
Branch `claude/ds-order-1-22`. Every interaction, token and preset in this
report is **proposed**: it waits for the owner.

Round 1 mostly changed one property per interaction: a scale on press, a
fade, a slide. The owner asked for the layered feel of the two collections:
anticipation, overshoot, settle, staggered parts, and secondary elements that
react. This round restudies both collections, frame by frame, and builds a
foundation (spring tokens and five primitives) that every family uses.

## 1. The study

Both sites were read on 2026-11-12 in headless Chromium through Playwright.
Both render on the client.

**Method.** 56 clips from `khagwal.com/interactions` and 15 video posts from
`bestdesignsonx.com` were downloaded to a scratch folder outside the repo,
measured, read and deleted. For each clip:

1. Every frame was cut to 96 by 96 gray. A frame difference (the share of
   pixels that changed by more than 6 levels) gives a motion curve at 60
   frames a second (some clips 59).
2. The curve was split into bursts of motion. For each burst: its start, its
   length, where its peak falls, how many separate peaks it has (parts that
   move one after another), and the length of its low tail after the peak
   (the settle).
3. The two largest bursts of each clip were laid out as twelve frames on a
   contact sheet and read by eye, to name the beats: anticipation (a small
   move against the action), action, overshoot, settle, and what else
   reacts.

Nothing was copied: no code, no asset, no name of an interaction is used in
the system. Only the kind of feedback and its timing were taken. Every timing
the system plays comes from its own tokens.

**Reading the numbers.** "Peak" is when the burst moves most, from its
start. A peak early in the burst is an ease out (the motion starts fast and
settles); a long tail after the peak is a spring settling or an overshoot
coming back. "Parts" counts peaks inside one burst: one is a single move,
three or more is a staggered group.

### 1.1 khagwal.com/interactions, 56 clips

Each clip is a square recording, 4 to 26 s long, of one control looping
through its states with a visible pointer.

| # | Clip | Main burst | Peak | Parts | Settle tail | Beats seen |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Action Wheel | 851 to 1168 ms | 200 to 234 ms | 2 to 3 | 284 to 751 ms | The plus rotates to a close mark while six round actions fly out on a circle, each a few frames after the last, landing past their place and settling back; close reverses faster with all at once |
| 2 | Card Swipe | 850 to 1033 ms | 100 to 217 ms | 4 to 7 | 283 to 517 ms | The card leans as it leaves, the next card behind scales up from a smaller size to take its place, the page dots slide; the incoming card overshoots its scale slightly |
| 3 | Clamped Slider | 868 to 1251 ms | 117 to 551 ms | 5 to 16 | 100 to 284 ms | The fill follows the pointer; the value label inside the thumb rolls digit by digit as it changes; past the end the fill stretches a little and springs back on release |
| 4 | Conditional Stepper | 1101 to 1568 ms | 167 to 234 ms | 4 | 751 to 1034 ms | The minus button pops in from the side (scale from small with overshoot) when the value leaves zero, the value slides to make room, the digit rolls; at zero the minus shrinks away and the value slides back |
| 5 | Contextual Action Split | 917 to 950 ms | 117 ms | 2 | 583 ms | Two actions blur out while a close mark and two new actions grow in, the outer ones landing a beat later; the close mark rotates in |
| 6 | Copy Confirmation | 384 to 400 ms | 167 to 217 ms | 2 | 33 to 50 ms | The copy glyph shrinks and fades, the check scales in from small; the label rolls to the past tense; the fill color settles last |
| 7 | Dialog Stack | 534 to 868 ms | 100 to 567 ms | 1 to 2 | 33 to 234 ms | The front card slides down and fades while the card behind rises and scales up to the front; the exit is shorter than the entry |
| 8 | Diary Empty State | 634 to 1218 ms | 133 to 234 ms | 1 to 5 | 300 to 701 ms | An idle illustration: a page turns over in a loop with a soft settle each time; the loop pauses between turns |
| 9 | Dropdown Disclosure | 417 to 567 ms | 67 to 250 ms | 1 | 33 to 234 ms | The trigger grows into the panel; rows fade in after the surface, top first; close folds the panel back into the trigger faster than it opened |
| 10 | Edit Badge | 701 to 1218 ms | 384 ms | 1 | 751 ms | The badge fades and the editor rises from it with a slight scale; inside, the swatches appear after the frame; the chosen swatch ring scales in |
| 11 | Editable Chip | 317 to 400 ms | 67 to 184 ms | 1 to 4 | 50 to 83 ms | The pencil turns into a check (rotate and scale), the chip gains an outline; on save the check pops once |
| 12 | Emoji Spree Choice Chips | 851 to 1468 ms | 133 to 450 ms | 7 to 16 | 150 to 467 ms | Picking a chip makes it pop (scale up past rest, then settle) and the count below rolls; rows shift with a stagger to make room |
| 13 | Fan Menu | 367 to 533 ms | 133 to 250 ms | 1 to 9 | 67 to 317 ms | The plus rotates 45 degrees into a close mark while items fan out one by one from the button with a tilt; close collapses them together, faster |
| 14 | Feature Tour | 1067 to 1300 ms | 317 to 350 ms | 1 to 3 | 583 to 833 ms | The illustration cross fades with a slight scale and the title and body follow a beat later; the page dot slides to the next step |
| 15 | Filter Disclosure | 717 to 750 ms | 500 to 517 ms | 2 to 4 | 50 to 67 ms | A small icon grows into a panel; rows appear one after another from the top, about 40 ms apart; the check of the active row pops last |
| 16 | Floating Preview Chips | long, hover driven | | 17 | | A preview follows the pointer from chip to chip, lagging slightly and tilting with its travel; each new preview pops in from small |
| 17 | Fluid Tabs | 234 to 317 ms | 50 to 83 ms | 1 to 8 | 0 to 100 ms | The pill slides to the new tab; the labels it leaves and reaches blur and sharpen during the move (round 1 rejected the blur) |
| 18 | Frequency Selector | 267 to 951 ms | 83 to 217 ms | 2 to 3 | 0 to 617 ms | A second row of day chips grows out under the first with a soft settle; the pill on the first row slides; the check on the side stays still |
| 19 | Inline Action Confirmation | 267 to 333 ms | 50 to 267 ms | 1 to 3 | 0 | The label shrinks into a short bar of progress in place; done swaps the bar for a check that scales in; then the label returns |
| 20 | Inline Edit | 150 to 217 ms | 67 to 133 ms | 1 | 0 | The edit glyph splits into two action glyphs (cancel, save) that grow in side by side |
| 21 | Inline Overflow | 517 to 533 ms | 133 to 267 ms | 1 to 7 | 0 to 200 ms | The overflow dots give way to the hidden actions, which slide in one after another from the start side |
| 22 | Invite Disclosure | 950 to 1200 ms | 50 to 317 ms | 1 to 3 | 533 to 733 ms | The pill with a count grows into a panel; the count badge fades; the rows stagger in with a slight rise |
| 23 | Labeled Progress Indicator | 900 to 1100 ms | 283 to 617 ms | 11 to 16 | 67 to 117 ms | The bar eases to a new value while its caption rolls to the next word; a highlight sweeps along the fill while it works |
| 24 | Layered Progressive Disclosure | 584 to 834 ms | 133 ms | 3 | 0 to 501 ms | A switch turns on and new rows grow below it, the content under them sliding down; off reverses |
| 25 | List Stack | 550 to 600 ms | 50 to 150 ms | 1 to 3 | 233 to 300 ms | A stack of cards fans out into a list, each a step later, and settles; collapse stacks them back with a smaller step |
| 26 | MacOS Sidebar | 250 to 567 ms | 83 to 150 ms | 1 to 4 | 0 to 117 ms | The sidebar slides out with its labels fading first; opening slides it in with the labels after the panel |
| 27 | Micro Progress Button | 492 to 593 ms | 85 to 220 ms | 1 to 5 | 68 to 220 ms | The label turns into its progress: a ring fills inside the button, the label rolls to the next word, then a check scales in |
| 28 | Morphing Sidebar Controls | 501 to 684 ms | 100 to 150 ms | 2 to 8 | 33 to 284 ms | One panel morphs into another: the old content blurs and shrinks while the new grows in, the frame resizing in the middle |
| 29 | Navigation Controls | 729 to 1407 ms | 136 to 373 ms | 3 to 6 | 17 to 169 ms | A wide button presses (dips), then splits into back, dots and next; the dots slide as steps change; at the end the parts merge back into one button |
| 30 | Pagination | 868 to 1485 ms | 150 to 367 ms | 7 to 14 | 50 to 501 ms | The arrow presses, the page number rolls digit by digit, the arrows dim when at an end |
| 31 | Pin Item | 951 to 1034 ms | 100 to 133 ms | 2 to 3 | 567 to 634 ms | A row lifts and travels to a new group at the top, the rows it leaves close the gap and the rows below push down, all with a soft settle |
| 32 | Preview Slider | 508 to 695 ms | 68 to 356 ms | 4 to 6 | 17 to 119 ms | The thumb grows while held; a preview above scales with the value; on release the thumb settles with a small bounce |
| 33 | Progressive Input Stack | 767 to 833 ms | 533 to 567 ms | 4 | 17 to 583 ms | The field slides up into a stack and the next field rises in under it; the button morphs from Next to Done with its icon |
| 34 | Quick Feedback | 533 to 650 ms | 133 to 150 ms | 1 to 3 | 133 to 233 ms | The pressed thumb grows into a message pill; the other thumb fades; an undo action slides in after the message |
| 35 | Quick Option Picker | 250 to 450 ms | 67 to 200 ms | 1 to 5 | 0 to 50 ms | An option list grows out of a pill; picking one collapses the list back into the pill while the pill's label rolls to the pick |
| 36 | Quick Switcher | 417 to 551 ms | 50 to 167 ms | 4 to 8 | 0 to 17 ms | The leading icon turns into another icon (rotate and cross fade) while the placeholder rolls to the new mode |
| 37 | Range Selection Slider | 367 to 2369 ms | 83 to 651 ms | 2 to 36 | 17 to 284 ms | Two thumbs; the values in the fields below roll digit by digit as the thumbs move |
| 38 | Response Feedback | 683 to 1100 ms | 200 to 350 ms | 5 | 150 to 233 ms | The thumb glyph pops up out of its button, larger than rest, tilts, and drops back in; a soft glow fades behind it |
| 39 | Reversible Action | 934 to 984 ms | 133 to 200 ms | 3 to 4 | 551 to 667 ms | The button presses, then splits into the done state and an undo action that slides out from behind it |
| 40 | Ruler Picker | 780 to 1271 ms | 34 to 763 ms | 2 to 8 | 17 to 186 ms | The ruler scrolls under a fixed needle; the value above rolls digit by digit; ticks near the needle grow |
| 41 | Share Sheet | 2317 to 2883 ms | 1233 ms | 15 | 417 ms | A highlight row follows the pointer from row to row, sliding under the rows rather than jumping |
| 42 | Shuffle Pinned Item | 567 to 617 ms | 100 ms | 1 | 217 ms | A row travels to the pinned group at the top while the others close the gap |
| 43 | Slot Picker | 467 to 784 ms | 200 to 234 ms | 1 to 3 | 434 ms | A switch on a day grows that day's time rows below it, the days under it pushed down; rows fade in after the space opens |
| 44 | Split Actions | 750 to 817 ms | 17 to 383 ms | 2 to 4 | 67 to 533 ms | A round plus presses, blurs and splits into two labelled actions that slide apart; the reverse merges them |
| 45 | Split Button | 651 to 667 ms | 300 to 334 ms | 3 to 6 | 100 to 184 ms | A button fades and three segments grow in from its place with a back arrow first |
| 46 | Stateful Back Up | 328 to 517 ms | 86 to 172 ms | 1 to 5 | 34 ms | The label rolls up out of the button and a thin progress bar rolls in; done rolls a check and label in; back to idle rolls the other way |
| 47 | Stateful Button | 634 to 817 ms | 417 to 484 ms | 1 to 5 | 33 to 167 ms | The button dips (anticipation), the label fades out, a spinner or a percent rolls in at the same width, then a check pops |
| 48 | Status Picker | 345 to 500 ms | 172 to 241 ms | 1 to 6 | 0 to 190 ms | A status dot on an avatar grows into three status choices that fan out with overshoot, one after another |
| 49 | Status Progression | 300 ms | 150 ms | 3 | 17 ms | A status chip rolls its label and icon to the next status while its tint changes |
| 50 | Step Indicator | 1817 to 2733 ms | 517 to 1400 ms | 8 to 14 | 183 to 850 ms | The active step label slides to the next step on the track and its pill stretches as it travels, then settles |
| 51 | Step Pager | 334 to 901 ms | 83 to 133 ms | 1 to 5 | 0 to 33 ms | The arrow presses; the title rolls; the active dot slides and the icon above swaps with a pop |
| 52 | Switch Disclosure | 534 to 1034 ms | 67 to 167 ms | 2 | 217 to 567 ms | Turning a switch on opens a second option under it with a soft settle; its row rises in after the space |
| 53 | Tags | 450 to 567 ms | 283 to 333 ms | 2 to 9 | 17 to 100 ms | A tag flies from the pool to the selected row and the pool closes its gap; the selected row makes room with a slide |
| 54 | Transaction List | 667 to 984 ms | 100 to 133 ms | 1 to 3 | 367 to 567 ms | A detail card shrinks back into its row while the rest of the list rises in around it, top first |
| 55 | Tree Menu | 417 to 650 ms | 100 to 183 ms | 1 to 4 | 67 to 283 ms | A branch opens and its children slide down and fade in one after another; the chevron turns; siblings below are pushed down |
| 56 | Undo Send | 517 to 533 ms | 133 to 217 ms | 1 to 2 | 100 to 233 ms | The send arrow turns into a countdown ring with a number that rolls down each second; undo turns it back to the arrow |

### 1.2 bestdesignsonx.com, 15 video posts

The feed shows design posts with no text about their timing. Fifteen of the
newest video posts were measured the same way (the first 12 s of each).
Seven of them show a product interface; the others are illustration or
brand work and give no interface timing.

| # | Post | Main burst | Peak | Parts | Beats seen |
| --- | --- | --- | --- | --- | --- |
| 57 | File tree | 450 to 467 ms | 67 to 150 ms | 1 to 3 | A folder opens, its children slide down one after another, the row highlight follows the pointer |
| 58 | Top sources card | 317 to 1067 ms | 0 to 83 ms | 3 to 5 | The total rolls digit by digit as the view changes from list to bars to deltas; bars grow from the base one after another |
| 59 | Dashboard | 450 to 1167 ms | 50 to 1000 ms | 3 to 6 | A ring meter fills while its number counts up; cards change in place with a cross fade |
| 60 | Toggle with light | 517 to 850 ms | 100 to 600 ms | 1 to 7 | A big switch: the knob slides with a slight squash, the icon on it turns from sun to moon, a glow follows |
| 61 | Filter menu | 1200 to 1433 ms | 883 to 1067 ms | 1 to 3 | The menu drops out of the trigger and its rows appear in order; picking one closes the menu and rolls the trigger label |
| 62 | Battery widget | 817 to 850 ms | 400 to 467 ms | 3 to 4 | A pill grows from an icon; the value rolls |
| 63 | Photo grid | 325 to 725 ms | 33 to 350 ms | 7 to 13 | A photo grows from its tile to fill the view, the other tiles moving aside; close shrinks it back to the tile |

### 1.3 What the clips teach, as rules for this round

1. **Two or three beats, not one.** A response is a small sequence: a quick
   answer to the input (a dip, a press), then the change itself, then a
   settle. Clips 29, 39, 44 and 47 open with a dip of about 60 to 100 ms
   before the change.
2. **Overshoot is for things that land.** Marks, badges, popped chips, fanned
   items and new icons land past their rest and settle back (clips 1, 4, 12,
   13, 38, 48). Panels and text do not overshoot: they ease out (clips 7, 9,
   22).
3. **Stagger is short and capped.** Parts of one change start 30 to 60 ms
   apart (clips 1, 13, 15, 22, 25, 55), and a group of more than five or six
   shows the rest together. Exits do not stagger, or stagger less.
4. **Exits are faster than entrances.** Close takes about two thirds of open
   in every clip that shows both (clips 7, 9, 13, 25, 26).
5. **Secondary elements react.** When a value changes, the number rolls
   (clips 3, 30, 37, 40, 58); when a list changes, the rest of the list moves
   to close or open the gap (clips 31, 42, 53, 54); when a control opens,
   its icon turns (clips 1, 13, 55).
6. **The change never waits.** In every clip the new state is readable by the
   end of the first beat; the settle runs after it.
7. **Direct answers are short.** A press, a slide of an indicator and a swap
   run 150 to 330 ms; announcements (a panel, a morph, a stack) run 450 to
   1000 ms including the settle.
8. **What the system cannot take.** Many clips blur during a move (clips 5,
   17, 28, 35, 44) or change size (clips 9, 22, 27, 33). Those need a rule
   change and are listed in section 7.
