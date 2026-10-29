import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, Eyebrow, DisplayHead } from '../components-v2/primitives';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

export const TermsPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;

  return (
    <>
      <SEO title="Terms & Conditions" description="Website terms of use and managed services contract terms for Fresh Tech IT Support: governing law, liability, intellectual property. Ludlow, Shropshire." type="article" />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '64px 32px 72px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Eyebrow light>Terms &amp; Conditions</Eyebrow>
          <DisplayHead as="h1" size={isMobile ? 38 : 48} light style={{ marginBottom: 16 }}>
            The legal bit.
          </DisplayHead>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
            Website terms for fresh-tech.uk. Managed-service terms are issued separately as part of your contract.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section style={{ background: T.paper, padding: isMobile ? '48px 20px' : '64px 32px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: "'Archivo', sans-serif", color: T.ink, fontSize: 16, lineHeight: 1.75 }}>

          <Section title="1. Introduction">
            <p>
              Welcome to Fresh Tech. These terms outline the rules and regulations for the use of our website. By accessing this site we assume you accept these terms. Do not continue to use Fresh Tech if you do not agree.
            </p>
          </Section>

          <Section title="2. Intellectual property">
            <p>
              Other than content you own, FRESH PCS CONSULTANCY LTD and its licensors own all intellectual property rights and materials contained on this website. You are granted limited licence only for the purposes of viewing the material contained here.
            </p>
          </Section>

          <Section title="3. Restrictions">
            <p>You are specifically restricted from all of the following:</p>
            <List items={[
              'Publishing any website material in any other media.',
              'Selling, sublicensing or otherwise commercialising any website material.',
              'Publicly performing or showing any website material.',
              'Using this website in any way that is or may be damaging to it.',
              'Using this website in any way that impacts other users\' access.',
            ]} />
          </Section>

          <Section title="4. Managed services agreement">
            <p>
              These terms relate specifically to use of this website. Clients engaging Fresh Tech for IT support services do so under our <Link to="/terms-of-business" style={{ color: T.primaryDark, fontWeight: 600 }}>Terms of Business</Link>.
            </p>
          </Section>

          <Section title="5. Limitation of liability">
            <p>
              In no event shall FRESH PCS CONSULTANCY LTD, nor any of its officers, directors and employees, be held liable for anything arising out of or in any way connected with your use of this website.
            </p>
          </Section>

          <Section title="6. Governing law">
            <p>
              These terms are governed by and interpreted in accordance with the laws of the United Kingdom. You submit to the non-exclusive jurisdiction of the courts located in the UK for the resolution of any disputes.
            </p>
          </Section>

          <div style={{ marginTop: 48, padding: '20px 24px', background: T.paperDeep, border: `1px solid ${T.hairline}`, fontSize: 14 }}>
            Got a question about the terms? Email <a href="mailto:hello@fresh-tech.uk" style={{ color: T.primary, fontWeight: 600 }}>hello@fresh-tech.uk</a>.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: T.paperDeep, padding: '56px 32px', borderTop: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <DisplayHead size={32} style={{ marginBottom: 14 }}>Looking for the Managed Services Agreement?</DisplayHead>
          <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, lineHeight: 1.6, margin: '0 0 24px', maxWidth: '46ch', marginLeft: 'auto', marginRight: 'auto' }}>
            Read our published service terms and the data processing terms that form part of them.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/terms-of-business" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 24px',
            background: T.accent, color: T.white,
            border: `2px solid ${T.ink}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
            textDecoration: 'none',
            boxShadow: `4px 4px 0 0 ${T.ink}`,
          }}>Terms of Business</Link>
          <Link to="/dpa" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 24px',
            background: T.paper, color: T.primaryDark,
            border: `2px solid ${T.ink}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
            textDecoration: 'none',
            boxShadow: `4px 4px 0 0 ${T.ink}`,
          }}>Data Processing Terms</Link>
          </div>
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

export default TermsPageV2;
