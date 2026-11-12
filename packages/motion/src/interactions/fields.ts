// Interactions of the text inputs and forms family (orders 1.21 and 1.22).
// See ./types.ts for the shape. Timings in the beats are the base values
// per style: Neutral, Desk, Studio.
import type { Interaction } from './types';

/** The private properties that turn the focus glow off on one field root. */
const glowOff = (c: string) =>
  ({
    [`--_${c}-duration-in`]: '0s',
    [`--_${c}-duration-out`]: '0s',
    [`--_${c}-enter-scale`]: '1',
  }) as Readonly<Record<`--_${string}`, string>>;

export const fieldsInteractions = [
  {
    id: 'focus-glow',
    components: ['Input', 'PasswordField', 'OTPField', 'NumberField', 'SearchField', 'Textarea', 'PhoneField', 'ScrubInput'],
    pattern: 'fade',
    drive: 'css',
    trigger: 'The field takes focus, or loses it.',
    feedback:
      'The focus ring is the root box shadow and shows at once. The glow behind it (the ::before layer) fades in and grows from scale.enter on the soft spring; on blur it leaves faster, over duration.quick on ease.exit. In OTPField it follows the active cell.',
    beats: [
      'Action, at once: the 2px ring and the focus border show on the first frame (WCAG 2.4.7). The ring is never on a layer that fades or scales.',
      'Layer: the glow fades in and grows from scale.enter (Neutral 0.97, Desk 0.9, Studio 1) on ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms with a 1% settle, Studio 100ms on a plain curve).',
      'Exit: the glow fades and shrinks over duration.quick (100ms) on ease.exit, faster than it came.',
    ],
    styles: {
      studio: 'ring and glow at once, no growth',
      desk: 'the glow blooms from 90% and settles',
      neutral: 'a short soft grow from 97%',
    },
    reduced: 'The ring and the glow show at once and do not grow (every duration token is 0ms, the start scale is 1).',
    off: {
      "[data-ds='input']": glowOff('input'),
      "[data-ds='password-field']": glowOff('password-field'),
      "[data-ds='otp-field']": glowOff('otp-field'),
      "[data-ds='number-field']": glowOff('number-field'),
      "[data-ds='search-field']": glowOff('search-field'),
      "[data-ds='textarea']": glowOff('textarea'),
      "[data-ds='phone-field']": glowOff('phone-field'),
      "[data-ds='scrub-input']": glowOff('scrub-input'),
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'error-shake',
    components: ['Input', 'PasswordField', 'OTPField', 'NumberField'],
    pattern: 'shake',
    drive: 'waapi',
    trigger: 'The field turns invalid (the invalid prop, or the Field, turns on), or the browser refuses a submit for it.',
    feedback:
      'The field box swings along the inline axis, toward the inline end first, with swings that shrink and a settle, over duration.spring-bouncy. Once per change to invalid: not on first paint of a field that starts invalid, not on each key while it stays invalid.',
    beats: [
      'Action: the box swings distance.shift toward the inline end (Neutral 4px, Desk 6px), then back about two thirds of it.',
      'Settle: two smaller swings, distance.nudge and half of it, then rest, all inside duration.spring-bouncy (Neutral 220ms, Desk 440ms) on ease.out. RTL swings the other way first.',
      'Secondary: the Field error slides in under the control on the same frame (field-error-enter).',
    ],
    styles: {
      studio: 'none: the error color and message carry it',
      desk: 'a wide swing with a long settle',
      neutral: 'a short swing that settles in 220ms',
    },
    reduced: 'No motion. The error color and the Field message carry the state.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'field-label-focus',
    components: ['Field', 'Label'],
    pattern: 'fade-rise',
    drive: 'css',
    trigger: 'Focus enters the control of a Field, or leaves it.',
    feedback: 'The label rises by distance.nudge on the snappy spring while the field holds focus, and drops back on blur. Its color does not animate.',
    beats: [
      'Action: the label rises distance.nudge (Neutral 2px, Desk 3px, Studio 1px) on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with about 10% overshoot, Studio 80ms in two steps).',
      'Settle: it rests there while focus stays; on blur it returns on the same spring. A disabled or read only Field does not move.',
    ],
    styles: {
      studio: 'one pixel, in two steps',
      desk: 'a small rise that overshoots and settles',
      neutral: 'a 2px rise in 180ms',
    },
    reduced: 'The label does not move.',
    off: { "[data-ds='field']": { '--_field-lift': '0px' } },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'field-message-enter',
    components: ['Field'],
    pattern: 'fade-rise',
    drive: 'waapi',
    trigger: 'A FieldDescription renders after the Field first painted (a hint that appears).',
    feedback: 'The description slides down from distance.shift above and fades in on the soft spring. A description there at first paint does not move.',
    beats: [
      'Action: from distance.shift above (Neutral 4px, Desk 6px, Studio 2px), opacity 0 to 1, on ease.spring-soft over duration.spring-soft (220ms, 340ms, 100ms). Text never overshoots.',
    ],
    styles: {
      studio: 'a 2px fade',
      desk: 'a soft 6px slide',
      neutral: 'a 4px slide in 220ms',
    },
    reduced: 'The description fades in.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'field-error-enter',
    components: ['FieldError', 'Field', 'Fieldset', 'ConsentField'],
    pattern: 'fade-rise',
    drive: 'waapi',
    trigger: 'An error message renders after its Field first painted, for example after a submit or a check.',
    feedback:
      'The error slides down from distance.shift above, out from under the control, and fades in on the soft spring; one stagger step later its icon lands from scale.morph past full size on the bouncy spring. The control shakes on the same frame. The message is read at once; the content below moves down at once, since height may not animate.',
    beats: [
      'Action: the message slides from distance.shift above and fades in, ease.spring-soft over duration.spring-soft (Neutral 220ms, Desk 340ms, Studio 100ms).',
      'Overshoot: after delay.stagger (24ms, 45ms, 0ms) the danger icon grows from scale.morph (0.5, 0.3, 0.8) on ease.spring-bouncy over duration.spring-bouncy (220ms, 440ms landing about 25% past, 120ms in three steps).',
      'Secondary: the control shakes once (error-shake).',
    ],
    styles: {
      studio: 'a short fade, the icon steps in',
      desk: 'the icon lands big and settles',
      neutral: 'a 4px slide, a small icon pop',
    },
    reduced: 'The message fades in; the icon does not move.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'password-reveal',
    components: ['PasswordField'],
    pattern: 'swap',
    primitive: 'icon-morph',
    drive: 'waapi',
    trigger: 'A press on the show or hide toggle.',
    feedback:
      'The input type changes at once. The eye turns into the eye off glyph (or back): the old glyph turns a quarter and shrinks out while the new one turns in and lands past full size. The field text fades back in.',
    beats: [
      'Action: the type changes on the press; the old glyph turns 90 degrees and shrinks to scale.morph while it fades, over duration.morph (Neutral 200ms, Desk 320ms, Studio 100ms) on ease.exit.',
      'Overshoot: the new glyph turns in from the other side and lands on ease.spring-bouncy (220ms, 440ms, 120ms). Hiding turns the other way.',
      'Secondary: the field text fades back in over duration.base.',
    ],
    styles: {
      studio: 'a hard cut in steps',
      desk: 'a wide turn and a big land',
      neutral: 'a quick turn with a small land',
    },
    reduced: 'The glyphs and the text cross fade, with no turn.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'search-clear',
    components: ['SearchField'],
    pattern: 'pop',
    primitive: 'icon-morph',
    drive: 'waapi',
    trigger: 'The box gets its first character (the clear button appears) or is cleared (it goes).',
    feedback:
      'The clear glyph turns in a quarter turn from scale.morph and lands past full size. When the value is cleared, a decorative copy of the button (inert, aria-hidden) turns out and shrinks over the place it had, while the value and focus change at once.',
    beats: [
      'In: rotate from minus 90 degrees and scale.morph, opacity in over the first 40%, on ease.spring-bouncy over duration.spring-bouncy (220ms, 440ms, 120ms).',
      'Out: the copy turns 90 degrees and shrinks to scale.morph while it fades, duration.morph on ease.exit, then it is removed.',
    ],
    styles: {
      studio: 'steps in, cuts out',
      desk: 'spins in with a big land',
      neutral: 'a quick turn in 220ms',
    },
    reduced: 'The glyph fades in; the copy fades out.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'search-submit',
    components: ['SearchField'],
    pattern: 'press',
    drive: 'waapi',
    trigger: 'Enter in the box (onSubmit).',
    feedback: 'The search glyph dips to scale.anticipate with a small turn and springs back past rest. onSubmit runs first.',
    beats: [
      'Anticipation: the glyph dips to scale.anticipate (0.95, 0.9, 0.97) and turns 12 degrees over the first quarter on ease.out.',
      'Overshoot and settle: it springs back on ease.spring-bouncy, the rest of duration.spring-bouncy (220ms, 440ms, 120ms).',
    ],
    styles: {
      studio: 'a 3% dip in steps',
      desk: 'a deep dip and a bounce',
      neutral: 'a small dip in 220ms',
    },
    reduced: 'No motion.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'otp-fill',
    components: ['OTPField'],
    pattern: 'pop',
    drive: 'waapi',
    trigger: 'A character is typed, pasted or filled into a cell.',
    feedback:
      'A typed character grows from scale.morph past full size on the bouncy spring and settles. A paste or an SMS fill lands as one run on the snappy spring, spread over two stagger steps in all, so the whole run stays one beat. Focus moves to the next cell at once.',
    beats: [
      'One character: from scale.morph and transparent, on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms landing about 25% past, Studio 120ms in steps).',
      'A run (paste, SMS): every new character on ease.spring-snappy over duration.spring-snappy, starts spread evenly over two delay.stagger steps: Neutral ends by about 230ms, Desk by 390ms, Studio together in 80ms.',
      'Secondary: the caret moves to the next cell (otp-caret).',
    ],
    styles: {
      studio: 'characters step in together',
      desk: 'each lands big; a paste ripples',
      neutral: 'a small land; a paste in about 230ms',
    },
    reduced: 'The characters fade in.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'otp-caret',
    components: ['OTPField'],
    pattern: 'fade-rise',
    drive: 'css',
    trigger: 'Focus enters the field, or the active cell moves on to an empty cell.',
    feedback:
      'The active empty cell draws a caret bar (its ::after; the input caret is transparent). It arrives from distance.shift toward the inline start and fades in on the snappy spring, so it reads as the caret moving on. It does not blink.',
    beats: [
      'Action: the bar slides distance.shift (4px, 6px, 2px) from the left and fades in on ease.spring-snappy over duration.spring-snappy (180ms, 300ms with overshoot, 80ms in steps).',
    ],
    styles: {
      studio: 'a short step',
      desk: 'slides on and settles',
      neutral: 'a 4px slide in 180ms',
    },
    reduced: 'The caret shows at once in its cell.',
    off: {
      "[data-ds='otp-field']": {
        '--_otp-field-shift': '0px',
        '--_otp-field-duration': '0s',
      },
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'otp-complete',
    components: ['OTPField'],
    pattern: 'list-stagger',
    drive: 'waapi',
    trigger: 'The code turns full (typed to the end, pasted or filled), and the field is not invalid.',
    feedback:
      'The cells lift by distance.lift and settle as one short wave from the first, over duration.celebrate. The nearest state to a success tick: the field knows only that the code is complete.',
    beats: [
      'Action: each cell rises distance.lift (Neutral 2px, Desk 4px, Studio 0px) over the first third on ease.out, then settles on ease.spring-soft, inside duration.celebrate (220ms, 480ms, 120ms).',
      'Stagger: the starts spread over two delay.stagger steps in all (48ms, 90ms, 0ms).',
    ],
    styles: {
      studio: 'none (distance.lift is 0)',
      desk: 'a 4px wave',
      neutral: 'a 2px wave in about 270ms',
    },
    reduced: 'No motion.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'field-step',
    components: ['NumberField'],
    pattern: 'number-roll',
    primitive: 'digit-roll',
    drive: 'waapi',
    trigger: 'A press on the increment or decrement button, or ArrowUp, ArrowDown, PageUp or PageDown. Typing does not roll.',
    feedback:
      'The value rolls digit by digit in a decorative layer over the input (an unnamed aria-hidden span, empty at rest): each changed digit rolls from below when the value grows and from above when it falls, the last digit first. While the layer holds digits the input text is transparent and keeps its caret; when the roll settles or the person types, the layer empties and the input shows its own text. A held key rolls on from the digits as drawn.',
    beats: [
      'Action: each changed digit rolls a full line in its own clipped column on ease.spring-snappy over duration.spring-snappy (Neutral 180ms, Desk 300ms with about 10% overshoot, Studio 80ms in two steps).',
      'Stagger: columns start one delay.stagger apart from the last digit (24ms, 45ms, 0ms), at most six.',
      'Settle: the layer empties when the roll ends; the input text shows again.',
    ],
    styles: {
      studio: 'digits fade in place (preset reduced)',
      desk: 'an odometer roll with overshoot',
      neutral: 'a quick roll in 180ms',
    },
    reduced: 'The new digits fade in, with no travel.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'scrub-roll',
    components: ['ScrubInput'],
    pattern: 'number-roll',
    primitive: 'digit-roll',
    drive: 'waapi',
    trigger: 'A drag on the scrub handle, or ArrowUp and ArrowDown, changes the value. Typing does not roll.',
    feedback:
      'The value rolls digit by digit in the same aria-hidden layer as NumberField while the drag runs; the handle grows to scale.pop on the bouncy spring while held and springs back on release (CSS).',
    beats: [
      'Action: each change rolls the changed digits on ease.spring-snappy over duration.spring-snappy; a change while a roll plays rolls on from the digits as drawn.',
      'Secondary: the handle grows to scale.pop (1.05, 1.14, 1) on ease.spring-bouncy over duration.spring-bouncy while the drag runs, and settles back on release.',
    ],
    styles: {
      studio: 'digits change in steps, the handle stays',
      desk: 'a rolling counter, the handle swells',
      neutral: 'a quick roll, a small swell',
    },
    reduced: 'The digits fade in; the handle does not grow.',
    off: { "[data-ds='scrub-input']": { '--_scrub-input-lift': '1' } },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'inline-edit-morph',
    components: ['InlineEdit'],
    pattern: 'swap',
    primitive: 'icon-morph',
    drive: 'waapi',
    trigger: 'Editing starts (press, Enter or Space), or ends with save or cancel.',
    feedback:
      'Starting to edit morphs the pencil into the save check, and the cancel mark lands one stagger step later. Saving morphs the check back into the pencil; cancelling morphs the close mark into it. While a morph back plays, the pencil shows even without hover, so the check reads as a short success tick.',
    beats: [
      'Action: the old glyph turns 90 degrees and shrinks to scale.morph over duration.morph on ease.exit.',
      'Overshoot: the new glyph turns in and lands past full size on ease.spring-bouncy over duration.spring-bouncy (220ms, 440ms, 120ms).',
      'Stagger: the cancel glyph lands one delay.stagger after the check.',
    ],
    styles: {
      studio: 'glyphs step in together',
      desk: 'a wide turn with a big land',
      neutral: 'a quick turn in about 220ms',
    },
    reduced: 'The glyphs cross fade.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'form-summary-enter',
    components: ['Form'],
    pattern: 'list-stagger',
    primitive: 'stagger',
    drive: 'waapi',
    trigger: 'A submit finds errors and the summary shows them.',
    feedback:
      'The summary rows arrive in reading order, each from distance.shift at the inline start, one stagger step apart. Focus moves to the first invalid field at once; the fields shake.',
    beats: [
      'Action: each row slides from distance.shift at the inline start and fades in on ease.spring-soft over duration.spring-soft, one delay.stagger apart, at most six steps.',
    ],
    styles: {
      studio: 'rows land together',
      desk: 'rows ripple in',
      neutral: 'a short ripple',
    },
    reduced: 'The rows fade in together.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'form-submit-success',
    components: ['Form'],
    pattern: 'pop',
    drive: 'waapi',
    trigger: 'A submit passes every check and the form turns submitted.',
    feedback:
      'The buttons of the actions part take one celebrate beat: each rises to scale.pop and springs back, as one short run from the first. The form is already sent and announced; nothing waits.',
    beats: [
      'Action: each button grows to scale.pop (1.05, 1.14, 1) over the first third on ease.out, then springs back on ease.spring-bouncy, inside duration.celebrate (220ms, 480ms, 120ms).',
      'Stagger: the starts spread over two delay.stagger steps in all.',
    ],
    styles: {
      studio: 'none (scale.pop is 1)',
      desk: 'a big happy bounce',
      neutral: 'a small pop',
    },
    reduced: 'No motion. The status message says the form was sent.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'wizard-step',
    components: ['FormWizard'],
    pattern: 'fade-rise',
    drive: 'waapi',
    trigger: 'The current step changes: next, back, or a step picked in the Stepper.',
    feedback:
      'Going on, the step that leaves slides toward the inline start and fades out (a decorative copy, inert and aria-hidden, over the place it had; the real body is hidden at once and keeps its values), faster than the new step, which arrives from the inline end on the soft spring. Back reverses both; RTL flips both. A mark that turned complete lands its check past full size; the new current mark answers through the Stepper motion. The title, which takes focus, does not move.',
    beats: [
      'Exit: the old step travels distance.enter (Neutral 6px, Desk 12px, Studio 4px) toward the start and fades over duration.quick (100ms) on ease.exit.',
      'Action: the new step comes from distance.enter at the end and fades in on ease.spring-soft over duration.spring-soft (220ms, 340ms, 100ms).',
      'Secondary: the completed mark lands its check from scale.morph on ease.spring-bouncy; the current mark answers through Stepper (its own interaction).',
    ],
    styles: {
      studio: 'a short slide, marks step',
      desk: 'a wide slide, marks bounce',
      neutral: 'a 6px slide in 220ms',
    },
    reduced: 'The steps cross fade, with no travel; the marks do not move.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'wizard-done',
    components: ['FormWizard'],
    pattern: 'list-stagger',
    drive: 'waapi',
    trigger: 'The wizard form is sent (state done).',
    feedback:
      'Every Stepper mark dips and springs back, as one short wave from the first: the celebrate beat of the wizard. The done title and status show at once.',
    beats: [
      'Action: each mark dips to scale.anticipate and springs back past rest on ease.spring-bouncy over duration.spring-bouncy, the starts spread over two delay.stagger steps.',
    ],
    styles: {
      studio: 'a 3% dip in steps',
      desk: 'a bouncing wave',
      neutral: 'a small quick wave',
    },
    reduced: 'No motion.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'consent-check',
    components: ['ConsentField'],
    pattern: 'pop',
    drive: 'waapi',
    trigger: 'The person gives the consent (the box turns checked).',
    feedback:
      'On top of the Checkbox draw (the wipe from the inline start), the check grows from scale.morph past full size on the bouncy spring (composite add, so the wipe still plays). Withdrawing plays only the Checkbox motion.',
    beats: [
      'Anticipation: the Checkbox box dips on press (its own motion).',
      'Action: the mark wipes in from the inline start (Checkbox check-draw).',
      'Overshoot: at the same time the mark grows from scale.morph on ease.spring-bouncy over duration.spring-bouncy (220ms, 440ms landing about 25% past, 120ms in steps).',
    ],
    styles: {
      studio: 'the mark steps in',
      desk: 'the mark lands big and settles',
      neutral: 'a small pop in 220ms',
    },
    reduced: 'No pop. The mark shows as the Checkbox draws it.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'rating-fill',
    components: ['Rating'],
    pattern: 'pop',
    drive: 'waapi',
    trigger: 'The person picks a score by click, an arrow key, Home or End.',
    feedback:
      'Only the stars whose state changed move. Stars that fill land from scale.morph past full size, as one run spread over two stagger steps; the chosen star lands on the bouncy spring, the ones before it on the snappy spring. Stars that empty dip and spring back. A new pick restarts the run. Stars that keep their state never blink.',
    beats: [
      'Action: each new star grows from scale.morph and fades in over the first third, on ease.spring-snappy (Neutral 180ms, Desk 300ms).',
      'Overshoot: the chosen star on ease.spring-bouncy over duration.spring-bouncy (220ms, 440ms landing about 25% past, 120ms in steps).',
      'Stagger: starts spread over two delay.stagger steps in all, so Neutral ends by about 270ms whatever the run.',
    ],
    styles: {
      studio: 'stars step in together',
      desk: 'a bouncy run to the pick',
      neutral: 'a short run',
    },
    reduced: 'The new stars fade in; stars that empty change at once.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'rating-preview',
    components: ['Rating'],
    pattern: 'pop',
    drive: 'css',
    trigger: 'The pointer moves over a star (the hover preview).',
    feedback:
      'The fill color changes at once. The icon of each star that joins the preview dips to scale.anticipate and springs back past rest, the star under the pointer two stagger steps late and the one before it one step, so the fill runs toward the pointer. A star that stays in the preview does not replay.',
    beats: [
      'Anticipation and overshoot: from scale.anticipate (0.95, 0.9, 0.97) back to rest on ease.spring-bouncy over duration.spring-bouncy (220ms, 440ms, 120ms).',
      'Stagger: delay.stagger for the star before the pointer, two for the star under it.',
    ],
    styles: {
      studio: 'a 3% dip in steps, no stagger',
      desk: 'a deep dip and a bounce toward the pointer',
      neutral: 'a small dip in 220ms',
    },
    reduced: 'The preview color changes at once with no dip.',
    off: { "[data-ds='rating']": { '--_rating-enter-scale': '1' } },
    round: 2,
    status: 'proposed',
  },
] as const satisfies readonly Interaction[];
