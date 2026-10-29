import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, useContentMax, Eyebrow, DisplayHead } from '../components-v2/primitives';
import { LastReviewed } from '../components-v2/LastReviewed';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

type Cell = { state: 'yes' | 'partial' | 'no'; note: string };
type Row = { feature: string; us: Cell; them: Cell; diy: Cell };

const COMPARE_ROWS: Row[] = [
  {
    feature: 'Huntress managed EDR + identity threat detection',
    us:   { state: 'yes',     note: 'Included on every tier, Standard included' },
    them: { state: 'no',      note: 'Usually £6–10/user/month extra' },
    diy:  { state: 'no',      note: 'You\'d need to buy + manage it yourself' },
  },
  {
    feature: 'Microsoft 365 backup (mail, OneDrive, SharePoint, Teams)',
    us:   { state: 'yes',     note: 'Independent third-party backup, included' },
    them: { state: 'no',      note: 'Often £4–8/user/month extra' },
    diy:  { state: 'partial', note: 'Most assume Microsoft "has it covered", but they don\'t' },
  },
  {
    feature: 'DMARC policy management',
    us:   { state: 'yes',     note: 'Configured and monitored' },
    them: { state: 'no',      note: 'Typically a project, often not done at all' },
    diy:  { state: 'no',      note: 'Specialist skill, rarely done in-house' },
  },
  {
    feature: 'Cloudflare DNS management',
    us:   { state: 'yes',     note: 'We hold DNS so third parties can\'t break your email' },
    them: { state: 'partial', note: 'Often pointed at a registrar nobody owns' },
    diy:  { state: 'partial', note: 'Usually whoever set up the website years ago' },
  },
  {
    feature: 'Cyber Essentials maintenance + evidence pack',
    us:   { state: 'yes',     note: 'Year-round; ready for annual assessment' },
    them: { state: 'partial', note: 'Often a paid project, redone yearly' },
    diy:  { state: 'no',      note: 'Multi-week internal project + assessor cost' },
  },
  {
    feature: 'Basic shared webhosting',
    us:   { state: 'yes',     note: 'Included if you need a simple business site' },
    them: { state: 'no',      note: 'Separate hosting bill, usually £15–30/month' },
    diy:  { state: 'partial', note: 'GoDaddy / 123-reg retail rates' },
  },
  {
    feature: 'Domain renewal absorbed (standard TLDs)',
    us:   { state: 'yes',     note: '.co.uk, .com, .uk, .org, .net etc, at our cost' },
    them: { state: 'no',      note: 'You pay registrar retail (~£25–40/year)' },
    diy:  { state: 'no',      note: 'Retail rates from your registrar' },
  },
  {
    feature: 'Onsite support',
    us:   { state: 'partial', note: 'Remote-first on every tier; onsite only when remote cannot fix it, billed separately' },
    them: { state: 'partial', note: 'Often "billable on top" once you\'re past 20 miles' },
    diy:  { state: 'no',      note: 'You\'re the onsite' },
  },
  {
    feature: 'Named engineer who knows your business',
    us:   { state: 'yes',     note: 'Two engineers, you talk to one of us, directly' },
    them: { state: 'no',      note: 'A ticket queue, rotating helpdesk' },
    diy:  { state: 'partial', note: 'One person, and if they\'re ill, no cover' },
  },
  {
    feature: 'Response time on critical issues',
    us:   { state: 'yes',     note: 'P1 within 30 minutes on every tier' },
    them: { state: 'partial', note: 'Best-efforts, often 1–4 hours' },
    diy:  { state: 'partial', note: 'Whenever they get to it / are in the office' },
  },
  {
    feature: 'Holiday & sickness cover',
    us:   { state: 'yes',     note: 'Two of us means continuous cover' },
    them: { state: 'yes',     note: 'Helpdesk model handles cover by design' },
    diy:  { state: 'no',      note: 'If your IT person is off, nothing happens' },
  },
  {
    feature: 'Indicative monthly cost (20-user business)',
    us:   { state: 'yes',     note: 'Standard £800/mo · Plus £1,200/mo · Premium £1,800/mo' },
    them: { state: 'partial', note: '£600/mo headline + ~£300/mo of "extras" usually billed on top' },
    diy:  { state: 'no',      note: '£3,500–4,000/mo (salary loaded for 1 FTE)' },
  },
];

const Symbol: React.FC<{ state: 'yes' | 'partial' | 'no' }> = ({ state }) => {
  if (state === 'yes') {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="11" fill={T.green} fillOpacity="0.18" />
        <path d="M6.5 11.5l3 3 6-6.5" stroke={T.green} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (state === 'partial') {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="11" fill={T.yellow} fillOpacity="0.25" />
        <path d="M6.5 11h9" stroke={T.ink} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="11" fill={T.red} fillOpacity="0.15" />
      <path d="M7 7l8 8M15 7l-8 8" stroke={T.red} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
};

export const ComparePageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const isTablet = ww < 1024;

  return (
    <>
      <SEO
        title="Compare: What We Include That £30 IT Providers Don't"
        description="Honest comparison: Fresh Tech Standard at £40/user vs a typical national IT provider at £30/user vs DIY in-house IT. Twelve rows of what's actually in the price."
        type="service"
      />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '72px 32px 80px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <Eyebrow light>Honest comparison</Eyebrow>
          <DisplayHead as="h1" size={isMobile ? 36 : 50} light style={{ marginBottom: 20, lineHeight: 0.97, maxWidth: '20ch' }}>
            What we include that £30 IT providers don't.
          </DisplayHead>
          <p style={{
            color: 'rgba(255,255,255,0.7)', fontSize: '18px', lineHeight: 1.65,
            margin: '0 0 16px', maxWidth: '60ch',
          }}>
            We're not the cheapest. We're not pretending to be. This page is a no-spin comparison of what's actually in the price: Fresh Tech Standard versus a typical national IT provider at £30/user, versus doing it yourself in-house.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', lineHeight: 1.6, margin: 0, maxWidth: '60ch', fontStyle: 'italic' }}>
            Tick = fully included. Half-tick = partially / sometimes / extra-cost. Cross = not included or has to be done another way.
          </p>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section style={{ background: T.paper, padding: '72px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {isMobile ? (
            // Mobile: stack each row as a card
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {COMPARE_ROWS.map((row, i) => (
                <div key={i} style={{
                  background: T.white,
                  border: `2px solid ${T.ink}`,
                  boxShadow: `3px 3px 0 0 ${T.ink}`,
                  padding: 20,
                }}>
                  <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '15px', color: T.ink, marginBottom: 14, lineHeight: 1.3 }}>{row.feature}</div>
                  {(['us','them','diy'] as const).map(col => {
                    const cell = row[col];
                    const label = col === 'us' ? 'Fresh Tech Standard (£40)' : col === 'them' ? 'Typical national IT provider (£30)' : 'DIY in-house';
                    return (
                      <div key={col} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                        <div style={{ flexShrink: 0, marginTop: 2 }}><Symbol state={cell.state} /></div>
                        <div>
                          <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(15,25,35,0.5)', fontWeight: 700 }}>{label}</div>
                          <div style={{ fontSize: '13px', color: T.ink, lineHeight: 1.5 }}>{cell.note}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            // Desktop / tablet: full 4-column table
            <div style={{
              background: T.white,
              border: `2px solid ${T.ink}`,
              boxShadow: `6px 6px 0 0 ${T.ink}`,
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
                background: T.ink,
                padding: '20px 24px',
                gap: 16,
              }}>
                <div style={{
                  fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px',
                  textTransform: 'uppercase', letterSpacing: '0.14em',
                  color: 'rgba(255,255,255,0.55)', fontWeight: 700,
                }}>Feature</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '15px', color: T.yellow, lineHeight: 1.2 }}>Fresh Tech</div>
                  <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginTop: 4 }}>Standard · £40/user</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.2 }}>National IT provider</div>
                  <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginTop: 4 }}>Typical · £30/user</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.2 }}>DIY in-house</div>
                  <div style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginTop: 4 }}>You / your team</div>
                </div>
              </div>

              {/* Rows */}
              {COMPARE_ROWS.map((row, i) => (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
                  gap: 16,
                  padding: '16px 24px',
                  background: i % 2 === 0 ? T.white : T.paper,
                  borderBottom: i < COMPARE_ROWS.length - 1 ? `1px solid ${T.hairline}` : 'none',
                  alignItems: 'center',
                }}>
                  <div style={{ fontSize: '14px', color: T.ink, fontWeight: 600, lineHeight: 1.4 }}>{row.feature}</div>
                  {(['us','them','diy'] as const).map(col => {
                    const cell = row[col];
                    return (
                      <div key={col} style={{ display: 'flex', flexDirection: isTablet ? 'column' : 'row', alignItems: isTablet ? 'flex-start' : 'flex-start', gap: 10 }}>
                        <div style={{ flexShrink: 0, marginTop: 2 }}><Symbol state={cell.state} /></div>
                        <div style={{ fontSize: '12px', color: 'rgba(15,25,35,0.7)', lineHeight: 1.5 }}>{cell.note}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          <div style={{
            marginTop: 24, padding: '16px 20px',
            background: T.paperDeep,
            border: `1px solid ${T.hairline}`,
            fontSize: '13px', color: 'rgba(15,25,35,0.6)', lineHeight: 1.6,
          }}>
            "Typical national IT provider" figures are based on published price lists and procurement quotes we've seen from clients switching to us in 2025–2026. Your mileage may vary, every provider differs. The point is that <strong>£10/month/user buys a lot more than people think</strong> once you account for the line items above.
          </div>
        </div>
      </section>

      {/* CALL-OUT: PRICE ISN'T THE STORY */}
      <section style={{ background: T.ink, padding: '64px 32px', ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13) }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Eyebrow light>Why we're not the cheapest</Eyebrow>
          <DisplayHead size={32} light style={{ marginBottom: 16 }}>£10 buys you peace of mind, not paperwork.</DisplayHead>
          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: '0 0 16px', maxWidth: '64ch' }}>
            Most clients who quote-shop discover the £30 headline becomes £45–55 after the add-ons that should have been included. Worse, the bits they didn't think to ask about, such as DMARC, M365 backup, identity threat detection, usually aren't there at all. They find out when the breach happens.
          </p>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0, maxWidth: '64ch' }}>
            Fresh Tech's pricing is indicative: we'll quote you exactly during a 20-minute discovery call once we know your user count, sites, and devices. <Link to="/contact" style={{ color: T.yellow, fontWeight: 600 }}>Book one →</Link>
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{
        background: T.paper, padding: '72px 32px', borderTop: `1px solid ${T.hairline}`,
      }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
          gap: 32,
          alignItems: 'center',
        }}>
          <div>
            <Eyebrow>Want a side-by-side on your current provider?</Eyebrow>
            <DisplayHead size={32} style={{ marginBottom: 12 }}>Send us your IT invoice</DisplayHead>
            <p style={{ fontSize: '16px', color: 'rgba(15,25,35,0.65)', lineHeight: 1.65, margin: '0 0 6px', maxWidth: '52ch' }}>
              We'll do a free, honest breakdown of what you're paying for vs what's actually in the bill, even if our answer is "stay where you are."
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(15,25,35,0.4)', margin: 0 }}>
              PDF invoices only · Handled securely · No sales calls
            </p>
          </div>
          <Link to="/contact?ref=spend-review" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 28px',
            background: T.accent, color: T.white,
            border: `2px solid ${T.ink}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '16px',
            textDecoration: 'none',
            boxShadow: `4px 4px 0 0 ${T.ink}`,
            whiteSpace: 'nowrap',
          }}>Request a free review →</Link>
        </div>
        <LastReviewed />
      </section>
    </>
  );
};

export default ComparePageV2;
