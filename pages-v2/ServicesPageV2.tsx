import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, contentMax, Eyebrow, DisplayHead } from '../components-v2/primitives';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

interface ServiceItem {
  name: string;
  slug: string;
  desc: string;
  price: string;
  tag?: string;
  tagColor?: string;
  href: string;
}

interface ServiceGroup {
  group: string;
  lede: string;
  services: ServiceItem[];
}

// Slugs and hrefs map to real App.tsx routes — bundle used pretty slugs,
// real routes use the existing v1 paths (e.g. /services/cybersecurity not /services/cyber-security).
const GROUPS: ServiceGroup[] = [
  {
    group: 'Foundation',
    lede: "What every business on a Fresh Tech plan gets: the core that everything else builds on.",
    services: [
      { name: 'Managed IT Support',     slug: 'managed-it-support',       href: '/services/managed-it-support',        tag: 'Most popular', desc: 'Unlimited helpdesk, monitoring, M365 management, vendor liaison. One flat fee, everything in.', price: 'From £40/user/month' },
      { name: 'Cyber Security',          slug: 'cybersecurity',            href: '/services/cybersecurity',             desc: 'Huntress EDR, identity threat detection, phishing defence, security awareness training.',             price: 'Included on every plan' },
      { name: 'Microsoft 365',           slug: 'cloud-solutions',          href: '/services/cloud-solutions',           desc: 'Full M365 admin: Teams, email, SharePoint, OneDrive. Licences from us as a CSP, no markup.', price: 'Admin included · Licences at cost' },
      { name: 'Cloud Backup & Recovery', slug: 'backup-disaster-recovery', href: '/services/backup-disaster-recovery',  desc: 'Independent M365 backup (mail, OneDrive, SharePoint, Teams) plus server/file backup options.',        price: 'M365 backup on every plan' },
    ],
  },
  {
    group: 'Security & Compliance',
    lede: 'For businesses with regulatory obligations or client data to protect.',
    services: [
      { name: 'Cyber Essentials',           slug: 'cyber-essentials', href: '/services/cyber-essentials', desc: 'NCSC-backed certification. We handle the whole application, controls, and evidence pack.', price: 'Project-priced' },
      { name: 'IT Health Check',            slug: 'it-health-check',  href: '/it-health-check',           tag: 'Free', desc: 'Full audit of your devices, security posture, and licences. Plain-English report, no obligation.', price: 'Free' },
      { name: 'Microsoft Business Premium', slug: 'microsoft-premium', href: '/microsoft-business-premium', desc: 'Upgrade to Business Premium: Defender, Intune, advanced compliance features.',           price: 'Varies by licence' },
    ],
  },
  {
    group: 'Productivity & Cloud',
    lede: "Tools that make your team more effective, managed so you don't have to think about them.",
    services: [
      { name: 'Cloud Phone Systems',  slug: 'cloud-phone-systems',     href: '/services/cloud-phone-systems',     desc: 'Yeastar Cloud PBX, Teams Voice or hosted platforms. App-based calling, no expensive handset rentals.', price: 'Project-priced' },
      { name: 'Managed Print',        slug: 'managed-print',           href: '/services/managed-print',           desc: 'Direct manufacturer warranty. Own outright, no lease traps. Right printer for the job.',          price: 'Per-page pricing' },
      { name: 'Internet Connectivity', slug: 'internet-connectivity',  href: '/services/internet-connectivity',   desc: 'Leased lines, FTTP, and 4G backup. Sourced, installed and managed from multiple providers.',         price: 'Project-priced' },
    ],
  },
  {
    group: 'Projects & Infrastructure',
    lede: 'Larger one-off work quoted at a fixed price, so you know the cost before we start.',
    services: [
      { name: 'Strategic IT Projects',  slug: 'strategic-projects',     href: '/services/strategic-projects',     desc: 'WiFi surveys, office moves, server replacements, delivered on time, no surprises.', price: 'Fixed-price quote' },
      { name: 'Structured Cabling',     slug: 'structured-cabling',     href: '/services/structured-cabling',     desc: 'Patch panels, data points, fibre runs. Done properly and labelled.',                  price: 'Fixed-price quote' },
      { name: 'Hardware Procurement',   slug: 'hardware-procurement',   href: '/services/hardware-procurement',   desc: 'Right-sized laptops, screens and infrastructure at the right price, ready to roll.',  price: 'Hardware quoted · setup included on Plus+' },
    ],
  },
];

const tagColorOf = (tag?: string): string | undefined => {
  if (!tag) return undefined;
  if (tag === 'Free') return T.green;
  return T.yellow;
};

interface ServiceCardProps { service: ServiceItem; }
const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const [hov, setHov] = useState(false);
  const tagColor = tagColorOf(service.tag);
  return (
    <Link
      to={service.href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.white,
        border: `1px solid ${hov ? T.primary : T.hairline}`,
        padding: 24,
        textDecoration: 'none',
        color: T.ink,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: hov ? `3px 3px 0 0 ${T.primary}` : '0 2px 8px rgba(15,25,35,0.05)',
        transition: 'all 180ms',
        position: 'relative',
      }}
    >
      {service.tag && tagColor && (
        <div style={{
          position: 'absolute', top: -11, right: 14,
          background: tagColor,
          border: `2px solid ${T.ink}`,
          padding: '3px 10px',
          fontFamily: "'Bungee', sans-serif", fontSize: '10px',
          transform: 'rotate(2deg)',
          boxShadow: `2px 2px 0 0 ${T.ink}`,
          color: tagColor === T.green ? T.white : T.ink,
          whiteSpace: 'nowrap',
        }}>{service.tag}</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{
          fontFamily: "'Bungee', sans-serif", fontSize: '17px',
          lineHeight: 1.1, color: hov ? T.primary : T.ink,
        }}>{service.name}</div>
        <span style={{
          color: hov ? T.primary : T.hairline,
          fontWeight: 700, fontSize: '18px', flexShrink: 0,
          transition: 'color 180ms',
        }}>→</span>
      </div>
      <div style={{ fontSize: '13px', color: 'rgba(15,25,35,0.62)', lineHeight: 1.55, flexGrow: 1 }}>{service.desc}</div>
      <div style={{
        marginTop: 4,
        fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        fontWeight: 700, color: T.primary,
      }}>{service.price}</div>
    </Link>
  );
};

export const ServicesPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const isTablet = ww < 1024;
  const cardCols = isMobile ? 1 : isTablet ? 2 : 3;

  return (
    <>
      <SEO
        title="IT Services: Managed Support, Cyber Security & More"
        description="All the IT your business needs in one flat monthly fee. Managed support, cyber security, Microsoft 365, cloud backup, phone systems. From £40/user/month."
        type="service"
      />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '64px 32px 72px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{
          maxWidth: contentMax(ww, 1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 36 : 64,
          alignItems: 'center',
        }}>
          <div>
            <Eyebrow light>What we do</Eyebrow>
            <DisplayHead as="h1" size={isMobile ? 36 : 46} light style={{ marginBottom: 20, lineHeight: 1.0 }}>
              All the IT your business needs. One place. One fee.
            </DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '17px', lineHeight: 1.65, margin: '0 0 28px', maxWidth: '46ch' }}>
              Every service on this page is either included in your monthly plan or quoted at a fixed price before we start. No hourly rates, no "that's extra" surprises.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/pricing" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 22px',
                background: T.accent, color: T.white,
                border: `2px solid ${T.white}`,
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '15px',
                textDecoration: 'none',
                boxShadow: `3px 3px 0 0 ${T.yellow}`,
              }}>See pricing →</Link>
              <Link to="/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 22px',
                background: 'transparent', color: T.white,
                border: '2px solid rgba(255,255,255,0.3)',
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '15px',
                textDecoration: 'none',
              }}>Book a call</Link>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { n: '13',    l: 'Services in every plan' },
              { n: '£40',   l: 'Per user/month from' },
              { n: '24/7', l: 'Device monitoring' },
              { n: '0',     l: 'Setup fees ever' },
            ].map(({ n, l }, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '20px 18px',
              }}>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '32px', color: T.yellow, lineHeight: 1 }}>{n}</div>
                <div style={{
                  fontFamily: "'Archivo Narrow', sans-serif", fontSize: '10px',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: 4, lineHeight: 1.4,
                }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICE GROUPS */}
      {GROUPS.map(({ group, lede, services }, gi) => (
        <section key={gi} style={{
          background: gi % 2 === 0 ? T.paper : T.paperDeep,
          padding: isMobile ? '48px 20px' : '64px 32px',
          borderBottom: `1px solid ${T.hairline}`,
        }}>
          <div style={{ maxWidth: contentMax(ww, 1100), margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '260px 1fr',
              gap: isMobile ? 24 : 48,
              alignItems: 'start',
            }}>
              <div style={{ paddingTop: 4 }}>
                <Eyebrow>{`Group ${String(gi + 1).padStart(2, '0')}`}</Eyebrow>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '24px', marginBottom: 10, lineHeight: 1.05 }}>{group}</div>
                <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: '14px', lineHeight: 1.65, margin: 0 }}>{lede}</p>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cardCols}, 1fr)`,
                gap: 14,
              }}>
                {services.map(s => <ServiceCard key={s.slug} service={s} />)}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section style={{
        background: T.ink, padding: '64px 32px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>Not sure what you need?</Eyebrow>
          <DisplayHead size={36} light style={{ marginBottom: 14 }}>Start with a free IT health check</DisplayHead>
          <p style={{
            color: 'rgba(255,255,255,0.55)', fontSize: '16px', lineHeight: 1.65,
            margin: '0 auto 28px', maxWidth: '42ch',
          }}>
            Tell us what you have. We'll tell you what's missing, what's at risk, and what a sensible plan looks like.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/it-health-check" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 24px',
              background: T.accent, color: T.white,
              border: `2px solid ${T.white}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '15px',
              textDecoration: 'none',
              boxShadow: `3px 3px 0 0 ${T.yellow}`,
            }}>Free IT health check →</Link>
            <Link to="/pricing" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 24px',
              background: 'transparent', color: T.white,
              border: '2px solid rgba(255,255,255,0.3)',
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '15px',
              textDecoration: 'none',
            }}>See pricing</Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default ServicesPageV2;
