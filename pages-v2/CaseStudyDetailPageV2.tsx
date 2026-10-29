import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { caseStudies } from '../data/content';
import { T, useWindowWidth, contentMax, Eyebrow, DisplayHead } from '../components-v2/primitives';
import { renderInlineMd } from '../components-v2/inlineMd';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

export const CaseStudyDetailPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const location = useLocation();
  const slug = location.pathname.replace(/^\/case-studies\//, '');
  const cs = caseStudies.find(c => c.slug === slug);

  if (!cs) {
    return (
      <section style={{ background: T.paper, padding: '120px 32px', minHeight: '60vh' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow>Case study not found</Eyebrow>
          <DisplayHead size={36} style={{ marginBottom: 16 }}>That story doesn't exist (yet).</DisplayHead>
          <Link to="/case-studies" style={{
            display: 'inline-flex', padding: '14px 24px',
            background: T.accent, color: T.white,
            border: `2px solid ${T.ink}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
            textDecoration: 'none', boxShadow: `4px 4px 0 0 ${T.ink}`,
          }}>See all case studies →</Link>
        </div>
      </section>
    );
  }

  const related = caseStudies.filter(c => c.slug !== slug).slice(0, 3);

  return (
    <>
      <SEO title={`${cs.title}: Case Study`} description={cs.outcome} type="article" />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '72px 32px 80px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 16 }}>
            <Link to="/case-studies" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
              fontFamily: "'Archivo Narrow', sans-serif",
              fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>← All case studies</Link>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.4fr 0.6fr',
            gap: isMobile ? 32 : 56,
            alignItems: 'center',
          }}>
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
                <span style={{
                  background: T.primary, color: T.white,
                  padding: '4px 10px',
                  fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>{cs.industry}</span>
                <span style={{
                  fontFamily: "'Bungee', sans-serif", fontSize: 11,
                  color: T.yellow, letterSpacing: '0.06em',
                }}>{cs.client}</span>
              </div>
              <DisplayHead as="h1" size={isMobile ? 34 : 46} light style={{ marginBottom: 16, lineHeight: 1.0 }}>
                {cs.title}
              </DisplayHead>
              <p style={{
                color: 'rgba(255,255,255,0.7)', fontSize: 18,
                lineHeight: 1.6, fontWeight: 600, margin: 0, maxWidth: '54ch',
              }}>{renderInlineMd(cs.outcome)}</p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: 28, textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 8,
              }}>Outcome</div>
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 32, color: T.yellow, lineHeight: 1.0 }}>
                {cs.shortStats?.victory ?? cs.result ?? 'Win'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMAGE */}
      {cs.image && (
        <section style={{ background: T.paperDeep, padding: isMobile ? '32px 20px' : '48px 32px' }}>
          <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
            <img
              src={cs.image}
              alt={cs.title}
              style={{
                width: '100%', height: 'auto', display: 'block',
                border: `2px solid ${T.ink}`,
                boxShadow: `4px 4px 0 0 ${T.ink}`,
              }}
            />
          </div>
        </section>
      )}

      {/* CHALLENGE / SOLUTION */}
      <section style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 32 : 48,
          }}>
            <div>
              <Eyebrow>The challenge</Eyebrow>
              <DisplayHead size={28} style={{ marginBottom: 16 }}>What they were dealing with</DisplayHead>
              <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, lineHeight: 1.7, margin: 0 }}>{renderInlineMd(cs.challenge)}</p>
              {cs.shortStats?.risk && (
                <div style={{
                  marginTop: 16, padding: '12px 16px',
                  background: T.paperDeep,
                  borderLeft: `4px solid ${T.red}`,
                  fontFamily: "'Archivo Narrow', sans-serif", fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700,
                  color: T.ink,
                }}>Risk: {cs.shortStats.risk}</div>
              )}
            </div>
            <div>
              <Eyebrow>What we did</Eyebrow>
              <DisplayHead size={28} style={{ marginBottom: 16 }}>The solution</DisplayHead>
              <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, lineHeight: 1.7, margin: '0 0 20px' }}>{renderInlineMd(cs.solution)}</p>
              {cs.techStack && cs.techStack.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {cs.techStack.map(t => (
                    <span key={t} style={{
                      background: T.ink, color: T.paper,
                      padding: '5px 10px',
                      fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* OUTCOME METRICS */}
      {cs.shortStats && (
        <section style={{
          background: T.ink, padding: '64px 32px',
          ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
        }}>
          <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <Eyebrow light>The result</Eyebrow>
              <DisplayHead size={36} light>{cs.result || 'Mission accomplished'}</DisplayHead>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: 20,
            }}>
              {[
                { label: 'Risk',     val: cs.shortStats.risk,     col: T.red    },
                { label: 'Strategy', val: cs.shortStats.strategy, col: T.primary },
                { label: 'Victory',  val: cs.shortStats.victory,  col: T.yellow  },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: 28, textAlign: 'center',
                }}>
                  <div style={{
                    fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)', marginBottom: 12,
                  }}>{s.label}</div>
                  <div style={{
                    fontFamily: "'Bungee', sans-serif", fontSize: 22,
                    color: s.col, lineHeight: 1.2,
                  }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIAL */}
      {cs.testimonial && (
        <section style={{ background: T.paperDeep, padding: '64px 32px', borderBottom: `1px solid ${T.hairline}` }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 56, color: T.primary, lineHeight: 0.8, marginBottom: 16 }}>"</div>
            <p style={{ fontSize: 20, color: T.ink, lineHeight: 1.6, fontStyle: 'italic', margin: '0 0 20px' }}>
              {cs.testimonial}
            </p>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.14em',
              fontWeight: 700, color: T.primaryDark,
            }}>{cs.contactName} · {cs.client}</div>
          </div>
        </section>
      )}

      {/* RELATED */}
      <section style={{ background: T.white, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
          <Eyebrow>More stories</Eyebrow>
          <DisplayHead size={32} style={{ marginBottom: 32 }}>Other clients we've helped</DisplayHead>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 16,
          }}>
            {related.map(r => (
              <Link key={r.slug} to={`/case-studies/${r.slug}`} style={{
                display: 'block',
                background: T.paper, border: `1px solid ${T.hairline}`,
                padding: 24,
                textDecoration: 'none', color: T.ink,
              }}>
                <div style={{
                  fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  fontWeight: 700, color: T.primary, marginBottom: 8,
                }}>{r.industry}</div>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 16, lineHeight: 1.1, marginBottom: 8 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(15,25,35,0.62)', lineHeight: 1.5 }}>{renderInlineMd(r.outcome)}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: T.paper, padding: '72px 32px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow>Sounds like you?</Eyebrow>
          <DisplayHead size={40} style={{ marginBottom: 16 }}>Let's talk about your setup</DisplayHead>
          <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 17, lineHeight: 1.65, margin: '0 auto 28px', maxWidth: '44ch' }}>
            We'll tell you honestly if we can help, and what it would look like.
          </p>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 28px',
            background: T.accent, color: T.white,
            border: `2px solid ${T.ink}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 16,
            textDecoration: 'none',
            boxShadow: `4px 4px 0 0 ${T.ink}`,
          }}>Book a 20-min call →</Link>
        </div>
      </section>
    </>
  );
};

export default CaseStudyDetailPageV2;
