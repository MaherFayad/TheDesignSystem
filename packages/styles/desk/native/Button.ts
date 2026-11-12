// Desk recipe for the React Native Button and IconButton: the native side of
// recipes/Button.css. Desk controls are pills, so the default shape takes
// radius.pill. The other shapes keep their base radius.
//
// The web recipe also rolls the label on hover and keyboard focus. That is a
// pointer effect with no touch equivalent, so the native recipe has no roll.
import type { ButtonRecipe } from '@the-system/native';

const recipe: ButtonRecipe = (_base, theme, variants) =>
  variants.shape === 'default' ? { root: { borderRadius: theme.radius.pill } } : {};

export default recipe;
