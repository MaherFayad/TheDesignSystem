# Docs site on Vercel

Agent: ds-docs. Branch `claude/relaxed-hypatia-7gseap`, not committed.

## The URL

<https://the-system-docs.vercel.app>

Vercel project `the-system-docs`, a static deployment with no build on
Vercel, no git repository connected, no custom domain.

## What changed

| File | Change |
| --- | --- |
| `apps/gallery-react/vite.config.ts` | `base` from `GALLERY_BASE`, default `/`. |
| `apps/gallery-react/src/router.tsx` | Reads the base from `import.meta.env.BASE_URL`. `useUrl` strips it, `navigate` and `Link` add it. With the default base nothing changes. `App.tsx` is untouched. |
| `apps/docs/scripts/gallery.ts` | New. The gallery URL (`DOCS_GALLERY_URL`, default `http://localhost:4173`), and a build hook that turns `gallery:/path` links on hand written pages into gallery URLs. |
| `apps/docs/astro.config.ts` | Adds that hook. A remark plugin would need `@astrojs/markdown-remark`, which is not a dependency, so the hook rewrites the built HTML. |
| `apps/docs/scripts/gen-pages.ts` | Reads the gallery URL from `gallery.ts`; resolves `gallery:` links in the Markdown twins. |
| `apps/docs/scripts/render.ts` | When the gallery is bundled, the note under a preview says what it is and links to the same view as a full gallery page, instead of "needs the gallery running at". |
| `apps/docs/public/docs.js` | Keeps that link in step with the preview selects. |
| `apps/docs/src/content/docs/index.md`, `ar/index.md` | New section "Try it in the browser": open the component gallery, open the interactions page, every demo on one page, and "What to test" (Neutral, Studio and Desk; light and dark; density; Arabic right to left). The Arabic links open the gallery with `dir=rtl&lang=ar`. |
| `apps/docs/vercel.json` | Clean URLs, the rewrite of `/gallery` and `/gallery/*` to the gallery's `index.html`, one year immutable cache for `/_astro/*` and `/gallery/assets/*`. |
| `apps/docs/scripts/static-host.ts` | New. Resolves a path the way the host does with `vercel.json`. Shared by the link check and the local server. |
| `apps/docs/scripts/check-links.ts` | Resolves through `static-host.ts`. When the gallery is bundled, every `/gallery/c/<slug>` link must name a gallery route. |
| `apps/docs/scripts/build-site.ts` | New. Docs build, then the gallery into `dist/gallery/` with base `/gallery/`, then the link check. |
| `apps/docs/scripts/serve-site.ts` | New. Serves `dist` with the same rules as `vercel.json`, port 4400. |
| `apps/docs/scripts/deploy-vercel.ts` | New. Uploads only the files Vercel lacks (by SHA1), creates the deployment through the REST API, waits until ready. |
| `apps/docs/package.json` | Scripts `build:site`, `serve:site`, `deploy:site`. |

`npm run build`, `npm run check` and the contract suite are unchanged: without
the env variables the gallery runs at the origin root and the docs previews
point at `http://localhost:4173`.

## Commands

- Build: `npm run build:site -w @the-system/docs`
- Serve locally: `npm run serve:site -w @the-system/docs`
- Redeploy production: `npm run build:site -w @the-system/docs && npm run deploy:site -w @the-system/docs -- --prod`
- Deploy a preview: `npm run build:site -w @the-system/docs && npm run deploy:site -w @the-system/docs`

Auth: in a session behind the agent proxy no token is needed. Elsewhere set
`VERCEL_TOKEN`. `VERCEL_TEAM_ID` and `VERCEL_PROJECT` override the scope and
the project name. The `deploy:site` script sets `NODE_USE_ENV_PROXY=1` so
Node's `fetch` uses `HTTPS_PROXY`; on a machine with no proxy it does nothing.

## Verified

Locally, on `serve:site`, and live, on <https://the-system-docs.vercel.app>,
with Playwright (chromium), 23 of 23 checks each time:

- Home in English and Arabic load and link to `/gallery/` and
  `/gallery/interactions`.
- Button, Dialog and Select pages in English and Arabic: each preview
  iframe renders the demo (341, 47 and 89 elements), right to left on the
  Arabic pages.
- Changing the style select moves the iframe and the "open in the gallery"
  link to `style=desk`.
- `/gallery/c/button?style=desk&scheme=dark` renders with `data-style=desk`
  and `data-scheme=dark`.
- Gallery navigation keeps the base: "Every demo" goes to `/gallery/all`,
  index links are `/gallery/c/<slug>`.
- `/gallery/interactions` renders; `/gallery/c/button` in Studio, light,
  right to left renders mirrored.
- No 4xx or 5xx response and no page error on any of these.
- Live by curl: `/`, `/ar/`, `/components/button`, `/llms.txt`,
  `/gallery/all` return 200; `/nope` returns 404; hashed assets carry
  `cache-control: public, max-age=31536000, immutable`; `/index.html`
  redirects to `/`.
- Link check on the site build: 241 pages, 42189 internal links, every
  manifest page and twin, every gallery route link, no dash.

Screenshots in `docs/reports/shots/docs-site/`: `local-*` from the local
server, `live-*` from the live URL.

## Decisions

1. The gallery ships inside the docs at `/gallery/`, so one static host
   serves both. `SITE_GALLERY_PATH` changes the path.
2. The rewrite points at `/gallery/`, not `/gallery/index.html`: with clean
   URLs Vercel strips `.html`, and a rewrite to the `.html` file returned 404
   on the first deploy.
3. Hand pages write gallery links as `gallery:/path`, resolved at build time,
   so the same page works with a local gallery and the bundled one. In
   `astro dev` these links stay as written.
4. Deploys go through the REST API from a script, not the Vercel CLI or the
   MCP tools: about 1000 files, and a redeploy uploads only changed files.

## For the owner

- The team uses Vercel's standard deployment protection. The production
  address `the-system-docs.vercel.app` is public and is the one to share.
  Preview addresses (the ones with a hash in the name) ask for a Vercel login.
  To share previews too, switch off Vercel Authentication in the project's
  Settings, Deployment Protection. Nothing else needs to change.
- The first deploy of a new Vercel project goes to production even without
  `--prod`, so the first version went live at once. It had the rewrite bug
  above; the current production deployment has the fix and passes every
  check.
- The Vercel MCP connection in this session is not authorized for the team
  (403 on the share link tool). That does not affect the deploy script.
