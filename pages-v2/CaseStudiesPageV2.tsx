import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { caseStudies as realStudies } from '../data/content';
import { T, useWindowWidth, contentMax } from '../components-v2/primitives';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const SECTOR_COLOURS: Record<string, string> = {
  'Legal':              T.primaryDark,
  'Healthcare':         '#2E7D5B',
  'Manufacturing':      '#7B4F2E',
  'Agriculture & Food': '#4A7A3A',
  'Field Services':     '#5B4A7A',
  'Accountants':        '#1F5C8C',
  'Charities':          T.accent,
  'Engineering':        '#7B4F2E',
  'Retail & Distribution': '#1F5C8C',
  'Veterinary':         '#2E7D5B',
};

interface DisplayStudy {
  client: string;
  slug: string;
  industry: string;
  headline: string;
  summary: string;
  metricNum: string;
  metricLabel: string;
  metricSub: string;
  services: string[];
  quote?: { text: string; name: string };
  featured: boolean;
}

const STUDIES: DisplayStudy[] = realStudies.map((cs, i) => ({
  client:      cs.client,
  slug:        cs.slug,
  industry:    cs.industry,
  headline:    cs.title,
  summary:     cs.outcome,
  metricNum:   (cs.shortStats?.victory ?? cs.result ?? 'Win').split(' ')[0],
  metricLabel: cs.shortStats?.strategy ?? cs.result ?? 'Outcome',
  metricSub:   cs.shortStats?.risk ?? '',
  services:    cs.techStack?.slice(0, 3) ?? [],
  quote:       cs.testimonial ? { text: cs.testimonial, name: cs.contactName || cs.client } : undefined,
  featured:    i < 2,
}));

const ALL_SECTORS = ['All', ...Array.from(new Set(STUDIES.map(s => s.industry)))];

const SectorBadge: React.FC<{ industry: string }> = ({ industry }) => {
  const bg = SECTOR_COLOURS[industry] || T.primary;
  return (
    <span style={{
      display: 'inline-block',
      background: bg, color: T.white,
      padding: '4px 10px',
      fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
      whiteSpace: 'nowrap',
    }}>{industry}</span>
  );
};

const FeaturedCard: React.FC<{ study: DisplayStudy }> = ({ study }) => {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={`/case-studies/${study.slug}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        background: T.ink, border: `2px solid ${T.ink}`,
        textDecoration: 'none', color: T.white,
        boxShadow: hov ? `6px 6px 0 0 ${T.accent}` : `4px 4px 0 0 ${T.ink}`,
        transition: 'box-shadow 180ms',
        ...halftoneCss('rgba(255,255,255,0.03)', 1.4, 12),
        position: 'relative',
      }}
    >
      <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectorBadge industry={study.industry} />
        <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 28, lineHeight: 1.0, color: T.white }}>
          {study.headline}
        </div>
        <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.65)', margin: 0, maxWidth: '44ch' }}>
          {study.summary}
        </p>
        {study.quote && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 4 }}>
            <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', margin: '0 0 8px' }}>
              "{study.quote.text}"
            </p>
            <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
              - {study.quote.name}
            </div>
          </div>
        )}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Archivo', sans-serif", fontSize: 13, fontWeight: 700, color: T.accent }}>
          Read the full story <span style={{ fontSize: 16 }}>→</span>
        </div>
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px', textAlign: 'center', gap: 8,
      }}>
        <div style={{
          fontFamily: "'Bungee', sans-serif", fontSize: 56, lineHeight: 0.85,
          color: T.yellow, letterSpacing: '-0.02em',
        }}>{study.metricNum}</div>
        <div style={{
          fontFamily: "'Archivo', sans-serif", fontSize: 15, fontWeight: 700,
          color: T.white, lineHeight: 1.2, maxWidth: '20ch', marginTop: 12,
        }}>{study.metricLabel}</div>
        {study.metricSub && (
          <div style={{
            fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginTop: 4,
          }}>{study.metricSub}</div>
        )}
        <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {study.services.map(s => (
            <span key={s} style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '4px 10px',
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.5)', fontWeight: 700,
            }}>{s}</span>
          ))}
        </div>
        <div style={{
          position: 'absolute', top: 20, right: 20,
          background: T.yellow, border: `2px solid ${T.ink}`,
          padding: '5px 12px',
          fontFamily: "'Bungee', sans-serif", fontSize: 11,
          transform: 'rotate(2deg)', boxShadow: `2px 2px 0 0 ${T.ink}`,
          color: T.ink, maxWidth: '50%',
        }}>{study.client}</div>
      </div>
    </Link>
  );
};

const StudyCard: React.FC<{ study: DisplayStudy }> = ({ study }) => {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={`/case-studies/${study.slug}`}
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
      <div style={{
        background: T.ink,
        padding: '24px 28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        ...halftoneCss('rgba(255,255,255,0.03)', 1.4, 12),
      }}>
        <div>
          <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 40, lineHeight: 0.85, color: T.yellow, letterSpacing: '-0.02em' }}>{study.metricNum}</div>
          <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginTop: 8, lineHeight: 1.2 }}>{study.metricLabel}</div>
          {study.metricSub && (
            <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginTop: 3 }}>{study.metricSub}</div>
          )}
        </div>
        <SectorBadge industry={study.industry} />
      </div>
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 11, color: 'rgba(15,25,35,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {study.client}
        </div>
        <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 18, lineHeight: 1.1, color: T.ink }}>{study.headline}</div>
        <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: 14, lineHeight: 1.65, color: 'rgba(15,25,35,0.62)', margin: 0 }}>{study.summary}</p>
        {study.quote && (
          <div style={{ marginTop: 4, borderTop: `1px solid ${T.hairline}`, paddingTop: 12 }}>
            <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: 13, lineHeight: 1.55, color: 'rgba(15,25,35,0.62)', fontStyle: 'italic', margin: '0 0 6px' }}>"{study.quote.text}"</p>
            <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: 10, color: 'rgba(15,25,35,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>- {study.quote.name}</div>
          </div>
        )}
        <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {study.services.slice(0, 2).map(s => (
              <span key={s} style={{
                background: T.paperDeep, padding: '3px 8px',
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                fontWeight: 700, color: 'rgba(15,25,35,0.4)',
              }}>{s}</span>
            ))}
          </div>
          <span style={{
            fontFamily: "'Archivo', sans-serif", fontSize: 13, fontWeight: 700,
            color: hov ? T.primary : 'rgba(15,25,35,0.4)',
            transition: 'color 180ms',
          }}>Read →</span>
        </div>
      </div>
    </Link>
  );
};

export const CaseStudiesPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const isTablet = ww < 1024;
  const [filter, setFilter] = useState<string>('All');

  const featured = STUDIES.filter(s => s.featured);
  const allFiltered = STUDIES.filter(s => filter === 'All' || s.industry === filter);

  return (
    <>
      <SEO
        title="Case Studies: Real Results for Shropshire Businesses"
        description="Real outcomes for real businesses. See how Fresh Tech has helped solicitors, healthcare practices, manufacturers and more across Shropshire and Herefordshire."
        type="collection"
      />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '48px 20px 56px' : '72px 32px 80px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{
              background: T.yellow,
              border: '2px solid rgba(255,255,255,0.3)',
              padding: '5px 14px',
              fontFamily: "'Bungee', sans-serif", fontSize: 11,
              transform: 'rotate(-2deg)', color: T.ink,
            }}>Client stories</div>
            <div style={{
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '5px 14px',
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center',
            }}>From the businesses we support</div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 32 : 64,
            alignItems: 'end',
          }}>
            <div>
              <h1 style={{
                fontFamily: "'Bungee', sans-serif", fontSize: isMobile ? 38 : 58,
                lineHeight: 0.92, color: T.white, margin: 0, marginBottom: 20, letterSpacing: '-0.01em',
                fontWeight: 400,
              }}>Real jobs.<br />Real fixes.</h1>
              <p style={{
                fontFamily: "'Archivo', sans-serif", fontSize: 17, lineHeight: 1.65,
                color: 'rgba(255,255,255,0.65)', margin: '0 0 28px', maxWidth: '44ch',
              }}>
                Stories from jobs we have done. Where a client is named, the story is theirs. Where the client is not named, the story is based on a real job and some details are illustrative.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/contact" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '13px 22px',
                  background: T.accent, color: T.white,
                  border: '2px solid rgba(255,255,255,0.4)',
                  fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 14,
                  textDecoration: 'none',
                  boxShadow: `3px 3px 0 0 ${T.yellow}`,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>Book a call →</Link>
                <Link to="/pricing" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '13px 22px',
                  background: 'transparent', color: T.white,
                  border: '2px solid rgba(255,255,255,0.3)',
                  fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 14,
                  textDecoration: 'none',
                }}>See pricing</Link>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[
                { num: `${STUDIES.length}`, label: 'Published case studies', sub: 'Based on real jobs' },
                { num: '2014',               label: 'Supporting businesses since', sub: 'Based in Ludlow' },
                { num: 'Reviews',            label: 'Customer feedback',       sub: 'Selected client stories' },
                { num: 'Support',            label: 'Contact our helpdesk',    sub: 'Mon–Fri, 9am–5pm' },
              ].map(({ num, label, sub }) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '20px 18px',
                }}>
                  <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 28, color: T.yellow, lineHeight: 1 }}>{num}</div>
                  <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginTop: 6, lineHeight: 1.2 }}>{label}</div>
                  <div style={{
                    fontFamily: "'Archivo Narrow', sans-serif", fontSize: 10,
                    color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: 3,
                  }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section style={{
          background: T.paperDeep,
          padding: isMobile ? '48px 20px' : '72px 32px',
          borderBottom: `1px solid ${T.hairline}`,
        }}>
          <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700,
              color: T.primary, marginBottom: 24,
            }}>Featured stories</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {featured.map(s => isMobile ? <StudyCard key={s.slug} study={s} /> : <FeaturedCard key={s.slug} study={s} />)}
            </div>
          </div>
        </section>
      )}

      {/* ALL */}
      <section style={{ background: T.paper, padding: isMobile ? '48px 20px' : '72px 32px' }}>
        <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            marginBottom: 32, flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <div style={{
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700,
                color: T.primary, marginBottom: 8,
              }}>All case studies</div>
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 32, lineHeight: 0.95, color: T.ink }}>
                {filter === 'All' ? `${STUDIES.length} stories` : `${allFiltered.length} in ${filter}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ALL_SECTORS.map(sector => (
                <button
                  key={sector}
                  onClick={() => setFilter(sector)}
                  style={{
                    padding: '7px 14px',
                    background: filter === sector ? T.ink : T.white,
                    color: filter === sector ? T.white : T.ink,
                    border: `1px solid ${filter === sector ? T.ink : T.hairline}`,
                    fontFamily: "'Archivo Narrow', sans-serif",
                    fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    cursor: 'pointer', transition: 'all 150ms',
                    boxShadow: filter === sector ? `2px 2px 0 0 ${T.ink}` : 'none',
                  }}
                >{sector}</button>
              ))}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3, 1fr)',
            gap: 20,
          }}>
            {allFiltered.map(s => <StudyCard key={s.slug} study={s} />)}
          </div>

          {allFiltered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'rgba(15,25,35,0.4)', fontSize: 16 }}>
              No case studies yet for this sector, but we work with them. <Link to="/contact" style={{ color: T.primary, fontWeight: 700 }}>Ask us directly →</Link>
            </div>
          )}
        </div>
      </section>

      {/* SECTORS COVERAGE */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '40px 20px' : '56px 32px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
        borderTop: `3px solid ${T.ink}`,
      }}>
        <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700,
            color: 'rgba(255,255,255,0.4)', marginBottom: 16,
          }}>Sectors we've worked in</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            {Object.keys(SECTOR_COLOURS).map(s => <SectorBadge key={s} industry={s} />)}
          </div>
          <div style={{
            fontFamily: "'Bungee', sans-serif",
            fontSize: isMobile ? 24 : 32,
            color: T.white, marginBottom: 12, lineHeight: 1.0,
          }}>Don't see your sector? Call us anyway.</div>
          <p style={{
            fontFamily: "'Archivo', sans-serif", fontSize: 15,
            color: 'rgba(255,255,255,0.55)',
            margin: '0 auto 24px', maxWidth: '44ch', lineHeight: 1.6,
          }}>
            We support any business with 5–50 staff across Shropshire, Herefordshire and the Welsh Borders. If we're not the right fit we'll say so.
          </p>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px',
            background: T.accent, color: T.white,
            border: '2px solid rgba(255,255,255,0.4)',
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
            textDecoration: 'none',
            boxShadow: `4px 4px 0 0 ${T.yellow}`,
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>Book a 20-min call →</Link>
        </div>
      </section>
    </>
  );
};

export default CaseStudiesPageV2;
