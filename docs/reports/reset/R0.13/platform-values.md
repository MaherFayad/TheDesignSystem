# R0.13 platform values

Every value in `packages/tokens/src/platform/<id>.json`, with where it comes
from. Line numbers point into `docs/reports/audit/`. "Fetched" means the
vendor page was read on 2026-11-16 for this order; its URL is in the
token's `$description`. Type cells read size/line height, weight and
letter spacing in px. Elevation cells give the native elevation number;
the CSS shadow geometry is in the `$description`. Generated from the token
files; do not edit by hand.

## Control heights and targets

| Name | web | ios | android | macos | Source web | Source ios | Source android | Source macos |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `size.control.xs` | 24px | 28px | 32px | 20px | base/size.json before R0.13, unchanged | liquid-guidelines.md:222; HIG accessibility (fetched) | material-guidelines.md:259 | liquid-guidelines.md:222; HIG accessibility (fetched) |
| `size.control.sm` | 28px | 34px | 36px | 22px | base/size.json before R0.13, unchanged | unverified, from memory | unverified, from memory (one density step under 40) | liquid-guidelines.md:733 |
| `size.control.md` | 32px | 44px | 40px | 28px | base/size.json before R0.13, unchanged | liquid-guidelines.md:221; HIG accessibility (fetched) | material-guidelines.md:259; native.md:110 (defect 10) | liquid-guidelines.md:221; HIG accessibility (fetched) |
| `size.control.lg` | 44px | 50px | 56px | 32px | base/size.json before R0.13, unchanged | unverified, from memory | material-guidelines.md:259, 271 | unverified, from memory |
| `size.target-min` | 24px | 44px | 48px | 24px | WCAG 2.2 SC 2.5.8; base/size.json before R0.13 | HIG buttons, 44x44 pt hit region (fetched) | material-guidelines.md:249 | WCAG 2.2 SC 2.5.8 (above the HIG minimum 20) |
| `size.touch.ios` | 44px | 44px | 44px | 44px | base/size.json before R0.13, unchanged | liquid-guidelines.md:221; HIG accessibility (fetched) | liquid-guidelines.md:221; HIG accessibility (fetched) | liquid-guidelines.md:221; HIG accessibility (fetched) |
| `size.touch.android` | 48px | 48px | 48px | 48px | base/size.json before R0.13, unchanged | material-guidelines.md:249 | material-guidelines.md:249 | material-guidelines.md:249 |

## Corner scale

| Name | web | ios | android | macos | Source web | Source ios | Source android | Source macos |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `shape.corner.none` | 0px | 0px | 0px | 0px | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 |
| `shape.corner.extra-small` | 4px | 4px | 4px | 4px | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 |
| `shape.corner.small` | 8px | 8px | 8px | 8px | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 |
| `shape.corner.medium` | 12px | 12px | 12px | 12px | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 |
| `shape.corner.large` | 16px | 16px | 16px | 16px | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 |
| `shape.corner.large-increased` | 20px | 20px | 20px | 20px | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 |
| `shape.corner.extra-large` | 28px | 28px | 28px | 28px | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 |
| `shape.corner.extra-large-increased` | 32px | 32px | 32px | 32px | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 |
| `shape.corner.extra-extra-large` | 48px | 48px | 48px | 48px | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 |
| `shape.corner.full` | 999px | 999px | 999px | 999px | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 | material-guidelines.md:206 | no vendor scale; shared steps of material-guidelines.md:206 |

## State opacities

| Name | web | ios | android | macos | Source web | Source ios | Source android | Source macos |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `opacity.state.hover` | 0.08 | 0.08 | 0.08 | 0.08 | material-guidelines.md:226 | no vendor values; shared values of material-guidelines.md:226 | material-guidelines.md:226 | no vendor values; shared values of material-guidelines.md:226 |
| `opacity.state.focus` | 0.1 | 0.1 | 0.1 | 0.1 | material-guidelines.md:226 | no vendor values; shared values of material-guidelines.md:226 | material-guidelines.md:226 | no vendor values; shared values of material-guidelines.md:226 |
| `opacity.state.pressed` | 0.1 | 0.1 | 0.1 | 0.1 | material-guidelines.md:226 | no vendor values; shared values of material-guidelines.md:226 | material-guidelines.md:226 | no vendor values; shared values of material-guidelines.md:226 |
| `opacity.state.dragged` | 0.16 | 0.16 | 0.16 | 0.16 | material-guidelines.md:226 | no vendor values; shared values of material-guidelines.md:226 | material-guidelines.md:226 | no vendor values; shared values of material-guidelines.md:226 |
| `opacity.state.disabled-container` | 0.12 | 0.12 | 0.12 | 0.12 | material-guidelines.md:226 | no vendor values; shared values of material-guidelines.md:226 | material-guidelines.md:226 | no vendor values; shared values of material-guidelines.md:226 |

## Elevation levels

| Name | web | ios | android | macos | Source web | Source ios | Source android | Source macos |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `elevation.level0` | 0dp | 0dp | 0dp | 0dp | material-guidelines.md:242; Material Web elevation source (fetched) | no vendor levels; shared geometry of Material Web elevation source (fetched) | material-guidelines.md:242; Material Web elevation source (fetched) | no vendor levels; shared geometry of Material Web elevation source (fetched) |
| `elevation.level1` | 1dp | 1dp | 1dp | 1dp | material-guidelines.md:242; Material Web elevation source (fetched) | no vendor levels; shared geometry of Material Web elevation source (fetched) | material-guidelines.md:242; Material Web elevation source (fetched) | no vendor levels; shared geometry of Material Web elevation source (fetched) |
| `elevation.level2` | 3dp | 3dp | 3dp | 3dp | material-guidelines.md:242; Material Web elevation source (fetched) | no vendor levels; shared geometry of Material Web elevation source (fetched) | material-guidelines.md:242; Material Web elevation source (fetched) | no vendor levels; shared geometry of Material Web elevation source (fetched) |
| `elevation.level3` | 6dp | 6dp | 6dp | 6dp | material-guidelines.md:242; Material Web elevation source (fetched) | no vendor levels; shared geometry of Material Web elevation source (fetched) | material-guidelines.md:242; Material Web elevation source (fetched) | no vendor levels; shared geometry of Material Web elevation source (fetched) |
| `elevation.level4` | 8dp | 8dp | 8dp | 8dp | material-guidelines.md:242; Material Web elevation source (fetched) | no vendor levels; shared geometry of Material Web elevation source (fetched) | material-guidelines.md:242; Material Web elevation source (fetched) | no vendor levels; shared geometry of Material Web elevation source (fetched) |
| `elevation.level5` | 12dp | 12dp | 12dp | 12dp | material-guidelines.md:242; Material Web elevation source (fetched) | no vendor levels; shared geometry of Material Web elevation source (fetched) | material-guidelines.md:242; Material Web elevation source (fetched) | no vendor levels; shared geometry of Material Web elevation source (fetched) |

## Springs (stiffness, damping coefficient, mass)

| Name | web | ios | android | macos | Source web | Source ios | Source android | Source macos |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `spring.spatial.fast.stiffness` | 1400 | 1754.6 | 1400 | 1754.6 | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): interactiveSpring() defaults | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): interactiveSpring() defaults |
| `spring.spatial.fast.damping` | 67.35 | 72.05 | 67.35 | 72.05 | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): interactiveSpring() defaults | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): interactiveSpring() defaults |
| `spring.spatial.fast.mass` | 1 | 1 | 1 | 1 | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): interactiveSpring() defaults | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): interactiveSpring() defaults |
| `spring.spatial.default.stiffness` | 700 | 157.91 | 700 | 157.91 | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): spring() defaults | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): spring() defaults |
| `spring.spatial.default.damping` | 47.62 | 20.73 | 47.62 | 20.73 | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): spring() defaults | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): spring() defaults |
| `spring.spatial.default.mass` | 1 | 1 | 1 | 1 | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): spring() defaults | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): spring() defaults |
| `spring.spatial.slow.stiffness` | 300 | 70.18 | 300 | 70.18 | material-guidelines.md:300 to 303, standard scheme | derived from the SwiftUI values, no vendor value | material-guidelines.md:300 to 303, standard scheme | derived from the SwiftUI values, no vendor value |
| `spring.spatial.slow.damping` | 31.18 | 13.82 | 31.18 | 13.82 | material-guidelines.md:300 to 303, standard scheme | derived from the SwiftUI values, no vendor value | material-guidelines.md:300 to 303, standard scheme | derived from the SwiftUI values, no vendor value |
| `spring.spatial.slow.mass` | 1 | 1 | 1 | 1 | material-guidelines.md:300 to 303, standard scheme | derived from the SwiftUI values, no vendor value | material-guidelines.md:300 to 303, standard scheme | derived from the SwiftUI values, no vendor value |
| `spring.effects.fast.stiffness` | 3800 | 1754.6 | 3800 | 1754.6 | material-guidelines.md:300 to 303, standard scheme | derived from the SwiftUI values, no vendor value | material-guidelines.md:300 to 303, standard scheme | derived from the SwiftUI values, no vendor value |
| `spring.effects.fast.damping` | 123.29 | 83.78 | 123.29 | 83.78 | material-guidelines.md:300 to 303, standard scheme | derived from the SwiftUI values, no vendor value | material-guidelines.md:300 to 303, standard scheme | derived from the SwiftUI values, no vendor value |
| `spring.effects.fast.mass` | 1 | 1 | 1 | 1 | material-guidelines.md:300 to 303, standard scheme | derived from the SwiftUI values, no vendor value | material-guidelines.md:300 to 303, standard scheme | derived from the SwiftUI values, no vendor value |
| `spring.effects.default.stiffness` | 1600 | 157.91 | 1600 | 157.91 | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): smooth(duration:extraBounce:) defaults | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): smooth(duration:extraBounce:) defaults |
| `spring.effects.default.damping` | 80 | 25.13 | 80 | 25.13 | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): smooth(duration:extraBounce:) defaults | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): smooth(duration:extraBounce:) defaults |
| `spring.effects.default.mass` | 1 | 1 | 1 | 1 | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): smooth(duration:extraBounce:) defaults | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): smooth(duration:extraBounce:) defaults |
| `spring.effects.slow.stiffness` | 800 | 130.51 | 800 | 130.51 | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): Animation.default | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): Animation.default |
| `spring.effects.slow.damping` | 56.57 | 22.85 | 56.57 | 22.85 | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): Animation.default | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): Animation.default |
| `spring.effects.slow.mass` | 1 | 1 | 1 | 1 | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): Animation.default | material-guidelines.md:300 to 303, standard scheme | SwiftUI docs (fetched): Animation.default |

## Insets

| Name | web | ios | android | macos | Source web | Source ios | Source android | Source macos |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `inset.safe.top` | 0px | 0px | 0px | 0px | docs/contracts/tokens.md, Platform names (env()) | docs/contracts/tokens.md, Platform names (env()) | docs/contracts/tokens.md, Platform names (env()) | docs/contracts/tokens.md, Platform names (env()) |
| `inset.safe.bottom` | 0px | 0px | 0px | 0px | docs/contracts/tokens.md, Platform names (env()) | docs/contracts/tokens.md, Platform names (env()) | docs/contracts/tokens.md, Platform names (env()) | docs/contracts/tokens.md, Platform names (env()) |
| `inset.safe.start` | 0px | 0px | 0px | 0px | docs/contracts/tokens.md, Platform names (env()) | docs/contracts/tokens.md, Platform names (env()) | docs/contracts/tokens.md, Platform names (env()) | docs/contracts/tokens.md, Platform names (env()) |
| `inset.safe.end` | 0px | 0px | 0px | 0px | docs/contracts/tokens.md, Platform names (env()) | docs/contracts/tokens.md, Platform names (env()) | docs/contracts/tokens.md, Platform names (env()) | docs/contracts/tokens.md, Platform names (env()) |
| `inset.keyboard` | 0px | 0px | 0px | 0px | docs/contracts/tokens.md, Platform names (env()) | docs/contracts/tokens.md, Platform names (env()) | docs/contracts/tokens.md, Platform names (env()) | docs/contracts/tokens.md, Platform names (env()) |

## Type ramp

| Name | web | ios | android | macos | Source web | Source ios | Source android | Source macos |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `type.display-large` | 57/64 w400 ls -0.25 | 34/41 w400 ls 0 | 57/64 w400 ls -0.25 | 26/32 w400 ls 0 | material-guidelines.md:189 to 194 (the web takes the Material baseline) | liquid-guidelines.md:227; HIG typography tables (fetched) | material-guidelines.md:189 to 194 | liquid-guidelines.md:227; HIG typography tables (fetched) |
| `type.display-medium` | 45/52 w400 ls 0 | 28/34 w400 ls 0 | 45/52 w400 ls 0 | 22/26 w400 ls 0 | material-guidelines.md:189 to 194 (the web takes the Material baseline) | liquid-guidelines.md:227; HIG typography tables (fetched) | material-guidelines.md:189 to 194 | liquid-guidelines.md:227; HIG typography tables (fetched) |
| `type.display-small` | 36/44 w400 ls 0 | 22/28 w400 ls 0 | 36/44 w400 ls 0 | 17/22 w400 ls 0 | material-guidelines.md:189 to 194 (the web takes the Material baseline) | liquid-guidelines.md:227; HIG typography tables (fetched) | material-guidelines.md:189 to 194 | liquid-guidelines.md:227; HIG typography tables (fetched) |
| `type.headline-large` | 32/40 w400 ls 0 | 28/34 w400 ls 0 | 32/40 w400 ls 0 | 22/26 w400 ls 0 | material-guidelines.md:189 to 194 (the web takes the Material baseline) | liquid-guidelines.md:227; HIG typography tables (fetched) | material-guidelines.md:189 to 194 | liquid-guidelines.md:227; HIG typography tables (fetched) |
| `type.headline-medium` | 28/36 w400 ls 0 | 22/28 w400 ls 0 | 28/36 w400 ls 0 | 17/22 w400 ls 0 | material-guidelines.md:189 to 194 (the web takes the Material baseline) | liquid-guidelines.md:227; HIG typography tables (fetched) | material-guidelines.md:189 to 194 | liquid-guidelines.md:227; HIG typography tables (fetched) |
| `type.headline-small` | 24/32 w400 ls 0 | 20/25 w400 ls 0 | 24/32 w400 ls 0 | 15/20 w400 ls 0 | material-guidelines.md:189 to 194 (the web takes the Material baseline) | liquid-guidelines.md:227; HIG typography tables (fetched) | material-guidelines.md:189 to 194 | liquid-guidelines.md:227; HIG typography tables (fetched) |
| `type.title-large` | 22/28 w400 ls 0 | 17/22 w600 ls 0 | 22/28 w400 ls 0 | 13/16 w700 ls 0 | material-guidelines.md:189 to 194 (the web takes the Material baseline) | liquid-guidelines.md:227; HIG typography tables (fetched) | material-guidelines.md:189 to 194 | liquid-guidelines.md:227; HIG typography tables (fetched) |
| `type.title-medium` | 16/24 w500 ls 0.15 | 16/21 w600 ls 0 | 16/24 w500 ls 0.15 | 13/16 w600 ls 0 | material-guidelines.md:189 to 194 (the web takes the Material baseline) | liquid-guidelines.md:227; HIG typography tables (fetched) | material-guidelines.md:189 to 194 | liquid-guidelines.md:227; HIG typography tables (fetched) |
| `type.title-small` | 14/20 w500 ls 0.1 | 15/20 w600 ls 0 | 14/20 w500 ls 0.1 | 12/15 w600 ls 0 | material-guidelines.md:189 to 194 (the web takes the Material baseline) | liquid-guidelines.md:227; HIG typography tables (fetched) | material-guidelines.md:189 to 194 | liquid-guidelines.md:227; HIG typography tables (fetched) |
| `type.body-large` | 16/24 w400 ls 0.5 | 17/22 w400 ls 0 | 16/24 w400 ls 0.5 | 13/16 w400 ls 0 | material-guidelines.md:189 to 194 (the web takes the Material baseline) | liquid-guidelines.md:227; HIG typography tables (fetched) | material-guidelines.md:189 to 194 | liquid-guidelines.md:227; HIG typography tables (fetched) |
| `type.body-medium` | 14/20 w400 ls 0.25 | 15/20 w400 ls 0 | 14/20 w400 ls 0.25 | 12/15 w400 ls 0 | material-guidelines.md:189 to 194 (the web takes the Material baseline) | liquid-guidelines.md:227; HIG typography tables (fetched) | material-guidelines.md:189 to 194 | liquid-guidelines.md:227; HIG typography tables (fetched) |
| `type.body-small` | 12/16 w400 ls 0.4 | 13/18 w400 ls 0 | 12/16 w400 ls 0.4 | 11/14 w400 ls 0 | material-guidelines.md:189 to 194 (the web takes the Material baseline) | liquid-guidelines.md:227; HIG typography tables (fetched) | material-guidelines.md:189 to 194 | liquid-guidelines.md:227; HIG typography tables (fetched) |
| `type.label-large` | 14/20 w500 ls 0.1 | 17/22 w400 ls 0 | 14/20 w500 ls 0.1 | 13/16 w400 ls 0 | material-guidelines.md:189 to 194 (the web takes the Material baseline) | liquid-guidelines.md:227; HIG typography tables (fetched) | material-guidelines.md:189 to 194 | liquid-guidelines.md:227; HIG typography tables (fetched) |
| `type.label-medium` | 12/16 w500 ls 0.5 | 12/16 w400 ls 0 | 12/16 w500 ls 0.5 | 11/14 w400 ls 0 | material-guidelines.md:189 to 194 (the web takes the Material baseline) | liquid-guidelines.md:227; HIG typography tables (fetched) | material-guidelines.md:189 to 194 | liquid-guidelines.md:227; HIG typography tables (fetched) |
| `type.label-small` | 11/16 w500 ls 0.5 | 11/13 w400 ls 0 | 11/16 w500 ls 0.5 | 10/13 w400 ls 0 | material-guidelines.md:189 to 194 (the web takes the Material baseline) | liquid-guidelines.md:227; HIG typography tables (fetched) | material-guidelines.md:189 to 194 | liquid-guidelines.md:227; HIG typography tables (fetched) |

## Breakpoints (shared, `src/base/breakpoint.json`)

| Name | Value | Source |
| --- | --- | --- |
| `breakpoint.compact` | 0px | material-guidelines.md:346 to 350 |
| `breakpoint.medium` | 600px | material-guidelines.md:346 to 350 |
| `breakpoint.expanded` | 840px | material-guidelines.md:346 to 350 |
| `breakpoint.large` | 1200px | material-guidelines.md:346 to 350 |
| `breakpoint.extra-large` | 1600px | material-guidelines.md:346 to 350 |

## System font mapping (native only, `$extensions["ds.systemFont"]`)

| Platform | sans | serif | mono |
| --- | --- | --- | --- |
| ios | platform default (undefined) | platform default (undefined) | platform default (undefined) |
| android | platform default (undefined) | 'serif' | 'monospace' |
| macos | platform default (undefined) | platform default (undefined) | platform default (undefined) |

A stack that starts with a CSS keyword maps through this table. A stack that
starts with a named family keeps that family. The web never maps a family.
