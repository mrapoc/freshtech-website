# Fresh Tech Website: project guide

Marketing site for Fresh Tech, an MSP (managed IT support) serving Shropshire,
Herefordshire, Worcestershire and Powys. Lead-gen focused. Architecture lives in
[ARCHITECTURE.md](ARCHITECTURE.md), commands in [DEVELOPMENT.md](DEVELOPMENT.md);
this file is the operating guide: read it before making changes.

## Stack
- Production is the **Astro 7** static site in `prototypes/html-first-slice/`, served by **Apache with small PHP handlers on 20i**.
- Pages emit static HTML. PHP handlers live under `server/api/` in that project; private configuration stays outside `public_html`.
- The repository root holds shared content (`data/`, `content/`), the Apache routing source (`hosting/routing.json`), the sitemap/RSS generators, and the gate, packaging and deploy scripts in `scripts/`. The root `package.json` only provides Playwright for the browser gate and the Cloudinary upload helper.
- The former React/Vite app and its Netlify rollback were retired on 30 October 2026. They remain in this repository's Git history and the private `mrapoc/freshtech-website-archive`.

## Content is data-driven: this is the most important thing
Almost every page is generated from data files, not bespoke markup:
- `data/content.ts`: the master file: `services`, `industryPages`, `caseStudies`, `blogPosts`, `locationsData`, `techExplainers`, `problemPages`, `serviceLocationPages`, `comparisonPages`, `teamMembers`, testimonials.
- `data/industryGuides.ts`: `industryGuides` (the `/guides/*` pages).
- `data/pricing.json`, `data/service-pages.json`, `data/navigation.json`, `data/technology-pages.json`: pricing, per-service copy and the services listing, site navigation, and the technology listing.
- `content/*.md`: legal documents (see [LEGAL-PAGES.md](LEGAL-PAGES.md)).

The build never executes these files. `scripts/extract-*.mjs` in the Astro project read them
fail-closed (literal values only in `.ts`; exact fields everywhere) into the gitignored
`src/generated/`. Keep `data/content.ts` as exported literal records: expressions, spreads
and cross-record references fail the build. Adding a record adds its route and checks.
Services, industries, case studies, blog, team, locations, technology and guides reach
the sitemap automatically; problem, comparison, service-location and standalone pages
need a `staticRoutes` entry in `scripts/generate-sitemap.js`. The production output
check fails on any emitted page missing from the sitemap. A new page type also needs its
Astro route in `src/pages/` and its own checks (see below).

## Production site

`prototypes/html-first-slice/` is the Astro site. Run its checks and build
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
- **IndexNow** (Bing and others, not Google): `npm run indexnow:submit` reads the production build's sitemap; live submissions require authorisation. The key file `public/2b725a5296b158e1900494bc69ec6024.txt` is a public verification token shipped with the site.
- The connected `gsc` MCP: `check_alerts` is ranking-only; there is no coverage-report API: inspect URLs individually for indexing status.
- **Redirects and security headers** live in `hosting/routing.json`. Release packaging
  (`scripts/package-static-production.mjs`) compiles them into the Apache `.htaccess`.
  Order matters (first match wins); unknown paths return 404. Verify redirects and real
  HTTP status codes for production changes.

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
- Don't commit build output (`dist/`, `dist-production/`, `src/generated/`, `.artifacts/`).
- Don't put secrets in the repo. The GSC service-account key path is local
  (`GSC_KEY_FILE`); PHP private configuration stays outside `public_html`.

## Workspace standard

Follow [.workspace/STANDARD.md](.workspace/STANDARD.md). Related context and verification
contracts are indexed in [.workspace/project.json](.workspace/project.json).
