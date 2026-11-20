'use client';
import { createContext, type RefObject } from 'react';
import type { ThemeValue } from './types';

/** The nearest Theme's resolved value. Null outside any Theme. */
export const ThemeContext = createContext<ThemeValue | null>(null);

/**
 * The element of the nearest Theme, for a portal that copies the safe area
 * tokens found there (LayerTheme.tsx, order C5). A ref, so providing it
 * never renders anything again. Null outside any Theme.
 */
export const ThemeElementContext = createContext<RefObject<HTMLElement | null> | null>(null);
