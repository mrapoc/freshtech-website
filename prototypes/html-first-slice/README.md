# Fresh Tech native static migration

This Astro application is the active native production site on Apache/20i,
confirmed from public HTML on 22 September 2026. The React application it replaced
was retired on 30 October 2026; references to React pages below are migration history.
The default build is a disabled,
noindex preview; `PUBLIC_SITE_MODE=production npm run build` emits release files
to `dist-production`. Current builds contain 242 pages.

The anonymous public-proof integration, its release status and safe update
procedure are documented privately with the site owner's release notes.
The page-family descriptions below record migration history.

The verified preview contains191 native pages: homepage, pricing, disabled
contact,12 service pages,14 case-study pages,42 location pages,17 industry pages,
50 blog pages,28 service-location pages,18 technology pages and7 industry guides.
The locally integrated Problem family renders another15 pages, for206 native pages.

Every new page, component and source-data change must follow
[`docs/seo/static-quality-contract.md`](../../docs/seo/static-quality-contract.md).
Build and browser inventories discover emitted pages automatically. Passing
checks prevents known regressions; it is not a guarantee of a Google score.

Normal `npm run build` also enforces the default-disabled contact contract.
For synthetic form checks, build to a separate directory with
`PUBLIC_CONTACT_SUBMISSION_MODE=test` and Astro's `build --outDir` option;
set `CONTACT_TEST_DIST` to that directory for `npm run verify:contact-browser`.
The test uses mocked responses and requires `PLAYWRIGHT_MODULE` and
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, with Chromium sandboxing enabled.
Never package this test output. Leave the normal preview build disabled.

The same subproject now includes a complete service template family. One
dynamic Astro route, `src/pages/services/[slug].astro`, uses `getStaticPaths`
to generate every entry in the current `data/content.ts` services catalogue
(eleven routes at the time of writing). Each route's title, description,
per-service content and source-order related links are extracted from the
current production data and page component. The routes include the V2
header/footer, consent controls, FAQ disclosure and every current conversion
link. Production sources remain unchanged.

The service catalogue is read from `data/content.ts` with a fail-closed
TypeScript compiler AST literal reader (`scripts/lib/literal-reader.mjs`).
Per-service content (`data/service-pages.json`) and the navigation inventory
(`data/navigation.json`) are JSON. The extractor rejects expressions, spreads,
computed keys, duplicate or unsafe object keys, missing or unexpected fields,
and any mismatch between the catalogue slugs and the per-service content keys.
TypeScript 5.9.3 is pinned as an exact dev dependency for this reader only.
The React page's `FALLBACK` content is deliberately not reproduced: a catalogue
service without its own content entry fails the build instead of rendering
generic copy.

The adjacent `/services` listing route is also included. Its four groups, every
card (name, description, price, tag, href) and the four hero stats are read from
`data/service-pages.json`, enforcing the group and card shapes, safe site-relative hrefs, unique
hrefs and slugs, and source order. Cards under `/services/` must match a
generated detail route and their slug; the two standalone cards (`IT Health
Check` at `/it-health-check` and `Microsoft Business Premium` at
`/microsoft-business-premium`) plus the `Free IT health check` CTA point at
routes this prototype does not build. Hero, group and closing copy is copied
verbatim from the source component. The `13`, `£40`, `24/7` and `0` hero stats
and every card price are inherited parity inputs, not new claims.

## Case-study routes

The subproject also ports the V2 `/case-studies` listing and every data-driven
`/case-studies/[slug]` detail route to native Astro, reusing `BaseLayout`,
`SiteNav`, `SiteFooter` and `CookieConsent`. Coverage is exactly:

- `src/pages/case-studies/index.astro` renders `CaseStudiesListing.astro`: the
  hero, the four hero stat tiles, the first two source entries as featured
  cards, every study as a card in source order, the sector filter, the
  hard-coded "Sectors we've worked in" badge list and the closing call to
  action, all with copy taken verbatim from `pages-v2/CaseStudiesPageV2.tsx`.
- `src/pages/case-studies/[slug].astro` renders `CaseStudyPage.astro` for
  each record through `getStaticPaths`: hero with back link, industry, client,
  title and outcome, the outcome box (`shortStats.victory`, else `result`), the
  optional image, challenge with the optional risk line, solution with the
  optional technology tags, the optional three-tile result block, the optional
  testimonial, the first three other records as related stories, and the
  closing call to action, copied from `pages-v2/CaseStudyDetailPageV2.tsx`.

Records are read by `scripts/extract-case-studies.mjs` through
`scripts/lib/case-study-reader.mjs`, which uses the same fail-closed AST
literal reader. Its contract: `caseStudies` must be a single top-level `const`
array literal in `data/content.ts`; each entry may contain only the required
non-empty strings `id`, `slug`, `client`, `industry`, `title`, `challenge`,
`solution`, `result` and `outcome`, the optional non-empty strings
`testimonial`, `contactName` and `image`, an optional `techStack` array of
unique non-empty strings, and an optional `shortStats` object with exactly the
non-empty strings `risk`, `strategy` and `victory`. Slugs must be kebab-case and
unique, ids unique, and `image` either an absolute `https://` URL or a
site-relative path of unreserved characters (no schemes, query strings,
whitespace or `..`). Expressions, spreads, computed keys, `as const` and
template substitutions are rejected by the reader. The route inventory derives
from the validated source array, so a legitimate new record creates a route
without a template edit. The verifier compares emitted directories with that
derived inventory. It writes the gitignored
`src/generated/case-studies-data.mjs` and logs only the count and slugs.

Display rules (`src/lib/case-study-display.mjs`) mirror the React `STUDIES`
mapping: the metric number is the first word of `shortStats.victory`, else
`result`; the metric label is `shortStats.strategy`, else `result`; the metric
sub-line is `shortStats.risk`; up to three `techStack` entries appear on
featured cards and two on grid cards; the quote name is `contactName`, else
`client`; and the `SECTOR_COLOURS` badge map (with the primary colour as the
fallback) is copied from the listing component. The sector filter is a
progressive enhancement in `src/scripts/case-study-filters.ts`: the server
renders every study, the toolbar is hidden until that script runs, buttons carry
`aria-pressed`, hidden cards use the `hidden` attribute, and the result count
uses the source `${n} stories` / `${k} in ${sector}` labels. Without
JavaScript every study stays visible with its sector badge and the dead toolbar
never appears. Two deliberate differences from the React page: featured
entries use one responsive featured-card layout at every width rather than
switching to the small card below 768px; optional source images reserve a 16:9
space and use `object-fit: cover` to prevent layout shift. Outcome, challenge,
solution and related-outcome strings preserve the React page's escaped inline
link and strong-text contract. Link destinations accept ordinary internal URLs
and valid HTTP(S) URLs; unsafe schemes, protocol-relative URLs, backslashes and
control characters fail extraction and render as escaped text if the helper is
reused independently. The risk tone uses the current V2 value.

Head output follows `components/SEO.tsx` through `src/lib/case-study-seo.mjs`.
The listing uses the source title and description with `type="collection"`:
title cap rule, description, canonical `https://fresh-tech.uk/case-studies`,
`og:type` `website`, the shared social metadata, the index robots directive and
three JSON-LD objects (`CollectionPage` with `isPartOf` the organization id,
`Organization`, and a `Home > Case Studies` `BreadcrumbList`). Each detail uses
`${title}: Case Study` with the outcome as description and `type="article"`:
`og:type` `article`, the default social image, and `Article` (headline,
description, image, url, `author`/`publisher` organization references,
`mainEntityOfPage`), `Organization` and a three-item breadcrumb whose last name
is the slug in title case via the component's fallback rule. Neither
route passes an image, `schema`, `breadcrumbs` or `faqs` prop in the source, so
nothing else is emitted. Verification recomputes these heads from the SEO
component rules and the retained `Organization` object rather than from the
helper.

Links these routes emit to paths this prototype does not build: `/contact`
(hero, empty-state, closing and footer calls to action) and every shared header
and footer link other than `/pricing`, `/services`, the generated
`/services/[slug]` routes and `/case-studies`.

Case-study commands:

```sh
npm test                                 # literal reader plus synthetic case-study reader, display/SEO and inline Markdown tests
npm run build                            # extracts, builds, verifies (includes the case-study route inventory, heads and content)
PLAYWRIGHT_MODULE=<from private worker profile> \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<from private worker profile> \
npm run verify:case-studies-browser      # listing filters, direct and click-through detail routes, sweep, no-JS
```

The case-study browser gate uses its own preview at 390px and 1440px. It
checks the listing's featured pair, card count and order, filter reveal,
keyboard-driven pressed state, visible-card industries and count label after
filtering and after returning to All, the single active `Case Studies` entry in
the Resources disclosure or mobile menu, horizontal overflow, browser errors and
a card click landing on its generated detail route. It measures representative
badge, attribution and small-label colour combinations against 4.5:1. A representative detail
(the first record with `shortStats`, technology tags and, when any record has one, a testimonial) is
checked for structure, back link, related order, active navigation, conversion
links, pre-consent vendor requests and the cookie notice; every route is swept
at both widths for status, H1, template, overflow and errors, and the swept
slugs must equal the source inventory. A JavaScript-off phone context confirms
every study is visible, the dead toolbar is hidden, the mobile menu and a card
still work, and the representative detail stays complete. Screenshots are
ignored review artefacts.

Status at hand-off is recorded from the actual checks reported with the branch;
the extractor runs locally against the source records and logs only route count
and slugs. Treat this prototype as local comparison work, never as publication
approval or a production migration claim.

The build validates the three plans, feature lists, universal inclusions, SLA
rows, objections, calculator rates and monthly minimum in `data/pricing.json`.
It fails if the plan cards and calculator rates diverge.


## Why this shape

Astro 7.3.2 was the latest registry release checked on 15 September 2026. Astro
7 uses Vite 8 and requires Node 22.12 or newer. This prototype uses native Astro
components and one processed vanilla TypeScript script. It has no React
integration and emits no hydrated framework island.

Official references:

- https://astro.build/blog/astro-7/
- https://docs.astro.build/en/install-and-setup/
- https://docs.astro.build/en/guides/client-side-scripts/
- https://registry.npmjs.org/astro/latest

## Commands

```sh
npm ci --ignore-scripts
npm test
npm run test:consent
npm run test:pricing
npm run build
PLAYWRIGHT_MODULE=<from private worker profile> \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<from private worker profile> \
npm run verify:browser
PLAYWRIGHT_MODULE=<local Playwright module> \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<local sandboxed browser> \
npm run verify:pricing-browser
PLAYWRIGHT_MODULE=<from private worker profile> \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<from private worker profile> \
npm run verify:consent-browser
PLAYWRIGHT_MODULE=<from private worker profile> \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<from private worker profile> \
npm run verify:consent-ui
PLAYWRIGHT_MODULE=<local Playwright module> \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<local sandboxed browser> \
npm run verify:fonts
PLAYWRIGHT_MODULE=<local Playwright module> \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<local sandboxed browser> \
npm run verify:case-studies-browser
npm run test:package
npm run package:worker -- <output.tgz>
```

`package:worker` reads the explicit `scripts/worker-source-manifest.txt`
allowlist, requires the production extraction inputs, all required font
binaries, licences, provenance and the literal `src/pages/services/[slug].astro` path, and rejects
symlinks or secret/customer-fixture paths. It then compares the archive entries
back to the manifest and prints the source SHA-256. Run this preflight locally
before transferring a new worker archive. The output must be a new `.tgz` path;
the command never replaces an existing archive or a listed source file. Filename
filtering cannot detect sensitive content inside an otherwise allowed file, so
the manifest and its changes still require human review before transfer. The
manifest is mechanical completeness evidence, not blanket approval that its
  content is safe to send to a worker. In particular, `data/content.ts` contains
  named case-study records and is not authorised for worker transfer. This
  combined source therefore remains local unless a later source review provides
  a separately authorised packet; do not treat this manifest as that review.

`npm run build` records raw, gzip and Brotli sizes for emitted HTML, CSS,
external JavaScript and inline JavaScript in `evidence/build-metrics.json`.
The reviewed Bungee, Archivo and Archivo Narrow Latin and Latin-ext files are
copied from repository sources and counted in the output. The remote logo is the
remaining named exclusion and must be measured separately before any whole-page
loading claim. No font is preloaded.

The browser check uses sandboxed Chrome at 390px and 1440px. It covers keyboard
navigation disclosure, mobile menu open/close and focus return, calculator
minimum rules, FAQ disclosure, cookie rejection and settings, tracking requests,
horizontal overflow, browser errors and meaningful content with JavaScript disabled.
The full interaction, consent, screenshot and first-load accounting flow runs
against `/services/managed-it-support`. A second generated service (the first
catalogue entry on the quote-based hero branch, currently `cybersecurity`) gets
representative structure, hero-branch, related-order, FAQ, menu and no-JS
checks. Every generated service route is then swept at both widths for HTTP
status, H1, template presence, horizontal overflow and browser errors, and the
swept slug list must equal the source catalogue. The listing is reached by
clicking the header `Services` entry from a detail route at both widths, then
checked for heading, group order, exact card href order, hero stats, active
navigation, CTAs, overflow, browser errors and a card click landing on a
generated detail route, plus a JavaScript-off pass.
The focused pricing browser gate separately verifies complete section order,
source-derived tier/inclusion/SLA inventories, keyboard calculator branches,
mocked helpdesk success formatting, 4.5:1 small-text contrast, conversion links,
pre-consent vendor inactivity, overflow and complete no-JavaScript content at
phone and desktop widths. Its geometry is measured after page load; it does not
prove first-paint layout stability, CLS or a speed improvement. Those still need
measured preview checks.
The optional live baseline command makes a read-only request to the equivalent
production route and counts every unique external script response plus executable
inline scripts. JSON-LD is reported as structured data rather than executable
JavaScript; it is not part of the ordinary worker gate.

## Decision boundary

This result now covers the complete data-driven service template family, the
`/services` listing, the `/case-studies` listing and the data-driven
case-study detail family. It cannot estimate the cost or performance of
migrating the remaining route catalogue (home, industries, resources, legal and
tools pages),
content pipeline, live integrations, forms and redirects. It is a template-level
feasibility gate, not a full-site parity or migration claim.

The pricing route retains the preview-wide `noindex, nofollow` directive. Its
title, description, canonical, social metadata and Service, LocalBusiness,
Organization and breadcrumb JSON-LD follow the current production SEO helper.
The helpdesk strip starts with truthful Loading text, requests the public report
after the same load/delay/idle sequence, validates the response and falls back
to Unavailable. Its unit and browser gates mock that exact endpoint.

One deliberate draft correction differs from the React source baseline. The
second objection now follows the active Terms of Business: a 30-day rolling
default unless the signed Proposal says otherwise, 30 days' notice, a refund of
the first month's fee when ended within the first 30 days, and Proposal priority.
It links to `/terms-of-business`. The extractor retains the original 12-month
React wording as evidence of the discrepancy, while built-output verification
rejects it. This is an editorial release hold and does not change commercial
terms or production content.

Every service route instead emits the current production title formula
(`${title}: IT Support Shropshire | Fresh Tech IT Support`), description,
canonical, social metadata, robots directive and four JSON-LD objects. For
`managed-it-support` the verification compares exactly against retained output
from the independently built React static-generation prototype rather than its
own SEO helper. For every other route the expected head is derived in the
verifier from that same fixture with only the route-specific title, description,
canonical and breadcrumb substituted, so the shared LocalBusiness and
Organization objects must match the retained output byte for byte. The
breadcrumb name formula (slug words capitalised, giving `Managed It Support`)
and the fixed nine-item `makesOffer` list are inherited from the retained
output; the offer list is not derived from the catalogue and omits two current
services. This is safe only because the
subproject is isolated and must not be deployed.

The `/services` listing has no retained React output. Its head uses the shared
`type="service"` formula: source title with the ` | Fresh Tech IT Support`
suffix, source description, canonical `https://fresh-tech.uk/services`, the same
social metadata, and four JSON-LD objects. Verification requires the
LocalBusiness and Organization objects to equal the retained detail fixture
exactly; the Service object (named from the listing title) and a two-item
`Home > Services` BreadcrumbList are assumptions from the path-based detail
pattern and are labelled as such in the verifier. Exact listing head parity
with production has not been established. Its V2 booking CTAs remain
ordinary `/contact` links, matching the current route. The prototype implements
the consent notice, preference storage, footer re-open flow and deferred analytics
loader. The browser gate proves zero vendor requests before consent and after
rejection, then fulfils only the exact GA4 and Clarity script URLs with inert local
stubs after acceptance so verification never contacts analytics vendors. The
seasonal provider and legacy title-announcement side effects are out of scope.

Navigation inventory is extracted from `data/navigation.json` during the
build. The desktop main links, Sectors and Resources disclosures and the mobile
resource inventory therefore fail verification if the production source changes.
Browser evidence retains an unmodified viewport screenshot for each size. The
separate full-page images are labelled `fullpage-normalised` because sticky header
positioning is changed only for screenshot stitching.

## Complete pricing-route result, 15 September 2026

The local Node 24.15 / Windows Edge gate generated all 27 current prototype
pages. The final output passed 95 pricing-specific static assertions alongside
the existing 8 baseline, 517 service-content, 231 service-head/framework, 264
service-navigation, 110 listing and 754 case-study assertions. Ten injected
timer/fetch unit tests cover strict helpdesk values, Loading, Unavailable,
success, invalid/failed responses, delay/idle scheduling, timeout setup and
cancellation. The actual endpoint was not contacted.

Sandboxed Edge passed 67 focused pricing assertions across phone, desktop and
JavaScript-off contexts. They cover section order and counts, keyboard
calculator operation and all minimum branches, exact mocked live values,
small-text and CTA contrast, pre-consent vendor inactivity, overflow, console
errors and full no-JavaScript content. The existing combined pricing/service
gate also passed 265 assertions and the actual-page consent gate passed ten.
Fresh full-page captures are ignored at `evidence/pricing-phone.png` and
`evidence/pricing-desktop.png`. These are local implementation results, not a
worker, live-preview, deployment, first-paint, CLS or speed claim.

## Verified service-family result, 15 September 2026

The integrated source-only worker gate used Node 24.21.0, npm 11.19.0,
Astro 7.3.2 and the pinned sandboxed Chrome 1208 browser. Its 43-file archive
matched its explicit manifest exactly and had SHA-256
`D270C450B71F88B908F0FD6DDBEB3AEC017EACBB96183B451F5ED42D3006FCBB`.
The complete run took 49 seconds and generated all thirteen pages in 670.7 ms.
It passed nine literal-reader tests, fifteen consent module tests, all static
output contracts, 265 service-family browser assertions, sixteen isolated
consent-fixture assertions and ten consent checks against the built Astro UI.

The integrated build emitted 271,218 raw bytes of HTML (79,394 gzip), 20,652
raw bytes of CSS (4,972 gzip), 6,008 raw bytes of external JavaScript (2,581
gzip), no inline executable JavaScript, and the 14,344-byte Bungee font. Exact
route-level figures and the worker runtime are retained under `evidence/`.

The current local Windows gate used Node 24.15.0, npm 11.12.1 and Microsoft
Edge through Playwright with Chromium sandboxing enabled. Astro generated the
pricing route, `/services`, and all eleven catalogue detail routes. The output
passed eight pricing assertions, 517 service-content assertions, 231
head/framework assertions, 264 source-navigation assertions and 110 listing
assertions. The literal reader also passed nine focused tests covering valid
literals and rejection of calls, spreads, computed and duplicate keys, unsafe
prototype keys and template substitutions.

The build emitted 271,218 raw bytes of HTML (79,422 gzip), 20,652 raw bytes of
CSS (4,972 gzip), 3,632 raw bytes of external JavaScript (1,485 gzip), no inline
executable JavaScript, and the 14,344-byte self-hosted Bungee font. These totals
cover all thirteen generated pages, so they are inventory figures rather than a
single-page transfer estimate. Route-level measurements are in
`evidence/build-metrics.json`.

The Windows/Edge browser gate passed 265 assertions across pricing, the listing,
the complete managed-support flow, a representative quote-based service, all
eleven service routes at 390px and 1440px, and JavaScript-off contexts. It also
checks computed small-text contrast, keyboard disclosure and focus behaviour,
mobile overflow, source route inventory, listing card order, conversion links,
browser errors and pre-consent vendor requests. This is a local Edge fallback,
not a repeat of the pinned worker Chrome proof below. Viewport screenshots are
ignored review artefacts; the retained backup/recovery phone capture verifies
the long heading and outcome cards remain readable after the overflow fix.

## Historical representative-route worker result, 15 September 2026

Node 24.21.0 and npm 11.19.0 installed 186 packages with scripts disabled and
reported no known vulnerabilities. Astro generated both prototype routes in
649.5 ms. The output passed eight pricing assertions plus 39 service-content
and nine metadata/framework assertions. Across the two emitted routes it contained:

| Asset | Raw | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| HTML | 30,475 B | 9,394 B | 7,595 B |
| CSS | 17,383 B | 4,431 B | 3,830 B |
| Inline executable JavaScript | 0 B | 0 B | 0 B |
| All emitted external JavaScript | 3,602 B | 1,435 B | 1,185 B |
| Self-hosted Bungee font | 14,344 B | 14,367 B | 14,348 B |

Each clean browser context also fetched 66,218 raw bytes from the allowlisted
Google Fonts and Cloudinary hosts: 9,348 bytes of font CSS, 53,620 bytes of
Archivo font files and the 3,250-byte logo. Those bytes are recorded separately
because they are remote and compression/transfer headers are outside the build.

Sandboxed Chrome passed 68 assertions across pricing and managed-service phone,
desktop and JavaScript-off contexts. The complete service checks covered its full
content structure, active navigation, conversion links, FAQ keyboard use, mobile
and desktop disclosures, cookie rejection/settings, focus return, no overflow,
no browser errors and zero GA4, Clarity or Calendly requests before consent.

A cold read-only browser context measured the current live React route at 507,060
raw and 151,666 gzip bytes of first-load JavaScript, including three executable
inline scripts. The managed-service route loaded 3,572 raw and 1,385 gzip bytes
across all JavaScript responses, a 99.1% reduction and well below the 60 KB gate.
The live deployment is a point-in-time comparator and may not match the local
source revision exactly. Remote font, logo and stylesheet bytes remain separate
from the JavaScript comparison.

The earlier two-route evidence is retained in Git history. The current
`evidence/worker-runtime.txt` describes the later 13-page service/consent PC run.
See `evidence/README.md` for the final 27-page local build and browser evidence.

## Guide routes

`/guides/[industry]` is generated from `data/industryGuides.ts`, read
structurally by `scripts/lib/guide-reader.mjs` and never executed. The current
source snapshot is 7 guides, 28 sections and 139 checklist items. Those numbers
are a description of the source at the time of writing, not a gate: the
extractor, the output checker and the browser gate all derive their inventory
and counts from the source or the validated generated data, so a guide added
to the source enters the build, the output check and the browser sweep
automatically. Both checkers discover the emitted directory recursively and
fail on a `/guides` listing, a nested route under a guide, or any stray file.
There is no listing route because the source has none.

```sh
npm test                      # includes guide reader, Markdown and SEO units
npm run test:guides-enhance   # src/scripts/guide-enhance.test.ts
npm run build                 # extract-guides before Astro, guide-output-check after
PLAYWRIGHT_MODULE=<local Playwright module> \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<local sandboxed browser> \
npm run verify:guides-browser
```

`GUIDE_DIST_DIR` means the built site root for both guide checkers; the output
checker appends `/guides` itself. `npm run build` records `guideRoutes` and
`guideCount` in `evidence/build-metrics.json`.

Preview access differs deliberately from the React page. The React
page rendered locked sections as a stripped preview behind an email-capture
gate, and only the client script revealed the full text. The native output
emits every section, locked ones included, as full visible content on first
paint, with no JavaScript required to read it and no email form. The locked
flag survives as a `data-locked` attribute only. The shared source contact
block on each guide renders in disabled mode: source copy, phone, email and
booking links are present, but there is no form, no input and no submission
endpoint. The production contact form, Calendly booking and email-based guide
unlock remain separate integration gates. Existing response-time and trust
claims in the shared contact copy are retained source wording, not newly
verified claims.

Checklists use labelled native checkboxes, section subheadings use H3 beneath
H2, and consecutive source list lines become semantic lists. Prefixed section
IDs avoid collisions; the enhancement also resolves legacy bare fragments.
The print view uses the visible hero heading and includes collapsed sections.
Source wording remains unchanged apart from replacing decorative print emoji
with labels and adding the visible checklist tip label. The progress strip
sits below the page content and sticks to the viewport bottom. These are
presentation and accessibility changes, not content optimisation.

Print, progress, section toggles and legacy hash landing are enhancements
covered by the focused browser gate, which also runs a fresh no-consent
context on the first guide: the banner must appear, no analytics vendor may
load after interaction plus the loader delay, and Reject must keep it that
way. Every other guide context seeds a stored rejection. Browser and PDF
proof for this family are pending: the unit tests and the checker syntax pass,
but the full build, the browser gate and the PDF pagination review have not
been run in this batch. The root owns the final build, PC packet, browser run
and deploy decision.
