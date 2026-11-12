// Interactions of the fields family (order 1.21). See ./types.ts for the shape.
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
    components: ['Input', 'PasswordField', 'OTPField', 'NumberField'],
    pattern: 'fade',
    drive: 'css',
    trigger: 'The field takes focus, or loses it.',
    feedback:
      'The focus ring shows at once. The glow behind it (the ::before layer) fades in and grows from scale.dialog-enter to full size over duration.base on ease.out; on blur it fades out over duration.fast on ease.exit. In OTPField it follows the active cell.',
    reduced: 'The ring and the glow show at once and do not grow (every duration token is 0ms).',
    off: {
      "[data-ds='input']": glowOff('input'),
      "[data-ds='password-field']": glowOff('password-field'),
      "[data-ds='otp-field']": glowOff('otp-field'),
      "[data-ds='number-field']": glowOff('number-field'),
    },
    status: 'proposed',
  },
  {
    id: 'error-shake',
    components: ['Input', 'PasswordField', 'OTPField', 'NumberField'],
    pattern: 'shake',
    drive: 'waapi',
    trigger: 'The field turns invalid (the invalid prop, or the Field, turns on), or the browser refuses a submit for it.',
    feedback:
      'The field box moves space.3xs along the inline axis and back, two swings, inside duration.roll on ease.out. Once per change to invalid: not on first paint of a field that starts invalid, not on each key while it stays invalid.',
    reduced: 'No motion. The error color and the Field message carry the state.',
    status: 'proposed',
  },
  {
    id: 'password-reveal',
    components: ['PasswordField'],
    pattern: 'swap',
    drive: 'waapi',
    trigger: 'A press on the show or hide toggle.',
    feedback:
      'The input type changes at once. The new eye or eye off glyph rolls in from space.xs below and fades in over duration.base on ease.emphasized, and the field text fades back in (the fade pattern, opacity only, duration.base).',
    reduced: 'The glyph and the text fade in, with no travel.',
    status: 'proposed',
  },
  {
    id: 'otp-fill',
    components: ['OTPField'],
    pattern: 'pop',
    drive: 'waapi',
    trigger: 'A character is typed, pasted or filled into a cell.',
    feedback:
      'The character scales up from scale.press squared and fades in over duration.medium on ease.emphasized. A paste or an SMS fill runs over the cells, each one delay.reveal-step / 2 after the one before. Focus moves to the next cell at once.',
    reduced: 'The character fades in.',
    status: 'proposed',
  },
  {
    id: 'field-step',
    components: ['NumberField'],
    pattern: 'swap',
    drive: 'waapi',
    trigger: 'A press on the increment or decrement button, or ArrowUp, ArrowDown, PageUp or PageDown. Typing does not roll.',
    feedback:
      'The value text rolls in space.xs from below when it goes up and from above when it goes down, fading in, over duration.base on ease.emphasized (the travel of the swap pattern: the native input has no clip, so a full height roll would draw the text outside the box). A step that comes while the last roll still plays changes the value with no roll, so a held key or button does not flicker.',
    reduced: 'The new value fades in.',
    status: 'proposed',
  },
] as const satisfies readonly Interaction[];
