// The icon package without a framework: names, sizes, the mirror list, the
// generated set data and the pure helpers the framework components share.
export { iconNames, isIconName, isMirrored, mirrorIcons, type IconName } from './names';
export {
  iconSizes,
  resolveIconSize,
  type IconData,
  type IconSetData,
  type IconSize,
  type IconSizeName,
  type IconStyle,
} from './types';
export { iconSetIds, iconSets, type IconSetId } from './generated/sets.gen';
export {
  camelAttrs,
  defaultIconStyle,
  iconToSvg,
  isIconSetId,
  parseBody,
  resolveIcon,
  type IconNode,
} from './svg';
