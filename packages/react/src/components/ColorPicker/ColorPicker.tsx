'use client';
// ColorPicker: pick a colour in one of three views, set its opacity, keep
// saved colours and pick from the screen (order M9.20, proposed). It
// composes the colour parts of orders M9.18 and M9.20:
//
// - views, a Tabs (soft, the filled pill look a platform can draw as a
//   segmented control) with three tabs: grid (ColorSwatchPicker of the
//   system palette), spectrum (ColorArea for saturation and brightness over
//   a hue ColorSlider) and sliders (red, green and blue ColorSliders and a
//   hex ColorField);
// - opacity, an alpha ColorSlider under the views;
// - footer: the preview ColorSwatch, the saved colours (ColorSwatchPicker
//   row, with its add button that saves the colour now) and the eyedropper
//   IconButton, shown only where the browser has one
//   (colorEyeDropperAvailable, read after mount; never in WebKit or Firefox).
//
// Two forms, set by `variant`:
// - compact (default): a round swatch button (part trigger, named "Colour,
//   Blue, dark") that opens the panel in a Popover on web and macos and in a
//   Sheet on ios and android. Escape or a press outside closes it and focus
//   goes back to the trigger.
// - inline: the panel in place. The panel is itself a ColorPicker root with
//   data-variant inline, also inside the popover and the sheet.
//
// The colour is one value held here as a React Aria Color in hsb with alpha,
// so a grey keeps its hue while the spectrum moves. A grid or saved pick
// keeps the opacity set; a saved colour brings its own. onChange gives
// #rrggbb, or #rrggbbaa when see through, lowercase.
//
// Parts inside a view (the grid, the area, the sliders, the hex field) sit
// inside the Tabs root, so by the anatomy rule they belong to Tabs and carry
// no part of ColorPicker; ColorPicker.css reaches them by their own data-ds
// under the views part.
//
// WCAG 2.2: 2.5.7, the spectrum drag has the arrow keys, and the grid, the
// sliders and the hex field are paths with no drag at all. 2.5.8, every
// target is 24 or more (the grid cells, the thumbs, the discs at
// size.control.lg). 1.4.11, swatches, the area, the tracks and the thumbs
// have an edge at 3:1. 4.1.2, the views are tabs, the area a group of two
// named sliders, the saved colours a listbox. 1.4.10, the panel fills
// its container and fits 320 wide.
//
// Right to left: the tabs, the footer and the sliders follow reading order;
// the area's horizontal channel and the sliders mirror (React Aria); the
// grid keeps its hue order (a colour map, M9.18).
//
// DOM, compact:
//   div [data-ds=color-picker][data-variant=compact][data-size]
//     button [data-ds=icon-button][data-part=trigger] aria-haspopup=dialog aria-expanded
//       div [data-ds=color-swatch] aria-hidden
//   (open) Popover or Sheet > div [data-ds=color-picker][data-variant=inline]
// DOM, inline:
//   div [data-ds=color-picker][data-variant=inline] role=group aria-label
//     div [data-ds=tabs][data-part=views]
//       div [data-part=list] role=tablist > button role=tab x3
//       div [data-part=panel] role=tabpanel > the view's controls
//     div [data-ds=color-slider][data-part=opacity]        with opacity
//     div [data-part=footer]
//       div [data-ds=color-swatch][data-part=preview]
//       div [data-ds=color-swatch-picker][data-part=saved]
//       button [data-ds=icon-button][data-part=eyedropper]  where available
//
// Motion: none of its own. The tabs bring tab-indicator, the popover
// menu-scale, the sheet its rise, the thumbs press; all collapse under
// reduced motion.
import { useCallback, useEffect, useState, type ComponentProps, type CSSProperties, type ReactNode, type Ref } from 'react';
import { parseColor, type Color } from 'react-aria-components';
import { colorEyeDropperAvailable, colorName, colorPickFromScreen, type Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { useControllable } from '../../internal/useControllable';
import { ColorArea } from '../ColorArea/ColorArea';
import { ColorField } from '../ColorField/ColorField';
import { ColorSlider } from '../ColorSlider/ColorSlider';
import { ColorSwatch } from '../ColorSwatch/ColorSwatch';
import { flag } from '../ColorSwatch/racProps';
import { ColorSwatchPicker } from '../ColorSwatchPicker/ColorSwatchPicker';
import { IconButton } from '../IconButton/IconButton';
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from '../Popover/Popover';
import { Sheet, SheetBody, SheetContent, SheetTrigger } from '../Sheet/Sheet';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '../Tabs/Tabs';
import { colorPickerWords } from './pickerWords';

export type ColorPickerVariant = 'compact' | 'inline';
export type ColorPickerView = 'grid' | 'spectrum' | 'sliders';
export type ColorPickerSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export interface ColorPickerProps
  extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue' | 'ref' | 'children' | 'title' | 'color'> {
  /** The colour, controlled: a hex, rgb(), hsl() or hsb() string, or a React Aria Color. */
  value?: string | Color;
  /** The first colour, uncontrolled. Default white. */
  defaultValue?: string | Color;
  /** Called as the colour changes, with #rrggbb (#rrggbbaa when see through) and the Color. */
  onChange?: (value: string, color: Color) => void;
  /** compact: a swatch button that opens the panel. inline: the panel in place. Default compact. */
  variant?: ColorPickerVariant;
  /** The view shown, controlled. */
  view?: ColorPickerView;
  /** The first view, uncontrolled. Default grid. */
  defaultView?: ColorPickerView;
  /** Called with the view a tab shows. */
  onViewChange?: (view: ColorPickerView) => void;
  /** The saved colours, controlled. */
  savedColors?: readonly string[];
  /** The first saved colours, uncontrolled. Default none. */
  defaultSavedColors?: readonly string[];
  /** Called with the saved colours after the add button saves one. */
  onSavedColorsChange?: (colors: string[]) => void;
  /** Shows the opacity slider. Default true. */
  showOpacity?: boolean;
  /** The label: the title of the popover or sheet, the first word of the trigger's name and the name of the panel. Default "Colour", "اللون". */
  label?: string;
  /** In compact: the trigger, size.control sm, md (default) or lg. */
  size?: ColorPickerSize;
  /** In compact: open, controlled. */
  open?: boolean;
  /** In compact: open at first. */
  defaultOpen?: boolean;
  /** In compact: called when the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** The locale of the words and the direction. Default the language of the nearest Theme. Digits stay Western. */
  locale?: string;
  ref?: Ref<HTMLDivElement>;
}

const toColor = (value: string | Color): Color => {
  const c = typeof value === 'string' ? parseColor(value) : value;
  return c.getColorSpace() === 'hsb' ? c : c.toFormat('hsba');
};
const hexOf = (color: Color) => (color.getChannelValue('alpha') < 1 ? color.toString('hexa') : color.toString('hex')).toLowerCase();
const opaqueHex = (color: Color) => color.toString('hex').toLowerCase();

/** Our own eyedropper glyph (no system icon name for it yet). */
function EyedropperGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-ds="icon"
      data-size="lg"
    >
      <path d="M15 4.5l4.5 4.5" />
      <path d="M13.5 6l4.5 4.5-1.5 1.5-4.5-4.5z" />
      <path d="M12 7.5l-7 7V19h4.5l7-7" />
    </svg>
  );
}

interface PanelProps {
  color: Color;
  setColor: (color: Color) => void;
  view: ColorPickerView;
  setView: (view: ColorPickerView) => void;
  saved: readonly string[];
  addSaved: () => void;
  showOpacity: boolean;
  label: string;
  disabled: boolean;
  lang: string;
  rest?: Omit<ComponentProps<'div'>, 'ref'>;
  className?: string;
  style?: CSSProperties;
  rootRef?: Ref<HTMLDivElement>;
}

/** The panel: one ColorPicker root with data-variant inline. */
function Panel({ color, setColor, view, setView, saved, addSaved, showOpacity, label, disabled, lang, rest, className, style, rootRef }: PanelProps) {
  const words = colorPickerWords(lang);
  const [eyedropper, setEyedropper] = useState(false);
  // Feature tested after mount, never on the server (frameworks.md, "System services").
  useEffect(() => setEyedropper(colorEyeDropperAvailable()), []);
  const alpha = color.getChannelValue('alpha');
  const keepAlpha = (picked: Color) => toColor(picked).withChannelValue('alpha', alpha);
  const fromSlider = (_: string, c: Color) => setColor(toColor(c));
  // A hex read as hsb has a fractional hue (211.18°). The area and the hue
  // slider get a copy with whole numbers to show and read; the colour itself
  // is kept exact, so a grid pick still matches its swatch.
  const shown = (['hue', 'saturation', 'brightness'] as const).reduce(
    (c, channel) => c.withChannelValue(channel, Math.round(c.getChannelValue(channel))),
    color,
  );
  const savedValue = saved.find((s) => s.toLowerCase() === hexOf(color));

  const pickFromScreen = async () => {
    const hex = await colorPickFromScreen();
    if (hex) setColor(keepAlpha(parseColor(hex)));
  };

  // Only the active panel mounts its content (TabsPanel), so each body is built only when shown.
  const body = (which: ColorPickerView): ReactNode => (which === view ? views[which]() : null);
  const views: Record<ColorPickerView, () => ReactNode> = {
    grid: () => (
      <ColorSwatchPicker
        aria-label={words.grid}
        locale={lang}
        value={opaqueHex(color)}
        onChange={(_, c) => setColor(keepAlpha(c))}
        disabled={disabled}
      />
    ),
    spectrum: () => (
      <>
        <ColorArea locale={lang} value={shown} onChange={fromSlider} disabled={disabled} />
        <ColorSlider channel="hue" colorSpace="hsb" locale={lang} value={shown} onChange={fromSlider} disabled={disabled} />
      </>
    ),
    sliders: () => (
      <>
        <ColorSlider channel="red" colorSpace="rgb" locale={lang} value={color} onChange={fromSlider} disabled={disabled} />
        <ColorSlider channel="green" colorSpace="rgb" locale={lang} value={color} onChange={fromSlider} disabled={disabled} />
        <ColorSlider channel="blue" colorSpace="rgb" locale={lang} value={color} onChange={fromSlider} disabled={disabled} />
        <ColorField
          locale={lang}
          value={color}
          onChange={(_, c) => c && setColor(keepAlpha(c))}
          disabled={disabled}
        />
      </>
    ),
  };

  return (
    <div
      {...rest}
      ref={rootRef}
      role="group"
      aria-label={rest?.['aria-labelledby'] ? rest?.['aria-label'] : rest?.['aria-label'] ?? label}
      className={className}
      style={style}
      data-ds="color-picker"
      data-variant="inline"
      data-disabled={flag(disabled)}
    >
      <Tabs data-part="views" value={view} onValueChange={(v) => setView(v as ColorPickerView)} emphasis="soft" size="sm">
        <TabsList aria-label={words.views}>
          <TabsTrigger value="grid">{words.grid}</TabsTrigger>
          <TabsTrigger value="spectrum">{words.spectrum}</TabsTrigger>
          <TabsTrigger value="sliders">{words.sliders}</TabsTrigger>
        </TabsList>
        <TabsPanel value="grid">{body('grid')}</TabsPanel>
        <TabsPanel value="spectrum">{body('spectrum')}</TabsPanel>
        <TabsPanel value="sliders">{body('sliders')}</TabsPanel>
      </Tabs>
      {showOpacity && (
        <ColorSlider data-part="opacity" channel="alpha" locale={lang} value={color} onChange={fromSlider} disabled={disabled} />
      )}
      <div data-part="footer">
        <ColorSwatch data-part="preview" color={color} locale={lang} size="lg" aria-label={words.current} />
        <ColorSwatchPicker
          data-part="saved"
          layout="row"
          aria-label={words.saved}
          addLabel={words.save}
          locale={lang}
          colors={saved}
          value={savedValue}
          onChange={(_, c) => setColor(toColor(c))}
          onAdd={addSaved}
          disabled={disabled}
        />
        {eyedropper && (
          <IconButton
            data-part="eyedropper"
            icon={<EyedropperGlyph />}
            label={words.eyedropper}
            emphasis="ghost"
            shape="pill"
            size="lg"
            disabled={disabled}
            onClick={pickFromScreen}
          />
        )}
      </div>
    </div>
  );
}

export function ColorPicker({
  value,
  defaultValue = '#ffffff',
  onChange,
  variant = 'compact',
  view: viewProp,
  defaultView = 'grid',
  onViewChange,
  savedColors,
  defaultSavedColors = [],
  onSavedColorsChange,
  showOpacity = true,
  label,
  size = 'md',
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  locale,
  className,
  style,
  ref,
  ...rest
}: ColorPickerProps) {
  const theme = useTheme();
  const lang = locale ?? theme.lang;
  const words = colorPickerWords(lang);
  const title = label ?? words.title;

  const [inner, setInner] = useState<Color>(() => toColor(value ?? defaultValue));
  // A controlled value is read as hsb, but the Color kept inside wins while it
  // names the same colour, so a grey keeps the hue the spectrum was on.
  const color = value === undefined ? inner : hexOf(toColor(value)) === hexOf(inner) ? inner : toColor(value);
  const setColor = useCallback(
    (next: Color) => {
      setInner(next);
      onChange?.(hexOf(next), next);
    },
    [onChange],
  );
  const [view, setView] = useControllable<ColorPickerView>(viewProp, defaultView, onViewChange);
  const [saved, setSaved] = useControllable<readonly string[]>(savedColors, defaultSavedColors, onSavedColorsChange as ((c: readonly string[]) => void) | undefined);
  const addSaved = () => {
    const hex = hexOf(color);
    if (!saved.some((s) => s.toLowerCase() === hex)) setSaved([...saved, hex]);
  };
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);

  const panel = (extra?: Pick<PanelProps, 'rest' | 'className' | 'style' | 'rootRef'>) => (
    <Panel
      color={color}
      setColor={setColor}
      view={view}
      setView={setView}
      saved={saved}
      addSaved={addSaved}
      showOpacity={showOpacity}
      label={title}
      disabled={disabled}
      lang={lang}
      {...extra}
    />
  );

  if (variant === 'inline') return panel({ rest, className, style, rootRef: ref });

  const name = `${title}${lang.startsWith('ar') ? '، ' : ', '}${colorName(hexOf(color), lang)}`;
  const trigger = (
    <IconButton
      data-part="trigger"
      icon={<ColorSwatch color={color} locale={lang} shape="pill" size="sm" aria-hidden="true" />}
      label={name}
      emphasis="ghost"
      shape="pill"
      size={size}
      disabled={disabled}
      aria-haspopup="dialog"
    />
  );
  const sheet = theme.platform === 'ios' || theme.platform === 'android';

  return (
    <div {...rest} ref={ref} className={className} style={style} data-ds="color-picker" data-variant="compact" data-size={size} data-disabled={flag(disabled)}>
      {sheet ? (
        <Sheet open={open} onOpenChange={setOpen} size="md">
          <SheetTrigger>{trigger}</SheetTrigger>
          <SheetContent title={title}>
            <SheetBody>{panel()}</SheetBody>
          </SheetContent>
        </Sheet>
      ) : (
        <Popover open={open} onOpenChange={setOpen} size="lg">
          <PopoverTrigger>{trigger}</PopoverTrigger>
          <PopoverContent title={title} side="bottom" align="start" arrow={false}>
            <PopoverBody>{panel()}</PopoverBody>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
