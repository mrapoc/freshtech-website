# Fresh Tech website architecture

## Overview

The site is static HTML built by Astro 7 from content files, served by Apache on 20i.
Three small PHP handlers provide the only server-side behaviour. Browser JavaScript is
limited to progressive enhancements (consent banner, contact form, filters, the email
checker); every page works without it.

```
data/*.ts, data/*.json, content/*.md          hosting/routing.json
              │                                        │
   prototypes/html-first-slice/scripts/extract-*.mjs   │
   (read literals fail-closed, never execute)          │
              │                                        │
     src/generated/*.mjs (gitignored)                  │
              │                                        │
     astro build  ──▶  dist-production/                │
              │        + sitemap.xml, rss.xml,         │
              │          robots.txt, IndexNow key      │
              │                                        │
     output checks (every emitted page)                │
              │                                        │
     scripts/package-static-production.mjs  ◀──────────┘
     (.htaccess, upload manifest, PHP handlers)
              │
     scripts/deploy-20i.mjs  ──▶  20i public_html
```

## Content

`data/content.ts` and `data/industryGuides.ts` hold most of the content as exported literal
records. `data/pricing.json`, `data/service-pages.json`, `data/navigation.json` and
`data/technology-pages.json` hold pricing, per-service copy and the services listing, site
navigation and the technology listing. `content/*.md` holds the legal documents, selected by
`content/legal-pages.json`. `data/editorial-holds.json` keeps unapproved posts out of every
output.

The extractors in `prototypes/html-first-slice/scripts/` parse these files without running
them (`scripts/lib/literal-reader.mjs` uses the TypeScript compiler's AST) and reject
expressions, unexpected fields, unsafe links and slugs. They write projections to the
gitignored `src/generated/`, which the Astro pages import.

## Pages

Routes live in `prototypes/html-first-slice/src/pages/`. Record-driven families (services,
case studies, locations, industries, blog, technology, guides, team) use a dynamic route per
family. Problem, comparison and service-location pages share the root-slug dispatcher
`src/pages/[slug].astro`. Standalone pages each have their own route.

The default build is a noindex preview in `dist/`, followed by family-specific output checks.
`PUBLIC_SITE_MODE=production npm run build` writes the indexable release to `dist-production/`,
adds the root files (`scripts/production-root-files.mjs` calls the root sitemap and RSS
generators) and runs the production and emitted-HTML quality checks. See the
[static quality contract](docs/seo/static-quality-contract.md).

## Server side

`prototypes/html-first-slice/server/api/` holds the PHP handlers:

| Handler | Route | Purpose |
| --- | --- | --- |
| `send-email.php` | `POST /api/send-email` | Contact form, sent through SMTP2GO |
| `website-proof.php` | `/api/website-metrics`, `/api/website-feedback` | Serves the nightly public service snapshots |
| `google-rating.php` | `/api/google-rating` | Serves the Google rating aggregate |

Their configuration and the snapshots live in the private folder outside `public_html`.
The website never calls the reporting system directly.

## Routing and headers

`hosting/routing.json` lists the ordered legacy redirects (all 301s, first match wins), the
global security headers and the two cache policies. `scripts/generate-apache-static-config.mjs`
compiles it into the `.htaccess` for each release, adding the static-site Content Security
Policy, the PHP routes, `www` to apex and trailing-slash canonicalisation. There is no
catch-all, so unknown paths return 404.

## Release

A scheduled job on the site owner's Mac (`scripts/deploy-20i-local.mjs`) deploys each new
`main` commit: it checks out the commit, installs locked dependencies, runs
`scripts/quality-gate.mjs` (unit and output contracts, the full build and the browser
suite), builds the production output, packages it and uploads it over SFTP with
`scripts/deploy-20i.mjs`. The upload refuses to overwrite files changed on the server
outside a recorded release. The root `package.json` exists for the gate's Playwright
browser; the site itself depends only on the Astro project's lockfile.

## History

The site was a React 19 / Vite single-page app on Netlify until 22 September 2026, when the
native Astro site went live. The React app and Netlify configuration were kept as a rollback
until 30 October 2026, then removed. They remain in Git history and the private archive
repository.
