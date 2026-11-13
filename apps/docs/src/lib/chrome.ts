// What the docs chrome needs to take the chosen style: the icon set of each
// style pack, and a few rules generated from the packs at build time. A new
// folder in packages/styles/ with a style.json and an icons.ts appears in the
// style menu, draws its own icons and, when it uses glass, gets glass bars,
// with no change here.
import { iconToSvg, isMirrored, type IconName, type IconStyle } from '@the-system/icons';
import { styles } from './site.ts';

const iconModules = import.meta.glob<{ default: IconStyle }>('../../../../packages/styles/*/icons.ts', { eager: true });

function iconStyleOf(id: string): IconStyle {
  const hit = Object.entries(iconModules).find(([path]) => path.endsWith(`/styles/${id}/icons.ts`));
  if (hit) return hit[1].default;
  const pack = styles.find((s) => s.id === id);
  return { set: pack?.iconSet ?? 'line' };
}

/** Styles grouped by identical icon settings: one SVG per group is enough. */
export const iconGroups: { key: string; icons: IconStyle; styles: string[] }[] = [];
for (const s of styles) {
  const icons = iconStyleOf(s.id);
  const key = JSON.stringify(icons);
  const group = iconGroups.find((g) => g.key === key);
  if (group) group.styles.push(s.id);
  else iconGroups.push({ key, icons, styles: [s.id] });
}

/** The markup of one system icon in every icon group; CSS shows the group of the current style. */
export function iconMarkup(name: IconName, size = 16): string {
  const mirror = isMirrored(name) ? ' data-mirror=""' : '';
  return iconGroups
    .map((g, i) =>
      iconToSvg(name, g.icons, size).replace(
        '<svg ',
        `<svg class="ic" data-ic="${i}"${mirror} aria-hidden="true" focusable="false" `,
      ),
    )
    .join('');
}

const list = (ids: string[]) => ids.map((id) => `[data-style='${id}']`).join(',');

/**
 * Rules generated from the packs. Icons: every group is hidden except the one
 * of the current style. Glass: a pack with usesGlass draws the page as its
 * desk (the body color, Desk's grain comes with it) under glass bars; every
 * other pack draws the page on the surface color with solid bars.
 */
export const chromeCss = [
  '.ic{display:none}',
  ...iconGroups.map((g, i) => `:root:is(${list(g.styles)}) .ic[data-ic='${i}']{display:block}`),
  `:root:is(${list(styles.filter((s) => s.usesGlass).map((s) => s.id)) || "[data-style='none']"}){--doc-page:var(--ds-color-bg-body);--doc-float:var(--ds-space-l);--doc-float-radius:var(--ds-radius-window);--doc-float-shadow:var(--ds-elevation-glass)}`,
].join('\n');

/** The style ids, for the script that applies the saved style before the first paint. */
export const styleIds = styles.map((s) => s.id);
