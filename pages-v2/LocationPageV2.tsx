import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { locationsData } from '../data/content';
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

export const LocationPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const location = useLocation();
  const city = location.pathname.replace(/^\/locations\//, '');
  const loc = city ? locationsData[city] : undefined;

  if (!loc) {
    return (
      <section style={{ background: T.paper, padding: '120px 32px', minHeight: '60vh' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow>Location not found</Eyebrow>
          <DisplayHead size={36} style={{ marginBottom: 16 }}>We don't have a page for that town yet.</DisplayHead>
          <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 17, lineHeight: 1.6, margin: '0 auto 24px', maxWidth: '46ch' }}>
            We probably still cover it; give us a call.
          </p>
          <Link to="/contact" style={{
            display: 'inline-flex', padding: '14px 24px',
            background: T.accent, color: T.white,
            border: `2px solid ${T.ink}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
            textDecoration: 'none', boxShadow: `4px 4px 0 0 ${T.ink}`,
          }}>Get in touch →</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <SEO title={loc.heroTitle} description={loc.metaDesc} type="service" />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '72px 32px 80px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{
          maxWidth: contentMax(ww, 1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr',
          gap: isMobile ? 36 : 64,
          alignItems: 'center',
        }}>
          <div>
            <div style={{
              display: 'inline-block',
              background: T.yellow, border: `2px solid ${T.white}`,
              padding: '6px 16px',
              fontFamily: "'Bungee', sans-serif", fontSize: 12,
              transform: 'rotate(-2deg)', marginBottom: 24, color: T.ink,
            }}>📍 {loc.city}</div>
            <DisplayHead as="h1" size={isMobile ? 38 : 48} light style={{ marginBottom: 20, lineHeight: 1.0 }}>
              {loc.heroTitle}
            </DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 18, lineHeight: 1.65, margin: '0 0 32px', maxWidth: '50ch' }}>
              {loc.heroDesc}
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
              <a href="tel:+441584517234" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: 'transparent', color: T.white,
                border: '2px solid rgba(255,255,255,0.3)',
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
                textDecoration: 'none',
              }}>01584 517 234</a>
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '28px 32px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 48, color: T.yellow, lineHeight: 1 }}>Reviews</div>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginTop: 6,
            }}>Read customer feedback on Google</div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      {loc.introText && (
        <section style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <Eyebrow>About us locally</Eyebrow>
            {loc.introTitle && <DisplayHead size={36} style={{ marginBottom: 20 }}>{loc.introTitle}</DisplayHead>}
            <p style={{ color: 'rgba(15,25,35,0.7)', fontSize: 17, lineHeight: 1.75, margin: 0 }}>
              {renderInlineMd(loc.introText)}
            </p>
          </div>
        </section>
      )}

      {/* FEATURES */}
      {loc.features && loc.features.length > 0 && (
        <section style={{ background: T.paperDeep, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
          <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
            <div style={{ marginBottom: 40, textAlign: 'center' }}>
              <Eyebrow>What we bring to {loc.city}</Eyebrow>
              <DisplayHead size={36}>Why local matters</DisplayHead>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: 20,
            }}>
              {loc.features.map((f: { title: string; desc: string }, i: number) => (
                <div key={i} style={{
                  background: T.white, border: `1px solid ${T.hairline}`,
                  padding: 28, boxShadow: '0 4px 16px rgba(15,25,35,0.06)',
                }}>
                  <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 18, marginBottom: 10, lineHeight: 1.05 }}>{f.title}</div>
                  <div style={{ fontSize: 14, color: 'rgba(15,25,35,0.62)', lineHeight: 1.65 }}>
                    {renderInlineMd(f.desc)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {loc.faqs && loc.faqs.length > 0 && (
        <section style={{ background: T.white, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <Eyebrow>Questions from {loc.city} businesses</Eyebrow>
              <DisplayHead size={32}>Common questions</DisplayHead>
            </div>
            {loc.faqs.map((f: { q: string; a: string }, i: number) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{
        background: T.ink, padding: '72px 32px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>Ready to talk?</Eyebrow>
          <DisplayHead size={40} light style={{ marginBottom: 16 }}>IT support for {loc.city} businesses</DisplayHead>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.65, margin: '0 auto 32px', maxWidth: '44ch' }}>
            20 minutes. No sales pitch. We'll tell you honestly whether we can help.
          </p>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 28px',
            background: T.accent, color: T.white,
            border: `2px solid ${T.white}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 16,
            textDecoration: 'none',
            boxShadow: `4px 4px 0 0 ${T.yellow}`,
          }}>Book a 20-min call →</Link>
        </div>
      </section>
    </>
  );
};

export default LocationPageV2;
