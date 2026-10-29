import React, { useState, lazy, Suspense } from 'react';
import { SEO } from '../components/SEO';
import { useLiveStats } from '../components/LiveStats';
import { formatMinutes } from '../utils/publicMetrics';
import { T, useWindowWidth, useContentMax, Eyebrow, DisplayHead } from '../components-v2/primitives';

const CalendlyModal = lazy(() =>
  import('../components/CalendlyModal').then(m => ({ default: m.CalendlyModal }))
);

const BRAND = {
  phone:     '01584 517 234',
  phoneHref: 'tel:+441584517234',
  email:     'hello@fresh-tech.uk',
};

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const TOWNS = [
  'Ludlow', 'Shrewsbury', 'Hereford', 'Telford',
  'Leominster', 'Craven Arms', 'Church Stretton',
  'Bridgnorth', 'Oswestry', 'Welshpool',
];

const FAQS: [string, string][] = [
  ['How quickly will you actually respond?',
    'Our office hours are Mon–Fri, 9am–5pm. Available helpdesk averages are shown below. Contact us to discuss support response commitments.'],
  ["We're already under contract with our IT provider, can we still talk?",
    "Yes. We're happy to have an honest conversation about your options. We won't pressure you to break a contract, and we can often help plan a clean switch for when the right moment comes."],
  ['Do you cover our area?',
    "We support businesses across Shropshire, Herefordshire and the Welsh Borders, primarily within roughly 30 miles of Ludlow. If you're outside that, call us anyway and we'll tell you honestly."],
  ['Is there a minimum contract?',
    "We ask for a reasonable initial term so we can do the setup properly, but we're not in the business of locking people in. We'll talk you through terms on the call."],
];

interface StatChipProps { num: string; label: string; live?: boolean; light?: boolean; }
const StatChip: React.FC<StatChipProps> = ({ num, label, live, light }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <div style={{
      fontFamily: "'Bungee', sans-serif", fontSize: '32px',
      lineHeight: 1, color: light ? T.white : T.primary,
    }}>{num}</div>
    <div style={{
      fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px',
      textTransform: 'uppercase', letterSpacing: '0.12em',
      color: light ? 'rgba(255,255,255,0.55)' : 'rgba(15,25,35,0.4)',
      fontWeight: 700,
    }}>{label}</div>
    {live && (
      <div style={{ fontSize: '10px', color: light ? 'rgba(255,255,255,0.35)' : 'rgba(15,25,35,0.4)', marginTop: 1 }}>
        Helpdesk report
      </div>
    )}
  </div>
);

interface BookPanelProps { onBook: () => void; }
const BookPanel: React.FC<BookPanelProps> = ({ onBook }) => (
  <div style={{
    background: T.white,
    border: `2px solid ${T.ink}`,
    padding: '36px 32px',
    boxShadow: `6px 6px 0 0 ${T.ink}`,
    position: 'relative',
  }}>
    <div style={{
      position: 'absolute', top: -16, right: 24,
      transform: 'rotate(3deg)',
      background: T.yellow, border: `2px solid ${T.ink}`,
      padding: '6px 14px',
      fontFamily: "'Bungee', sans-serif", fontSize: '13px',
      boxShadow: `3px 3px 0 0 ${T.ink}`,
      whiteSpace: 'nowrap',
    }}>Most popular</div>
    <Eyebrow>Option 01</Eyebrow>
    <h2 style={{ fontFamily: "'Bungee', sans-serif", fontSize: '28px', margin: '0 0 10px', lineHeight: 1.05 }}>Book a 20-min call</h2>
    <p style={{ color: 'rgba(15,25,35,0.6)', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px', maxWidth: '38ch' }}>
      Pick a time on Sam's calendar. We'll talk through your setup, answer questions, and tell you honestly whether we're a good fit.
    </p>
    <div style={{ background: T.paper, border: `1px solid ${T.hairline}`, padding: '18px 20px', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{
        width: 40, height: 40, flexShrink: 0,
        background: T.green, color: T.white,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Bungee', sans-serif", fontSize: 18,
      }}>20</div>
      <div>
        <div style={{
          fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700,
          color: 'rgba(15,25,35,0.55)', marginBottom: 4,
        }}>What you'll get</div>
        <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.55 }}>
          A 20-minute slot with Sam or Matthew, usually available within the week. No sales pitch, no obligation.
        </div>
      </div>
    </div>
    <button
      onClick={onBook}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '15px 20px',
        background: T.accent, color: T.white,
        border: `2px solid ${T.ink}`,
        fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '15px',
        cursor: 'pointer',
        boxShadow: `3px 3px 0 0 ${T.ink}`,
        justifyContent: 'center',
        marginBottom: 16,
        transition: 'all 120ms',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translate(-1px,-1px)';
        e.currentTarget.style.boxShadow = `4px 4px 0 0 ${T.ink}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = `3px 3px 0 0 ${T.ink}`;
      }}
    >Open booking calendar →</button>
    <div style={{ fontSize: '13px', color: 'rgba(15,25,35,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: T.green, fontWeight: 700 }}>●</span>
      <span>Mon–Fri, 9am–5pm · Sam or Matthew picks up · Ludlow</span>
    </div>
  </div>
);

const DirectPanel: React.FC<{ liveResponse: string; liveCallWait: string }> = ({ liveResponse, liveCallWait }) => (
  <div style={{
    background: T.ink, color: T.white,
    padding: 40,
    ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
  }}>
    <Eyebrow light>Option 02</Eyebrow>
    <h2 style={{ fontFamily: "'Bungee', sans-serif", fontSize: '28px', margin: '0 0 12px', lineHeight: 1.05, color: T.white }}>Call us now</h2>
    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '15px', lineHeight: 1.6, margin: '0 0 28px' }}>
      Existing customer or urgent issue? Call direct. A real person in Ludlow picks up, not a queue, not a bot.
    </p>
    <a href={BRAND.phoneHref} style={{
      display: 'block',
      background: T.accent, color: T.white,
      border: `2px solid ${T.white}`,
      padding: '16px 24px',
      textDecoration: 'none', fontWeight: 700, fontSize: '22px',
      letterSpacing: '0.02em', marginBottom: 20,
      textAlign: 'center',
      boxShadow: `4px 4px 0 0 ${T.yellow}`,
    }}>{BRAND.phone}</a>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16 }}>
        <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '26px', color: T.primary }}>
          {liveResponse}
        </div>
        <div style={{
          fontFamily: "'Archivo Narrow', sans-serif", fontSize: '10px',
          textTransform: 'uppercase', letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 700,
        }}>Avg response</div>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>Helpdesk report</div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16 }}>
        <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '26px', color: T.primary }}>
          {liveCallWait}
        </div>
        <div style={{
          fontFamily: "'Archivo Narrow', sans-serif", fontSize: '10px',
          textTransform: 'uppercase', letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 700,
        }}>Avg call wait</div>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>Helpdesk report</div>
      </div>
    </div>
    <a href={`mailto:${BRAND.email}`} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      color: 'rgba(255,255,255,0.65)', textDecoration: 'none',
      fontSize: '14px',
      borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 16,
    }}>
      <span style={{ fontFamily: "'Bungee', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>OR</span>
      <span>Email <strong style={{ color: T.white }}>{BRAND.email}</strong></span>
    </a>
  </div>
);

const FaqStrip: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {FAQS.map(([q, a], i) => (
        <div key={i} style={{ borderBottom: `1px solid ${T.hairline}` }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%', textAlign: 'left',
              padding: '20px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: 700, color: T.ink, lineHeight: 1.4 }}>{q}</span>
            <span style={{
              fontFamily: "'Bungee', sans-serif", fontSize: '20px',
              color: T.primary, flexShrink: 0,
              transform: open === i ? 'rotate(45deg)' : 'none',
              transition: 'transform 200ms',
            }}>+</span>
          </button>
          {open === i && (
            <div style={{ padding: '0 0 20px', color: 'rgba(15,25,35,0.6)', fontSize: '15px', lineHeight: 1.65, maxWidth: '58ch' }}>
              {a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const ContactPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const isTablet = ww < 1024;
  const [bookingOpen, setBookingOpen] = useState(false);
  const { stats, loading } = useLiveStats();

  const liveResponse = formatMinutes(stats?.AverageResponseTimeLast30DaysMinutes, loading);
  const liveCallWait = formatMinutes(stats?.CallWaitTimeInMinutes, loading);

  return (
    <>
      <SEO
        title="Book a Call: IT Support Shropshire"
        description="Book a free 20-minute call with Fresh Tech, IT support for Shropshire businesses. No sales script, no obligation. Call 01584 517 234 or pick a time online."
        type="website"
      />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '72px 32px 80px',
        ...halftoneCss('rgba(255,255,255,0.045)', 1.4, 13),
      }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 36 : 64,
            alignItems: 'center',
          }}>
            <div>
              <Eyebrow light>Contact HQ</Eyebrow>
              <DisplayHead as="h1" size={isMobile ? 40 : 56} light style={{ marginBottom: 20 }}>
                Two engineers.<br />One phone number.<br />No queue.
              </DisplayHead>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '18px', lineHeight: 1.6, margin: '0 0 32px', maxWidth: '40ch' }}>
                Tell us what's happening. A real person in Ludlow comes back to you, usually under 15 minutes.
              </p>
              <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
                <StatChip num={liveResponse} label="Avg response" live light />
                <StatChip num={liveCallWait} label="Call wait" live light />
                <StatChip num="Reviews" label="Customer feedback" light />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{
                color: 'rgba(255,255,255,0.35)',
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px',
                textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700,
                marginBottom: 12,
              }}>Three ways to reach us</div>
              {[
                { label: 'Book a call',         value: "Pick a time, we'll talk through your setup",       icon: '📅', primary: true,  onClick: () => setBookingOpen(true) },
                { label: BRAND.phone,           value: 'Mon–Fri, 9am–5pm · Ludlow picks up',                icon: '📞', href: BRAND.phoneHref },
                { label: BRAND.email,           value: 'Reply within the hour on business days',             icon: '✉️', href: `mailto:${BRAND.email}` },
              ].map((opt, i) => {
                const inner = (
                  <>
                    <div style={{ fontSize: '20px' }}>{opt.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: opt.primary ? T.primary : T.white, fontSize: '15px' }}>{opt.label}</div>
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginTop: 2 }}>{opt.value}</div>
                    </div>
                    {opt.primary && (
                      <div style={{ marginLeft: 'auto', color: T.primary, fontWeight: 700, fontSize: '13px' }}>↓ below</div>
                    )}
                  </>
                );
                const style: React.CSSProperties = {
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 20px',
                  background: opt.primary ? 'rgba(50,136,190,0.2)' : i === 1 ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                  border: opt.primary ? '1px solid rgba(50,136,190,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  marginBottom: 8,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  color: 'inherit',
                };
                if (opt.onClick) {
                  return <button key={i} onClick={opt.onClick} style={{ ...style, width: '100%', textAlign: 'left' }}>{inner}</button>;
                }
                return <a key={i} href={opt.href} style={style}>{inner}</a>;
              })}
            </div>
          </div>
        </div>
      </section>

      {/* THREE OPTIONS */}
      <section style={{ background: T.paper, padding: '72px 32px' }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <Eyebrow>Get in touch</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 12 }}>Pick how you'd like to start</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.6)', fontSize: '16px', margin: 0, maxWidth: '52ch', lineHeight: 1.6 }}>
              No wrong answer. Both end up with a real conversation.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isTablet ? '1fr' : '1.1fr 0.9fr',
            gap: 24,
          }}>
            <BookPanel onBook={() => setBookingOpen(true)} />
            <DirectPanel liveResponse={liveResponse} liveCallWait={liveCallWait} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: T.paperDeep, padding: '72px 32px', borderTop: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Eyebrow>Common questions</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 12 }}>Before you get in touch</DisplayHead>
          </div>
          <FaqStrip />
        </div>
      </section>

      {/* COVERAGE */}
      <section style={{
        background: T.ink, padding: '40px 32px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
      }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{
            fontFamily: "'Archivo Narrow', sans-serif",
            textTransform: 'uppercase', letterSpacing: '0.14em',
            fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700,
          }}>We cover</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {TOWNS.map(t => (
              <span key={t} style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.14)',
                padding: '6px 14px', fontSize: '13px',
                color: 'rgba(255,255,255,0.75)', fontWeight: 600,
              }}>{t}</span>
            ))}
            <span style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px dashed rgba(255,255,255,0.2)',
              padding: '6px 14px', fontSize: '13px',
              color: 'rgba(255,255,255,0.35)',
            }}>+ surrounding areas</span>
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
            Not sure if you're in range? Call us, we'll tell you straight.
          </div>
        </div>
      </section>

      {bookingOpen && (
        <Suspense fallback={null}>
          <CalendlyModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
        </Suspense>
      )}
    </>
  );
};

export default ContactPageV2;
