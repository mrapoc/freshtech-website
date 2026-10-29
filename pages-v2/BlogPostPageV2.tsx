import React, { Fragment } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { NotFoundPageV2 } from './NotFoundPageV2';
import { blogPosts } from '../data/content';
import { isHeld } from '../data/editorialHolds';
import { T, useWindowWidth, contentMax, Eyebrow } from '../components-v2/primitives';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const isFuturePost = (s: string): boolean => {
  const d = new Date(s);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d > today;
};

// ─────────────────────────────────────────────────────────────────────
// Minimal markdown renderer — handles headings, paragraphs, bold,
// italic, links, lists, tables. Adapted from the v1 renderContent in a
// tighter form so we don't duplicate the 200-line original.
// ─────────────────────────────────────────────────────────────────────

const parseBold = (text: string): React.ReactNode => {
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const boldStart = text.indexOf('**', i);
    const codeStart = text.indexOf('`', i);
    const next = [boldStart, codeStart].filter(n => n !== -1).sort((a, b) => a - b)[0];
    if (next === undefined) { out.push(text.slice(i)); break; }
    if (next > i) out.push(text.slice(i, next));
    if (next === boldStart) {
      const end = text.indexOf('**', boldStart + 2);
      if (end === -1) { out.push(text.slice(i)); break; }
      out.push(<strong key={key++}>{text.slice(boldStart + 2, end)}</strong>);
      i = end + 2;
    } else {
      const end = text.indexOf('`', codeStart + 1);
      if (end === -1) { out.push(text.slice(i)); break; }
      out.push(
        <code key={key++} style={{
          background: T.paperDeep, padding: '2px 6px',
          fontFamily: 'monospace', fontSize: '0.9em',
        }}>{text.slice(codeStart + 1, end)}</code>
      );
      i = end + 1;
    }
  }
  return <>{out}</>;
};

const parseInline = (text: string): React.ReactNode => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(parseBold(text.slice(lastIndex, match.index)));
    const url = match[2];
    const label = match[1];
    if (url.startsWith('http://') || url.startsWith('https://')) {
      parts.push(<a key={key++} href={url} target="_blank" rel="noopener noreferrer" style={{ color: T.primary, fontWeight: 600 }}>{label}</a>);
    } else {
      parts.push(<Link key={key++} to={url} style={{ color: T.primary, fontWeight: 600 }}>{label}</Link>);
    }
    lastIndex = linkRegex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(parseBold(text.slice(lastIndex)));
  return parts.length > 0 ? <>{parts}</> : parseBold(text);
};

const renderContent = (content: string): React.ReactNode[] => {
  const normalized = content.replace(/\r\n/g, '\n');
  const blocks: string[] = [];
  const lines = normalized.split('\n');
  let cur: string[] = [];
  let inList = false;
  for (const line of lines) {
    const isListItem = /^(\*|-|\d+\.)\s/.test(line);
    const isEmpty = line.trim() === '';
    if (isEmpty) {
      if (cur.length > 0) { blocks.push(cur.join('\n')); cur = []; }
      inList = false;
    } else if (isListItem) {
      if (!inList && cur.length > 0) { blocks.push(cur.join('\n')); cur = []; }
      cur.push(line); inList = true;
    } else {
      if (inList && cur.length > 0) { blocks.push(cur.join('\n')); cur = []; }
      cur.push(line); inList = false;
    }
  }
  if (cur.length > 0) blocks.push(cur.join('\n'));

  return blocks.map((block, i) => {
    const t = block.trim();
    if (t.startsWith('## ')) {
      return <h2 key={i} style={{ fontFamily: "'Bungee', sans-serif", fontSize: 28, color: T.primaryDark, margin: '40px 0 16px', lineHeight: 1.1 }}>{parseInline(t.slice(3))}</h2>;
    }
    if (t.startsWith('### ')) {
      return <h3 key={i} style={{ fontFamily: "'Bungee', sans-serif", fontSize: 22, color: T.primary, margin: '32px 0 14px', lineHeight: 1.1 }}>{parseInline(t.slice(4))}</h3>;
    }
    // Tables
    if (t.startsWith('|') && t.includes('|---')) {
      const tableLines = t.split('\n').filter(l => l.trim());
      if (tableLines.length >= 2) {
        const header = tableLines[0].split('|').filter(c => c.trim()).map(c => c.trim());
        const rows = tableLines.slice(2).map(l => l.split('|').filter(c => c.trim()).map(c => c.trim()));
        return (
          <div key={i} style={{ overflowX: 'auto', marginBottom: 24 }}>
            <table style={{ minWidth: '100%', borderCollapse: 'collapse', border: `1px solid ${T.hairline}` }}>
              <thead style={{ background: T.ink, color: T.white }}>
                <tr>{header.map((c, k) => (
                  <th key={k} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontFamily: "'Archivo Narrow', sans-serif", fontSize: 12,
                    textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700,
                  }}>{parseInline(c)}</th>
                ))}</tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? T.paper : T.white }}>
                    {r.map((c, ci) => (
                      <td key={ci} style={{
                        padding: '12px 16px', fontSize: 14, color: T.ink,
                        borderTop: `1px solid ${T.hairline}`,
                      }}>{parseInline(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }
    // Lists
    if (t.startsWith('* ') || t.startsWith('- ')) {
      const items = t.split('\n').filter(l => l.startsWith('* ') || l.startsWith('- ')).map(l => l.slice(2));
      return (
        <ul key={i} style={{ paddingLeft: 24, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((it, k) => <li key={k} style={{ color: T.ink, lineHeight: 1.65 }}>{parseInline(it)}</li>)}
        </ul>
      );
    }
    if (/^\d+\.\s/.test(t)) {
      const items = t.split('\n').filter(l => /^\d+\.\s/.test(l)).map(l => l.replace(/^\d+\.\s/, ''));
      return (
        <ol key={i} style={{ paddingLeft: 24, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((it, k) => <li key={k} style={{ color: T.ink, lineHeight: 1.65 }}>{parseInline(it)}</li>)}
        </ol>
      );
    }
    return <p key={i} style={{ margin: '0 0 20px', color: T.ink, lineHeight: 1.75, fontSize: 16 }}>{parseInline(t)}</p>;
  });
};

export const BlogPostPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) return <NotFoundPageV2 />;

  // Scheduled posts live in the data file before their publish date, so they
  // have to be filtered out here too or every article links to unpublished ones.
  const related = blogPosts
    .filter(p => p.slug !== slug && !isHeld(p.slug) && !isFuturePost(p.date))
    .slice(0, 3);
  const initials = (post.author || 'Sam')
    .split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);

  // Posts can carry an optional self-hosted video (Cloudinary). When present it
  // replaces the hero image on the page and adds VideoObject markup so the clip
  // is eligible for video results.
  const video = post.video;
  // Date-only (YYYY-MM-DD). Post dates like "Aug 11, 2026" parse to local
  // midnight, so toISOString() would shift them a day back over BST. Schema.org
  // accepts a plain Date, which sidesteps the timezone entirely.
  const publishedIso = (() => {
    const d = new Date(post.date);
    if (isNaN(d.getTime())) return undefined;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();
  // Build the Article schema here rather than letting SEO's `type="article"`
  // default handle it, so every post carries datePublished/dateModified. The
  // default omits them, which loses the freshness signal on all 40+ posts.
  const postUrl = `https://fresh-tech.uk/blog/${post.slug}`;
  const ORG = { "@id": "https://fresh-tech.uk/#organization" };
  const postSchema: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": post.excerpt,
      "image": post.image,
      "url": postUrl,
      "author": ORG,
      "publisher": ORG,
      "mainEntityOfPage": postUrl,
      ...(publishedIso ? { datePublished: publishedIso, dateModified: publishedIso } : {}),
    },
  ];
  if (video) {
    postSchema.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": video.title || post.title,
      "description": video.caption || post.excerpt,
      // Google asks for thumbnails in more than one aspect ratio where possible.
      "thumbnailUrl": [video.poster, post.image].filter(Boolean),
      // contentUrl only. `embedUrl` must point at a player, never at the page
      // the video sits on, so it is deliberately omitted.
      "contentUrl": video.src,
      ...(publishedIso ? { uploadDate: publishedIso } : {}),
      ...(video.duration ? { duration: video.duration } : {}),
      "publisher": ORG,
    });
  }

  return (
    <>
      <SEO title={post.title} description={post.excerpt} type="article" image={post.image} schema={postSchema} />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '72px 32px 80px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ marginBottom: 16 }}>
            <Link to="/blog" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>← Blog</Link>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
              {post.tags.slice(0, 3).map(t => (
                <span key={t} style={{
                  background: T.primary, color: T.white,
                  padding: '3px 9px',
                  fontFamily: "'Archivo Narrow', sans-serif", fontSize: 10,
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>{t}</span>
              ))}
            </div>
          )}
          <h1 style={{
            fontFamily: "'Bungee', sans-serif",
            fontSize: isMobile ? 30 : 44,
            color: T.white, margin: '0 0 24px', lineHeight: 1.05, letterSpacing: '-0.01em',
          }}>{post.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.6)' }}>
            <div style={{
              width: 32, height: 32,
              background: T.paperDeep,
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Bungee', sans-serif", fontSize: 11,
              color: T.ink,
            }}>{initials}</div>
            <span style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 12, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>{post.author || 'Sam'} · {post.date} · {post.readTime}</span>
          </div>
        </div>
      </section>

      {/* HERO VIDEO (takes precedence over the hero image when a post has one) */}
      {video ? (
        <section style={{ background: T.paperDeep, padding: isMobile ? '32px 20px' : '48px 32px' }}>
          {/* maxWidth keeps portrait (9:16 social) clips from filling the page */}
          <div style={{ maxWidth: video.maxWidth || 880, margin: '0 auto' }}>
            <video
              controls
              preload="metadata"
              playsInline
              poster={video.poster}
              style={{
                width: '100%', height: 'auto', display: 'block',
                background: T.ink,
                border: `2px solid ${T.ink}`,
                boxShadow: `4px 4px 0 0 ${T.ink}`,
              }}
            >
              <source src={video.src} type="video/mp4" />
              Your browser can't play this video. The full transcript is below.
            </video>
            {video.caption && (
              <p style={{
                margin: '14px 0 0',
                fontFamily: "'Archivo Narrow', sans-serif",
                fontSize: 13, lineHeight: 1.5,
                color: 'rgba(15,25,35,0.62)',
              }}>{video.caption}</p>
            )}
          </div>
        </section>
      ) : post.image && (
        <section style={{ background: T.paperDeep, padding: isMobile ? '32px 20px' : '48px 32px' }}>
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            <img
              src={post.image}
              alt={post.imageAlt || post.title}
              style={{
                width: '100%', height: 'auto', display: 'block',
                border: `2px solid ${T.ink}`,
                boxShadow: `4px 4px 0 0 ${T.ink}`,
              }}
            />
          </div>
        </section>
      )}

      {/* CONTENT */}
      <section style={{ background: T.paper, padding: isMobile ? '48px 20px' : '72px 32px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {post.excerpt && (
            <p style={{
              fontSize: 19, color: 'rgba(15,25,35,0.75)',
              lineHeight: 1.6, margin: '0 0 32px',
              borderLeft: `4px solid ${T.primary}`,
              paddingLeft: 20,
              fontStyle: 'italic',
            }}>{post.excerpt}</p>
          )}
          <article style={{ fontFamily: "'Archivo', sans-serif" }}>
            {renderContent(post.content)}
          </article>
        </div>
      </section>

      {/* RELATED */}
      {related.length > 0 && (
        <section style={{ background: T.paperDeep, padding: '64px 32px', borderTop: `1px solid ${T.hairline}` }}>
          <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
            <Eyebrow>More reading</Eyebrow>
            <div style={{
              fontFamily: "'Bungee', sans-serif", fontSize: 28,
              color: T.ink, marginBottom: 32, lineHeight: 1.05,
            }}>Related articles</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: 16,
            }}>
              {related.map(r => (
                <Link key={r.slug} to={`/blog/${r.slug}`} style={{
                  display: 'block',
                  background: T.white, border: `1px solid ${T.hairline}`,
                  padding: 20,
                  textDecoration: 'none', color: T.ink,
                }}>
                  {r.tags && r.tags[0] && (
                    <div style={{
                      display: 'inline-block',
                      background: T.primary, color: T.white,
                      padding: '3px 9px',
                      fontFamily: "'Archivo Narrow', sans-serif", fontSize: 10,
                      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                      marginBottom: 12,
                    }}>{r.tags[0]}</div>
                  )}
                  <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 15, lineHeight: 1.15, marginBottom: 8 }}>{r.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(15,25,35,0.62)', lineHeight: 1.5 }}>{r.excerpt}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{
        background: T.ink, padding: '64px 32px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>Got an IT question?</Eyebrow>
          <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 36, color: T.white, marginBottom: 16, lineHeight: 1.05 }}>
            Call us. We pick up.
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.65, margin: '0 auto 28px', maxWidth: '40ch' }}>
            20 minutes. No sales pitch. Just a straight answer to your IT question.
          </p>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 24px',
            background: T.accent, color: T.white,
            border: `2px solid ${T.white}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
            textDecoration: 'none',
            boxShadow: `4px 4px 0 0 ${T.yellow}`,
          }}>Book a 20-min call →</Link>
        </div>
      </section>
    </>
  );
};

export default BlogPostPageV2;
