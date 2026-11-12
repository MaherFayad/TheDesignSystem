'use client';
import { createContext } from 'react';
import type { ThemeValue } from './types';

/** The nearest Theme's resolved value. Null outside any Theme. */
export const ThemeContext = createContext<ThemeValue | null>(null);
