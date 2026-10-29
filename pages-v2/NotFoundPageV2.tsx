import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { T, useContentMax } from '../components-v2/primitives';

const BRAND = { phone: '01584 517 234', phoneHref: 'tel:+441584517234' };

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const LINKS = [
  { label: 'Homepage', href: '/',         desc: 'Back to the start' },
  { label: 'Services', href: '/services', desc: 'What we do and how it works' },
  { label: 'Pricing',  href: '/pricing',  desc: 'Transparent, per-user monthly plans' },
  { label: 'About us', href: '/about',    desc: 'Who we are, since 2014' },
  { label: 'Contact',  href: '/contact',  desc: 'Book a call or send a message' },
  { label: 'Why trust us', href: '/why-trust-us', desc: 'Live stats, guarantees, and real clients' },
];

export const NotFoundPageV2: React.FC = () => (
  <>
    <SEO
      title="Page Not Found"
      description="This page has moved. Find IT support services, pricing, and contact details for Fresh Tech, based in Ludlow, Shropshire."
      noIndex
    />
    <section style={{
      flex: 1,
      background: T.ink,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 32px',
      ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
    }}>
      <div style={{
        maxWidth: useContentMax(1100), width: '100%',
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
        gap: 80,
        alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontFamily: "'Bungee', sans-serif", fontSize: 140,
            lineHeight: 0.85,
            color: 'rgba(255,255,255,0.06)',
            userSelect: 'none', letterSpacing: '-0.02em',
          }}>404</div>
          <h1 style={{
            fontFamily: "'Bungee', sans-serif", fontSize: 40, fontWeight: 'inherit',
            color: T.white, lineHeight: 1, margin: 0, marginTop: -16, marginBottom: 16,
          }}>That page moved house.</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 17, lineHeight: 1.65, margin: '0 0 8px', maxWidth: '44ch' }}>
            We can't find what you were looking for; it probably lives somewhere else on the site now.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: '0 0 32px', maxWidth: '44ch' }}>
            If you followed a link that used to work, it's worth letting us know: <a href="mailto:hello@fresh-tech.uk" style={{ color: T.primary, textDecoration: 'none', fontWeight: 600 }}>hello@fresh-tech.uk</a>
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 22px',
              background: T.accent, color: T.white,
              border: `2px solid ${T.white}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
              textDecoration: 'none', boxShadow: `3px 3px 0 0 ${T.yellow}`,
            }}>Go home →</Link>
            <Link to="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 22px',
              background: 'transparent', color: T.white,
              border: '2px solid rgba(255,255,255,0.3)',
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
              textDecoration: 'none',
            }}>Contact us</Link>
          </div>
        </div>
        <div>
          <div style={{
            fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginBottom: 16,
          }}>Three things most people want</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {LINKS.slice(0, 3).map(({ label, href, desc }, i) => (
              <Link key={i} to={href} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '18px 20px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.08)',
                textDecoration: 'none', gap: 16, marginBottom: 2,
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: T.white, fontSize: 15 }}>{label}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{desc}</div>
                </div>
                <span style={{ color: T.primary, fontWeight: 700, fontSize: 18, flexShrink: 0 }}>→</span>
              </Link>
            ))}
          </div>
          <div style={{
            fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.2)', fontWeight: 700,
            margin: '20px 0 12px',
          }}>Or browse</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {LINKS.slice(3).map(({ label, href }, i) => (
              <Link key={i} to={href} style={{
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                textDecoration: 'none',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 14, fontWeight: 600,
                display: 'flex', justifyContent: 'space-between',
              }}>
                {label}<span style={{ color: 'rgba(255,255,255,0.25)' }}>→</span>
              </Link>
            ))}
          </div>
          <div style={{
            marginTop: 20,
            padding: '16px 20px',
            background: 'rgba(50,136,190,0.15)',
            border: '1px solid rgba(50,136,190,0.3)',
          }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              Need to speak to someone? <a href={BRAND.phoneHref} style={{ color: T.primary, fontWeight: 700, textDecoration: 'none' }}>{BRAND.phone}</a>, Mon–Fri, 9–5.
            </div>
          </div>
        </div>
      </div>
    </section>
  </>
);

export default NotFoundPageV2;
