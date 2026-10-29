import React, { useEffect } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { getLegalDocument, addVersionHistoryLinks, type LegalSlug } from '../data/legalDocuments';
import { stableClauseId, stableHeadingId } from '../utils/legalDocuments';
import { T, useWindowWidth, Eyebrow, DisplayHead } from '../components-v2/primitives';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const plainText = (children: React.ReactNode): string =>
  React.Children.toArray(children)
    .map(child => {
      if (typeof child === 'string' || typeof child === 'number') return String(child);
      if (React.isValidElement<{ children?: React.ReactNode }>(child))
        return plainText(child.props.children);
      return '';
    })
    .join('');

const headingStyle: React.CSSProperties = {
  fontFamily: "'Bungee', sans-serif",
  color: T.primaryDark,
  lineHeight: 1.18,
  scrollMarginTop: 96,
};

const markdownComponents: Components = {
  h1: () => null,
  h2: ({ children }) => (
    <h2
      id={stableHeadingId(plainText(children))}
      style={{ ...headingStyle, fontSize: 22, margin: '42px 0 14px' }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      id={stableHeadingId(plainText(children))}
      style={{ ...headingStyle, fontSize: 17, margin: '30px 0 10px' }}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => {
    const id = stableClauseId(plainText(children));
    return (
      <p id={id} style={{ margin: '0 0 16px', scrollMarginTop: 96 }}>
        {children}
      </p>
    );
  },
  a: ({ href = '', children }) =>
    href.startsWith('/') ? (
      <Link to={href} style={{ color: T.primaryDark, fontWeight: 600 }}>
        {children}
      </Link>
    ) : (
      <a href={href} style={{ color: T.primaryDark, fontWeight: 600 }}>
        {children}
      </a>
    ),
  ul: ({ children }) => <ul style={{ paddingLeft: 24, margin: '8px 0 18px' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: 24, margin: '8px 0 18px' }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: 6 }}>{children}</li>,
  table: ({ children }) => (
    <div
      className="legal-table-scroll"
      tabIndex={0}
      role="region"
      aria-label="Scrollable legal document table"
    >
      <table>{children}</table>
    </div>
  ),
  th: ({ children }) => <th scope="col">{children}</th>,
  td: ({ children }) => <td>{children}</td>,
};

const formatDocumentDate = (value?: string): string => {
  if (!value || value.includes('[DECIDE')) return value || 'Not set';
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
};

export const LegalDocumentPageV2: React.FC<{ slug: LegalSlug }> = ({ slug }) => {
  const { version } = useParams<{ version?: string }>();
  const location = useLocation();
  const legalDocument = getLegalDocument(slug, version);
  const isMobile = useWindowWidth() < 768;

  useEffect(() => {
    if (!legalDocument || !location.hash) return;
    let frame = 0;
    let cancelled = false;
    void window.document.fonts.ready.then(() => {
      if (cancelled) return;
      frame = window.requestAnimationFrame(() => {
        window.document
          .getElementById(decodeURIComponent(location.hash.slice(1)))
          ?.scrollIntoView({ block: 'start' });
      });
    });
    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [legalDocument, location.hash]);

  if (!legalDocument) return <Navigate to="/not-found" replace />;

  const { metadata, body, placeholders } = legalDocument;
  const dateLabel = metadata.version ? 'Effective date' : 'Last updated';
  const dateValue = placeholders.length
    ? 'Not yet published'
    : formatDocumentDate(metadata.effective_date || metadata.last_updated);
  const printMeta = metadata.version ? `Version ${metadata.version}` : `${dateLabel}: ${dateValue}`;
  const bodyWithVersionLinks = metadata.version ? addVersionHistoryLinks(body, slug) : body;

  return (
    <article className="legal-page" data-placeholder-count={placeholders.length}>
      <SEO
        title={metadata.title}
        description={metadata.summary}
        type="article"
        canonicalPath={location.pathname}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: metadata.title, item: `/${slug}` },
          ...(version ? [{ name: `Version ${metadata.version}`, item: location.pathname }] : []),
        ]}
      />

      <section
        className="legal-page-hero"
        style={{
          background: T.ink,
          padding: isMobile ? '56px 20px 64px' : '64px 32px 72px',
          ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Eyebrow light>{metadata.title}</Eyebrow>
          <DisplayHead as="h1" size={isMobile ? 38 : 48} light style={{ marginBottom: 18 }}>
            The legal bit.
          </DisplayHead>
          <dl className="legal-document-meta">
            {metadata.version && (
              <>
                <dt>Version</dt>
                <dd>{metadata.version}</dd>
              </>
            )}
            <dt>{dateLabel}</dt>
            <dd>{dateValue}</dd>
          </dl>
        </div>
      </section>

      {placeholders.length > 0 && (
        <div className="legal-placeholder-warning" role="status">
          This legal page is being prepared and is not yet available.
        </div>
      )}

      {placeholders.length === 0 && (
        <section className="legal-document-content">
          <div className="legal-document-copy">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {bodyWithVersionLinks}
            </ReactMarkdown>
          </div>
        </section>
      )}

      <div className="legal-print-footer" aria-hidden="true">
        Fresh Tech | {printMeta} | https://fresh-tech.uk{location.pathname}
      </div>
    </article>
  );
};

export default LegalDocumentPageV2;
