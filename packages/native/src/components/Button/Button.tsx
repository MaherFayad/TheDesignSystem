// Button for React Native: the same component, props and values as the React
// Button (packages/react/src/components/Button), on the theme objects of the
// token build. The look is a port of Button.css in Button.styles.ts.
//
// Parts, by testID: ds-button (root), ds-button-start, ds-button-label,
// ds-button-end, ds-button-spinner.
//
// Not carried over from the web: asChild (no link element on native), the
// focus ring (the platform draws keyboard focus), and the Desk roll label (a
// hover effect with no touch equivalent).
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../theme/hooks';
import { ButtonRoot, colorOf, renderSlotContent, type ButtonBaseProps, type ButtonSlotContent } from './ButtonBase';

export interface ButtonProps extends ButtonBaseProps {
  /** The label. English: a verb plus a noun. Arabic: a noun form. Text, or nodes that render inside Text. */
  children?: ReactNode;
  /** Default soft: the source's standard button in every style. */
  emphasis?: ButtonBaseProps['emphasis'];
  /** Leading content before the label (the start side, so it sits on the right in Arabic): an icon name or a node. */
  start?: ButtonSlotContent;
  /** Trailing content after the label: an icon name or a node. */
  end?: ButtonSlotContent;
  /** Fills the width of its container. Default false. */
  fullWidth?: boolean;
  /**
   * Lets a long label wrap onto more lines; the button grows in height.
   * Default false: one line that ends in an ellipsis when the button is squeezed.
   */
  wrap?: boolean;
}

/**
 * An action button. The primary action is `tone="accent" emphasis="solid"`:
 * yellow with dark text in Desk, the neutral fill in Studio, both from the
 * color.primary tokens. The button grows with the system font size: its
 * height is a minimum, never fixed.
 */
export function Button({ start, end, fullWidth = false, wrap = false, loading = false, children, ...rest }: ButtonProps) {
  const { axes } = useTheme();
  return (
    <ButtonRoot
      {...rest}
      kind="button"
      defaultEmphasis="soft"
      loading={loading}
      fullWidth={fullWidth}
      wrap={wrap}
      render={(s, state) => {
        const color = colorOf(s, state);
        return (
          <>
            {start !== undefined && (
              <View testID="ds-button-start" style={[s.styles.slot, loading && s.styles.hidden]}>
                {renderSlotContent(start, s, color, axes.dir)}
              </View>
            )}
            <Text
              testID="ds-button-label"
              numberOfLines={wrap ? undefined : 1}
              ellipsizeMode="tail"
              style={[s.styles.label, state.hovered && s.styles.labelHover, state.pressed && s.styles.labelPressed, loading && s.styles.hidden]}
            >
              {children}
            </Text>
            {end !== undefined && (
              <View testID="ds-button-end" style={[s.styles.slot, loading && s.styles.hidden]}>
                {renderSlotContent(end, s, color, axes.dir)}
              </View>
            )}
          </>
        );
      }}
    />
  );
}
