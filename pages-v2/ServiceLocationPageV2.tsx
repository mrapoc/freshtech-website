import React, { useState } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { serviceLocationPages } from '../data/content';
import { SEO } from '../components/SEO';
import { RichText } from '../components/RichText';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  CheckCircle, MapPin, Zap, Wifi, Leaf, Shield, ChevronDown,
  Headphones, Building, RefreshCw, Cloud, Folder, Users, Truck, Wrench, ArrowRight,
} from 'lucide-react';
import {
  T, useWindowWidth, contentMax, halftone,
  Eyebrow, DisplayHead,
} from '../components-v2/primitives';
import { renderInlineMd } from '../components-v2/inlineMd';

const ICON_MAP: Record<string, React.ElementType> = {
  CheckCircle, MapPin, Zap, Wifi, Leaf, Shield, Headphones, Building,
  RefreshCw, Cloud, Folder, Users, Truck, Wrench, Tool: Wrench,
};

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${T.hairline}` }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', textAlign: 'left',
          padding: '18px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        }}
        aria-expanded={open}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: T.ink, lineHeight: 1.4 }}>
          {renderInlineMd(q)}
        </span>
        <span style={{
          fontFamily: "'Bungee', sans-serif", fontSize: 22, color: T.primary,
          flexShrink: 0,
          transform: open ? 'rotate(45deg)' : 'none',
          transition: 'transform 200ms', lineHeight: 1,
        }} aria-hidden="true">+</span>
      </button>
      {open && (
        <div style={{
          padding: '0 0 18px',
          color: 'rgba(15,25,35,0.7)',
          fontSize: 15, lineHeight: 1.65,
          maxWidth: '70ch',
        }}>
          <RichText text={a} />
        </div>
      )}
    </div>
  );
};

export const ServiceLocationPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const isTablet = ww < 1024;
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, '');
  const data = serviceLocationPages[slug];

  if (!data) {
    return <Navigate to="/404" />;
  }

  // Town pages link UP to their same-service county hub, passing authority to
  // the county pages we want ranking for "<service> <county>".
  const TOWN_TO_COUNTY: Record<string, string> = {
    ludlow: 'shropshire', shrewsbury: 'shropshire', telford: 'shropshire',
    hereford: 'herefordshire', worcester: 'worcestershire', kidderminster: 'worcestershire',
  };
  const slugMatch = slug.match(/^(it-support|cyber-essentials|microsoft-365)-(.+)$/);
  const countyHubSlug = !data.isCounty && slugMatch && TOWN_TO_COUNTY[slugMatch[2]]
    ? `${slugMatch[1]}-${TOWN_TO_COUNTY[slugMatch[2]]}`
    : null;
  const countyHub = countyHubSlug && serviceLocationPages[countyHubSlug]
    ? serviceLocationPages[countyHubSlug]
    : null;

  // Schema: LocalBusiness Service + FAQPage
  const serviceLocationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${data.service} - ${data.location}`,
    description: data.metaDesc,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Fresh Tech IT Support',
      '@id': 'https://fresh-tech.uk/#organization',
      telephone: '+441584517234',
      email: 'hello@fresh-tech.uk',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Ludlow',
        addressRegion: 'Shropshire',
        addressCountry: 'GB',
      },
    },
    areaServed: { '@type': 'AdministrativeArea', name: data.location },
    serviceType: data.service,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
      },
    })),
  };

  return (
    <>
      <SEO
        title={data.title}
        description={data.metaDesc}
        canonical={`https://fresh-tech.uk/${slug}`}
        schema={[serviceLocationSchema, faqSchema]}
      />

      {/* HERO */}
      <section style={{
        position: 'relative',
        background: T.ink,
        padding: isMobile ? '40px 20px 56px' : isTablet ? '56px 32px 64px' : '72px 48px 80px',
        ...halftone('rgba(255,255,255,0.05)', 1.5, 14),
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'relative',
          maxWidth: contentMax(ww, 1100),
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.3fr 0.7fr',
          gap: isMobile ? 36 : 56,
          alignItems: 'center',
        }}>
          <div>
            <div style={{ marginBottom: 18 }}>
              <Breadcrumbs
                items={[
                  { label: 'Services', href: '/services' },
                  { label: data.service, href: `/services/${data.relatedService}` },
                  { label: data.location },
                ]}
                variant="light"
              />
            </div>
            <div style={{
              display: 'inline-block',
              background: T.yellow,
              border: `2px solid ${T.white}`,
              padding: '6px 16px',
              fontFamily: "'Bungee', sans-serif", fontSize: 12,
              transform: 'rotate(-2deg)',
              marginBottom: 20,
              color: T.ink,
            }}>
              📍 {data.location}{data.isCounty ? '' : ', Welsh Borders'}
            </div>
            <DisplayHead as="h1" size={isMobile ? 36 : 50} light style={{ marginBottom: 18, lineHeight: 1.0 }}>
              {data.h1}
            </DisplayHead>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 18, lineHeight: 1.65,
              margin: '0 0 32px',
              maxWidth: '52ch',
            }}>
              {data.intro}
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
              }}>📞 01584 517 234</a>
            </div>
          </div>
          {!isMobile && (
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '28px 32px',
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 48, color: T.yellow, lineHeight: 1 }}>Reviews</div>
              <div style={{
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginTop: 8,
              }}>Read customer feedback on Google</div>
              <div style={{
                marginTop: 20, paddingTop: 20,
                borderTop: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 13, lineHeight: 1.55,
              }}>
                Ludlow HQ ·<br />Engineers across the Welsh Borders
              </div>
            </div>
          )}
        </div>
      </section>

      {/* BENEFITS GRID */}
      <section style={{ background: T.paper, padding: isMobile ? '56px 20px' : '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <Eyebrow>Why local matters</Eyebrow>
            <DisplayHead size={isMobile ? 28 : 36}>
              Why {data.location} businesses choose Fresh Tech
            </DisplayHead>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 18,
          }}>
            {data.benefits.map((b, i) => {
              const Icon = ICON_MAP[b.icon] || CheckCircle;
              const accents = [T.accent, T.primary, T.green, T.yellow];
              const accent = accents[i % accents.length];
              return (
                <div key={i} style={{
                  position: 'relative',
                  background: T.white,
                  border: `2px solid ${T.ink}`,
                  padding: 22,
                  boxShadow: `5px 5px 0 0 ${T.ink}`,
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: 5,
                    background: accent,
                    borderBottom: `2px solid ${T.ink}`,
                  }} />
                  <div style={{
                    width: 44, height: 44,
                    background: T.paperDeep,
                    border: `2px solid ${T.ink}`,
                    display: 'grid', placeItems: 'center',
                    marginTop: 4, marginBottom: 14,
                  }}>
                    <Icon size={22} color={T.ink} strokeWidth={2.2} />
                  </div>
                  <h3 style={{
                    fontFamily: "'Archivo', sans-serif",
                    fontWeight: 800, fontSize: 16,
                    color: T.ink, margin: '0 0 6px',
                    lineHeight: 1.25,
                  }}>{b.title}</h3>
                  <p style={{
                    fontSize: 13, lineHeight: 1.55,
                    color: 'rgba(15,25,35,0.68)',
                    margin: 0,
                  }}>{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT + LOCAL CONTEXT */}
      <section style={{ background: T.paperDeep, padding: isMobile ? '56px 20px' : '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            background: T.white,
            border: `2px solid ${T.ink}`,
            padding: isMobile ? 28 : 40,
            boxShadow: `6px 6px 0 0 ${T.ink}`,
          }}>
            <div style={{
              fontSize: 16,
              lineHeight: 1.75,
              color: 'rgba(15,25,35,0.85)',
            }} className="ft-rich-content">
              <RichText text={data.content} />
            </div>
            <div style={{
              marginTop: 32,
              padding: '20px 22px',
              background: T.paper,
              borderLeft: `4px solid ${T.accent}`,
            }}>
              <div style={{
                fontFamily: "'Archivo Narrow', sans-serif",
                fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.14em',
                color: T.primary,
                marginBottom: 6,
              }}>Local expertise</div>
              <p style={{
                margin: 0, fontSize: 15, lineHeight: 1.6,
                color: T.ink,
              }}>{data.localContext}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: T.white, padding: isMobile ? '56px 20px' : '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Eyebrow>{data.service} in {data.location}</Eyebrow>
            <DisplayHead size={isMobile ? 28 : 34}>Common questions</DisplayHead>
          </div>
          {data.faqs.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* RELATED LINKS */}
      <section style={{ background: T.paper, padding: isMobile ? '40px 20px 48px' : '48px 32px 56px' }}>
        <div style={{
          maxWidth: contentMax(ww, 1100), margin: '0 auto',
          display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {countyHub && (
            <Link to={`/${countyHubSlug}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 22px',
              background: T.ink,
              border: `2px solid ${T.ink}`,
              color: T.white,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 14,
              textDecoration: 'none',
              boxShadow: `4px 4px 0 0 ${T.accent}`,
            }}>
              {data.service} across {countyHub.location} <ArrowRight size={16} />
            </Link>
          )}
          <Link to={`/services/${data.relatedService}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 22px',
            background: T.white,
            border: `2px solid ${T.ink}`,
            color: T.ink,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 14,
            textDecoration: 'none',
            boxShadow: `4px 4px 0 0 ${T.ink}`,
          }}>
            See {data.service} details <ArrowRight size={16} />
          </Link>
          <Link to={`/locations/${data.relatedLocation}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 22px',
            background: T.white,
            border: `2px solid ${T.ink}`,
            color: T.ink,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 14,
            textDecoration: 'none',
            boxShadow: `4px 4px 0 0 ${T.ink}`,
          }}>
            All services in {data.location} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '72px 32px 80px',
        ...halftone('rgba(255,255,255,0.05)', 1.5, 14),
        borderTop: `4px solid ${T.accent}`,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>Ready to talk?</Eyebrow>
          <DisplayHead size={isMobile ? 30 : 40} light style={{ marginBottom: 16 }}>
            {data.service} for {data.location} businesses
          </DisplayHead>
          <p style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: 17, lineHeight: 1.65,
            margin: '0 auto 32px', maxWidth: '46ch',
          }}>
            20 minutes. No sales pitch. We'll tell you honestly whether we're a fit.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 28px',
              background: T.accent, color: T.white,
              border: `2px solid ${T.white}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 16,
              textDecoration: 'none',
              boxShadow: `4px 4px 0 0 ${T.yellow}`,
            }}>Book a 20-min call →</Link>
            <a href="tel:+441584517234" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 28px',
              background: 'transparent', color: T.white,
              border: '2px solid rgba(255,255,255,0.35)',
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 16,
              textDecoration: 'none',
            }}>📞 01584 517 234</a>
          </div>
        </div>
      </section>
    </>
  );
};

export default ServiceLocationPageV2;
