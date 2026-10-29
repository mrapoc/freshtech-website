import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { CalendlyModal } from '../components/CalendlyModal';
import { EmailCheckerTool } from '../components-v2/EmailCheckerTool';
import { T, useWindowWidth, useContentMax, Eyebrow, DisplayHead, Sticker } from '../components-v2/primitives';
import { LastReviewed } from '../components-v2/LastReviewed';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

// What the free report covers, plus what each item actually means for the business.
const REPORT = [
  { icon: '🛡️', title: 'SPF', what: 'Sender Policy Framework: the list of servers allowed to send email from your domain.', means: "Missing or wrong, and anyone can send email as you. Your own emails are also more likely to land in spam." },
  { icon: '✍️', title: 'DKIM', what: 'A tamper-proof digital signature added to every email you send.', means: "Without it, messages can be altered in transit and receivers can't confirm they're genuinely from you." },
  { icon: '🚫', title: 'DMARC', what: 'The policy that tells the world what to do with fakes, and reports who is sending in your name.', means: "The one that actually blocks impersonation. Most businesses either don't have it, or have it on 'monitor only', which blocks nothing." },
  { icon: '📧', title: 'Email platform', what: 'Whether you run Microsoft 365, Google Workspace, or mail off a web server, and how it is configured.', means: 'Each platform has its own common misconfigurations. We check yours against current best practice.' },
  { icon: '🔒', title: 'MTA-STS', what: 'A rule that forces email sent to your domain to travel encrypted.', means: 'Stops attackers intercepting or downgrading your email in transit. Almost nobody has this set up.' },
  { icon: '🌐', title: 'DNSSEC', what: 'Cryptographic protection for your DNS records themselves.', means: 'Stops criminals forging your DNS to hijack your email or your website.' },
];

const STEPS = [
  { n: '01', title: 'Tell us your domain', desc: 'A quick 15-minute call, no prep needed. We just need the web address you send email from.' },
  { n: '02', title: 'We run the checks', desc: 'We test your live DNS and mail setup against all six areas above. Read-only, so we change nothing.' },
  { n: '03', title: 'You get the report', desc: "Plain English: what's exposed, what it means, and what to fix first. Yours to keep, whatever you decide next." },
];

export const EmailSecurityCheckPageV2: React.FC = () => {
  const ww = useWindowWidth();
  const isMobile = ww < 768;
  const isTablet = ww < 1024;
  const [calOpen, setCalOpen] = useState(false);

  const ctaStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '14px 24px',
    background: T.accent, color: T.white,
    border: `2px solid ${T.white}`,
    fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
    cursor: 'pointer',
    boxShadow: `4px 4px 0 0 ${T.yellow}`,
  };

  return (
    <>
      <SEO
        title="Free Email Security Check: SPF, DKIM & DMARC"
        description="Can someone send email pretending to be your business? Get a free check of your SPF, DKIM, DMARC, MTA-STS and DNSSEC, with a plain-English report you keep."
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
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              <Sticker rotate={-3} color={T.green} fg="#fff">100% free · no obligation</Sticker>
              <Sticker rotate={2}>Plain-English report</Sticker>
            </div>
            <DisplayHead as="h1" size={isMobile ? 36 : 48} light style={{ marginBottom: 20, lineHeight: 1.0 }}>
              Can someone send email pretending to be your business?
            </DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 18, lineHeight: 1.65, margin: '0 0 24px', maxWidth: '52ch' }}>
              For most businesses, the answer is yes, and they have no idea. We'll check your domain's email security for free and send you a plain-English report on exactly what's exposed.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.65, margin: '0 0 28px', maxWidth: '52ch' }}>
              We've been quietly checking local businesses, and most are wide open, often without their current IT provider ever flagging it.
            </p>
            <a href="#checker" style={{ ...ctaStyle, textDecoration: 'none' }}>Run my free check ↓</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: '6', l: 'Areas we check' },
              { n: '15 min', l: 'All it takes from you' },
              { n: '£0', l: 'Cost (genuinely)' },
            ].map(s => (
              <div key={s.l} style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '20px 22px',
              }}>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 28, color: T.yellow, lineHeight: 1, marginBottom: 4 }}>{s.n}</div>
                <div style={{
                  fontFamily: "'Archivo Narrow', sans-serif", fontSize: 10,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.4)', fontWeight: 700,
                }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTERACTIVE CHECKER */}
      <section id="checker" style={{ background: T.paperDeep, padding: isMobile ? '48px 20px' : '64px 32px', borderBottom: `1px solid ${T.hairline}`, scrollMarginTop: 80 }}>
        <EmailCheckerTool onBookCall={() => setCalOpen(true)} />
      </section>

      {/* WHAT WE CHECK */}
      <section style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>What the report covers</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 12 }}>Six checks. One clear verdict.</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, margin: 0, maxWidth: '54ch', lineHeight: 1.6 }}>
              These are the settings that decide whether criminals can impersonate your domain, and whether your real email reaches the inbox. New to the terms? Start with our <Link to="/technology/email-authentication" style={{ color: T.primary, fontWeight: 700 }}>plain-English guide to SPF, DKIM & DMARC</Link>, or our <Link to="/email-security-guide" style={{ color: T.primary, fontWeight: 700 }}>step-by-step guide to fixing them yourself</Link>.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: 16,
          }}>
            {REPORT.map((c, i) => (
              <div key={i} style={{
                background: T.white,
                border: `1px solid ${T.hairline}`,
                padding: 24,
                boxShadow: '0 2px 8px rgba(15,25,35,0.04)',
              }}>
                <div style={{ fontSize: 26, marginBottom: 10 }}>{c.icon}</div>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 18, marginBottom: 8, lineHeight: 1.1 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(15,25,35,0.62)', lineHeight: 1.6, marginBottom: 12 }}>{c.what}</div>
                <div style={{
                  fontFamily: "'Archivo Narrow', sans-serif", fontSize: 10,
                  textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700,
                  color: T.primary, marginBottom: 4,
                }}>What it means for you</div>
                <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.6 }}>{c.means}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: T.paperDeep, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>How it works</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 8 }}>Three steps. Nothing to install.</DisplayHead>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 20,
          }}>
            {STEPS.map(s => (
              <div key={s.n} style={{
                background: T.white,
                border: `1px solid ${T.hairline}`,
                padding: '24px 22px',
                boxShadow: '0 4px 16px rgba(15,25,35,0.06)',
                position: 'relative',
              }}>
                <div style={{
                  fontFamily: "'Bungee', sans-serif", fontSize: 40, lineHeight: 1,
                  color: T.hairline,
                  position: 'absolute', top: 12, right: 14,
                }}>{s.n}</div>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 17, marginBottom: 10, lineHeight: 1.1, position: 'relative' }}>{s.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(15,25,35,0.62)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ color: 'rgba(15,25,35,0.55)', fontSize: 14, lineHeight: 1.65, margin: '28px 0 0', maxWidth: '60ch' }}>
            Worried email fraud is already happening? See <Link to="/business-email-compromise" style={{ color: T.primary, fontWeight: 700 }}>what to do about business email compromise</Link>, or read why this is the foundation of <Link to="/services/cyber-essentials" style={{ color: T.primary, fontWeight: 700 }}>Cyber Essentials</Link>.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: T.ink, padding: '72px 32px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>Find out where you stand</Eyebrow>
          <DisplayHead size={40} light style={{ marginBottom: 16 }}>Get your free email security check</DisplayHead>
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.65,
            margin: '0 auto 28px', maxWidth: '46ch',
          }}>
            Book a 15-minute call. We'll run the checks and send your report. No sales script, no obligation.
          </p>
          <button onClick={() => setCalOpen(true)} style={ctaStyle}>Book my free check →</button>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 16 }}>
            Prefer to talk? Call <a href="tel:+441584517234" style={{ color: T.yellow }}>01584 517 234</a>.
          </p>
        </div>
        <LastReviewed light />
      </section>

      <CalendlyModal isOpen={calOpen} onClose={() => setCalOpen(false)} />
    </>
  );
};

export default EmailSecurityCheckPageV2;
