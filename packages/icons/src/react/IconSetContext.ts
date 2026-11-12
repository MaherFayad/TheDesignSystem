'use client';
import { createContext } from 'react';
import type { IconStyle } from '../types';
import { defaultIconStyle } from '../svg';

/**
 * The active style's icon config: the set and an optional glyph map. The Theme
 * component provides it from the style pack's icons.ts. Default: pixel.
 */
export const IconSetContext = createContext<IconStyle>(defaultIconStyle);
