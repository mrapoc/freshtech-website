# Fresh Tech Website: project guide

Marketing site for Fresh Tech, an MSP (managed IT support) serving Shropshire,
Herefordshire, Worcestershire and Powys. Lead-gen focused. Deep architecture
lives in [ARCHITECTURE.md](ARCHITECTURE.md) and [README.md](README.md); this
file is the operating guide: read it before making changes.

## Stack
- Production is the native **Astro 7 / Apache / 20i** site in `prototypes/html-first-slice/`, confirmed by public HTML on 22 September 2026.
- The root React 19 / Vite application and Netlify configuration remain the retained migration reference and rollback. Its build commands do not build the live Astro site.
- Native pages emit static HTML. Small PHP handlers live under `server/api/` in the native application; private configuration stays outside `public_html`.

## Content is data-driven: this is the most important thing
Almost every page is generated from data files, not bespoke components:
- `data/content.ts`: the master file: `services`, `industryPages`, `caseStudies`, `blogPosts`, `locationsData`, `techExplainers`, `problemPages`, `teamMembers`.
- `data/industryGuides.ts`: `industryGuides` (the `/guides/*` pages).

Keep `data/content.ts` as independent exported literal records. The production
build splits those records into separate modules; executable expressions and
cross-record references are rejected. Full builds enforce generated-page byte,
heading, canonical and sitemap checks. See DEVELOPMENT.md before changing limits.

For native production, add the relevant source record and implement or extend its
Astro route in `prototypes/html-first-slice/src/pages/`. Follow DEVELOPMENT.md and
the static quality contract; production output checks require sitemap coverage.
Changing `App.tsx` alone does not add a native production route.

**Retained React routing only:** to add a page, add an entry to the relevant record/array. A matching dynamic
route (`/technology/:slug`, `/services/:slug`, `/locations/:city`, etc.) in
[App.tsx](App.tsx) renders it. The sitemap, RSS feed and prerender list **all
auto-derive from these same data files**, so a new data entry flows through
automatically. Standalone pages (their own route, no `:slug`) must be added in
three places: `App.tsx`, `scripts/generate-sitemap.js` (`staticRoutes`), and
`scripts/prerender.js` (`getAllRoutes`).

**Gotcha:** sitemap and prerender route lists must stay in sync. The 4
incident-response pages (`/business-email-compromise`, `/email-account-hacked`,
`/data-breach-discovered`, `/laptop-stolen-lost`) were prerendered but missing
from the sitemap (fixed 2026-06-15). When adding a standalone page, check both.

## Retained React v2 convention
Top conversion routes render their **V2** ports from `pages-v2/` and
`components-v2/`; `Layout` dispatches to `LayoutV2` chrome. When editing one of
these pages, edit the `*V2` version (the non-v2 file in `pages/` may be dead).
Check `App.tsx` imports to see which version a route actually uses.

## Retained React build & checks
- `npm run dev`: local dev (Vite, port 5173).
- `npm run build:no-prerender`: fast build (sitemap + rss + vite). Use for verifying.
- `npm run build`: full build incl. Playwright prerender. The retained Netlify configuration invokes this build; it does not deploy the current Apache site.
- Prerender waits on the canonical tag reflecting the route before snapshotting: don't break that logic in `scripts/prerender.js`.

## Native production site

`prototypes/html-first-slice/` is the active Astro site. Run its checks and build
there; use `PUBLIC_SITE_MODE=production` for release output in `dist-production`.
Read the subproject README and [static quality contract](docs/seo/static-quality-contract.md)
before changing its pages, components, styles or source data. New routes must
enter the generated-output and browser inventories automatically. A new template
also needs its own interaction, no-JavaScript and responsive checks.
Do not raise budgets, exclude a failing route or remove useful content merely to
get a green check. A passed build is not a Google score or a production deployment.
Use the public proof integration and update workflow, kept privately at
`~/Context/FreshTech/Website/internal-docs/docs/seo/public-website-proof.md`, for this feature. Updating an existing site must preserve its live email handler,
private configuration and logs; the initial DNS cutover runbook is historical.
Releases deploy automatically from the site owner's Mac once merged to `main`
(`scripts/deploy-20i-local.mjs`, described in that workflow doc). Never upload to
20i by hand: the next deploy stops on the unrecorded change until it is on `main`.

## SEO & GSC
- Per-page SEO via the `SEO` component (title, meta description, canonical, JSON-LD). Keep titles ≤ ~60 chars, descriptions ~150–160.
- GSC is a **domain property** (`sc-domain:fresh-tech.uk`) → Sitemaps API and URL-prefix features don't work via the service account; URL Inspection + Search Analytics do.
- **Google discovery:** use the sitemap for ordinary marketing and article pages. Google's Indexing API only supports verified `JobPosting` or `BroadcastEvent` within `VideoObject`; it is not a general recrawl API. `gsc:submit` requires explicit eligible URLs and `--eligible-type`, and supports a credential-free `--dry-run`. Do not submit ordinary sitemap URLs or interpret notification acceptance as indexing proof.
- **Retained Netlify deployment only:** its configuration runs `indexnow-submit.mjs --new-vs-live` for IndexNow engines, non-fatally. Google does not use IndexNow; its discovery remains sitemap/link based. IndexNow key file: `public/2b725a5296b158e1900494bc69ec6024.txt` (public verification token). Manual use: `npm run indexnow:submit`. Live submissions still require authorisation.
- The connected `gsc` MCP: `check_alerts` is ranking-only; there is no coverage-report API: inspect URLs individually for indexing status.
- Native release packaging (`scripts/package-static-production.mjs`) generates Apache
  `.htaccess`. Verify its redirects and real HTTP status codes for production changes.
- **Retained React/Netlify redirects only:** redirects live in both `netlify.toml` (edge 301s: authoritative for bots) and `data/legacyRedirects.ts` (client-side fallback). The SPA catch-all returns HTTP 200, so unknown URLs are a soft-404 risk; don't flip it to 404 without first porting the client-side-only redirects to the edge.

## Content rules (non-negotiable)
- **UK spelling.** Voice: plain-English, analogy-led, no jargon, no hype. Match the tone of existing `techExplainers`/blog entries.
- **Human editorial voice across website and social posts.** No emoji-led lists or emoji bullets. Prefer natural sentences and ordinary bullets when useful. Avoid generic hooks, formulaic summaries, engagement bait and repeated templates. Use specific, supported details; never invent personal experience, customer stories or quotations to sound human. Drafts get an independent review against these rules before publication.
- **No em dashes (`—`) anywhere in public copy** (blog posts, pages, titles, meta descriptions). They read as AI-generated. Use commas, colons, brackets, or full stops instead. A plain spaced hyphen is acceptable if a dash is genuinely needed.
- **Truthful claims only.** No fabricated accreditations, vendor badges, or stats. Pricing is "from £40". When in doubt, leave it out.
- **Competitors: data-led, never named.** Imply gaps via evidence; never disparage a named provider (UK malicious-falsehood risk).
- **Analytics gated behind cookie consent**: never re-add auto-loading GA4/Clarity.
- **Public service figures and feedback** come only from the nightly snapshots the reporting system writes to the site's private folder (`private/website-proof/published/`), served by the native same-origin handlers. The website never calls the reporting system. No ReportData fallback, figures in source or unapproved ticket definition. See the private public-proof contract (above).

## Public repository
This repository is public. Commit only what is fine on the live site or is
ordinary source. Keep these in `~/Context/FreshTech/Website/`, never here:
unapproved article drafts, marketing and sales plans, campaign scripts, SEO
strategy and Search Console data, competitor research, recruitment handling,
hosting account details, customer information and internal reviews. Never
name competitors. Secrets stay in private configuration, never in Git.

## Don't
- Don't re-block AI crawlers in `public/robots.txt`. Training **and** search/citation crawlers (GPTBot, Google-Extended, ClaudeBot, CCBot, Applebot-Extended, etc.) are intentionally **allowed** (Sam's decision, 2026-06-15) to maximise AI-answer visibility. The earlier "block training" stance was reversed.
- Don't commit `dist/` (untracked) or the build-regenerated `public/sitemap.xml`/`rss.xml` date churn unless the change is intentional.
- Don't put secrets in the repo. The GSC service-account key path is local
  (`GSC_KEY_FILE`); native PHP private configuration stays outside `public_html`.
  Netlify environment configuration belongs to the retained rollback only.

## Workspace standard

Follow [.workspace/STANDARD.md](.workspace/STANDARD.md). Related context and verification
contracts are indexed in [.workspace/project.json](.workspace/project.json).
