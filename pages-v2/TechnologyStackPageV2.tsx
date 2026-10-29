import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, useContentMax, Eyebrow, DisplayHead } from '../components-v2/primitives';
import { LastReviewed } from '../components-v2/LastReviewed';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const STACK = [
  {
    name: 'Huntress',
    cat: 'Managed Detection & Response',
    what: 'A 24/7 Security Operations Centre watching every endpoint. Real human threat hunters review suspicious activity and isolate compromised machines, even out of hours.',
    why: 'Most small businesses can’t staff a 24/7 SOC. Huntress gives our clients enterprise-grade detection and human response at SME scale, catching the foothold attacks that slip past antivirus.',
  },
  {
    name: 'ThreatLocker',
    cat: 'Zero-Trust / Application Control',
    what: 'Allowlisting and ringfencing: only approved applications run, and they can only do what they’re meant to. Ransomware that lands simply can’t execute.',
    why: 'Antivirus blocks what it recognises; ThreatLocker blocks everything it hasn’t been told to trust. It’s the difference between detecting an attack and denying it a way in.',
  },
  {
    name: 'Microsoft 365',
    cat: 'Productivity & Identity',
    what: 'Email, Teams, SharePoint and OneDrive, deployed, secured and managed properly, with Conditional Access and device management doing the heavy lifting on identity security.',
    why: 'We resell licences as a Microsoft Cloud Solution Provider (CSP) at cost, with no markup. You get the platform billed honestly, and configured the way it should be, not left on defaults.',
  },
  {
    name: 'Dell',
    cat: 'Business Hardware',
    what: 'Dell Pro and Dell Pro Max (formerly Latitude and Precision) business machines, specced to the workload and backed by proper onsite warranties, supplied through our Dell Premier account.',
    why: 'Consumer laptops from a high street shop cost you in downtime and short lifespans. Business-grade hardware, specced correctly, is cheaper over its life and far less hassle.',
  },
  {
    name: 'Ubiquiti UniFi',
    cat: 'Networking & Wi-Fi',
    what: 'Business-class switching, firewalls and Wi-Fi designed for real environments, from offices to warehouses and rural sites, managed centrally from a single dashboard.',
    why: 'Reliable connectivity is the foundation everything else sits on. UniFi gives us enterprise capability and proper segmentation without enterprise pricing or complexity.',
  },
  {
    name: 'Yealink',
    cat: 'Business Telephony',
    what: 'Cloud phone systems and handsets that let your team make and take calls on the office number from anywhere: desk, mobile or laptop.',
    why: 'Proven, reliable hardware that integrates cleanly with cloud phone platforms, so your phones just work whether staff are in the office or remote.',
  },
  {
    name: 'Cyber Essentials',
    cat: 'Certification',
    what: 'The UK government-backed security standard. We hold it ourselves, and we prepare and guide clients through certification.',
    why: 'It’s increasingly demanded by clients, insurers and supply chains. We practise what we deploy, and we get clients certified, not just “nearly there”.',
  },
];

export const TechnologyStackPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;

  return (
    <>
      <SEO
        title="Our Technology Stack: The Tools We Trust"
        description="The technology Fresh Tech builds on: Huntress 24/7 SOC, ThreatLocker zero-trust, Microsoft 365, Dell, Ubiquiti UniFi, Yealink and Cyber Essentials. Why we chose each, not just logos."
        type="website"
      />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '72px 32px 80px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <Eyebrow light>How we build</Eyebrow>
          <DisplayHead as="h1" size={isMobile ? 34 : 52} light style={{ marginBottom: 20, lineHeight: 0.97, maxWidth: '16ch' }}>
            The technology we trust. And why.
          </DisplayHead>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px', lineHeight: 1.65, margin: '0 0 12px', maxWidth: '60ch' }}>
            Plenty of IT companies drop a wall of vendor logos on their site. We&rsquo;d rather tell you exactly what we run, what it does for you, and why we chose it over the alternatives.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', lineHeight: 1.65, margin: 0, maxWidth: '60ch' }}>
            This is the same stack across every client. No cut corners on the small accounts, no upsells you don&rsquo;t need.
          </p>
        </div>
      </section>

      {/* STACK GRID */}
      <section style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
            {STACK.map((s, i) => (
              <div key={i} style={{
                background: T.white, border: `1px solid ${T.hairline}`,
                padding: 28, boxShadow: '0 4px 16px rgba(15,25,35,0.06)',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '20px', color: T.ink, lineHeight: 1 }}>{s.name}</div>
                  <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: T.primary, fontWeight: 700 }}>{s.cat}</div>
                </div>
                <p style={{ fontSize: '14px', color: T.ink, lineHeight: 1.6, margin: '0 0 14px' }}>{s.what}</p>
                <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${T.hairline}` }}>
                  <span style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(15,25,35,0.4)', fontWeight: 700 }}>Why we chose it</span>
                  <p style={{ fontSize: '14px', color: 'rgba(15,25,35,0.65)', lineHeight: 1.6, margin: '6px 0 0' }}>{s.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HONEST NOTE */}
      <section style={{ background: T.paperDeep, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <Eyebrow>No hidden margins</Eyebrow>
          <DisplayHead size={32} style={{ marginBottom: 16 }}>We make our money on service, not resale</DisplayHead>
          <p style={{ fontSize: '16px', color: 'rgba(15,25,35,0.7)', lineHeight: 1.7, margin: '0 0 16px', maxWidth: '64ch' }}>
            Microsoft licences are resold at cost as a <Link to="/services/cloud-solutions" style={{ color: T.primary, fontWeight: 600 }}>CSP</Link>, with no markup. Hardware is supplied at fair, transparent prices. The tools above are chosen because they work, not because they pay the best margin.
          </p>
          <p style={{ fontSize: '16px', color: 'rgba(15,25,35,0.7)', lineHeight: 1.7, margin: 0, maxWidth: '64ch' }}>
            That&rsquo;s the same principle behind our <Link to="/pricing" style={{ color: T.primary, fontWeight: 600 }}>transparent pricing</Link> and no three-year tie-ins. You should know what you&rsquo;re paying for, and why.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: T.ink, padding: '72px 32px', ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14) }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>Want this stack behind your business?</Eyebrow>
          <DisplayHead size={36} light style={{ marginBottom: 16 }}>Let&rsquo;s talk about your setup</DisplayHead>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '17px', lineHeight: 1.65, margin: '0 auto 28px', maxWidth: '46ch' }}>
            A 20-minute call to understand what you run today and where the gaps are. Honest advice, no jargon, no hard sell.
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

export default TechnologyStackPageV2;
