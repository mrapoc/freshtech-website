import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { T, useWindowWidth, useContentMax, Eyebrow, DisplayHead } from '../components-v2/primitives';
import { LiveStats } from '../components/LiveStats';
import { LastReviewed } from '../components-v2/LastReviewed';

const halftoneCss = (color: string, dot = 1.4, grid = 12) => ({
  backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot}px)`,
  backgroundSize: `${grid}px ${grid}px`,
});

export const ServiceStandardsPageV2: React.FC = () => {
  const ww       = useWindowWidth();
  const isMobile = ww < 768;

  return (
    <>
      <SEO
        title="Our Service Standards and Helpdesk Performance"
        description="See our helpdesk report for average call wait, response times and customer feedback. Read how we report performance and browse selected customer reviews."
        type="website"
      />

      {/* HERO */}
      <section style={{
        background: T.ink,
        padding: isMobile ? '56px 20px 56px' : '72px 32px 72px',
        ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 13),
      }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <Eyebrow light>Helpdesk performance</Eyebrow>
          <DisplayHead as="h1" size={isMobile ? 34 : 50} light style={{ marginBottom: 20, lineHeight: 0.97, maxWidth: '18ch' }}>
            See how our helpdesk is performing.
          </DisplayHead>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px', lineHeight: 1.65, margin: '0 0 12px', maxWidth: '60ch' }}>
            The report below comes from our helpdesk system. It shows average response and call wait times when the source is available.
          </p>
        </div>
      </section>

      {/* LIVE METRICS */}
      <section style={{ background: T.ink, padding: isMobile ? '0 12px 48px' : '0 24px 64px' }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <LiveStats variant="contained" />
        </div>
      </section>

      {/* HOW WE MEASURE */}
      <section style={{ background: T.paper, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <Eyebrow>How these numbers work</Eyebrow>
          <DisplayHead size={32} style={{ marginBottom: 16 }}>Where the figures come from.</DisplayHead>
          <p style={{ fontSize: '16px', color: 'rgba(15,25,35,0.7)', lineHeight: 1.7, margin: '0 0 16px', maxWidth: '64ch' }}>
            <strong style={{ color: T.ink }}>Average response time</strong> covers the last 30 days. <strong style={{ color: T.ink }}>Average call wait</strong> is supplied by the same helpdesk report. The retrieval time shows when this page fetched the report, not when the source data last changed.
          </p>
          <p style={{ fontSize: '16px', color: 'rgba(15,25,35,0.7)', lineHeight: 1.7, margin: 0, maxWidth: '64ch' }}>
            If the report cannot be loaded, we show that it is unavailable. These averages describe past service and are not a guaranteed response time for an individual request.
          </p>
        </div>
      </section>

      {/* WHAT THIS MEANS */}
      <section style={{ background: T.paperDeep, padding: '72px 32px', borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: useContentMax(1100), margin: '0 auto' }}>
          <div style={{ marginBottom: 36 }}>
            <Eyebrow>What you actually get</Eyebrow>
            <DisplayHead size={32} style={{ marginBottom: 12 }}>Behind the numbers</DisplayHead>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { h: 'Unlimited support', p: 'No per-ticket charges and no clock-watching. Your team calls as often as they need, and the price doesn’t change.' },
              { h: 'Real people, locally', p: 'You speak to named engineers who know your setup, not a different stranger reading a script every time.' },
              { h: 'Customer reviews', p: 'Our public review rating reflects how this feels in practice: fast, friendly and genuinely helpful.' },
            ].map((c, i) => (
              <div key={i} style={{ background: T.white, border: `1px solid ${T.hairline}`, padding: 26, boxShadow: '0 4px 16px rgba(15,25,35,0.06)' }}>
                <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '17px', color: T.primary, marginBottom: 10, lineHeight: 1.1 }}>{c.h}</div>
                <p style={{ fontSize: '14px', color: 'rgba(15,25,35,0.65)', lineHeight: 1.65, margin: 0 }}>{c.p}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '15px', color: 'rgba(15,25,35,0.55)', lineHeight: 1.65, margin: '28px 0 0', maxWidth: '64ch' }}>
            Want the full story on how we earn that trust? See <Link to="/why-trust-us" style={{ color: T.primary, fontWeight: 600 }}>why businesses trust us</Link>.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: T.ink, padding: '72px 32px', ...halftoneCss('rgba(255,255,255,0.04)', 1.4, 14) }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow light>See it for yourself</Eyebrow>
          <DisplayHead size={36} light style={{ marginBottom: 16 }}>Put us to the test</DisplayHead>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '17px', lineHeight: 1.65, margin: '0 auto 28px', maxWidth: '46ch' }}>
            A 20-minute call, an honest assessment of where you are, and numbers we&rsquo;re happy to be measured against.
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

export default ServiceStandardsPageV2;
