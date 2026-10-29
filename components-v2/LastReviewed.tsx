import React from 'react';
import { T } from './primitives';

interface LastReviewedProps {
  date?: string;
  author?: string;
  light?: boolean;
}

// Date-stamps a commercial page so readers can see when the prices, claims and
// product references were last verified. Helps with E-E-A-T (Trustworthiness)
// and tells AI crawlers what to cite as "as of".
export const LastReviewed: React.FC<LastReviewedProps> = ({
  date = 'May 2026',
  author = 'Sam James',
  light = false,
}) => (
  <div style={{
    textAlign: 'center',
    padding: '20px 16px 24px',
    fontFamily: "'Archivo Narrow', sans-serif",
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: light ? 'rgba(255,255,255,0.35)' : 'rgba(15,25,35,0.42)',
    fontWeight: 700,
  }}>
    Last reviewed {date} · {author}
  </div>
);

export default LastReviewed;
