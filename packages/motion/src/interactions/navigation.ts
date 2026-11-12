// Interactions of the navigation and shared indicator family (order 1.22;
// tab-slide from order 1.21). See ./types.ts for the shape.
import type { Interaction } from './types';

export const navigationInteractions = [
  {
    id: 'tab-slide',
    components: ['Tabs'],
    pattern: 'tab-indicator',
    drive: 'waapi',
    trigger: 'Choose another tab with a click, a tap or the arrow keys.',
    feedback:
      'The underline or pill slides and stretches from the old tab to the new one, a transform with origin 0 0 measured from both tab boxes, over duration.medium on ease.standard. The label colors and weight change at once.',
    reduced: 'No motion: the indicator appears under the new tab at once.',
    status: 'proposed',
  },
] as const satisfies readonly Interaction[];
