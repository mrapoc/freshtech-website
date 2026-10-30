# Static website quality contract

This contract applies to every current and future native Astro page, shared
component and content entry. Sam's target is 100 for Performance,
Accessibility, Best Practices and SEO on mobile and desktop.

## What must be enforced

The build discovers emitted HTML rather than relying on a hand-maintained page
list. Every page must have meaningful server-rendered content, a single main
heading and main landmark, a useful title and description, the correct canonical,
language and viewport settings, valid structured data and resolvable local
assets. Images need alternative text and reserved dimensions. Generated HTML
and initial JavaScript have explicit compressed-byte budgets.

The current budgets are 32 KiB gzip HTML, 16 KiB gzip for each page's unique
initial JavaScript dependency graph, and 4 KiB gzip inline executable JavaScript.
Whole-site JavaScript size is reported rather than capped: an enhancement on
one page must not consume another page's allowance. Remote HTTPS images may
remain, but mixed-content resources, eager external scripts and remote stylesheets
are rejected. An approved new integration needs an explicit contract review.
The one approved external frame (9 Oct 2026) is Blockmark's Cyber Essentials
certificate badge (`CyberEssentialsBadge.astro`): only
`https://registry.blockmarktech.com/certificates/`, `loading="lazy"`, sandboxed
without `allow-same-origin` or top navigation, and CSP `frame-src` names only
that origin.
Every stylesheet link and CSS @import is rejected, including local files.
CSS stays inline and counts towards the HTML budget. Changing that architecture
requires an explicit contract change and equivalent recursive resource/budget
coverage. Astro islands and React hydration roots are rejected. Deferred live
statistics are outside the initial JS budget but remain reported and tested.

The production Content-Security-Policy omits `'unsafe-inline'` from `script-src`
(see `scripts/generate-apache-static-config.mjs`), so the
production release gate rejects any inline executable script, event-handler
attribute or `javascript:` URL, and any form with an email field that is not
`method="post"`. Astro is configured never to inline bundled scripts; read data
for a page script from the rendered markup rather than `define:vars`. JSON-LD
data blocks are unaffected. `style-src` keeps `'unsafe-inline'` because CSS is
inline by design and pages use style attributes for layout tokens.

Shared styles and components must preserve readable contrast, visible keyboard
focus, useful touch targets, responsive layouts and reduced-motion preferences.
Do not use fixed heights that clip enlarged text. Exercise real interactions and
both narrow and desktop layouts. The route-wide browser gate must include new
emitted routes automatically; template-specific gates cover calculators, filters,
menus, consent, delayed fonts and forms. Automated checks do not replace a visual
review or real-device checks when behaviour is device-specific.
The release owner must inspect unresolved contrast on every new or changed
element and record the route, element, evidence and resolution in release notes.
Unresolved manual findings block release; a generic browser pass does not waive
this gate. Representative route selection is deterministic.

Content must remain useful before JavaScript. Load enhancements only where
needed. Analytics stay behind consent; public statistics retain loading and
unavailable states, cancellation and bounded requests. No external form, email,
analytics or customer writes are permitted in tests. Use exact mocked providers
and isolated output when testing contact submission.

Keep image dimensions and responsive sources deliberate. Prefer existing modern
image/font assets where appropriate; do not enlarge payloads or discard required
glyphs to follow a format trend. Preloads need evidence that the resource is
critical. Content hashes must come from the build, never be hardcoded into source.

Human editorial review remains mandatory for new public copy and social captions.
No invented outcomes, dates, experience, accreditation or testimonials. Preserve
UK spelling, natural prose, no em dashes and no emoji-led lists. Future and held
articles remain excluded consistently from routes, sitemap and RSS. Sam approves
the complete article and exact social captions before publication.
The output gate rejects em dashes in public text, titles and descriptions, and
emoji-led list items. It cannot judge whether prose sounds human or whether a
claim is true; those remain editorial review responsibilities.

## Failure and exception handling

A failed page or missing runtime fails its gate. Zero pages and skipped tests
are not passes. Fix the underlying issue; do not silence a finding by excluding
the page, removing useful functionality or raising a limit without evidence.
Any necessary exception must identify the exact route/rule, reason, owner and
follow-up in the work queue. Preview noindex is intentional and must not be
removed to inflate the SEO score.

## Release evidence

Run the native build and relevant browser gates against the same output. CI runs
the shared contract on changes to templates, source data, assets or the checks.
Record actual route coverage and failures. A future template must add focused
checks for its distinct interactions, not simply inherit a generic smoke test.

Before deploying, package only reviewed static output, retain its manifest and
rollback, and preserve server-resident endpoints/configuration. Verify deployed
body hashes, status codes, redirects, canonical URLs, headers and cache behaviour.
Unknown URLs must return genuine 404s. Keep preview noindex until an authorised
production cutover; production must have the intended indexability and sitemap.

Measure representative templates with Google's PageSpeed service after material
performance changes. Use comparable repeated captures and report median/range;
deduplicate cached captures. Keep lab scores separate from field Core Web Vitals,
search rankings and conversion outcomes. Do not add auditor-specific code or
change the visitor experience solely to raise the number.

See [development commands](../../DEVELOPMENT.md).
