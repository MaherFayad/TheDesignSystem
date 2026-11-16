# Compare gb-dialog-desk: Desk dialog against the GoBanana Studio dialog

Run 2026-11-16T11:27:36.771Z. Viewport 1440 by 900, dark scheme.
Audit: docs/reports/audit/fidelity-gobanana.md, fid-gb shot 08, 08-dialog-1440.png. A GoBanana dialog is a plain solid panel with surface-2 header and footer bands and a 12px radius; the Desk dialog is glass with window lights, a yellow title bar and a 16px radius.

- Source (gb): `/__design?theme=dark&dir=ltr`. GoBanana's Studio primitives page, dark, left to right, Dialog and toasts section: press Share canvas. The md Studio dialog (components/studio/Dialog.tsx) opens.
- System: `/c/dialog?style=desk&scheme=dark&dir=ltr&lang=en&case=variants&chrome=0`
- GoBanana at commit 216625c, from a copy at <scratch>/gb/banana-server, next dev, E2E_AUTH_BYPASS=1 ADMIN_FIXTURES=1 DATABASE_URL empty
- System: the React gallery (apps/gallery-react, vite dev) from this checkout
- Source fonts loaded: Inter Variable
- System: data-style desk, data-platform web, data-glass regular
- System fonts loaded: Instrument Sans, IBM Plex Sans Arabic

Result: 3 pass, 12 fail, 0 allowed.

| Region | Probe | Property | Source | System | Difference | Tolerance | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| panel | width | width | 440px | 440px | 0px | 1px | pass |
| panel | background-color | background-color | rgb(27, 27, 27) | rgba(33, 33, 33, 0.9) | Delta E 8.94 | Delta E 2 | fail |
| panel | border-radius | border-radius | 12px | 16px | +4px | equal | fail |
| panel | border-width | border-width | 1px | 1px | 0px | equal | pass |
| panel | box-shadow | box-shadow | rgba(0, 0, 0, 0.28) 0px 18px 48px 0px | rgba(255, 255, 255, 0.16) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.55) 0px 0px 0px 1px, rgba(0, 0, 0, 0.6) 0px 8px 24px -6px, rgba(0, 0, 0, 0.85) 0px 30px 80px -20px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 1 against 5 layers | 1px, Delta E 2 | fail |
| panel | backdrop-filter | backdrop-filter | none | blur(24px) saturate(1.3) | differs | equal | fail |
| panel | window lights | count | absent | 1 | +1 | equal | fail |
| panel | header fill | background-color | rgb(40, 40, 40) | rgba(255, 216, 77, 0.12) | Delta E 75.64 | Delta E 2 | fail |
| panel | header height | height | 52.969px | 36px | -16.97px | 1px | fail |
| panel | title size | font-size | 15.993px | 14px | -1.99px | equal | fail |
| panel | title weight | font-weight | 600 | 600 | 0 | equal | pass |
| panel | title tracking | letter-spacing | normal | -0.56px | -0.04em | 0.01em | fail |
| panel | footer fill | background-color | rgb(40, 40, 40) | rgba(0, 0, 0, 0) | Delta E 75.87 | Delta E 2 | fail |
| scrim | scrim fill | background-color | color(srgb 0 0 0 / 0.5) | rgba(0, 0, 0, 0.55) | Delta E 5.04 | Delta E 2 | fail |
| scrim | scrim blur | backdrop-filter | none | blur(24px) saturate(1.3) | differs | equal | fail |
