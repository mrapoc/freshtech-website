import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, Eyebrow, DisplayHead } from '../components-v2/primitives';
import { openCookieSettings } from '../utils/consent';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

interface CookieRow {
  name: string;
  provider: string;
  purpose: string;
  expiry: string;
}

const ANALYTICS_COOKIES: CookieRow[] = [
  { name: '_ga, _ga_*', provider: 'Google Analytics', purpose: 'Tells visitors apart so we can count page views and traffic sources anonymously.', expiry: 'Up to 2 years' },
  { name: '_gid', provider: 'Google Analytics', purpose: 'Distinguishes visitors for daily usage stats.', expiry: '24 hours' },
  { name: '_clck, _clsk', provider: 'Microsoft Clarity', purpose: 'Anonymous heatmaps and session insights: shows where people get stuck so we can fix it.', expiry: 'Up to 1 year' },
];

const ESSENTIAL_COOKIES: CookieRow[] = [
  { name: 'ft-cookie-consent-v1', provider: 'Fresh Tech (this site)', purpose: 'Remembers your cookie choice so we don\'t keep asking. Stored in your browser, never sent to us.', expiry: 'Until you clear it' },
];

export const CookiePolicyPageV2: React.FC = () => {
  const ww = useWindowWidth();
  const isMobile = ww < 768;
  const updated = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <>
      <SEO
        title="Cookie Policy"
        description="What cookies Fresh Tech uses, why, and how to change your mind. Plain English, no nonsense."
        type="article"
      />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '64px 32px 72px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Eyebrow light>Cookies</Eyebrow>
          <DisplayHead as="h1" size={isMobile ? 36 : 48} light style={{ marginBottom: 16 }}>
            The cookie policy.
          </DisplayHead>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
            Last updated: {updated}
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section style={{ background: T.paper, padding: isMobile ? '48px 20px' : '64px 32px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: "'Archivo', sans-serif", color: T.ink, fontSize: 16, lineHeight: 1.75 }}>

          <Section title="The short version">
            <p>
              Our site works perfectly fine with zero cookies. We don't use them for
              advertising and we never sell your data. The only non-essential ones we'd
              like to set are anonymous analytics, and they only run if you say yes. You
              can change your mind any time using the button below.
            </p>
            <div style={{ marginTop: 16 }}>
              <ManageButton />
            </div>
          </Section>

          <Section title="What is a cookie?">
            <p>
              A cookie is a tiny text file a website stores in your browser. Some are
              needed for a site to function; others help the owner understand how the
              site is used. Under UK law (PECR and the UK GDPR), anything that isn't
              strictly necessary needs your permission first, which is why you saw a
              banner.
            </p>
          </Section>

          <Section title="Strictly necessary">
            <p>
              These keep the site working and remember your privacy choice. They don't
              track you and can't be switched off.
            </p>
            <CookieTable rows={ESSENTIAL_COOKIES} isMobile={isMobile} />
          </Section>

          <Section title="Analytics (optional, off until you allow it)">
            <p>
              If you opt in, we use Google Analytics and Microsoft Clarity to see which
              pages are useful and where visitors run into trouble. The data is
              aggregated and anonymous; we use it purely to improve the site. Nothing
              loads until you consent.
            </p>
            <CookieTable rows={ANALYTICS_COOKIES} isMobile={isMobile} />
          </Section>

          <Section title="Changing your mind">
            <p>
              Hit the button below to reopen your cookie choices at any time. You can
              also block or delete cookies in your browser settings; every major
              browser lets you do this. Turning off analytics here also clears the
              related cookies from your device.
            </p>
            <div style={{ marginTop: 16 }}>
              <ManageButton />
            </div>
          </Section>

          <Section title="More detail">
            <p>
              For how we handle personal data generally, see our{' '}
              <Link to="/privacy-policy" style={{ color: T.primary, fontWeight: 600 }}>privacy policy</Link>.
              Google and Microsoft also publish their own privacy information for the
              tools above.
            </p>
          </Section>

          <div style={{ marginTop: 48, padding: '20px 24px', background: T.paperDeep, border: `1px solid ${T.hairline}`, fontSize: 14 }}>
            Questions about cookies or your data? Email <a href="mailto:hello@fresh-tech.uk" style={{ color: T.primary, fontWeight: 600 }}>hello@fresh-tech.uk</a> or call <a href="tel:+441584517234" style={{ color: T.primary, fontWeight: 600 }}>01584 517 234</a>. We are FRESH PCS CONSULTANCY LTD (Co. No. 09296207), ICO registration ZA136732.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: T.paperDeep, padding: '56px 32px', borderTop: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <DisplayHead size={32} style={{ marginBottom: 14 }}>Any questions?</DisplayHead>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 24px',
            background: T.accent, color: T.white,
            border: `2px solid ${T.ink}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
            textDecoration: 'none',
            boxShadow: `4px 4px 0 0 ${T.ink}`,
          }}>Get in touch →</Link>
        </div>
      </section>
    </>
  );
};

const ManageButton: React.FC = () => (
  <button
    type="button"
    onClick={openCookieSettings}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translate(-1px,-1px)';
      e.currentTarget.style.boxShadow = `6px 6px 0 0 ${T.ink}`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = `4px 4px 0 0 ${T.ink}`;
    }}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '12px 20px',
      background: T.primary, color: T.white,
      border: `2.5px solid ${T.ink}`,
      boxShadow: `4px 4px 0 0 ${T.ink}`,
      fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 14,
      letterSpacing: '0.02em', textTransform: 'uppercase',
      cursor: 'pointer', transition: 'all 0.12s ease',
    }}
  >
    🍪 Manage cookie preferences
  </button>
);

const CookieTable: React.FC<{ rows: CookieRow[]; isMobile: boolean }> = ({ rows, isMobile }) => (
  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
    {rows.map(r => (
      <div key={r.name} style={{
        background: T.white,
        border: `2px solid ${T.ink}`,
        boxShadow: `3px 3px 0 0 ${T.ink}`,
        padding: isMobile ? '14px 16px' : '16px 18px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
          <code style={{
            font: "700 13px/1.2 'Archivo', monospace",
            background: T.paperDeep, padding: '3px 8px', border: `1px solid ${T.hairline}`,
          }}>{r.name}</code>
          <span style={{ font: "600 12px/1.4 'Archivo Narrow', sans-serif", color: 'rgba(15,25,35,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {r.provider} · {r.expiry}
          </span>
        </div>
        <div style={{ font: "500 14px/1.5 'Archivo', sans-serif", color: 'rgba(15,25,35,0.75)' }}>
          {r.purpose}
        </div>
      </div>
    ))}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{
      fontFamily: "'Bungee', sans-serif", fontSize: 22,
      color: T.primaryDark, marginBottom: 14, lineHeight: 1.1,
    }}>{title}</h2>
    {children}
  </div>
);

export default CookiePolicyPageV2;
