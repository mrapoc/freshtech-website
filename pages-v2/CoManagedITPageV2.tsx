import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, useContentMax, Eyebrow, DisplayHead } from '../components-v2/primitives';
import { LastReviewed } from '../components-v2/LastReviewed';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const MODELS = [
  {
    title: 'Escalation backstop',
    desc: 'Your team owns day-to-day support. We are the senior bench behind them for the genuinely hard problems: deep troubleshooting, security incidents, and the issues that would otherwise eat a whole afternoon.',
  },
  {
    title: 'Holiday & sickness cover',
    desc: "When your IT person is on leave or off sick, your helpdesk doesn't go dark. We step in seamlessly so the business keeps moving and your IT lead can actually switch off.",
  },
  {
    title: 'Project surge capacity',
    desc: 'Extra hands and specialist skills for migrations, rollouts, office moves and infrastructure projects, without hiring contractors who do not know your environment.',
  },
  {
    title: 'Co-pilot & advisory',
    desc: 'vCIO roadmapping, architecture reviews and security strategy alongside your team: the senior perspective that is hard to justify as a full-time hire.',
  },
];

const YOU_KEEP = [
  'Day-to-day helpdesk and user relationships',
  'Knowledge of your people, systems and quirks',
  'Control of budget and priorities',
  'The internal face your staff already trust',
];

const WE_COVER = [
  '24/7 security: Huntress SOC + ThreatLocker zero-trust',
  'Escalation and deep technical troubleshooting',
  'Microsoft 365 & cloud architecture',
  'Monitoring, patching and RMM tooling',
  'Documentation, so nothing lives in one person’s head',
  'Out-of-hours and project delivery',
];

const Tick: React.FC<{ col?: string }> = ({ col = T.green }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
    <circle cx="8" cy="8" r="8" fill={col} fillOpacity="0.15" />
    <path d="M4.5 8l2.5 2.5 4.5-5" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CoManagedITPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;

  return (
    <>
      <SEO
        title="Co-Managed IT Support: Reinforce Your In-House IT"
        description="Co-managed IT support for businesses with an in-house IT team. Escalation, holiday cover, project surge capacity and 24/7 security, alongside your people, not instead of them."
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
            <Eyebrow light>For in-house IT teams</Eyebrow>
            <DisplayHead as="h1" size={isMobile ? 34 : 50} light style={{ marginBottom: 20, lineHeight: 0.97 }}>
              Your IT team, reinforced. Not replaced.
            </DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px', lineHeight: 1.65, margin: '0 0 12px', maxWidth: '52ch' }}>
              Co-managed IT gives your internal IT person, or team, a senior partner behind them. For escalation, holiday and sickness cover, project surge capacity, and the specialist work that is hard to justify hiring for.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', lineHeight: 1.65, margin: '0 0 32px', maxWidth: '52ch' }}>
              You keep control and the in-house relationship. We add the tools, the 24/7 security and the deep bench, so your IT lead stops being a single point of failure.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: T.accent, color: T.white,
                border: `2px solid ${T.white}`,
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '15px',
                textDecoration: 'none',
                boxShadow: `4px 4px 0 0 ${T.yellow}`,
              }}>Talk to us about co-managed IT →</Link>
              <Link to="/technology-stack" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: 'transparent', color: T.white,
                border: '2px solid rgba(255,255,255,0.3)',
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '15px',
                textDecoration: 'none',
              }}>See our technology stack →</Link>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: 32,
          }}>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '22px', color: T.yellow, lineHeight: 1.1, marginBottom: 16 }}>
              One IT person shouldn&rsquo;t be a single point of failure.
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0 }}>
              When your in-house IT lead is off, overloaded, or out of their depth on a specialist problem, the business shouldn&rsquo;t stop. Co-managed IT is the safety net behind them.
            </p>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Eyebrow>Who it&rsquo;s for</Eyebrow>
          <DisplayHead size={34} style={{ marginBottom: 16 }}>Built for the in-house IT manager</DisplayHead>
          <p style={{ fontSize: '16px', color: 'rgba(15,25,35,0.7)', lineHeight: 1.7, margin: '0 0 16px', maxWidth: '64ch' }}>
            Co-managed IT suits growing businesses, typically <strong style={{ color: T.ink }}>30 to 200 staff</strong>, that already have a capable internal IT person or small team, but feel the strain when one person has to cover everything.
          </p>
          <p style={{ fontSize: '16px', color: 'rgba(15,25,35,0.7)', lineHeight: 1.7, margin: 0, maxWidth: '64ch' }}>
            If your IT lead is brilliant on the day-to-day but stretched thin on security, cloud architecture and projects, and the whole function falls over the week they are on holiday, co-managed IT fills exactly those gaps, without you losing the internal relationship your staff rely on.
          </p>
        </div>
      </section>

      {/* MODELS */}
      <section style={{ background: T.paperDeep, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>Flexible by design</Eyebrow>
            <DisplayHead size={34} style={{ marginBottom: 12 }}>Four ways we plug in</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: '16px', margin: 0, maxWidth: '60ch', lineHeight: 1.6 }}>
              Mix and match to suit your team. Most clients start with one and grow into others as the relationship builds.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
            {MODELS.map((m, i) => (
              <div key={i} style={{
                background: T.white, border: `1px solid ${T.hairline}`,
                padding: 28, boxShadow: '0 4px 16px rgba(15,25,35,0.06)',
              }}>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '18px', marginBottom: 10, lineHeight: 1.1, color: T.primary }}>{m.title}</div>
                <div style={{ fontSize: '14px', color: 'rgba(15,25,35,0.65)', lineHeight: 1.65 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIVISION OF RESPONSIBILITY */}
      <section style={{ background: T.paper, padding: '80px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>Clear lines</Eyebrow>
            <DisplayHead size={34} style={{ marginBottom: 12 }}>Who does what</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: '16px', margin: 0, maxWidth: '60ch', lineHeight: 1.6 }}>
              We agree the split up front, in writing, so there is never confusion about who owns what. A typical division looks like this.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.white, border: `2px solid ${T.ink}`, padding: 28, boxShadow: `4px 4px 0 0 ${T.ink}` }}>
              <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: T.ink, fontWeight: 700, marginBottom: 10 }}>Your team</div>
              <DisplayHead size={22} style={{ marginBottom: 16 }}>You keep</DisplayHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {YOU_KEEP.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '14px', color: T.ink, lineHeight: 1.5 }}>
                    <Tick col={T.ink} /><span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.white, border: `2px solid ${T.primary}`, padding: 28, boxShadow: `4px 4px 0 0 ${T.primary}` }}>
              <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: T.primary, fontWeight: 700, marginBottom: 10 }}>Fresh Tech</div>
              <DisplayHead size={22} style={{ marginBottom: 16 }}>We cover</DisplayHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {WE_COVER.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '14px', color: T.ink, lineHeight: 1.5 }}>
                    <Tick col={T.primary} /><span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: T.ink, padding: '72px 32px', ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14) }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>Reinforce your team</Eyebrow>
          <DisplayHead size={36} light style={{ marginBottom: 16 }}>Give your IT lead a senior bench</DisplayHead>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '17px', lineHeight: 1.65, margin: '0 auto 28px', maxWidth: '46ch' }}>
            A 20-minute call is enough to map where your team needs support. No three-year tie-ins, no replacing anyone, just a stronger IT function.
          </p>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 24px',
            background: T.accent, color: T.white,
            border: `2px solid ${T.white}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '15px',
            textDecoration: 'none',
            boxShadow: `4px 4px 0 0 ${T.yellow}`,
          }}>Book a 20-min call →</Link>
        </div>
        <LastReviewed light />
      </section>
    </>
  );
};

export default CoManagedITPageV2;
