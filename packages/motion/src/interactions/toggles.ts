// Interactions of the toggles family (order 1.23): Switch, Checkbox,
// CheckboxGroup, RadioGroup, RadioCard and ToggleButton. The rows came from
// buttons.ts and selection.ts so one agent owns the signature controls of
// round 3. See ./types.ts for the shape.
import type { Interaction } from './types';

export const togglesInteractions = [
  {
    id: 'toggle-pop',
    components: ['ToggleButton'],
    pattern: 'pop',
    drive: 'waapi',
    trigger: 'The person turns a ToggleButton on or off with the pointer, Space or Enter.',
    feedback:
      'On: the content (icon, start, label, end) pops past rest and settles, one stagger step apart, while the on fill and the ring show at once. Off: the content sinks a little and settles back. Only the parts move, so a toggle in an attached ButtonGroup keeps its seams.',
    beats: [
      'Anticipation: the press dips the button (button-press) or, in an attached group, its parts (segment-press).',
      'Action: aria-pressed, data-state, the fill and the ring change at once on release.',
      'Overshoot and settle on: each part grows to scale.pop and back over duration.celebrate on ease.out (Neutral 1.05 over 220ms, Desk 1.14 over 480ms), one delay.stagger step apart (Neutral 24ms, Desk 45ms).',
      'Off: each part sinks from scale.anticipate to rest on ease.spring-soft over duration.spring-soft.',
    ],
    styles: {
      studio: 'no pop: the fill and the ring land in place',
      desk: 'a full pop that swells the content and a staggered settle',
      neutral: 'a small pop',
    },
    reduced: 'No pop. The on fill and the ring carry the state.',
    round: 2,
    status: 'proposed',
  },
  {
    id: 'switch-stretch',
    components: ['Switch'],
    pattern: 'press',
    drive: 'css',
    trigger: 'The person presses the switch with the pointer or Space, then releases it to toggle.',
    feedback:
      'While pressed the thumb widens toward the side it will travel to, its trailing edge still, and the track dips a little. On the toggle the thumb travels on the bouncy spring, passing its end and settling, its stretch springing back with it; the track springs back to rest, and the on tint crosses in behind the thumb.',
    beats: [
      'Anticipation: the thumb stretches to scale.stretch toward its travel (Neutral 1.15, Desk 1.3, Studio 1.08) and the track dips to scale.press, both over duration.instant on ease.out, while held.',
      'Action: on release the state changes at once and the thumb travels on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms passing its end by 6%, Desk 440ms by 25%, Studio 120ms in three steps).',
      'Settle: the stretch and the track spring back to rest on the same spring.',
      'Secondary: the on tint fades in and grows from scale.morph at the inline start to the full track on ease.spring-soft over duration.spring-soft; turning off fades and shrinks it back toward the start.',
    ],
    styles: {
      studio: 'a short stretch and a travel in three hard steps',
      desk: 'a long stretch, a thumb that swings past its end, a tint that sweeps in',
      neutral: 'a short stretch and a travel with a small swing',
    },
    reduced: 'The thumb jumps to the other side and does not stretch; the track does not dip; the tint shows at once.',
    off: {
      "[data-ds='switch']": {
        '--_switch-stretch': '1',
        '--_switch-track-press': '1',
        '--_switch-motion': '0',
      },
    },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'check-draw',
    components: ['Checkbox', 'CheckboxGroup'],
    pattern: 'fade',
    drive: 'css',
    trigger: 'The person presses and checks a box, or it turns indeterminate, by click, Space or a click on its label; or presses select all in a CheckboxGroup.',
    feedback:
      'While pressed the box dips; on release it springs back and the fill shows at once; the check or the dash draws in from the inline start edge and grows from scale.morph past its size and back. ' +
      'Unchecking fades the mark out over duration.fast. Under select all the boxes of the group draw one delay.stagger apart, capped at three steps. A box checked on first paint draws nothing.',
    beats: [
      'Anticipation: the box dips to scale.anticipate over duration.instant on ease.out while pressed (Neutral 0.95, Desk 0.9, Studio 0.97; 70ms).',
      'Action: the fill shows at once on release; the clip slides in from the inline start while the mark slides the other way, on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms in steps).',
      'Overshoot: the mark grows from scale.morph (Neutral 0.5, Desk 0.3, Studio 0.8) past its size with the overshoot of the bouncy spring; the box springs back from the dip past its size on the same spring.',
      'Settle: both settle by the end of duration.spring-bouncy.',
      'Stagger: under CheckboxGroup select all, box n waits n delay.stagger (Neutral 24ms, Desk 45ms, Studio 0ms), capped at three.',
      'Exit: unchecking fades the mark over duration.fast (80ms) on ease.out, then the clip jumps back with step timing.',
    ],
    styles: { neutral: 'restrained dip and a small land in 220ms', desk: 'deep dip, a long bouncy land with a clear overshoot, a visible cascade', studio: 'a flat cut in steps, no cascade' },
    reduced: 'The mark appears and leaves at once with the fill; the box does not dip.',
    off: { "[data-ds='checkbox']": { '--_checkbox-duration': '0s', '--_checkbox-duration-out': '0s', '--_checkbox-press-scale': '1', '--_checkbox-mark-scale': '1' } },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'radio-pop',
    components: ['RadioGroup'],
    pattern: 'pop',
    drive: 'css',
    trigger: 'The person presses and picks an option, by click, Space, an arrow key or a click on its label.',
    feedback:
      'While pressed the circle dips; on release it springs back. The new dot grows from scale.morph past its size and settles, while the old dot shrinks and fades at the same time, faster.',
    beats: [
      'Anticipation: the circle dips to scale.anticipate over duration.instant on ease.out while pressed.',
      'Action and overshoot: the new dot grows from scale.morph on ease.spring-bouncy over duration.spring-bouncy (Neutral 220ms, Desk 440ms, Studio 120ms in steps) and lands past its size.',
      'Secondary: the old dot shrinks to scale.morph and fades over duration.quick (100ms) on ease.exit.',
      'Settle: the circle springs back from the dip on the bouncy spring.',
    ],
    styles: { neutral: 'a small pop in 220ms', desk: 'a deep dip and a long pop', studio: 'a flat cut in steps' },
    reduced: 'The dot appears at once; the circle does not dip.',
    off: { "[data-ds='radio-group']": { '--_radio-group-press-scale': '1', '--_radio-group-dot-from': '1' } },
    round: 2,
    status: 'proposed',
  },
  {
    id: 'radio-card-lift',
    components: ['RadioCard'],
    pattern: 'press',
    drive: 'css',
    trigger: 'The person presses and picks a card, by click, Space or an arrow key.',
    feedback:
      'While pressed the card dips to scale.press. The chosen card rises by distance.lift on the bouncy spring and stays lifted, its dot popping in as in radio-pop; the card it leaves settles down on the soft spring.',
    beats: [
      'Anticipation: the card dips to scale.press (0.97) over duration.instant on ease.out while pressed.',
      'Action and overshoot: the chosen card rises by distance.lift (Neutral 2px, Desk 4px, Studio 0) on ease.spring-bouncy over duration.spring-bouncy, past its place and back.',
      'Secondary: its dot grows from scale.morph on the bouncy spring; the old dot shrinks over duration.quick on ease.exit; the card it leaves settles down on ease.spring-soft over duration.spring-soft.',
    ],
    styles: { neutral: 'a 2px lift', desk: 'a 4px lift with a bounce', studio: 'no lift, the dot cuts in' },
    reduced: 'No lift and no dip; the dot appears at once. Border and fill carry the choice.',
    off: { "[data-ds='radio-card']": { '--_radio-card-lift': '0px', '--_radio-card-press-scale': '1', '--_radio-card-dot-from': '1' } },
    round: 2,
    status: 'proposed',
  },
] as const satisfies readonly Interaction[];
