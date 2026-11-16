# Compare gb-button-desk: Desk buttons against GoBanana Studio buttons

Run 2026-11-16T11:27:27.613Z. Viewport 1440 by 900, dark scheme.
Audit: docs/reports/audit/fidelity-gobanana.md, fid-gb shot 04, 04-buttons-inputs-desk-1440.png. Desk buttons are 36px glass pills with -0.04em tracking; the source button is a flat 28px control with a 1em radius and no tracking.

- Source (gb): `/__design?theme=dark&dir=ltr`. GoBanana's Studio primitives page (app/%5F_design, served at /__design in development), dark, left to right, the Buttons section. The system's default size md stands for the source's default control, st-btn sm at 28px (fidelity-gobanana.md, change 4).
- System: `/c/button?style=desk&scheme=dark&dir=ltr&lang=en&case=variants&chrome=0`
- GoBanana at commit 216625c, from a copy at <scratch>/gb/banana-server, next dev, E2E_AUTH_BYPASS=1 ADMIN_FIXTURES=1 DATABASE_URL empty
- System: the React gallery (apps/gallery-react, vite dev) from this checkout
- Source fonts loaded: Inter Variable
- System: data-style desk, data-platform web, data-glass regular
- System fonts loaded: Instrument Sans, IBM Plex Sans Arabic

Result: 7 pass, 13 fail, 0 allowed.

| Region | Probe | Property | Source | System | Difference | Tolerance | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| secondary | height | height | 28px | 35.984px | +7.98px | 1px | fail |
| secondary | font-size | font-size | 11.997px | 13px | +1px | equal | fail |
| secondary | font-weight | font-weight | 700 | 700 | 0 | equal | pass |
| secondary | letter-spacing | letter-spacing | normal | -0.52px | -0.04em | 0.01em | fail |
| secondary | border-radius | border-radius | 11.997px | 17.992px | +6px | equal | fail |
| secondary | border-width | border-width | 1px | 1px | 0px | equal | pass |
| secondary | padding-inline-start | padding-inline-start | 7.993px | 16px | +8.01px | 1px | fail |
| secondary | background-color | background-color | rgba(255, 255, 255, 0.1) | rgba(255, 255, 255, 0.08) | Delta E 1.54 | Delta E 2 | pass |
| secondary | color | color | rgb(237, 237, 237) | rgb(237, 237, 237) | Delta E 0 | Delta E 2 | pass |
| secondary | box-shadow | box-shadow | none | rgba(255, 255, 255, 0.18) 0px 1px 0px 0px inset, rgba(255, 255, 255, 0.13) 0px 0px 0px 1px inset | 0 against 2 layers | 1px, Delta E 2 | fail |
| secondary | transition-duration | transition-duration | 0.15s, 0.15s, 0.15s, 0.15s, 0.15s | 0.38s | +230ms | 10ms or 10 percent | fail |
| primary | height | height | 28px | 35.984px | +7.98px | 1px | fail |
| primary | font-size | font-size | 11.997px | 13px | +1px | equal | fail |
| primary | font-weight | font-weight | 700 | 700 | 0 | equal | pass |
| primary | letter-spacing | letter-spacing | normal | -0.52px | -0.04em | 0.01em | fail |
| primary | border-radius | border-radius | 11.997px | 17.992px | +6px | equal | fail |
| primary | padding-inline-start | padding-inline-start | 7.993px | 16px | +8.01px | 1px | fail |
| primary | background-color | background-color | rgb(255, 216, 77) | rgb(255, 216, 77) | Delta E 0 | Delta E 2 | pass |
| primary | color | color | rgb(17, 24, 39) | rgb(17, 24, 39) | Delta E 0 | Delta E 2 | pass |
| primary | box-shadow | box-shadow | none | rgba(255, 255, 255, 0.18) 0px 1px 0px 0px inset | 0 against 1 layers | 1px, Delta E 2 | fail |
