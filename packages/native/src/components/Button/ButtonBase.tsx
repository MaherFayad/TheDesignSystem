// The internals Button and IconButton share on React Native: the variant
// axes, the inert states (disabled and loading), the press feedback and the
// accessibility props. Not exported from the package barrel: IconButton
// imports it from '../Button/ButtonBase'.
//
// Behavior: Pressable from react-native. No asChild: a native app has no link
// element to render as a button, so @rn-primitives/slot is not needed yet.
import { cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from 'react';
import {
  ActivityIndicator,
  I18nManager,
  Pressable,
  View,
  type GestureResponderEvent,
  type MouseEvent as RNMouseEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Icon, type IconProps } from '@the-system/icons/native';
import { isIconName, isMirrored, type IconName } from '@the-system/icons';
import { useTheme } from '../../theme/hooks';
import { recipeFor } from '../../theme/recipes';
import {
  createButtonStyles,
  type ButtonEmphasis,
  type ButtonPart,
  type ButtonShape,
  type ButtonSize,
  type ButtonStyles,
  type ButtonTone,
  type ButtonVariants,
} from './Button.styles';

/** Leading or trailing content: a system icon name, or a node. */
export type ButtonSlotContent = IconName | ReactElement;

/** The props Button and IconButton share. Same names and values as React. */
export interface ButtonBaseProps
  extends Omit<PressableProps, 'children' | 'style' | 'disabled' | 'hitSlop' | 'accessibilityRole' | 'accessibilityState'> {
  /** Height from the size.control tokens: xs 24, sm 28, md 32, lg 44 (default density). Default md. */
  size?: ButtonSize;
  /** The color family. accent is the primary action color of the active style. Default neutral. */
  tone?: ButtonTone;
  /** How loud the button is. tone accent with emphasis solid is the primary action. */
  emphasis?: ButtonEmphasis;
  /** default takes the style's control radius, pill is fully round, square has small corners. Default default. */
  shape?: ButtonShape;
  /** An action is in flight: shows the spinner, keeps the width, sets accessibilityState.busy and blocks presses. */
  loading?: boolean;
  /** What a screen reader hears while loading, as the accessibility value. Default "Loading". */
  loadingLabel?: string;
  /** Blocks presses. The button keeps its place and reads as dimmed. */
  disabled?: boolean;
  /** Styles for the root, after the system styles. */
  style?: StyleProp<ViewStyle>;
}

export interface ButtonPressState {
  hovered: boolean;
  pressed: boolean;
}

interface ButtonRootProps extends ButtonBaseProps {
  kind: 'button' | 'icon-button';
  defaultEmphasis: ButtonEmphasis;
  fullWidth?: boolean;
  wrap?: boolean;
  /** Builds the parts inside the root for the current styles and state. */
  render: (s: ButtonStyles, state: ButtonPressState, inert: boolean) => ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** The variants and styles of a button under the active theme. */
export function useButtonStyles(v: Omit<ButtonVariants, 'arabic' | 'platform' | 'dir'>): ButtonStyles {
  const { axes, theme } = useTheme();
  const variants: ButtonVariants = { ...v, arabic: axes.lang === 'ar' || axes.lang.startsWith('ar-'), platform: axes.platform, dir: axes.dir };
  return createButtonStyles(theme, variants, recipeFor<ButtonPart, ButtonVariants>(axes.style, 'Button'));
}

/**
 * The root of Button and IconButton: a Pressable with the role, the state and
 * the press feedback. While disabled or loading, onPress, onLongPress,
 * onPressIn and onPressOut do not run.
 */
export function ButtonRoot({
  kind,
  defaultEmphasis,
  render,
  size = 'md',
  tone = 'neutral',
  emphasis,
  shape = 'default',
  fullWidth = false,
  wrap = false,
  loading = false,
  loadingLabel = 'Loading',
  disabled = false,
  style,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  accessibilityValue,
  ...rest
}: ButtonRootProps) {
  const { theme, reduceMotion } = useTheme();
  const s = useButtonStyles({ kind, size, tone, emphasis: emphasis ?? defaultEmphasis, shape, fullWidth, wrap });
  const inert = disabled || loading;
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const spring = theme.spring.press;

  const press = (to: number) => {
    if (reduceMotion) return;
    scale.value = withSpring(to, { stiffness: spring.stiffness, damping: spring.damping, mass: spring.mass });
  };

  const guard =
    <E,>(fn: ((e: E) => void) | null | undefined) =>
    (e: E) => {
      if (!inert) fn?.(e);
    };

  const state: ButtonPressState = { hovered: hovered && !inert, pressed: pressed && !inert };

  return (
    <AnimatedPressable
      {...rest}
      testID={kind === 'button' ? 'ds-button' : 'ds-icon-button'}
      accessibilityRole="button"
      accessibilityState={{ disabled: inert, busy: loading }}
      accessibilityValue={loading ? { text: loadingLabel } : accessibilityValue}
      hitSlop={s.hitSlop}
      onPress={guard<GestureResponderEvent>(onPress)}
      onLongPress={guard<GestureResponderEvent>(onLongPress)}
      onPressIn={(e: GestureResponderEvent) => {
        if (inert) return;
        setPressed(true);
        press(theme.scale.press);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        setPressed(false);
        press(1);
        if (!inert) onPressOut?.(e);
      }}
      onHoverIn={(e: RNMouseEvent) => {
        setHovered(true);
        onHoverIn?.(e);
      }}
      onHoverOut={(e: RNMouseEvent) => {
        setHovered(false);
        onHoverOut?.(e);
      }}
      style={[
        s.styles.root,
        state.hovered && s.styles.rootHover,
        state.pressed && s.styles.rootPressed,
        disabled && s.styles.rootDisabled,
        reduceMotion ? null : animated,
        style,
      ]}
    >
      {render(s, state, inert)}
      {loading && (
        <View testID={`ds-${kind}-spinner`} style={s.styles.spinner} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <ActivityIndicator size={s.spinnerSize} color={s.colors.fg} animating={!reduceMotion} hidesWhenStopped={false} />
        </View>
      )}
    </AnimatedPressable>
  );
}

/** The text color for the current state. */
export function colorOf(s: ButtonStyles, state: ButtonPressState): string {
  if (state.pressed) return s.colors.fgActive;
  if (state.hovered) return s.colors.fgHover;
  return s.colors.fg;
}

/**
 * Renders leading or trailing content: a name becomes a 16px system Icon in
 * the label color, a node is used as is. A directional icon mirrors when the
 * theme direction is rtl, whatever I18nManager says, so the web export and a
 * device that has not restarted yet both draw it the right way.
 */
export function renderSlotContent(content: ButtonSlotContent, s: ButtonStyles, color: string, dir: 'ltr' | 'rtl'): ReactNode {
  if (typeof content === 'string' && isIconName(content)) {
    const flip = isMirrored(content) && (dir === 'rtl') !== I18nManager.isRTL;
    const props: IconProps = { name: content, size: s.iconSize, color, ...(flip ? { style: dir === 'rtl' ? s.styles.mirror : s.styles.unmirror } : {}) };
    return <Icon {...props} />;
  }
  return isValidElement(content) ? cloneElement(content) : null;
}
