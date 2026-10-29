# Prepared self-hosted body-font assets

The prototype now loads these verified local assets. The earlier remote baseline
below remains the comparison point for a later combined measurement.

## Current remote baseline

The latest committed worker evidence in `evidence/external-assets.json`
(SHA-256 `19947ffbcf9727e07718a4433ad37885ddb630d455a0ab6f577b3cecd92ee73d`)
recorded the same external font transfers in clean phone and desktop contexts:

| Response | Bytes |
| --- | ---: |
| Google Fonts CSS | 9,348 |
| Archivo v25 Latin WOFF2 | 34,928 |
| Archivo Narrow v35 Latin WOFF2 | 18,692 |
| Unique remote font total per context | 62,968 |

The measured English service route did not need Latin-ext glyphs, so that
capture did not fetch either Latin-ext file. The four prepared WOFF2 files are
102,764 bytes on disk in total. This is an asset inventory, not a predicted
transfer total or performance result; unicode-range selection determines which
files a browser requests.

## Implementation

Latin-ext then Latin `@font-face` rules in `src/styles/global.css` use files
copied into `/fonts/` by `scripts/extract-pricing.mjs`. They retain
`font-display: swap`, Archivo weight range `400 800`, Archivo Narrow range
`600 700`, and the Google Fonts unicode ranges. The Google Fonts stylesheet and
both font-host preconnects have been removed from `src/layouts/BaseLayout.astro`.

Keep the existing Bungee rules and source assets. The repository already holds
the byte-verified v17 Latin, Latin-ext and Vietnamese files under
`brand/fonts/bungee/`, with its OFL and provenance under `public/fonts/bungee/`.
The prototype retains its Bungee Latin face and adds the already-licensed
Latin-ext file for Welsh display text. It does not duplicate or replace Bungee.

After building, run `npm run verify:fonts` with the local Playwright module and
sandboxed browser environment variables. The focused check covers phone and
desktop widths, forces ŵ and ŷ through all three families, requires the exact
six local subset requests, rejects Google Fonts traffic, and checks overflow and
settled geometry. Compare measured bytes with the baseline above before making
any loading or performance claim. Do not add a preload without separate
request-timing evidence.

An independent review accepted the change. Root confirmed both Bungee subset rules have
their own unicode ranges. The test samples geometry after fonts are ready;
it does not measure first-load CLS or paint. Initial-load and PageSpeed
measurements remain open. Font refreshes must use changed filenames or an
explicit cache strategy; these copied paths are not content-hashed. Narrow
weights remain 600-700 and italics remain synthesised, matching the old request.
