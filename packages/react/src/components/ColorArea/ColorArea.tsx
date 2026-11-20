'use client';
// ColorArea: change two channels of a colour at once on a square of colour,
// by default saturation across and brightness up (order M9.20, proposed).
// Behavior from React Aria `ColorArea` and `ColorThumb`
// (react-aria-components): the drag of the thumb, a press anywhere on the
// area that moves the thumb there, two visually hidden range inputs (one per
// channel) that a screen reader adjusts, the arrow keys and the gradient.
//
// Every element is ours: React Aria's `render` props hand us its DOM props.
// React Aria's class names and data attributes are dropped; the system
// stamps its own.
//
// Additions to React Aria:
// - Words. React Aria names each input "Color picker" (Arabic "أداة انتقاء
//   اللون"), reads the role "2D slider" (Arabic with a diacritic and a Latin
//   "2D"), and joins channel names and its own colour name with a Latin
//   comma in English word order. After each render the inputs get ours: the
//   channel's name ("Saturation", "التشبع"), the role "2D slider" ("منزلق
//   ثنائي الأبعاد") and the value text "Saturation 76%, Brightness 85%, Blue"
//   ("التشبع 76%، السطوع 85%، أزرق"), from colorAreaValueText. The area
//   itself is a group named "Saturation and brightness" ("التشبع والسطوع")
//   or the aria-label given. Digits stay Western (`-u-nu-latn`).
// - The gradient and the thumb colour are data: React Aria's inline
//   background becomes --_color-area-fill (and --_color-area-blend for the
//   rgb space, which mixes its layers with screen), the thumb's colour
//   --_color-area-thumb-bg; ColorArea.css paints both.
//
// WCAG 2.2 2.5.7: the drag has paths without it. The thumb takes the arrow
// keys (Shift for a large step), PageUp and PageDown for a large step of the
// vertical channel, Home and End for a large step of the horizontal one,
// and a single press anywhere on the area moves the thumb there. In a
// ColorPicker the grid, the sliders and the hex field are further paths.
//
// Right to left: React Aria reads the direction from the locale. The
// horizontal channel runs from the right (the gradient, the thumb, ArrowLeft
// goes up), as ColorSlider mirrors. The vertical channel never flips.
//
// DOM:
//   div [data-ds=color-area] role=group aria-label
//     div [data-part=thumb]
//       input type=range (x, visually hidden, React Aria)
//       input type=range (y, visually hidden, React Aria)
import { use, useLayoutEffect, useRef, type ComponentProps, type CSSProperties, type Ref } from 'react';
import {
  ColorArea as AriaColorArea,
  ColorAreaStateContext,
  ColorThumb as AriaColorThumb,
  I18nProvider,
  type Color,
  type ColorSpace,
} from 'react-aria-components';
import { colorAreaValueText, colorAreaWords, colorLocale, colorWords, type ColorChannelName } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { flag, mergeRefs, racOwnProps } from '../ColorSwatch/racProps';

export type ColorAreaChannel = ColorChannelName;

export interface ColorAreaProps
  extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue' | 'ref' | 'children' | 'title' | 'color'> {
  /** The colour, controlled: a hex, rgb(), hsl() or hsb() string, or a React Aria Color. Pass the Color from onChange back to keep the hue of a grey. */
  value?: string | Color;
  /** The first colour, uncontrolled. */
  defaultValue?: string | Color;
  /** Called as the colour changes, with the colour as a string in the area's colour space and as a Color. */
  onChange?: (value: string, color: Color) => void;
  /** Called when a drag or a key press ends. */
  onChangeEnd?: (value: string, color: Color) => void;
  /** The colour space of the two channels. Default hsb. */
  colorSpace?: ColorSpace;
  /** The channel across. Default saturation. */
  xChannel?: ColorAreaChannel;
  /** The channel up. Default brightness. */
  yChannel?: ColorAreaChannel;
  disabled?: boolean;
  /** The name of the hidden input of the channel across, in a form. */
  xName?: string;
  /** The name of the hidden input of the channel up, in a form. */
  yName?: string;
  /** The locale of the words and the direction. Default the language of the nearest Theme. Digits stay Western. */
  locale?: string;
  ref?: Ref<HTMLDivElement>;
}

/** Keeps the hidden inputs in the system's words after every render. */
function Thumb({ locale, xChannel, yChannel }: { locale: string; xChannel: ColorAreaChannel; yChannel: ColorAreaChannel }) {
  const state = use(ColorAreaStateContext);
  const thumb = useRef<HTMLDivElement | null>(null);
  const words = colorWords(locale);
  const role = colorAreaWords(locale).role;
  const color = state?.getDisplayColor();
  const xText = color ? colorAreaValueText(color, xChannel, yChannel, locale) : '';
  const yText = color ? colorAreaValueText(color, yChannel, xChannel, locale) : '';
  // React Aria writes its own words on each render that changes them; ours are written after it.
  useLayoutEffect(() => {
    const inputs = thumb.current?.querySelectorAll('input') ?? [];
    const set = (input: Element | undefined, name: string, text: string) => {
      if (!input) return;
      input.setAttribute('aria-label', name);
      input.setAttribute('aria-roledescription', role);
      input.setAttribute('aria-valuetext', text);
    };
    set(inputs[0], words.channels[xChannel], xText);
    set(inputs[1], words.channels[yChannel], yText);
  });
  return (
    <AriaColorThumb
      render={(domProps, s) => {
        const { style, ref: ariaRef, ...own } = racOwnProps(domProps as Record<string, unknown>) as ComponentProps<'div'>;
        const { backgroundColor, forcedColorAdjust: _f, ...place } = (style ?? {}) as CSSProperties;
        return (
          <div
            {...own}
            ref={mergeRefs(ariaRef, thumb)}
            style={{ ...place, '--_color-area-thumb-bg': backgroundColor } as CSSProperties}
            data-part="thumb"
            data-dragging={flag(s.isDragging)}
            data-disabled={flag(s.isDisabled)}
          />
        );
      }}
    />
  );
}

export function ColorArea({
  value,
  defaultValue,
  onChange,
  onChangeEnd,
  colorSpace = 'hsb',
  xChannel = 'saturation',
  yChannel = 'brightness',
  disabled = false,
  xName,
  yName,
  locale,
  className,
  style,
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: ColorAreaProps) {
  const theme = useTheme();
  const lang = locale ?? theme.lang;
  const tag = colorLocale(lang);
  const name = ariaLabelledBy ? ariaLabel : ariaLabel ?? colorAreaWords(lang).area;
  // The string in the area's own colour space: hsb(214, 61%, 81%), hsba() when see through.
  const out = (color: Color) => {
    const space = color.getColorSpace();
    return color.toString(color.getChannelValue('alpha') < 1 ? `${space}a` : space);
  };

  return (
    <I18nProvider locale={tag}>
      <AriaColorArea
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? (color) => onChange(out(color), color) : undefined}
        onChangeEnd={onChangeEnd ? (color) => onChangeEnd(out(color), color) : undefined}
        colorSpace={colorSpace}
        xChannel={xChannel}
        yChannel={yChannel}
        isDisabled={disabled}
        xName={xName}
        yName={yName}
        render={(domProps) => {
          const { ref: ariaRef, style: areaStyle, ...own } = racOwnProps(domProps as Record<string, unknown>) as ComponentProps<'div'>;
          const { background, backgroundBlendMode, forcedColorAdjust: _f, ...restStyle } = (areaStyle ?? {}) as CSSProperties;
          return (
            <div
              {...rest}
              {...own}
              ref={mergeRefs(ariaRef, ref)}
              aria-label={name}
              aria-labelledby={ariaLabelledBy}
              className={className}
              style={
                {
                  ...style,
                  ...restStyle,
                  '--_color-area-fill': background,
                  '--_color-area-blend': backgroundBlendMode ?? 'normal',
                } as CSSProperties
              }
              data-ds="color-area"
              data-disabled={flag(disabled)}
            />
          );
        }}
      >
        <Thumb locale={tag} xChannel={xChannel} yChannel={yChannel} />
      </AriaColorArea>
    </I18nProvider>
  );
}
