import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, useContentMax, Eyebrow, DisplayHead } from '../components-v2/primitives';

const BRAND = { phone: '01584 517 234', phoneHref: 'tel:+441584517234' };

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const FEARS = [
  { icon: '🔒', fear: "We're locked into a contract",        reality: "Most IT contracts have a notice period, often 30–90 days. We can help you review yours and plan the switch for when the timing is right. We've never advised someone to break a contract." },
  { icon: '⏱️', fear: 'Switching will cause downtime',         reality: 'We run both systems in parallel. Your team keeps working during the entire transition. Most clients say the changeover was invisible: they just noticed support got faster.' },
  { icon: '📁', fear: 'Getting our data and licences back',    reality: "Your data, passwords, and licences belong to you, not your IT company. If they're reluctant to hand over credentials, we know how to navigate that. We've dealt with uncooperative providers many times." },
  { icon: '🤷', fear: 'Our staff will struggle with the change', reality: 'We introduce ourselves to your team in the first week. One number, one email, same support. Most staff notice nothing except the calls get answered faster.' },
  { icon: '💸', fear: "There'll be hidden setup costs",          reality: 'No setup fee. No migration charge. No "discovery phase" invoice. We price on a per-user per-month basis from day one. That\'s it.' },
];

const STEPS = [
  { day: 'Week 1',     title: 'We audit what you have',  desc: 'Remote scan of your devices, licences, and security posture. You get a plain-English report, yours to keep regardless.' },
  { day: 'Week 2',     title: 'Notice served (by you)',   desc: 'You serve notice to your existing provider. We help you draft the letter if needed and check what notice period applies.' },
  { day: 'Weeks 2–4',  title: 'Credential handover',      desc: 'We request admin credentials, licence keys, and domain access from your outgoing provider. If they stall, we have workarounds.' },
  { day: 'Weeks 3–5',  title: 'Parallel running',          desc: 'Our monitoring, backups, and security tools go onto every device while your old provider is still technically in place. No gap in coverage.' },
  { day: 'Final week', title: 'Cutover',                    desc: "On the agreed date we take full control. Your team gets a 5-minute briefing: here's who to call, here's the new email, here's what changes. That's it." },
  { day: 'Month 2+',   title: 'Business as usual',          desc: "You call us by name. We pick up. You stop thinking about IT. That's the goal." },
];

const FAQS: [string, string][] = [
  ['We have a complicated setup: servers, remote workers, a VoIP system. Can you handle it?',
    "Yes. Complex setups are the norm, not the exception. We audit everything upfront so we know exactly what we're dealing with before we make any commitments. If something is genuinely outside our scope we'll tell you in the first week."],
  ["Our current IT company has been with us for years. Won't it be awkward?",
    "It's a business relationship, not a friendship. You're entitled to choose your IT provider. We handle the professional side of the transition, including formal notice, credential requests, and licence transfers, so you don't have to have that conversation yourself."],
  ['What if our staff are used to the way things work with the current provider?',
    "We'll match anything that's working and improve what isn't. We introduce ourselves to the whole team in the first week: quick briefing, new contact details, and that's it. Most staff say the main difference is their calls get answered faster."],
  ['Can we talk to you before committing to anything?',
    "Yes, that's the whole point of the first call. 20 minutes. No sales script. We'll tell you honestly if switching makes sense for your situation, including if it doesn't."],
];

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${T.hairline}` }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', textAlign: 'left',
          padding: '18px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: T.ink, lineHeight: 1.4 }}>{q}</span>
        <span style={{
          fontFamily: "'Bungee', sans-serif", fontSize: 22, color: T.primary,
          flexShrink: 0,
          transform: open ? 'rotate(45deg)' : 'none',
          transition: 'transform 200ms', lineHeight: 1,
        }}>+</span>
      </button>
      {open && <div style={{ padding: '0 0 18px', color: 'rgba(15,25,35,0.62)', fontSize: 15, lineHeight: 1.65, maxWidth: '60ch' }}>{a}</div>}
    </div>
  );
};

export const OnboardingPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;

  return (
    <>
      <SEO
        title="Switching IT Provider: Zero Downtime, No Hassle"
        description="Switching IT provider? Fresh Tech makes it seamless: zero downtime, we handle the credential transfer, your staff won't notice. Based in Ludlow, Shropshire."
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
            <Eyebrow light>Switching IT provider</Eyebrow>
            <DisplayHead as="h1" size={isMobile ? 36 : 46} light style={{ marginBottom: 20, lineHeight: 1.0 }}>
              Thinking about switching? Here's the honest guide.
            </DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 18, lineHeight: 1.65, margin: '0 0 16px', maxWidth: '48ch' }}>
              Most businesses stay with a bad IT provider far longer than they should, because switching sounds complicated. It isn't. We've done it dozens of times.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.65, margin: '0 0 28px', maxWidth: '46ch' }}>
              This page explains how it actually works, what happens with your data and contracts, and what you can expect from us if you decide to make the move.
            </p>
            <Link to="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 24px',
              background: T.accent, color: T.white,
              border: `2px solid ${T.white}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
              textDecoration: 'none',
              boxShadow: `4px 4px 0 0 ${T.yellow}`,
            }}>Book a 20-min call →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginBottom: 4,
            }}>Our switching record</div>
            {[
              { n: 'Zero',    l: 'Unplanned outages during any client migration' },
              { n: '30 days', l: 'Typical time from first call to fully switched' },
              { n: '100%',    l: 'Success rate on credential handovers (inc. difficult providers)' },
            ].map(({ n, l }, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '18px 22px',
              }}>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 28, color: T.yellow, lineHeight: 1, marginBottom: 4 }}>{n}</div>
                <div style={{
                  fontFamily: "'Archivo Narrow', sans-serif", fontSize: 10,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.4)', fontWeight: 700,
                }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEARS */}
      <section style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>The blockers</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 8 }}>What's stopping you. Addressed.</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, margin: 0, maxWidth: '52ch', lineHeight: 1.6 }}>
              These are the five reasons businesses stay with a bad IT provider. Here's the reality of each.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FEARS.map(({ icon, fear, reality }, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                background: i % 2 === 0 ? T.white : T.paperDeep,
                border: `1px solid ${T.hairline}`,
                borderTop: i > 0 ? 'none' : undefined,
              }}>
                <div style={{
                  padding: '24px 28px',
                  borderRight: isMobile ? 'none' : `1px solid ${T.hairline}`,
                  borderBottom: isMobile ? `1px solid ${T.hairline}` : 'none',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <div style={{ fontSize: 22, flexShrink: 0 }}>{icon}</div>
                  <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 16, color: T.red, lineHeight: 1.2 }}>"{fear}"</div>
                </div>
                <div style={{ padding: '24px 28px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ color: T.green, fontWeight: 700, fontSize: 16, flexShrink: 0 }}>✓</div>
                  <div style={{ fontSize: 14, color: 'rgba(15,25,35,0.62)', lineHeight: 1.65 }}>{reality}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section style={{ background: T.white, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr',
          gap: isMobile ? 32 : 64,
          alignItems: 'start',
        }}>
          <div>
            <Eyebrow>The process</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 16 }}>Step by step. No surprises.</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, lineHeight: 1.65, margin: '0 0 24px', maxWidth: '42ch' }}>
              This is exactly what a standard switch looks like. Most are complete within 30 days of the first call.
            </p>
            <div style={{ background: T.paperDeep, border: `1px solid ${T.hairline}`, padding: '20px 24px' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>What if we're mid-contract?</div>
              <p style={{ fontSize: 14, color: 'rgba(15,25,35,0.62)', lineHeight: 1.65, margin: 0 }}>
                We can start the process now and time the cutover to coincide with your contract end date. We'll help you review notice period requirements and plan accordingly. No reason to wait until you're miserable.
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
                  border: `3px solid ${T.white}`,
                  boxShadow: `0 0 0 2px ${T.primary}`,
                }} />
                <div style={{
                  display: 'inline-block',
                  background: T.accent, color: T.white,
                  padding: '2px 10px',
                  fontFamily: "'Bungee', sans-serif", fontSize: 11,
                  marginBottom: 5,
                }}>{day}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title}</div>
                <div style={{ color: 'rgba(15,25,35,0.62)', fontSize: 13, lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section style={{ background: T.paperDeep, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <Eyebrow>Questions</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 0 }}>More switching questions</DisplayHead>
          </div>
          {FAQS.map(([q, a], i) => <FaqItem key={i} q={q} a={a} />)}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: T.ink, padding: '72px 32px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>Ready to talk?</Eyebrow>
          <DisplayHead size={44} light style={{ marginBottom: 16 }}>It starts with one phone call.</DisplayHead>
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.65,
            margin: '0 auto 32px', maxWidth: '44ch',
          }}>
            20 minutes. No commitment. We'll tell you what switching would look like for your specific setup, and whether it's actually worth doing.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <Link to="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 28px',
              background: T.accent, color: T.white,
              border: `2px solid ${T.white}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 16,
              textDecoration: 'none',
              boxShadow: `4px 4px 0 0 ${T.yellow}`,
            }}>Book a 20-min call →</Link>
            <a href={BRAND.phoneHref} style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 28px',
              background: 'transparent', color: T.white,
              border: '2px solid rgba(255,255,255,0.35)',
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 16,
              textDecoration: 'none',
            }}>{BRAND.phone}</a>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            30-day money-back guarantee · Zero downtime switch · Mon–Fri 9am–5pm
          </div>
        </div>
      </section>
    </>
  );
};

export default OnboardingPageV2;
