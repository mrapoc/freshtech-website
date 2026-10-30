# Publishing legal pages

Legal source documents live in `content/` and are rendered without rewriting their wording.
`content/legal-pages.json` selects the file shown on each unversioned current route.

## Publish a new version

1. Add the approved document as a new file, for example `content/terms-of-business-v1-1.md`.
2. Keep the same `slug` in its front matter and set its new `version` and `effective_date`.
3. Add the prior and new versions to the new document's version history table.
4. Change that slug's filename once in `content/legal-pages.json`.
5. Run the checks in `DEVELOPMENT.md`, including the full quality gate.

Versioned routes are discovered from front matter, so the new file automatically creates a route such as
`/terms-of-business/v1-1`. Never edit or remove an already published version file.

## Placeholder guard

A document containing a `[DECIDE` or `[VERIFY` marker still gets its route, but the build
(`prototypes/html-first-slice/scripts/extract-legal.mjs`) replaces its body with a "being
prepared" notice and shows "Not yet published" instead of a date. Resolve every marker before
relying on the page.
