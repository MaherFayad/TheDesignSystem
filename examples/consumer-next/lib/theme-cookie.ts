// The style and scheme a visitor picked live in two cookies, so the server
// renders the same theme the client shows: no flash and no hydration
// mismatch. The root layout reads them; the switch on the screen writes them
// and refreshes the route.
import { isScheme, isStyle, type SchemeChoice, type StyleChoice } from './copy';

export const STYLE_COOKIE = 'boards-style';
export const SCHEME_COOKIE = 'boards-scheme';

export interface ThemeChoice {
  style: StyleChoice;
  scheme: SchemeChoice;
}

/** Reads the two cookies, with Studio dark when a value is missing or unknown. */
export function readThemeChoice(get: (name: string) => string | undefined): ThemeChoice {
  const style = get(STYLE_COOKIE);
  const scheme = get(SCHEME_COOKIE);
  return { style: isStyle(style) ? style : 'studio', scheme: isScheme(scheme) ? scheme : 'dark' };
}
