import React from 'react';
import { Link } from 'react-router-dom';
import { T } from './primitives';

/**
 * Render inline-Markdown commonly found in data/content.ts:
 *   - [label](/internal/path)      → React Router <Link>
 *   - [label](https://external)    → <a target="_blank" rel="noopener noreferrer">
 *   - **bold**                     → <strong>
 *
 * Block-level markdown (headings, lists, tables) is NOT handled here —
 * use BlogPostPageV2's renderer for full markdown rendering.
 */
export const renderInlineMd = (text: string): React.ReactNode => {
  if (!text) return text;

  // First pass: split on links. parseBold runs on the inter-link segments.
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > last) {
      out.push(parseBold(text.slice(last, match.index), key++));
    }
    const label = match[1];
    const url   = match[2];
    if (url.startsWith('http://') || url.startsWith('https://')) {
      out.push(
        <a key={`l${key++}`} href={url} target="_blank" rel="noopener noreferrer"
           style={{ color: T.primary, fontWeight: 600 }}>{parseBold(label, 0)}</a>
      );
    } else {
      out.push(
        <Link key={`l${key++}`} to={url} style={{ color: T.primary, fontWeight: 600 }}>
          {parseBold(label, 0)}
        </Link>
      );
    }
    last = linkRegex.lastIndex;
  }
  if (last < text.length) out.push(parseBold(text.slice(last), key++));
  return <>{out}</>;
};

const parseBold = (text: string, k: number): React.ReactNode => {
  if (!text.includes('**')) return text;
  const parts: React.ReactNode[] = [];
  let i = 0;
  let pk = 0;
  while (i < text.length) {
    const start = text.indexOf('**', i);
    if (start === -1) { parts.push(text.slice(i)); break; }
    if (start > i) parts.push(text.slice(i, start));
    const end = text.indexOf('**', start + 2);
    if (end === -1) { parts.push(text.slice(i)); break; }
    parts.push(<strong key={`b${k}-${pk++}`}>{text.slice(start + 2, end)}</strong>);
    i = end + 2;
  }
  return <>{parts}</>;
};
