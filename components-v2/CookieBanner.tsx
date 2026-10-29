import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { T } from './primitives';
import {
  getConsent,
  setConsent,
  CONSENT_EVENT,
  OPEN_SETTINGS_EVENT,
} from '../utils/consent';
import { useFocusTrap } from '../utils/focusTrap';

/**
 * Cookie consent banner + preferences dialog.
 *
 * UK PECR rules baked in: nothing non-essential loads before opt-in, "Reject"
 * is exactly as easy as "Accept" (one click, equal weight), and the choice can
 * be changed any time via the footer "Cookie settings" link (which fires
 * OPEN_SETTINGS_EVENT). Styled to match the comic/superhero theme — small,
 * non-blocking, with a bit of personality.
 */
export const CookieBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // Analytics starts off until the visitor has explicitly chosen otherwise.
  const [analyticsOn, setAnalyticsOn] = useState(false);

  // Decide visibility on mount (client only) and listen for re-open requests.
  useEffect(() => {
    const existing = getConsent();
    if (!existing) {
      // Small delay so the banner never competes with LCP and feels less abrupt.
      const t = setTimeout(() => setShowBanner(true), 900);
      return () => clearTimeout(t);
    }
    setAnalyticsOn(existing.analytics);
  }, []);

  useEffect(() => {
    const openSettings = () => {
      const existing = getConsent();
      setAnalyticsOn(existing ? existing.analytics : false);
      setShowBanner(false);
      setShowSettings(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, openSettings);
  }, []);

  // Sync the toggle if consent changes elsewhere.
  useEffect(() => {
    const sync = () => {
      const existing = getConsent();
      if (existing) setAnalyticsOn(existing.analytics);
    };
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  const acceptAll = () => {
    setConsent(true);
    setShowBanner(false);
    setShowSettings(false);
  };
  const rejectAll = () => {
    setConsent(false);
    setShowBanner(false);
    setShowSettings(false);
  };
  const savePrefs = () => {
    setConsent(analyticsOn);
    setShowSettings(false);
    setShowBanner(false);
  };

  if (!showBanner && !showSettings) return null;

  return (
    <>
      {showBanner && !showSettings && (
        <BannerCard
          onAccept={acceptAll}
          onReject={rejectAll}
          onCustomise={() => {
            setShowSettings(true);
            setShowBanner(false);
          }}
        />
      )}
      {showSettings && (
        <SettingsDialog
          analyticsOn={analyticsOn}
          setAnalyticsOn={setAnalyticsOn}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onSave={savePrefs}
          onClose={() => {
            setShowSettings(false);
            // Closing without choosing leaves the question open, so the
            // banner returns for first-time visitors.
            if (!getConsent()) setShowBanner(true);
          }}
        />
      )}
    </>
  );
};

// ── Banner ──────────────────────────────────────────────────────────────────

const BannerCard: React.FC<{
  onAccept: () => void;
  onReject: () => void;
  onCustomise: () => void;
}> = ({ onAccept, onReject, onCustomise }) => (
  <div
    role="dialog"
    aria-label="Cookie notice"
    aria-live="polite"
    className="no-print"
    style={{
      position: 'fixed',
      left: 16,
      right: 16,
      bottom: 16,
      zIndex: 2147483000,
      maxWidth: 460,
      margin: '0 auto 0 0',
      background: T.white,
      border: `3px solid ${T.ink}`,
      boxShadow: `6px 6px 0 0 ${T.ink}`,
      animation: 'ftSlideUp 0.3s cubic-bezier(0.2,0.7,0.2,1) both',
    }}
  >
    <style>{ftKeyframes}</style>
    <div style={{ height: 7, background: T.accent, borderBottom: `3px solid ${T.ink}` }} />
    <div style={{ padding: '18px 20px 20px' }}>
      <div
        style={{
          display: 'inline-block',
          background: T.yellow,
          color: T.ink,
          border: `2px solid ${T.ink}`,
          boxShadow: `2px 2px 0 0 ${T.ink}`,
          padding: '3px 9px',
          font: "800 10px/1 'Archivo', sans-serif",
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          transform: 'rotate(-2deg)',
          marginBottom: 12,
        }}
      >
        🍪 One quick thing
      </div>

      <h2
        style={{
          font: "400 20px/1 'Bungee', sans-serif",
          color: T.ink,
          margin: '0 0 8px',
        }}
      >
        Cookies. Bleh.
      </h2>

      <p
        style={{
          font: "500 14px/1.5 'Archivo', sans-serif",
          color: 'rgba(15,25,35,0.78)',
          margin: '0 0 16px',
        }}
      >
        Not the tasty kind, sadly. The site works fine without them, but a couple
        help us see which pages actually get read so we can make this place less
        rubbish. Totally your call.{' '}
        <Link
          to="/cookie-policy"
          style={{ color: T.primaryDark, fontWeight: 700, textDecoration: 'underline' }}
        >
          The boring details
        </Link>
        .
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <BannerBtn onClick={onAccept} bg={T.green} fg="#fff">
          Accept
        </BannerBtn>
        <BannerBtn onClick={onReject} bg={T.white} fg={T.ink}>
          Reject
        </BannerBtn>
        <button
          type="button"
          onClick={onCustomise}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(15,25,35,0.6)',
            font: "700 13px/1 'Archivo', sans-serif",
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: '8px 4px',
            marginLeft: 'auto',
          }}
        >
          Let me choose
        </button>
      </div>
    </div>
  </div>
);

const BannerBtn: React.FC<{
  onClick: () => void;
  bg: string;
  fg: string;
  children: React.ReactNode;
}> = ({ onClick, bg, fg, children }) => (
  <button
    type="button"
    onClick={onClick}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translate(-1px,-1px)';
      e.currentTarget.style.boxShadow = `4px 4px 0 0 ${T.ink}`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = `3px 3px 0 0 ${T.ink}`;
    }}
    style={{
      background: bg,
      color: fg,
      border: `2.5px solid ${T.ink}`,
      boxShadow: `3px 3px 0 0 ${T.ink}`,
      padding: '10px 20px',
      font: "800 14px/1 'Archivo', sans-serif",
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      transition: 'all 0.12s ease',
    }}
  >
    {children}
  </button>
);

// ── Settings dialog ───────────────────────────────────────────────────────────

interface SettingsProps {
  analyticsOn: boolean;
  setAnalyticsOn: (v: boolean) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSave: () => void;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsProps> = ({
  analyticsOn,
  setAnalyticsOn,
  onAcceptAll,
  onRejectAll,
  onSave,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  // Focus moves to the heading on open, stays inside, Escape closes and
  // focus returns to the opener on close.
  useFocusTrap(ref, true, onClose);

  return (
    <div
      className="no-print"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483001,
        background: 'rgba(15,25,35,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'ftFade 0.2s ease both',
      }}
    >
      <style>{ftKeyframes}</style>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ft-cookie-settings-title"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: T.white,
          border: `3px solid ${T.ink}`,
          boxShadow: `8px 8px 0 0 ${T.ink}`,
          animation: 'ftSlideUp 0.25s cubic-bezier(0.2,0.7,0.2,1) both',
        }}
      >
        <div style={{ height: 7, background: T.accent, borderBottom: `3px solid ${T.ink}` }} />
        <div style={{ padding: '22px 24px 24px' }}>
          <h2
            id="ft-cookie-settings-title"
            tabIndex={-1}
            data-autofocus
            style={{
              font: "400 24px/1 'Bungee', sans-serif",
              color: T.ink,
              margin: '0 0 6px',
              outline: 'none',
            }}
          >
            Pick your cookies
          </h2>
          <p
            style={{
              font: "500 14px/1.5 'Archivo', sans-serif",
              color: 'rgba(15,25,35,0.7)',
              margin: '0 0 20px',
            }}
          >
            Essentials keep the site working. The rest is up to you: flip it off
            and we won't load it.
          </p>

          <CategoryRow
            title="Strictly necessary"
            desc="Remembers your cookie choice and keeps core features working. Always on, because the site can't function without them."
            locked
            on
          />
          <CategoryRow
            title="Analytics"
            desc="Google Analytics & Microsoft Clarity. Anonymous stats on which pages get read and where people get stuck, so we can improve them."
            on={analyticsOn}
            onToggle={() => setAnalyticsOn(!analyticsOn)}
          />

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginTop: 22,
              alignItems: 'center',
            }}
          >
            <BannerBtn onClick={onSave} bg={T.primaryDark} fg="#fff">
              Save choices
            </BannerBtn>
            <BannerBtn onClick={onAcceptAll} bg={T.green} fg="#fff">
              Accept all
            </BannerBtn>
            <BannerBtn onClick={onRejectAll} bg={T.white} fg={T.ink}>
              Reject all
            </BannerBtn>
          </div>

          <div style={{ marginTop: 18, fontSize: 13 }}>
            <Link
              to="/cookie-policy"
              onClick={onClose}
              style={{ color: T.primaryDark, fontWeight: 700, textDecoration: 'underline' }}
            >
              Read the full cookie policy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryRow: React.FC<{
  title: string;
  desc: string;
  on: boolean;
  locked?: boolean;
  onToggle?: () => void;
}> = ({ title, desc, on, locked, onToggle }) => (
  <div
    style={{
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
      padding: '14px 0',
      borderTop: `1px solid ${T.hairline}`,
    }}
  >
    <div style={{ flex: 1 }}>
      <div style={{ font: "800 15px/1.2 'Archivo', sans-serif", color: T.ink, marginBottom: 3 }}>
        {title}
      </div>
      <div style={{ font: "500 13px/1.5 'Archivo', sans-serif", color: 'rgba(15,25,35,0.65)' }}>
        {desc}
      </div>
    </div>
    <Toggle on={on} locked={locked} onToggle={onToggle} label={title} />
  </div>
);

const Toggle: React.FC<{
  on: boolean;
  locked?: boolean;
  onToggle?: () => void;
  label: string;
}> = ({ on, locked, onToggle, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={locked}
    onClick={onToggle}
    style={{
      flexShrink: 0,
      width: 52,
      height: 30,
      borderRadius: 999,
      border: `2.5px solid ${T.ink}`,
      background: on ? T.green : '#D9D2C4',
      position: 'relative',
      cursor: locked ? 'not-allowed' : 'pointer',
      opacity: locked ? 0.7 : 1,
      transition: 'background 0.15s ease',
      padding: 0,
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: 1.5,
        left: on ? 23 : 1.5,
        width: 21,
        height: 21,
        borderRadius: '50%',
        background: T.white,
        border: `2px solid ${T.ink}`,
        transition: 'left 0.15s ease',
      }}
    />
  </button>
);

const ftKeyframes = `
@keyframes ftSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ftFade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  [class] { animation-duration: 0.01ms !important; }
}
`;

export default CookieBanner;
