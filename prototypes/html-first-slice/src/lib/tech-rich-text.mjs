import { isAllowedInlineHref } from './inline-markdown.mjs';

// Escaped tokenisation of components/RichText.tsx, the renderer the React
// explainer page uses for whatItIs, howWeDoIt and FAQ answers. The same split
// expressions are used so the rendered contract matches, quirks included:
// - paragraphs split on blank lines; single newlines inside a paragraph
//   become <br>, and leading "- " on such a line stays as text;
// - a paragraph is a bullet list only when every non-empty line starts with
//   "-" or "•", and a numbered list only when every non-empty line starts
//   with digits and a full stop;
// - inline links are found first, then **strong**, then *emphasis* inside the
//   remaining text; link labels are plain text;
// - a link target that is not http(s) or site-relative is rendered as the
//   literal source text, never as a link. The reader rejects those earlier.
// No Markdown ever reaches set:html; TechRichText.astro renders the tokens.

function italicTokens(text) {
  return text.split(/(\*[^*]+?\*)/g).flatMap(part => {
    if (!part) return [];
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return [{ type: 'em', value: part.slice(1, -1) }];
    return [{ type: 'text', value: part }];
  });
}

function boldTokens(text) {
  return text.split(/(\*\*[^*]+?\*\*)/g).flatMap(part => {
    if (!part) return [];
    if (part.startsWith('**') && part.endsWith('**')) return [{ type: 'strong', value: part.slice(2, -2) }];
    return italicTokens(part);
  });
}

export function inlineTokens(segment) {
  if (!segment) return [];
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

const isBullet = line => line.trim().startsWith('-') || line.trim().startsWith('•');
const isNumbered = line => /^\d+\./.test(line.trim());

export function blockTokens(text) {
  if (!text) return [];
  return text.split(/\n\n+/).map(paragraph => {
    const lines = paragraph.split('\n');
    if (lines.every(line => line.trim() === '' || isBullet(line)) && lines.some(isBullet)) {
      return { type: 'ul', items: lines.filter(isBullet).map(line => inlineTokens(line.replace(/^[-•]\s*/, ''))) };
    }
    if (lines.every(line => line.trim() === '' || isNumbered(line)) && lines.some(isNumbered)) {
      return { type: 'ol', items: lines.filter(isNumbered).map(line => inlineTokens(line.replace(/^\d+\.\s*/, ''))) };
    }
    return { type: 'p', lines: lines.map(inlineTokens) };
  });
}

export function visibleText(tokens) {
  return tokens.map(token => (token.type === 'link' ? token.label : token.value)).join('');
}

// Rendered text pieces per block (one per list item, one per paragraph line)
// for checkers that compare emitted HTML against the source.
export function blockTextPieces(text) {
  return blockTokens(text).flatMap(block => (block.type === 'p' ? block.lines : block.items).map(visibleText));
}
