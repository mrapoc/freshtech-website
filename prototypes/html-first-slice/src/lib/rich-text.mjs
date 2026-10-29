import { isAllowedInlineHref } from './inline-markdown.mjs';

// Token port of components/RichText.tsx. The React component splits on blank
// lines, treats a paragraph whose every line starts with "-" or "•" as a bullet
// list and one whose every line starts with "1." style numbering as an ordered
// list, keeps single line breaks inside a paragraph as <br>, and renders inline
// links, **strong** and *em* in that precedence. The same regular expressions
// are used here so the emitted structure matches the production page; the only
// addition is that a link with an unsafe target is left as escaped text.

function italicTokens(value) {
  const tokens = [];
  for (const part of value.split(/(\*[^*]+?\*)/g)) {
    if (!part) continue;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) tokens.push({ type: 'em', value: part.slice(1, -1) });
    else tokens.push({ type: 'text', value: part });
  }
  return tokens;
}

function boldTokens(value) {
  const tokens = [];
  for (const part of value.split(/(\*\*[^*]+?\*\*)/g)) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) tokens.push({ type: 'strong', value: part.slice(2, -2) });
    else tokens.push(...italicTokens(part));
  }
  return tokens;
}

// Inline contract for one line: links first (label rendered as plain text, as
// the React component does), then strong and em in the surrounding text.
export function richTextInline(segment) {
  const parts = segment.split(/\[(.*?)\]\((.*?)\)/g);
  const tokens = [];
  for (let index = 0; index < parts.length; index += 3) {
    if (parts[index]) tokens.push(...boldTokens(parts[index]));
    if (index + 2 < parts.length) {
      const label = parts[index + 1];
      const href = parts[index + 2];
      if (isAllowedInlineHref(href)) tokens.push({ type: 'link', href, external: href.startsWith('http'), label });
      else tokens.push({ type: 'text', value: `[${label}](${href})` });
    }
  }
  return tokens;
}

const BULLET = line => line.trim().startsWith('-') || line.trim().startsWith('•');
const NUMBERED = line => /^\d+\./.test(line.trim());

export function richTextBlocks(text) {
  if (!text) return [];
  return text.split(/\n\n+/).map(paragraph => {
    const lines = paragraph.split('\n');
    const isListParagraph = lines.every(line => line.trim() === '' || BULLET(line));
    const isNumberedList = lines.every(line => line.trim() === '' || NUMBERED(line));
    if (isListParagraph && lines.some(BULLET)) {
      return { type: 'ul', items: lines.filter(BULLET).map(line => richTextInline(line.replace(/^[-•]\s*/, ''))) };
    }
    if (isNumberedList && lines.some(NUMBERED)) {
      return { type: 'ol', items: lines.filter(NUMBERED).map(line => richTextInline(line.replace(/^\d+\.\s*/, ''))) };
    }
    return { type: 'p', lines: lines.map(richTextInline) };
  });
}

// Visible text of a token list, for tests and output comparison.
export const inlineText = tokens => tokens.map(token => (token.type === 'link' ? token.label : token.value)).join('');
