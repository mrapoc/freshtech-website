import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, useContentMax, Eyebrow, DisplayHead } from '../components-v2/primitives';
import { LastReviewed } from '../components-v2/LastReviewed';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const Tick: React.FC<{ col?: string }> = ({ col = T.green }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="8" fill={col} fillOpacity="0.15" />
    <path d="M4.5 8l2.5 2.5 4.5-5" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Cross: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="8" fill={T.red} fillOpacity="0.12" />
    <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke={T.red} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const INCLUDED = [
  '24/7 monitoring of every device',
  'Huntress endpoint EDR (Endpoint Detection & Response)',
  'Patch automation (Windows + third-party apps)',
  'Software bundle + RMM agent installed',
  'Monthly alert summary report',
];

const NOT_INCLUDED = [
  'Human labour on alerts, billed at our standard block-hour rate',
  'No proactive maintenance visits',
  'No onsite call-outs',
  'No Microsoft 365 administration',
  'No new starter / leaver handling',
];

export const FoundationMonitoringPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;

  return (
    <>
      <SEO
        title="Foundation Monitoring: Protected Without Full Commitment"
        description="Protection without the full management. 24/7 monitoring, Huntress EDR and patching from £10/device + £30/site. For not-yet-managed organisations."
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
            <Eyebrow light>Off-tier · Foundation Monitoring</Eyebrow>
            <DisplayHead as="h1" size={isMobile ? 36 : 50} light style={{ marginBottom: 20, lineHeight: 0.97 }}>
              Protected. Without the full commitment.
            </DisplayHead>
            <p style={{
              color: 'rgba(255,255,255,0.7)', fontSize: '18px', lineHeight: 1.65,
              margin: '0 0 12px', maxWidth: '50ch',
            }}>
              Foundation Monitoring is for organisations that want the safety net of a managed service, without paying for the full management yet.
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.5)', fontSize: '15px', lineHeight: 1.65,
              margin: '0 0 32px', maxWidth: '50ch',
            }}>
              We deploy our monitoring stack, watch your environment 24/7, and send you a monthly summary. When something needs human attention, we'll quote you for it, no surprise invoices.
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
              }}>Talk to us about Foundation →</Link>
              <Link to="/pricing" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: 'transparent', color: T.white,
                border: '2px solid rgba(255,255,255,0.3)',
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '15px',
                textDecoration: 'none',
              }}>Compare with our managed plans →</Link>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: 32,
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '38px', color: T.yellow, lineHeight: 1 }}>£10</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: 24 }}>per device, per month</div>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '38px', color: T.yellow, lineHeight: 1 }}>+ £30</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>per site, per month</div>
            <div style={{
              marginTop: 24, paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.12)',
              fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5,
            }}>
              Indicative: we'll confirm exact pricing once we know your environment.
            </div>
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED / WHAT'S NOT */}
      <section style={{ background: T.paper, padding: '80px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>Honest scope</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 12 }}>What's in. What's not.</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: '16px', margin: 0, maxWidth: '60ch', lineHeight: 1.6 }}>
              Foundation Monitoring deliberately leaves things out. That's how the price works. We tell you exactly what you're paying for, and what you're not.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 24,
          }}>
            <div style={{
              background: T.white,
              border: `2px solid ${T.green}`,
              padding: 28,
              boxShadow: `4px 4px 0 0 ${T.green}`,
            }}>
              <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: T.green, fontWeight: 700, marginBottom: 10 }}>What you get</div>
              <DisplayHead size={22} style={{ marginBottom: 16 }}>Included</DisplayHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {INCLUDED.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '14px', color: T.ink, lineHeight: 1.5 }}>
                    <div style={{ flexShrink: 0, marginTop: 2 }}><Tick /></div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: T.white,
              border: `2px solid ${T.red}`,
              padding: 28,
              boxShadow: `4px 4px 0 0 ${T.red}`,
            }}>
              <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: T.red, fontWeight: 700, marginBottom: 10 }}>What you don't get</div>
              <DisplayHead size={22} style={{ marginBottom: 16 }}>Not included</DisplayHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {NOT_INCLUDED.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '14px', color: 'rgba(15,25,35,0.7)', lineHeight: 1.5 }}>
                    <div style={{ flexShrink: 0, marginTop: 2 }}><Cross /></div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{ background: T.paperDeep, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Eyebrow>Honest positioning</Eyebrow>
          <DisplayHead size={32} style={{ marginBottom: 16 }}>Who Foundation is, and isn't, for</DisplayHead>
          <p style={{ fontSize: '16px', color: 'rgba(15,25,35,0.7)', lineHeight: 1.7, margin: '0 0 16px', maxWidth: '64ch' }}>
            <strong style={{ color: T.ink }}>It's for organisations</strong> that want professional monitoring and threat detection but aren't ready (or don't yet need) to outsource day-to-day IT. Charities running on volunteer admins. Small offices with a competent internal helper. Businesses between IT providers.
          </p>
          <p style={{ fontSize: '16px', color: 'rgba(15,25,35,0.7)', lineHeight: 1.7, margin: '0 0 16px', maxWidth: '64ch' }}>
            <strong style={{ color: T.ink }}>It's not for organisations</strong> that need someone to pick up the phone when Outlook breaks, or that need help setting up a new starter, or that want monthly proactive maintenance. For that, you want <Link to="/pricing" style={{ color: T.primary, fontWeight: 600 }}>Standard, Plus or Premium</Link>.
          </p>
          <p style={{ fontSize: '15px', color: 'rgba(15,25,35,0.55)', lineHeight: 1.65, margin: 0, maxWidth: '64ch', fontStyle: 'italic' }}>
            Most Foundation clients eventually upgrade to Standard once we've shown them what we're seeing in their environment. That's fine. There's no upgrade fee, no contract reset, we just move you across.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{
        background: T.ink, padding: '72px 32px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>Want to start here?</Eyebrow>
          <DisplayHead size={36} light style={{ marginBottom: 16 }}>Foundation Monitoring in 7 days</DisplayHead>
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: '17px', lineHeight: 1.65,
            margin: '0 auto 28px', maxWidth: '44ch',
          }}>
            Quick scope call. Light onboarding. Monitoring active inside a week. No long contract, 30 days notice each side.
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

export default FoundationMonitoringPageV2;
