// Stages of the Angular /interactions page for the actions family (orders
// 1.21 and 1.22), the twin of apps/gallery-react/src/interactions/actions.tsx.
// One standalone component per interaction id. Each stage marks the control
// that plays it with data-interaction-trigger, so the page's replay control
// can press it again. Same copy as React.
import type { Type } from '@angular/core';

/** Live stages by interaction id. */
export const stages: Record<string, Type<unknown>> = {};
