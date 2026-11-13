'use client';
// Button: the one action control of the system, and the only place that
// renders a bare <button> (with IconButton, which shares ButtonBase).
//
// Sources: GoBanana `.st-btn` in banana-server/styles/studio-components.css,
// `RollButton.tsx` (the Desk roll label), Figma-Killer-2 Button.
//
// The old variants map to the shared axes like this:
//
// | Source                                  | tone    | emphasis |
// | --------------------------------------- | ------- | -------- |
// | .st-btn secondary (the default)         | neutral | soft     |
// | .st-btn ghost                           | neutral | ghost    |
// | .st-btn primary (yellow in Desk)        | accent  | solid    |
// | .st-btn destructive                     | danger  | soft     |
// | .st-btn ghost, data-tone danger         | danger  | ghost    |
// | FK2 secondary, data-tone danger         | danger  | soft     |
// | FK2 primary (neutral fill in Studio)    | accent  | solid    |
// | data-shape pill                         | shape pill            |
// | data-icon-only                          | IconButton            |
// | data-loading (overlay spinner)          | loading               |
// | FK2 fullWidth                           | fullWidth             |
//
// Not carried over: data-shape flush (no shared shape word for it), the
// inline loading form (a visible busy label is the caller's copy), FK2
// align, menuItem, navItem and numeric (they belong to Menu and Nav), and
// aria-pressed styling (a toggle is its own component).
import { useState, type ReactNode } from 'react';
import {
  ButtonLoading,
  ButtonRoot,
  renderSlotContent,
  type ButtonBaseProps,
  type ButtonSlotContent,
} from './ButtonBase';

export interface ButtonProps extends ButtonBaseProps {
  /** The label. English: a verb plus a noun. Arabic: a noun form. */
  children?: ReactNode;
  /** Default soft: the source's standard button (`.st-btn` secondary) in every style. */
  emphasis?: ButtonBaseProps['emphasis'];
  /** Leading content before the label (start side, so it sits on the right in Arabic): an icon name or a node. */
  start?: ButtonSlotContent;
  /** Trailing content after the label: an icon name or a node. */
  end?: ButtonSlotContent;
  /** Fills the width of its container. Default false. */
  fullWidth?: boolean;
  /**
   * Lets a long label wrap onto more lines; the button grows in height.
   * Default false: the label stays on one line and ends in an ellipsis when
   * the button is squeezed, and the button shrinks with its row.
   */
  wrap?: boolean;
  /**
   * The ending of an action (interaction button-result, order 1.23): while
   * set, the label rolls out and a check (success) or a cross (error) draws
   * in its place, and an error shakes the button once. Sets data-result.
   * Clear it to go back, for example after delay.feedback (2s). The width
   * holds. Default none.
   */
  result?: ButtonResult;
  /**
   * What a visually hidden status says while `result` is set, so the ending
   * is heard once: "Saved", "Could not save". Arabic: "تم الحفظ", "تعذر الحفظ".
   * While it is passed, an empty polite status sits in the button, so the
   * words are read when they arrive. Without it nothing is announced; the
   * caller may announce elsewhere.
   */
  resultLabel?: string;
}

/** The two endings an action can show. */
export type ButtonResult = 'success' | 'error';

/** The strokes of each result glyph, in a 24 unit box. Each draws from its start with stroke-dashoffset (pathLength 1). */
const resultStrokes: Record<ButtonResult, readonly string[]> = {
  success: ['M5 12.5 9.5 17 19 7'],
  error: ['M7 7 17 17', 'M17 7 7 17'],
};

/**
 * An action button. The primary action is `tone="accent" emphasis="solid"`:
 * yellow with dark text in Desk, the neutral fill in Studio, both from the
 * color.primary tokens. The label always sits in `data-part="label"`, so a
 * style recipe can draw it (the Desk roll).
 */
export function Button({
  start,
  end,
  fullWidth = false,
  wrap = false,
  loading = false,
  loadingLabel = 'Loading',
  result,
  resultLabel,
  ...rest
}: ButtonProps) {
  // The last result shown. Its glyph stays (aria-hidden, at opacity 0) after
  // the result clears, so the way back can play; nothing renders before the
  // first result.
  const [shown, setShown] = useState<ButtonResult | undefined>(result);
  if (result !== undefined && result !== shown) setShown(result);
  const glyph = result ?? shown;
  return (
    <ButtonRoot
      {...rest}
      ds="button"
      defaultEmphasis="soft"
      loading={loading}
      data-full-width={fullWidth ? '' : undefined}
      data-wrap={wrap ? '' : undefined}
      data-result={result}
      render={(content) => (
        <>
          {start !== undefined && <span data-part="start">{renderSlotContent(start)}</span>}
          <span data-part="label">{content}</span>
          {end !== undefined && <span data-part="end">{renderSlotContent(end)}</span>}
          {glyph !== undefined && (
            <span data-part="result" aria-hidden="true">
              <svg key={glyph} viewBox="0 0 24 24" focusable="false">
                {resultStrokes[glyph].map((d) => (
                  <path key={d} d={d} pathLength={1} />
                ))}
              </svg>
              {/* Order 1.29 (review N7): the ending in words beside the glyph. Hidden here: the status says it once. */}
              {resultLabel !== undefined && <span data-result-label="">{resultLabel}</span>}
            </span>
          )}
          {loading && <ButtonLoading label={loadingLabel} />}
          {resultLabel !== undefined && (
            <span data-part="status" role="status">
              {result !== undefined && !loading ? resultLabel : ''}
            </span>
          )}
        </>
      )}
    />
  );
}
