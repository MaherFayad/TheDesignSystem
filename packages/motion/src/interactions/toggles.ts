// Interactions of the toggles family (orders 1.22 and 1.23): Switch,
// Checkbox, CheckboxGroup, RadioGroup, RadioCard and ToggleButton. Round 3
// (order 1.23) rebuilds each one as a state machine a person can feel: rest,
// hover, press, release, selected and back, with the paint properties of the
// motion ruling (clip-path, stroke-dashoffset, stroke-dasharray, colors and
// box-shadow) besides transform and opacity. See ./types.ts for the shape.
import type { Interaction } from './types';

export const togglesInteractions = [
  {
    id: 'toggle-pop',
    components: ['ToggleButton'],
    pattern: 'press',
    drive: 'waapi',
    trigger: 'The person presses a ToggleButton with the pointer, Space or Enter, and turns it on or off.',
    feedback:
      'A state layer in the content color pools under the pointer while the button is held. Turning on, the layer floods from that point across the button while the on fill and the text color cross in behind it; turning off, it drains back to the point, faster. ' +
      'From the keyboard the flood starts at the centre. The content does not scale: the fill is the feedback.',
    beats: [
      'Rest and hover: the fill and the text color cross to the hover look over duration.quick on ease.out.',
      'Press: the state layer grows from a dot at the pointer to a disc half the button high, at 12 percent of the content color, over duration.spring-soft on ease.spring-soft (Neutral 220ms).',
      'Release on: the state changes at once. The layer floods from its disc to cover the button and fades over duration.morph on ease.out (Neutral 200ms, Desk 320ms); the on fill and the text color cross over duration.quick (100ms); the 2px inner ring shows at once.',
      'Release off: the layer starts over the whole button and drains to the press point over duration.quick on ease.exit (100ms); the fill crosses back.',
    ],
    styles: {
      studio: 'no flood: the fill and the ring change at once',
      desk: 'a slower flood with a deeper pool under the pointer',
      neutral: 'a quick flood and a quicker drain',
    },
    reduced: 'No layer and no cross fade. The on fill and the ring change at once.',
    round: 3,
    status: 'proposed',
  },
  {
    id: 'switch-stretch',
    components: ['Switch'],
    pattern: 'press',
    drive: 'css',
    trigger: 'The person hovers the switch, presses it with the pointer or Space, then releases it to toggle; or presses Enter.',
    feedback:
      'Hover leans the thumb toward the side it would travel to. While pressed the thumb grows and widens toward its travel and the track dips. On release the thumb travels on the bouncy spring, passes its end and settles; the on fill sweeps behind it with a clip whose edge rides the thumb, so the track under the thumb is filled on every frame. ' +
      'Turning off, the fill retracts behind the thumb and fades as it arrives, and the thumb color crosses back while it is still over the fill.',
    beats: [
      'Hover: the thumb leans distance.nudge toward its travel on the bouncy spring (Neutral 1px, Desk 3px); the border takes its hover color over duration.quick.',
      'Press: the thumb grows to --_switch-thumb-size-pressed (scale.pop: Neutral 1.05, Desk 1.14) and stretches to scale.stretch toward its travel, its trailing edge still; the track dips to scale.press. All over duration.instant (70ms) on ease.out.',
      'Release: the state changes at once. The thumb travels on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms passing its end by 6 percent, Desk 440ms by 25 percent, Studio 120ms in three steps), its growth and stretch springing back with it.',
      'Selected: the fill clip, on the same spring and the same properties as the thumb, sweeps from the inline start behind the thumb; the thumb color crosses to the on color over duration.quick (100ms).',
      'Back: the clip retracts behind the thumb on the same spring while the fill fades on ease.in over duration.spring-bouncy; the thumb color crosses back over duration.quick.',
    ],
    styles: {
      studio: 'no growth, a short stretch and a travel in three hard steps; the fill steps with the thumb',
      desk: 'a long stretch, a thumb that swings past its end and a fill that sweeps after it',
      neutral: 'a small lean, a short stretch and a travel with a small swing',
    },
    reduced: 'The thumb jumps to the other side and does not lean, grow or stretch; the track does not dip; the fill shows at once.',
    off: {
      "[data-ds='switch']": {
        '--_switch-stretch': '1',
        '--_switch-track-press': '1',
        '--_switch-motion': '0',
      },
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'switch-drag',
    components: ['Switch'],
    pattern: 'drag-drop',
    drive: 'css',
    trigger: 'The person drags the thumb sideways with a finger or the mouse, then lets go.',
    feedback:
      'Past a 3px slop the thumb follows the pointer with no lag, and a little past either end with a rubber band. The fill sweeps and fades with the progress and the thumb color mixes from the off color to the on color. ' +
      'On release it snaps by velocity, else to the nearer end, and springs there with the bouncy spring. A tap still toggles; the click that ends a drag toggles nothing; Space and Enter still toggle.',
    beats: [
      'Press: as in switch-stretch, the thumb grows; the stretch drops once the drag starts.',
      'Drag: the thumb sits under the pointer (no transition); past either end it moves 30 percent of the overshoot, at most 12 percent of the travel.',
      'Release: a flick faster than 0.006 travels a ms goes its way, else the nearer end wins; the state changes at once and the thumb springs from the pointer to its end on ease.spring-bouncy over duration.spring-bouncy.',
      'Settle: the fill and the thumb color finish on the same transition as switch-stretch.',
    ],
    styles: {
      studio: 'the thumb follows; the snap lands in three steps',
      desk: 'the snap swings past its end',
      neutral: 'the snap lands with a small swing',
    },
    reduced: 'The thumb still follows the pointer; on release it lands at once.',
    off: {
      "[data-ds='switch']": {
        '--_switch-motion': '0',
      },
    },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'check-draw',
    components: ['Checkbox', 'CheckboxGroup'],
    pattern: 'chart-draw',
    drive: 'css',
    trigger: 'The person presses and checks or unchecks a box by click, Space or its label; or presses select all in a CheckboxGroup.',
    feedback:
      'While pressed the box dips. On release the fill grows from the centre of the box as a circle, and the check is drawn as a stroke: the short arm first, then the long arm. ' +
      'Unchecking reverses it faster: the long arm retracts, then the short one, and the fill shrinks back to the centre. Under select all the boxes cascade one delay.stagger apart, capped at three steps, in reading order when checking and in reverse when unchecking. A box checked on first paint draws nothing.',
    beats: [
      'Hover: the empty box border takes its hover color over duration.quick.',
      'Press: the box dips to scale.anticipate over duration.instant on ease.out (Neutral 0.95, Desk 0.9, Studio 0.97; 70ms).',
      'Release: the box springs back past its size on ease.spring-bouncy over duration.spring-bouncy. The fill clip, circle(0) at the centre, grows to cover the box over half of duration.morph on ease.out (Neutral 100ms).',
      'Draw: the check strokes in with stroke-dashoffset: the short arm over 40 percent of duration.morph, the long arm over the next 60 percent, starting a quarter of duration.morph after the fill (Neutral 50ms, then 80ms and 120ms; Desk 320ms in all).',
      'Back: the long arm retracts over half of --_checkbox-duration-out (duration.quick, 100ms) on ease.in, the short arm over the next 60 percent, and the fill closes to the centre over the same 100ms from 30ms on.',
      'Cascade: box n waits n delay.stagger (Neutral 24ms, Desk 45ms, Studio 0ms), capped at three; select all off runs the steps from the last box.',
    ],
    styles: {
      neutral: 'a restrained dip, a quick fill and a 200ms draw',
      desk: 'a deep dip, a long bouncy land and a 320ms draw with a visible cascade',
      studio: 'a short draw with no cascade',
    },
    reduced: 'The fill and the mark appear and leave at once; the box does not dip.',
    off: { "[data-ds='checkbox']": { '--_checkbox-duration': '0s', '--_checkbox-duration-out': '0s', '--_checkbox-press-scale': '1', '--_checkbox-mark-scale': '1' } },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'check-mixed',
    components: ['Checkbox', 'CheckboxGroup'],
    pattern: 'swap',
    drive: 'css',
    trigger: 'A box turns mixed, or turns from mixed to checked and back: a CheckboxGroup select all when some of its items change.',
    feedback:
      'The dash and the check are the same two strokes. Mixed to checked, the joint drops and the two arms turn on a snappy spring, so the dash bends into the check while the long arm extends to its length. Checked to mixed, the check folds flat into the dash. ' +
      'Mixed to unchecked, the dash collapses to its centre and the fill closes.',
    beats: [
      'Action: the joint and both arms move with transform (a translate and a rotation per arm) over duration.morph on ease.spring-snappy (Neutral 200ms with a small swing past the angle).',
      'Length: each arm changes its drawn length with stroke-dashoffset over the same duration; the long arm grows after 40 percent, so the bend reads before the reach.',
      'Back: to unchecked both arms retract toward the joint over --_checkbox-duration-out and the fill closes to the centre.',
    ],
    styles: {
      neutral: 'a quick bend with a small swing',
      desk: 'a slower bend with a clear swing',
      studio: 'a flat swap in steps',
    },
    reduced: 'The dash and the check swap at once.',
    off: { "[data-ds='checkbox']": { '--_checkbox-duration': '0s', '--_checkbox-duration-out': '0s' } },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'radio-pop',
    components: ['RadioGroup'],
    pattern: 'pop',
    drive: 'css',
    trigger: 'The person presses and picks an option, by click, Space, an arrow key or a click on its label.',
    feedback:
      'While pressed the circle dips. On release the new circle closes in: its ring of color thickens inward to the dot, which springs in past its size. At the same time the old circle opens back out and its dot shrinks away, faster. ' +
      'The old dot leaves toward the new option and the new dot arrives from the old one, so the choice reads as one move along the group.',
    beats: [
      'Hover: the circle border takes its hover color and the veil shows around an empty circle, over duration.quick and duration.fast.',
      'Press: the circle dips to scale.anticipate over duration.instant on ease.out (70ms).',
      'Release, the new option: the fill (an inset box-shadow in the checked color) closes from the border to the dot over duration.spring-snappy on ease.out (Neutral 180ms); the dot grows from --_radio-group-dot-from on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, about 6 percent past its size) while it slides in from the side of the old option by a third of the circle.',
      'Release, the old option: the fill opens back to the border and the dot shrinks to scale.morph, fades and slides toward the new option, all over duration.quick on ease.exit (100ms).',
      'Settle: the circle springs back from the dip on the bouncy spring.',
    ],
    styles: { neutral: 'a quick close and a small pop in 220ms', desk: 'a deep dip, a longer close and a clear pop', studio: 'a flat cut in steps' },
    reduced: 'The fill and the dot appear and leave at once; the circle does not dip.',
    off: { "[data-ds='radio-group']": { '--_radio-group-press-scale': '1', '--_radio-group-dot-from': '1', '--_radio-group-dot-travel': '0px', '--_radio-group-motion': '0' } },
    round: 3,
    status: 'proposed',
  },
  {
    id: 'radio-card-lift',
    components: ['RadioCard'],
    pattern: 'press',
    drive: 'css',
    trigger: 'The person presses and picks a card, by click, Space or an arrow key.',
    feedback:
      'While pressed the card dips. On release the chosen card border and its inner line cross to the checked color, the card rises a little, and its indicator turns into a badge: the circle fills from the border inward and a check is drawn in it. ' +
      'The card it leaves crosses back faster, settles down, and its check retracts.',
    beats: [
      'Hover: the border takes its hover color over duration.quick and the veil fades in over duration.fast.',
      'Press: the card dips to scale.press (0.97) over duration.instant on ease.out.',
      'Release: the border, the inner line (an inset box-shadow) and the fill cross to the checked look over duration.morph on ease.out (Neutral 200ms); the card rises by distance.lift (Neutral 2px, Desk 4px, Studio 0) on ease.spring-bouncy over duration.spring-bouncy.',
      'Badge: the circle fills inward over duration.spring-snappy on ease.out, then the check strokes in with stroke-dashoffset over duration.morph on ease.out, starting a quarter of duration.morph in.',
      'Back: the card it leaves crosses back over duration.quick on ease.exit, settles on ease.spring-soft, and its check retracts over duration.quick on ease.in while its circle opens.',
    ],
    styles: { neutral: 'a 2px lift and a quick badge', desk: 'a 4px lift with a bounce and a slower badge', studio: 'no lift; the badge lands in steps' },
    reduced: 'No lift, no dip and no draw; the border, the fill and the check change at once.',
    off: {
      "[data-ds='radio-card']": {
        '--_radio-card-lift': '0px',
        '--_radio-card-press-scale': '1',
        '--_radio-card-dot-from': '1',
        '--_radio-card-motion': '0',
      },
    },
    round: 3,
    status: 'proposed',
  },
] as const satisfies readonly Interaction[];
