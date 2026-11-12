// System settings a root ThemeProvider reads from the device: reduce motion,
// reduce transparency and more contrast, through AccessibilityInfo. A nested
// provider takes them from its parent, so only the root subscribes.
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export interface DeviceSettings {
  reduceMotion: boolean;
  reduceTransparency: boolean;
  moreContrast: boolean;
}

const none: DeviceSettings = { reduceMotion: false, reduceTransparency: false, moreContrast: false };

type Key = keyof DeviceSettings;

interface Source {
  key: Key;
  read: () => Promise<boolean>;
  event: 'reduceMotionChanged' | 'reduceTransparencyChanged' | 'darkerSystemColorsChanged' | 'highTextContrastChanged';
}

function sources(): Source[] {
  const list: Source[] = [{ key: 'reduceMotion', read: () => AccessibilityInfo.isReduceMotionEnabled(), event: 'reduceMotionChanged' }];
  if (Platform.OS === 'ios') {
    list.push({ key: 'reduceTransparency', read: () => AccessibilityInfo.isReduceTransparencyEnabled(), event: 'reduceTransparencyChanged' });
    list.push({ key: 'moreContrast', read: () => AccessibilityInfo.isDarkerSystemColorsEnabled(), event: 'darkerSystemColorsChanged' });
  }
  if (Platform.OS === 'android') {
    list.push({ key: 'moreContrast', read: () => AccessibilityInfo.isHighTextContrastEnabled(), event: 'highTextContrastChanged' });
  }
  return list;
}

/**
 * The device's accessibility settings, kept up to date. When `enabled` is
 * false (a nested provider) it reads nothing and returns all false.
 */
export function useDeviceSettings(enabled: boolean): DeviceSettings {
  const [settings, setSettings] = useState<DeviceSettings>(none);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const set = (key: Key, value: boolean) => {
      if (alive) setSettings((s) => (s[key] === value ? s : { ...s, [key]: value }));
    };
    const subs = sources().map((src) => {
      src.read().then(
        (v) => set(src.key, v),
        () => undefined,
      );
      return AccessibilityInfo.addEventListener(src.event, (v: boolean) => set(src.key, v));
    });
    return () => {
      alive = false;
      for (const s of subs) s?.remove();
    };
  }, [enabled]);
  return settings;
}
