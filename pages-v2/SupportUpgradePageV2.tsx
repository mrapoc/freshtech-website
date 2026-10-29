import React from 'react';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, Eyebrow, DisplayHead } from '../components-v2/primitives';

// Linked from the footer of our support ticket emails ("See what's changed").
// Deliberately plain: no forms, no CTAs, just the explanation and the
// "is this really you?" verification clients need.

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const linkStyle: React.CSSProperties = { color: T.primary, fontWeight: 700 };

export const SupportUpgradePageV2: React.FC = () => {
  const ww = useWindowWidth();
  const isMobile = ww < 768;

  return (
    <>
      <SEO
        title="Our support emails have a new look"
        description="What changed when Fresh Tech upgraded its support system, and what didn't. Same team, same phone number, same email address."
        type="article"
        canonicalPath="/support-upgrade"
      />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '64px 32px 72px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Eyebrow light>A note for our clients</Eyebrow>
          <DisplayHead as="h1" size={isMobile ? 32 : 44} light style={{ marginBottom: 18 }}>
            Our support emails have a new look.
          </DisplayHead>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: isMobile ? 16 : 17, lineHeight: 1.7, margin: 0 }}>
            We've upgraded the system behind our support desk. If our emails look a little
            different, that's why. Here's the short version: same team, same contact details,
            sharper tools.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section style={{ background: T.paper, padding: isMobile ? '44px 20px 56px' : '60px 32px 72px' }}>
        <div style={{
          maxWidth: 760, margin: '0 auto',
          fontFamily: "'Archivo', sans-serif", color: T.ink,
          fontSize: 16, lineHeight: 1.75,
        }}>

          <Section title="What's changed">
            <p style={{ margin: '0 0 16px' }}>
              Our emails are now deliberately plain. No heavy images, no marketing footers, no
              tracking. Plain emails get through spam filters reliably, load instantly on any
              device, and are easier to read with assistive tech. For a support email, that beats
              looking flashy.
            </p>
            <p style={{ margin: '0 0 16px' }}>
              You also get a better portal at{' '}
              <a href="https://my.fresh-tech.uk" style={linkStyle}>my.fresh-tech.uk</a>: raise a
              ticket, see exactly where it's up to, add screenshots, and browse your history any
              time. Signing in for the first time is with your work email address.
            </p>
            <p style={{ margin: 0 }}>
              Your ticket references may look different from the old ones. If you had a ticket open
              with us during the switch, you'll have received a note on it with the new reference.
              Just reply as normal.
            </p>
          </Section>

          <Section title="What hasn't changed">
            <p style={{ margin: 0 }}>
              How you reach us:{' '}
              <a href="mailto:support@fresh-tech.uk" style={linkStyle}>support@fresh-tech.uk</a> or{' '}
              <a href="tel:+441584517234" style={linkStyle}>01584 517 234</a>, Mon–Fri 9–5. Same
              people, same response targets, same service.
            </p>
          </Section>

          {/* VERIFICATION PANEL */}
          <div style={{
            marginTop: 40,
            background: T.white,
            border: `3px solid ${T.ink}`,
            boxShadow: `6px 6px 0 0 ${T.ink}`,
            padding: isMobile ? '22px 20px' : '28px 30px',
          }}>
            <h2 style={{
              fontFamily: "'Bungee', sans-serif", fontSize: isMobile ? 18 : 21,
              color: T.primaryDark, margin: '0 0 14px', lineHeight: 1.2,
            }}>
              "Is this email really from you?"
            </h2>
            <p style={{ margin: '0 0 14px' }}>
              Good instinct: always worth checking. Genuine Fresh Tech support emails only ever come
              from <strong>support@fresh-tech.uk</strong>, and only ever link to{' '}
              <strong>fresh-tech.uk</strong> or <strong>my.fresh-tech.uk</strong>. If anything feels
              off, don't click. Call us on{' '}
              <a href="tel:+441584517234" style={linkStyle}>01584 517 234</a> and we'll confirm.
            </p>
            <div style={{
              display: 'inline-block',
              background: T.yellow,
              border: `2.5px solid ${T.ink}`,
              padding: '8px 14px',
              font: "800 12px/1.4 'Archivo', sans-serif",
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              When in doubt, phone us. We'd rather take the call.
            </div>
          </div>

          <p style={{
            marginTop: 40, marginBottom: 0,
            fontSize: 13, fontStyle: 'italic',
            color: 'rgba(15,25,35,0.55)', lineHeight: 1.6,
          }}>
            Fresh PCS Consultancy Ltd (t/a Fresh Tech) · Company No. 09296207 · VAT GB199976510
          </p>
        </div>
      </section>
    </>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{
      fontFamily: "'Bungee', sans-serif", fontSize: 22,
      color: T.primaryDark, margin: '0 0 14px', lineHeight: 1.1,
    }}>{title}</h2>
    {children}
  </div>
);

export default SupportUpgradePageV2;
