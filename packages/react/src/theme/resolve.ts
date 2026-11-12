// Theme resolution lives in packages/shared (theme.ts), shared with Angular
// and React Native. This file keeps the React import path. Pure: no React,
// no window. Safe in a server component, for example to stamp <html> in a
// Next layout:
//
//   <html {...themeAttributes({ style: 'desk', lang: 'ar' })}>
export { DEFAULT_STYLE, attributesOf, getStyleData, resolveTheme, styleIds, themeAttributes } from '@the-system/shared';
