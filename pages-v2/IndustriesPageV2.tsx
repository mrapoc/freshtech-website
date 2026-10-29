import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { industryPages } from '../data/content';
import { T, useWindowWidth, useContentMax, halftone, Eyebrow, DisplayHead, Sticker } from '../components-v2/primitives';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const SECTOR_TONES = [T.primary, T.accent, T.green, T.yellow, '#7B4F2E', T.primaryDark, '#5B4A7A', '#4A7A3A'];

export const IndustriesPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const isTablet = ww < 1024;
  const cols     = isMobile ? 1 : isTablet ? 2 : 3;
  const sectors  = Object.values(industryPages);

  return (
    <>
      <SEO
        title="Sectors We Work With: Specialist IT Support"
        description="Specialist IT support for solicitors, accountants, healthcare, manufacturing, charities and more, across Shropshire, Herefordshire and the Welsh Borders."
        type="service"
      />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '72px 32px 80px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr',
          gap: isMobile ? 36 : 64,
          alignItems: 'center',
        }}>
          <div>
            <Eyebrow light>Sectors we know</Eyebrow>
            <DisplayHead as="h1" size={isMobile ? 38 : 52} light style={{ marginBottom: 20, lineHeight: 1.0 }}>
              We probably know your software.
            </DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 18, lineHeight: 1.65, margin: '0 0 32px', maxWidth: '50ch' }}>
              Over a decade of supporting businesses in Shropshire and the Welsh Borders means we've seen most of the practice-management, ERP, case-management and clinical software used by firms your size. We talk to your vendors so you don't have to.
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
              <a href="#sectors" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: 'transparent', color: T.white,
                border: '2px solid rgba(255,255,255,0.3)',
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
                textDecoration: 'none',
              }}>See all sectors ↓</a>
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '28px 32px',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 48, color: T.yellow, lineHeight: 1, marginBottom: 8 }}>{sectors.length}</div>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.5)', fontWeight: 700,
            }}>Sectors with dedicated pages</div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', margin: '20px 0', paddingTop: 20 }}>
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 28, color: T.yellow, lineHeight: 1, marginBottom: 4 }}>5–50</div>
              <div style={{
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.5)', fontWeight: 700,
              }}>Staff: our sweet-spot client size</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTOR GRID */}
      <section id="sectors" style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>Pick yours</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 12 }}>Sectors with a dedicated page</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, margin: 0, maxWidth: '52ch', lineHeight: 1.6 }}>
              Each one covers the software we support, the compliance angle, the typical pain points, and a relevant case study.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 18,
          }}>
            {sectors.map((ind, i) => {
              const tone = SECTOR_TONES[i % SECTOR_TONES.length];
              return (
                <Link
                  key={ind.slug}
                  to={`/industries/${ind.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}
                >
                  <div style={{
                    flex: 1,
                    background: T.white,
                    border: `3px solid ${T.ink}`,
                    boxShadow: `6px 6px 0 0 ${T.ink}`,
                    position: 'relative',
                    padding: 22,
                    display: 'flex', flexDirection: 'column',
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: tone, borderBottom: `3px solid ${T.ink}` }} />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 12,
                      marginTop: 4,
                      gap: 12,
                    }}>
                      <h3 style={{ fontFamily: "'Archivo', sans-serif", fontSize: 22, fontWeight: 800, color: T.ink, margin: 0, lineHeight: 1.15 }}>{ind.name}</h3>
                      <Sticker rotate={4} color={T.paperDeep}>Sector page</Sticker>
                    </div>
                    <p style={{ fontSize: 14, color: 'rgba(15,25,35,0.62)', lineHeight: 1.5, margin: 0, flex: 1 }}>{ind.desc}</p>
                    <div style={{
                      marginTop: 16,
                      fontFamily: "'Archivo', sans-serif", fontSize: 11, fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '0.14em',
                      color: T.primaryDark,
                    }}>Explore →</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section style={{ background: T.paperDeep, padding: '72px 32px' }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
          gap: 36,
          alignItems: 'center',
        }}>
          <div>
            <Eyebrow>Not on the list?</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 12 }}>Call us anyway.</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, lineHeight: 1.65, margin: 0, maxWidth: '52ch' }}>
              We support any business with 5–50 staff across the region. Most sectors look more alike than they look different; the principles travel. Give us 20 minutes and we'll tell you honestly if we're a fit.
            </p>
          </div>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 28px',
            background: T.accent, color: T.white,
            border: `2px solid ${T.ink}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 16,
            textDecoration: 'none',
            boxShadow: `4px 4px 0 0 ${T.ink}`,
            whiteSpace: 'nowrap',
            justifySelf: isMobile ? 'flex-start' : 'end',
          }}>Book a 20-min call →</Link>
        </div>
      </section>
    </>
  );
};

export default IndustriesPageV2;
