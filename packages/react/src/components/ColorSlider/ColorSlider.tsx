'use client';
// ColorSlider: change one channel of a colour, such as hue or opacity
// (order M9.18, proposed). Behavior from React Aria `ColorSlider`
// (react-aria-components): the drag, the arrow, Page and Home and End keys,
// the hidden range input a screen reader adjusts, and the gradient of the
// channel.
//
// Every element is ours: React Aria's `render` props hand us its DOM props.
// React Aria's class names and data attributes are dropped; the system
// stamps its own.
//
// Additions to React Aria:
// - The label and the value text use the system's words and names from
//   packages/shared/src/color.ts. React Aria adds its own colour name to the
//   value text; in Arabic that name keeps the English word order and a Latin
//   comma, so after each render the value text of the input is set to ours:
//   "214°, Blue" and "214 درجة، أزرق". Digits stay Western (`-u-nu-latn`).
// - The track gradient and the thumb colour are data: React Aria's inline
//   backgrounds become the custom properties --_color-slider-fill and
//   --_color-slider-thumb-bg, painted by ColorSlider.css (with the
//   checkerboard under opacity).
//
// WCAG 2.2 2.5.7: the drag has a path without it. The thumb takes the arrow
// keys, PageUp and PageDown, Home and End, and a press on the track moves the
// thumb there; a ColorField can sit beside it for typing.
//
// Right to left: React Aria reads the direction from the locale, so the
// gradient, the thumb and the arrow keys mirror as Slider does.
//
// DOM:
//   div [data-ds=color-slider][data-orientation]
//     label [data-part=label]
//     output [data-part=value]
//     div [data-part=track]
//       div [data-part=thumb] > input type=range (visually hidden, React Aria)
import { use, useLayoutEffect, useRef, type ComponentProps, type CSSProperties, type Ref } from 'react';
import {
  ColorSlider as AriaColorSlider,
  ColorSliderStateContext,
  ColorThumb as AriaColorThumb,
  I18nProvider,
  Label as AriaLabel,
  SliderOutput as AriaSliderOutput,
  SliderTrack as AriaSliderTrack,
  type Color,
  type ColorSpace,
} from 'react-aria-components';
import { colorLanguage, colorLocale, colorName, colorWords, type ColorChannelName, type Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { flag, mergeRefs, racOwnProps } from '../ColorSwatch/racProps';

export type ColorSliderSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type ColorSliderChannel = ColorChannelName;
export type ColorSliderOrientation = 'horizontal' | 'vertical';

export interface ColorSliderProps
  extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue' | 'ref' | 'children' | 'title' | 'color'> {
  /** The channel the slider changes: hue, saturation, brightness, lightness, red, green, blue or alpha (opacity). */
  channel: ColorSliderChannel;
  /** The colour, controlled: a hex, rgb(), hsl() or hsb() string, or a React Aria Color. Pass the Color from onChange back to keep the hue of a grey. */
  value?: string | Color;
  /** The first colour, uncontrolled. */
  defaultValue?: string | Color;
  /** Called as the value changes, with the colour as a string in its colour space and as a Color. */
  onChange?: (value: string, color: Color) => void;
  /** Called when a drag or a key press ends. */
  onChangeEnd?: (value: string, color: Color) => void;
  /** The colour space the channel belongs to. Default: the space of the value. */
  colorSpace?: ColorSpace;
  /** The visible name. Default the channel's name: Hue, Opacity, درجة اللون, العتامة. */
  label?: string;
  /** Hides the label row; the slider is then named by aria-label, or the channel's name. */
  hideLabel?: boolean;
  /** Shows the value at the inline end of the label row. Default true. */
  showValue?: boolean;
  /** Default horizontal. */
  orientation?: ColorSliderOrientation;
  /** The track: sm, md (default) or lg. The thumb is always at least a 24px target. */
  size?: ColorSliderSize;
  disabled?: boolean;
  /** The name of the hidden input in a form. */
  name?: string;
  /** The locale of the words and the direction. Default the language of the nearest Theme. Digits stay Western. */
  locale?: string;
  ref?: Ref<HTMLDivElement>;
}

/** The text a screen reader reads for the value: the number, then a name in the page's words. */
function valueText(color: Color, channel: ColorSliderChannel, locale: string): string {
  const number = color.formatChannelValue(channel, locale);
  if (channel === 'alpha') return number;
  const ar = colorLanguage(locale) === 'ar';
  // For hue, the name of the pure hue; for any other channel, the name of the colour now.
  const named = channel === 'hue' ? color.toFormat('hsl').withChannelValue('saturation', 100).withChannelValue('lightness', 50) : color;
  return `${number}${ar ? '، ' : ', '}${colorName(named.toString('hexa'), locale)}`;
}

/** Keeps the input's value text in the system's words after every render. */
function Thumb({ channel, locale }: { channel: ColorSliderChannel; locale: string }) {
  const state = use(ColorSliderStateContext);
  const thumb = useRef<HTMLDivElement | null>(null);
  const text = state ? valueText(state.getDisplayColor(), channel, locale) : '';
  // React Aria writes its own value text on each render that changes it; ours is written after it.
  useLayoutEffect(() => {
    thumb.current?.querySelector('input')?.setAttribute('aria-valuetext', text);
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
            style={{ ...place, '--_color-slider-thumb-bg': backgroundColor } as CSSProperties}
            data-part="thumb"
            data-dragging={flag(s.isDragging)}
            data-focus-visible={flag(s.isFocusVisible)}
            data-disabled={flag(s.isDisabled)}
          />
        );
      }}
    />
  );
}

export function ColorSlider({
  channel,
  value,
  defaultValue,
  onChange,
  onChangeEnd,
  colorSpace,
  label,
  hideLabel = false,
  showValue = true,
  orientation = 'horizontal',
  size = 'md',
  disabled = false,
  name,
  locale,
  className,
  style,
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: ColorSliderProps) {
  const theme = useTheme();
  const lang = locale ?? theme.lang;
  const tag = colorLocale(lang);
  const words = colorWords(lang);
  const visible = label ?? words.channels[channel];
  const named = hideLabel ? ariaLabel ?? (ariaLabelledBy ? undefined : visible) : ariaLabel;
  const out = (color: Color) => color.toString();

  return (
    <I18nProvider locale={tag}>
      <AriaColorSlider
        channel={channel}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? (color) => onChange(out(color), color) : undefined}
        onChangeEnd={onChangeEnd ? (color) => onChangeEnd(out(color), color) : undefined}
        colorSpace={colorSpace}
        orientation={orientation}
        isDisabled={disabled}
        name={name}
        aria-label={named}
        aria-labelledby={ariaLabelledBy}
        render={(domProps) => {
          const { ref: ariaRef, ...own } = racOwnProps(domProps as Record<string, unknown>) as ComponentProps<'div'>;
          return (
            <div
              {...rest}
              {...own}
              ref={mergeRefs(ariaRef, ref)}
              className={className}
              style={style}
              data-ds="color-slider"
              data-orientation={orientation}
              data-size={size}
              data-disabled={flag(disabled)}
            />
          );
        }}
      >
        {!hideLabel && (
          <AriaLabel render={(domProps) => <label {...(racOwnProps(domProps as Record<string, unknown>) as ComponentProps<'label'>)} data-part="label" />}>
            {visible}
          </AriaLabel>
        )}
        {!hideLabel && showValue && (
          <AriaSliderOutput
            render={(domProps) => <output {...(racOwnProps(domProps as Record<string, unknown>) as ComponentProps<'output'>)} data-part="value" />}
          />
        )}
        <AriaSliderTrack
          render={(domProps) => {
            const { style: trackStyle, ...own } = racOwnProps(domProps as Record<string, unknown>) as ComponentProps<'div'>;
            const { background, forcedColorAdjust: _f, ...restStyle } = (trackStyle ?? {}) as CSSProperties;
            return <div {...own} style={{ ...restStyle, '--_color-slider-fill': background } as CSSProperties} data-part="track" />;
          }}
        >
          <Thumb channel={channel} locale={tag} />
        </AriaSliderTrack>
      </AriaColorSlider>
    </I18nProvider>
  );
}
