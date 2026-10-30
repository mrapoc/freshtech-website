# Fresh Tech website

Marketing website for Fresh Tech, managed IT support for businesses in Shropshire,
Herefordshire, Worcestershire and Powys.

**Live site:** https://fresh-tech.uk

The site is a static [Astro](https://astro.build/) build served by Apache with small PHP
handlers on 20i. Every page is plain HTML generated from the content files in `data/` and
`content/`; there is no client-side framework.

## Layout

| Path | What it holds |
| --- | --- |
| `prototypes/html-first-slice/` | The Astro site: pages, components, styles, build and output checks, PHP handlers |
| `data/`, `content/` | Site content: services, blog, locations, case studies, pricing, navigation, legal documents |
| `hosting/routing.json` | Legacy redirects and security headers, compiled into the Apache `.htaccess` |
| `scripts/` | Sitemap and RSS generators, quality gate, release packaging and deploy, search-engine tools |
| `public/` | Root files shipped with every release: `robots.txt`, the IndexNow key, font licences |
| `brand/fonts/` | Self-hosted font files |
| `docs/` | Public build contracts |

## Quick start

Node 24 and PHP are needed.

```bash
npm ci
npm ci --prefix prototypes/html-first-slice
cd prototypes/html-first-slice
npm run dev
```

[DEVELOPMENT.md](DEVELOPMENT.md) lists the checks, the full quality gate and how a release
is built. [ARCHITECTURE.md](ARCHITECTURE.md) explains how the pieces fit together.
[AGENTS.md](AGENTS.md) holds the content and working rules.

## Copyright

Copyright Fresh Tech. All rights reserved. The source is published for
transparency; no licence to reuse the code, copy, images or brand is granted.
The bundled fonts carry their own SIL Open Font Licence.
