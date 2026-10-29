# Fresh Tech MSP Website

Marketing website for Fresh Tech MSP, an IT support company based in Ludlow, Shropshire, UK. Built with React 19, TypeScript, and Vite.

**Live Site:** https://fresh-tech.uk

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.0 | UI framework |
| TypeScript | 5.2 | Type safety |
| Vite | 5.2 | Build tool |
| TailwindCSS | 3.4 | Styling |
| React Router | 7.12 | Client-side routing |
| Lucide React | 0.554 | Icons |
| Netlify | - | Hosting & Functions |

## Prerequisites

- **Node.js:** 18.x or higher (20.x recommended)
- **npm:** 9.x or higher
- **Git:** For version control

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd freshtech-website

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

The site will be available at `http://localhost:5173`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production (includes sitemap & RSS) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint checks |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run build:sitemap` | Generate sitemap only |
| `npm run build:rss` | Generate RSS feed only |

## Project Structure

```
freshtech-website/
├── App.tsx                 # Main app with routing
├── index.tsx               # Entry point
├── index.html              # HTML template
├── index.css               # Global styles
│
├── components/             # 48 React components
│   ├── Layout.tsx          # Header, footer, nav wrapper
│   ├── SEO.tsx             # Meta tags, structured data
│   ├── Hero.tsx            # Homepage hero section
│   ├── *Quiz.tsx           # Interactive quiz components
│   └── ...
│
├── pages/                  # 32 page components
│   ├── Home.tsx            # Homepage (eager loaded)
│   ├── BlogPage.tsx        # Blog listing
│   ├── ServiceDetailPage.tsx
│   └── ...
│
├── data/                   # Static content
│   ├── content.ts          # Main content data
│   ├── industryGuides.ts   # Industry-specific guides
│   ├── reviews.ts          # Customer testimonials
│   └── legacyRedirects.ts  # WordPress URL mappings
│
├── utils/                  # Utilities
│   └── analytics.ts        # GA4/Clarity tracking
│
├── scripts/                # Build scripts
│   ├── generate-sitemap.js # Sitemap generator
│   └── generate-rss.js     # RSS feed generator
│
├── netlify/                # Netlify configuration
│   └── functions/          # Serverless functions
│       └── send-email.js   # Contact form handler
│
├── public/                 # Static assets
│   ├── images/
│   ├── robots.txt
│   └── favicon.ico
│
└── docs/                   # Public build contracts
```

## Environment Variables

Create a `.env.local` file in the project root:

```bash
# Google Analytics 4 Measurement ID (optional)
VITE_GA4_ID=G-XXXXXXXXXX

# Microsoft Clarity Project ID (optional)
VITE_CLARITY_ID=xxxxxxxxxx

# Note: SCHEDULED_PASSWORD is a server-side variable.
# Set it in Netlify dashboard, NOT in .env.local.
# See netlify/functions/auth-scheduled.js for details.
```

## Key Features

### SEO
- Dynamic meta tags and Open Graph via SEO component
- Structured data (LocalBusiness, Organization, FAQPage schemas)
- Auto-generated sitemap (159 URLs)
- RSS feed for blog posts
- Legacy WordPress URL redirects preserved

### Performance
- Lazy-loaded routes (all pages except Home)
- Critical CSS inlining via Critters
- Optimized chunk splitting (88KB main bundle)
- Image lazy loading
- Preconnect to Google Fonts

### Accessibility
- WCAG AA compliant
- Semantic HTML structure
- Proper heading hierarchy
- Visible focus states
- ARIA attributes on interactive elements

### Security
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- CORS restricted to production domain

## Deployment

The site auto-deploys to Netlify on push to `main` branch.

### Manual Deployment

```bash
# Build production bundle
npm run build

# Deploy to Netlify (requires Netlify CLI)
netlify deploy --prod
```

### Build Output

The build generates:
- `dist/` - Production-ready files
- `dist/sitemap.xml` - Auto-generated sitemap
- `dist/rss.xml` - Auto-generated RSS feed

## Third-Party Integrations

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Calendly | Booking appointments | Inline widget in Contact |
| Tawk.to | Live chat support | Script in index.html |
| Google Analytics | Analytics | GA4 in index.html |
| Microsoft Clarity | Heatmaps | Script in index.html |
| Cloudinary | Image CDN | URLs in content |

## Troubleshooting

### Build fails with chunk size warning
The build warns if chunks exceed 500KB. This is informational - the build still succeeds.

### Development server won't start
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Try `npm run dev` again

### Styles not updating
TailwindCSS may need a restart after config changes:
```bash
# Restart dev server
npm run dev
```

### 404 errors on refresh (local preview)
Use `npm run preview` instead of opening `dist/index.html` directly. SPAs need server-side routing.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design details.

## Copyright

Copyright Fresh Tech. All rights reserved. The source is published for
transparency; no licence to reuse the code, copy, images or brand is granted.
The bundled fonts carry their own SIL Open Font Licence.

---

*Last Updated: January 2026*
