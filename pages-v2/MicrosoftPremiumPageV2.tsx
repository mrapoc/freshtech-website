import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { T, readableOn, useWindowWidth, useContentMax, Eyebrow, DisplayHead, Sticker } from '../components-v2/primitives';
import { LastReviewed } from '../components-v2/LastReviewed';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

const UPGRADES = [
  { icon: '🛡️', title: 'Microsoft Defender for Business', desc: 'Next-gen endpoint protection across PC, Mac and mobile. Real ransomware defence, not just AV.' },
  { icon: '📱', title: 'Microsoft Intune',                desc: 'Manage every device from one console. Zero-touch deploy, remote wipe, policy enforcement.' },
  { icon: '🔐', title: 'Azure AD Premium P1',              desc: 'Conditional Access, MFA enforced everywhere, self-service password reset.' },
  { icon: '📧', title: 'Proper anti-phishing layer',       desc: 'Microsoft Defender for Office 365 (Plan 1): safe links, safe attachments, real-time scanning of inbound mail. Much better than the Business Standard baseline.' },
  { icon: '🔒', title: 'Information Protection',           desc: 'Label sensitive documents, encrypt automatically, prevent forwarding outside your org.' },
  { icon: '💾', title: 'Data Loss Prevention',             desc: "Stop sensitive data leaving by accident. Block uploads of card numbers, NI numbers, client lists." },
];

const COMPARISON: [string, string, string][] = [
  ['Cost per user / month',     '£11.54 (was £10.30, +12%)',          '£18.10 (unchanged)'],
  ['Office apps + email',       '✓',                                  '✓'],
  ['Teams + SharePoint',        '✓',                                  '✓'],
  ['Endpoint protection',        'Built-in basic',                     'Defender for Business: full EDR'],
  ['Device management',          'None',                               'Microsoft Intune included'],
  ['Conditional Access + MFA',   'Limited',                            'Azure AD P1: full policy engine'],
  ['Phishing + safe-links',      'Basic',                              'Defender for O365 Plan 1'],
  ['Information protection',     'No',                                 'Yes (labels + encryption)'],
  ['Data Loss Prevention',       'No',                                 'Yes'],
  ['Cyber Essentials ready',      'Not without add-ons',                'Yes, out of the box'],
];

export const MicrosoftPremiumPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const isTablet = ww < 1024;

  return (
    <>
      <SEO
        title="Microsoft 365 Business Premium: Is It Worth Upgrading?"
        description="Business Standard is rising 12%, Premium isn't. The upgrade gap is now ~£6.56/user/month for Defender, Intune and data protection. Honest comparison."
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
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              <Sticker rotate={-3} color={T.primaryDark} fg="#fff">Microsoft 365</Sticker>
              <Sticker rotate={2}>Business Premium</Sticker>
              <Sticker rotate={-2} color={T.yellow}>Standard +12% · Premium unchanged</Sticker>
            </div>
            <DisplayHead as="h1" size={isMobile ? 36 : 48} light style={{ marginBottom: 20, lineHeight: 1.0 }}>
              The upgrade most small businesses actually need.
            </DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 18, lineHeight: 1.65, margin: '0 0 24px', maxWidth: '50ch' }}>
              Business Standard is fine for the basics. Business Premium adds the security and device-management features you actually need to be Cyber Essentials-ready and to actually defend against modern threats.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.65, margin: '0 0 28px', maxWidth: '50ch' }}>
              We'll tell you honestly whether the upgrade is worth it for your business, and if it's not, we'll say so.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: T.accent, color: readableOn(T.accent),
                border: `2px solid ${T.white}`,
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
                textDecoration: 'none',
                boxShadow: `4px 4px 0 0 ${T.yellow}`,
              }}>Book a licence audit →</Link>
              <a href="#compare" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px',
                background: 'transparent', color: T.white,
                border: '2px solid rgba(255,255,255,0.3)',
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
                textDecoration: 'none',
              }}>See the comparison ↓</a>
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '28px 32px',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 12,
            }}>Business Premium</div>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 56, color: T.yellow, lineHeight: 1 }}>£18.10</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>per user / month · price unchanged</div>
            <div style={{
              marginTop: 18,
              padding: '10px 14px',
              background: 'rgba(46,125,91,0.18)',
              border: '1px solid rgba(46,125,91,0.4)',
              fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5,
              textAlign: 'left',
            }}>
              <strong style={{ color: T.yellow }}>Standard is going up 12%, Premium isn't.</strong> The upgrade gap is now just <strong style={{ color: T.white }}>£6.56/user/month</strong> instead of £7.80. Best time to upgrade is right now.
            </div>
          </div>
        </div>
      </section>

      {/* UPGRADES */}
      <section style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow style={{ color: T.primaryDark }}>What you get</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 12 }}>Six big upgrades over Standard</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, margin: 0, maxWidth: '52ch', lineHeight: 1.6 }}>
              Each one would cost more as a separate add-on. Bundled together they're cheaper and they actually integrate properly.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: 18,
          }}>
            {UPGRADES.map((u, i) => (
              <div key={i} style={{
                background: T.white,
                border: `1px solid ${T.hairline}`,
                padding: 24,
                boxShadow: '0 4px 16px rgba(15,25,35,0.06)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{u.icon}</div>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 17, marginBottom: 10, lineHeight: 1.1 }}>{u.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(15,25,35,0.62)', lineHeight: 1.6 }}>{u.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section id="compare" style={{ background: T.paperDeep, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow style={{ color: T.primaryDark }}>Standard vs Premium</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 12 }}>The line-by-line comparison</DisplayHead>
          </div>
          <div style={{ border: `1px solid ${T.hairline}`, overflow: 'hidden', background: T.white }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr 1fr',
              background: T.ink, padding: '16px 24px', gap: 16,
            }}>
              <div style={{
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.65)', fontWeight: 700,
              }}>Feature</div>
              {!isMobile && (
                <>
                  <div style={{
                    fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: 'rgba(255,255,255,0.65)', fontWeight: 700, textAlign: 'center',
                  }}>Business Standard</div>
                  <div style={{
                    fontFamily: "'Bungee', sans-serif", fontSize: 13,
                    color: T.yellow, textAlign: 'center',
                  }}>Business Premium</div>
                </>
              )}
            </div>
            {COMPARISON.map(([label, std, prem], i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr 1fr',
                gap: 16,
                padding: '14px 24px',
                background: i % 2 === 0 ? T.white : T.paper,
                borderTop: `1px solid ${T.hairline}`,
                alignItems: 'center',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{label}</div>
                <div style={{
                  fontSize: 13,
                  color: std === '✓' ? T.green : 'rgba(15,25,35,0.62)',
                  textAlign: isMobile ? 'left' : 'center',
                  fontStyle: std.startsWith('£') || std === '✓' ? 'normal' : 'italic',
                }}>{isMobile && 'Standard: '}{std}</div>
                <div style={{
                  fontSize: 13,
                  color: prem === '✓' ? T.green : T.ink,
                  fontWeight: 700,
                  textAlign: isMobile ? 'left' : 'center',
                }}>{isMobile && 'Premium: '}{prem}</div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            background: T.ink, color: T.paper,
            fontSize: 13, lineHeight: 1.6,
          }}>
            <strong style={{ color: T.yellow }}>Reality check:</strong> With Standard going up 12% and Premium holding firm, the upgrade gap is shrinking to ~£6.56/user/month. And if you're buying Business Standard plus AV plus a separate MDM tool, you're already paying more than Premium would cost, for worse integration.
          </div>
        </div>
      </section>

      {/* WHEN TO UPGRADE / SKIP */}
      <section style={{ background: T.white, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow style={{ color: T.primaryDark }}>Honest take</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 12 }}>When it's worth it, and when it isn't</DisplayHead>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 20,
          }}>
            <div style={{
              background: T.paper,
              border: `2px solid ${T.green}`,
              padding: 28,
              boxShadow: `4px 4px 0 0 ${T.green}`,
            }}>
              <div style={{
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.14em',
                color: T.green, fontWeight: 700, marginBottom: 12,
              }}>Upgrade if</div>
              <ul style={{ paddingLeft: 18, margin: 0, color: T.ink, lineHeight: 1.7, fontSize: 15 }}>
                <li>You handle sensitive client data (legal, healthcare, finance)</li>
                <li>You need Cyber Essentials certification</li>
                <li>Staff use personal devices for work email</li>
                <li>You'd struggle if a stolen laptop wasn't wiped within the hour</li>
                <li>You currently pay for a separate AV / MDM / DLP tool</li>
              </ul>
            </div>
            <div style={{
              background: T.paper,
              border: `2px solid ${T.red}`,
              padding: 28,
              boxShadow: `4px 4px 0 0 ${T.red}`,
            }}>
              <div style={{
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.14em',
                color: T.redInk, fontWeight: 700, marginBottom: 12,
              }}>Maybe skip if</div>
              <ul style={{ paddingLeft: 18, margin: 0, color: T.ink, lineHeight: 1.7, fontSize: 15 }}>
                <li>Under 3 staff and all work-issued devices</li>
                <li>You have no client data and no compliance obligations</li>
                <li>You already have full-stack security elsewhere</li>
                <li>Cost is genuinely the blocker: Standard + good practice is OK</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: T.ink, padding: '72px 32px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>Need a licence audit?</Eyebrow>
          <DisplayHead size={40} light style={{ marginBottom: 16 }}>We'll show you what you actually need</DisplayHead>
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.65,
            margin: '0 auto 28px', maxWidth: '46ch',
          }}>
            20 minutes. We'll review your current setup, tell you whether Premium is worth the upgrade, and how to roll it out cleanly.
          </p>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 24px',
            background: T.accent, color: readableOn(T.accent),
            border: `2px solid ${T.white}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
            textDecoration: 'none',
            boxShadow: `4px 4px 0 0 ${T.yellow}`,
          }}>Book a licence audit →</Link>
        </div>
        <LastReviewed light />
      </section>
    </>
  );
};

export default MicrosoftPremiumPageV2;
