# Fresh Tech Website Architecture

## Overview

Fresh Tech Website is a Single Page Application (SPA) built with React 19 and TypeScript, deployed on Netlify. The site serves as the marketing presence for Fresh Tech MSP, targeting local businesses in Ludlow, Shropshire, and surrounding areas.

## System Architecture

```
                                    ┌─────────────────────────────┐
                                    │      Netlify CDN            │
                                    │   (SSL, Edge Caching)       │
                                    └─────────────┬───────────────┘
                                                  │
    ┌─────────────────────────────────────────────┼─────────────────────────────────────────────┐
    │                               Static Site Hosting                                          │
    │                                                                                            │
    │  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐                 │
    │  │   index.html     │     │   assets/*.js    │     │   assets/*.css   │                 │
    │  │   (SPA Entry)    │────▶│   (React App)    │────▶│   (TailwindCSS)  │                 │
    │  └──────────────────┘     └────────┬─────────┘     └──────────────────┘                 │
    │                                    │                                                     │
    │                              React Router                                                │
    │                                    │                                                     │
    │         ┌──────────────────────────┼──────────────────────────┐                         │
    │         │                          │                          │                         │
    │         ▼                          ▼                          ▼                         │
    │  ┌────────────┐           ┌────────────┐            ┌────────────┐                     │
    │  │   Home     │           │   Pages    │            │ Components │                     │
    │  │  (Eager)   │           │  (Lazy)    │            │  (Shared)  │                     │
    │  └────────────┘           └────────────┘            └────────────┘                     │
    │                                                                                          │
    └────────────────────────────────────┬────────────────────────────────────────────────────┘
                                         │
                      ┌──────────────────┼──────────────────┐
                      │                  │                  │
                      ▼                  ▼                  ▼
             ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
             │   Calendly   │   │   Tawk.to    │   │   Netlify    │
             │   (Booking)  │   │ (Live Chat)  │   │  Functions   │
             └──────────────┘   └──────────────┘   └──────────────┘
                                                          │
                                                          ▼
                                                   ┌──────────────┐
                                                   │  SMTP2GO     │
                                                   │   (Email)    │
                                                   └──────────────┘
```

## Component Architecture

### Core Components

```
App.tsx
├── ErrorBoundary
└── Router (BrowserRouter/HashRouter)
    └── Routes
        └── Layout (wrapper)
            ├── Header
            ├── Navigation
            ├── Main Content (page component)
            ├── Footer
            └── Floating Elements
                ├── BackToTop
                ├── CalendlyModal (lazy)
                ├── ExitIntentSlide (lazy)
                └── KeyboardShortcuts (lazy)
```

### Component Categories

| Category | Count | Purpose |
|----------|-------|---------|
| Layout | 1 | Page wrapper with header/footer |
| Pages | 32 | Route-level components |
| Interactive | 6 | Quiz components |
| UI | 30+ | Buttons, cards, forms, etc. |
| SEO | 1 | Meta tags, structured data |
| Utility | 8 | Analytics, modals, scrolling |

## Data Flow

### Static Content Flow

```
data/*.ts  ──────▶  Page Component  ──────▶  UI Components
   │                      │                        │
   │                      │                        │
   ▼                      ▼                        ▼
[content.ts]        [Props passed]          [Rendered HTML]
[industryGuides.ts]
[reviews.ts]
```

### User Interaction Flow

```
User Action
    │
    ▼
Event Handler
    │
    ├──────────────────────────────────────┐
    │                                      │
    ▼                                      ▼
Local State Change                   External Action
(useState/useEffect)                 (Analytics, API)
    │                                      │
    ▼                                      ▼
Re-render Component              Netlify Function / 3rd Party
```

## Routing Architecture

### Route Configuration

All routes are defined in `App.tsx` using React Router v7:

```typescript
// Eager-loaded (critical path)
import Home from './pages/Home';

// Lazy-loaded (code-split)
const AboutPage = lazy(() => import('./pages/AboutPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
// ... 30 more pages
```

### Route Groups

| Group | Pattern | Example |
|-------|---------|---------|
| Core | `/about`, `/contact` | Static pages |
| Services | `/services/:slug` | Service detail |
| Blog | `/blog`, `/blog/:slug` | Blog listing/posts |
| Industries | `/industries/:slug` | Industry pages |
| Locations | `/locations/:slug` | Town-specific pages |
| Resources | `/resources/*` | Guides, calculators |

### Legacy Redirects

70+ WordPress URL redirects defined in `netlify.toml`:
- `/news/*` → `/blog`
- `/about-us` → `/about`
- `/2023/*` → `/blog` (dated posts)
- `/wp-admin/*` → `/` (security)

## Build Architecture

### Vite Configuration

```typescript
// vite.config.ts
{
  plugins: [
    react(),           // React Fast Refresh
    cleanHtmlPlugin(), // Remove dev script tags
    criticalCssPlugin() // Inline critical CSS
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react-dom'],
          'router': ['react-router'],
          'icons': ['lucide-react'],
          'content': ['./data/content.ts'],
          'industry-guides': ['./data/industryGuides.ts']
        }
      }
    }
  }
}
```

### Bundle Output

| Chunk | Size | Contents |
|-------|------|----------|
| index.js | 88KB | Core React app |
| react-vendor | ~40KB | React DOM |
| router | ~20KB | React Router |
| icons | ~50KB | Lucide icons |
| content | ~420KB | Main content data |
| industry-guides | ~100KB | Industry content |

### Build Pipeline

```
1. Generate Sitemap (scripts/generate-sitemap.js)
       │
       ▼
2. Generate RSS Feed (scripts/generate-rss.js)
       │
       ▼
3. Vite Build
   ├── TypeScript compilation
   ├── React transformation
   ├── TailwindCSS processing
   ├── Code splitting
   └── Asset optimization
       │
       ▼
4. Critical CSS Inlining (Critters)
       │
       ▼
5. Output to dist/
```

## SEO Architecture

### SEO Component

Every page uses the `SEO` component:

```typescript
<SEO
  title="Page Title"
  description="Meta description"
  slug="/page-path"
  type="website|article"
  schema={structuredData}
  breadcrumbs={[...]}
/>
```

### Structured Data

| Type | Usage |
|------|-------|
| LocalBusiness | Homepage |
| Organization | About page |
| WebSite | Site-wide |
| FAQPage | FAQ sections |
| Article | Blog posts |
| BreadcrumbList | Navigation |

## Security Architecture

### Headers (netlify.toml)

```toml
X-Frame-Options = "DENY"
X-XSS-Protection = "1; mode=block"
X-Content-Type-Options = "nosniff"
Referrer-Policy = "strict-origin-when-cross-origin"
Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
Content-Security-Policy = "..." # Strict CSP
```

### CSP Policy

- `default-src 'self'`
- `script-src` - Self, GTM, GA, Clarity, Calendly, Tawk.to
- `style-src` - Self, Google Fonts, Calendly, Tawk.to
- `img-src` - Self, Cloudinary, Unsplash, analytics pixels
- `connect-src` - Self, Analytics, Calendly, Tawk.to
- `frame-src` - Calendly, Tawk.to, Google Maps
- `frame-ancestors 'none'`

## Performance Optimizations

### Code Splitting Strategy

1. **Route-based**: All pages lazy-loaded except Home
2. **Component-based**: Heavy modals lazy-loaded
3. **Data-based**: Content files in separate chunks

### Critical Rendering Path

```
1. index.html (0ms)
      │
      ▼
2. Critical CSS inline (< 50ms)
      │
      ▼
3. index.js loads (< 200ms)
      │
      ▼
4. Home component renders (< 100ms)
      │
      ▼
5. Non-critical CSS async (parallel)
```

### Caching Strategy

| Asset Type | Cache Duration |
|------------|----------------|
| /assets/* | 1 year (immutable) |
| /index.html | No cache |
| Images | Browser default |

## Technology Decisions

| Decision | Rationale |
|----------|-----------|
| **React 19** | Latest features, Server Components ready |
| **Vite** | Fast HMR, native ES modules, optimized builds |
| **TailwindCSS** | Utility-first, small bundle, JIT |
| **React Router v7** | Type-safe routing, lazy loading |
| **Static content** | No CMS needed, fast builds, SEO friendly |
| **Netlify** | Git integration, edge functions, CDN |
| **Critters** | Critical CSS without runtime cost |

## Future Considerations

### Potential Improvements

1. **Testing**: Add Vitest for unit tests, Playwright for E2E
2. **CMS Integration**: Consider headless CMS for blog content
3. **React Router lazy**: Use Router's native lazy instead of React.lazy
4. **Image optimization**: Migrate to Cloudinary for all images
5. **Analytics**: Server-side analytics for privacy

### Scalability Notes

- Content data in TypeScript files - works well up to ~50 pages
- Beyond that, consider headless CMS or JSON files
- Current bundle size (88KB main) is excellent
- Legacy redirects may need periodic cleanup

---

*Last Updated: January 2026*
