// IconButton for React Native: a Button with an icon and no visible label,
// built on the same internals (ButtonBase), so the axes, the inert states and
// the press feedback behave the same. The look is Button.styles.ts with
// kind icon-button: a square of the control height, no padding.
//
// Parts, by testID: ds-icon-button (root), ds-icon-button-icon,
// ds-icon-button-spinner.
import { View } from 'react-native';
import { useTheme } from '../../theme/hooks';
import { ButtonRoot, colorOf, renderSlotContent, type ButtonBaseProps, type ButtonSlotContent } from '../Button/ButtonBase';
import type { ButtonEmphasis } from '../Button/Button.styles';

/** No link emphasis: an icon only link reads as neither a link nor a button. */
export type IconButtonEmphasis = Exclude<ButtonEmphasis, 'link'>;

export interface IconButtonProps extends Omit<ButtonBaseProps, 'emphasis' | 'accessibilityLabel'> {
  /** The icon: a system icon name or a node. It is hidden from assistive tech. */
  icon: ButtonSlotContent;
  /** The accessible name, set as accessibilityLabel. Required. English: a verb plus a noun ("Close panel"). */
  label: string;
  /** Default ghost: icon buttons sit in toolbars and headers. */
  emphasis?: IconButtonEmphasis;
}

/** A square icon only button. Its touch area reaches 44 (iOS) or 48 (Android) at every size. */
export function IconButton({ icon, label, ...rest }: IconButtonProps) {
  const { axes } = useTheme();
  return (
    <ButtonRoot
      {...rest}
      kind="icon-button"
      defaultEmphasis="ghost"
      accessibilityLabel={label}
      render={(s, state) => (
        <View testID="ds-icon-button-icon" style={[s.styles.slot, rest.loading && s.styles.hidden]}>
          {renderSlotContent(icon, s, colorOf(s, state), axes.dir)}
        </View>
      )}
    />
  );
}
