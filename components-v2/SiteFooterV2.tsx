import React from 'react';
import { Link } from 'react-router-dom';
import { T, useWindowWidth, useContentMax, useNow } from './primitives';
import { openCookieSettings } from '../utils/consent';

const BRAND = {
  phone:     '01584 517 234',
  phoneHref: 'tel:+441584517234',
  email:     'hello@fresh-tech.uk',
};

const COLS = [
  {
    h: 'Services',
    links: [
      { l: 'Managed IT Support', h: '/services/managed-it-support'      },
      { l: 'Cyber Security',     h: '/services/cybersecurity'           },
      { l: 'Microsoft 365',      h: '/services/cloud-solutions'         },
      { l: 'Cloud Backup',       h: '/services/backup-disaster-recovery'},
      { l: 'Phone Systems',      h: '/services/cloud-phone-systems'  },
      { l: 'IT Health Check',    h: '/it-health-check'                  },
      { l: 'Email Security Check', h: '/email-security-check'           },
      { l: 'Foundation Monitoring', h: '/foundation-monitoring'         },
      { l: 'Compare plans',      h: '/compare'                          },
      { l: 'Co-Managed IT',      h: '/co-managed-it'                    },
      { l: 'All services →',     h: '/services'                         },
    ],
  },
  {
    h: 'Sectors',
    links: [
      { l: 'Solicitors',    h: '/industries/solicitors'    },
      { l: 'Accountants',   h: '/industries/accountants'   },
      { l: 'Manufacturing', h: '/industries/manufacturing' },
      { l: 'Healthcare',    h: '/industries/healthcare'    },
      { l: 'Charities',     h: '/industries/charities'     },
      { l: 'Agriculture',   h: '/industries/agriculture'   },
    ],
  },
  {
    h: 'Company',
    links: [
      { l: 'About us',           h: '/about'         },
      { l: 'Pricing',            h: '/pricing'       },
      { l: 'Why trust us',       h: '/why-trust-us'  },
      { l: 'Technology stack',   h: '/technology-stack'  },
      { l: 'Service standards',  h: '/service-standards' },
      { l: 'Switching provider', h: '/onboarding'    },
      { l: 'Case Studies',       h: '/case-studies'  },
      { l: 'Blog',               h: '/blog'          },
      { l: 'Careers',            h: '/careers'       },
      { l: 'Refer a business',   h: '/refer'         },
      { l: 'Contact',            h: '/contact'       },
    ],
  },
  {
    h: 'Coverage',
    links: [
      { l: 'IT Support Shropshire',     h: '/it-support-shropshire'     },
      { l: 'IT Support Herefordshire',  h: '/it-support-herefordshire'  },
      { l: 'IT Support Worcestershire', h: '/it-support-worcestershire' },
      { l: 'IT Support Powys',          h: '/it-support-powys'          },
    ],
  },
] as const;

export const SiteFooterV2: React.FC = () => {
  const width    = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width < 1024;
  const year     = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric', timeZone: 'Europe/London',
  }).format(useNow());

  return (
    <footer style={{ background: T.ink }}>
      <div style={{
        background: T.primaryDark,
        borderTop: `3px solid ${T.ink}`,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: isMobile ? '40px 20px' : '48px 32px',
      }}>
        <div style={{
          maxWidth: useContentMax(1320),
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 24,
        }}>
          <div>
            <div style={{
              fontFamily: "'Bungee', sans-serif",
              fontSize: isMobile ? 24 : 32,
              color: T.white,
              lineHeight: 1,
              marginBottom: 10,
            }}>
              Ready to make IT someone else's problem?
            </div>
            <div style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: 15,
              color: 'rgba(255,255,255,0.75)',
              fontWeight: 500,
            }}>
              A 20-min call is enough to know if we're a good fit. We'll tell you honestly if we're not.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
            <Link to="/contact" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 24px',
              background: T.accent,
              color: T.ink,
              border: `2px solid ${T.ink}`,
              boxShadow: '4px 4px 0 0 rgba(0,0,0,0.3)',
              fontFamily: "'Archivo', sans-serif",
              fontWeight: 700,
              fontSize: '15px',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}>Book a 20-min call →</Link>
            <a href={BRAND.phoneHref} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 24px',
              background: 'transparent',
              color: T.white,
              border: '2px solid rgba(255,255,255,0.25)',
              fontFamily: "'Archivo', sans-serif",
              fontWeight: 600,
              fontSize: '15px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}>{BRAND.phone}</a>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: useContentMax(1320),
        margin: '0 auto',
        padding: isMobile ? '48px 20px 32px' : '64px 32px 40px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1.5fr 1fr 1fr 1fr 1fr',
          gap: isMobile ? 40 : 48,
        }}>
          <div>
            <Link to="/" style={{ display: 'inline-block', marginBottom: 20, lineHeight: 0 }}>
              <img
                src="https://res.cloudinary.com/djkmeg5se/image/upload/w_200,f_auto,q_auto/fresh-tech-logo-white.png"
                alt="Fresh Tech"
                style={{ height: 44, width: 'auto', display: 'block' }}
              />
            </Link>
            <p style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: 14,
              lineHeight: 1.65,
              color: 'rgba(251,246,236,0.6)',
              margin: '0 0 20px',
              maxWidth: 300,
            }}>
              Locally-owned managed IT support across Shropshire, Herefordshire and the Welsh Borders. Employee-led, no call centres, since 2014.
            </p>
            <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: 14, lineHeight: 1.8 }}>
              <a href={BRAND.phoneHref} style={{
                display: 'block',
                color: T.paper,
                textDecoration: 'none',
                fontWeight: 700,
              }}>{BRAND.phone}</a>
              <a href={`mailto:${BRAND.email}`} style={{
                display: 'block',
                color: 'rgba(251,246,236,0.6)',
                textDecoration: 'none',
              }}>{BRAND.email}</a>
              <div style={{ color: 'rgba(251,246,236,0.6)', marginTop: 2, fontSize: 13 }}>
                28 Livesey Avenue · Ludlow · SY8 1HN
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
              {['Cyber Essentials', 'Microsoft Partner (CSP)', 'Huntress Partner', 'Customer reviews'].map(label => (
                <div key={label} style={{
                  padding: '5px 10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontFamily: "'Archivo Narrow', sans-serif",
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: 'rgba(251,246,236,0.5)',
                }}>{label}</div>
              ))}
            </div>
          </div>

          {COLS.map(col => (
            <div key={col.h}>
              <div style={{
                fontFamily: "'Bungee', sans-serif",
                fontSize: 13,
                color: T.yellow,
                letterSpacing: '0.04em',
                marginBottom: 18,
              }}>{col.h}</div>
              <ul style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 9,
              }}>
                {col.links.map(({ l, h }) => (
                  <li key={l}>
                    <Link
                      to={h}
                      style={{
                        fontFamily: "'Archivo', sans-serif",
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'rgba(251,246,236,0.65)',
                        textDecoration: 'none',
                        transition: 'color 120ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = T.paper; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(251,246,236,0.65)'; }}
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 56,
          paddingTop: 20,
          borderTop: '1px solid rgba(251,246,236,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: 11,
          letterSpacing: '0.05em',
          color: 'rgba(251,246,236,0.6)',
        }}>
          <div>
            © {year} Fresh Tech I.T. Specialists · FRESH PCS CONSULTANCY LTD · Co. No. 09296207 · VAT GB199976510 · ICO ZA136732
            {' · '}
            <Link to="/privacy-policy" style={{ color: 'inherit' }}>Privacy</Link>
            {' · '}
            <Link to="/cookie-policy" style={{ color: 'inherit' }}>Cookies</Link>
            {' · '}
            <button
              type="button"
              onClick={openCookieSettings}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                color: 'inherit', font: 'inherit', letterSpacing: 'inherit', textDecoration: 'underline',
              }}
            >Cookie settings</button>
            {' · '}
            <Link to="/terms-conditions" style={{ color: 'inherit' }}>Terms</Link>
            {' · '}
            <Link to="/terms-of-business" style={{ color: 'inherit' }}>Terms of Business</Link>
            {' · '}
            <Link to="/dpa" style={{ color: 'inherit' }}>DPA</Link>
            {' · '}
            <Link to="/ai-acceptable-use-policy" style={{ color: 'inherit' }}>AI Policy</Link>
          </div>
          <div>Built locally in Ludlow · No call centres harmed in the making of this service.</div>
        </div>
      </div>
    </footer>
  );
};
