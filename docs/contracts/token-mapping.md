# Token mapping

Every token from the source, its new name, and where the value went. Written by
ds-tokens in order 0.4. One row per source token in the first table; a test
(`packages/tokens/tests/mapping.test.ts`) checks every name in
`packages/tokens/tests/source-tokens.json` has a row, and that every new name
in a row exists in the token build.

Sources:

- GB: `/home/user/gobanana/banana-server/styles/studio-tokens.css` (the token base).
- FK2: `/home/user/maherfayad-stack/figma-killer-2/src/styles/globals.css` (Studio, Studio Light, inspector, canvas and chart values).
- Desk values also checked against GB `desktop.css` and `window-layer.css`.

Where a token lives:

- Base (`packages/tokens/src/base/`): `font.size`, `font.weight`, `font.leading`, `font.tracking`, `space`, `size`, `border.width`, `z`, `duration`, `delay`, `ease`, `spring`, style free component tokens and `palette` (fixed pictures).
- Styles (`packages/styles/<id>/tokens.<scheme>.json`): every colour, `radius`, `elevation`, `blur`, `font.family`, the display leading and tracking, and component tokens that alias them.
- Desk is Studio dark plus the `--st-desk-*` values. Rows marked "Desk only" set the Desk value; Studio fills the same name with its own value.
- Studio Light comes from the FK2 `[data-editor-theme=light]` block with the GB A11y changes applied (GB light block).

Value conversions:

- Colours are DTCG colour objects (srgb components, alpha, 6 digit hex). The CSS build prints hex when opaque and `rgb(r g b / a)` otherwise.
- `color-mix()` values are resolved to rgba. `var()` values become aliases where the target is a token, otherwise the resolved value.
- em and vh values are numbers with `$extensions["ds.unit"]`, because DTCG dimensions allow only px and rem.

## GoBanana studio-tokens.css

| Old name | New name | Value | Source | Notes |
| --- | --- | --- | --- | --- |
| `--st-accent-1` | `color.accent.1` | dark `#8ee6c8`, light `#047857` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-1-10` | `color.accent.1-tint` | dark `rgba(142, 230, 200, 0.1)`, light `rgba(4, 120, 87, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-10` | `color.accent.10` | dark `#ff9f9f`, light `#b91c1c` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-10-10` | `color.accent.10-tint` | dark `rgba(255, 159, 159, 0.1)`, light `rgba(185, 28, 28, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-2` | `color.accent.2` | dark `#c8b6ff`, light `#6d28d9` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-2-10` | `color.accent.2-tint` | dark `rgba(200, 182, 255, 0.1)`, light `rgba(109, 40, 217, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-3` | `color.accent.3` | dark `#9bdcff`, light `#0369a1` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-3-10` | `color.accent.3-tint` | dark `rgba(155, 220, 255, 0.1)`, light `rgba(3, 105, 161, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-4` | `color.accent.4` | dark `#ffc7a8`, light `#9a3412` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-4-10` | `color.accent.4-tint` | dark `rgba(255, 199, 168, 0.1)`, light `rgba(154, 52, 18, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-5` | `color.accent.5` | dark `#ffb6cd`, light `#be123c` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-5-10` | `color.accent.5-tint` | dark `rgba(255, 182, 205, 0.1)`, light `rgba(190, 18, 60, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-6` | `color.accent.6` | dark `#b8f28b`, light `#3f6212` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-6-10` | `color.accent.6-tint` | dark `rgba(184, 242, 139, 0.1)`, light `rgba(63, 98, 18, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-7` | `color.accent.7` | dark `#f7df72`, light `#713f12` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-7-10` | `color.accent.7-tint` | dark `rgba(247, 223, 114, 0.1)`, light `rgba(113, 63, 18, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-8` | `color.accent.8` | dark `#83e7ff`, light `#0e7490` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-8-10` | `color.accent.8-tint` | dark `rgba(131, 231, 255, 0.1)`, light `rgba(14, 116, 144, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-9` | `color.accent.9` | dark `#f0a6ff`, light `#a21caf` | GB studio-tokens.css (dark and light) |  |
| `--st-accent-9-10` | `color.accent.9-tint` | dark `rgba(240, 166, 255, 0.1)`, light `rgba(162, 28, 175, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-annotation-selection-ring` | `canvas.annotation.ring` | dark `#ffffff`, light `#111827` | GB studio-tokens.css (dark and light) | Component token. |
| `--st-art-blue` | `palette.art.blue` | `#2d6bff` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-cobalt` | `palette.art.cobalt` | `#1f4fd1` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-dusk-1` | `palette.art.dusk-1` | `#f2a65a` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-dusk-2` | `palette.art.dusk-2` | `#c0587e` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-dusk-3` | `palette.art.dusk-3` | `#4b2f6b` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-dusk-4` | `palette.art.dusk-4` | `#1d1b3a` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-glacier` | `palette.art.glacier` | `#88a7c4` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-glint` | `palette.art.glint` | `rgba(255, 255, 255, 0.35)` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-graphite` | `palette.art.graphite` | `#2b2b2b` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-indigo` | `palette.art.indigo` | `#2e3a72` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-ink` | `palette.art.ink` | `#1c1a19` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-lilac` | `palette.art.lilac` | `#b8a6f4` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-line` | `palette.art.line` | `rgba(255, 255, 255, 0.18)` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-madder` | `palette.art.madder` | `#a23b2c` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-malachite` | `palette.art.malachite` | `#1f5e46` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-mint` | `palette.art.mint` | `#9fe3c9` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-paper` | `palette.art.paper` | `#f4f1ea` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-pink` | `palette.art.pink` | `#ff5fa2` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-rose` | `palette.art.rose` | `#f4a6c0` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-rule` | `palette.art.rule` | `rgba(28, 26, 25, 0.12)` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-saffron` | `palette.art.saffron` | `#e8a33d` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-sand` | `palette.art.sand` | `#d9b98c` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-shade` | `palette.art.shade` | `rgba(0, 0, 0, 0.28)` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-signal` | `palette.art.signal` | `#e2382b` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-sky` | `palette.art.sky` | `#8fd1ff` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-sun` | `palette.art.sun` | `#ffd27a` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-teak` | `palette.art.teak` | `#5a3a22` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-art-wool` | `palette.art.wool` | `#efe6d6` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-backdrop-blur` | `blur.backdrop` | `8px` | GB studio-tokens.css (theme free) | Studio value. Desk uses --st-window-backdrop-blur. |
| `--st-bg-body` | `color.bg.body` | dark `#000000`, light `#e3e7ed` | GB studio-tokens.css (dark and light) |  |
| `--st-bg-surface` | `color.bg.surface` | dark `#1b1b1b`, light `#ffffff` | GB studio-tokens.css (dark and light) |  |
| `--st-bg-surface-2` | `color.bg.surface-2` | dark `#282828`, light `#f6f7f9` | GB studio-tokens.css (dark and light) |  |
| `--st-bg-surface-3` | `color.bg.surface-3` | dark `#323232`, light `#eceff3` | GB studio-tokens.css (dark and light) |  |
| `--st-bg-surface-4` | `color.bg.surface-4` | dark `#4a4a4a`, light `#e1e5ea` | GB studio-tokens.css (dark and light) |  |
| `--st-bg-surface-5` | `color.bg.surface-5` | dark `#605f5f`, light `#d3d9e1` | GB studio-tokens.css (dark and light) |  |
| `--st-board-loud-1` | `palette.board.loud.1` | `#5e5b5d` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-loud-2` | `palette.board.loud.2` | `#cc3b7f` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-loud-3` | `palette.board.loud.3` | `#a28a95` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-loud-4` | `palette.board.loud.4` | `#e6bc5a` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-loud-5` | `palette.board.loud.5` | `#e4ebe5` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-private-1` | `palette.board.private.1` | `#1b1b1b` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-private-2` | `palette.board.private.2` | `#2d464e` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-private-3` | `palette.board.private.3` | `#535b5b` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-private-4` | `palette.board.private.4` | `#8c857a` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-private-5` | `palette.board.private.5` | `#b8aa92` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-souq-1` | `palette.board.souq.1` | `#2c3a42` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-souq-2` | `palette.board.souq.2` | `#96172c` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-souq-3` | `palette.board.souq.3` | `#40627b` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-souq-4` | `palette.board.souq.4` | `#8a5b41` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-souq-5` | `palette.board.souq.5` | `#b3c9d7` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-transit-1` | `palette.board.transit.1` | `#0f181c` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-transit-2` | `palette.board.transit.2` | `#28323f` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-transit-3` | `palette.board.transit.3` | `#586068` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-transit-4` | `palette.board.transit.4` | `#c3c6cd` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-board-transit-5` | `palette.board.transit.5` | `#e0f0fa` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-border` | `color.border.default` | dark `#333333`, light `#cbd3dc` | GB studio-tokens.css (dark and light) |  |
| `--st-border-control` | `color.border.control` | dark `rgba(255, 255, 255, 0.4)`, light `rgba(17, 24, 39, 0.52)` | GB studio-tokens.css (dark and light) | A11y note kept as $description. |
| `--st-border-control-hover` | `color.border.control-hover` | dark `rgba(255, 255, 255, 0.6)`, light `rgba(17, 24, 39, 0.7)` | GB studio-tokens.css (dark and light) |  |
| `--st-border-muted` | `color.border.muted` | dark `#2e2e2e`, light `#dce1e7` | GB studio-tokens.css (dark and light) |  |
| `--st-border-strong` | `color.border.strong` | dark `#4a4a4a`, light `#aeb8c5` | GB studio-tokens.css (dark and light) |  |
| `--st-border-subtle` | `color.border.subtle` | dark `#1f1f1f`, light `#eef0f3` | GB studio-tokens.css (dark and light) |  |
| `--st-border-width` | `border.width.default` | `1px` | GB studio-tokens.css (theme free) |  |
| `--st-border-width-strong` | `border.width.strong` | `2px` | GB studio-tokens.css (theme free) |  |
| `--st-brand` | `brand.color` | `var(--st-accent-7)` | GB studio-tokens.css (dark and light) | Component token, alias of color.accent.7. |
| `--st-brand-mark` | `brand.mark` | dark `var(--st-brand)`, light `var(--st-text-bright)` | GB studio-tokens.css (dark and light) | Component token. Yellow on dark, ink on light. |
| `--st-btn-secondary-fg` | `button.text.secondary` | dark `var(--st-text)`, light `var(--st-text-muted)` | GB studio-tokens.css (dark and light) | Component token. Dark aliases color.text.default, light color.text.muted. A11y note kept as $description. |
| `--st-canvas-bg` | `canvas.bg` | `var(--st-bg-surface)` | GB studio-tokens.css (dark and light) | Alias of color.bg.surface. |
| `--st-canvas-corner` | `canvas.corner.radius` | `16px` | GB studio-tokens.css (theme free) | Alias of radius.card (16px). |
| `--st-canvas-dot` | `canvas.dot` | `var(--st-overlay-10)` | GB studio-tokens.css (dark and light) | Alias of color.bg.overlay-10. |
| `--st-canvas-edge-hit` | `canvas.edge.hit` | `7px` | GB studio-tokens.css (theme free) |  |
| `--st-canvas-frame-gap` | `canvas.frame.gap` | `40px` | GB studio-tokens.css (theme free) |  |
| `--st-canvas-handle-size` | `canvas.handle.size` | `9px` | GB studio-tokens.css (theme free) |  |
| `--st-canvas-hover-ring-color` | `color.canvas.hover` | dark `#ff2bd6`, light `#c0009c` | GB studio-tokens.css (dark and light) |  |
| `--st-canvas-marquee-border` | `canvas.marquee.border` | dark `#39ff14`, light `#08110a` | GB studio-tokens.css (dark and light) | Component token. |
| `--st-canvas-marquee-fill` | `canvas.marquee.fill` | dark `color-mix(in srgb, #39ff14 12%, transparent)`, light `color-mix(in srgb, #39ff14 18%, transparent)` | GB studio-tokens.css (dark and light) | Component token. color-mix resolved to rgba. |
| `--st-canvas-node-badge-text` | `canvas.badge.text` | `#08110a` | GB studio-tokens.css (dark and light) | Component token. |
| `--st-canvas-placeholder-bg` | `color.canvas.placeholder`, `canvas.placeholder.stripe` | `repeating-linear-gradient(-45deg, color-mix(in srgb, var(--st-text-subtle) 6%, transparent) 0 6px, transparent 6px 12px), color-mix(in srgb, var(--st-text-subtle) 4%, transparent)` | GB studio-tokens.css (dark and light) | A gradient is not a colour: the base tint and the stripe colour are tokens, the 45 degree 6px stripe geometry moves to the canvas recipe. color-mix resolved to rgba. |
| `--st-canvas-resize-handle-border` | `canvas.handle.border` | dark `#39ff14`, light `#08110a` | GB studio-tokens.css (dark and light) | Component token. |
| `--st-canvas-resize-handle-fill` | `canvas.handle.fill` | `#ffffff` | GB studio-tokens.css (dark and light) | Component token. |
| `--st-canvas-section-edge` | `canvas.section.edge` | dark `var(--st-overlay-40)`, light `var(--st-overlay-50)` | GB studio-tokens.css (dark and light) | Component token. Dark aliases overlay-40, light overlay-50. |
| `--st-canvas-selection-halo` | `canvas.selection.halo` | dark `transparent`, light `#08110a` | GB studio-tokens.css (dark and light) | Component token. A11y note kept as $description. |
| `--st-canvas-selection-offset` | `canvas.selection.offset` | `2px` | GB studio-tokens.css (theme free) |  |
| `--st-canvas-selection-ring-color` | `color.canvas.selection` | `#39ff14` | GB studio-tokens.css (dark and light) |  |
| `--st-canvas-selection-width` | `canvas.selection.width` | `2px` | GB studio-tokens.css (theme free) |  |
| `--st-canvas-snap-guide-color` | `color.canvas.guide` | dark `#00c8ff`, light `#0077a3` | GB studio-tokens.css (dark and light) |  |
| `--st-canvas-zoom-fit-padding` | `canvas.zoom-fit.padding` | `64px` | GB studio-tokens.css (theme free) |  |
| `--st-control-h-lg` | `size.control.lg` | `44px` | GB studio-tokens.css (theme free) |  |
| `--st-control-h-md` | `size.control.md` | `32px` | GB studio-tokens.css (theme free) |  |
| `--st-control-h-sm` | `size.control.sm` | `28px` | GB studio-tokens.css (theme free) |  |
| `--st-control-h-xs` | `size.control.xs` | `24px` | GB studio-tokens.css (theme free) |  |
| `--st-danger` | `color.state.danger.fill` | `#ef4444` | GB studio-tokens.css (dark and light) |  |
| `--st-danger-10` | `color.state.danger.tint-10` | `rgba(239, 68, 68, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-danger-20` | `color.state.danger.tint-20` | `rgba(239, 68, 68, 0.2)` | GB studio-tokens.css (dark and light) |  |
| `--st-danger-fg` | `color.state.danger.text` | dark `#f87171`, light `#b91c1c` | GB studio-tokens.css (dark and light) | Text on a plain surface. A11y note kept as $description. |
| `--st-danger-light` | `color.state.danger.border` | dark `#f87171`, light `#dc2626` | GB studio-tokens.css (dark and light) | Used as the danger border (3:1 on surfaces). |
| `--st-danger-text` | `color.state.danger.on-tint` | dark `#fecaca`, light `#991b1b` | GB studio-tokens.css (dark and light) | Text placed on the 10% tint. |
| `--st-delay-peek-hide` | `delay.peek-hide` | `600ms`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-delay-reveal-step` | `delay.reveal-step` | `80ms`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-dense-row-h` | `inspector.row.height` | `32px` | GB studio-tokens.css (theme free) | Same value as FK2 --inspector-row-h. |
| `--st-desk-bg` | `color.bg.body` | `#000000` | GB studio-tokens.css (theme free) | Desk only. |
| `--st-desk-blur` | `blur.window` | `24px` | GB studio-tokens.css (theme free) | Desk only. |
| `--st-desk-blur-strong` | `blur.window-strong` | `40px` | GB studio-tokens.css (theme free) | Desk only. |
| `--st-desk-body` | `color.text.muted` | `#a3a3a3` | GB studio-tokens.css (theme free) | Desk only. |
| `--st-desk-body-lift` | `color.text.bright` | `#ffffff` | GB studio-tokens.css (theme free) | Same value as --st-desk-heading, folds into color.text.bright. |
| `--st-desk-bubble` | `palette.site.bubble` | `#262626` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-card-bottom` | `palette.site.card.bottom` | `#121212f0` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-card-top` | `palette.site.card.top` | `#1b1b1bf0` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-control` | `control.fill.default` | `#ffffff14` | GB studio-tokens.css (theme free) | Desk value of a component token. |
| `--st-desk-control-hover` | `control.fill.hover` | `#ffffff26` | GB studio-tokens.css (theme free) | Desk value of a component token. |
| `--st-desk-dock` | `color.material.dock` | `#1c1c1ca6` | GB studio-tokens.css (theme free) |  |
| `--st-desk-ease` | `ease.reveal` | `cubic-bezier(0.22, 1, 0.36, 1)` | GB studio-tokens.css (theme free) | Same curve as --st-ease-reveal, so it folds into ease.reveal. |
| `--st-desk-edge-hover` | `palette.site.edge-hover` | `#ffffff3d` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-frost` | `palette.site.frost` | `#121212cc` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-glass` | `color.material.glass` | `#1f1f1f87` | GB studio-tokens.css (theme free) |  |
| `--st-desk-glass-border` | `color.material.glass-border` | `#ffffff1f` | GB studio-tokens.css (theme free) |  |
| `--st-desk-glass-edge` | `color.material.glass-edge` | `#ffffff12` | GB studio-tokens.css (theme free) |  |
| `--st-desk-glass-flat` | `color.material.glass-flat` | `#141414d9` | GB studio-tokens.css (theme free) |  |
| `--st-desk-glass-hover` | `color.material.glass-hover` | `#ffffff0f` | GB studio-tokens.css (theme free) |  |
| `--st-desk-glass-solid` | `color.material.glass-solid` | `#141414` | GB studio-tokens.css (theme free) |  |
| `--st-desk-glass-strong` | `color.material.glass-strong` | `#161616e0` | GB studio-tokens.css (theme free) |  |
| `--st-desk-glow-cool` | `palette.site.glow.cool` | `#7c9cff24` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-glow-mint` | `palette.site.glow.mint` | `#5be4a024` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-grain-opacity` | `palette.site.grain-opacity` | `0.14` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-grey-a` | `palette.site.grey.a` | `#9599a4` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-grey-b` | `palette.site.grey.b` | `#c0c3cc` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-grey-ink` | `palette.site.grey.ink` | `#0b0b0d` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-grey-ink-dim` | `palette.site.grey.ink-dim` | `#24262c` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-hairline` | `color.border.hairline` | `#ffffff1a` | GB studio-tokens.css (theme free) |  |
| `--st-desk-heading` | `color.text.bright` | `#ffffff` | GB studio-tokens.css (theme free) | Desk only. |
| `--st-desk-heading-dim` | `color.text.dim` | `#b9b9b9` | GB studio-tokens.css (theme free) | Desk only. |
| `--st-desk-leading` | `font.leading.display` | `0.9` | GB studio-tokens.css (theme free) | Desk only. |
| `--st-desk-light-close` | `color.window.light-close` | `#ff5f57` | GB studio-tokens.css (theme free) | Filled in every style; Studio does not draw the lights. |
| `--st-desk-light-idle` | `color.window.light-idle` | `#e8e8e8` | GB studio-tokens.css (theme free) | Filled in every style; Studio does not draw the lights. |
| `--st-desk-light-ink` | `color.window.light-ink` | `#4d0000b3` | GB studio-tokens.css (theme free) | Filled in every style; Studio does not draw the lights. |
| `--st-desk-light-min` | `color.window.light-min` | `#febc2e` | GB studio-tokens.css (theme free) | Filled in every style; Studio does not draw the lights. |
| `--st-desk-light-zoom` | `color.window.light-zoom` | `#28c840` | GB studio-tokens.css (theme free) | Filled in every style; Studio does not draw the lights. |
| `--st-desk-mark-face` | `palette.site.mark.face` | `#b9b9b9` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-mark-glass` | `palette.site.mark.glass` | `#d9d9d9` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-mark-glint` | `palette.site.mark.glint` | `#ffd84d` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-mark-glow` | `palette.site.mark.glow` | `#ffd84d33` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-menubar` | `color.material.menubar` | `#000000b8` | GB studio-tokens.css (theme free) |  |
| `--st-desk-meta` | `color.text.subtle` | `#8f8f8f` | GB studio-tokens.css (theme free) | Desk only. Same value as Studio. |
| `--st-desk-radius` | `radius.window` | `1rem` | GB studio-tokens.css (theme free) | Desk only. |
| `--st-desk-roll` | `duration.roll` | `0.3s`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Moved to base: the duration is shared, the roll itself is a Desk recipe. Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-desk-scrim` | `color.bg.scrim` | `#000000a6` | GB studio-tokens.css (theme free) | Desk only. The modal backdrop. |
| `--st-desk-scrim-strong` | `palette.site.scrim-strong` | `#000000c2` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-shadow` | `elevation.window` | `0 30px 80px -20px #000000d9, 0 0 0 1px #00000066` | GB studio-tokens.css (theme free) | Desk only. |
| `--st-desk-shadow-button` | `palette.site.shadow.button` | `0 16px 40px -12px #000000cc` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-shadow-deep` | `palette.site.shadow.deep` | `0 40px 80px -40px #000000f2` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-shadow-glass` | `elevation.glass` | `0 40px 100px -30px #000000e6, 0 12px 30px -12px #00000099` | GB studio-tokens.css (theme free) | Desk only. |
| `--st-desk-shadow-lift` | `palette.site.shadow.lift` | `0 30px 60px -30px #000000e6` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-shadow-soft` | `elevation.window-soft` | `0 12px 32px -12px #000000cc` | GB studio-tokens.css (theme free) | Desk only. |
| `--st-desk-stage` | `palette.site.stage.default` | `#0a0a0b` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-stage-ink` | `palette.site.stage.ink` | `#0b0b0b` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-tile` | `palette.site.tile.default` | `#161618` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-tile-side` | `palette.site.tile.side` | `#050506` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-titlebar` | `color.material.titlebar` | `#ffffff08` | GB studio-tokens.css (theme free) |  |
| `--st-desk-tracking` | `font.tracking.display` | `-0.04em` | GB studio-tokens.css (theme free) | Desk only. em as a number with $extensions ds.unit em. |
| `--st-desk-trail` | `palette.site.trail.default` | `#d6d6d6` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-trail-cool` | `palette.site.trail.cool` | `#5a8cff` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-desk-trail-warm` | `palette.site.trail.warm` | `#ff5a4d` | GB studio-tokens.css (theme free) | Marketing desk picture (GoBanana landing). Fixed in every style and scheme. |
| `--st-dialog-max-h` | `dialog.height.max` | `80vh` | GB studio-tokens.css (theme free) | vh is not a DTCG unit: a number with $extensions ds.unit vh. Native gets 80%. |
| `--st-dialog-w-2xl` | `dialog.width.2xl` | `820px` | GB studio-tokens.css (theme free) |  |
| `--st-dialog-w-lg` | `dialog.width.lg` | `520px` | GB studio-tokens.css (theme free) |  |
| `--st-dialog-w-md` | `dialog.width.md` | `440px` | GB studio-tokens.css (theme free) |  |
| `--st-dialog-w-sm` | `dialog.width.sm` | `360px` | GB studio-tokens.css (theme free) |  |
| `--st-dialog-w-xl` | `dialog.width.xl` | `640px` | GB studio-tokens.css (theme free) |  |
| `--st-duration-base` | `duration.base` | `120ms`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-duration-fast` | `duration.fast` | `80ms`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-duration-instant` | `duration.instant` | `70ms`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-duration-medium` | `duration.medium` | `140ms`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-duration-moderate` | `duration.moderate` | `150ms`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-duration-quick` | `duration.quick` | `100ms`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-duration-reveal` | `duration.reveal` | `640ms`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-duration-shimmer` | `duration.shimmer` | `1.4s`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-duration-slow` | `duration.slow` | `180ms`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-duration-spin` | `duration.spin` | `0.8s`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-duration-zoom` | `duration.zoom` | `220ms`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-ease` | `ease.default` | `ease` | GB studio-tokens.css (theme free) | CSS keyword converted to its cubic bezier. |
| `--st-ease-emphasized` | `ease.emphasized` | `cubic-bezier(0.16, 1, 0.3, 1)` | GB studio-tokens.css (theme free) |  |
| `--st-ease-exit` | `ease.exit` | `cubic-bezier(0.4, 0, 1, 1)` | GB studio-tokens.css (theme free) |  |
| `--st-ease-in` | `ease.in` | `ease-in` | GB studio-tokens.css (theme free) | CSS keyword converted to its cubic bezier. |
| `--st-ease-out` | `ease.out` | `ease-out` | GB studio-tokens.css (theme free) | CSS keyword converted to its cubic bezier. |
| `--st-ease-reveal` | `ease.reveal` | `cubic-bezier(0.22, 1, 0.36, 1)` | GB studio-tokens.css (theme free) |  |
| `--st-ease-standard` | `ease.standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | GB studio-tokens.css (theme free) |  |
| `--st-explore-bg` | `chip.explore.bg` | `var(--st-accent-4-10)` | GB studio-tokens.css (dark and light) | Component token, alias of color.accent.4-tint. |
| `--st-explore-fg` | `chip.explore.text` | `var(--st-accent-4)` | GB studio-tokens.css (dark and light) | Component token, alias of color.accent.4. |
| `--st-fixed-2xs` | `space.fixed.2xs` | `4px` | GB studio-tokens.css (theme free) | Same values as FK2 --inspector-space-*. |
| `--st-fixed-3xs` | `space.fixed.3xs` | `3px` | GB studio-tokens.css (theme free) | Same values as FK2 --inspector-space-*. |
| `--st-fixed-4xs` | `space.fixed.4xs` | `2px` | GB studio-tokens.css (theme free) | Same values as FK2 --inspector-space-*. |
| `--st-fixed-l` | `space.fixed.l` | `10px` | GB studio-tokens.css (theme free) | Same values as FK2 --inspector-space-*. |
| `--st-fixed-m` | `space.fixed.m` | `8px` | GB studio-tokens.css (theme free) | Same values as FK2 --inspector-space-*. |
| `--st-fixed-s` | `space.fixed.s` | `6px` | GB studio-tokens.css (theme free) | Same values as FK2 --inspector-space-*. |
| `--st-fixed-xl` | `space.fixed.xl` | `12px` | GB studio-tokens.css (theme free) | Same values as FK2 --inspector-space-*. |
| `--st-fixed-xs` | `space.fixed.xs` | `5px` | GB studio-tokens.css (theme free) | Same values as FK2 --inspector-space-*. |
| `--st-focus-halo-color` | `color.focus.halo` | dark `#000000`, light `#ffffff` | GB studio-tokens.css (dark and light) |  |
| `--st-focus-ring` | `focus.shadow.ring` | `0 0 0 2px var(--st-focus-ring-color)` | GB studio-tokens.css (dark and light) | Component token. The shadow colour references color.focus.ring. |
| `--st-focus-ring-color` | `color.focus.ring` | dark `#f4f4f5`, light `#111827` | GB studio-tokens.css (dark and light) |  |
| `--st-focus-ring-halo` | `focus.shadow.halo` | `0 0 0 2px var(--st-focus-halo-color), 0 0 0 4px var(--st-focus-ring-color)` | GB studio-tokens.css (dark and light) | Component token. Halo then ring, for focus over pictures. |
| `--st-font-arabic` | `font.family.arabic` | `"IBM Plex Sans Arabic", "Noto Sans Arabic", "Segoe UI", Tahoma, sans-serif` | GB studio-tokens.css (theme free) |  |
| `--st-font-desk` | `font.family.sans`, `font.family.display` | `"Instrument Sans", "Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif` | GB studio-tokens.css (theme free) | Desk only. display aliases sans. |
| `--st-font-desk-arabic` | `font.family.arabic`, `font.family.display-arabic` | `"IBM Plex Sans Arabic", "Noto Sans Arabic", "Instrument Sans", "Inter Variable", system-ui, sans-serif` | GB studio-tokens.css (theme free) | Desk only. display-arabic aliases arabic. |
| `--st-font-mono` | `font.family.mono` | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace` | GB studio-tokens.css (theme free) |  |
| `--st-font-sans` | `font.family.sans`, `font.family.arabic` | `"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`; Arabic `"IBM Plex Sans Arabic", "Noto Sans Arabic", "Inter Variable", "Inter", system-ui, sans-serif` | GB studio-tokens.css (theme free, :lang(ar)) | The :lang(ar) override of the sans stack is font.family.arabic; base.css switches families under :lang(ar). |
| `--st-info-text` | `color.state.info.on-tint` | dark `#c4b5fd`, light `#4338ca` | GB studio-tokens.css (dark and light) | Also aliased by color.state.info.text. |
| `--st-kbd-border` | `kbd.border` | `var(--st-border)` | GB studio-tokens.css (dark and light) | Alias of color.border.default. |
| `--st-kbd-drop` | `kbd.drop` | dark `var(--st-scrim-30)`, light `rgba(15, 23, 42, 0.16)` | GB studio-tokens.css (dark and light) | Component token. Dark aliases color.bg.scrim-30, light is a literal. |
| `--st-kbd-edge` | `kbd.edge` | dark `var(--st-scrim-30)`, light `rgba(15, 23, 42, 0.18)` | GB studio-tokens.css (dark and light) | Component token. Dark aliases color.bg.scrim-30, light is a literal. |
| `--st-kbd-face-bottom` | `kbd.face.bottom` | dark `#2f2f2f`, light `#e5e7eb` | GB studio-tokens.css (dark and light) | Component token. |
| `--st-kbd-face-top` | `kbd.face.top` | dark `#434343`, light `#ffffff` | GB studio-tokens.css (dark and light) | Component token. |
| `--st-kbd-highlight` | `kbd.highlight` | dark `var(--st-overlay-5)`, light `rgba(255, 255, 255, 0.85)` | GB studio-tokens.css (dark and light) | Alias of color.bg.overlay-5. |
| `--st-kbd-text` | `kbd.text` | dark `#ededed`, light `#4b5563` | GB studio-tokens.css (dark and light) | Component token. A11y note kept as $description. |
| `--st-leading-normal` | `font.leading.normal`, `font.leading.arabic.normal` | `1.5`; Arabic `1.7` | GB studio-tokens.css (theme free, :lang(ar)) | The :lang(ar) override becomes its own token; base.css switches to it under :lang(ar). |
| `--st-leading-relaxed` | `font.leading.relaxed`, `font.leading.arabic.relaxed` | `1.6`; Arabic `1.8` | GB studio-tokens.css (theme free, :lang(ar)) | The :lang(ar) override becomes its own token; base.css switches to it under :lang(ar). |
| `--st-leading-snug` | `font.leading.snug`, `font.leading.arabic.snug` | `1.35`; Arabic `1.5` | GB studio-tokens.css (theme free, :lang(ar)) | The :lang(ar) override becomes its own token; base.css switches to it under :lang(ar). |
| `--st-leading-tight` | `font.leading.tight`, `font.leading.arabic.tight` | `1.2`; Arabic `1.35` | GB studio-tokens.css (theme free, :lang(ar)) | The :lang(ar) override becomes its own token; base.css switches to it under :lang(ar). |
| `--st-link` | `color.text.link` | `var(--st-text-bright)` | GB studio-tokens.css (dark and light) | Alias of color.text.bright. |
| `--st-menu-item-h` | `menu.item.height` | `28px` | GB studio-tokens.css (theme free) |  |
| `--st-menu-min-w` | `menu.width.min` | `200px` | GB studio-tokens.css (theme free) |  |
| `--st-mock-a1` | `palette.mock.a1` | `#e9e2cf` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-mock-a2` | `palette.mock.a2` | `#2f5d50` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-mock-b1` | `palette.mock.b1` | `#ff5ea8` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-mock-b2` | `palette.mock.b2` | `#1d1440` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-mock-b3` | `palette.mock.b3` | `#0a0a1f` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-mock-bezel` | `palette.mock.bezel` | `#2a2a2a` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-mock-c1` | `palette.mock.c1` | `#f2c14e` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-mock-c2` | `palette.mock.c2` | `#e85d3f` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-mock-ink` | `palette.mock.ink` | `#141414` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-mock-ok` | `palette.mock.ok` | `#5be4a0` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-mock-paper` | `palette.mock.paper` | `#f6f3ea` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-mock-term` | `palette.mock.term` | `#050505` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-mock-term-ink` | `palette.mock.term-ink` | `#f2f2f2` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-mock-tile` | `palette.mock.tile` | `#1a1a1a` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-mock-warm` | `palette.mock.warm` | `#ff9b5a` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-note-band` | `palette.note.band` | `rgba(31, 33, 38, 0.07)` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-note-blue` | `palette.note.blue` | `#aed4fb` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-note-gray` | `palette.note.gray` | `#dfe3ea` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-note-green` | `palette.note.green` | `#d3f39b` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-note-ink` | `palette.note.ink` | `#1f2126` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-note-ink-subtle` | `palette.note.ink-subtle` | `rgba(31, 33, 38, 0.72)` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. A11y note kept as $description. |
| `--st-note-label-bg` | `palette.note.label-bg` | `rgba(31, 33, 38, 0.09)` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-note-pink` | `palette.note.pink` | `#ffcfe1` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-note-rule` | `palette.note.rule` | `rgba(31, 33, 38, 0.16)` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-note-shadow` | `palette.note.shadow` | `0 1px 2px rgba(0, 0, 0, 0.22), 0 6px 14px rgba(0, 0, 0, 0.18)` | GB studio-tokens.css (theme free) |  |
| `--st-note-yellow` | `palette.note.yellow` | `#fff8b8` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-overlay` | `color.bg.overlay-solid` | dark `#ffffff`, light `#111827` | GB studio-tokens.css (dark and light) | The solid foreground the overlay scale is made from. |
| `--st-overlay-10` | `color.bg.overlay-10` | dark `rgba(255, 255, 255, 0.1)`, light `rgba(17, 24, 39, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-overlay-20` | `color.bg.overlay-20` | dark `rgba(255, 255, 255, 0.2)`, light `rgba(17, 24, 39, 0.2)` | GB studio-tokens.css (dark and light) |  |
| `--st-overlay-30` | `color.bg.overlay-30` | dark `rgba(255, 255, 255, 0.3)`, light `rgba(17, 24, 39, 0.3)` | GB studio-tokens.css (dark and light) |  |
| `--st-overlay-40` | `color.bg.overlay-40` | dark `rgba(255, 255, 255, 0.4)`, light `rgba(17, 24, 39, 0.4)` | GB studio-tokens.css (dark and light) |  |
| `--st-overlay-5` | `color.bg.overlay-5` | dark `rgba(255, 255, 255, 0.05)`, light `rgba(17, 24, 39, 0.05)` | GB studio-tokens.css (dark and light) |  |
| `--st-overlay-50` | `color.bg.overlay-50` | dark `rgba(255, 255, 255, 0.5)`, light `rgba(17, 24, 39, 0.5)` | GB studio-tokens.css (dark and light) |  |
| `--st-overlay-60` | `color.bg.overlay-60` | dark `rgba(255, 255, 255, 0.6)`, light `rgba(17, 24, 39, 0.6)` | GB studio-tokens.css (dark and light) |  |
| `--st-overlay-70` | `color.bg.overlay-70` | dark `rgba(255, 255, 255, 0.7)`, light `rgba(17, 24, 39, 0.7)` | GB studio-tokens.css (dark and light) |  |
| `--st-overlay-80` | `color.bg.overlay-80` | dark `rgba(255, 255, 255, 0.8)`, light `rgba(17, 24, 39, 0.8)` | GB studio-tokens.css (dark and light) |  |
| `--st-overlay-90` | `color.bg.overlay-90` | dark `rgba(255, 255, 255, 0.9)`, light `rgba(17, 24, 39, 0.9)` | GB studio-tokens.css (dark and light) |  |
| `--st-panel-blur` | `blur.panel` | `24px` | GB studio-tokens.css (theme free) |  |
| `--st-phone-stroke` | `palette.phone.stroke` | `#111214` | GB studio-tokens.css (theme free) | Fixed picture colour, the same in every style and scheme. |
| `--st-primary-border` | `color.primary.border` | dark `var(--st-primary-fill)`, light `#7a5c00` | GB studio-tokens.css (dark and light) | Desk only: Studio keeps a neutral primary (FK2). Light uses the GB light block values. |
| `--st-primary-fill` | `color.primary.fill` | `#ffd84d` | GB studio-tokens.css (dark and light) | Desk only: Studio keeps a neutral primary (FK2). Light uses the GB light block values. |
| `--st-primary-fill-hover` | `color.primary.fill-hover` | dark `#ffe170`, light `#ffcf26` | GB studio-tokens.css (dark and light) | Desk only: Studio keeps a neutral primary (FK2). Light uses the GB light block values. |
| `--st-primary-fill-pressed` | `color.primary.fill-pressed` | dark `#f2c832`, light `#f5c400` | GB studio-tokens.css (dark and light) | Desk only: Studio keeps a neutral primary (FK2). Light uses the GB light block values. |
| `--st-primary-focus-inner` | `color.focus.ring-on-primary-inner` | dark `#000000`, light `#111827` | GB studio-tokens.css (dark and light) |  |
| `--st-primary-focus-outer` | `color.focus.ring-on-primary-outer` | dark `#f4f4f5`, light `#ffffff` | GB studio-tokens.css (dark and light) |  |
| `--st-primary-focus-ring` | `focus.shadow.primary` | `0 0 0 2px var(--st-primary-focus-inner), 0 0 0 4px var(--st-primary-focus-outer)` | GB studio-tokens.css (dark and light) | Component token. |
| `--st-primary-text` | `color.primary.text` | `#111827` | GB studio-tokens.css (dark and light) | Desk only: Studio keeps a neutral primary (FK2). Light uses the GB light block values. |
| `--st-radius` | `radius.sm` | `6px` | GB studio-tokens.css (theme free) |  |
| `--st-radius-card` | `radius.card` | `16px` | GB studio-tokens.css (theme free) |  |
| `--st-radius-field` | `radius.field` | `8px` | GB studio-tokens.css (theme free) |  |
| `--st-radius-input` | `radius.control` | `1em` | GB studio-tokens.css (theme free) | em is not a DTCG dimension unit: a number with $extensions ds.unit em. Native and Figma resolve it at 16px. |
| `--st-radius-menu-item` | `menu.item.radius` | `12px` | GB studio-tokens.css (theme free) | Component token, alias of radius.panel (12px). |
| `--st-radius-panel` | `radius.panel` | `12px` | GB studio-tokens.css (theme free) |  |
| `--st-radius-pill` | `radius.pill` | `999px` | GB studio-tokens.css (theme free) |  |
| `--st-radius-sm` | `radius.xs` | `3px` | GB studio-tokens.css (theme free) |  |
| `--st-rail-w` | `shell.rail.width` | `42px` | GB studio-tokens.css (theme free) |  |
| `--st-row-h` | `list.row.height` | `28px` | GB studio-tokens.css (theme free) |  |
| `--st-scrim` | `color.bg.scrim-solid` | `#000000` | GB studio-tokens.css (dark and light) | Solid black; color.bg.scrim is now the modal backdrop. |
| `--st-scrim-10` | `color.bg.scrim-10` | `rgba(0, 0, 0, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-scrim-20` | `color.bg.scrim-20` | `rgba(0, 0, 0, 0.2)` | GB studio-tokens.css (dark and light) |  |
| `--st-scrim-30` | `color.bg.scrim-30` | `rgba(0, 0, 0, 0.3)` | GB studio-tokens.css (dark and light) |  |
| `--st-scrim-40` | `color.bg.scrim-40` | `rgba(0, 0, 0, 0.4)` | GB studio-tokens.css (dark and light) |  |
| `--st-scrim-50` | `color.bg.scrim-50` | `rgba(0, 0, 0, 0.5)` | GB studio-tokens.css (dark and light) |  |
| `--st-scrim-60` | `color.bg.scrim-60` | `rgba(0, 0, 0, 0.6)` | GB studio-tokens.css (dark and light) |  |
| `--st-scrim-70` | `color.bg.scrim-70` | `rgba(0, 0, 0, 0.7)` | GB studio-tokens.css (dark and light) |  |
| `--st-scrim-80` | `color.bg.scrim-80` | `rgba(0, 0, 0, 0.8)` | GB studio-tokens.css (dark and light) |  |
| `--st-scrim-90` | `color.bg.scrim-90` | `rgba(0, 0, 0, 0.9)` | GB studio-tokens.css (dark and light) |  |
| `--st-scrollbar-size` | `scrollbar.size` | `6px` | GB studio-tokens.css (theme free) | Same value as FK2 --scrollbar-size. |
| `--st-scrollbar-thumb` | `scrollbar.thumb` | `color-mix(in srgb, var(--st-text-subtle) 58%, transparent)` | GB studio-tokens.css (dark and light) | Component token. color-mix resolved to rgba. |
| `--st-scrollbar-thumb-hover` | `scrollbar.thumb-hover` | `color-mix(in srgb, var(--st-text-muted) 72%, transparent)` | GB studio-tokens.css (dark and light) | Component token. color-mix resolved to rgba. |
| `--st-scrollbar-track` | `scrollbar.track` | `transparent` | GB studio-tokens.css (dark and light) | Component token. |
| `--st-shadow-canvas-chrome` | `canvas.chrome.shadow` | dark `0 12px 28px var(--st-scrim-30)`, light `0 12px 28px rgba(15, 23, 42, 0.16)` | GB studio-tokens.css (dark and light) |  |
| `--st-shadow-card-hover` | `elevation.card-hover` | dark `0 2px 4px var(--st-scrim-30), 0 8px 20px var(--st-scrim-40)`, light `0 2px 4px rgba(15, 23, 42, 0.06), 0 8px 20px rgba(15, 23, 42, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-shadow-dialog` | `elevation.dialog` | dark `0 18px 48px rgba(0, 0, 0, 0.28)`, light `0 18px 48px rgba(15, 23, 42, 0.16)` | GB studio-tokens.css (dark and light) |  |
| `--st-shadow-input-focus` | `elevation.input-focus` | dark `inset 0 0 5px rgba(255, 255, 255, 0.06), inset 0 -5px 8px rgba(255, 255, 255, 0.09), 0 0 5px rgba(0, 0, 0, 0.24)`, light `inset 0 0 4px rgba(15, 23, 42, 0.06), inset 0 -4px 8px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.14)` | GB studio-tokens.css (dark and light) |  |
| `--st-shadow-menu` | `elevation.menu` | dark `0 12px 28px var(--st-scrim-50)`, light `0 12px 28px rgba(15, 23, 42, 0.16)` | GB studio-tokens.css (dark and light) |  |
| `--st-shadow-panel` | `elevation.panel` | `var(--st-shadow-panel-inset-bottom), var(--st-shadow-panel-drop)` | GB studio-tokens.css (dark and light) |  |
| `--st-shadow-panel-drop` | `elevation.panel` | dark `0 12px 40px rgba(0, 0, 0, 0.65)`, light `0 16px 42px rgba(15, 23, 42, 0.18)` | GB studio-tokens.css (dark and light) | The second layer of elevation.panel. |
| `--st-shadow-panel-inset-bottom` | `elevation.panel` | dark `inset 0 -1px 0 var(--st-scrim-40)`, light `inset 0 -1px 0 var(--st-overlay-10)` | GB studio-tokens.css (dark and light) | The first layer of elevation.panel. |
| `--st-shadow-tooltip` | `elevation.tooltip` | dark `0 4px 16px var(--st-scrim-50), inset 0 1px 0 var(--st-overlay-5)`, light `0 4px 16px rgba(15, 23, 42, 0.16), inset 0 1px 0 var(--st-overlay-5)` | GB studio-tokens.css (dark and light) |  |
| `--st-ship-bg` | `chip.ship.bg` | `var(--st-accent-1-10)` | GB studio-tokens.css (dark and light) | Component token, alias of color.accent.1-tint. |
| `--st-ship-fg` | `chip.ship.text` | dark `var(--st-accent-1)`, light `#065f46` | GB studio-tokens.css (dark and light) | Component token. |
| `--st-sidebar-left-w` | `shell.sidebar.width.start` | `320px` | GB studio-tokens.css (theme free) | Left becomes start (logical). |
| `--st-sidebar-max-w` | `shell.sidebar.width.max` | `520px` | GB studio-tokens.css (theme free) |  |
| `--st-sidebar-min-w` | `shell.sidebar.width.min` | `260px` | GB studio-tokens.css (theme free) |  |
| `--st-sidebar-right-w` | `shell.sidebar.width.end` | `290px` | GB studio-tokens.css (theme free) | Right becomes end (logical). |
| `--st-space-10xl` | `space.10xl` | `clamp(48px, calc(45.029px + 0.762vw), 56px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-11xl` | `space.11xl` | `clamp(56px, calc(50.057px + 1.524vw), 72px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-12xl` | `space.12xl` | `clamp(84px, calc(75.086px + 2.286vw), 108px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-2xl` | `space.2xl` | `clamp(14px, calc(13.257px + 0.19vw), 16px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-2xs` | `space.2xs` | `clamp(4px, calc(3.629px + 0.095vw), 5px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-3xl` | `space.3xl` | `clamp(16px, calc(15.257px + 0.19vw), 18px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-3xs` | `space.3xs` | `clamp(3px, calc(2.629px + 0.095vw), 4px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-4xl` | `space.4xl` | `clamp(18px, calc(17.257px + 0.19vw), 20px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-4xs` | `space.4xs` | `clamp(2px, calc(1.629px + 0.095vw), 3px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-5xl` | `space.5xl` | `clamp(20px, calc(18.514px + 0.381vw), 24px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-6xl` | `space.6xl` | `clamp(24px, calc(22.514px + 0.381vw), 28px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-7xl` | `space.7xl` | `clamp(28px, calc(26.514px + 0.381vw), 32px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-8xl` | `space.8xl` | `clamp(32px, calc(29.029px + 0.762vw), 40px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-9xl` | `space.9xl` | `clamp(40px, calc(37.029px + 0.762vw), 48px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-l` | `space.l` | `clamp(10px, calc(9.257px + 0.19vw), 12px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-m` | `space.m` | `clamp(8px, calc(7.257px + 0.19vw), 10px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-px` | `space.px` | `1px` | GB studio-tokens.css (theme free) |  |
| `--st-space-s` | `space.s` | `clamp(6px, calc(5.257px + 0.19vw), 8px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-xl` | `space.xl` | `clamp(12px, calc(11.257px + 0.19vw), 14px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-space-xs` | `space.xs` | `clamp(5px, calc(4.629px + 0.095vw), 6px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-spotlight-w` | `spotlight.width` | `640px` | GB studio-tokens.css (theme free) |  |
| `--st-success` | `color.state.success.fill` | dark `#34d399`, light `#047857` | GB studio-tokens.css (dark and light) |  |
| `--st-success-10` | `color.state.success.tint-10` | `rgba(52, 211, 153, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-success-text` | `color.state.success.on-tint` | dark `#d1fae5`, light `#047857` | GB studio-tokens.css (dark and light) | Text placed on the 10% tint. |
| `--st-target-min` | `size.target-min` | `24px` | GB studio-tokens.css (theme free) |  |
| `--st-text` | `color.text.default` | dark `#ededed`, light `#1f2937` | GB studio-tokens.css (dark and light) |  |
| `--st-text-2xl` | `font.size.2xl` | `clamp(16px, calc(15.257px + 0.19vw), 18px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-text-2xs` | `font.size.2xs` | `clamp(9px, calc(8.629px + 0.095vw), 10px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-text-3xl` | `font.size.3xl` | `clamp(18px, calc(17.257px + 0.19vw), 20px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-text-3xs` | `font.size.3xs` | `clamp(8px, calc(7.629px + 0.095vw), 9px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-text-4xl` | `font.size.4xl` | `clamp(20px, calc(18.514px + 0.381vw), 24px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-text-5xl` | `font.size.5xl` | `clamp(24px, calc(22.514px + 0.381vw), 28px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-text-6xl` | `font.size.6xl` | `clamp(32px, calc(29.029px + 0.762vw), 40px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-text-7xl` | `font.size.7xl` | `clamp(40px, calc(34.057px + 1.524vw), 56px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-text-bright` | `color.text.bright` | dark `#f4f4f5`, light `#111827` | GB studio-tokens.css (dark and light) |  |
| `--st-text-disabled` | `color.text.disabled` | dark `#52525b`, light `#9ca3af` | GB studio-tokens.css (dark and light) |  |
| `--st-text-l` | `font.size.l` | `clamp(13px, calc(12.629px + 0.095vw), 14px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-text-m` | `font.size.m` | `clamp(12px, calc(11.629px + 0.095vw), 13px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-text-muted` | `color.text.muted` | dark `#a1a1aa`, light `#4b5563` | GB studio-tokens.css (dark and light) |  |
| `--st-text-placeholder` | `color.text.placeholder` | `var(--st-text-subtle)` | GB studio-tokens.css (dark and light) | Alias of color.text.subtle. A11y note kept as $description. |
| `--st-text-s` | `font.size.s` | `clamp(11px, calc(10.629px + 0.095vw), 12px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-text-subtle` | `color.text.subtle` | dark `#8f8f8f`, light `#56606e` | GB studio-tokens.css (dark and light) | A11y note kept as $description. |
| `--st-text-xl` | `font.size.xl` | `clamp(14px, calc(13.257px + 0.19vw), 16px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-text-xs` | `font.size.xs` | `clamp(10px, calc(9.629px + 0.095vw), 11px)` | GB studio-tokens.css (theme free) | Fluid. The build rebuilds the clamp() from min and max between the 380px and 1440px viewports, so the middle term can differ in the third decimal. |
| `--st-toast-inset` | `toast.inset` | `16px` | GB studio-tokens.css (theme free) |  |
| `--st-toast-max-w` | `toast.width.max` | `420px` | GB studio-tokens.css (theme free) |  |
| `--st-tooltip-max-w` | `tooltip.width.max` | `240px` | GB studio-tokens.css (theme free) |  |
| `--st-topbar-h` | `shell.topbar.height` | `36px` | GB studio-tokens.css (theme free) |  |
| `--st-tracking-caps` | `font.tracking.caps`, `font.tracking.none` | `0.07em`; Arabic `0` | GB studio-tokens.css (theme free, :lang(ar)) | DTCG dimensions allow only px and rem, so em tracking is a number with $extensions ds.unit em. The :lang(ar) override (0) maps to font.tracking.none. |
| `--st-tracking-eyebrow` | `font.tracking.eyebrow`, `font.tracking.none` | `0.12em`; Arabic `0` | GB studio-tokens.css (theme free, :lang(ar)) | DTCG dimensions allow only px and rem, so em tracking is a number with $extensions ds.unit em. The :lang(ar) override (0) maps to font.tracking.none. |
| `--st-viz-1` | `color.chart.categorical.1` | `#3987e5` | GB studio-tokens.css (theme free) | Fixed order, never cycled. |
| `--st-viz-2` | `color.chart.categorical.2` | `#d95926` | GB studio-tokens.css (theme free) | Fixed order, never cycled. |
| `--st-viz-3` | `color.chart.categorical.3` | `#199e70` | GB studio-tokens.css (theme free) | Fixed order, never cycled. |
| `--st-viz-4` | `color.chart.categorical.4` | `#c98500` | GB studio-tokens.css (theme free) | Fixed order, never cycled. |
| `--st-viz-5` | `color.chart.categorical.5` | `#d55181` | GB studio-tokens.css (theme free) | Fixed order, never cycled. |
| `--st-viz-6` | `color.chart.categorical.6` | `#9085e9` | GB studio-tokens.css (theme free) | Fixed order, never cycled. |
| `--st-viz-axis` | `color.chart.axis` | `#383835` | GB studio-tokens.css (theme free) |  |
| `--st-viz-grid` | `color.chart.grid` | `#2c2c2a` | GB studio-tokens.css (theme free) |  |
| `--st-viz-muted` | `color.chart.muted` | `#7a7a7a` | GB studio-tokens.css (theme free) | Other and context series. |
| `--st-viz-on-dark` | `color.chart.on-dark` | `#ffffff` | GB studio-tokens.css (theme free) | Text on dark chart bins. |
| `--st-viz-on-light` | `color.chart.on-light` | `#111827` | GB studio-tokens.css (theme free) | Text on light chart bins. |
| `--st-viz-ord-1` | `color.chart.ordinal.1` | `#cde2fb` | GB studio-tokens.css (theme free) |  |
| `--st-viz-ord-2` | `color.chart.ordinal.2` | `#9ec5f4` | GB studio-tokens.css (theme free) |  |
| `--st-viz-ord-3` | `color.chart.ordinal.3` | `#6da7ec` | GB studio-tokens.css (theme free) |  |
| `--st-viz-ord-4` | `color.chart.ordinal.4` | `#3987e5` | GB studio-tokens.css (theme free) |  |
| `--st-viz-ord-5` | `color.chart.ordinal.5` | `#256abf` | GB studio-tokens.css (theme free) |  |
| `--st-viz-ord-6` | `color.chart.ordinal.6` | `#184f95` | GB studio-tokens.css (theme free) |  |
| `--st-viz-seq-0` | `color.chart.sequential.1` | `#163a63` | GB studio-tokens.css (theme free) | Steps renumbered from 0 to 5 to 1 to 6. |
| `--st-viz-seq-1` | `color.chart.sequential.2` | `#184f95` | GB studio-tokens.css (theme free) | Steps renumbered from 0 to 5 to 1 to 6. |
| `--st-viz-seq-2` | `color.chart.sequential.3` | `#1c5cab` | GB studio-tokens.css (theme free) | Steps renumbered from 0 to 5 to 1 to 6. |
| `--st-viz-seq-3` | `color.chart.sequential.4` | `#256abf` | GB studio-tokens.css (theme free) | Steps renumbered from 0 to 5 to 1 to 6. |
| `--st-viz-seq-4` | `color.chart.sequential.5` | `#6da7ec` | GB studio-tokens.css (theme free) | Steps renumbered from 0 to 5 to 1 to 6. |
| `--st-viz-seq-5` | `color.chart.sequential.6` | `#b7d3f6` | GB studio-tokens.css (theme free) | Steps renumbered from 0 to 5 to 1 to 6. |
| `--st-warning` | `color.state.warning.fill` | dark `#f59e0b`, light `#b45309` | GB studio-tokens.css (dark and light) |  |
| `--st-warning-10` | `color.state.warning.tint-10` | `rgba(245, 158, 11, 0.1)` | GB studio-tokens.css (dark and light) |  |
| `--st-warning-text` | `color.state.warning.on-tint` | dark `#fde68a`, light `#92400e` | GB studio-tokens.css (dark and light) | Text placed on the 10% tint. |
| `--st-weight-bold` | `font.weight.bold` | `700` | GB studio-tokens.css (theme free) |  |
| `--st-weight-medium` | `font.weight.medium` | `500` | GB studio-tokens.css (theme free) |  |
| `--st-weight-menu` | `font.weight.menu` | `560` | GB studio-tokens.css (theme free) |  |
| `--st-weight-regular` | `font.weight.regular` | `400` | GB studio-tokens.css (theme free) |  |
| `--st-weight-semibold` | `font.weight.semibold` | `600` | GB studio-tokens.css (theme free) |  |
| `--st-window-backdrop` | `window.backdrop.bg` | `#00000066` | GB studio-tokens.css (theme free) | Component token. The dim behind a window that opens over the page. |
| `--st-window-backdrop-blur` | `blur.backdrop` | `10px` | GB studio-tokens.css (theme free) | Desk value of blur.backdrop. |
| `--st-window-close` | `duration.window-close` | `220ms`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-window-ease` | `ease.window` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | GB studio-tokens.css (theme free) |  |
| `--st-window-open` | `duration.window-open` | `300ms`; reduced motion `0ms` | GB studio-tokens.css (theme free, reduced motion) | Zeroed under prefers-reduced-motion; the build emits that block for every duration and delay. |
| `--st-z-canvas` | `z.canvas` | `0` | GB studio-tokens.css (theme free) |  |
| `--st-z-canvas-floating-toolbar` | `z.canvas-floating-toolbar` | `15` | GB studio-tokens.css (theme free) |  |
| `--st-z-canvas-notch` | `z.canvas-notch` | `53` | GB studio-tokens.css (theme free) |  |
| `--st-z-canvas-overlay` | `z.canvas-overlay` | `50` | GB studio-tokens.css (theme free) |  |
| `--st-z-canvas-selection` | `z.canvas-selection` | `51` | GB studio-tokens.css (theme free) |  |
| `--st-z-dialog` | `z.dialog` | `9500` | GB studio-tokens.css (theme free) |  |
| `--st-z-dropdown` | `z.dropdown` | `20` | GB studio-tokens.css (theme free) |  |
| `--st-z-floating-panel` | `z.floating-panel` | `50` | GB studio-tokens.css (theme free) |  |
| `--st-z-menu` | `z.menu` | `9800` | GB studio-tokens.css (theme free) |  |
| `--st-z-sidebar` | `z.sidebar` | `55` | GB studio-tokens.css (theme free) |  |
| `--st-z-spotlight` | `z.spotlight` | `9000` | GB studio-tokens.css (theme free) |  |
| `--st-z-toast` | `z.toast` | `10000` | GB studio-tokens.css (theme free) |  |
| `--st-z-toolbar-popover` | `z.toolbar-popover` | `201` | GB studio-tokens.css (theme free) |  |
| `--st-z-tooltip` | `z.tooltip` | `10001` | GB studio-tokens.css (theme free) |  |
| `--st-z-topbar` | `z.topbar` | `30` | GB studio-tokens.css (theme free) |  |

## Figma-Killer-2 globals.css

Tokens taken from FK2 that GB does not carry: Studio Light, inspector, canvas and
chart values. FK2 tokens not listed here (syntax colours, device bezel, plugin
tints, tree drop lines, the text scale settings) are product specific and are
not part of the system yet.

| Old name | New name | Value | Source | Notes |
| --- | --- | --- | --- | --- |
| `--control-label-w` | `control-row.label.width` | 100px | FK2 globals.css |  |
| `--control-row-h` | `control-row.height` | 28px | FK2 globals.css |  |
| `--inspector-pad-x` | `inspector.padding.inline` | 12px | FK2 globals.css |  |
| `--inspector-header-h` | `inspector.header.height` | 32px | FK2 globals.css |  |
| `--inspector-field-gap` | `inspector.field.gap` | 6px | FK2 globals.css |  |
| `--inspector-group-gap` | `inspector.group.gap` | 8px | FK2 globals.css |  |
| `--inspector-caption-gap` | `inspector.caption.gap` | 3px | FK2 globals.css |  |
| `--inspector-label-w` | `inspector.label.width` | 68px | FK2 globals.css |  |
| `--inspector-rail-w` | `inspector.rail.width` | 32px | FK2 globals.css |  |
| `--inspector-field-radius` | `inspector.field.radius` | 8px | FK2 globals.css | Alias of radius.field. |
| `--inspector-accent-dark` | `inspector.accent.dark` | `#7efff5` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--inspector-accent-light` | `inspector.accent.light` | `#6911d4` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-frame-paper` | `canvas.frame.paper` | `#ffffff` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-frame-paper-dark` | `canvas.frame.paper-dark` | `#121212` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-comment-pin` | `canvas.comment.pin` | `#ffb020` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-comment-pin-text` | `canvas.comment.pin-text` | `#1a1200` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-comment-pin-ring` | `canvas.comment.pin-ring` | `#ffffff` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-comment-pin-resolved` | `canvas.comment.pin-resolved` | `#6b6b6b` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-comment-pin-stale` | `canvas.comment.pin-stale` | `#ff5c5c` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-prototype-link` | `canvas.prototype.link` | `#38bdf8` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-prototype-link-draft` | `canvas.prototype.link-draft` | `#7dd3fc` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-prototype-drop-wash` | `canvas.prototype.drop-wash` | `rgba(56, 189, 248, 0.12)` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-measure-line-color` | `canvas.measure.line` | `#e8384f` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-measure-pill-bg` | `canvas.measure.pill-bg` | `#e8384f` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-measure-pill-text` | `canvas.measure.pill-text` | `#fff5f6` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-measure-padding-fill` | `canvas.measure.padding-fill` | `rgba(151, 118, 233, 0.3)` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-measure-padding-line` | `canvas.measure.padding-line` | `#9776e9` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-measure-padding-text` | `canvas.measure.padding-text` | `#f7f4ff` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-flow-code` | `canvas.flow.code` | `#8e9bb0` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-flow-code-chip` | `canvas.flow.code-chip` | `#1c2129` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-flow-code-chip-text` | `canvas.flow.code-chip-text` | `#d7dee9` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-flow-design` | `canvas.flow.design` | `#00d1a0` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-flow-design-text` | `canvas.flow.design-text` | `#04211a` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--canvas-ruler-guide-color` | `canvas.ruler.guide` | `#b14eff` | FK2 globals.css | Fixed in every style and scheme: it sits on the user page, not on the chrome. |
| `--bg-*, --border-*, --text-*, --overlay-*, --scrim-*, --accent-*` | see the GB rows | same as GB | FK2 globals.css | GB studio-tokens.css carries the FK2 values; the GB rows above are the record. |
| `[data-editor-theme=light] block` | `packages/styles/studio/tokens.light.json` | see file | FK2 globals.css | Studio Light. Where GB made an A11y change to an FK2 value (text subtle #6b7280 to #56606e), the GB value wins and the note is kept. |
| `--canvas-selector-ring-color` | `color.canvas.selector` | `#ff8800` | FK2 globals.css | Light value darkened to #a85400 (first pass). |
| `--inspector-field-bg` | `inspector.field.bg` | dark `#212426`, light `#f3f4f6` | FK2 globals.css |  |
| `--inspector-field-bg-hover` | `inspector.field.bg-hover` | `var(--overlay-10)` | FK2 globals.css | Alias. |
| `--inspector-divider` | `inspector.divider` | `var(--overlay-10)` | FK2 globals.css | Alias. |
| `--inspector-section-label-color` | `inspector.section.label` | dark `#8f9da3`, light `#495e74` | FK2 globals.css |  |
| `--inspector-row-h` | `inspector.row.height` | `32px` | FK2 globals.css | Same value as GB --st-dense-row-h. |
| `--inspector-space-*` | `space.fixed.*` | 2px to 12px | FK2 globals.css | Same values as GB --st-fixed-*. |
| `--chart-default-tint` | `chart.default-tint` | `var(--accent-4)` | FK2 globals.css | Alias. |
| `--chart-series-min` | `chart.series.min` | `#38bdf8` | FK2 globals.css |  |
| `--chart-series-min-glow` | `chart.series.min-glow` | `rgba(56, 189, 248, 0.4)` | FK2 globals.css |  |
| `--chart-series-max` | `chart.series.max` | `#4ade80` | FK2 globals.css |  |
| `--chart-series-max-glow` | `chart.series.max-glow` | `rgba(74, 222, 128, 0.4)` | FK2 globals.css |  |
| `--chart-segment-empty` | `chart.segment.empty` | `var(--overlay-5)` | FK2 globals.css | Alias. --chart-segment-empty-border has the same value and folds in. |
| `--chart-track-bg` | `chart.track.bg` | `var(--overlay-5)` | FK2 globals.css | Alias. |

## Names added to the contract

Names `packages/tokens/src/contract.json` adds to the table in section 3.6 of
PLAN.md, so every source token has a home:

- `color.bg`: `overlay-solid`, `overlay-40`, `overlay-50`, `overlay-60`, `overlay-70`, `overlay-80`, `overlay-90`, `scrim-solid`, `scrim-10`, `scrim-20`, `scrim-30`, `scrim-40`, `scrim-50`, `scrim-60`, `scrim-70`, `scrim-80`, `scrim-90`
- `color.material`: `glass-flat`, `glass-border`, `glass-hover`
- `color.border`: `control-hover`
- `color.text`: `placeholder`, `dim`
- `color.state`: `danger.on-tint`, `warning.on-tint`, `success.on-tint`, `info.on-tint`
- `color.chart`: `muted`, `ordinal.1`, `ordinal.2`, `ordinal.3`, `ordinal.4`, `ordinal.5`, `ordinal.6`, `on-dark`, `on-light`
- `space`: `px`
- `font.leading`: `display`, `arabic.tight`, `arabic.snug`, `arabic.normal`, `arabic.relaxed`
- `font.tracking`: `display`, `none`
- `duration`: `shimmer`, `spin`, `roll`
- `delay`: `peek-hide`, `reveal-step`
- `ease`: `default`, `in`, `out`
