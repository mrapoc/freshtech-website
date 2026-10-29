import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, useContentMax, halftone, Eyebrow, DisplayHead } from '../components-v2/primitives';

const BRAND = {
  phone:     '01584 517 234',
  phoneHref: 'tel:+441584517234',
};

const TIMELINE = [
  { year: '2014', title: 'Founded in Ludlow',         desc: 'Sam started Fresh Tech after watching local businesses get ignored by national IT firms with slow response times and no local knowledge. Initially break-fix support, turning up when things broke.' },
  { year: '2017', title: 'Moved to managed services', desc: 'Switched from break-fix to a subscription model: better for clients (predictable costs, things prevented not just fixed), better for us (we could plan ahead).' },
  { year: '2020', title: 'Remote-first pivot',         desc: 'Within two weeks of the first lockdown, every client was securely working from home. Not one lost a working day.' },
  { year: '2022', title: 'Cyber Essentials certified', desc: 'Became certified practitioners and started helping clients achieve the accreditation, now a core part of what we offer.' },
  { year: '2026', title: 'Twelve years in',            desc: "Still locally owned, still based in Ludlow, still answering the phone ourselves. We're proud of that." },
];

const VALUES = [
  { label: 'We answer',     stat: 'By name. Not a bot.' },
  { label: 'We respond',    stat: 'Under 15 minutes.' },
  { label: "We're local",   stat: 'Ludlow, since 2014.' },
  { label: "We're certified", stat: 'Cyber Essentials + MS Partner.' },
];

const BADGES = [
  { emoji: '🛡️', label: 'Cyber Essentials Certified', sub: 'NCSC-approved scheme' },
  { emoji: '🔷', label: 'Microsoft Partner',           sub: 'Cloud & productivity solutions' },
  { emoji: '⭐', label: 'Customer reviews',           sub: 'Read feedback on Google' },
  { emoji: '📅', label: 'Since November 2014',          sub: '12 years serving Shropshire' },
];

interface TeamCardProps {
  name: string;
  role: string;
  power: string;
  bio: string;
  colour: string;
  maskedSrc: string;
  unmaskedSrc: string;
}

const TeamCard: React.FC<TeamCardProps> = ({ name, role, power, bio, colour, maskedSrc, unmaskedSrc }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: 320, height: 480,
        border: `2px solid ${T.ink}`,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: hovered ? `6px 6px 0 0 ${T.ink}` : `3px 3px 0 0 ${T.ink}`,
        transition: 'box-shadow 200ms',
        flexShrink: 0,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: colour, zIndex: 0, ...halftoneCss('rgba(0,0,0,0.12)', 1.4, 8) }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'repeating-conic-gradient(from 0deg,rgba(255,255,255,0.07) 0deg 20deg,transparent 20deg 40deg)',
      }} />

      <img src={maskedSrc} alt={`${name}, masked`} style={{
        position: 'absolute', inset: 0, zIndex: 10,
        width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top',
        opacity: hovered ? 0 : 1,
        transition: 'opacity 400ms',
      }} />
      <img src={unmaskedSrc} alt={name} style={{
        position: 'absolute', inset: 0, zIndex: 9,
        width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 400ms',
      }} />

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
        background: `linear-gradient(to top, ${T.ink} 0%, rgba(15,25,35,0.95) 60%, transparent 100%)`,
        padding: '28px 24px 24px',
        transition: 'transform 300ms',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '22px', color: T.white, lineHeight: 1 }}>{name}</div>
            <div style={{
              fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: T.accent, fontWeight: 700, marginTop: 4,
            }}>{role}</div>
          </div>
          <div style={{
            background: T.yellow, border: `2px solid ${T.ink}`,
            padding: '4px 10px',
            fontFamily: "'Bungee', sans-serif", fontSize: '10px',
            transform: 'rotate(3deg)', whiteSpace: 'nowrap',
          }}>{power}</div>
        </div>
        {hovered && (
          <div style={{
            color: 'rgba(255,255,255,0.65)', fontSize: '13px', lineHeight: 1.6,
            marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 12,
          }}>{bio}</div>
        )}
      </div>

      {hovered && (
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 30,
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: T.white, fontSize: '9px', fontWeight: 700,
          padding: '4px 10px',
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>Identity revealed</div>
      )}
    </div>
  );
};

const halftoneCss = (color: string, dot: number, grid: number) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

export const AboutPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const isTablet = ww < 1024;

  return (
    <>
      <SEO
        title="About Us: Locally-Owned IT Support in Ludlow"
        description="Locally-owned IT support in Ludlow since 2014. No call centres, no ticket queues, just real engineers who know your business. Serving Shropshire and Herefordshire."
        type="profile"
      />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 64px' : '72px 32px 80px',
        ...halftoneCss('rgba(255,255,255,0.045)', 1.4, 13),
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
              fontFamily: "'Bungee', sans-serif",
              fontSize: '12px',
              letterSpacing: '0.08em',
              marginBottom: 24,
              transform: 'rotate(-2deg)',
            }}>Est. November 2014</div>
            <DisplayHead as="h1" size={isMobile ? 38 : 52} light style={{ marginBottom: 20 }}>
              The IT team you wish you'd hired five years ago.
            </DisplayHead>
            <p style={{
              color: 'rgba(255,255,255,0.65)', fontSize: '18px',
              lineHeight: 1.65, margin: '0 0 32px', maxWidth: '42ch',
            }}>
              We're a small team of engineers based in Ludlow, Shropshire. Locally owned, employee-led, no call centres. We fix things fast, explain things plainly, and answer the phone ourselves.
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

          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: 12, right: -12,
              width: '100%', height: '100%',
              background: T.primary,
              border: '2px solid rgba(255,255,255,0.2)',
            }} />
            <div style={{
              position: 'relative',
              background: T.white,
              padding: '12px 12px 56px',
              border: `2px solid ${T.white}`,
            }}>
              <img
                src="https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto,w_900/v1778511802/team-photo-1.jpg"
                alt="Sam James and Matthew Morgan, Fresh Tech engineers, Ludlow"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              <div style={{
                position: 'absolute', bottom: 14, left: 0, right: 0,
                textAlign: 'center',
                fontFamily: "'Bungee', sans-serif", fontSize: '18px', color: T.ink,
              }}>The Fresh Tech Team</div>
            </div>
            <div style={{
              position: 'absolute', bottom: -16, right: -16, zIndex: 2,
              background: T.accent, color: T.white,
              border: `3px solid ${T.ink}`,
              padding: '8px 16px',
              fontFamily: "'Bungee', sans-serif", fontSize: '12px',
              transform: 'rotate(8deg)',
            }}>Ludlow, SY8</div>
          </div>
        </div>
      </section>

      {/* VALUE STRIP */}
      <section style={{ background: T.primary }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        }}>
          {VALUES.map(({ label, stat }, i) => (
            <div key={i} style={{
              padding: '24px 28px',
              borderRight: (!isMobile && i < 3) ? '1px solid rgba(255,255,255,0.15)' : undefined,
              borderBottom: (isMobile && i < 2) ? '1px solid rgba(255,255,255,0.15)' : undefined,
            }}>
              <div style={{
                fontFamily: "'Archivo Narrow', sans-serif", fontSize: '11px',
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 4,
              }}>{label}</div>
              <div style={{
                fontFamily: "'Bungee', sans-serif", fontSize: '18px',
                color: T.white, lineHeight: 1.1,
              }}>{stat}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MISSION */}
      <section style={{ background: T.paper, padding: '80px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr',
          gap: isMobile ? 24 : 64,
          alignItems: 'start',
        }}>
          <div style={{ paddingTop: 8 }}>
            <Eyebrow>Our mission</Eyebrow>
            <DisplayHead size={36}>Why we exist</DisplayHead>
          </div>
          <div>
            <p style={{ fontSize: '20px', lineHeight: 1.65, color: 'rgba(15,25,35,0.62)', margin: '0 0 20px', maxWidth: '56ch' }}>
              Traditional IT support is usually slow, impersonal, or confusing. You raise a ticket, it goes into a queue, someone in a call centre picks it up eventually. Meanwhile your staff can't work.
            </p>
            <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'rgba(15,25,35,0.62)', margin: '0 0 20px', maxWidth: '56ch' }}>
              We built Fresh Tech to do the opposite. Local engineers who know your setup, a phone that gets answered, pricing that doesn't have a "call us for a quote" footnote.
            </p>
            <p style={{ fontSize: '16px', lineHeight: 1.7, color: T.ink, margin: 0, maxWidth: '56ch', fontWeight: 600 }}>
              Our sweet spot is businesses with 5–50 staff in Shropshire, Herefordshire and the Welsh Borders. Big enough to need proper IT. Small enough to want a human relationship.
            </p>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section style={{ background: T.paperDeep, padding: '80px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <Eyebrow>The team</Eyebrow>
            <DisplayHead size={40} style={{ marginBottom: 12 }}>Behind the mask</DisplayHead>
            <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: '16px', margin: 0, maxWidth: '52ch', lineHeight: 1.6 }}>
              Hover a card to reveal the real people behind the IT. We're engineers first, but we enjoy a good pun.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <TeamCard
              name="Sam James"
              role="Founder & Director"
              power="Uptime Avenger"
              colour={T.primary}
              maskedSrc="https://res.cloudinary.com/djkmeg5se/image/upload/w_500,f_auto,q_auto:good/f_auto,q_auto/sam-superhero-masked.png?v=2"
              unmaskedSrc="https://res.cloudinary.com/djkmeg5se/image/upload/w_500,f_auto,q_auto:good/f_auto,q_auto/sam-superhero-unmasked.png?v=2"
              bio="Started Fresh Tech in 2014 after watching local businesses get burned by national IT firms who didn't know Shropshire and didn't care to. Built the kind of support he'd have wanted to hire. Fixes servers. Makes excellent coffee."
            />
            <TeamCard
              name="Matthew Morgan"
              role="Senior Engineer"
              power="Network Whisperer"
              colour={T.primaryDark}
              maskedSrc="https://res.cloudinary.com/djkmeg5se/image/upload/w_500,f_auto,q_auto:good/f_auto,q_auto/matt-superhero-masked.png?v=2"
              unmaskedSrc="https://res.cloudinary.com/djkmeg5se/image/upload/w_500,f_auto,q_auto:good/f_auto,q_auto/matt-superhero-unmasked.png?v=2"
              bio="Deep network and infrastructure knowledge, fast on-site across the region. Probably diagnosed your problem before you've finished explaining it. Specialises in M365, connectivity, and anything that involves a patch panel."
            />
          </div>
        </div>
      </section>

      {/* ORIGIN / TIMELINE */}
      <section style={{ background: T.white, padding: '80px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 40 : 64,
          alignItems: 'start',
        }}>
          <div>
            <Eyebrow>The origin story</Eyebrow>
            <DisplayHead size={40} style={{ marginBottom: 24 }}>How we got here</DisplayHead>
            <div style={{ position: 'relative', paddingLeft: 28, borderLeft: `3px solid ${T.primary}` }}>
              {TIMELINE.map(({ year, title, desc }, i) => (
                <div key={i} style={{ marginBottom: 32, position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: -39, top: 0,
                    background: T.primary,
                    width: 22, height: 22,
                    border: `2px solid ${T.white}`,
                    boxShadow: `0 0 0 2px ${T.primary}`,
                  }} />
                  <div style={{
                    display: 'inline-block',
                    background: T.accent, color: T.white,
                    padding: '2px 10px',
                    fontFamily: "'Bungee', sans-serif", fontSize: '12px',
                    marginBottom: 6,
                  }}>{year}</div>
                  <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: 4 }}>{title}</div>
                  <div style={{ color: 'rgba(15,25,35,0.62)', fontSize: '14px', lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{
              background: T.paper, border: `2px solid ${T.ink}`,
              padding: 40, boxShadow: `5px 5px 0 0 ${T.ink}`,
              marginBottom: 24,
            }}>
              <div style={{
                fontFamily: "'Bungee', sans-serif", fontSize: '64px',
                color: T.primary, lineHeight: 0.8, marginBottom: 16,
              }}>"</div>
              <p style={{
                fontSize: '18px', lineHeight: 1.65, color: T.ink,
                margin: '0 0 20px', fontStyle: 'italic',
              }}>
                We built Fresh Tech to be the IT company we would want to hire. One that answers the phone, speaks plainly, and doesn't disappear when something goes wrong.
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                borderTop: `1px solid ${T.hairline}`, paddingTop: 16,
              }}>
                <div style={{
                  width: 48, height: 48,
                  background: T.paperDeep,
                  border: `2px solid ${T.hairline}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px',
                }}>👤</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>Sam James</div>
                  <div style={{ fontSize: '13px', color: 'rgba(15,25,35,0.62)' }}>Founder, Fresh Tech · Ludlow, 2014</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {BADGES.map(({ emoji, label, sub }, i) => (
                <div key={i} style={{
                  background: T.paper,
                  border: `1px solid ${T.hairline}`,
                  padding: 16,
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <div style={{ fontSize: '22px', flexShrink: 0 }}>{emoji}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', lineHeight: 1.3 }}>{label}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(15,25,35,0.38)', marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section style={{ background: T.paperDeep, padding: '80px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{
          maxWidth: useContentMax(1100), margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr',
          gap: isMobile ? 24 : 64,
          alignItems: 'start',
        }}>
          <div style={{ paddingTop: 8 }}>
            <Eyebrow>In the community</Eyebrow>
            <DisplayHead size={36}>Giving some of it back</DisplayHead>
          </div>
          <div>
            <p style={{ fontSize: '20px', lineHeight: 1.65, color: 'rgba(15,25,35,0.62)', margin: '0 0 20px', maxWidth: '56ch' }}>
              We designed and built a new website for Triffid Explorer Scout Unit in Ludlow, and gave it to them. No invoice: what changed hands was our time rather than anyone's money.
            </p>
            <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'rgba(15,25,35,0.62)', margin: '0 0 20px', maxWidth: '56ch' }}>
              We should be straight about the connection: Sam is one of the unit's leaders, so this was not a cold approach. It did mean we knew exactly what the unit needed, which is usually the hard part of a project like this.
            </p>
            <p style={{ fontSize: '16px', lineHeight: 1.7, color: T.ink, margin: 0, maxWidth: '56ch', fontWeight: 600 }}>
              It is already doing its job. Young people have signed up to the unit after finding it through the new site, which is the only measure of success that counts here.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: T.paper, padding: '80px 32px', borderTop: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow>Next step</Eyebrow>
          <DisplayHead size={40} style={{ marginBottom: 16 }}>Ready to talk?</DisplayHead>
          <p style={{
            color: 'rgba(15,25,35,0.62)', fontSize: '18px', lineHeight: 1.6,
            margin: '0 auto 32px', maxWidth: '44ch',
          }}>
            A 20-minute call is enough to tell you whether we're a good fit, and we'll tell you honestly if we're not.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 28px',
              background: T.accent, color: T.white,
              border: `2px solid ${T.ink}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '16px',
              textDecoration: 'none',
              boxShadow: `4px 4px 0 0 ${T.ink}`,
            }}>Book a 20-min call →</Link>
            <a href={BRAND.phoneHref} style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 28px',
              background: 'transparent', color: T.ink,
              border: `2px solid ${T.ink}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: '16px',
              textDecoration: 'none',
            }}>{BRAND.phone}</a>
          </div>
          <div style={{ marginTop: 20, fontSize: '13px', color: 'rgba(15,25,35,0.38)' }}>
            No commitment. No sales script. Mon–Fri, 9am–5pm.
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutPageV2;
