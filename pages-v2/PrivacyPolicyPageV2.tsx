import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, Eyebrow, DisplayHead } from '../components-v2/primitives';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

export const PrivacyPolicyPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const updated  = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <>
      <SEO title="Privacy Policy" description="How Fresh Tech protects your data. GDPR and data protection information." type="article" />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '64px 32px 72px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Eyebrow light>Privacy</Eyebrow>
          <DisplayHead as="h1" size={isMobile ? 38 : 48} light style={{ marginBottom: 16 }}>
            Your data, protected.
          </DisplayHead>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
            Last updated: {updated}
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section style={{ background: T.paper, padding: isMobile ? '48px 20px' : '64px 32px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: "'Archivo', sans-serif", color: T.ink, fontSize: 16, lineHeight: 1.75 }}>

          <Section title="1. Who we are">
            <p>
              We are FRESH PCS CONSULTANCY LTD trading as Fresh Tech ("we", "us", "our").
              Our company registration number is 09296207 and our ICO registration is ZA136732.
              Our registered address is 28 Livesey Avenue, Ludlow, SY8 1HN.
            </p>
          </Section>

          <Section title="2. Data we collect">
            <p>We may collect the following information:</p>
            <List items={[
              'Name and job title.',
              'Contact information including email address and telephone number.',
              'Demographic information such as postcode, preferences and interests.',
              'Technical data including IP addresses and browser type when you visit our website.',
            ]} />
          </Section>

          <Section title="3. How we use your data">
            <p>We need this information to understand your needs and provide a better service, specifically for:</p>
            <List items={[
              'Internal record keeping.',
              'Improving our products and services.',
              'Sending promotional emails about new services or special offers (opt-out any time).',
              'Responding to your enquiries submitted via our contact forms.',
            ]} />
          </Section>

          <Section title="4. Security">
            <p>
              We are committed to ensuring your information is secure. To prevent unauthorised access or disclosure, we have put in place suitable physical, electronic and managerial procedures to safeguard and secure the information we collect online. As an IT security company, we practice what we preach.
            </p>
          </Section>

          <Section title="5. Cookies">
            <p>
              A cookie is a small file stored in your browser. The only non-essential cookies we use are anonymous analytics, and they do not load unless you opt in via our cookie banner. We use this information purely for statistical analysis to improve the website, never for advertising, and we never sell your data. For the full breakdown and to change your choice at any time, see our <Link to="/cookie-policy" style={{ color: T.primary, fontWeight: 600 }}>cookie policy</Link>.
            </p>
          </Section>

          <Section title="6. Controlling your personal information">
            <p>
              You may choose to restrict the collection or use of your personal information. If you have previously agreed to us using your data for direct marketing, you may change your mind at any time by writing to or emailing us at <a href="mailto:hello@fresh-tech.uk" style={{ color: T.primary, fontWeight: 600 }}>hello@fresh-tech.uk</a>.
            </p>
            <p>
              We will not sell, distribute or lease your personal information to third parties unless we have your permission or are required by law to do so.
            </p>
          </Section>

          <div style={{ marginTop: 48, padding: '20px 24px', background: T.paperDeep, border: `1px solid ${T.hairline}`, fontSize: 14 }}>
            Questions about your data? Email <a href="mailto:hello@fresh-tech.uk" style={{ color: T.primary, fontWeight: 600 }}>hello@fresh-tech.uk</a> or call <a href="tel:+441584517234" style={{ color: T.primary, fontWeight: 600 }}>01584 517 234</a>.
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

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{
      fontFamily: "'Bungee', sans-serif", fontSize: 22,
      color: T.primaryDark, marginBottom: 14, lineHeight: 1.1,
    }}>{title}</h2>
    {children}
  </div>
);

const List: React.FC<{ items: string[] }> = ({ items }) => (
  <ul style={{ paddingLeft: 22, margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
    {items.map((it, i) => <li key={i}>{it}</li>)}
  </ul>
);

export default PrivacyPolicyPageV2;
