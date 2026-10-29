# Bungee Regular: self-hosted font provenance

Retrieved 2026-09-10 from Google Fonts. These are byte-for-byte the woff2
subset files Google Fonts was serving for `family=Bungee` (Google Fonts API
version `v17`) on that date, so the rendered glyphs match what the site served
before self-hosting.

| File | Google Fonts source URL | SHA-256 |
| --- | --- | --- |
| brand/fonts/bungee/bungee-v17-latin.woff2 | https://fonts.gstatic.com/s/bungee/v17/N0bU2SZBIuF2PU_0DXR1.woff2 | 126eec706b7931682dbcf6c6efc274132c603f181fbf912678e6cfeb341e721b |
| brand/fonts/bungee/bungee-v17-latin-ext.woff2 | https://fonts.gstatic.com/s/bungee/v17/N0bU2SZBIuF2PU_0A3R1Gd8.woff2 | dff060f6e0f1d527570e707f5517a6332033030ea4619f4a86b39e10b66ecb74 |
| brand/fonts/bungee/bungee-v17-vietnamese.woff2 | https://fonts.gstatic.com/s/bungee/v17/N0bU2SZBIuF2PU_0AnR1Gd8.woff2 | 73d615497987a45a1bc0c1a835326906c168be6f46eb690d118fa204477a1e09 |
| public/fonts/bungee/OFL.txt | https://raw.githubusercontent.com/google/fonts/main/ofl/bungee/OFL.txt | d5787a50dde5be6c6daecab9ed459939b1bc37cff0d0e00257eaf1ec2cf4c16c |

Upstream: Bungee by David Jonathan Ross, https://github.com/djrrb/Bungee,
release v2.000 (Google Fonts `ofl/bungee/METADATA.pb` source commit
`eb03cf69adab5094f6b84e95357789cdf3bfeb99`). Copyright 2023 The Bungee Project
Authors. Licensed under the SIL Open Font License 1.1 (see OFL.txt in this
directory). The OFL permits bundling and self-hosting; the licence file must
stay alongside the font files.

The woff2 files live in `brand/fonts/bungee/` (repo source) and are referenced
as `/brand/fonts/bungee/...` from `brand/tokens.css`, so Vite content-hashes them into `/assets/`
at build time and the existing immutable cache rule applies. Only this licence
and provenance text is served from `/fonts/bungee/`.

The `unicode-range` values and rule order (vietnamese, latin-ext, latin) in
`brand/tokens.css` are copied verbatim from the Google Fonts CSS response of the
same date, so subset coverage and overlap resolution are unchanged: `latin`
(includes £ U+00A3, basic accented characters and general punctuation),
`latin-ext` (e.g. Welsh ŵ ŷ) and `vietnamese`. Nothing is preloaded; the
browser fetches each file on demand, exactly as it did from Google.

To refresh: fetch `https://fonts.googleapis.com/css2?family=Bungee&display=swap`
with a current browser user agent, download the listed woff2 URLs, update the
version in the filenames and this table, and copy any changed unicode-range.

## Static site heading subset

The native static site (`prototypes/html-first-slice`) serves
`brand/fonts/bungee/bungee-v17-latin-headings.woff2` as `/fonts/bungee-latin.woff2`
instead of the full Latin file above. It was created on 17 September 2026 with
fonttools 4.65.0 and brotli 1.2.0, both installed from PyPI:

```sh
pyftsubset brand/fonts/bungee/bungee-v17-latin.woff2 --output-file=brand/fonts/bungee/bungee-v17-latin-headings.woff2 --flavor=woff2 --unicodes="U+0020-007E,U+00A0,U+00A3,U+00B7,U+2013-2014,U+2018-2019,U+201C-201D,U+2026" --layout-features=kern --name-IDs='*' --name-languages='*' --drop-tables+=vhea,vmtx
```

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| brand/fonts/bungee/bungee-v17-latin-headings.woff2 | 5,192 | 1977fd9c5daff3ce269232de30131ee58043b8f39e0fe65876c620bc13bc2aad |

The command is deterministic: a repeat run produced the same SHA-256. The kept
characters are printable ASCII (including lowercase, which several headings use
without `text-transform`), no-break space, pound sign, middle dot, en and em
dashes, curly quotes and apostrophes, and the ellipsis. Before subsetting,
every emitted page (242 at the time) was rendered in Chromium at 390px and
1440px and the text of every element and pseudo-element whose computed font
stack includes Bungee was collected after `text-transform`, JavaScript-rendered
states included. All 87 distinct characters found are either kept or were never
in the Latin file (U+2192 and U+27F3 already fall back). Rendering all of them
with the full and the subset file produced identical pixels. Vertical layout
tables and features are dropped; vertical metrics, advance widths, kerning,
hinting and every name record are unchanged.

A character outside this set that still falls in the Latin `unicode-range`
renders in the next font of its stack. Re-run the scan and this command if
Bungee-styled copy starts to need one (for example an accented letter).
Welsh and other Latin-ext letters still use the unchanged Latin-ext file. The
licence is unchanged: the OFL permits modified versions, and this font declares
no Reserved Font Name.
