import React, { useSyncExternalStore, ReactNode, CSSProperties } from 'react';
import { getHydrationSnapshot, SSR_WIDTH } from '../utils/hydration';

export const T = {
  ink:         '#0F1923',
  paper:       '#FBF6EC',
  paperDeep:   '#F1E8D6',
  white:       '#FFFFFF',
  primary:     '#3288BE',
  primaryDark: '#1F5C8C',
  primaryTint: '#7BD2F0',
  accent:      '#E8541F',
  yellow:      '#F5C24A',
  red:         '#C8443A',
  redInk:      '#C03F35', // text-only red: 4.87:1 on paper (T.red is 4.49:1)
  green:       '#2E7D5B',
  greenDeep:   '#1F5B40',
  hairline:    'rgba(15,25,35,0.12)',
} as const;

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

// WCAG relative luminance of a #rgb or #rrggbb colour.
function luminance(hex: string): number {
  const short = hex.slice(1);
  const c = short.length === 3 ? short.split('').map(ch => ch + ch).join('') : short;
  const [r, g, b] = [0, 2, 4].map(i => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Pick ink or white text for a solid hex background (#rgb or #rrggbb only;
// every current caller passes a T token or '#fff'), whichever has the higher
// WCAG contrast. Ink wins on the orange accent (4.83:1 vs 3.67:1). Anything
// that is not a hex colour falls back to ink rather than guessing.
export function readableOn(bg: string): string {
  if (!HEX.test(bg)) return T.ink;
  const l = luminance(bg);
  const ink = (l + 0.05) / (luminance(T.ink) + 0.05);
  const white = (luminance(T.white) + 0.05) / (l + 0.05);
  return ink >= white ? T.ink : T.white;
}

const subscribeWindowWidth = (notify: () => void) => {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('resize', notify);
  return () => window.removeEventListener('resize', notify);
};

const getWindowWidth = () => typeof window === 'undefined' ? SSR_WIDTH : window.innerWidth;
const getServerWidth = () => getHydrationSnapshot()?.width ?? SSR_WIDTH;

// React reads the serialised value during SSR and hydration, including for a
// deferred boundary, then switches that consumer to the real browser width.
export function useWindowWidth(): number {
  return useSyncExternalStore(subscribeWindowWidth, getWindowWidth, getServerWidth);
}

let clientNow = Math.floor(Date.now() / 60_000) * 60_000;
const refreshNow = () => { clientNow = Math.floor(Date.now() / 60_000) * 60_000; };
const subscribeNow = (notify: () => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const update = () => { refreshNow(); notify(); };
  const timer = window.setInterval(update, 60_000);
  window.addEventListener('focus', update);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener('focus', update);
  };
};
const getClientNow = () => clientNow;
const getServerNow = () => getHydrationSnapshot()?.now ?? clientNow;

// A stable epoch prevents an unstable external-store snapshot. This matches
// the server during hydration and a minute-granularity live clock afterwards.
export function useNow(): Date {
  const epoch = useSyncExternalStore(subscribeNow, getClientNow, getServerNow);
  return new Date(epoch);
}

// Content max-width that scales on wide screens so content doesn't feel lost
// in a sea of empty gutter on 27"+ and ultrawide monitors. Preserves the
// existing layout at <1920px exactly; bumps proportionally above that.
export function useContentMax(base: number = 1320): number {
  return contentMax(useWindowWidth(), base);
}

// Pure (non-hook) form of the above, for sites that already have the window
// width in scope. Use this when the value is needed inside a `.map()` callback
// or after an early return, where calling the hook would break the rules of
// hooks. Call `useWindowWidth()` once at the top of the component and pass `w`.
export function contentMax(w: number, base: number = 1320): number {
  if (w >= 2560) return base + 320;
  if (w >= 1920) return base + 160;
  return base;
}

// Returns a dot/halftone pattern as separate background-image + background-size
// properties, ready to spread into a style object. Returning the CSS `background`
// shorthand (gradient + position/size in one string) silently fails when
// assigned to the `backgroundImage` property — browsers reject the whole value.
// Spread the result, or destructure when combining with other background layers.
export interface DotPattern {
  backgroundImage: string;
  backgroundSize: string;
}
export function halftone(color: string, size = 4, gap = 8): DotPattern {
  return {
    backgroundImage: `radial-gradient(${color} ${size / 2}px, transparent ${size / 2 + 0.5}px)`,
    backgroundSize: `${gap}px ${gap}px`,
  };
}

interface StickerProps {
  children: ReactNode;
  rotate?: number;
  color?: string;
  fg?: string;
  style?: CSSProperties;
}
export const Sticker: React.FC<StickerProps> = ({ children, rotate = -4, color = T.yellow, fg = readableOn(color), style }) => (
  <span style={{
    display: 'inline-block',
    background: color,
    color: fg,
    border: `2.5px solid ${T.ink}`,
    boxShadow: `3px 3px 0 0 ${T.ink}`,
    padding: '5px 11px',
    font: "800 11px/1 'Archivo', sans-serif",
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    transform: `rotate(${rotate}deg)`,
    whiteSpace: 'nowrap',
    ...style,
  }}>{children}</span>
);

interface PanelProps {
  children: ReactNode;
  style?: CSSProperties;
  accent?: string;
  onClick?: () => void;
}
export const Panel: React.FC<PanelProps> = ({ children, style, accent, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: '#fff',
      border: `3px solid ${T.ink}`,
      boxShadow: `6px 6px 0 0 ${T.ink}`,
      position: 'relative',
      ...style,
    }}
  >
    {accent && (
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 6,
        background: accent,
        borderBottom: `3px solid ${T.ink}`,
      }} />
    )}
    {children}
  </div>
);

interface CTAButtonProps {
  children: ReactNode;
  primary?: boolean;
  sub?: ReactNode;
  big?: boolean;
  href?: string;
  color?: string;
  onClick?: (e: React.MouseEvent) => void;
}
export const CTAButton: React.FC<CTAButtonProps> = ({ children, primary, sub, big, href = '#', color, onClick }) => {
  const bg = color || (primary ? T.accent : '#fff');
  const fg = readableOn(bg);
  const inner = (
    <>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>{children}</span>
      {sub && (
        <span style={{
          font: "600 11px/1.2 'Archivo Narrow', sans-serif",
          marginTop: 4,
          textTransform: 'none',
          letterSpacing: 0,
        }}>{sub}</span>
      )}
    </>
  );
  const style: CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    background: bg,
    color: fg,
    border: `3px solid ${T.ink}`,
    boxShadow: `5px 5px 0 0 ${T.ink}`,
    padding: big ? '16px 22px' : '12px 18px',
    textDecoration: 'none',
    font: `800 ${big ? '18px' : '15px'}/1.1 'Archivo', sans-serif`,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
    transition: 'all 0.12s ease',
    cursor: 'pointer',
  };
  const enter = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translate(-2px,-2px)';
    e.currentTarget.style.boxShadow = `7px 7px 0 0 ${T.ink}`;
  };
  const leave = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.currentTarget.style.transform = '';
    e.currentTarget.style.boxShadow = `5px 5px 0 0 ${T.ink}`;
  };
  if (onClick) {
    return (
      <button type="button" onClick={onClick} onMouseEnter={enter} onMouseLeave={leave} style={style}>
        {inner}
      </button>
    );
  }
  return (
    <a href={href} onMouseEnter={enter} onMouseLeave={leave} style={style}>
      {inner}
    </a>
  );
};

interface EyebrowProps {
  children: ReactNode;
  light?: boolean;
  style?: CSSProperties;
}
export const Eyebrow: React.FC<EyebrowProps> = ({ children, light, style }) => (
  <div style={{
    fontFamily: "'Archivo Narrow', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    fontSize: '11px',
    color: light ? 'rgba(255,255,255,0.5)' : T.primary,
    fontWeight: 700,
    marginBottom: '12px',
    ...style,
  }}>{children}</div>
);

interface DisplayHeadProps {
  children: ReactNode;
  size?: number;
  light?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'div';
  style?: CSSProperties;
}
export const DisplayHead: React.FC<DisplayHeadProps> = ({ children, size = 48, light, as = 'h2', style }) => {
  const Tag = as as 'h2';
  return (
    <Tag style={{
      fontFamily: "'Bungee', sans-serif",
      fontSize: `${size}px`,
      lineHeight: 0.95,
      letterSpacing: '-0.005em',
      color: light ? T.paper : T.ink,
      margin: 0,
      ...style,
    }}>{children}</Tag>
  );
};

interface SectionTitleProps {
  kicker: ReactNode;
  headline: ReactNode;
  sub?: ReactNode;
  dark?: boolean;
  style?: CSSProperties;
}
export const SectionTitle: React.FC<SectionTitleProps> = ({ kicker, headline, sub, dark, style }) => (
  <div style={{ maxWidth: 880, ...style }}>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <span style={{ width: 28, height: 3, background: T.accent }} />
      <span style={{
        font: "700 11px/1 'Archivo Narrow', sans-serif",
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: dark ? T.paper : T.primaryDark,
      }}>{kicker}</span>
    </div>
    <h2 style={{
      font: "400 clamp(34px, 5vw, 56px)/0.95 'Bungee', sans-serif",
      color: dark ? T.paper : T.ink,
      margin: 0,
      letterSpacing: '-0.005em',
    }}>{headline}</h2>
    {sub && (
      <p style={{
        font: "500 18px/1.4 'Archivo', sans-serif",
        color: dark ? 'rgba(251,246,236,0.75)' : T.ink,
        opacity: dark ? 1 : 0.78,
        margin: '12px 0 0',
        maxWidth: 640,
      }}>{sub}</p>
    )}
  </div>
);
