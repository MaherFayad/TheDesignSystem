'use client';
import { useCallback, useState } from 'react';

/**
 * A value that is controlled when `value` is not undefined, and kept inside
 * otherwise. The setter calls `onChange` only when the value changes.
 */
export function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void): [T, (next: T) => void] {
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInner(next);
      if (!Object.is(next, current)) onChange?.(next);
    },
    [controlled, current, onChange],
  );
  return [current, set];
}
