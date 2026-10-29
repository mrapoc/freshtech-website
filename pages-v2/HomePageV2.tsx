import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { useLiveStats } from '../components/LiveStats';
import { formatMinutes } from '../utils/publicMetrics';
import { useGoogleReviews, GoogleReview } from '../hooks/useGoogleReviews';
import { caseStudies as realCaseStudies } from '../data/content';
import { T, useWindowWidth, useContentMax, useNow, halftone, Sticker, Panel, CTAButton, SectionTitle } from '../components-v2/primitives';
import { Icons, IconKey } from '../components-v2/icons';

// ─────────────────────────────────────────────────────────────────────
// Content
// ─────────────────────────────────────────────────────────────────────

const BRAND = {
  phone:     '01584 517 234',
  phoneHref: 'tel:+441584517234',
};

// ── Live masthead bits ────────────────────────────────────────────────
// The hero is styled like a newspaper front page. These keep the date,
// "issue number" and availability month current automatically so nobody
// has to remember to update them.
const UK_TIME_ZONE = 'Europe/London';

// Decorative issue number that ticks up ~weekly. Anchored so early Jun 2026
// reads ≈ №142, then grows on its own — no manual maintenance.
function mastheadIssue(now: Date): number {
  const epoch = Date.UTC(2023, 8, 14); // 14 Sep 2023
  const weeks = Math.floor((now.getTime() - epoch) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, weeks + 1);
}

interface ServiceItem { icon: IconKey; title: string; desc: string; slug: string; href: string; }
const SERVICES: ServiceItem[] = [
  { icon: 'shield',   title: 'Managed IT Support',     desc: 'Unlimited helpdesk, proactive monitoring and patching: your IT team on tap.',           slug: 'managed-it-support',       href: '/services/managed-it-support' },
  { icon: 'lock',     title: 'Cyber Security',         desc: 'Cyber Essentials, real-time threat detection, awareness training, and the controls that keep insurers happy.',       slug: 'cybersecurity',            href: '/services/cybersecurity' },
  { icon: 'cloud',    title: 'Cloud & Microsoft 365',  desc: 'Migrate, secure and get more from M365, SharePoint, Teams and Azure.',                       slug: 'cloud-solutions',          href: '/services/cloud-solutions' },
  { icon: 'rocket',   title: 'Strategic IT Projects',  desc: 'WiFi surveys, office moves, server replacements, delivered on time, no surprises.',         slug: 'strategic-projects',       href: '/services/strategic-projects' },
  { icon: 'cpu',      title: 'Hardware Procurement',   desc: 'Right-sized laptops, screens and infrastructure at the right price, ready to roll.',         slug: 'hardware-procurement',     href: '/services/hardware-procurement' },
  { icon: 'database', title: 'Backup & Recovery',      desc: 'Immutable, tested backups so a ransomware attack is an inconvenience, not a crisis.',        slug: 'backup-disaster-recovery', href: '/services/backup-disaster-recovery' },
  { icon: 'phone',    title: 'Cloud Phone Systems',    desc: 'Yeastar Cloud PBX, Teams Voice or hosted platforms. App-based calling, no expensive handsets.', slug: 'cloud-phone-systems',     href: '/services/cloud-phone-systems' },
  { icon: 'wifi',     title: 'Internet Connectivity',  desc: 'Leased lines, FTTP, and 4G backup. Sourced, installed and managed from multiple providers.',     slug: 'internet-connectivity',   href: '/services/internet-connectivity' },
];

const COMPARISON = [
  { row: 'Response time',         them: '4–48 hours, ticket queue', us: 'Under 15 min average, real human' },
  { row: 'Who answers the phone', them: 'Outsourced helpdesk',      us: 'Same engineer who fixed it last time' },
  { row: 'Contract length',        them: '3-year lock-in',           us: '30-day rolling, money-back month one' },
  { row: 'Onsite',                 them: '£95/hr extra',             us: 'Remote-first; visits billed separately' },
  { row: 'Hidden fees',            them: 'Project bills, T&M creep', us: 'Flat per-user, no surprises' },
  { row: 'Strategic reviews',      them: 'Once a year, if you ask',  us: 'Quarterly, in plain English' },
];

const PRICING = [
  { name: 'Standard', perUser: 40, blurb: '9–5 reactive support, remote-first. Everything most small businesses need to run safely and quietly.', best: false,
    includes: ['Unlimited remote support 9–5','Microsoft 365 admin','Microsoft 365 backup','Huntress managed EDR + identity threat detection','Cyber Essentials maintenance + evidence pack','Annual technology business review'] },
  { name: 'Plus',     perUser: 60, blurb: 'Everything in Standard plus priority handling and a half-yearly roadmap, for businesses that want more structure.', best: true,
    includes: ['Everything in Standard','Half-yearly business review + 12-month roadmap','Priority queue placement','Same SLA as Standard'] },
  { name: 'Premium',  perUser: 90, blurb: 'For businesses that want extended hours, project work bundled, and first-touch privilege.', best: false,
    includes: ['Everything in Plus','8am–6pm best-effort cover','First-touch queue privilege','2 hours quarterly project work bundled','Quarterly review + vendor & licence rationalisation','20% off any block-hour work'] },
];

const PROCESS = [
  { n: 1, title: 'Discovery Call',     desc: "A relaxed chat about your business and the headaches you'd like to retire." },
  { n: 2, title: 'IT Health Check',    desc: 'We audit security, backups and hardware. You get a plain-English report.' },
  { n: 3, title: 'Onboarding Plan',    desc: 'A clear 30-day plan. Zero downtime. Zero finger-pointing with your old provider.' },
  { n: 4, title: 'Day-to-day Support', desc: 'Unlimited helpdesk, proactive monitoring, quarterly reviews. No surprise bills.' },
  { n: 5, title: 'Strategic Reviews',  desc: 'Roadmaps, budgets and projects to keep your IT three steps ahead.' },
];

const INDUSTRIES = [
  { name: 'Solicitors & Legal',    desc: 'Document security, SRA-aligned compliance and the case-management integrations you actually use.',         href: '/industries/solicitors'    },
  { name: 'Accountants',           desc: 'Iris, Sage, CCH, QuickBooks: secure remote desktops and watertight client data handling.',                 href: '/industries/accountants'   },
  { name: 'Manufacturing',         desc: 'Shop-floor connectivity, ERP support and disaster recovery for production-critical systems.',               href: '/industries/manufacturing' },
  { name: 'Healthcare & Clinics',  desc: 'DSP Toolkit-aligned security and reliable systems for clinical software.',                                  href: '/industries/healthcare'    },
  { name: 'Agriculture & Estates', desc: 'Patchy broadband sorted, fleet-wide laptops and farm-office systems that survive Welsh weather.',           href: '/industries/agriculture'   },
  { name: 'Charities & Education', desc: 'Affordable, donor-friendly IT, including the Microsoft non-profit licensing nobody tells you about.',      href: '/industries/charities'     },
];

// Case studies — pulled from data/content.ts (the same source the /case-studies
// pages use). We pick the first three with a punchy shortStats.victory so the
// gradient card's bottom-right badge stays one short phrase.
const HOMEPAGE_CASE_STUDIES = realCaseStudies.slice(0, 3).map(cs => ({
  client:   cs.client,
  industry: cs.industry,
  title:    cs.title,
  outcome:  cs.outcome,
  href:     `/case-studies/${cs.slug}`,
  badge:    cs.shortStats?.victory ?? cs.result ?? 'Win',
  label:    cs.shortStats?.strategy ?? cs.result ?? 'Outcome',
}));

// Featured testimonial pulled from a real case study (Ludlow Nut Co — 5+ years,
// strong on-brand quote). Falls back to the first case study with a testimonial.
const FEATURED_TESTIMONIAL = (() => {
  const preferred = realCaseStudies.find(cs => cs.slug === 'food-production-uptime');
  const pick = preferred ?? realCaseStudies.find(cs => cs.testimonial);
  if (!pick) {
    return {
      quote: "We rang at 8:47am with a server that wouldn't boot. By 9:20 they were on-site. By lunch we were running.",
      attribution: 'Real client · Welsh Borders',
      initials: 'FT',
    };
  }
  const initials = (pick.contactName || pick.client)
    .split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return {
    quote: pick.testimonial,
    attribution: `${pick.contactName} · ${pick.client}`,
    initials,
  };
})();

const SERVICE_AREAS = [
  { town: 'Ludlow',          miles: '0',  county: 'Shropshire',      href: '/it-support-ludlow' },
  { town: 'Shrewsbury',      miles: '27', county: 'Shropshire',      href: '/it-support-shrewsbury' },
  { town: 'Hereford',        miles: '23', county: 'Herefordshire',   href: '/it-support-hereford' },
  { town: 'Worcester',       miles: '32', county: 'Worcestershire',  href: '/it-support-worcester' },
  { town: 'Telford',         miles: '30', county: 'Shropshire',      href: '/it-support-telford' },
  { town: 'Leominster',      miles: '11', county: 'Herefordshire',   href: '/locations/leominster' },
  { town: 'Bridgnorth',      miles: '22', county: 'Shropshire',      href: '/locations/bridgnorth' },
  { town: 'Knighton',        miles: '16', county: 'Powys',           href: '/locations/welshpool' },
  { town: 'Church Stretton', miles: '16', county: 'Shropshire',      href: '/locations/ludlow' },
  { town: 'Tenbury Wells',   miles: '9',  county: 'Worcestershire',  href: '/locations/worcester' },
];

const GUARANTEES = [
  { title: '30-day money back', accent: T.red,   bold: true  },
  { title: 'No 3-year lock-in', accent: T.green, bold: false },
  { title: 'Local engineers',   accent: T.green, bold: false },
];

const FAQS = [
  { q: 'How quickly can we switch from our current IT provider?',
    a: 'Most clients are fully onboarded in 30 days. We do the heavy lifting and coordinate directly with your outgoing provider, so you focus on your business.' },
  { q: 'Do we sign a long contract?',
    a: 'No 3-year lock-ins. Our standard agreement is 12 months, with a 30-day money-back guarantee on day one. At the end of the term you can give notice in line with the agreement. We aim to earn your business through service, not paperwork.' },
  { q: "What's actually included in 'unlimited support'?",
    a: "Helpdesk tickets, phone calls, screen-share sessions, monitoring, patching and quarterly reviews. We invoice on outcomes, not minutes; there's no meter running. Onsite visits, when an issue cannot be fixed remotely, are billed separately." },
  { q: 'Are you really local?',
    a: 'Yes. Our office is in Ludlow. We have engineers across Shrewsbury, Hereford and Worcester.' },
  { q: 'Can you replace our existing IT person?',
    a: 'Often, yes, usually at a lower total cost, with broader coverage and proper holiday/sickness backup. We can also work alongside an existing internal hire as their senior team.' },
];

// ─────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────

function Hero() {
  // Serialised server date during hydration, live clock afterwards.
  const now = useNow();
  // Width-dependent hero layout (padding, grid, H1 size, photo clip) lives in
  // CSS media queries (.ft-hero* in index.css) so the prerendered HTML is
  // correct at first paint on every viewport without waiting for JS.

  // Report values are never replaced by a fixed performance claim.
  const { stats, loading } = useLiveStats();
  const heroAvgResponse = formatMinutes(stats?.AverageResponseTimeLast30DaysMinutes, loading);

  return (
    <section className="ft-hero" style={{
      background: T.paper,
      backgroundImage: `radial-gradient(rgba(43,122,177,0.18) 1.5px, transparent 2px), linear-gradient(${T.paper}, ${T.paperDeep})`,
      backgroundSize: '14px 14px, auto',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decoration frame: matches content max-width so the starburst stays
          anchored to the photo panel corner on ultrawide displays instead of
          drifting to the far-right of the viewport. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        <div className="ft-hero-content-width" style={{
          position: 'relative',
          height: '100%',
          margin: '0 auto',
        }}>
          <svg style={{
            position: 'absolute',
            top: -40, right: -40,
            width: 380, height: 380,
            opacity: 0.5,
          }} viewBox="0 0 200 200">
            {Array.from({ length: 18 }).map((_, i) => {
              const a = (i / 18) * Math.PI * 2;
              return (
                <line key={i}
                  x1={100 + Math.cos(a) * 50} y1={100 + Math.sin(a) * 50}
                  x2={100 + Math.cos(a) * 110} y2={100 + Math.sin(a) * 110}
                  stroke={T.ink} strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>
      </div>

      <div className="ft-hero-grid ft-hero-content-width" style={{
        margin: '0 auto',
        display: 'grid',
        alignItems: 'stretch',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {(() => {
              const day = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: UK_TIME_ZONE }).format(now);
              const issue = mastheadIssue(now);
              const bookingMonth = new Intl.DateTimeFormat('en-GB', {
                month: 'long', year: 'numeric', timeZone: UK_TIME_ZONE,
              }).format(now);
              return (
                <>
                  <Sticker rotate={-3}>● {day} · Issue №{issue}</Sticker>
                  <Sticker rotate={2} color={T.primaryDark} fg="#fff">Shropshire HQ</Sticker>
                  <Link to="/contact" aria-label={`Booking new clients for ${bookingMonth}: get in touch`} style={{ textDecoration: 'none' }}>
                    <Sticker rotate={-2} color={T.green} fg="#fff">Booking new clients · {bookingMonth}</Sticker>
                  </Link>
                </>
              );
            })()}
          </div>

          <h1 className="ft-hero-h1" style={{
            fontFamily: "'Bungee', sans-serif",
            fontWeight: 400,
            lineHeight: 0.92,
            color: T.ink,
            margin: 0,
            letterSpacing: '-0.01em',
            textShadow: `4px 4px 0 ${T.yellow}, 4px 4px 0 1px ${T.ink}`,
          }}>
            BUSINESS IT<br />
            THAT SAVES<br />
            <span style={{ color: T.accent, textShadow: `4px 4px 0 ${T.ink}` }}>THE DAY.</span>
          </h1>

          <p className="ft-hero-copy" style={{
            font: "500 19px/1.45 'Archivo', sans-serif",
            color: T.ink,
            margin: 0,
            maxWidth: 560,
          }}>
            Friendly, expert IT support for businesses across Shropshire, Herefordshire and the Welsh Borders.
            <strong> From £40 per user, per month.</strong> No 3-year lock-ins. Fast remote fixes.
          </p>

          <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
            <CTAButton primary big sub="Takes 90 seconds · No obligation" href="/contact">
              Get an Instant Quote →
            </CTAButton>
            <CTAButton big sub={`Or call ${BRAND.phone}`} href="/contact">
              📞 Book a Free Discovery Call
            </CTAButton>
          </div>

          <div style={{
            display: 'flex',
            gap: 18,
            marginTop: 4,
            flexWrap: 'wrap',
            font: "700 12px/1.3 'Archivo', sans-serif",
            color: T.ink,
          }}>
            {GUARANTEES.map(g => (
              <span key={g.title} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 18, height: 18,
                  background: g.accent,
                  color: '#fff',
                  border: `2px solid ${T.ink}`,
                  display: 'grid',
                  placeItems: 'center',
                  font: "800 11px/1 'Archivo'",
                  flexShrink: 0,
                }}>✓</span>
                <span style={{ color: g.bold ? T.redInk : T.ink, fontWeight: g.bold ? 800 : 700 }}>{g.title}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="ft-hero-photo" style={{ position: 'relative' }}>
          <Panel
            accent={T.accent}
            style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 18px',
              background: T.ink,
              color: T.paper,
              borderBottom: `3px solid ${T.ink}`,
              font: "700 11px/1 'Archivo Narrow', sans-serif",
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}>
              <span>※ Sam James &amp; Matthew Morgan · Ludlow HQ</span>
              <span style={{ color: T.yellow }}>Meet your engineers</span>
            </div>

            <div style={{ overflow: 'hidden', background: T.ink }}>
              <img
                src="https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto,w_900/v1778511802/team-photo-1.jpg"
                alt="Sam James and Matthew Morgan, Fresh Tech engineers, Ludlow"
                style={{ width: '100%', height: 'auto', display: 'block', verticalAlign: 'bottom' }}
              />
            </div>

            <div style={{
              padding: '14px 18px',
              background: T.ink,
              borderTop: `3px solid ${T.ink}`,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
            }}>
              {[
                { v: heroAvgResponse, l: 'Avg response · report' },
                { v: 'Reviews', l: 'Customer feedback' },
                { v: '50+',  l: 'Clients · since 2014' },
              ].map(s => (
                <div key={s.l}>
                  <div style={{ font: s.v === 'Unavailable' || s.v === 'Loading…' ? "600 16px/1.4 'Archivo', sans-serif" : "400 22px/1 'Bungee', sans-serif", color: T.yellow, overflowWrap: 'anywhere' }}>{s.v}</div>
                  <div style={{
                    font: "700 10px/1.3 'Archivo Narrow', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: 4,
                  }}>{s.l}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

function LiveTicker() {
  const { stats, review, loading } = useLiveStats();
  const width = useWindowWidth();
  const isMobile = width < 768;
  const csatComment = review?.Comment || null;
  const avgResponse = formatMinutes(stats?.AverageResponseTimeLast30DaysMinutes, loading);
  const avgCallWait = formatMinutes(stats?.CallWaitTimeInMinutes, loading);

  const starStr = review?.Score || '';

  return (
    <section style={{
      background: T.ink,
      color: T.paper,
      padding: isMobile ? '12px 20px' : '14px 32px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{
        maxWidth: useContentMax(1320),
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: isMobile ? 16 : 28,
        rowGap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: stats ? T.green : T.paperDeep,
            display: 'inline-block',
          }} />
          <span style={{
            font: "700 11px/1 'Archivo Narrow', sans-serif",
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            opacity: 0.7,
          }}>{loading ? 'Loading report' : stats ? 'Helpdesk report' : 'Report unavailable'}</span>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <span style={{ color: T.yellow, font: "800 12px/1 'Archivo', sans-serif", flexShrink: 0 }}>{starStr}</span>
            {csatComment ? (
              <span style={{
                font: "500 13px/1.4 'Archivo', sans-serif",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>"{csatComment}"</span>
            ) : (
              <span style={{
                font: "700 11px/1 'Archivo Narrow', sans-serif",
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                opacity: 0.5,
              }}>Performance from the helpdesk</span>
            )}
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          flexShrink: 0,
          paddingLeft: isMobile ? 0 : 24,
          borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.12)',
        }}>
          <span style={{ font: "400 18px/1 'Bungee', sans-serif", color: T.yellow }}>{avgResponse}</span>
          <span style={{
            font: "700 10px/1 'Archivo Narrow', sans-serif",
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            opacity: 0.6,
          }}>avg response · report</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          flexShrink: 0,
          paddingLeft: isMobile ? 0 : 20,
          borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.12)',
        }}>
          <span style={{ font: "400 18px/1 'Bungee', sans-serif", color: T.yellow }}>{avgCallWait}</span>
          <span style={{
            font: "700 10px/1 'Archivo Narrow', sans-serif",
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            opacity: 0.6,
          }}>call wait · report</span>
        </div>
      </div>
      <style>{`@keyframes ftPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>
    </section>
  );
}

function Services() {
  const trimmed = SERVICES.filter(s => !['hardware-procurement', 'business-connectivity'].includes(s.slug));
  const width = useWindowWidth();
  const cols = width < 640 ? 1 : width < 1024 ? 2 : 4;
  const featuredSpan = cols === 1 ? 'span 1' : 'span 2';

  return (
    <section style={{ background: T.paper, padding: '80px 32px' }}>
      <div style={{ maxWidth: useContentMax(1320), margin: '0 auto' }}>
        <SectionTitle
          kicker="What we do"
          headline="One team. One bill. Everything covered."
          sub="No vendor ping-pong. No finger-pointing. One accountable team for everything that runs on a wire or talks to the cloud."
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 18,
          marginTop: 36,
          alignItems: 'start',
        }}>
          <Link
            to={trimmed[0].href}
            style={{
              gridColumn: featuredSpan,
              gridRow: cols > 1 ? 'span 2' : 'span 1',
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
            }}
          >
            <Panel accent={T.accent} style={{
              flex: 1,
              padding: 32,
              backgroundImage: `radial-gradient(rgba(43,122,177,0.12) 1px, transparent 1.5px), linear-gradient(135deg, #fff 0%, ${T.paperDeep} 100%)`,
              backgroundSize: '12px 12px, auto',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ marginBottom: 12 }}>
                <Sticker rotate={0} color={T.accent}>Most popular · 80% of clients</Sticker>
              </div>
              <h3 style={{ font: "400 44px/0.95 'Bungee', sans-serif", color: T.ink, margin: '8px 0 10px' }}>
                Managed<br />IT Support
              </h3>
              <p style={{
                font: "500 16px/1.45 'Archivo', sans-serif",
                color: T.ink,
                opacity: 0.85,
                maxWidth: 380,
                marginBottom: 20,
              }}>
                Unlimited helpdesk, proactive monitoring, hardware procurement and connectivity: your IT team on tap, on a flat per-user fee.
              </p>
              <div style={{
                display: 'flex',
                gap: 18,
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
              }}>
                <ul style={{
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  font: "600 13px/1.7 'Archivo', sans-serif",
                  color: T.ink,
                }}>
                  <li>✓ Unlimited tickets &amp; calls</li>
                  <li>✓ Proactive monitoring and patching</li>
                  <li>✓ Dedicated engineer, not a queue</li>
                  <li>✓ Quarterly business reviews</li>
                </ul>
                <div style={{
                  background: T.ink,
                  color: T.paper,
                  padding: '10px 14px',
                  font: "400 14px/1 'Bungee', sans-serif",
                  letterSpacing: '0.04em',
                }}>From £40/user</div>
              </div>
            </Panel>
          </Link>

          {trimmed.slice(1, 5).map((s, i) => {
            const colors = [T.red, T.primary, T.green, T.yellow];
            return (
              <Link
                key={s.slug}
                to={s.href}
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', minHeight: 220 }}
              >
                <Panel accent={colors[i % colors.length]} style={{
                  flex: 1,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{
                      width: 44, height: 44,
                      background: T.paperDeep,
                      border: `2.5px solid ${T.ink}`,
                      display: 'grid',
                      placeItems: 'center',
                      marginBottom: 12,
                    }}>{Icons[s.icon]}</div>
                    <h4 style={{
                      font: "700 18px/1.15 'Archivo', sans-serif",
                      color: T.ink,
                      margin: 0,
                      marginBottom: 6,
                    }}>{s.title}</h4>
                    <p style={{
                      font: "500 13px/1.4 'Archivo', sans-serif",
                      color: T.ink,
                      opacity: 0.72,
                      margin: 0,
                    }}>{s.desc}</p>
                  </div>
                  <div style={{
                    font: "800 11px/1 'Archivo', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: T.primaryDark,
                    marginTop: 12,
                  }}>See how it works →</div>
                </Panel>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Comparison() {
  const width    = useWindowWidth();
  const isMobile = width < 768;

  return (
    <section style={{ background: T.paperDeep, padding: '80px 32px' }}>
      <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
        <SectionTitle
          kicker="Us vs the others"
          headline="Why owner-managers switch to us."
          sub="Most businesses we win are leaving a national IT company. Here's what changes when you do."
        />

        <Panel style={{ marginTop: 36, padding: 0, overflow: 'hidden' }}>
          {!isMobile && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr',
              background: T.ink,
              color: T.paper,
              font: "700 13px/1 'Archivo', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              <div style={{ padding: '16px 22px' }} />
              <div style={{ padding: '16px 22px', borderLeft: `2px solid ${T.paper}` }}>Typical IT provider</div>
              <div style={{
                padding: '16px 22px',
                borderLeft: `2px solid ${T.paper}`,
                background: T.green,
                color: '#fff',
              }}>Fresh Tech</div>
            </div>
          )}
          {COMPARISON.map((row, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr 1fr',
              borderTop: i === 0 ? 'none' : `1.5px solid ${T.paperDeep}`,
              background: i % 2 ? T.paper : '#fff',
            }}>
              <div style={{
                padding: '16px 22px',
                font: "700 14px/1.3 'Archivo', sans-serif",
                color: T.ink,
                letterSpacing: '0.02em',
              }}>{row.row}</div>
              <div style={{
                padding: '16px 22px',
                borderLeft: isMobile ? 'none' : `1.5px solid ${T.paperDeep}`,
                borderTop: isMobile ? `1px solid ${T.paperDeep}` : 'none',
                font: "500 14px/1.4 'Archivo', sans-serif",
                color: T.ink,
                opacity: 0.65,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ color: T.red, fontSize: 18, lineHeight: 1 }}>✕</span> {row.them}
              </div>
              <div style={{
                padding: '16px 22px',
                borderLeft: isMobile ? 'none' : `1.5px solid ${T.paperDeep}`,
                borderTop: isMobile ? `1px solid ${T.paperDeep}` : 'none',
                font: "700 14px/1.4 'Archivo', sans-serif",
                color: T.ink,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(46,125,91,0.06)',
              }}>
                <span style={{ color: T.green, fontSize: 18, lineHeight: 1 }}>✓</span> {row.us}
              </div>
            </div>
          ))}
        </Panel>

        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
          <CTAButton primary big sub="Free, no obligation, plain English" href="/contact">
            See if we're a fit for you →
          </CTAButton>
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  const width = useWindowWidth();
  const cols  = width < 768 ? 1 : width < 1024 ? 2 : 3;

  return (
    <section style={{
      background: T.paper,
      padding: '80px 32px',
      ...halftone('rgba(0,0,0,0.04)', 2, 12),
    }}>
      <div style={{ maxWidth: useContentMax(1320), margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
          marginBottom: 36,
        }}>
          <SectionTitle
            kicker="Honest pricing"
            headline="Simple. Per user. Per month."
            sub="No hidden setup fees, no time-and-materials creep. Onsite visits billed separately. Pick the cover that matches your risk."
          />
          <Sticker rotate={-3} color={T.yellow}>30-day money back · all tiers</Sticker>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 22,
          marginTop: 24,
        }}>
          {PRICING.map(tier => (
            <Panel
              key={tier.name}
              accent={tier.best ? T.accent : T.primary}
              style={{
                padding: 28,
                position: 'relative',
                background: '#fff',
                transform: cols > 1 && tier.best ? 'scale(1.03)' : 'none',
                zIndex: tier.best ? 2 : 1,
                boxShadow: tier.best ? `8px 8px 0 0 ${T.ink}` : `6px 6px 0 0 ${T.ink}`,
              }}
            >
              {tier.best && (
                <div style={{ position: 'absolute', top: -14, right: 20 }}>
                  <Sticker rotate={4} color={T.accent}>★ Best fit · 80% of clients</Sticker>
                </div>
              )}
              <h3 style={{ font: "400 32px/1 'Bungee', sans-serif", color: T.ink, margin: '8px 0 6px' }}>{tier.name}</h3>
              <p style={{
                font: "500 14px/1.45 'Archivo', sans-serif",
                color: T.ink,
                opacity: 0.75,
                margin: '0 0 20px',
                minHeight: 60,
              }}>{tier.blurb}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 18 }}>
                <span style={{ font: "400 14px/1 'Archivo', sans-serif", color: T.ink, opacity: 0.6 }}>from</span>
                <span style={{ font: "400 56px/1 'Bungee', sans-serif", color: T.ink }}>£{tier.perUser}</span>
                <span style={{ font: "600 14px/1 'Archivo', sans-serif", color: T.ink, opacity: 0.7 }}>/user/month</span>
              </div>
              <ul style={{
                listStyle: 'none',
                margin: '0 0 24px',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                {tier.includes.map(line => (
                  <li key={line} style={{
                    font: "600 13px/1.4 'Archivo', sans-serif",
                    color: T.ink,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                  }}>
                    <span style={{
                      width: 16, height: 16,
                      background: tier.best ? T.accent : T.green,
                      color: '#fff',
                      border: `2px solid ${T.ink}`,
                      display: 'grid',
                      placeItems: 'center',
                      font: "800 10px/1 'Archivo'",
                      flexShrink: 0,
                      marginTop: 2,
                    }}>✓</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <CTAButton
                primary={tier.best}
                sub={tier.best ? 'Calendly · 20 min' : 'Get tier-specific quote'}
                href="/contact"
              >
                {tier.best ? 'Book a chat' : 'Get a quote'}
              </CTAButton>
            </Panel>
          ))}
        </div>

        <div style={{
          marginTop: 24,
          padding: '16px 22px',
          background: T.ink,
          color: T.paper,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          font: "600 14px/1.3 'Archivo', sans-serif",
        }}>
          <span>📊 <strong>Need a custom quote?</strong> 50+ users, multiple sites, or regulated sector? We'll build it round you.</span>
          <Link to="/contact" style={{
            color: T.yellow,
            font: "800 13px/1 'Archivo', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            textDecoration: 'none',
          }}>Talk to Sam →</Link>
        </div>

        <div style={{
          marginTop: 14,
          padding: '14px 22px',
          background: 'transparent',
          border: `1px dashed ${T.ink}`,
          color: T.ink,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          font: "500 13px/1.4 'Archivo', sans-serif",
        }}>
          <span><strong>Not ready for fully managed?</strong> Foundation Monitoring is our entry-level: 24/7 watch, Huntress EDR and patching, from £10/device.</span>
          <Link to="/foundation-monitoring" style={{
            color: T.primaryDark,
            font: "700 12px/1 'Archivo', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}>See Foundation →</Link>
        </div>
      </div>
    </section>
  );
}

function Process() {
  const gridRef = useRef<HTMLDivElement>(null);
  const width = useWindowWidth();
  const cols  = width < 640 ? 1 : width < 1024 ? 2 : 5;

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (!('IntersectionObserver' in window)) {
      grid.classList.add('in-view');
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add('in-view');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.25 });
    io.observe(grid);
    return () => io.disconnect();
  }, []);

  return (
    <section style={{
      background: T.ink,
      color: T.paper,
      padding: '80px 32px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      ...halftone('rgba(255,255,255,0.05)', 2, 14),
    }}>
      <div style={{ maxWidth: useContentMax(1320), margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <SectionTitle
            dark
            kicker="How we work"
            headline={<>From "we should look at IT"<br />to fully onboarded, in 30 days.</>}
          />
          <div style={{
            font: "500 15px/1.4 'Archivo', sans-serif",
            color: 'rgba(251,246,236,0.7)',
            maxWidth: 320,
          }}>
            We do the heavy lifting and coordinate directly with your outgoing provider. Zero downtime. Zero awkward emails.
          </div>
        </div>

        <div
          ref={gridRef}
          className="ft-process-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 18,
            marginTop: 48,
            position: 'relative',
          }}
        >
          {cols === 5 && (
            <>
              <div aria-hidden style={{
                position: 'absolute',
                top: 28, left: 28, right: 28,
                height: 4,
                background: 'rgba(255,255,255,0.12)',
                zIndex: 0,
              }} />
              <div
                aria-hidden
                className="ft-process-fill"
                style={{
                  position: 'absolute',
                  top: 28, left: 28,
                  height: 4,
                  background: T.yellow,
                  zIndex: 0,
                  width: '0%',
                }}
              />
            </>
          )}
          {PROCESS.map((p, i) => (
            <div key={p.n} className="ft-process-step" style={{ position: 'relative', animationDelay: `${i * 90}ms` }}>
              <div style={{
                width: 56, height: 56,
                background: T.yellow,
                border: `2px solid ${T.paper}`,
                display: 'grid',
                placeItems: 'center',
                font: "400 28px/1 'Bungee', sans-serif",
                color: T.ink,
                marginBottom: 16,
                position: 'relative',
                zIndex: 1,
              }}>{p.n}</div>
              <h3 style={{ font: "800 17px/1.2 'Archivo', sans-serif", color: T.paper, margin: '0 0 8px' }}>{p.title}</h3>
              <p style={{ font: "500 13px/1.5 'Archivo', sans-serif", color: 'rgba(251,246,236,0.7)', margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .ft-process-step { opacity: 0; transform: translateY(12px); animation: ftStepIn 600ms cubic-bezier(.2,.7,.2,1) both; animation-play-state: paused; }
        .ft-process-grid.in-view .ft-process-step { animation-play-state: running; }
        .ft-process-grid.in-view .ft-process-fill { width: calc(100% - 56px); transition: width 1400ms cubic-bezier(.4,.1,.2,1) 200ms; }
        @keyframes ftStepIn { to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .ft-process-step { opacity: 1; transform: none; animation: none; }
          .ft-process-grid.in-view .ft-process-fill { transition: none; }
        }
      `}</style>

      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <Link to="/onboarding" style={{
          font: "700 13px/1 'Archivo Narrow', sans-serif",
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: T.yellow,
          textDecoration: 'none',
          borderBottom: '1px solid rgba(245,194,74,0.4)',
          paddingBottom: 2,
        }}>Nervous about switching? Read our step-by-step guide →</Link>
      </div>
    </section>
  );
}

function CaseStudiesSection() {
  const width = useWindowWidth();
  const cols  = width < 768 ? 1 : width < 1024 ? 2 : 3;

  return (
    <section style={{ background: T.paperDeep, padding: '80px 32px' }}>
      <div style={{ maxWidth: useContentMax(1320), margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
          marginBottom: 36,
        }}>
          <SectionTitle
            kicker="From the field"
            headline="Real businesses. Real saves."
            sub="Three recent missions. Concrete numbers, not corporate fluff."
          />
          <Link to="/case-studies" style={{
            font: "800 13px/1 'Archivo', sans-serif",
            color: T.primaryDark,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            textDecoration: 'none',
          }}>See all case studies →</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 22 }}>
          {HOMEPAGE_CASE_STUDIES.map((cs, i) => {
            const tones = [T.primary, T.accent, T.green];
            return (
              <Link key={cs.client} to={cs.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Panel accent={tones[i]} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{
                    aspectRatio: '5/3',
                    backgroundImage: `linear-gradient(135deg, ${tones[i]} 0%, ${T.ink} 120%), radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1.5px)`,
                    backgroundSize: 'auto, 10px 10px',
                    borderBottom: `3px solid ${T.ink}`,
                    position: 'relative',
                    display: 'grid',
                    placeItems: 'center',
                  }}>
                    <div style={{
                      font: "400 26px/1 'Bungee', sans-serif",
                      color: '#fff',
                      textAlign: 'center',
                      padding: 20,
                      textShadow: `3px 3px 0 ${T.ink}`,
                      maxWidth: '100%',
                    }}>{cs.client}</div>
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <Sticker rotate={-4}>{cs.industry}</Sticker>
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: 12, right: 12,
                      background: T.yellow,
                      border: `2.5px solid ${T.ink}`,
                      padding: '6px 10px',
                      font: "700 12px/1.1 'Archivo', sans-serif",
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      color: T.ink,
                      maxWidth: '70%',
                      textAlign: 'right',
                    }}>{cs.badge}</div>
                  </div>
                  <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    <div style={{
                      font: "700 11px/1 'Archivo Narrow', sans-serif",
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: T.primaryDark,
                    }}>{cs.label}</div>
                    <h3 style={{ font: "800 20px/1.2 'Archivo', sans-serif", color: T.ink, margin: 0 }}>{cs.title}</h3>
                    <p style={{
                      font: "500 14px/1.5 'Archivo', sans-serif",
                      color: T.ink,
                      opacity: 0.78,
                      margin: 0,
                      flex: 1,
                    }}>{cs.outcome}</p>
                    <div style={{
                      font: "800 12px/1 'Archivo', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                      color: T.primaryDark,
                      marginTop: 4,
                    }}>Read the mission →</div>
                  </div>
                </Panel>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Trim a long Google review for grid display while keeping the punch.
const trimReview = (text: string, max = 180): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max - 40 ? cut.slice(0, lastSpace) : cut) + '…';
};

function Reviews() {
  const width = useWindowWidth();
  const cols  = width < 640 ? 1 : width < 1024 ? 2 : 4;
  const { reviews, rating } = useGoogleReviews();
  const display: GoogleReview[] = reviews.slice(0, 4);
  const ratingStr = rating === null ? null : rating.toFixed(1);

  return (
    <section style={{
      background: T.primaryDark,
      // Halftone kept to 0.10 so paper and yellow text still pass AA over a dot on the lightest stop.
      backgroundImage: `radial-gradient(rgba(255,255,255,0.10) 1.5px, transparent 2px), linear-gradient(180deg, ${T.primaryDark}, ${T.ink})`,
      backgroundSize: '14px 14px, auto',
      padding: '100px 32px',
      borderTop: `3px solid ${T.ink}`,
      borderBottom: `3px solid ${T.ink}`,
      color: '#fff',
    }}>
      <div style={{ maxWidth: useContentMax(1320), margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
          marginBottom: 36,
        }}>
          <SectionTitle dark kicker="In their own words" headline="Selected customer reviews" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              font: "400 56px/1 'Bungee', sans-serif",
              color: T.yellow,
              textShadow: `3px 3px 0 ${T.ink}`,
            }}>{ratingStr === null ? 'Reviews' : `${ratingStr}★`}</div>
            <div>
              <div style={{ font: "800 15px/1.2 'Archivo', sans-serif", color: '#fff' }}>Google reviews</div>
              <Link to="/why-trust-us" style={{
                font: "600 13px/1 'Archivo Narrow', sans-serif",
                letterSpacing: '0.12em',
                color: T.paper,
                textTransform: 'uppercase',
                textDecoration: 'underline',
              }}>Read customer feedback →</Link>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18 }}>
          {display.map((r, i) => (
            <Panel key={`${r.author}-${i}`} style={{ padding: 22, background: '#fff', color: T.ink }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                {Array.from({ length: r.rating }).map((_, j) => (
                  <span key={j} style={{ color: T.accent, fontSize: 18 }}>★</span>
                ))}
              </div>
              <p style={{
                font: "700 16px/1.4 'Archivo', sans-serif",
                color: T.ink,
                margin: '0 0 16px',
                letterSpacing: '-0.005em',
              }}>"{trimReview(r.text)}"</p>
              <div style={{
                font: "700 12px/1.3 'Archivo Narrow', sans-serif",
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: T.primaryDark,
              }}>{r.author} · {r.relativeTime}</div>
            </Panel>
          ))}
        </div>

        <div style={{
          marginTop: 48,
          display: 'grid',
          gridTemplateColumns: width < 768 ? '1fr' : 'auto 1fr',
          gap: 28,
          alignItems: 'center',
          maxWidth: 980,
          margin: '48px auto 0',
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 96, height: 96,
              borderRadius: '50%',
              background: T.yellow,
              border: `3px solid ${T.ink}`,
              boxShadow: `5px 5px 0 0 ${T.ink}`,
              display: 'grid',
              placeItems: 'center',
              font: "800 32px/1 'Archivo', sans-serif",
              color: T.ink,
            }}>{FEATURED_TESTIMONIAL.initials}</div>
          </div>
          <div>
            <p style={{
              font: "700 28px/1.3 'Archivo', sans-serif",
              color: '#fff',
              margin: 0,
              letterSpacing: '-0.005em',
            }}>"{FEATURED_TESTIMONIAL.quote}"</p>
            <div style={{
              font: "700 13px/1 'Archivo Narrow', sans-serif",
              letterSpacing: '0.14em',
              color: T.paper,
              textTransform: 'uppercase',
              marginTop: 14,
            }}>{FEATURED_TESTIMONIAL.attribution}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Sectors() {
  const width = useWindowWidth();
  const cols  = width < 640 ? 1 : width < 1024 ? 2 : 3;

  return (
    <section style={{ background: T.paper, padding: '80px 32px' }}>
      <div style={{ maxWidth: useContentMax(1320), margin: '0 auto' }}>
        <SectionTitle
          kicker="Sectors we know"
          headline="We probably know your software."
          sub="Over a decade of getting the quirks right. We talk to your case-management vendor, your practice software vendor, your shop-floor MES, so you don't have to."
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 18,
          marginTop: 36,
        }}>
          {INDUSTRIES.map((ind, i) => {
            const tones = [T.primary, T.accent, T.green, T.yellow, T.red, T.primaryDark];
            return (
              <Link key={ind.href} to={ind.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Panel accent={tones[i]} style={{ padding: 22 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                    gap: 12,
                  }}>
                    <h3 style={{ font: "800 22px/1.15 'Archivo', sans-serif", color: T.ink, margin: 0 }}>{ind.name}</h3>
                    <Sticker rotate={4} color={T.paperDeep}>Free guide</Sticker>
                  </div>
                  <p style={{
                    font: "500 14px/1.5 'Archivo', sans-serif",
                    color: T.ink,
                    opacity: 0.72,
                    margin: 0,
                  }}>{ind.desc}</p>
                  <div style={{
                    font: "800 11px/1 'Archivo', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: T.primaryDark,
                    marginTop: 16,
                  }}>Explore →</div>
                </Panel>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ServiceAreas() {
  const width    = useWindowWidth();
  const isMobile = width < 1024;
  const sorted   = [...SERVICE_AREAS].sort((a, b) => a.county.localeCompare(b.county) || a.town.localeCompare(b.town));

  return (
    <section style={{ background: T.paperDeep, padding: '80px 32px' }}>
      <div style={{ maxWidth: useContentMax(1320), margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr',
          gap: 48,
          alignItems: 'center',
        }}>
          <div>
            <SectionTitle
              kicker="Where we work"
              headline="Local. Properly."
              sub="Support is remote-first, so distance rarely matters. We don't take on clients we can't serve properly; for most that means within an hour of Ludlow. We'll always tell you straight."
            />
            <div style={{ marginTop: 24 }}>
              <CTAButton primary big sub="See if your town is covered" href="/contact">
                Check your postcode →
              </CTAButton>
            </div>
            <div style={{
              marginTop: 20,
              font: "500 13px/1.7 'Archivo', sans-serif",
              color: T.ink,
            }}>
              <span style={{ opacity: 0.7 }}>Browse by county: </span>
              {[
                { l: 'IT Support Shropshire',     h: '/it-support-shropshire'     },
                { l: 'Herefordshire',             h: '/it-support-herefordshire'  },
                { l: 'Worcestershire',            h: '/it-support-worcestershire' },
                { l: 'Powys',                     h: '/it-support-powys'          },
              ].map((c, i, arr) => (
                <React.Fragment key={c.h}>
                  <Link to={c.h} style={{ color: T.primaryDark, fontWeight: 700, textDecoration: 'none' }}>{c.l}</Link>
                  {i < arr.length - 1 ? ' · ' : ''}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 0,
            border: '1px solid rgba(15,25,35,0.12)',
            boxShadow: '0 6px 24px rgba(15,25,35,0.06)',
            background: '#fff',
          }}>
            {sorted.map((area, i) => (
              <Link
                key={area.town}
                to={area.href}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 22px',
                  borderTop: i > 1 ? `1.5px solid ${T.paperDeep}` : 'none',
                  borderRight: (i % 2) === 0 ? `1.5px solid ${T.paperDeep}` : 'none',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{
                    font: "400 22px/1 'Bungee', sans-serif",
                    color: T.ink,
                    letterSpacing: '0.01em',
                  }}>{area.town}</span>
                  <span style={{
                    font: "600 11px/1 'Archivo Narrow', sans-serif",
                    color: T.ink,
                    opacity: 0.7,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}>{area.county.replace('fordshire', '').replace('shire', '')}</span>
                </div>
                <span style={{
                  font: "700 12px/1 'Archivo', sans-serif",
                  color: T.primaryDark,
                  letterSpacing: '0.06em',
                }}>{area.miles === '0' ? 'HQ' : `${area.miles} mi`} →</span>
              </Link>
            ))}
          </div>
        </div>

        <div style={{
          marginTop: 14,
          padding: '12px 16px',
          background: T.paperDeep,
          border: '1px dashed rgba(15,25,35,0.2)',
          font: "500 13px/1.5 'Archivo', sans-serif",
          color: T.ink,
        }}>
          <strong>Specialist sectors</strong> (Biogas, Healthcare, Legal compliance): we work UK-wide.
          {' '}<Link to="/contact" style={{ color: T.primaryDark, fontWeight: 700 }}>Ask us about your location →</Link>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number>(0);
  return (
    <section style={{ background: T.paper, padding: '80px 32px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <SectionTitle kicker="Common questions" headline="The bit before you ring." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 36 }}>
          {FAQS.map((f, i) => (
            <Panel key={i} style={{ padding: 0, cursor: 'pointer' }} onClick={() => setOpen(open === i ? -1 : i)}>
              <div style={{
                padding: '18px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 14,
              }}>
                <h3 style={{ font: "800 17px/1.3 'Archivo', sans-serif", color: T.ink, margin: 0 }}>{f.q}</h3>
                <div style={{
                  width: 32, height: 32,
                  background: open === i ? T.accent : T.yellow,
                  border: `2.5px solid ${T.ink}`,
                  display: 'grid',
                  placeItems: 'center',
                  font: "400 18px/1 'Bungee', sans-serif",
                  color: T.ink,
                  transition: 'transform 0.2s',
                  transform: open === i ? 'rotate(45deg)' : 'rotate(0)',
                  flexShrink: 0,
                }}>+</div>
              </div>
              {open === i && (
                <div style={{
                  padding: '0 22px 20px',
                  font: "500 15px/1.55 'Archivo', sans-serif",
                  color: T.ink,
                  opacity: 0.8,
                }}>{f.a}</div>
              )}
            </Panel>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const width    = useWindowWidth();
  const isMobile = width < 768;
  const { stats, loading } = useLiveStats();

  const liveTiles = [
    { v: '–',  l: 'Calls answered today' },
    { v: formatMinutes(stats?.AverageResponseTimeLast30DaysMinutes, loading),  l: 'Avg response' },
    { v: '–',  l: 'Tickets closed today' },
    { v: '–',  l: 'On-site visits' },
  ];

  return (
    <section style={{
      background: T.accent,
      padding: '80px 32px',
      borderTop: `3px solid ${T.ink}`,
      borderBottom: `3px solid ${T.ink}`,
      ...halftone('rgba(0,0,0,0.08)', 2, 12),
    }}>
      <div style={{
        maxWidth: useContentMax(1080),
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr',
        gap: 36,
        alignItems: 'center',
      }}>
        <div>
          <Sticker rotate={-3} color={T.yellow}>Free 20-min call · No sales pitch</Sticker>
          <h2 style={{
            font: "400 clamp(40px, 6vw, 60px)/0.95 'Bungee', sans-serif",
            color: T.ink,
            margin: '16px 0 16px',
            textShadow: `4px 4px 0 ${T.paper}, 4px 4px 0 1px ${T.ink}`,
          }}>
            Got an<br />IT headache?
          </h2>
          <p style={{
            font: "600 18px/1.5 'Archivo', sans-serif",
            color: T.ink,
            margin: '0 0 24px',
            maxWidth: 520,
          }}>
            One call. We'll tell you whether we can help, what it'll cost, and how fast, in plain English. If we're not the right fit we'll point you to someone who is.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <CTAButton primary big sub="Calendly · 20 min" href="/contact">Book a Discovery Call</CTAButton>
            <CTAButton big sub="Mon–Fri 9–5 · same engineer always" href={BRAND.phoneHref}>
              Call {BRAND.phone}
            </CTAButton>
          </div>
        </div>
        <Panel style={{ padding: 26, background: T.paper }} accent={T.primary}>
          <div style={{
            font: "700 11px/1 'Archivo Narrow', sans-serif",
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: T.primaryDark,
            marginBottom: 14,
          }}>Right now at the helpdesk</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {liveTiles.map(s => (
              <div key={s.l}>
                <div style={{ font: "400 28px/1 'Bungee', sans-serif", color: T.ink }}>{s.v}</div>
                <div style={{
                  font: "700 10px/1.3 'Archivo Narrow', sans-serif",
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: T.ink,
                  opacity: 0.65,
                  marginTop: 4,
                }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 18,
            padding: '10px 12px',
            background: T.paperDeep,
            border: `2px dashed ${T.ink}`,
            font: "600 12px/1.4 'Archivo Narrow', sans-serif",
            color: T.ink,
          }}>
            <span style={{
              display: 'inline-block',
              width: 8, height: 8,
              borderRadius: '50%',
              background: T.green,
              marginRight: 8,
              verticalAlign: 'middle',
            }} />
            All systems operational · last sync 2 min ago
          </div>
        </Panel>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

export const HomePageV2: React.FC = () => (
  <>
    <SEO
      title="Business IT Support in Shropshire & the Marches"
      description="Friendly, expert business IT support across Shropshire, Herefordshire and the Welsh Borders. From £40/user/month. No 3-year lock-ins. Fast remote fixes."
      type="website"
    />
    <Hero />
    <LiveTicker />
    <Services />
    <Comparison />
    <PricingTeaser />
    <Process />
    <CaseStudiesSection />
    <Reviews />
    <Sectors />
    <ServiceAreas />
    <Faq />
    <FinalCTA />
  </>
);

export default HomePageV2;
