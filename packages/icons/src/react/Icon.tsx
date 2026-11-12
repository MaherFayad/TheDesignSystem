'use client';
import { createElement, use, type Ref, type SVGProps } from 'react';
import { isMirrored, type IconName } from '../names';
import { camelAttrs, parseBody, resolveIcon } from '../svg';
import { iconSizes, resolveIconSize, type IconSize } from '../types';
import { IconSetContext } from './IconSetContext';

export interface IconProps
  extends Omit<SVGProps<SVGSVGElement>, 'name' | 'children' | 'viewBox' | 'width' | 'height' | 'ref'> {
  name: IconName;
  /** sm 12, md 16, lg 24, from the size.icon tokens. Numbers are accepted too. Default md. */
  size?: IconSize;
  /** An icon set id. Overrides the set from IconSetContext. */
  set?: string;
  /** Gives the icon role img and this accessible name. Without it the icon is hidden from assistive tech. */
  label?: string;
  ref?: Ref<SVGSVGElement>;
}

/**
 * One system icon as an inline svg. Color comes from currentColor, size from
 * the size.icon tokens. Names in the mirror list flip in right to left
 * layouts through CSS.
 */
export function Icon({ name, size, set, label, ...rest }: IconProps) {
  const active = use(IconSetContext);
  const { set: data, data: glyph } = resolveIcon(name, set !== undefined ? { set } : active);
  const sizeName = resolveIconSize(size);
  const px = iconSizes[sizeName];
  const a11y =
    label !== undefined ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...camelAttrs(data.attrs)}
      focusable="false"
      {...a11y}
      {...rest}
      width={px}
      height={px}
      viewBox={glyph.viewBox}
      data-ds="icon"
      data-icon={name}
      data-size={sizeName}
      data-set={data.id}
      data-mirror={isMirrored(name) ? '' : undefined}
    >
      {parseBody(glyph.body).map(([tag, attrs], i) => createElement(tag, { key: i, ...camelAttrs(attrs) }))}
    </svg>
  );
}
