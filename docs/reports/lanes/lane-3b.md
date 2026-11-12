# Lane 3B report: Radios

Branch `claude/ds-lane-3b`. Batch file `docs/plan/wave-1-batch-3.md`.
All three orders are done, each in its own commit:

| Order | Component | Commit | Unit tests | Contract (react) |
| --- | --- | --- | --- | --- |
| 1.3.3 | RadioGroup | `c511636` | 16 | 21 passed |
| 1.3.4 | RadioCard | `61d836b` | 9 | 21 passed |
| 1.3.14 | Rating | `98a4c5d` | 11 | 21 passed |

`npm run check` was green before the lane started and after each commit.
Each component had one fresh eyes review (ds-qa as claude-opus-5-5 at
medium effort). Its blockers are fixed.

The commit message of `61d836b` says it also applies the RadioGroup review
notes. That is wrong: those notes were applied before `c511636` and are in
that commit. History was not rewritten.

## Setup notes

- GoBanana could not be added to this session: the `add_repo` call was
  denied. Every order was designed from the dials table in PLAN.md 3.7 and
  the nearest components here (Input, Field). Each manifest says so.
  RadioCard has no source in its order anyway.
- The motion catalog (order 1.11) is not merged. All three manifests name
  `fade`, as Input does. `fade` is not one of the 18 ids in 1.11 (see
  "Changes needed from the lead").

## 1.3.3 RadioGroup

Files: `packages/react/src/components/RadioGroup/` (RadioGroup.tsx, .test,
.demo, index.ts), `packages/css/src/components/RadioGroup.css`,
`packages/manifest/src/component/RadioGroup.manifest.json`,
`docs/reports/shots/wave-1/radio-group/`.

```tsx
<RadioGroup
  label?: ReactNode            // the legend, and the group name
  description?: ReactNode
  error?: ReactNode            // shows and marks invalid; invalid={false} hides it
  invalid?: boolean
  value?: string  defaultValue?: string  onValueChange?: (v: string) => void
  disabled?: boolean = false   required?: boolean = false  name?: string
  orientation?: 'vertical' | 'horizontal' = 'vertical'
  size?: 'sm' | 'md' | 'lg' = 'md'
  tone?: 'neutral' | 'accent' = 'neutral'
  loop?: boolean = true
>
  <RadioGroupItem value: string  label: ReactNode  description?: ReactNode  disabled?: boolean />
</RadioGroup>
```

Decisions:

- **Anatomy** adds three parts to the order's list, so the group carries the
  same wiring as Field and CheckboxGroup (1.3.2):
  - `items`: the wrapping row or column.
  - `error`: the message, with the danger icon.
  - `required`: the mark on the legend.

  The legend is a `div` named through `aria-labelledby`, because the Radix
  root is a `div` with role radiogroup.
- **Arrows.** All four arrows move and select in either orientation, as in a
  native radio group. No `orientation` goes to Radix; the code sets
  `aria-orientation` itself. Left and right follow the reading direction
  through the Theme's Radix direction provider.
- **Disabled** uses native `disabled`, as Radix does, so a disabled option
  leaves the arrow order. Only the circle and the label are dimmed; the
  option description stays readable. Axe failed on a dimmed description.
- **Size.** The circle is 14, 16 or 20 px. The `::after` hover veil is a
  24px circle around it, so the press area is 24px. lg rows are 44px.
- **Accent.** The checked border uses `color.primary.border`. In Desk light
  the yellow fill is about 1.3:1 against the page, and the Studio fill is
  translucent. The dot carries the state in both styles.
- **Read only** does not apply. The manifest says to show the value as text.
- **Not done:** `unicode-bidi: plaintext` on text parts. It fixed the
  leading period of English copy on an Arabic page, but it pulled English
  labels away from their circles in RTL, so I removed it. Field has the same
  open item.

## 1.3.4 RadioCard

Files: `packages/react/src/components/RadioCard/`,
`packages/css/src/components/RadioCard.css`,
`packages/manifest/src/component/RadioCard.manifest.json`,
`docs/reports/shots/wave-1/radio-card/`.

```tsx
<RadioCard
  value?  defaultValue?  onValueChange?  disabled = false  required = false
  invalid = false  name?  loop = true
  orientation?: 'vertical' | 'horizontal' = 'vertical'  // horizontal: auto-fit grid
  size?: 'sm' | 'md' | 'lg' = 'md'  tone?: 'neutral' | 'accent' = 'neutral'
  aria-labelledby | aria-label     // the group name
>
  <RadioCardItem value: string  title: ReactNode  description?: ReactNode
                 icon?: IconName | ReactNode  end?: ReactNode  disabled?: boolean />
</RadioCard>
```

Decisions:

- **The whole card is the Radix item**, a button with role radio, so the
  whole card is the target. Its name is the title, through
  `aria-labelledby`. The description and the end content join
  `aria-describedby`, so a price does not make the name long.
- **Indicator.** The Radix Indicator draws the circle, and the dot is a
  radial gradient on it, so no extra part is needed.
- **Checked** is a border change plus the dot, not color alone. An inset
  line doubles the border. In forced colors the border itself thickens.
- **Error message.** There is no `legend` or `error` part, as in the
  order's anatomy. The demo shows a heading with `aria-labelledby` and a
  message with `aria-describedby`.
- **Studio accent** is quiet, because the Studio primary is neutral. The
  doubled border and the dot carry the state.

## 1.3.14 Rating

Files: `packages/react/src/components/Rating/`,
`packages/css/src/components/Rating.css`,
`packages/styles/studio/recipes/Rating.css`,
`packages/manifest/src/component/Rating.manifest.json`,
`docs/reports/shots/wave-1/rating/`.

```tsx
<Rating
  value?: number  defaultValue?: number = 0  onValueChange?: (n: number) => void
  max?: 5 | 10 = 5
  readOnly?: boolean = false  disabled = false  required = false  name?
  size?: 'sm' | 'md' | 'lg' = 'md'  tone?: 'accent' | 'warning' = 'warning'
  showValue?: boolean = false
  getItemLabel?: (score, max) => string    // default "3 of 5 stars"
  getValueLabel?: (value, max) => string   // default "4.5 of 5 stars" / "Not rated"
  children?: ReactNode                     // text after the stars: "(128 reviews)"
/>
```

Also exported: `starFill`, `ratingItemLabel`, `ratingValueLabel`.

Decisions:

- **Interactive form.** Radix RadioGroup, horizontal, with no loop. Radix
  only moves focus on Home and End, so a root key handler sets the score to
  1 or max.
- **Read only form.** The anatomy adds a `stars` part: one element with
  `role="img"` and the score as its name. The `value` text sits outside it,
  so "(128 reviews)" is read; inside an img it would be hidden (a review
  blocker). A caller's `aria-labelledby` is joined with the score.
- **Half stars** show only in the read only form, rounded to the nearest
  half. `star-half` mirrors in RTL through the Icon mirror list. Interactive
  scores are whole stars.
- **Filled stars** carry `data-filled`, a boolean state listed in the
  manifest. Each star swaps `star` and `star-filled`, so the state is a
  shape, never color alone.
- **Colors.** warning fills in `color.state.warning.text` and accent in
  `color.primary.border`, both 3:1 or more. The Studio recipe sets accent to
  `color.text.default`. The Studio primary border is the control grey, so
  accent stars would look disabled, and no token covers this.
- **Hover** previews the score: the hovered star and the stars before it
  take the tone color, and the stars after it go back to empty.
- **Size.** lg keeps the 24px star, the largest icon size, in a 44px touch
  target.
- **Clearing.** A picked score cannot be cleared to 0, as in any radio
  group. The manifest says this.

## Token gaps

- There is no token for "the strongest neutral for a primary graphic" in
  Studio. Rating needs the Studio recipe for that, and RadioGroup and
  RadioCard accent stay quiet in Studio.
- There is no 2px fixed step under `space.fixed`. I used `space.fixed.4xs`
  (2px) to derive the 14px circle.
- There is no icon size above 24px, so Rating lg keeps a 24px star.

## Review findings

Fixed:

- **RadioGroup:**
  - The accent border now keeps 3:1.
  - Items carry `data-invalid`.
  - The local hook is replaced by `Window/useControllable`.
  - Two duplicate selectors are merged.
  - The header comment lists every private property.
  - The veil only shows around an unchecked circle, and only on hover of
    the circle or the label.
  - Added tests: Space, Tab entry, disabled skipped, RTL arrows.
  - Studio RTL and two density shots are added.
- **RadioCard:**
  - Blocker fixed: `size.icon.lg` was missing from the manifest tokens.
  - The checked circle keeps its outline.
  - The duplicate `data-state` is removed.
  - The context is memoized.
  - Added an RTL arrow test.
  - `slots.end` is fixed.
  - The Studio `styles` text is honest about the quiet accent.
- **Rating:**
  - Blocker fixed: the value text was inside the img (see above).
  - `aria-labelledby` is forwarded in the read only form.
  - The hover preview works when lowering the score.
  - The value text sits in its own column.
  - The Arabic labels are noun form.
  - Added RTL tests for the arrows, Home and End.
  - `--_rating-item-size` is renamed to `--_rating-height`.

Left open:

- **Private property names outside the list in anatomy.md rule 1:**
  - The `-checked` and `-invalid` suffixes.
  - Working properties on parts: `--_radio-group-border-now`, `-bg-now`,
    `--_radio-card-inset`, `-circle-border`, `--_rating-now`.
  - `--_rating-fg-filled` and `--_rating-veil`.

  Each file's header comment documents them. The lead decides whether the
  list grows or the names change.
- **Disabled with native `disabled`** for radios is not recorded in
  DECISIONS.md.
- **Text direction:** see the `unicode-bidi` item under RadioGroup.

## Changes needed from the lead

1. `docs/contracts/anatomy.md`, rule 1: add `-checked` and `-invalid` to
   the state suffixes. Allow a working property on a part (pattern
   `--_<c>-<name>-now`) that only state rules set. Or tell this lane which
   names to use.
2. `DECISIONS.md`: "Radio controls (RadioGroup, RadioCard, Rating) use
   native disabled, as Radix does: a disabled option leaves the arrow order.
   Rule 5 of anatomy.md covers actions and text entry only."
3. Order 1.11 or `DECISIONS.md`: choose the motion id for small state fades
   (Input, RadioGroup, RadioCard, Rating all name `fade`). Either add `fade`
   to the catalog or rename these to `fade-rise`.
4. Optional: move `packages/react/src/components/Window/useControllable.ts`
   to a shared place (for example `packages/react/src/internal/`). Dialog,
   RadioGroup, RadioCard and Rating import it from Window today.
5. Optional token: `color.primary.graphic`, a primary color for marks that
   keeps 3:1 (text default in Studio, primary border in Desk). It would
   replace the Studio Rating recipe and give RadioGroup and RadioCard a
   stronger accent in Studio.

## What I could not do

- I could not read the GoBanana source: access to the repo was denied in
  this session.
- I ran no Angular or native work; those orders are not in this lane.
- I did not test in Neutral, which is not built yet. The CSS reads tokens
  only, so it should apply.
