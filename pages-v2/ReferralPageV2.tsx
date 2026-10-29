import React, { useState } from 'react';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, useContentMax, Eyebrow, DisplayHead } from '../components-v2/primitives';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const HOW_IT_WORKS = [
  { step: '01', title: 'You fill in the form',           desc: "Tell us who to contact: name, business, phone number. That's it." },
  { step: '02', title: 'We reach out gently',            desc: 'We contact them by their preferred method. No hard sell, no pestering, no cold-call energy.' },
  { step: '03', title: 'They join, you get free support', desc: "Once they've been with us 60 days, we credit your account with one full month of their service value, applied against your future support invoices until used up." },
];

const TRUST_POINTS = [
  'We contact the business once by their preferred method, with no repeat calls without consent.',
  'We mention your name only if you tell us to in the note below.',
  'We never share referral details with third parties.',
  "If they're not interested, we stop there. Simple.",
  'Credit lands once the referred business has been with us 60 days. If they cancel before then, no credit, but no hard feelings either.',
];

export const ReferralPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ yourName: '', yourBusiness: '', yourEmail: '', bizName: '', bizContact: '', bizPhone: '', note: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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
    color: 'rgba(15,25,35,0.6)',
    display: 'block', marginBottom: 6,
  };

  return (
    <>
      <SEO
        title="Refer a Business: Get a Month's Free Support"
        description="Refer a business to Fresh Tech. We credit your account with one month of their service value, used against your support bills. No cap, no awkward calls."
        type="website"
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
          gap: isMobile ? 36 : 64,
          alignItems: 'center',
        }}>
          <div>
            <div style={{
              display: 'inline-block',
              background: T.yellow,
              border: `2px solid ${T.white}`,
              padding: '6px 16px',
              fontFamily: "'Bungee', sans-serif", fontSize: 12,
              transform: 'rotate(-2deg)',
              marginBottom: 24,
            }}>Refer a business</div>
            <DisplayHead as="h1" size={isMobile ? 34 : 44} light style={{ marginBottom: 20, lineHeight: 1.0 }}>
              Know someone whose IT is driving them mad?
            </DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 18, lineHeight: 1.65, margin: '0 0 12px', maxWidth: '44ch' }}>
              Introduce a business that joins Fresh Tech and we knock a full month of their service value off your support bill. Refer a bigger one, knock off more.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 32px', maxWidth: '44ch' }}>
              No forms to chase. No awkward commission conversations. Just fill in the details below and we'll take it from there, discreetly.
            </p>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {[
                { n: '5min',    l: 'To submit a referral' },
                { n: '1 month', l: 'Free support per referral' },
                { n: 'No cap',  l: 'Refer bigger, knock off more' },
              ].map(({ n, l }, i) => (
                <div key={i}>
                  <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 28, color: T.yellow, lineHeight: 1 }}>{n}</div>
                  <div style={{
                    fontFamily: "'Archivo Narrow', sans-serif", fontSize: 10,
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: 'rgba(255,255,255,0.4)', fontWeight: 700,
                    marginTop: 4, maxWidth: '12ch', lineHeight: 1.4,
                  }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '20px 24px',
                display: 'flex', gap: 16, alignItems: 'flex-start',
              }}>
                <div style={{
                  fontFamily: "'Bungee', sans-serif", fontSize: 28,
                  color: 'rgba(255,255,255,0.15)',
                  flexShrink: 0, lineHeight: 1,
                }}>{step}</div>
                <div>
                  <div style={{ fontWeight: 700, color: T.white, fontSize: 15, marginBottom: 4 }}>{title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM */}
      <section style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 32 : 64,
          alignItems: 'start',
        }}>
          <div>
            <Eyebrow>The referral</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 16 }}>Tell us about them</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, lineHeight: 1.65, margin: '0 0 28px', maxWidth: '42ch' }}>
              We only need the basics. We'll do the rest without making it weird.
            </p>
            <div style={{ background: T.paperDeep, border: `1px solid ${T.hairline}`, padding: 24, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>What happens with this information</div>
              {TRUST_POINTS.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10,
                  fontSize: 14, color: 'rgba(15,25,35,0.62)',
                  alignItems: 'flex-start', marginBottom: 8,
                }}>
                  <span style={{ color: T.green, fontWeight: 700, flexShrink: 0 }}>✓</span>{t}
                </div>
              ))}
            </div>
            <div style={{
              background: T.ink, padding: '20px 24px',
              ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 12),
            }}>
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 13, color: T.yellow, marginBottom: 6 }}>Your reward: free support, in proportion</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                After your referral has been with us 60 days, one full month of their recurring service fee is credited to your account. It comes off your support invoices until exhausted, so the bigger the business you refer, the longer your free support lasts. <em style={{ color: 'rgba(255,255,255,0.45)' }}>Service fee only: licenses and hardware pass through at supplier cost.</em>
              </div>
            </div>
          </div>

          {sent ? (
            <div style={{
              background: T.ink, padding: 48, textAlign: 'center',
              ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 12),
            }}>
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 56, color: T.yellow, lineHeight: 1, marginBottom: 16 }}>SENT!</div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.6, margin: '0 0 12px' }}>
                Thanks for the introduction. We'll be in touch with them, and you, once we've made contact.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                Questions? Call us on <a href="tel:+441584517234" style={{ color: T.yellow }}>01584 517 234</a>.
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
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 18, marginBottom: 24 }}>Your details</div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 14, marginBottom: 14,
              }}>
                <div>
                  <label style={labelStyle}>Your name</label>
                  <input style={inputStyle} value={form.yourName} onChange={set('yourName')} placeholder="Helen" />
                </div>
                <div>
                  <label style={labelStyle}>Your email</label>
                  <input style={inputStyle} type="email" value={form.yourEmail} onChange={set('yourEmail')} placeholder="helen@yourfirm.co.uk" />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Your business <span style={{ color: 'rgba(15,25,35,0.4)', fontWeight: 400 }}>(so we know which account to credit)</span></label>
                <input style={inputStyle} value={form.yourBusiness} onChange={set('yourBusiness')} placeholder="Smith & Co Accountants" />
              </div>
              <div style={{ height: 1, background: T.hairline, margin: '20px 0' }} />
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 18, marginBottom: 16 }}>Business you're referring</div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Business name</label>
                <input style={inputStyle} value={form.bizName} onChange={set('bizName')} placeholder="Jones & Co Solicitors" />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 14, marginBottom: 14,
              }}>
                <div>
                  <label style={labelStyle}>Contact name</label>
                  <input style={inputStyle} value={form.bizContact} onChange={set('bizContact')} placeholder="David Jones" />
                </div>
                <div>
                  <label style={labelStyle}>Their phone</label>
                  <input style={inputStyle} value={form.bizPhone} onChange={set('bizPhone')} placeholder="01234 567890" />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Anything useful for us to know? (optional)</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  value={form.note}
                  onChange={set('note')}
                  placeholder="e.g. They're currently with [another provider] and pretty unhappy. Mention my name, Sarah referred you."
                />
              </div>
              <button type="submit" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: T.accent, color: T.white,
                border: `2px solid ${T.ink}`,
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
                cursor: 'pointer',
                boxShadow: `3px 3px 0 0 ${T.ink}`,
              }}>Submit referral →</button>
              <div style={{ fontSize: 12, color: 'rgba(15,25,35,0.4)', marginTop: 10 }}>
                We'll send you a confirmation email once we've made contact.
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
};

export default ReferralPageV2;
