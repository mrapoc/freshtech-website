import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { blogPosts } from '../data/content';
import { isHeld } from '../data/editorialHolds';
import { T, useWindowWidth, contentMax } from '../components-v2/primitives';

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

const CAT_COLOURS: Record<string, string> = {
  'Security':       T.accent,
  'Cyber Security': T.accent,
  'Email':          T.primaryDark,
  'AI':             T.primary,
  'Microsoft 365':  '#0078D4',
  'Hardware':       T.primaryDark,
  'Software':       T.primary,
  'Business Guide': T.primaryDark,
  'Cost Saving':    T.green,
  'Compliance':     '#7B4F2E',
};

const colorFor = (cat: string) => CAT_COLOURS[cat] || T.primary;

interface PostListItem {
  slug: string;
  title: string;
  category: string;
  date: string;
  readingTime: string;
  author: { name: string; initials: string };
  summary: string;
}

const initialsOf = (name: string): string =>
  name.split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);

const POSTS: PostListItem[] = blogPosts
  .filter(p => !isHeld(p.slug) && !isFuturePost(p.date))
  .map(p => ({
    slug: p.slug,
    title: p.title,
    category: (p.tags && p.tags[0]) || 'IT Advice',
    date: p.date,
    readingTime: p.readTime,
    author: { name: p.author || 'Sam', initials: initialsOf(p.author || 'Sam James') },
    summary: p.excerpt,
  }))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const FEATURED = POSTS.slice(0, 2);
const ALL_CATS = ['All', ...Array.from(new Set(POSTS.map(p => p.category)))];

const CatBadge: React.FC<{ category: string }> = ({ category }) => (
  <span style={{
    display: 'inline-block',
    background: colorFor(category), color: T.white,
    padding: '3px 9px',
    fontFamily: "'Archivo Narrow', sans-serif",
    fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.1em',
    whiteSpace: 'nowrap',
  }}>{category}</span>
);

const AuthorChip: React.FC<{ author: { name: string; initials: string }; date: string; readingTime: string; light?: boolean }> = ({ author, date, readingTime, light }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{
      width: 28, height: 28,
      background: light ? 'rgba(255,255,255,0.15)' : T.paperDeep,
      border: `1px solid ${light ? 'rgba(255,255,255,0.2)' : T.hairline}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Bungee', sans-serif", fontSize: 9,
      color: light ? T.white : T.ink,
      flexShrink: 0,
    }}>{author.initials}</div>
    <span style={{
      fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      color: light ? 'rgba(255,255,255,0.45)' : 'rgba(15,25,35,0.4)',
    }}>{author.name} · {date} · {readingTime}</span>
  </div>
);

const FeaturedPostCard: React.FC<{ post: PostListItem }> = ({ post }) => {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={`/blog/${post.slug}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        background: T.ink,
        border: `2px solid ${T.ink}`,
        textDecoration: 'none',
        boxShadow: hov ? `6px 6px 0 0 ${T.accent}` : `4px 4px 0 0 ${T.ink}`,
        transition: 'box-shadow 180ms',
        ...halftoneCss('rgba(255,255,255,0.03)', 1.4, 12),
      }}
    >
      <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <CatBadge category={post.category} />
          <span style={{ fontFamily: "'Bungee', sans-serif", fontSize: 10, color: T.yellow, letterSpacing: '0.1em' }}>FEATURED</span>
        </div>
        <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 26, lineHeight: 1.05, color: T.white }}>{post.title}</div>
        <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
          {post.summary}
        </p>
        <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <AuthorChip author={post.author} date={post.date} readingTime={post.readingTime} light />
          <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: 13, fontWeight: 700, color: T.accent }}>Read →</span>
        </div>
      </div>
      <div style={{
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.04)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '40px 32px', textAlign: 'center', gap: 16,
      }}>
        <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 64, lineHeight: 0.8, color: T.primary, opacity: 0.6 }}>"</div>
        <p style={{
          fontFamily: "'Archivo', sans-serif", fontSize: 16, lineHeight: 1.55,
          color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', margin: 0, maxWidth: '22ch',
        }}>{post.summary.split('.')[0] + '.'}</p>
        <div style={{
          marginTop: 8,
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)',
        }}>{post.readingTime}</div>
      </div>
    </Link>
  );
};

const PostCard: React.FC<{ post: PostListItem }> = ({ post }) => {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={`/blog/${post.slug}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column',
        background: T.white,
        border: `1px solid ${hov ? T.primary : T.hairline}`,
        textDecoration: 'none', color: T.ink,
        boxShadow: hov ? `4px 4px 0 0 ${T.primary}` : '0 4px 16px rgba(15,25,35,0.06)',
        transition: 'all 180ms',
      }}
    >
      <div style={{ height: 4, background: colorFor(post.category) }} />
      <div style={{ padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <CatBadge category={post.category} />
        <div style={{
          fontFamily: "'Bungee', sans-serif", fontSize: 17, lineHeight: 1.1,
          color: hov ? T.primary : T.ink, transition: 'color 150ms',
        }}>{post.title}</div>
        <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: 14, lineHeight: 1.6, color: 'rgba(15,25,35,0.62)', margin: 0, flex: 1 }}>
          {post.summary}
        </p>
        <div style={{ paddingTop: 12, borderTop: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <AuthorChip author={post.author} date={post.date} readingTime={post.readingTime} />
          <span style={{
            fontFamily: "'Archivo', sans-serif", fontSize: 13, fontWeight: 700,
            color: hov ? T.primary : 'rgba(15,25,35,0.4)',
            transition: 'color 150ms', flexShrink: 0,
          }}>Read →</span>
        </div>
      </div>
    </Link>
  );
};

export const BlogPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const isTablet = ww < 1024;
  const [filter, setFilter] = useState<string>('All');

  const filtered = POSTS.filter(p => filter === 'All' || p.category === filter);

  const catCounts = POSTS.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <SEO
        title="Blog: Plain-English IT Advice for Shropshire Businesses"
        description="Practical IT guides, plain-English advice and honest answers from Fresh Tech, managed IT support based in Ludlow, Shropshire."
        type="collection"
      />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '48px 20px 56px' : '72px 32px 80px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{
          maxWidth: contentMax(ww, 1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 32 : 64,
          alignItems: 'end',
        }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{
                background: T.yellow,
                border: '2px solid rgba(255,255,255,0.3)',
                padding: '5px 14px',
                fontFamily: "'Bungee', sans-serif", fontSize: 11,
                transform: 'rotate(-2deg)', color: T.ink,
              }}>IT insights</div>
              <div style={{
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '5px 14px',
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.45)',
              }}>No jargon · No upsell</div>
            </div>
            <h1 style={{
              fontFamily: "'Bungee', sans-serif", fontSize: isMobile ? 40 : 52,
              lineHeight: 0.92, color: T.white, margin: 0, marginBottom: 18, letterSpacing: '-0.01em',
              fontWeight: 400,
            }}>The IT blog nobody asked for.</h1>
            <p style={{
              fontFamily: "'Archivo', sans-serif", fontSize: 17, lineHeight: 1.65,
              color: 'rgba(255,255,255,0.6)', margin: 0, maxWidth: '44ch',
            }}>
              Practical advice for businesses with 5–50 staff across Shropshire and Herefordshire. Written by engineers who fix the problems, not a content team.
            </p>
          </div>

          {(() => {
            // Cap the hero browser to the top 6 categories so it doesn't stack
            // 15-tall next to the hero copy. The full chip list is in the body.
            const TOP_N = 6;
            const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
            const top = sorted.slice(0, TOP_N);
            const remainder = sorted.length - TOP_N;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button
                  onClick={() => setFilter('All')}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px',
                    background: filter === 'All' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${filter === 'All' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                    cursor: 'pointer', transition: 'all 150ms', color: 'inherit',
                  }}
                >
                  <span style={{
                    fontFamily: "'Archivo', sans-serif", fontSize: 14, fontWeight: 700,
                    color: filter === 'All' ? T.white : 'rgba(255,255,255,0.65)',
                  }}>All articles</span>
                  <span style={{
                    fontFamily: "'Bungee', sans-serif", fontSize: 14,
                    color: filter === 'All' ? T.yellow : 'rgba(255,255,255,0.3)',
                  }}>{POSTS.length}</span>
                </button>
                {top.map(([cat, count]) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px',
                      background: filter === cat ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${filter === cat ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                      cursor: 'pointer', transition: 'all 150ms', color: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, background: colorFor(cat), flexShrink: 0 }} />
                      <span style={{
                        fontFamily: "'Archivo', sans-serif", fontSize: 14, fontWeight: 600,
                        color: filter === cat ? T.white : 'rgba(255,255,255,0.65)',
                      }}>{cat}</span>
                    </div>
                    <span style={{
                      fontFamily: "'Bungee', sans-serif", fontSize: 14,
                      color: filter === cat ? T.yellow : 'rgba(255,255,255,0.3)',
                    }}>{count}</span>
                  </button>
                ))}
                {remainder > 0 && (
                  <a
                    href="#all-articles"
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 16px',
                      background: 'transparent',
                      border: '1px dashed rgba(255,255,255,0.15)',
                      textDecoration: 'none',
                      fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      fontWeight: 700, color: 'rgba(255,255,255,0.45)',
                    }}
                  >
                    +{remainder} more in the full list
                    <span>↓</span>
                  </a>
                )}
              </div>
            );
          })()}
        </div>
      </section>

      {/* FEATURED */}
      {filter === 'All' && FEATURED.length > 0 && (
        <section style={{
          background: T.paperDeep,
          padding: isMobile ? '48px 20px' : '72px 32px',
          borderBottom: `1px solid ${T.hairline}`,
        }}>
          <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.14em',
              fontWeight: 700, color: T.primary, marginBottom: 24,
            }}>Featured articles</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {FEATURED.map(p => isMobile ? <PostCard key={p.slug} post={p} /> : <FeaturedPostCard key={p.slug} post={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ALL POSTS */}
      <section id="all-articles" style={{ background: T.paper, padding: isMobile ? '48px 20px' : '72px 32px' }}>
        <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            marginBottom: 32, flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <div style={{
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.14em',
                fontWeight: 700, color: T.primary, marginBottom: 8,
              }}>{filter === 'All' ? 'All articles' : filter}</div>
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 32, lineHeight: 0.95, color: T.ink }}>
                {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ALL_CATS.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  style={{
                    padding: '7px 14px',
                    background: filter === cat ? T.ink : T.white,
                    color: filter === cat ? T.white : T.ink,
                    border: `1px solid ${filter === cat ? T.ink : T.hairline}`,
                    fontFamily: "'Archivo Narrow', sans-serif",
                    fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    cursor: 'pointer', transition: 'all 150ms',
                    boxShadow: filter === cat ? `2px 2px 0 0 ${T.ink}` : 'none',
                  }}
                >{cat}</button>
              ))}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3, 1fr)',
            gap: 20,
          }}>
            {filtered.map(p => <PostCard key={p.slug} post={p} />)}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'rgba(15,25,35,0.4)' }}>
              No articles in this category yet. <Link to="/contact" style={{ color: T.primary, fontWeight: 700 }}>Got a question? Ask us directly →</Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA STRIP */}
      <section style={{ background: T.primary, padding: isMobile ? '40px 20px' : '56px 32px' }}>
        <div style={{
          maxWidth: contentMax(ww, 1100), margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 24,
        }}>
          <div>
            <div style={{
              fontFamily: "'Bungee', sans-serif", fontSize: isMobile ? 22 : 28,
              color: T.white, lineHeight: 1, marginBottom: 8,
            }}>IT problem you want a straight answer to?</div>
            <div style={{
              fontFamily: "'Archivo', sans-serif", fontSize: 15,
              color: 'rgba(255,255,255,0.75)', fontWeight: 500,
            }}>Call us. 01584 517 234. We pick up.</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
            <Link to="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 22px',
              background: T.white, color: T.ink,
              border: `2px solid ${T.ink}`,
              boxShadow: `3px 3px 0 0 ${T.ink}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 14,
              textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}>Book a free call →</Link>
            <Link to="/services" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 22px',
              background: 'transparent', color: T.white,
              border: '2px solid rgba(255,255,255,0.35)',
              fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: 14,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>Our services</Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default BlogPageV2;
