import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { T } from './primitives';

const BRAND = {
  phone:     '01584 517 234',
  phoneHref: 'tel:+441584517234',
  email:     'hello@fresh-tech.uk',
};

const NAV_LINKS = [
  { label: 'Services',     href: '/services'     },
  { label: 'Pricing',      href: '/pricing'      },
  { label: 'Why Trust Us', href: '/why-trust-us' },
  { label: 'About',        href: '/about'        },
];

const SECTOR_LINKS = [
  { label: 'Solicitors & Legal',  href: '/industries/solicitors'    },
  { label: 'Accountants',         href: '/industries/accountants'   },
  { label: 'Manufacturing',       href: '/industries/manufacturing' },
  { label: 'Healthcare',          href: '/industries/healthcare'    },
  { label: 'Charities',           href: '/industries/charities'     },
  { label: 'Agriculture',         href: '/industries/agriculture'   },
];

const RESOURCE_LINKS = [
  { label: 'Blog',                            href: '/blog',                       desc: 'Plain-English IT advice'    },
  { label: 'Case Studies',                    href: '/case-studies',               desc: 'Real client outcomes'        },
  { label: 'Free Email Security Check',       href: '/email-security-check',       desc: 'SPF, DKIM & DMARC, instant', tag: 'Free' },
  { label: 'Free IT Health Check',            href: '/it-health-check',            desc: '8-area audit, plain report', tag: 'Free' },
  { label: 'Free AI Use Policy Template',     href: '/ai-acceptable-use-policy',   desc: '27 sections, copy + edit',   tag: 'Free' },
  { label: 'Business Premium guide',          href: '/microsoft-business-premium', desc: 'Is the upgrade worth it?'    },
];

interface SiteNavV2Props {
  activePage?: string;
}

export const SiteNavV2: React.FC<SiteNavV2Props> = ({ activePage }) => {
  const location = useLocation();

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [sectorOpen,  setSectorOpen]  = useState(false);
  const [resourceOpen, setResourceOpen] = useState(false);
  const sectorButton = useRef<HTMLButtonElement>(null);
  const resourceButton = useRef<HTMLButtonElement>(null);
  const [scrolled,    setScrolled]    = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => { setMenuOpen(false); setSectorOpen(false); setResourceOpen(false); }, [location.pathname]);

  const linkStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 12px',
    fontFamily: "'Archivo', sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    color: active ? T.primary : T.ink,
    textDecoration: 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: active ? `2px solid ${T.primary}` : '2px solid transparent',
    transition: 'color 150ms, border-color 150ms',
  });

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        background: T.paper,
        borderBottom: `3px solid ${T.ink}`,
        boxShadow: scrolled ? '0 4px 24px rgba(15,25,35,0.14)' : 'none',
        transition: 'box-shadow 250ms',
      }}>
          <div className="ft-nav-desktop ft-nav-strap" style={{
            background: T.ink,
            color: T.paper,
            padding: '7px 32px',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: "'Archivo Narrow', sans-serif",
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}>
            <span style={{ color: 'rgba(251,246,236,0.55)' }}>
              Serving Shropshire · Herefordshire · Welsh Borders · Est. 2014
            </span>
            <span style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: T.paper,
                  display: 'inline-block',
                }} />
                <span style={{ color: T.yellow }}>Helpdesk hours · Mon–Fri, 9am–5pm</span>
              </span>
              <a href={BRAND.phoneHref} style={{ color: 'rgba(251,246,236,0.8)', textDecoration: 'none' }}>
                {BRAND.phone}
              </a>
            </span>
          </div>

        <div className="ft-nav-inner" style={{
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}>
          <Link to="/" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', lineHeight: 0 }}>
            <img
              src="https://res.cloudinary.com/djkmeg5se/image/upload/w_200,f_auto,q_auto/fresh-tech-logo.png"
              alt="Fresh Tech"
              className="ft-nav-logo"
              style={{ width: 'auto', display: 'block' }}
            />
          </Link>

            <div className="ft-nav-mobile" style={{ alignItems: 'center', gap: 16 }}>
              <a href={BRAND.phoneHref} style={{
                fontFamily: "'Archivo', sans-serif",
                fontSize: '13px',
                fontWeight: 700,
                color: T.primaryDark,
                textDecoration: 'none',
              }}>{BRAND.phone}</a>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                style={{
                  background: menuOpen ? T.ink : 'transparent',
                  border: `2.5px solid ${T.ink}`,
                  width: 44, height: 44,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 200ms',
                }}
              >
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    display: 'block',
                    width: 20,
                    height: 2.5,
                    background: menuOpen ? T.paper : T.ink,
                    borderRadius: 1,
                    transition: 'all 220ms',
                    transform: menuOpen
                      ? (i === 0 ? 'translateY(7.5px) rotate(45deg)'
                        : i === 2 ? 'translateY(-7.5px) rotate(-45deg)'
                        : 'scaleX(0)')
                      : 'none',
                  }} />
                ))}
              </button>
            </div>
            <div className="ft-nav-desktop ft-nav-desktop-main">
              <nav style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1, justifyContent: 'center' }}>
                {NAV_LINKS.map(link => (
                  <Link
                    key={link.label}
                    to={link.href}
                    style={linkStyle(activePage === link.label)}
                    onMouseEnter={e => { if (activePage !== link.label) e.currentTarget.style.color = T.primary; }}
                    onMouseLeave={e => { if (activePage !== link.label) e.currentTarget.style.color = T.ink; }}
                  >
                    {link.label}
                  </Link>
                ))}

                <div
                  style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={() => setSectorOpen(true)}
                  onMouseLeave={e => { if (!e.currentTarget.contains(document.activeElement)) setSectorOpen(false); }}
                  onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setSectorOpen(false); }}
                  onKeyDown={e => { if (e.key === 'Escape') { setSectorOpen(false); sectorButton.current?.focus(); e.stopPropagation(); } }}
                >
                  <Link
                    to="/industries"
                    style={{
                      ...linkStyle(activePage === 'Sectors'),
                      borderBottom: activePage === 'Sectors' ? `2px solid ${T.primary}` : '2px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '7px 12px',
                    }}
                    onMouseEnter={e => { if (activePage !== 'Sectors') e.currentTarget.style.color = T.primary; }}
                    onMouseLeave={e => { if (activePage !== 'Sectors') e.currentTarget.style.color = T.ink; }}
                  >
                    Sectors
                  </Link>
                  <button ref={sectorButton} type="button" aria-label="Show sectors links" aria-expanded={sectorOpen} aria-controls="sector-links"
                    onClick={() => setSectorOpen(open => !open)}
                    style={{ background: 'transparent', border: 0, padding: '12px 8px', cursor: 'pointer' }}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{
                      marginTop: 1,
                      opacity: 0.5,
                      transform: sectorOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 180ms',
                    }}>
                      <path d="M1 3l3.5 3L8 3" stroke={T.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {sectorOpen && (
                    <div id="sector-links" style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: T.white,
                      border: `2px solid ${T.ink}`,
                      boxShadow: `4px 4px 0 0 ${T.ink}`,
                      minWidth: 220,
                      zIndex: 300,
                      padding: '6px 0',
                    }}>
                      <div style={{
                        padding: '8px 16px 6px',
                        fontFamily: "'Archivo Narrow', sans-serif",
                        fontSize: '10px',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: T.primary,
                      }}>
                        We work with
                      </div>
                      {SECTOR_LINKS.map(s => (
                        <Link
                          key={s.label}
                          to={s.href}
                          style={{
                            display: 'block',
                            padding: '10px 16px',
                            fontFamily: "'Archivo', sans-serif",
                            fontSize: '13px',
                            fontWeight: 600,
                            color: T.ink,
                            textDecoration: 'none',
                            borderTop: `1px solid ${T.hairline}`,
                            transition: 'background 120ms',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = T.paperDeep; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          {s.label}
                        </Link>
                      ))}
                      <Link
                        to="/industries"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 16px',
                          fontFamily: "'Archivo Narrow', sans-serif",
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          color: T.primary,
                          textDecoration: 'none',
                          borderTop: `1px solid ${T.hairline}`,
                          background: T.paperDeep,
                          transition: 'background 120ms',
                        }}
                      >
                        View all sectors <span>→</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Resources dropdown */}
                <div
                  style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={() => setResourceOpen(true)}
                  onMouseLeave={e => { if (!e.currentTarget.contains(document.activeElement)) setResourceOpen(false); }}
                  onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setResourceOpen(false); }}
                  onKeyDown={e => { if (e.key === 'Escape') { setResourceOpen(false); resourceButton.current?.focus(); e.stopPropagation(); } }}
                >
                  <Link
                    to="/blog"
                    style={{
                      ...linkStyle(activePage === 'Resources'),
                      borderBottom: activePage === 'Resources' ? `2px solid ${T.primary}` : '2px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '7px 12px',
                    }}
                    onMouseEnter={e => { if (activePage !== 'Resources') e.currentTarget.style.color = T.primary; }}
                    onMouseLeave={e => { if (activePage !== 'Resources') e.currentTarget.style.color = T.ink; }}
                  >
                    Resources
                  </Link>
                  <button ref={resourceButton} type="button" aria-label="Show resources links" aria-expanded={resourceOpen} aria-controls="resource-links"
                    onClick={() => setResourceOpen(open => !open)}
                    style={{ background: 'transparent', border: 0, padding: '12px 8px', cursor: 'pointer' }}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{
                      marginTop: 1,
                      opacity: 0.5,
                      transform: resourceOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 180ms',
                    }}>
                      <path d="M1 3l3.5 3L8 3" stroke={T.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {resourceOpen && (
                    <div id="resource-links" style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: T.white,
                      border: `2px solid ${T.ink}`,
                      boxShadow: `4px 4px 0 0 ${T.ink}`,
                      minWidth: 300,
                      zIndex: 300,
                      padding: '6px 0',
                    }}>
                      <div style={{
                        padding: '8px 16px 6px',
                        fontFamily: "'Archivo Narrow', sans-serif",
                        fontSize: '10px',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: T.primary,
                      }}>
                        Read, watch, download
                      </div>
                      {RESOURCE_LINKS.map(r => (
                        <Link
                          key={r.label}
                          to={r.href}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 14,
                            padding: '12px 16px',
                            fontFamily: "'Archivo', sans-serif",
                            color: T.ink,
                            textDecoration: 'none',
                            borderTop: `1px solid ${T.hairline}`,
                            transition: 'background 120ms',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = T.paperDeep; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                              {r.label}
                              {r.tag && (
                                <span style={{
                                  background: T.green, color: T.white,
                                  padding: '1px 6px',
                                  fontFamily: "'Archivo Narrow', sans-serif",
                                  fontSize: 9, fontWeight: 700,
                                  textTransform: 'uppercase', letterSpacing: '0.08em',
                                }}>{r.tag}</span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: 'rgba(15,25,35,0.55)', marginTop: 2 }}>{r.desc}</div>
                          </div>
                          <span style={{ color: T.primary, flexShrink: 0 }}>→</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </nav>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                <a href={BRAND.phoneHref} style={{
                  fontFamily: "'Archivo Narrow', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: T.primaryDark,
                  textDecoration: 'none',
                  letterSpacing: '0.02em',
                }}>{BRAND.phone}</a>
                <Link
                  to="/contact"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    background: T.accent,
                    color: T.ink,
                    border: `2px solid ${T.ink}`,
                    fontFamily: "'Archivo', sans-serif",
                    fontWeight: 700,
                    fontSize: '13px',
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    boxShadow: `3px 3px 0 0 ${T.ink}`,
                    whiteSpace: 'nowrap',
                    transition: 'all 120ms',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translate(-1px,-1px)';
                    e.currentTarget.style.boxShadow = `4px 4px 0 0 ${T.ink}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = `3px 3px 0 0 ${T.ink}`;
                  }}
                >
                  Book a call →
                </Link>
              </div>
            </div>
        </div>
      </header>

      {menuOpen && (
        <div className="ft-nav-mobile-menu" style={{
          position: 'fixed',
          inset: 0,
          zIndex: 199,
          background: T.ink,
          display: 'flex',
          flexDirection: 'column',
          padding: '0 24px 48px',
          overflowY: 'auto',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 280ms cubic-bezier(0.4,0.1,0.2,1)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0 32px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            marginBottom: 8,
          }}>
            <Link to="/" onClick={() => setMenuOpen(false)}>
              <img
                src="https://res.cloudinary.com/djkmeg5se/image/upload/w_200,f_auto,q_auto/fresh-tech-logo-white.png"
                alt="Fresh Tech"
                style={{ height: 38, width: 'auto' }}
              />
            </Link>
            <button aria-label="Close navigation" onClick={() => setMenuOpen(false)} style={{
              background: 'transparent',
              border: '2px solid rgba(255,255,255,0.25)',
              width: 44, height: 44,
              cursor: 'pointer',
              color: T.paper,
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>✕</button>
          </div>

          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {[
              ...NAV_LINKS,
              { label: 'Sectors',   href: '/industries' },
              { label: 'Resources', href: '/blog'       },
            ].map(link => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '18px 0',
                  fontFamily: "'Bungee', sans-serif",
                  fontSize: '26px',
                  lineHeight: 1,
                  color: activePage === link.label ? T.yellow : T.paper,
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {link.label}
              </Link>
            ))}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Blog',                    href: '/blog'                       },
                { label: 'Case Studies',            href: '/case-studies'               },
                { label: 'Free Email Security Check', href: '/email-security-check'      },
                { label: 'Free IT Health Check',    href: '/it-health-check'            },
                { label: 'Free AI Policy Template', href: '/ai-acceptable-use-policy'   },
                { label: 'Switching provider',      href: '/onboarding'                 },
                { label: 'Careers',                 href: '/careers'                    },
                { label: 'Refer a business',        href: '/refer'                      },
              ].map(link => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '13px 0',
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'rgba(251,246,236,0.55)',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link
              to="/contact"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '17px 24px',
                background: T.accent,
                color: T.ink,
                border: '2px solid rgba(255,255,255,0.5)',
                fontFamily: "'Archivo', sans-serif",
                fontWeight: 700,
                fontSize: '16px',
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                boxShadow: `4px 4px 0 0 ${T.yellow}`,
              }}
            >
              Book a 20-min call →
            </Link>
            <a href={BRAND.phoneHref} style={{
              display: 'block',
              textAlign: 'center',
              padding: '14px 24px',
              background: 'transparent',
              color: T.paper,
              border: '2px solid rgba(255,255,255,0.25)',
              fontFamily: "'Archivo', sans-serif",
              fontWeight: 600,
              fontSize: '15px',
              textDecoration: 'none',
            }}>{BRAND.phone}</a>
          </div>
        </div>
      )}
    </>
  );
};
