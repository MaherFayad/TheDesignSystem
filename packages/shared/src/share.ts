/**
 * share(): send something to the system share sheet first (order M9.12,
 * proposed; frameworks.md "System services").
 *
 *   const result = await share({ title: 'Weekend in AlUla', url });
 *   if (result === 'fallback') setPanelOpen(true); // our SharePanel
 *
 * On the web the system sheet is the Web Share API (`navigator.share`, with
 * `navigator.canShare` for what it can take). It needs a secure context and
 * a user gesture, so call share() from a click or a key press. It exists in
 * Safari on iOS and macOS, Chrome on Android, and Chrome and Edge on Windows
 * and ChromeOS; it is missing in Firefox on desktop and in Chrome on Linux.
 * A page cannot list the device's apps or contacts, so the app's own panel
 * (SharePanel) can never show what the system sheet shows: it is the
 * fallback, and the place for the app's own targets.
 *
 * Results:
 *
 * - `'system'`: the system sheet took it and the person picked a target.
 * - `'cancelled'`: the person closed the system sheet (an `AbortError`), or
 *   a system sheet from an earlier call is still open (`InvalidStateError`).
 *   A cancel is not an error: do nothing, and never open the panel on top.
 * - `'fallback'`: no system sheet here, `system: 'never'`, the data is not
 *   something it can take (`canShare` false, files without `canShare`), or
 *   it refused (`NotAllowedError` without a user gesture or under a
 *   permissions policy, a `TypeError` or `DataError` for the data). Open the
 *   app's panel.
 *
 * React Native does not use this file: it calls `Share` from `react-native`
 * (the system sheet there always exists). Nothing here touches `navigator`
 * at module scope; a navigator can be passed in for tests.
 */

/** What is shared. The Web Share API's ShareData, typed here so the file has no DOM lib needs beyond File. */
export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

/** How share() ended. */
export type ShareResult = 'system' | 'cancelled' | 'fallback';

/** prefer: the system sheet when it can take the data, else the fallback. never: always the fallback. */
export type ShareSystem = 'prefer' | 'never';

/** The part of `navigator` share() reads. */
export interface ShareNavigator {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
}

export interface ShareOptions {
  /** Default prefer (owner decision 3, proposed). */
  system?: ShareSystem;
  /** The navigator to use. Default the global one, read at call time. */
  navigator?: ShareNavigator;
}

function globalNavigator(): ShareNavigator | undefined {
  return typeof navigator === 'undefined' ? undefined : (navigator as unknown as ShareNavigator);
}

/** The DOMException or Error name of a rejection, or ''. */
function errorName(error: unknown): string {
  if (error && typeof error === 'object' && 'name' in error) {
    const name = (error as { name: unknown }).name;
    return typeof name === 'string' ? name : '';
  }
  return '';
}

/**
 * True when the system share sheet exists and can take this data. Feature
 * tested every call: a page that moves between contexts (an iframe, a
 * permissions policy) can lose it. Files need `canShare` to say yes; with
 * no `canShare`, data without files counts as shareable.
 */
export function canSystemShare(data: ShareData, nav: ShareNavigator | undefined = globalNavigator()): boolean {
  if (!nav || typeof nav.share !== 'function') return false;
  const hasFiles = Array.isArray(data.files) && data.files.length > 0;
  if (typeof nav.canShare === 'function') {
    try {
      return nav.canShare(data);
    } catch {
      return false;
    }
  }
  return !hasFiles;
}

/**
 * Shares through the system sheet when it exists (system `prefer`), else
 * resolves `'fallback'` so the caller opens its own panel. Never rejects.
 */
export async function share(data: ShareData, options: ShareOptions = {}): Promise<ShareResult> {
  const { system = 'prefer' } = options;
  if (system === 'never') return 'fallback';
  const nav = options.navigator ?? globalNavigator();
  if (!nav || !canSystemShare(data, nav)) return 'fallback';
  try {
    // Called as a method: the Web Share API throws on a detached `share`.
    await nav.share!(data);
    return 'system';
  } catch (error) {
    const name = errorName(error);
    if (name === 'AbortError' || name === 'InvalidStateError') return 'cancelled';
    return 'fallback';
  }
}

/**
 * The text a panel's preview shows for a link: the host and the path,
 * without the scheme, `www.` or a trailing slash. A string that is not a
 * URL comes back as it is.
 */
export function shareLinkLabel(url: string): string {
  try {
    const u = new URL(url);
    const host = u.host.replace(/^www\./, '');
    const path = `${u.pathname}${u.search}`.replace(/\/$/, '');
    return `${host}${path}`;
  } catch {
    return url;
  }
}
