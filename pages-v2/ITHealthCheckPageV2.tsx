import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, useContentMax, Eyebrow, DisplayHead, Sticker } from '../components-v2/primitives';
import { LastReviewed } from '../components-v2/LastReviewed';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const CHECKLIST = [
  { icon: '🔐', title: 'Security posture',     desc: 'MFA coverage, password policies, account hygiene, who has admin and why.' },
  { icon: '💾', title: 'Backup + recovery',    desc: "What's backed up, how often, when it was last tested, and whether you'd actually recover from a ransomware hit." },
  { icon: '🛡️', title: 'Endpoint protection',  desc: 'Antivirus + threat detection on every device, patching cadence, Windows version coverage, encryption status.' },
  { icon: '☁️', title: 'Microsoft 365 health', desc: 'Licence right-sizing (most clients are over-paying), Conditional Access, retention policies, secure-score gaps.' },
  { icon: '📦', title: 'Hardware fleet',       desc: 'Age, warranty status, end-of-life devices, machines that should be retired.' },
  { icon: '🌐', title: 'Network + connectivity', desc: "Broadband contract terms, failover, Wi-Fi blackspots, what's plugged into what." },
  { icon: '📋', title: 'Compliance posture',    desc: 'Cyber Essentials readiness, GDPR documentation, sector-specific obligations.' },
  { icon: '💸', title: 'Total IT spend audit',  desc: "Everything you're paying for: software, hardware, support, licences. We find the leaks." },
];

const STEPS = [
  { n: '01', title: 'Quick chat',       desc: "20 minutes. We agree what we'll look at and what we won't." },
  { n: '02', title: 'Remote audit',      desc: 'We deploy a read-only scanner across your devices for 24–48 hours. No agent left behind.' },
  { n: '03', title: 'Plain-English report', desc: "Plain language, ranked by risk and impact. Yours to keep regardless of what you do next." },
  { n: '04', title: 'Optional follow-up', desc: "If you'd like us to fix any of it, we'll quote. No pressure. Many businesses just want the report." },
];

export const ITHealthCheckPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const isTablet = ww < 1024;
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', size: '10–25' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    border: `1px solid ${T.hairline}`,
    background: T.white,
    fontFamily: "'Archivo', sans-serif", fontSize: 15, color: T.ink,
    outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
    textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700,
    color: 'rgba(15,25,35,0.6)', display: 'block', marginBottom: 6,
  };

  return (
    <>
      <SEO
        title="Free IT Health Check: Find What's at Risk"
        description="Get a free, no-obligation IT health check. We audit your security, backups, M365 setup, hardware and total IT spend. Plain-English report, yours to keep."
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
              <Sticker rotate={2}>Plain English report</Sticker>
            </div>
            <DisplayHead as="h1" size={isMobile ? 38 : 50} light style={{ marginBottom: 20, lineHeight: 1.0 }}>
              Find out what's at risk. Before something breaks.
            </DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 18, lineHeight: 1.65, margin: '0 0 24px', maxWidth: '50ch' }}>
              A free, no-obligation audit of your security, backups, Microsoft 365 setup, hardware fleet and total IT spend. We deploy a read-only scanner for 24–48 hours, then send you a plain-English report.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.65, margin: '0 0 28px', maxWidth: '50ch' }}>
              No sales follow-up unless you ask. The report is yours to keep, even if you stay with your current provider.
            </p>
            <a href="#form" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 24px',
              background: T.accent, color: T.white,
              border: `2px solid ${T.white}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
              textDecoration: 'none',
              boxShadow: `4px 4px 0 0 ${T.yellow}`,
            }}>Request a free health check ↓</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: '8',     l: 'Areas we audit' },
              { n: '24–48h', l: 'Scanner deploy window' },
              { n: '£0',    l: 'Cost, genuinely' },
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

      {/* CHECKLIST */}
      <section style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>What we audit</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 12 }}>The eight things we check</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, margin: 0, maxWidth: '52ch', lineHeight: 1.6 }}>
              No fluff, no upsell trap. Just the things that actually matter for a 5–50-person business.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 16,
          }}>
            {CHECKLIST.map((c, i) => (
              <div key={i} style={{
                background: T.white,
                border: `1px solid ${T.hairline}`,
                padding: 24,
                boxShadow: '0 2px 8px rgba(15,25,35,0.04)',
              }}>
                <div style={{ fontSize: 26, marginBottom: 10 }}>{c.icon}</div>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 16, marginBottom: 8, lineHeight: 1.1 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(15,25,35,0.62)', lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: T.paperDeep, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>The process</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 8 }}>Four steps. About a week, end-to-end.</DisplayHead>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
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
        </div>
      </section>

      {/* FORM */}
      <section id="form" style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 32 : 64,
          alignItems: 'start',
        }}>
          <div>
            <Eyebrow>Request your check</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 16 }}>Get the report</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, lineHeight: 1.65, margin: '0 0 24px', maxWidth: '46ch' }}>
              Fill in your details and we'll be in touch within one business day to schedule the audit window.
            </p>
            <div style={{ background: T.ink, color: T.white, padding: '20px 24px', ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 12) }}>
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 16, color: T.yellow, marginBottom: 8 }}>What you'll receive</div>
              <ul style={{ paddingLeft: 18, margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7 }}>
                <li>Plain-English PDF report (10–15 pages typical)</li>
                <li>Risk register ranked by impact + likelihood</li>
                <li>Quick-win list (things to fix this month)</li>
                <li>Strategic recommendations (12-month roadmap)</li>
              </ul>
            </div>
          </div>

          {sent ? (
            <div style={{
              background: T.ink, padding: 48, textAlign: 'center',
              ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 12),
            }}>
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 56, color: T.yellow, lineHeight: 1, marginBottom: 16 }}>SENT!</div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.6, margin: '0 0 12px' }}>
                Thanks, we'll be in touch within one business day to schedule the audit.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                Urgent? Call <a href="tel:+441584517234" style={{ color: T.yellow }}>01584 517 234</a>.
              </p>
            </div>
          ) : (
            <form
              onSubmit={e => { e.preventDefault(); setSent(true); }}
              style={{
                background: T.white,
                border: `2px solid ${T.ink}`,
                padding: 36,
                boxShadow: `4px 4px 0 0 ${T.ink}`,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Your name</label>
                  <input style={inputStyle} value={form.name} onChange={set('name')} required placeholder="Sarah Jones" />
                </div>
                <div>
                  <label style={labelStyle}>Work email</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={set('email')} required placeholder="sarah@yourcompany.co.uk" />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Company</label>
                <input style={inputStyle} value={form.company} onChange={set('company')} required placeholder="Jones & Co Solicitors" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>How many staff use IT?</label>
                <select style={inputStyle} value={form.size} onChange={set('size')}>
                  <option>1–5</option>
                  <option>5–10</option>
                  <option>10–25</option>
                  <option>25–50</option>
                  <option>50+</option>
                </select>
              </div>
              <button type="submit" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: T.accent, color: T.white,
                border: `2px solid ${T.ink}`,
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
                cursor: 'pointer',
                boxShadow: `3px 3px 0 0 ${T.ink}`,
              }}>Request the audit →</button>
              <div style={{ fontSize: 12, color: 'rgba(15,25,35,0.4)', marginTop: 10 }}>
                We only use your details to schedule the audit and send you the report.
              </div>
            </form>
          )}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: T.ink, padding: '72px 32px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>Or just have a chat</Eyebrow>
          <DisplayHead size={40} light style={{ marginBottom: 16 }}>Prefer to talk first?</DisplayHead>
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.65,
            margin: '0 auto 28px', maxWidth: '44ch',
          }}>
            A 20-minute call works just as well as a form. No sales script.
          </p>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 24px',
            background: T.accent, color: T.white,
            border: `2px solid ${T.white}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
            textDecoration: 'none',
            boxShadow: `4px 4px 0 0 ${T.yellow}`,
          }}>Book a 20-min call →</Link>
        </div>
        <LastReviewed light />
      </section>
    </>
  );
};

export default ITHealthCheckPageV2;
