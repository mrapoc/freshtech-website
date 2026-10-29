// Block-level Markdown for the legal document routes (terms-of-business, dpa,
// sub-processors), ported from pages-v2/LegalDocumentPageV2.tsx's ReactMarkdown
// + remarkGfm setup and utils/legalDocuments.ts's id helpers. The source
// documents (content/*.md) use exactly: h2/h3 headings, one paragraph per
// line, "- " bullet lists, and GFM pipe tables. No bold/italic/code appear in
// the current documents, but inline text still goes through
// inlineLegalTokens (below) for **strong** and [text](href) so a future edit
// using them renders correctly and unsafe hrefs are still rejected. h1 is not
// handled here: React's markdownComponents drop h1 (`h1: () => null`), so
// extract-legal.mjs strips the leading "# Title" line before this module ever
// sees the body.
//
// Deliberately NOT implemented, because the source documents never use them:
// ordered (numbered) Markdown lists, blockquotes, code fences, images, nested
// lists. Clause numbering ("1.1", "13.3") is plain paragraph text, not list
// syntax, and stays that way here.

const TABLE_ROW = /^\|.*\|\s*$/;
const TABLE_SEPARATOR = /^\|(?:[\s:-]+\|)+\s*$/;
const BULLET = /^-\s+/;
const HEADING = /^(#{2,3})\s+(.+)$/;

export function stableHeadingId(heading) {
  const normalized = heading.trim();
  const clause = normalized.match(/^(\d+)(?:\.|\s|$)/);
  if (clause) return `clause-${clause[1]}`;

  const annex = normalized.match(/^Annex\s+(\d+)/i);
  if (annex) return `annex-${annex[1]}`;

  return normalized
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function stableClauseId(text) {
  const clause = text.trim().match(/^(\d+(?:\.\d+)+)\s/);
  return clause ? `clause-${clause[1].replace(/\./g, '-')}` : undefined;
}

function splitTableRow(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map(cell => cell.trim());
}

// Strips a single leading "# Heading" line (with any blank lines after it),
// matching the effect of React's `h1: () => null`. Only the first line is
// considered: a "#" appearing later in the body is ordinary paragraph text (no
// document uses one) and is left for parseLegalBlocks to reject as unmatched.
export function stripLeadingH1(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let start = 0;
  while (lines[start] === '') start++;
  if (/^#\s+.+$/.test(lines[start] ?? '')) {
    start++;
    while (lines[start] === '') start++;
    return lines.slice(start).join('\n');
  }
  return markdown;
}

// Parses the block structure of one document body into a small typed AST:
//   { type: 'heading', level: 2 | 3, text, id }
//   { type: 'paragraph', text, id? }
//   { type: 'list', items: string[] }
//   { type: 'table', header: string[], rows: string[][] }
// `text`/items/cells are raw Markdown strings, still to be run through
// inlineMarkdownTokens by the caller (kept separate so the parser stays a pure,
// easily-tested function with no HTML/JSX concerns).
export function parseLegalBlocks(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }

    const heading = line.match(HEADING);
    if (heading) {
      const text = heading[2].trim();
      blocks.push({ type: 'heading', level: heading[1].length, text, id: stableHeadingId(text) });
      i++;
      continue;
    }

    if (TABLE_ROW.test(line) && TABLE_SEPARATOR.test(lines[i + 1] ?? '')) {
      const header = splitTableRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && TABLE_ROW.test(lines[i])) { rows.push(splitTableRow(lines[i])); i++; }
      blocks.push({ type: 'table', header, rows });
      continue;
    }

    if (BULLET.test(line)) {
      const items = [];
      while (i < lines.length && BULLET.test(lines[i])) { items.push(lines[i].replace(BULLET, '')); i++; }
      blocks.push({ type: 'list', items });
      continue;
    }

    const paragraphLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !HEADING.test(lines[i]) &&
      !BULLET.test(lines[i]) &&
      !(TABLE_ROW.test(lines[i]) && TABLE_SEPARATOR.test(lines[i + 1] ?? ''))
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    const text = paragraphLines.join(' ').trim();
    blocks.push({ type: 'paragraph', text, id: stableClauseId(text) });
  }
  return blocks;
}

// --- Inline: links, strong, and bare-email autolinking -------------------
//
// remark-gfm (used by the React page) autolinks bare email addresses per the
// GFM "autolink literal" extension, so a document that writes plain
// "hello@fresh-tech.uk" (never Markdown link syntax) gets a real mailto: link
// in production. content/terms-of-business.md, content/data-processing-terms.md
// and content/sub-processors.md each do this once. isAllowedInlineHref (from
// inline-markdown.mjs, reused for the [text](href) shape) allows only
// http/https, so a small local extension is added rather than widening that
// shared helper's contract for its other, non-legal callers: isAllowedLegalHref
// additionally accepts a strict "mailto:local@domain" shape (same pattern
// blog-markdown.mjs uses for its own mailto/tel support), and
// autolinkBareEmails turns a bare address into `[address](mailto:address)`
// Markdown before the existing link/strong tokeniser runs.

import { isAllowedInlineHref } from './inline-markdown.mjs';

const MAILTO_PATTERN = /^mailto:[A-Za-z0-9._+-]{1,64}@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

export function isAllowedLegalHref(href) {
  return MAILTO_PATTERN.test(href) || isAllowedInlineHref(href);
}

const BARE_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;

export function autolinkBareEmails(text) {
  return text.replace(BARE_EMAIL, (match, offset, full) => {
    const before = full.slice(0, offset);
    // Leave alone an email that is already a link's label or href (this
    // module always builds "[addr](mailto:addr)", so both read the same).
    if (/\]\($/.test(before) || /mailto:$/i.test(before) || before.endsWith('[')) return match;
    return `[${match}](mailto:${match})`;
  });
}

function boldTokens(text) {
  const tokens = [];
  let offset = 0;
  while (offset < text.length) {
    const start = text.indexOf('**', offset);
    if (start === -1) { tokens.push({ type: 'text', value: text.slice(offset) }); break; }
    if (start > offset) tokens.push({ type: 'text', value: text.slice(offset, start) });
    const end = text.indexOf('**', start + 2);
    if (end === -1) { tokens.push({ type: 'text', value: text.slice(start) }); break; }
    tokens.push({ type: 'strong', value: text.slice(start + 2, end) });
    offset = end + 2;
  }
  return tokens;
}

// Same link/strong tokenisation as inlineMarkdownTokens, run after
// autolinkBareEmails and checked against isAllowedLegalHref so a mailto:
// target survives alongside ordinary internal/external links.
export function inlineLegalTokens(text) {
  if (!text) return [];
  const autolinked = autolinkBareEmails(text);
  const tokens = [];
  const links = /\[([^\]]+)\]\(([^)]+)\)/g;
  let offset = 0;
  let match;
  while ((match = links.exec(autolinked)) !== null) {
    if (match.index > offset) tokens.push(...boldTokens(autolinked.slice(offset, match.index)));
    const href = match[2];
    if (isAllowedLegalHref(href)) {
      tokens.push({
        type: 'link',
        href,
        external: href.startsWith('http://') || href.startsWith('https://'),
        children: boldTokens(match[1]),
      });
    } else {
      tokens.push({ type: 'text', value: match[0] });
    }
    offset = links.lastIndex;
  }
  if (offset < autolinked.length) tokens.push(...boldTokens(autolinked.slice(offset)));
  return tokens;
}
