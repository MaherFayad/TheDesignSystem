'use client';
// ColorSwatchPicker: pick one colour from a set of swatches (order M9.18,
// proposed). Behavior from React Aria `ColorSwatchPicker`
// (react-aria-components): a listbox in single selection, the arrow keys,
// Home and End, type to find, and the colour value it keeps.
//
// Every element is ours. React Aria's ColorSwatchPicker takes no render prop
// for its listbox, so the render prop reaches the listbox through React
// Aria's ListBoxContext, and each item renders through
// ColorSwatchPickerItem's own render prop. React Aria's class names and data
// attributes are dropped; the system stamps its own.
//
// Two layouts:
// - grid (default): the system's own 12 by 10 palette from
//   packages/shared/src/color.ts (colorSwatchGrid), drawn as one mosaic. The
//   grid is a colour map, not reading order: it keeps its hue order in right
//   to left (dir ltr on the list), and React Aria runs it with a left to
//   right locale so ArrowRight moves to the swatch drawn on the right.
//   Every name is still read in the page's language.
// - row: saved swatches as round discs in reading order, each a 44 point
//   target or more, with an add button after them when onAdd is passed.
//
// Selection is a ring and a check, never the colour alone (WCAG 2.2 1.4.1).
// Each swatch is named by colorName ("Blue, dark", "أزرق داكن").
//
// DOM:
//   div [data-ds=color-swatch-picker][data-layout]
//     div [data-part=list] role=listbox
//       div [data-part=item] role=option aria-selected
//         div [data-ds=color-swatch][data-part=swatch] role=img
//         span [data-part=check] aria-hidden     only on the selected item
//     button [data-ds=icon-button][data-part=add]  row only, with onAdd
import { useMemo, type ComponentProps, type CSSProperties, type Ref } from 'react';
import {
  ColorSwatchPicker as AriaColorSwatchPicker,
  ColorSwatchPickerItem as AriaColorSwatchPickerItem,
  I18nProvider,
  ListBoxContext,
  type Color,
} from 'react-aria-components';
import { Icon } from '@the-system/icons/react';
import { colorLocale, colorSwatchGrid, colorWords, type Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { ColorSwatch } from '../ColorSwatch/ColorSwatch';
import { flag, racOwnProps } from '../ColorSwatch/racProps';
import { IconButton } from '../IconButton/IconButton';

export type ColorSwatchPickerLayout = 'grid' | 'row';
export type ColorSwatchPickerSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** A swatch with its own name, or one that cannot be picked. */
export interface ColorSwatchPickerColor {
  /** A hex, rgb() or hsl() string. */
  color: string;
  /** The name read for it. Default: from the hue and the lightness. */
  name?: string;
  /** Shown, read, skipped by the arrow keys, never picked. */
  disabled?: boolean;
}

export interface ColorSwatchPickerProps
  extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue' | 'ref' | 'children' | 'title' | 'color'> {
  /** The swatches. Default: the system palette in grid, none in row. */
  colors?: readonly (string | ColorSwatchPickerColor)[];
  /** grid: a mosaic, the colour map. row: saved swatches as discs in reading order. Default grid. */
  layout?: ColorSwatchPickerLayout;
  /** The picked colour, controlled. It must equal one swatch to show as picked. */
  value?: string | Color;
  /** The first picked colour, uncontrolled. */
  defaultValue?: string | Color;
  /** Called with the picked colour as hex (#rrggbb, or #rrggbbaa when see through) and as a React Aria Color. */
  onChange?: (value: string, color: Color) => void;
  /** Columns of the grid. Default 12. */
  columns?: number;
  /** In row: the disc drawn in each 44 point target. sm, md (default) or lg. */
  size?: ColorSwatchPickerSize;
  /** In row: shows the add button after the swatches and is called when it is pressed. */
  onAdd?: () => void;
  /** The name of the add button. Default "Add colour", "إضافة لون". */
  addLabel?: string;
  /** No swatch can be picked; the add button is disabled. */
  disabled?: boolean;
  /** The locale of the names. Default the language of the nearest Theme. Digits stay Western. */
  locale?: string;
  ref?: Ref<HTMLDivElement>;
}

const toEntry = (c: string | ColorSwatchPickerColor): ColorSwatchPickerColor => (typeof c === 'string' ? { color: c } : c);
const outOf = (color: Color) => (color.getChannelValue('alpha') < 1 ? color.toString('hexa') : color.toString('hex')).toLowerCase();

export function ColorSwatchPicker({
  colors,
  layout = 'grid',
  value,
  defaultValue,
  onChange,
  columns = 12,
  size = 'md',
  onAdd,
  addLabel,
  disabled = false,
  locale,
  className,
  style,
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: ColorSwatchPickerProps) {
  const theme = useTheme();
  const lang = locale ?? theme.lang;
  const words = colorWords(lang);
  const grid = layout === 'grid';
  const entries = useMemo(
    () => (colors ?? (grid ? colorSwatchGrid().flat() : [])).map(toEntry),
    [colors, grid],
  );
  // The grid is a colour map: React Aria walks it left to right in every language.
  const ariaLocale = grid ? colorLocale('en') : colorLocale(lang);

  const listRender = useMemo(
    () => ({
      render: (domProps: ComponentProps<'div'>) => {
        const { style: _style, ...own } = racOwnProps(domProps as Record<string, unknown>) as ComponentProps<'div'>;
        // Disabled stays focusable and says so (anatomy.md, convention 5).
        return <div {...own} aria-disabled={disabled || undefined} data-part="list" dir={grid ? 'ltr' : undefined} />;
      },
    }),
    [grid, disabled],
  );

  return (
    <div
      {...rest}
      ref={ref}
      className={className}
      style={{ ...style, '--_color-swatch-picker-columns': columns } as CSSProperties}
      data-ds="color-swatch-picker"
      data-layout={layout}
      data-size={grid ? undefined : size}
      data-disabled={flag(disabled)}
    >
      <I18nProvider locale={ariaLocale}>
        <ListBoxContext.Provider value={listRender}>
          <AriaColorSwatchPicker
            value={value}
            defaultValue={defaultValue}
            onChange={onChange ? (color) => onChange(outOf(color), color) : undefined}
            aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : words.swatches)}
            aria-labelledby={ariaLabelledBy}
          >
            {entries.map((entry) => (
              <AriaColorSwatchPickerItem
                key={entry.color}
                color={entry.color}
                isDisabled={disabled || entry.disabled}
                render={(domProps, state) => (
                  <div
                    {...(racOwnProps(domProps as Record<string, unknown>) as ComponentProps<'div'>)}
                    data-part="item"
                    data-selected={flag(state.isSelected)}
                    data-disabled={flag(state.isDisabled)}
                  />
                )}
              >
                {({ isSelected }) => (
                  <>
                    <ColorSwatch
                      data-part="swatch"
                      color={entry.color}
                      colorName={entry.name}
                      locale={lang}
                      shape={grid ? 'square' : 'pill'}
                    />
                    {isSelected && (
                      <span data-part="check" aria-hidden="true">
                        <Icon name="check" />
                      </span>
                    )}
                  </>
                )}
              </AriaColorSwatchPickerItem>
            ))}
          </AriaColorSwatchPicker>
        </ListBoxContext.Provider>
      </I18nProvider>
      {!grid && onAdd && (
        <IconButton
          data-part="add"
          icon="plus"
          label={addLabel ?? words.add}
          emphasis="soft"
          shape="pill"
          size="lg"
          disabled={disabled}
          onClick={onAdd}
        />
      )}
    </div>
  );
}
