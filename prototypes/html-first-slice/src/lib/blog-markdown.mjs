import { isAllowedInlineHref } from './inline-markdown.mjs';

// Escaped tokenisation of the article Markdown dialect implemented by
// renderContent/parseInline/parseBold in pages-v2/BlogPostPageV2.tsx. The
// tokens are rendered by BlogMarkdown.astro as elements and escaped text; no
// Markdown ever reaches set:html. Quirks of the active renderer are kept on
// purpose (they are the rendered contract): link labels are plain text, table
// cells are split on every pipe and empty cells dropped, the separator row is
// skipped positionally, and only ## and ### headings exist.
//
// One deliberate departure from the V2 renderer: heading hierarchy. Several
// inherited articles open with ### and never (or only later) reach ##, so the
// V2 output skipped straight from the H1 to an H3, which the emitted-quality
// browser gate rejects. blockTokens promotes each "orphan" ### heading (one
// that no ## precedes in the article) to an h2 token carrying
// presentation: 'small' so the template can keep the smaller visual style via
// an explicit class. Only the semantic level changes; the heading text is
// untouched. Once a source ## has been seen, later ### headings stay h3.

function boldAndCodeTokens(text) {
  const tokens = [];
  let offset = 0;
  while (offset < text.length) {
    const boldStart = text.indexOf('**', offset);
    const codeStart = text.indexOf('`', offset);
    const candidates = [boldStart, codeStart].filter(index => index !== -1).sort((a, b) => a - b);
    const next = candidates[0];
    if (next === undefined) { tokens.push({ type: 'text', value: text.slice(offset) }); break; }
    if (next > offset) tokens.push({ type: 'text', value: text.slice(offset, next) });
    // Unmatched markers: the V2 parseBold re-emits from the old offset, which
    // repeats the text already pushed. inline-markdown.mjs corrected that to
    // slice from the marker; the same correction applies here.
    if (next === boldStart) {
      const end = text.indexOf('**', boldStart + 2);
      if (end === -1) { tokens.push({ type: 'text', value: text.slice(next) }); break; }
      tokens.push({ type: 'strong', value: text.slice(boldStart + 2, end) });
      offset = end + 2;
    } else {
      const end = text.indexOf('`', codeStart + 1);
      if (end === -1) { tokens.push({ type: 'text', value: text.slice(next) }); break; }
      tokens.push({ type: 'code', value: text.slice(codeStart + 1, end) });
      offset = end + 1;
    }
  }
  return tokens;
}

// Blog articles additionally link phone numbers and email addresses. The
// shared case-study helper stays http(s)-only; here tel: and mailto: are
// accepted only in a strict literal shape (E.164-style digits, one plain
// address with no headers/query), and every other scheme, protocol-relative
// or control-character target is still rejected.
const TEL_PATTERN = /^tel:\+?\d{6,15}$/;
const MAILTO_PATTERN = /^mailto:[A-Za-z0-9._+-]{1,64}@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

export function isAllowedBlogHref(value) {
  if (typeof value !== 'string' || !value || /[\u0000-\u001f\u007f\s<>"`\\]/.test(value)) return false;
  if (TEL_PATTERN.test(value) || MAILTO_PATTERN.test(value)) return true;
  return isAllowedInlineHref(value);
}

export function inlineTokens(text) {
  if (!text) return [];
  const tokens = [];
  const links = /\[([^\]]+)\]\(([^)]+)\)/g;
  let offset = 0;
  let match;
  while ((match = links.exec(text)) !== null) {
    if (match.index > offset) tokens.push(...boldAndCodeTokens(text.slice(offset, match.index)));
    const href = match[2];
    if (isAllowedBlogHref(href)) {
      tokens.push({ type: 'link', href, external: href.startsWith('http://') || href.startsWith('https://'), label: match[1] });
    } else {
      // The reader rejects these before extraction; if one still arrives the
      // source text is shown literally rather than becoming a link.
      tokens.push({ type: 'text', value: match[0] });
    }
    offset = links.lastIndex;
  }
  if (offset < text.length) tokens.push(...boldAndCodeTokens(text.slice(offset)));
  return tokens;
}

function splitBlocks(content) {
  const blocks = [];
  let current = [];
  let inList = false;
  for (const line of content.replace(/\r\n/g, '\n').split('\n')) {
    const isListItem = /^(\*|-|\d+\.)\s/.test(line);
    if (line.trim() === '') {
      if (current.length) { blocks.push(current.join('\n')); current = []; }
      inList = false;
    } else if (isListItem) {
      if (!inList && current.length) { blocks.push(current.join('\n')); current = []; }
      current.push(line); inList = true;
    } else {
      if (inList && current.length) { blocks.push(current.join('\n')); current = []; }
      current.push(line); inList = false;
    }
  }
  if (current.length) blocks.push(current.join('\n'));
  return blocks;
}

const cells = line => line.split('|').filter(cell => cell.trim()).map(cell => cell.trim());

// Mechanical formatting exception (documented, deliberately narrow): the
// inherited articles decorate some list items with a leading emoji ("✅ Do
// this", "🇬🇧 UK only"). The site style forbids emoji-led lists, so the
// renderer drops ONLY that leading decorative grapheme (plus the whitespace
// after it) from a list item's text. Nothing else is touched: every word,
// every punctuation mark and every emoji that appears later in the item stay
// exactly as authored, and headings, paragraphs and table cells are never
// normalised. The rule lives in blockTokens so the parity checker derives its
// expected text through the same mechanical step. Graphemes are taken from
// Intl.Segmenter so joined sequences (ZWJ families, flags, keycaps, variation
// selectors, skin tones) are treated as one unit rather than split mid-cluster.
const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' });
const DECORATIVE_EMOJI = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|[0-9#*]️?⃣)/u;
const EMOJI_CLUSTER = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|\p{Emoji_Component}|[0-9#*]|️|‍|⃣)+$/u;

export function stripLeadingListEmoji(text) {
  if (!text) return text;
  const [first] = graphemes.segment(text);
  if (!first) return text;
  const cluster = first.segment;
  // A plain digit, "#" or "*" is only decorative when it is a keycap; ordinary
  // numeric text ("2 hours", "3. Step") is left alone by the DECORATIVE test.
  if (!DECORATIVE_EMOJI.test(cluster) || !EMOJI_CLUSTER.test(cluster)) return text;
  return text.slice(cluster.length).replace(/^[ \t]+/, '');
}

const listItem = text => inlineTokens(stripLeadingListEmoji(text));

// Presentation marker carried by an orphan ### heading promoted to h2. The
// template maps it to the SMALL_HEADING_CLASS so the h3 visual style is kept.
export const SMALL_HEADING = 'small';
export const SMALL_HEADING_CLASS = 'blog-heading-small';

export function blockTokens(content) {
  let seenH2 = false;
  return splitBlocks(content).map(block => {
    const t = block.trim();
    if (t.startsWith('## ')) { seenH2 = true; return { type: 'h2', children: inlineTokens(t.slice(3)) }; }
    if (t.startsWith('### ')) {
      const children = inlineTokens(t.slice(4));
      // Orphan ### (no ## yet in this article): semantic h2, small presentation.
      return seenH2 ? { type: 'h3', children } : { type: 'h2', presentation: SMALL_HEADING, children };
    }
    if (t.startsWith('|') && t.includes('|---')) {
      const lines = t.split('\n').filter(line => line.trim());
      if (lines.length >= 2) {
        return {
          type: 'table',
          header: cells(lines[0]).map(inlineTokens),
          rows: lines.slice(2).map(line => cells(line).map(inlineTokens)),
        };
      }
    }
    if (t.startsWith('* ') || t.startsWith('- ')) {
      return { type: 'ul', items: t.split('\n').filter(line => line.startsWith('* ') || line.startsWith('- ')).map(line => listItem(line.slice(2))) };
    }
    if (/^\d+\.\s/.test(t)) {
      return { type: 'ol', items: t.split('\n').filter(line => /^\d+\.\s/.test(line)).map(line => listItem(line.replace(/^\d+\.\s/, ''))) };
    }
    return { type: 'p', children: inlineTokens(t) };
  });
}

// Plain text of the rendered article, used by checkers to compare emitted
// HTML against the source without reproducing the renderer's markup.
export function visibleText(tokens) {
  return tokens.map(token => {
    if (token.type === 'link') return token.label;
    return token.value;
  }).join('');
}

export function hasTable(content) { return blockTokens(content).some(block => block.type === 'table'); }
export function hasList(content) { return blockTokens(content).some(block => block.type === 'ul' || block.type === 'ol'); }
