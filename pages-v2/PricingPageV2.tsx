import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { useLiveStats } from '../components/LiveStats';
import { formatMinutes } from '../utils/publicMetrics';
import { T, useWindowWidth, useContentMax, halftone, Eyebrow, DisplayHead } from '../components-v2/primitives';
import { LastReviewed } from '../components-v2/LastReviewed';

const BRAND = {
  phone:     '01584 517 234',
  phoneHref: 'tel:+441584517234',
};

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

const TIERS = [
  {
    name: 'Standard', price: '40', highlight: false, minimum: '£200/month minimum',
    note: '9–5 reactive support, remote-first. The essentials, done properly.',
    features: [
      'Unlimited remote support, 9am–5pm working days',
      'Microsoft 365 admin (users, mailboxes, Teams, SharePoint, permissions)',
      'Annual technology business review',
      'One primary device per user + share of one site included',
      'Onsite visits when remote resolution is not possible, billed separately',
      'Same SLA as Plus and Premium (see below)',
    ],
  },
  {
    name: 'Plus', price: '60', highlight: true, sticker: 'Most popular', minimum: '£200/month minimum',
    note: 'Everything in Standard, plus priority handling, starter and leaver management, and a half-yearly roadmap.',
    features: [
      'Everything in Standard',
      'Half-yearly business review + 12-month roadmap headlines',
      'Priority queue placement vs Standard (same SLA)',
      'New starter & leaver handling included',
    ],
  },
  {
    name: 'Premium', price: '90', highlight: false,
    note: 'For businesses that want extended hours, project work bundled, and first-touch privilege.',
    features: [
      'Everything in Plus',
      'Extended cover hours (8am–6pm, best-effort)',
      'First-touch queue privilege (within same SLA priority)',
      '2 hours of quarterly project work bundled',
      'Quarterly review with vendor + licence rationalisation',
      '20% off any additional block-hour work',
    ],
  },
];

// Universal inclusions — sit on EVERY tier (Standard, Plus, Premium).
// Shown as a banded section above the tier cards so they're not repeated three times.
const UNIVERSAL_INCLUSIONS = [
  { title: 'Microsoft 365 backup',                   desc: 'Independent third-party backup of mail, OneDrive, SharePoint and Teams. Microsoft doesn\'t fully protect this by default.' },
  { title: 'Huntress EDR + identity threat detection', desc: '24/7 managed threat hunting on every endpoint and every M365 identity. Real humans, not just alerts.' },
  { title: 'Cyber Essentials maintenance + evidence pack', desc: 'Year-round controls and annual evidence pack ready for assessment. Certification fee set by IASME based on company size.' },
  { title: 'Cloudflare DNS management',              desc: 'We manage your DNS so a web host or marketing agency can\'t silently break your email or domain.' },
  { title: 'DMARC management',                       desc: 'Full DMARC policy management: protects your domain reputation and is increasingly required for inbox deliverability.' },
  { title: 'Basic shared webhosting',                desc: 'Simple business website hosting if you need it, no extra contract, no separate invoice.' },
  { title: 'Domain renewal absorbed (standard TLDs)', desc: 'We cover the annual renewal cost of standard TLDs (.co.uk, .com, .uk, .org, .net, .net.uk, .me.uk). Premium TLDs billed at cost, no markup. Domain stays registered in your name; if you leave, it goes with you.' },
];

// Universal SLA — identical across all three tiers. The Premium differentiator
// is queue position within the same priority, not faster SLA.
const SLA_ROWS: { priority: string; type: string; response: string; resolution: string }[] = [
  { priority: 'P1', type: 'Critical',  response: '30 min',         resolution: '8 working hours' },
  { priority: 'P2', type: 'High',      response: '1 hour',         resolution: '1 business day'  },
  { priority: 'P3', type: 'Medium',    response: '4 hours',        resolution: '3 business days' },
  { priority: 'P4', type: 'Low',       response: '1 business day', resolution: '5 business days' },
];

const OBJECTIONS = [
  { q: '"Switching providers sounds like a nightmare."',
    a: "We coordinate everything with your outgoing IT company. Your staff won't notice a thing; they'll just start getting faster responses. Zero downtime. We've done this dozens of times." },
  { q: "\"We don't want to be locked in.\"",
    a: '12-month agreements with a 30-day money-back guarantee. Not happy in the first month? Full refund, no questions asked. We keep clients by being good, not by trapping them.' },
  { q: "\"How do we know you'll actually respond quickly?\"",
    a: 'Available helpdesk averages are shown on the contact page. Contact us to discuss the response commitments included in your support agreement.' },
];

interface TierCardProps {
  tier: typeof TIERS[number];
  isMobile: boolean;
}

const TierCard: React.FC<TierCardProps> = ({ tier, isMobile: _ }) => {
  const { name, price, highlight, note, features, sticker, minimum } = tier as typeof TIERS[number] & { sticker?: string; minimum?: string };
  return (
    <div style={{
      background: highlight ? T.ink : T.white,
      border: `2px solid ${T.ink}`,
      padding: '36px 32px',
      boxShadow: highlight ? `6px 6px 0 0 ${T.accent}` : `4px 4px 0 0 ${T.ink}`,
      position: 'relative',
      flex: 1,
      ...(highlight ? halftoneCss('rgba(255,255,255,0.04)', 1.4, 12) : {}),
    }}>
      {sticker && (
        <div style={{
          position: 'absolute', top: -16, right: 20,
          transform: 'rotate(4deg)',
          background: T.yellow,
          border: `2px solid ${T.ink}`,
          padding: '5px 14px',
          fontFamily: "'Bungee', sans-serif", fontSize: '12px',
          boxShadow: `2px 2px 0 0 ${T.ink}`,
          whiteSpace: 'nowrap',
        }}>{sticker}</div>
      )}
      <Eyebrow light={highlight}>{name}</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <div style={{
          fontFamily: "'Bungee', sans-serif", fontSize: '52px',
          lineHeight: 1, color: highlight ? T.white : T.ink,
        }}>£{price}</div>
        <div style={{
          fontSize: '14px', color: highlight ? 'rgba(255,255,255,0.5)' : 'rgba(15,25,35,0.6)',
          fontWeight: 600,
        }}>/ user / month</div>
      </div>
      {minimum && (
        <div style={{
          fontSize: '11px',
          color: highlight ? 'rgba(255,255,255,0.4)' : 'rgba(15,25,35,0.45)',
          marginBottom: 14,
          fontStyle: 'italic',
        }}>{minimum}</div>
      )}
      <div style={{
        fontSize: '13px', color: highlight ? 'rgba(255,255,255,0.5)' : 'rgba(15,25,35,0.6)',
        marginBottom: 28, lineHeight: 1.5,
      }}>{note}</div>
      <div style={{
        borderTop: `1px solid ${highlight ? 'rgba(255,255,255,0.12)' : T.hairline}`,
        paddingTop: 24,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {features.map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            fontSize: '14px', color: highlight ? 'rgba(255,255,255,0.8)' : T.ink,
          }}>
            <div style={{ marginTop: 2, flexShrink: 0 }}><Tick col={highlight ? T.yellow : T.green} /></div>
            <span>{f}</span>
          </div>
        ))}
      </div>
      <Link to="/contact" style={{
        display: 'block', textAlign: 'center', marginTop: 28,
        padding: '13px 20px',
        background: highlight ? T.accent : 'transparent',
        color: highlight ? T.white : T.ink,
        border: `2px solid ${highlight ? T.white : T.ink}`,
        fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '14px',
        textDecoration: 'none',
        boxShadow: highlight ? '3px 3px 0 0 rgba(255,255,255,0.3)' : `3px 3px 0 0 ${T.ink}`,
      }}>{highlight ? 'Book a call →' : 'Talk to us →'}</Link>
    </div>
  );
};

export const PricingPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const isTablet = ww < 1024;
  const [users, setUsers] = useState(10);
  const [tier, setTier] = useState<'Standard' | 'Plus' | 'Premium'>('Plus');
  const tierRates: Record<typeof tier, number> = { Standard: 40, Plus: 60, Premium: 90 };
  const tierRate = tierRates[tier];
  const rawMonthly = users * tierRate;
  const MIN_MONTHLY = 200;
  const monthly = tier === 'Premium' ? rawMonthly : Math.max(rawMonthly, MIN_MONTHLY);
  const minimumApplied = tier !== 'Premium' && rawMonthly < MIN_MONTHLY;
  const { stats, loading } = useLiveStats();

  const liveResponse = formatMinutes(stats?.AverageResponseTimeLast30DaysMinutes, loading);
  const liveCallWait = formatMinutes(stats?.CallWaitTimeInMinutes, loading);

  return (
    <>
      <SEO
        title="Pricing: Simple per-user IT support"
        description="Indicative per-user pricing for managed IT support. Standard from £40/user/month. No setup fees, no time-and-materials creep. Onsite visits billed separately."
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
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 36 : 64,
          alignItems: 'center',
        }}>
          <div>
            <Eyebrow light>Pricing</Eyebrow>
            <DisplayHead as="h1" size={isMobile ? 38 : 52} light style={{ marginBottom: 20 }}>
              Remote IT support. Priced per person.
            </DisplayHead>
            <p style={{
              color: 'rgba(255,255,255,0.65)', fontSize: '18px',
              lineHeight: 1.65, margin: '0 0 28px', maxWidth: '44ch',
            }}>
              Remote IT support for a fixed monthly fee. Choose the cover your business needs. If we cannot fix an issue remotely, we can arrange an onsite visit, billed separately.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="#tiers" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: T.accent, color: T.white,
                border: `2px solid ${T.white}`,
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '15px',
                textDecoration: 'none',
                boxShadow: `4px 4px 0 0 ${T.yellow}`,
              }}>See the plans ↓</a>
              <Link to="/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: 'transparent', color: T.white,
                border: '2px solid rgba(255,255,255,0.4)',
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '15px',
                textDecoration: 'none',
              }}>Talk to us →</Link>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: 36,
          }}>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px',
              textTransform: 'uppercase', letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 20,
            }}>Quick estimate</div>
            <label style={{
              display: 'block', fontSize: '15px',
              color: 'rgba(255,255,255,0.7)', marginBottom: 12, lineHeight: 1.4,
            }}>How many people use IT in your business?</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <input
                type="range" min={3} max={100} value={users}
                onChange={e => setUsers(Number(e.target.value))}
                style={{ flex: 1, accentColor: T.accent, height: 6 }}
              />
              <div style={{
                fontFamily: "'Bungee', sans-serif", fontSize: '28px',
                color: T.white, minWidth: 48, textAlign: 'right',
              }}>{users}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {(['Standard', 'Plus', 'Premium'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    background: tier === t ? T.accent : 'rgba(255,255,255,0.06)',
                    color: tier === t ? T.white : 'rgba(255,255,255,0.55)',
                    border: `1px solid ${tier === t ? T.white : 'rgba(255,255,255,0.12)'}`,
                    fontFamily: "'Archivo', sans-serif",
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >{t} £{tierRates[t]}</button>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 20 }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                {tier} plan (£{tierRate}/user)
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{
                  fontFamily: "'Bungee', sans-serif", fontSize: '48px',
                  color: T.yellow, lineHeight: 1,
                }}>£{monthly.toLocaleString()}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>per month</div>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
                = £{(monthly * 12).toLocaleString()}/year · indicative
              </div>
              {minimumApplied && (
                <div style={{ fontSize: '11px', color: T.yellow, marginTop: 8, lineHeight: 1.4 }}>
                  £200/month minimum applied (you'd be at £{rawMonthly} otherwise, kept fair both ways).
                </div>
              )}
            </div>
            <Link to="/contact" style={{
              display: 'block', textAlign: 'center', marginTop: 20,
              padding: 12,
              background: T.accent, color: T.white,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '14px',
              textDecoration: 'none',
            }}>Get a precise quote →</Link>
            <div style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.25)',
              textAlign: 'center', marginTop: 10,
            }}>No commitment. Exact price confirmed on a 20-min call.</div>
          </div>
        </div>
      </section>

      {/* LIVE STAT STRIP */}
      <section style={{ background: T.primary, padding: '20px 32px' }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 16,
        }}>
          {[
            { n: liveResponse, l: 'Avg response time' },
            { n: liveCallWait, l: 'Avg call wait' },
            { n: 'Reviews',    l: 'Customer feedback' },
            { n: 'Since 2014', l: 'Established Ludlow' },
          ].map(({ n, l }, i) => (
            <div key={i} style={{
              borderRight: (!isMobile && i < 3) ? '1px solid rgba(255,255,255,0.2)' : undefined,
              paddingRight: 16,
            }}>
              <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '22px', color: T.white, lineHeight: 1 }}>{n}</div>
              <div style={{
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: '10px',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginTop: 4,
              }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TIERS */}
      <section id="tiers" style={{ background: T.paper, padding: '80px 32px' }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <Eyebrow>The plans</Eyebrow>
            <DisplayHead size={40} style={{ marginBottom: 12 }}>Choose your level of cover</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: '16px', margin: 0, maxWidth: '56ch', lineHeight: 1.6 }}>
              All three include remote support from the same named engineers. Onsite visits are billed separately when an issue cannot be fixed remotely. These packages apply to new contracts; existing customers keep the cover in their signed agreement.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr',
            gap: 20,
            alignItems: 'stretch',
          }}>
            {TIERS.map(tier => <TierCard key={tier.name} tier={tier} isMobile={isMobile} />)}
          </div>
          <div style={{
            marginTop: 24,
            padding: '16px 20px',
            background: T.paperDeep,
            border: `1px solid ${T.hairline}`,
            fontSize: '14px', color: 'rgba(15,25,35,0.62)',
            display: 'flex', gap: 16, alignItems: 'flex-start',
          }}>
            <div style={{ flexShrink: 0, fontSize: '18px' }}>📋</div>
            <div>
              <strong style={{ color: T.ink }}>Projects quoted separately.</strong> Office moves, server migrations, large infrastructure upgrades: always a fixed price before we start. No surprise invoices.
            </div>
          </div>
        </div>
      </section>

      {/* UNIVERSAL INCLUSIONS BAND — sits on every tier, not repeated per card */}
      <section style={{
        background: T.paperDeep, padding: '80px 32px',
        borderTop: `1px solid ${T.hairline}`,
        borderBottom: `1px solid ${T.hairline}`,
      }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>Included on every plan</Eyebrow>
            <DisplayHead size={40} style={{ marginBottom: 12 }}>The foundation. On all three tiers.</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: '16px', margin: 0, maxWidth: '56ch', lineHeight: 1.6 }}>
              These aren't optional add-ons. They're the floor: what every client gets on Standard, Plus, and Premium. Most national IT providers charge separately for at least four of these.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(2, 1fr)',
            gap: 16,
          }}>
            {UNIVERSAL_INCLUSIONS.map(({ title, desc }, i) => (
              <div key={i} style={{
                background: T.white,
                border: `1px solid ${T.hairline}`,
                padding: '20px 22px',
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <div style={{ flexShrink: 0, paddingTop: 2 }}><Tick col={T.green} /></div>
                <div>
                  <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '15px', color: T.ink, marginBottom: 6, lineHeight: 1.2 }}>{title}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(15,25,35,0.65)', lineHeight: 1.55 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UNIVERSAL SLA — priority-driven, identical across all three tiers */}
      <section style={{ background: T.paper, padding: '80px 32px' }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <Eyebrow>How fast we respond</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 12 }}>Same SLA on every plan</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: '15px', margin: 0, maxWidth: '60ch', lineHeight: 1.6 }}>
              Response and resolution targets are <strong>identical</strong> on Standard, Plus, and Premium. What Premium buys you is <em>queue position within the same priority</em>: first-touch privilege, not faster SLA. We think that's the honest way to sell it.
            </p>
          </div>
          <div style={{
            background: T.white,
            border: `2px solid ${T.ink}`,
            boxShadow: `4px 4px 0 0 ${T.ink}`,
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '60px 1fr 1fr' : '80px 1fr 1fr 1fr',
              background: T.ink,
              padding: '14px 20px',
              gap: 12,
            }}>
              <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Priority</div>
              {!isMobile && <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Type</div>}
              <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: T.yellow, fontWeight: 700 }}>Response</div>
              <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: T.yellow, fontWeight: 700 }}>Resolution</div>
            </div>
            {SLA_ROWS.map((row, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '60px 1fr 1fr' : '80px 1fr 1fr 1fr',
                gap: 12,
                padding: '16px 20px',
                background: i % 2 === 0 ? T.white : T.paper,
                borderBottom: i < SLA_ROWS.length - 1 ? `1px solid ${T.hairline}` : 'none',
                alignItems: 'center',
              }}>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '18px', color: T.primary }}>{row.priority}</div>
                {!isMobile && <div style={{ fontSize: '14px', color: T.ink, fontWeight: 600 }}>{row.type}</div>}
                <div style={{ fontSize: '14px', color: T.ink }}>{isMobile && <span style={{ fontWeight: 600 }}>{row.type}: </span>}{row.response}</div>
                <div style={{ fontSize: '14px', color: 'rgba(15,25,35,0.65)' }}>{row.resolution}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OFF-TIER + M365 + DOMAIN RENEWAL TRUST BLOCK */}
      <section style={{ background: T.paperDeep, padding: '72px 32px', borderTop: `1px solid ${T.hairline}` }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 32,
        }}>
          <div style={{
            background: T.white, border: `2px solid ${T.ink}`, padding: 28,
            boxShadow: `4px 4px 0 0 ${T.ink}`,
          }}>
            <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: T.primary, fontWeight: 700, marginBottom: 10 }}>Off-tier · Lite</div>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '20px', color: T.ink, marginBottom: 8, lineHeight: 1.2 }}>£10/user/month: cloud account only</div>
            <p style={{ fontSize: '14px', color: 'rgba(15,25,35,0.65)', lineHeight: 1.65, margin: '0 0 8px' }}>
              For users who only need Microsoft 365 admin (provisioning, password resets, MFA, mailboxes, distribution lists, Teams/SharePoint membership): no device, app or onsite support.
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(15,25,35,0.55)', lineHeight: 1.6, margin: 0 }}>
              Includes Huntress identity threat detection. Best for board members, contractors, or occasional users on an otherwise managed account.
            </p>
          </div>

          <div style={{
            background: T.white, border: `2px solid ${T.ink}`, padding: 28,
            boxShadow: `4px 4px 0 0 ${T.ink}`,
          }}>
            <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: T.primary, fontWeight: 700, marginBottom: 10 }}>Microsoft 365 licences</div>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '20px', color: T.ink, marginBottom: 8, lineHeight: 1.2 }}>Sold separately. No markup.</div>
            <p style={{ fontSize: '14px', color: 'rgba(15,25,35,0.65)', lineHeight: 1.65, margin: '0 0 8px' }}>
              M365 licences are invoiced separately at standard Microsoft rates. We resell them as a Microsoft Cloud Solution Provider (CSP): no markup, no resale margin.
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(15,25,35,0.55)', lineHeight: 1.6, margin: 0 }}>
              You see exactly what Microsoft charges, on your bill. Need a Premium vs Standard sanity-check? See our <Link to="/microsoft-business-premium" style={{ color: T.primary, fontWeight: 600 }}>Business Premium comparison</Link>.
            </p>
          </div>
        </div>

        <div style={{
          maxWidth: useContentMax(1100), margin: '32px auto 0',
          background: T.ink, color: T.white, padding: 32,
          ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
        }}>
          <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: T.yellow, fontWeight: 700, marginBottom: 10 }}>Why we absorb your domain renewal</div>
          <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '22px', color: T.white, marginBottom: 12, lineHeight: 1.2 }}>Saves you money. Keeps your email safe. One less admin task.</div>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: '0 0 12px', maxWidth: '72ch' }}>
            Most clients pay £25–40/year through retail registrars like GoDaddy or 123-reg for a domain that costs us £8–12 wholesale. Including standard renewals in your plan saves you that money, gives us proper DNS control to keep your email secure, and means you've got one less annual admin task to remember.
          </p>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0, maxWidth: '72ch' }}>
            Premium TLDs (.io, .ai, .agency, .london) and short/aftermarket domains are billed at cost: no markup, no surprises. <strong style={{ color: T.white }}>Your domain stays registered in your name.</strong> If you ever leave, it goes with you.
          </p>
        </div>
      </section>

      {/* ROI STRIP */}
      <section style={{ background: T.paper, padding: '80px 32px' }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>The numbers</Eyebrow>
            <DisplayHead size={40} style={{ marginBottom: 12 }}>Compare the real cost</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: '16px', margin: 0, maxWidth: '52ch', lineHeight: 1.6 }}>
              Most businesses compare us to other IT companies. The sharper comparison is against the alternatives.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1.2fr',
            gap: 2,
            background: T.hairline,
          }}>
            {[
              { label: 'In-house IT person',    price: '£45k+',    unit: 'per year',         note: 'Salary, NI, pension, training, sick cover',  light: false, priceColor: T.red },
              { label: 'Break-fix IT support',  price: '£80–150',  unit: 'per hour',         note: 'Unpredictable. No monitoring. Slow.',         light: false, priceColor: T.red },
              { label: 'Fresh Tech managed',    price: '£40–90',   unit: 'per user/month',   note: 'A whole team of engineers. Every protection included.', light: true,  priceColor: T.yellow },
            ].map((it, i) => (
              <div key={i} style={{
                background: it.light ? T.ink : T.paperDeep,
                padding: '36px 32px',
                ...(it.light ? halftoneCss('rgba(255,255,255,0.04)', 1.4, 12) : halftoneCss('rgba(15,25,35,0.06)', 1.4, 12)),
              }}>
                <div style={{
                  fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  fontWeight: 700,
                  color: it.light ? 'rgba(255,255,255,0.5)' : 'rgba(15,25,35,0.38)',
                  marginBottom: 12,
                }}>{it.label}</div>
                <div style={{
                  fontFamily: "'Bungee', sans-serif", fontSize: '44px',
                  lineHeight: 1, color: it.priceColor, marginBottom: 4,
                }}>{it.price}</div>
                <div style={{
                  fontSize: '13px',
                  color: it.light ? 'rgba(255,255,255,0.4)' : 'rgba(15,25,35,0.62)',
                  marginBottom: 16,
                }}>{it.unit}</div>
                <div style={{
                  fontSize: '14px',
                  color: it.light ? 'rgba(255,255,255,0.7)' : 'rgba(15,25,35,0.62)',
                  lineHeight: 1.5,
                }}>{it.note}</div>
                {it.light && (
                  <div style={{
                    marginTop: 20,
                    background: T.green, color: T.white,
                    padding: '8px 16px',
                    fontSize: '13px', fontWeight: 700,
                    display: 'inline-block',
                  }}>Best value</div>
                )}
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 24,
            background: T.ink, color: T.white,
            padding: '28px 32px',
            display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <div>
              <div style={{
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px',
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 6,
              }}>20-user business example</div>
              <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                In-house IT: <strong style={{ color: T.white }}>£45,000+/year</strong>
                {' · '}Fresh Tech Plus (20 users × £60): <strong style={{ color: T.yellow }}>£14,400/year</strong>
                {' · '}Saving: <strong style={{ color: T.green }}>£30,600/year</strong>
              </div>
            </div>
            <Link to="/contact" style={{
              flexShrink: 0,
              padding: '13px 22px',
              background: T.accent, color: T.white,
              border: `2px solid ${T.white}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '14px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}>Get your estimate →</Link>
          </div>
        </div>
      </section>

      {/* OBJECTIONS */}
      <section style={{ background: T.white, padding: '72px 32px', borderTop: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>Before you decide</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 8 }}>The three blockers. Addressed.</DisplayHead>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 20,
          }}>
            {OBJECTIONS.map(({ q, a }, i) => (
              <div key={i} style={{
                border: `1px solid ${T.hairline}`,
                padding: 28,
                background: T.paper,
                boxShadow: '0 4px 16px rgba(15,25,35,0.06)',
              }}>
                <div style={{
                  fontFamily: "'Bungee', sans-serif", fontSize: '15px',
                  color: T.ink, marginBottom: 12, lineHeight: 1.3,
                }}>{q}</div>
                <div style={{ fontSize: '14px', color: 'rgba(15,25,35,0.62)', lineHeight: 1.65 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FREE REVIEW CTA */}
      <section style={{ background: T.paperDeep, padding: '72px 32px', borderTop: `1px solid ${T.hairline}` }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
          gap: isMobile ? 24 : 48,
          alignItems: 'center',
        }}>
          <div>
            <Eyebrow>Free service</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 12 }}>Not sure what you're paying for?</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: '17px', lineHeight: 1.65, margin: '0 0 8px', maxWidth: '52ch' }}>
              Send us your current IT invoice. We'll give you an honest breakdown of what you're paying for, what's missing, and what a fair price looks like.
              {' '}<strong style={{ color: T.ink }}>even if we're not the right option.</strong>
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(15,25,35,0.38)', margin: 0 }}>
              PDF invoices only · Handled securely · No sales calls · Genuinely no obligation
            </p>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <Link to="/contact?ref=spend-review" style={{
              display: 'block',
              padding: '16px 28px',
              background: T.accent, color: T.white,
              border: `2px solid ${T.ink}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '16px',
              textDecoration: 'none',
              boxShadow: `4px 4px 0 0 ${T.ink}`,
              whiteSpace: 'nowrap',
              marginBottom: 12,
            }}>Request a free review →</Link>
            <div style={{ fontSize: '12px', color: 'rgba(15,25,35,0.38)' }}>Usually takes us 24 hours</div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{
        background: T.ink, padding: '72px 32px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>Ready?</Eyebrow>
          <DisplayHead size={44} light style={{ marginBottom: 16 }}>20 minutes. That's all it takes.</DisplayHead>
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: '17px', lineHeight: 1.65,
            margin: '0 auto 32px', maxWidth: '44ch',
          }}>
            Tell us your setup. We'll give you an exact price and tell you honestly whether we're a fit.
          </p>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 32px',
            background: T.accent, color: T.white,
            border: `2px solid ${T.white}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '16px',
            textDecoration: 'none',
            boxShadow: `5px 5px 0 0 ${T.yellow}`,
          }}>Book a 20-min call →</Link>
          <div style={{ marginTop: 16, fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
            Mon–Fri, 9am–5pm · {BRAND.phone} · hello@fresh-tech.uk
          </div>
        </div>
        <LastReviewed light />
      </section>
    </>
  );
};

export default PricingPageV2;
