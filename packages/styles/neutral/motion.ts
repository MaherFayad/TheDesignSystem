// Neutral motion preset (style.json `motionPreset: "fade"`, the id kept for
// the maps that read it): panels and dialogs fade and settle in place over
// 150 to 180ms on an ease out. The token files point duration.base at
// duration.moderate (150ms) and duration.medium at duration.slow (180ms).
// Windows settle from the 1.28 note below.
// The rows below bring the longer patterns into 150 to 200ms on an ease out.
// Patterns and timing: packages/motion.
//
// Interactions (order 1.21, proposed): the patterns they play keep to 150 to
// 200ms on an ease out. A field error shakes over duration.slow (180ms), not
// duration.roll; marks land on ease.out; the list stagger, which would run
// past 200ms, is a plain fade.
//
// Order 1.24 (proposed): Neutral never overshoots. All three springs take
// the critically damped curve and settle in 160 to 200ms; a pop goes to
// 1.02, surfaces grow from 0.98 and rise 4px, with a 24ms stagger step. The
// rows above keep the catalog patterns on ease out.
//
// Order 1.28 (proposed): Neutral's motion differs in kind from the others:
// Studio steps, Desk overshoots and rolls, Liquid springs softly and
// stretches. Neutral glides: every spring is critically damped and short, a
// press barely dips, marks draw on ease out with no pop, nothing overshoots
// or stretches. Windows now settle instead of only fading (window mode
// `grow`): they open from scale.window-enter (0.97 in the token files) over
// duration.window-open (180ms) on ease.window, then take the window-settle
// swell of scale.lift (1.01) on ease out, a small landing with no bounce.
// Close, zoom and minimize keep to 150 to 200ms through the same tokens; the
// rows below give the catalog patterns the same timing.
import type { StyleMotionPreset } from '@the-system/motion';

const motion: StyleMotionPreset = {
  id: 'fade',
  window: 'grow',
  patterns: {
    'window-grow': { mode: 'full', enter: { duration: 'duration.slow', easing: 'ease.out' }, exit: { duration: 'duration.moderate', easing: 'ease.exit' } },
    'window-zoom': { mode: 'full', duration: 'duration.slow', easing: 'ease.out' },
    'window-minimize': { mode: 'full', duration: 'duration.slow', easing: 'ease.out' },
    'number-roll': { mode: 'full', duration: 'duration.slow', easing: 'ease.out' },
    'chart-draw': { mode: 'full', duration: 'duration.slow', easing: 'ease.out' },
    'menu-scale': { mode: 'full', enter: { easing: 'ease.out' }, exit: { duration: 'duration.base' } },
    sheet: { mode: 'full', enter: { easing: 'ease.out' } },
    'drag-drop': { mode: 'full', easing: 'ease.out' },
    'accordion-height': { mode: 'full', enter: { easing: 'ease.out' } },
    'tab-indicator': { mode: 'full', easing: 'ease.out' },
    dialog: { mode: 'full', enter: { easing: 'ease.out' } },
    'list-stagger': { mode: 'reduced' },
    swap: { mode: 'full', easing: 'ease.out' },
    pop: { mode: 'full', duration: 'duration.base', easing: 'ease.out' },
    shake: { mode: 'full', duration: 'duration.slow', easing: 'ease.out' },
  },
  interactions: {
    'window-settle': 'full',
  },
};

export default motion;
