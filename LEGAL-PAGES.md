# Publishing legal pages

Legal source documents live in `content/` and are rendered without rewriting their wording.
`content/legal-pages.json` selects the file shown on each unversioned current route.

## Publish a new version

1. Add the approved document as a new file, for example `content/terms-of-business-v1-1.md`.
2. Keep the same `slug` in its front matter and set its new `version` and `effective_date`.
3. Add the prior and new versions to the new document's version history table.
4. Change that slug's filename once in `content/legal-pages.json`.
5. Run the checks in `DEVELOPMENT.md`, including the full prerender build.

Versioned routes are discovered from front matter, so the new file automatically creates a route such as
`/terms-of-business/v1-1`. Never edit or remove an already published version file.

## Placeholder build guard

`npm run check:legal-content` scans every file in `content/` and reports the file and line for any
`[DECIDE` or `[VERIFY` marker. Local and deploy-preview builds continue with a warning, and affected
pages show a visible preview banner. Netlify production builds, or a local check run with
`LEGAL_BUILD_TARGET=production`, fail until every marker has been resolved.
