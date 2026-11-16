# Compare fk2-menu-studio: Studio dropdown menu against the Figma-Killer-2 context menu

Run 2026-11-16T11:27:43.264Z. Viewport 1440 by 900, dark scheme.
Audit: docs/reports/audit/fidelity-figma-killer-2.md, fid-fk2 shot 14, context menu. FK2 menus are borderless surface-3 tiles with a 16px radius, 12px row radius, 560 weight rows and a 0 12px 28px shadow; Studio menus are square tiles with a bright 1px rule and no shadow.

- Source (fk2, a reconstruction from source parts): `/?screen=context-menu`. In FK2 a right click on a layer or a row action opens ContextMenu (src/ui/components/ContextMenu). The harness renders that component with FK2's globals.css, opened at a point, with five rows and a separator.
- System: `/c/dropdown-menu?style=studio&scheme=dark&dir=ltr&lang=en&case=variants&chrome=0`
- Figma-Killer-2 at commit 51b1994: a reconstruction from FK2's own src/ui components and src/styles/globals.css, rendered by Vite from <scratch>/fk2; FK2 icons are empty boxes of the same size
- System: the React gallery (apps/gallery-react, vite dev) from this checkout
- Source fonts loaded: Inter Variable
- System: data-style studio, data-platform web, data-glass regular
- System fonts loaded: IBM Plex Sans Arabic, Inter Variable

Result: 3 pass, 9 fail, 0 allowed.

| Region | Probe | Property | Source | System | Difference | Tolerance | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| menu | border-radius | border-radius | 16px | 0px | -16px | equal | fail |
| menu | border-width | border-width | 0px | 1px | +1px | equal | fail |
| menu | background-color | background-color | rgb(50, 50, 50) | rgb(17, 17, 17) | Delta E 10.13 | Delta E 2 | fail |
| menu | box-shadow | box-shadow | rgba(0, 0, 0, 0.5) 0px 12px 28px 0px | none | 1 against 0 layers | 1px, Delta E 2 | fail |
| menu | padding | padding | 3.997px | 0px | -4px | 1px | fail |
| menu | animation-duration | animation-duration | 0.13s | 0.07s | -60ms | 10ms or 10 percent | fail |
| menu | animation-timing-function | animation-timing-function | cubic-bezier(0.16, 1, 0.3, 1) | steps(2) | not comparable | each point 0.02 | fail |
| menu | row height | height | 28px | 28px | 0px | 1px | pass |
| menu | row radius | border-radius | 12px | 0px | -12px | equal | fail |
| menu | row text size | font-size | 11.997px | 11.9956px | 0px | equal | pass |
| menu | row weight | font-weight | 560 | 400 | -160 | equal | fail |
| menu | row text colour | color | rgb(237, 237, 237) | rgb(237, 237, 237) | Delta E 0 | Delta E 2 | pass |
