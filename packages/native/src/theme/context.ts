import { createContext } from 'react';
import type { ThemeValue } from './types';

/** The nearest ThemeProvider's value. Null outside any ThemeProvider. */
export const ThemeContext = createContext<ThemeValue | null>(null);
