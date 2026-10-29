import React, { useState } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { NotFoundPageV2 } from './NotFoundPageV2';
import { industryPages } from '../data/content';
import { T, useWindowWidth, contentMax, Eyebrow, DisplayHead } from '../components-v2/primitives';
import { renderInlineMd } from '../components-v2/inlineMd';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${T.hairline}` }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', textAlign: 'left',
        padding: '18px 0',
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: T.ink, lineHeight: 1.4 }}>{renderInlineMd(q)}</span>
        <span style={{
          fontFamily: "'Bungee', sans-serif", fontSize: 22, color: T.primary,
          flexShrink: 0,
          transform: open ? 'rotate(45deg)' : 'none',
          transition: 'transform 200ms', lineHeight: 1,
        }}>+</span>
      </button>
      {open && <div style={{ padding: '0 0 18px', color: 'rgba(15,25,35,0.62)', fontSize: 15, lineHeight: 1.65, maxWidth: '60ch' }}>{renderInlineMd(a)}</div>}
    </div>
  );
};

export const IndustryDetailPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const location = useLocation();
  const slug = location.pathname.replace(/^\/industries\//, '').replace(/\/+$/, '');

  // Duplicate sector slugs fold into their canonical page to avoid cannibalising
  // the established pages (engineering ≈ manufacturing, legal ≈ solicitors).
  const REDIRECTS: Record<string, string> = { engineering: 'manufacturing', legal: 'solicitors' };
  if (REDIRECTS[slug]) {
    return <Navigate to={`/industries/${REDIRECTS[slug]}`} replace />;
  }

  const ind = slug ? industryPages[slug] : undefined;

  if (!ind) return <NotFoundPageV2 />;

  const otherIndustries = Object.values(industryPages).filter(i => i.slug !== slug).slice(0, 3);

  return (
    <>
      <SEO title={ind.title} description={ind.metaDesc} type="service" />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '72px 32px 80px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{
          maxWidth: contentMax(ww, 1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.3fr 0.7fr',
          gap: isMobile ? 36 : 64,
          alignItems: 'center',
        }}>
          <div>
            <Eyebrow light>We work with {ind.name.toLowerCase()}</Eyebrow>
            <DisplayHead as="h1" size={isMobile ? 36 : 50} light style={{ marginBottom: 20, lineHeight: 0.97 }}>
              {ind.h1}
            </DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 18, lineHeight: 1.65, margin: '0 0 32px', maxWidth: '54ch' }}>
              {renderInlineMd(ind.intro)}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: T.accent, color: T.white,
                border: `2px solid ${T.white}`,
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
                textDecoration: 'none',
                boxShadow: `4px 4px 0 0 ${T.yellow}`,
              }}>Book a 20-min call →</Link>
              <a href="#challenges" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: 'transparent', color: T.white,
                border: '2px solid rgba(255,255,255,0.3)',
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
                textDecoration: 'none',
              }}>How we help ↓</a>
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '32px 28px',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 48, color: T.yellow, lineHeight: 1, marginBottom: 10 }}>{ind.minStaff ?? 5}+</div>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.5)', fontWeight: 700, lineHeight: 1.5,
            }}>Staff: typical client size in {ind.name.toLowerCase()}</div>
          </div>
        </div>
      </section>

      {/* CHALLENGES */}
      <section id="challenges" style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>{`What ${ind.name.toLowerCase()} deal with`}</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 8 }}>We know your problems</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, margin: 0, maxWidth: '52ch', lineHeight: 1.6 }}>
              These aren't hypothetical; they're the issues we fix every week.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : `repeat(${Math.min(ind.challenges.length, 2)}, 1fr)`,
            gap: 20,
          }}>
            {ind.challenges.map((c, i) => (
              <div key={i} style={{
                background: T.white, border: `1px solid ${T.hairline}`,
                padding: 28, boxShadow: '0 4px 16px rgba(15,25,35,0.06)',
              }}>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 18, marginBottom: 10, lineHeight: 1.05 }}>{c.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(15,25,35,0.62)', lineHeight: 1.65 }}>{renderInlineMd(c.desc)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTIONS */}
      <section style={{ background: T.paperDeep, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>What we do for you</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 8 }}>How we solve them</DisplayHead>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : `repeat(${Math.min(ind.solutions.length, 2)}, 1fr)`,
            gap: 20,
          }}>
            {ind.solutions.map((s, i) => (
              <div key={i} style={{
                background: T.white, border: `1px solid ${T.hairline}`,
                padding: 28, boxShadow: '0 4px 16px rgba(15,25,35,0.06)',
              }}>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 18, marginBottom: 10, lineHeight: 1.05, color: T.primary }}>{s.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(15,25,35,0.62)', lineHeight: 1.65 }}>{renderInlineMd(s.desc)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ + RELATED */}
      <section style={{ background: T.white, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{
          maxWidth: contentMax(ww, 1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr',
          gap: isMobile ? 32 : 64,
          alignItems: 'start',
        }}>
          <div>
            <Eyebrow>{`Questions from ${ind.name.toLowerCase()}`}</Eyebrow>
            <DisplayHead size={32} style={{ marginBottom: 24 }}>Specific to your sector</DisplayHead>
            {ind.faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
          <div>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.14em',
              color: 'rgba(15,25,35,0.4)', fontWeight: 700, marginBottom: 16,
            }}>Other sectors we support</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {otherIndustries.map(other => (
                <Link key={other.slug} to={`/industries/${other.slug}`} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 18px',
                  border: `1px solid ${T.hairline}`,
                  background: T.paper,
                  color: T.ink, textDecoration: 'none',
                  fontSize: 14, fontWeight: 600,
                }}>
                  {other.name}<span style={{ color: T.primary }}>→</span>
                </Link>
              ))}
              <Link to="/industries" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 18px',
                border: `1px dashed ${T.hairline}`,
                color: 'rgba(15,25,35,0.4)', textDecoration: 'none', fontSize: 13,
              }}>
                View all sectors <span>→</span>
              </Link>
            </div>
            <div style={{ background: T.ink, padding: 28, ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 12) }}>
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 22, color: T.white, marginBottom: 10, lineHeight: 1.05 }}>Not sure if we're right for your sector?</div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>Call us. 20 minutes. We'll tell you honestly.</p>
              <Link to="/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 20px',
                background: T.accent, color: T.white,
                border: `2px solid ${T.white}`,
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 14,
                textDecoration: 'none',
              }}>Book a call →</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default IndustryDetailPageV2;
