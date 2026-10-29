// Escaped tokenisation for the small inline Markdown contract used by the
// React case-study detail page: links first, with **strong** inside text and
// link labels. Astro renders every token as an element or escaped text.
function boldTokens(text) {
  const tokens = [];
  let offset = 0;
  while (offset < text.length) {
    const start = text.indexOf('**', offset);
    if (start === -1) {
      tokens.push({ type: 'text', value: text.slice(offset) });
      break;
    }
    if (start > offset) tokens.push({ type: 'text', value: text.slice(offset, start) });
    const end = text.indexOf('**', start + 2);
    if (end === -1) {
      tokens.push({ type: 'text', value: text.slice(start) });
      break;
    }
    tokens.push({ type: 'strong', value: text.slice(start + 2, end) });
    offset = end + 2;
  }
  return tokens;
}

export function isAllowedInlineHref(value) {
  if (typeof value !== 'string' || !value || /[\u0000-\u001f\u007f\s<>"`\\]/.test(value) || value.startsWith('//')) return false;
  try {
    const parsed = new URL(value, 'https://fresh-tech.uk/');
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function inlineMarkdownTokens(text) {
  if (!text) return [];
  const tokens = [];
  const links = /\[([^\]]+)\]\(([^)]+)\)/g;
  let offset = 0;
  let match;
  while ((match = links.exec(text)) !== null) {
    if (match.index > offset) tokens.push(...boldTokens(text.slice(offset, match.index)));
    const href = match[2];
    if (isAllowedInlineHref(href)) {
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
  if (offset < text.length) tokens.push(...boldTokens(text.slice(offset)));
  return tokens;
}
