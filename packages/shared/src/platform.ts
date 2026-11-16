// The platform axis: what `auto` detects and the order that resolves it.
// The contract is "Platform axis" in docs/contracts/frameworks.md.
//
// Pure: no framework, no window, no document. A framework reads `navigator`
// after mount and passes it to `deviceOf`, never at module scope, so the
// server render and the first hydrated render agree on `web`.
import type { Platform, PlatformInput } from './theme';

/** The values `data-platform` may hold. `auto` is an input only and never one of them. */
export const platforms = ['web', 'ios', 'android', 'macos'] as const satisfies readonly Platform[];

/** The URL key the galleries and the docs site read: `?platform=android`. */
export const PLATFORM_QUERY_KEY = 'platform';

/** The `localStorage` key of a choice made in a platform switcher (galleries and docs only). */
export const PLATFORM_STORAGE_KEY = 'ds-platform';

/**
 * What the resolver reads from a device. Every field is optional, so a test
 * or a server can pass a partial record. The shape matches `navigator`.
 */
export interface DeviceInfo {
  /** `navigator.userAgent`. */
  userAgent?: string | null;
  /** `navigator.userAgentData`, the user agent client hints. Chromium only. */
  userAgentData?: { platform?: string | null; mobile?: boolean | null } | null;
  /** `navigator.maxTouchPoints`. Above 1 on an iPad that reports a Mac agent. */
  maxTouchPoints?: number | null;
}

/** True for one of the four values `data-platform` may hold. */
export function isPlatform(value: unknown): value is Platform {
  return typeof value === 'string' && (platforms as readonly string[]).includes(value);
}

/**
 * A platform from a URL key or a stored choice. Anything that is not one of
 * the four values, `auto` included, gives `undefined`, so the next step of
 * the resolution order decides.
 */
export function platformChoice(value: string | null | undefined): Platform | undefined {
  return isPlatform(value) ? value : undefined;
}

/**
 * Copies the fields the resolver needs from a `navigator`. Call it after
 * mount. Without a navigator (a server, a worker without one) it returns an
 * empty record, which detects as `web`.
 */
export function deviceOf(nav: unknown): DeviceInfo {
  if (typeof nav !== 'object' || nav === null) return {};
  const n = nav as { userAgent?: unknown; userAgentData?: unknown; maxTouchPoints?: unknown };
  const data = typeof n.userAgentData === 'object' && n.userAgentData !== null ? (n.userAgentData as { platform?: unknown; mobile?: unknown }) : null;
  return {
    userAgent: typeof n.userAgent === 'string' ? n.userAgent : null,
    userAgentData: data ? { platform: typeof data.platform === 'string' ? data.platform : null, mobile: typeof data.mobile === 'boolean' ? data.mobile : null } : null,
    maxTouchPoints: typeof n.maxTouchPoints === 'number' ? n.maxTouchPoints : null,
  };
}

/**
 * What `auto` resolves to on a device: `ios`, `android` or `web`. Never
 * `macos`, which is chosen only by override.
 *
 * - The client hints platform wins when it names `Android` or `iOS`. Chrome
 *   on Android in desktop mode sends a Linux agent string but still says
 *   `Android` here.
 * - `ios`: an iPhone, iPod or iPad agent, or a Mac agent with more than one
 *   touch point (an iPad in desktop mode, the default in iPadOS Safari).
 * - `android`: an Android agent string.
 * - Anything else is `web`.
 */
export function detectPlatform(device: DeviceInfo | null | undefined): Platform {
  if (!device) return 'web';
  const hinted = device.userAgentData?.platform?.trim().toLowerCase();
  if (hinted === 'android') return 'android';
  if (hinted === 'ios') return 'ios';
  const ua = device.userAgent ?? '';
  if (/\b(iPhone|iPod|iPad)\b/.test(ua)) return 'ios';
  if (/\bMacintosh\b/.test(ua) && (device.maxTouchPoints ?? 0) > 1) return 'ios';
  if (/\bAndroid\b/i.test(ua)) return 'android';
  return 'web';
}

/** The sources of the resolution order, each optional. */
export interface PlatformSources {
  /** Step 1: the prop on Theme, dsTheme or ThemeProvider. */
  prop?: PlatformInput | null;
  /** Step 2, galleries and docs only: the raw value of the URL key. */
  query?: string | null;
  /** Step 3, galleries and docs only: the raw stored choice. */
  stored?: string | null;
  /** Step 4: the detected device platform (`detectPlatform`), used only when the input is `auto`. */
  device?: Platform | null;
}

/**
 * The platform input after steps 1 to 3: the prop when it is a value, then
 * the URL key, then the stored choice, else `auto`. A gallery passes the
 * result to its root Theme, which runs step 4 after mount.
 */
export function platformInputOf(sources: Omit<PlatformSources, 'device'>): PlatformInput {
  if (sources.prop && sources.prop !== 'auto') return sources.prop;
  return platformChoice(sources.query) ?? platformChoice(sources.stored) ?? 'auto';
}

/**
 * The full resolution order of the contract, in one call:
 *
 * 1. a prop that is not `auto`;
 * 2. the URL key, when it holds one of the four values;
 * 3. the stored choice, when it holds one of the four values;
 * 4. the device;
 * 5. otherwise `web`.
 */
export function resolvePlatform(sources: PlatformSources): Platform {
  const input = platformInputOf(sources);
  if (input !== 'auto') return input;
  return sources.device && isPlatform(sources.device) ? sources.device : 'web';
}
