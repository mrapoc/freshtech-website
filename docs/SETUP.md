# Development Environment Setup

Detailed guide for setting up the Fresh Tech website development environment.

## Prerequisites

### Node.js

**Required:** Node.js 18.x or higher (20.x recommended)

```bash
# Check current version
node --version

# Install via nvm (recommended)
nvm install 20
nvm use 20

# Or download from https://nodejs.org
```

### Git

**Required:** Git 2.x or higher

```bash
# Check version
git --version

# Configure (if not done)
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd freshtech-website
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- React 19 and React DOM
- React Router DOM 7.x
- Lucide React icons
- Development tools (Vite, TypeScript, ESLint, Prettier, Tailwind)

### 3. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Optional - Analytics (leave blank for development)
VITE_GA4_ID=
VITE_CLARITY_ID=
```

> **Note:** The scheduled posts password (`SCHEDULED_PASSWORD`) is a server-side
> variable set in the Netlify dashboard — it is **not** needed in `.env.local`.
> See the Netlify function `netlify/functions/auth-scheduled.js` for details.

### 4. Start Development Server

```bash
npm run dev
```

The site will be available at: `http://localhost:5173`

## IDE Setup

### VS Code (Recommended)

#### Extensions to Install

1. **ESLint** (`dbaeumer.vscode-eslint`)
   - Real-time linting

2. **Prettier** (`esbenp.prettier-vscode`)
   - Code formatting

3. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
   - Class autocomplete

4. **TypeScript Importer** (`pmneo.tsimporter`)
   - Auto import suggestions

5. **ES7+ React Snippets** (`dsznajder.es7-react-js-snippets`)
   - Component snippets

#### Workspace Settings

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

### WebStorm/IntelliJ

1. Enable ESLint: Settings → Languages → JavaScript → ESLint → Automatic
2. Enable Prettier: Settings → Languages → JavaScript → Prettier → On save
3. Enable Tailwind: Install Tailwind CSS plugin from marketplace

## Project Structure Deep Dive

### Key Directories

```
freshtech-website/
│
├── App.tsx              # Main routing configuration
│                        # - Lazy imports for all pages
│                        # - Route definitions
│                        # - Error boundary
│
├── index.tsx            # React entry point
│                        # - Renders App into DOM
│
├── index.html           # HTML template
│                        # - Analytics scripts
│                        # - Google Fonts
│                        # - Meta tags
│
├── index.css            # Global styles
│                        # - Tailwind directives
│                        # - Custom utilities
│
├── components/          # Shared components
│   ├── Layout.tsx       # Page wrapper (558 lines)
│   ├── SEO.tsx          # Meta tags management
│   ├── Hero.tsx         # Homepage hero
│   ├── *Quiz.tsx        # 6 quiz components
│   └── ...              # 40+ more components
│
├── pages/               # Route components
│   ├── Home.tsx         # Homepage (NOT lazy loaded)
│   └── *Page.tsx        # 31 lazy-loaded pages
│
├── data/                # Static content
│   ├── content.ts       # Main content (~420KB)
│   ├── industryGuides.ts # Industry content
│   ├── reviews.ts       # Testimonials
│   └── legacyRedirects.ts # WordPress URLs
│
├── utils/
│   └── analytics.ts     # GA4/Clarity helpers
│
├── scripts/
│   ├── generate-sitemap.js # Build script
│   └── generate-rss.js     # Build script
│
├── netlify/
│   └── functions/
│       └── send-email.js   # Contact form
│
└── public/              # Static assets (copied to dist/)
    ├── images/
    ├── robots.txt
    └── favicon.ico
```

### Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite build configuration |
| `tsconfig.json` | TypeScript settings |
| `tailwind.config.js` | Tailwind customization |
| `postcss.config.js` | PostCSS plugins |
| `eslint.config.js` | ESLint rules (flat config) |
| `.prettierrc` | Prettier formatting |
| `netlify.toml` | Netlify deployment config |

## Common Development Tasks

### Adding a New Page

1. Create page component:
   ```typescript
   // pages/NewPage.tsx
   import { SEO } from '../components/SEO';
   import { Layout } from '../components/Layout';

   export function NewPage() {
     return (
       <Layout>
         <SEO title="New Page" description="..." slug="/new-page" />
         <main className="container mx-auto px-4 py-8">
           <h1 className="text-4xl font-bold">New Page</h1>
         </main>
       </Layout>
     );
   }
   ```

2. Add lazy import in `App.tsx`:
   ```typescript
   const NewPage = lazy(() => import('./pages/NewPage').then(m => ({ default: m.NewPage })));
   ```

3. Add route:
   ```tsx
   <Route path="/new-page" element={
     <Suspense fallback={<PageLoader />}>
       <NewPage />
     </Suspense>
   } />
   ```

### Adding Content

Edit `data/content.ts` for:
- Services
- Blog posts
- Testimonials
- FAQ items

### Running Linters

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix

# Check formatting
npm run format:check

# Fix formatting
npm run format
```

### Building for Production

```bash
# Full build
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 5173
lsof -i :5173

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

### Node Modules Issues

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check types without building
npx tsc --noEmit
```

### Tailwind Classes Not Working

1. Check `tailwind.config.js` content paths
2. Restart dev server
3. Clear browser cache

### Build Warnings

**Chunk size warning**: Content chunk exceeds 500KB. This is expected and doesn't affect functionality.

**Unused exports warning**: Some data exports may appear unused - they're used dynamically.

## Testing Locally

### Mobile Testing

1. Start dev server
2. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Access `http://<your-ip>:5173` from mobile device (same network)

### Production Preview

```bash
npm run build
npm run preview
```

Access at `http://localhost:4173`

## Environment Variables Reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `SCHEDULED_PASSWORD` | Yes (Netlify only) | Protects /blog/scheduled (server-side, set in Netlify dashboard) |
| `VITE_GA4_ID` | No | Google Analytics 4 |
| `VITE_CLARITY_ID` | No | Microsoft Clarity |

**Note:** Variables prefixed with `VITE_` are exposed to the browser. `SCHEDULED_PASSWORD` is **not** prefixed with `VITE_` because it is verified server-side by a Netlify function and must never be exposed to the client.

## Performance Profiling

### React DevTools

1. Install React DevTools browser extension
2. Open DevTools → Profiler tab
3. Record and analyze component renders

### Lighthouse

1. Build production: `npm run build`
2. Preview: `npm run preview`
3. Open Chrome DevTools → Lighthouse
4. Run audit

### Bundle Analysis

```bash
# Add to vite.config.ts temporarily
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  visualizer({ open: true })
]
```

---

*Last Updated: January 2026*
