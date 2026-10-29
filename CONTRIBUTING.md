# Contributing to Fresh Tech Website

Guidelines for contributing to the Fresh Tech MSP website.

## Development Environment

### Prerequisites

| Software | Version | Notes |
|----------|---------|-------|
| Node.js | 18.x+ | 20.x recommended |
| npm | 9.x+ | Comes with Node.js |
| Git | 2.x+ | Version control |
| VS Code | Latest | Recommended IDE |

### Recommended VS Code Extensions

- **ESLint** - Linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - Autocomplete
- **TypeScript Importer** - Auto imports

### Setup

```bash
# Clone and install
git clone <repository-url>
cd freshtech-website
npm install

# Copy environment variables
cp .env.example .env.local

# Start development
npm run dev
```

## Code Style

### TypeScript

- **Strict mode** enabled - no `any` types without justification
- Use interfaces for object shapes
- Explicit return types on exported functions

```typescript
// Good
interface ServiceProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function ServiceCard({ title, description, icon }: ServiceProps): JSX.Element {
  return (
    <div>
      {icon}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

// Avoid
export function ServiceCard(props: any) {
  return <div>{props.title}</div>;
}
```

### React Patterns

- **Functional components** only
- **Named exports** for components
- **React.memo** for expensive renders
- **Lazy loading** for pages

```typescript
// Good - Named export
export function Hero() {
  return <section>...</section>;
}

// Good - Memoized component
export const Services = memo(function Services() {
  return <section>...</section>;
});

// Avoid - Default export
export default function Hero() { ... }
```

### File Organization

```typescript
// Component file structure
// 1. Imports (React, libraries, local)
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

// 2. Types/interfaces
interface PageProps {
  slug: string;
}

// 3. Component
export function ExamplePage({ slug }: PageProps) {
  // Hooks first
  const [data, setData] = useState(null);

  // Effects
  useEffect(() => {
    // ...
  }, [slug]);

  // Handlers
  const handleClick = () => {
    // ...
  };

  // Render
  return (
    <Layout>
      <SEO title="Example" />
      {/* content */}
    </Layout>
  );
}
```

### TailwindCSS

- Use utility classes directly
- Extract common patterns to components, not CSS
- Follow mobile-first responsive design

```tsx
// Good - Utilities inline
<button className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors">
  Click me
</button>

// Good - Extracted component
<Button variant="primary">Click me</Button>

// Avoid - Custom CSS
<button className="my-custom-button">Click me</button>
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ServiceCard.tsx` |
| Pages | PascalCase + Page | `AboutPage.tsx` |
| Utilities | camelCase | `analytics.ts` |
| Data files | camelCase | `content.ts` |
| CSS classes | kebab-case | `hero-section` |
| Constants | SCREAMING_SNAKE | `MAX_ITEMS` |

## Git Workflow

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/new-quiz` |
| Bug fix | `fix/description` | `fix/mobile-nav` |
| Content | `content/description` | `content/new-blog-post` |
| Chore | `chore/description` | `chore/update-deps` |

### Commit Messages

Follow [Conventional Commits](https://conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting (no code change)
- `refactor` - Code restructuring
- `perf` - Performance improvement
- `test` - Adding tests
- `chore` - Maintenance

**Examples:**

```bash
feat(blog): add new post about cyber security
fix(nav): resolve mobile menu z-index issue
docs(readme): add deployment instructions
refactor(layout): extract header into separate component
perf(images): convert hero images to WebP
```

### Pull Request Process

1. **Create branch** from `main`
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes** following code style

3. **Run checks** before committing
   ```bash
   npm run lint
   npm run format:check
   npm run build
   ```

4. **Commit changes** with descriptive message

5. **Push and create PR**
   ```bash
   git push -u origin feature/your-feature
   ```

6. **PR Description Template**
   ```markdown
   ## Summary
   Brief description of changes

   ## Changes
   - Change 1
   - Change 2

   ## Testing
   How to test these changes

   ## Screenshots
   (if UI changes)
   ```

## Adding New Pages

### 1. Create Page Component

```typescript
// pages/NewPage.tsx
import { SEO } from '../components/SEO';
import { Layout } from '../components/Layout';

export function NewPage() {
  return (
    <Layout>
      <SEO
        title="New Page"
        description="Description for SEO"
        slug="/new-page"
      />
      <main>
        {/* Page content */}
      </main>
    </Layout>
  );
}
```

### 2. Add Route in App.tsx

```typescript
// App.tsx
const NewPage = lazy(() => import('./pages/NewPage').then(m => ({ default: m.NewPage })));

// In routes
<Route path="/new-page" element={
  <Suspense fallback={<PageLoader />}>
    <NewPage />
  </Suspense>
} />
```

### 3. Update Sitemap

Add the new URL to `scripts/generate-sitemap.js` if it's a static page.

## Adding New Components

### 1. Create Component

```typescript
// components/NewComponent.tsx
interface NewComponentProps {
  title: string;
  children: React.ReactNode;
}

export function NewComponent({ title, children }: NewComponentProps) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </div>
  );
}
```

### 2. Export if Needed

If used across multiple files, consider barrel exports or direct imports.

## Content Updates

### Blog Posts

1. Add post data to `data/content.ts`
2. Include all required fields (title, slug, date, content, etc.)
3. Ensure image URLs use Cloudinary

### Service Pages

1. Update `data/content.ts` services array
2. Add corresponding service detail page if new

## Testing Checklist

Before submitting PR:

- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Tested on mobile viewport
- [ ] Accessibility: keyboard navigation works
- [ ] SEO: title and description set
- [ ] No console errors in browser

## Performance Guidelines

- Images: Use WebP format, set width/height
- Components: Use React.memo for expensive renders
- Imports: Dynamic import for heavy libraries
- Content: Keep individual pages under 50KB

## Questions?

- Check existing code for patterns
- Ask in PR comments if unsure

---

*Last Updated: January 2026*
