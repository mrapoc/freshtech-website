import React from 'react';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, useContentMax, Eyebrow, DisplayHead } from '../components-v2/primitives';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

interface OpenRole {
  title: string;
  type: string;
  location: string;
  summary: string;
  href: string;
}

// SLOT: update when there's a real opening. Empty array shows the
// 'no roles open' state with a speculative-application CTA.
const OPEN_ROLES: OpenRole[] = [];

const WHY = [
  { title: 'Small team, real responsibility', desc: "We're not a call centre. Every engineer owns their client relationships. You'll talk to the same businesses regularly and actually know their setups." },
  { title: 'Based in Ludlow',                  desc: 'Proper market town. Not a commute into Birmingham. The role involves some field work across Shropshire, so you\'ll see a lot of good countryside between calls.' },
  { title: 'No ticket-queue culture',          desc: "We don't measure engineers on tickets closed. We measure on client satisfaction. If fixing something properly takes longer, it takes longer." },
  { title: 'Good kit, sensible tools',         desc: "You'll have the tools to do the job properly: RMM, PSA, M365 admin, proper documentation. No fighting legacy systems." },
];

export const CareersPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;
  const hasRoles = OPEN_ROLES.length > 0;

  return (
    <>
      <SEO
        title="Careers: Work With Fresh Tech in Ludlow"
        description="Join Fresh Tech, a small, locally-owned IT team in Ludlow. No call-centre culture, no ticket quotas. Real client work, good kit, Shropshire countryside."
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
          gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr',
          gap: isMobile ? 36 : 64,
          alignItems: 'center',
        }}>
          <div>
            <Eyebrow light>Work with us</Eyebrow>
            <DisplayHead as="h1" size={isMobile ? 38 : 52} light style={{ marginBottom: 20, lineHeight: 1.0 }}>
              Good IT people, wanted.
            </DisplayHead>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 18, lineHeight: 1.65, margin: '0 0 12px', maxWidth: '46ch' }}>
              We're a small, locally-owned IT company in Ludlow. We support businesses properly, not from a call centre, not by closing tickets on a quota. If that sounds like what you're looking for, read on.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.65, margin: '0 0 28px', maxWidth: '44ch' }}>
              We're not always hiring, but we're always interested in talking to good engineers. If there's no role open below, send a note to <a href="mailto:hello@fresh-tech.uk" style={{ color: T.primary, fontWeight: 700, textDecoration: 'none' }}>hello@fresh-tech.uk</a> anyway.
            </p>
            <a href="#roles" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 24px',
              background: T.accent, color: T.white,
              border: `2px solid ${T.white}`,
              fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
              textDecoration: 'none',
              boxShadow: `4px 4px 0 0 ${T.yellow}`,
            }}>{hasRoles ? `See ${OPEN_ROLES.length} open role${OPEN_ROLES.length > 1 ? 's' : ''} ↓` : 'Send a speculative application →'}</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: 'Ludlow', l: 'Based in Shropshire since 2014' },
              { n: hasRoles ? String(OPEN_ROLES.length) : '0', l: hasRoles ? 'Open roles right now' : 'No open roles right now' },
              { n: 'Small', l: 'Team, everyone knows what everyone is doing' },
            ].map(({ n, l }, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '20px 22px',
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

      {/* WHY */}
      <section style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>Why work here</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 8 }}>What makes us different to work for</DisplayHead>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: 20,
          }}>
            {WHY.map(({ title, desc }, i) => (
              <div key={i} style={{
                background: T.white,
                border: `1px solid ${T.hairline}`,
                padding: 24,
                boxShadow: '0 2px 8px rgba(15,25,35,0.04)',
              }}>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 17, marginBottom: 10, lineHeight: 1.1 }}>{title}</div>
                <div style={{ fontSize: 14, color: 'rgba(15,25,35,0.62)', lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIRECTOR'S NOTE */}
      <section style={{ background: T.paperDeep, padding: '64px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '80px 1fr',
          gap: 24,
          alignItems: 'start',
        }}>
          <div style={{
            width: 72, height: 72,
            borderRadius: '50%',
            background: T.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Bungee', sans-serif", fontSize: 20, color: T.white,
            flexShrink: 0,
          }}>SJ</div>
          <div>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 14, color: T.primary, marginBottom: 12 }}>From Sam, Founder</div>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: T.ink, margin: '0 0 16px', fontStyle: 'italic' }}>
              "I started Fresh Tech because I wanted to do IT support the right way: local engineers, real accountability, no hiding behind a ticket system. If you're good at the technical side but frustrated by working for companies that treat clients as numbers, we should talk."
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(15,25,35,0.62)', margin: 0 }}>
              We're a small team so every hire matters. We won't waste your time with a lengthy recruitment process; a call and a practical conversation is all it takes.
            </p>
          </div>
        </div>
      </section>

      {/* OPEN ROLES */}
      <section id="roles" style={{ background: T.white, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Eyebrow>Open roles</Eyebrow>
            <DisplayHead size={36} style={{ marginBottom: 8 }}>{hasRoles ? 'Current openings' : 'No roles open right now'}</DisplayHead>
            {!hasRoles && (
              <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 16, margin: '8px 0 0', maxWidth: '52ch', lineHeight: 1.6 }}>
                We don't have a specific opening at the moment, but good people are always welcome to get in touch. A speculative application to <a href="mailto:hello@fresh-tech.uk" style={{ color: T.primary, fontWeight: 700 }}>hello@fresh-tech.uk</a> will be read by Sam directly.
              </p>
            )}
          </div>
          {hasRoles && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {OPEN_ROLES.map((role, i) => (
                <div key={i} style={{
                  border: `2px solid ${T.ink}`,
                  padding: '28px 32px',
                  boxShadow: `4px 4px 0 0 ${T.ink}`,
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
                  gap: 24,
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 22 }}>{role.title}</div>
                      <div style={{
                        background: T.yellow,
                        border: `2px solid ${T.ink}`,
                        padding: '3px 10px',
                        fontFamily: "'Bungee', sans-serif", fontSize: 10,
                      }}>{role.type}</div>
                    </div>
                    <div style={{
                      fontFamily: "'Archivo Narrow', sans-serif", fontSize: 11,
                      textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700,
                      color: T.primary, marginBottom: 10,
                    }}>📍 {role.location}</div>
                    <p style={{ color: 'rgba(15,25,35,0.62)', fontSize: 15, lineHeight: 1.65, margin: 0, maxWidth: '60ch' }}>{role.summary}</p>
                  </div>
                  <a href={role.href} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '13px 22px',
                    background: T.accent, color: T.white,
                    border: `2px solid ${T.ink}`,
                    fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 14,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    boxShadow: `3px 3px 0 0 ${T.ink}`,
                  }}>Apply →</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: T.ink, padding: '64px 32px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14),
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>Get in touch</Eyebrow>
          <DisplayHead size={40} light style={{ marginBottom: 14 }}>Interested? Say hello.</DisplayHead>
          <p style={{
            color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.65,
            margin: '0 auto 24px', maxWidth: '40ch',
          }}>
            No long forms. Email Sam directly: one paragraph about yourself and what you're looking for.
          </p>
          <a href="mailto:hello@fresh-tech.uk" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 24px',
            background: T.accent, color: T.white,
            border: `2px solid ${T.white}`,
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 15,
            textDecoration: 'none',
            boxShadow: `3px 3px 0 0 ${T.yellow}`,
          }}>hello@fresh-tech.uk →</a>
        </div>
      </section>
    </>
  );
};

export default CareersPageV2;
