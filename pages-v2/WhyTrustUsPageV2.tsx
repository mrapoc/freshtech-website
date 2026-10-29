import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { useLiveStats } from '../components/LiveStats';
import { formatMinutes } from '../utils/publicMetrics';
import { T, useWindowWidth, useContentMax, Eyebrow, DisplayHead } from '../components-v2/primitives';

const BRAND = { phone: '01584 517 234', phoneHref: 'tel:+441584517234' };

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const Tick: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="9" fill={T.green} fillOpacity="0.15" />
    <path d="M5 9l3 3 5-6" stroke={T.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface GuaranteeProps { icon: string; title: string; body: string; sticker?: string; }
const GuaranteeCard: React.FC<GuaranteeProps> = ({ icon, title, body, sticker }) => (
  <div style={{
    background: T.white,
    border: `2px solid ${T.ink}`,
    padding: 32,
    boxShadow: `4px 4px 0 0 ${T.ink}`,
    position: 'relative',
  }}>
    {sticker && (
      <div style={{
        position: 'absolute', top: -14, right: 16,
        background: T.yellow, border: `2px solid ${T.ink}`,
        padding: '4px 12px',
        fontFamily: "'Bungee', sans-serif", fontSize: 11,
        transform: 'rotate(3deg)',
        boxShadow: `2px 2px 0 0 ${T.ink}`,
      }}>{sticker}</div>
    )}
    <div style={{ fontSize: 32, marginBottom: 14 }}>{icon}</div>
    <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 20, marginBottom: 10, lineHeight: 1.1 }}>{title}</div>
    <div style={{ fontSize: 14, color: 'rgba(15,25,35,0.62)', lineHeight: 1.65 }}>{body}</div>
  </div>
);

const StatBlock: React.FC<{ num: string; label: string; sub?: string }> = ({ num, label, sub }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 40, lineHeight: 1, color: T.yellow, marginBottom: 4 }}>{num}</div>
    <div style={{
      fontFamily: "'Archivo Narrow', sans-serif", fontSize: 12,
      textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700,
      color: 'rgba(255,255,255,0.7)',
    }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{sub}</div>}
  </div>
);

const TESTIMONIALS = [
  { quote: "In healthcare, downtime isn't an option. Fresh Tech ensures our care management systems run 24/7. We've had zero unplanned outages since switching.", name: 'Vince Burmingham', company: 'Hendra Healthcare' },
  { quote: 'When our server failed unexpectedly, they had us back online within 2 hours. That kind of response saves us thousands in lost productivity.',                  name: 'Stephen Jaques',  company: 'Jaques Int' },
  { quote: 'We have been working with Sam and the Fresh Tech team for over 5 years. The response time and service we receive is excellent.',                              name: 'Helen Graham',    company: 'The Ludlow Nut Company' },
  { quote: "Fresh Tech typically responds in under 15 minutes. It's like having my own IT department, but at a fraction of the cost.",                                    name: 'Iain Urquhart',   company: 'Advanced Pest Management' },
];

const STEPS = [
  { day: 'Day 1',      title: 'Discovery call',          desc: '30 minutes. We listen to your situation, ask about your pain points, and tell you honestly whether we can help. No sales script.' },
  { day: 'Days 2–5',   title: 'Technical audit',          desc: 'We scan your network, devices, security posture, and licences. You get a plain-English report of every risk we find, yours to keep regardless of whether you proceed.' },
  { day: 'Days 6–7',   title: 'Proposal & agreement',     desc: 'Clear, itemised quote with fixed monthly pricing. You know exactly what you get before you sign. No hidden costs, no surprises on the first invoice.' },
  { day: 'Days 8–14',  title: 'Credential handover',      desc: "We liaise with your current provider to transfer admin access and licences. If they're awkward about it, we've dealt with that before, and we can work around them." },
  { day: 'Days 15–21', title: 'Setup & parallel running', desc: 'Monitoring, backups, security tools deployed to every device. Both systems run side-by-side so your team experiences zero downtime during the switch.' },
  { day: 'Day 22+',    title: 'Go live',                   desc: 'Your team gets a quick intro: how to reach us, what to expect. From here we handle everything in the background and you get on with running your business.' },
];

const MANAGED = [
  'Email & Microsoft 365', 'Servers & networks', 'Printers & peripherals',
  'Backups & disaster recovery', 'Antivirus & endpoint security',
  'Domain names & DNS', 'Internet & phone lines',
  'Software licences & renewals', 'Staff onboarding & offboarding',
  'Vendor management (we deal with BT)',
];

const TOOLS = [
  { name: 'Microsoft 365 Business',        desc: 'Email, Teams, SharePoint, OneDrive, fully managed' },
  { name: 'Cyber Essentials Certified',     desc: 'NCSC-backed security standard: we hold it and help you get it' },
  { name: '24/7 Remote Monitoring',         desc: 'Proactive alerts: we catch problems before you notice' },
  { name: 'Encrypted cloud backup',         desc: 'Automatic, tested, off-site, with restores verified quarterly' },
  { name: 'Advanced endpoint protection',   desc: 'Next-gen AV on every device, managed centrally' },
  { name: 'Unlimited helpdesk',             desc: 'Phone, email, remote: no caps, no per-issue fees' },
];

const COMPARISON = [
  { label: 'Who answers your call', them: 'Call centre. Ticket queue.', us: 'Sam. Or Matt. By name.' },
  { label: 'Response time',         them: 'Best efforts (usually hours)', us: 'Under 15 minutes, measured' },
  { label: 'Pricing model',         them: 'Hours + callouts + extras', us: 'Flat per-user fee (onsite billed separately)' },
  { label: 'Onboarding cost',       them: '£1,500–5,000 setup fee', us: 'No setup fee' },
  { label: 'New user setup',         them: '£150–300 per user', us: 'Included' },
  { label: 'Security training',      them: '£500+/year extra', us: 'Included' },
  { label: 'Leaving',                them: 'Export fee, awkward handover', us: '30-day notice, clean exit' },
];

export const WhyTrustUsPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const { stats, loading } = useLiveStats();

  const liveResponse = formatMinutes(stats?.AverageResponseTimeLast30DaysMinutes, loading);
  const liveCallWait = formatMinutes(stats?.CallWaitTimeInMinutes, loading);
  const liveResolution = formatMinutes(stats?.AverageResolutionTimeLast30DaysMinutes, loading);

  return (
    <>
      <SEO
        title="Why Trust Fresh Tech: Guarantees, Stats & Real Clients"
        description="Helpdesk performance, 30-day money-back guarantee, Cyber Essentials accreditation and real client stories. Locally-owned IT support in Ludlow since 2014."
        type="profile"
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
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 36 : 72,
          alignItems: 'center',
        }}>
          <div>
            <Eyebrow light>Why trust us?</Eyebrow>
            <DisplayHead as="h1" size={isMobile ? 36 : 48} light style={{ marginBottom: 20, lineHeight: 1 }}>
              We prove it. We don't just say it.
            </DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 18, lineHeight: 1.65, margin: '0 0 24px', maxWidth: '46ch' }}>
              Below you'll find our contractual guarantees, live performance data from our helpdesk (not marketing numbers, real ones), and the exact timeline of what your first month looks like.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.65, margin: '0 0 28px', maxWidth: '46ch' }}>
              If something doesn't add up, call me on <a href={BRAND.phoneHref} style={{ color: T.primary }}>{BRAND.phone}</a> and ask me directly. <strong style={{ color: T.white }}>Sam, Founder</strong>
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
              }}>Book a call →</Link>
              <a href="#guarantees" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: 'transparent', color: T.white,
                border: '2px solid rgba(255,255,255,0.3)',
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
                textDecoration: 'none',
              }}>See guarantees ↓</a>
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: 32,
            display: 'flex', gap: 20,
            alignItems: 'flex-start',
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            <div style={{
              width: 72, height: 72, flexShrink: 0,
              background: T.paperDeep,
              border: '2px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>👤</div>
            <div>
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 20, color: T.white, marginBottom: 4 }}>Sam James</div>
              <div style={{
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: T.accent, fontWeight: 700, marginBottom: 14,
              }}>Founder &amp; Director · Est. 2014</div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.65, margin: '0 0 16px' }}>
                I started Fresh Tech because I was tired of seeing local businesses get let down by IT companies that didn't call back, charged by the ticket, and spoke in jargon. After a decade supporting businesses across Shropshire, Herefordshire and the Welsh Marches, I know what makes people hesitate: <em style={{ color: 'rgba(255,255,255,0.8)' }}>will this one actually be different?</em>
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {['Cyber Essentials Certified', 'Microsoft Partner', 'Dell Premier Partner', 'Huntress SOC Partner', 'Customer reviews'].map((b, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    padding: '4px 10px',
                    fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600,
                  }}>{b}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE STATS */}
      <section style={{ background: T.primaryDark, padding: '28px 32px' }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#4ade80',
              boxShadow: '0 0 0 3px rgba(74,222,128,0.3)',
            }} />
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.5)', fontWeight: 700,
            }}>Helpdesk report · Availability depends on the feed</div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? 24 : 32,
          }}>
            <StatBlock num={liveResponse}   label="Avg first response" sub="Last 30 days" />
            <StatBlock num={liveCallWait}   label="Avg call wait"      sub="Last 30 days" />
            <StatBlock num={liveResolution} label="Avg resolution"     sub="Last 30 days" />
            <StatBlock num="Reviews"        label="Customer feedback" sub="Read selected reviews below" />
          </div>
        </div>
      </section>

      {/* GUARANTEES */}
      <section id="guarantees" style={{ background: T.paper, padding: '80px 32px' }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <Eyebrow>Guarantees</Eyebrow>
            <DisplayHead size={40} style={{ marginBottom: 12 }}>Four promises. In writing.</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, margin: 0, maxWidth: '52ch', lineHeight: 1.6 }}>
              Not marketing copy: these are contractual commitments in every client agreement.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 20,
          }}>
            <GuaranteeCard icon="🛡️" sticker="In writing" title="30-day money-back guarantee" body="If we're not the right fit in your first 30 days, you pay nothing. No questions, no argument. We'll even help you transition away if needed." />
            <GuaranteeCard icon="🔄" title="Zero downtime switching" body="We run both IT systems in parallel during handover. Your team keeps working. Most clients never notice the change happened. They just start getting faster responses." />
            <GuaranteeCard icon="⚡" title="Measured response times" body="When available, the figures above come from our helpdesk report. Contact us to discuss the response commitments for your business." />
            <GuaranteeCard icon="📋" title="No lock-in tricks" body="12-month terms so we can invest in setting you up properly. But if it's not working, we'll part ways fairly. We keep clients by being good at the job, not by trapping them." />
          </div>
        </div>
      </section>

      {/* WHAT WE TAKE OFF YOUR PLATE */}
      <section style={{ background: T.white, padding: '72px 32px', borderTop: `1px solid ${T.hairline}`, borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 32 : 64,
          alignItems: 'center',
        }}>
          <div>
            <Eyebrow>Scope of service</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 20 }}>Everything off your plate</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, lineHeight: 1.65, margin: '0 0 28px', maxWidth: '46ch' }}>
              One flat monthly fee covers all of this. No per-ticket charges, no "that's out of scope" emails, no invoices you didn't see coming.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {MANAGED.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  fontSize: 14, color: T.ink,
                }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}><Tick /></div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.paperDeep, border: `1px solid ${T.hairline}`, padding: 32 }}>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.14em',
              color: 'rgba(15,25,35,0.4)', fontWeight: 700,
              marginBottom: 20,
            }}>Standards &amp; tools</div>
            {TOOLS.map(({ name, desc }, i) => (
              <div key={i} style={{
                padding: '12px 0',
                borderBottom: i < TOOLS.length - 1 ? `1px solid ${T.hairline}` : undefined,
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{name}</div>
                <div style={{ fontSize: 12, color: 'rgba(15,25,35,0.62)' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FIRST 30 DAYS */}
      <section style={{ background: T.paperDeep, padding: '80px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 32 : 64,
          alignItems: 'start',
        }}>
          <div>
            <Eyebrow>Onboarding</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 16 }}>Your first 30 days</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, lineHeight: 1.65, margin: '0 0 12px', maxWidth: '42ch' }}>
              Switching IT providers feels risky. We've done it dozens of times for businesses just like yours. Here's exactly what happens, step by step, no surprises.
            </p>
            <div style={{
              marginTop: 24,
              background: T.ink, color: T.white,
              padding: '20px 24px',
              ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
            }}>
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 18, color: T.yellow, marginBottom: 8 }}>The "difficult previous IT" problem</div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>
                If your current provider is being awkward about handing over admin credentials or licences, we've handled that before. We can work around uncooperative providers. It's never stopped an onboarding yet.
              </p>
            </div>
          </div>
          <div style={{ position: 'relative', paddingLeft: 28, borderLeft: `3px solid ${T.primary}` }}>
            {STEPS.map(({ day, title, desc }, i) => (
              <div key={i} style={{ marginBottom: 28, position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: -39, top: 3,
                  background: T.primary,
                  width: 22, height: 22,
                  border: `3px solid ${T.paperDeep}`,
                  boxShadow: `0 0 0 2px ${T.primary}`,
                }} />
                <div style={{
                  display: 'inline-block',
                  background: T.accent, color: T.white,
                  padding: '2px 10px',
                  fontFamily: "'Bungee', sans-serif", fontSize: 11,
                  marginBottom: 6,
                }}>{day}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title}</div>
                <div style={{ color: 'rgba(15,25,35,0.62)', fontSize: 13, lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{
        background: T.ink, padding: '80px 32px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
      }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Eyebrow light>What clients say</Eyebrow>
            <DisplayHead size={36} light style={{ marginBottom: 8 }}>From businesses we support</DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, margin: 0 }}>Our average client relationship is over 5 years.</p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 20,
          }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: T.white, border: `1px solid ${T.hairline}`,
                padding: 28, boxShadow: '0 4px 16px rgba(15,25,35,0.06)',
              }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                  {Array(5).fill(0).map((_, j) => <span key={j} style={{ color: T.yellow, fontSize: 14 }}>★</span>)}
                </div>
                <p style={{ fontSize: 15, color: T.ink, lineHeight: 1.7, fontStyle: 'italic', margin: '0 0 18px' }}>"{t.quote}"</p>
                <div style={{ borderTop: `1px solid ${T.hairline}`, paddingTop: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(15,25,35,0.4)', marginTop: 2 }}>{t.company}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link to="/case-studies" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: T.primary, fontSize: 14, fontWeight: 700,
              textDecoration: 'none',
              borderBottom: `1px solid ${T.primary}`,
              paddingBottom: 2,
            }}>Read full case studies →</Link>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section style={{ background: T.white, padding: '80px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>The comparison</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 8 }}>Fresh Tech vs typical IT support</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 15, margin: 0 }}>
              Not "us vs a named competitor", just the differences that actually matter in a support relationship.
            </p>
          </div>
          <div style={{ border: `1px solid ${T.hairline}`, overflow: 'hidden' }}>
            {!isMobile && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 240px 240px',
                background: T.ink, padding: '14px 24px', gap: 16,
              }}>
                <div style={{
                  fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.4)', fontWeight: 700,
                }}>What matters</div>
                <div style={{
                  fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.4)', fontWeight: 700, textAlign: 'center',
                }}>Typical IT firm</div>
                <div style={{
                  fontFamily: "'Bungee', sans-serif", fontSize: 13,
                  color: T.yellow, textAlign: 'center',
                }}>Fresh Tech</div>
              </div>
            )}
            {COMPARISON.map(({ label, them, us }, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 240px 240px',
                gap: isMobile ? 8 : 16,
                padding: '14px 24px',
                background: i % 2 === 0 ? T.white : T.paper,
                borderTop: `1px solid ${T.hairline}`,
                alignItems: 'center',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{label}</div>
                <div style={{
                  fontSize: 13, color: T.red,
                  textAlign: isMobile ? 'left' : 'center',
                  display: 'flex', alignItems: 'center',
                  justifyContent: isMobile ? 'flex-start' : 'center',
                  gap: 6,
                }}><span style={{ fontWeight: 700 }}>✕</span>{them}</div>
                <div style={{
                  fontSize: 13, color: T.green, fontWeight: 700,
                  textAlign: isMobile ? 'left' : 'center',
                  display: 'flex', alignItems: 'center',
                  justifyContent: isMobile ? 'flex-start' : 'center',
                  gap: 6,
                }}><span>✓</span>{us}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: T.paper, padding: '80px 32px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow>Ready?</Eyebrow>
          <DisplayHead size={44} style={{ marginBottom: 16 }}>Book a call with Sam</DisplayHead>
          <p style={{
            color: 'rgba(15,25,35,0.62)', fontSize: 18, lineHeight: 1.65,
            margin: '0 auto 32px', maxWidth: '46ch',
          }}>
            20 minutes. No sales pitch, no obligation. Just an honest conversation about your IT and whether we're the right fit.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <Link to="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 28px',
              background: T.accent, color: T.white,
              border: `2px solid ${T.ink}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 16,
              textDecoration: 'none',
              boxShadow: `4px 4px 0 0 ${T.ink}`,
            }}>Book a 20-min call →</Link>
            <Link to="/pricing" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 28px',
              background: 'transparent', color: T.ink,
              border: `2px solid ${T.ink}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 16,
              textDecoration: 'none',
            }}>See pricing</Link>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(15,25,35,0.4)' }}>
            30-day money-back guarantee · {BRAND.phone} · Mon–Fri 9am–5pm
          </div>
        </div>
      </section>
    </>
  );
};

export default WhyTrustUsPageV2;
