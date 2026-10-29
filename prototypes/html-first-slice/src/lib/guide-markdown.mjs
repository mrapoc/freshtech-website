// Escaped tokenisation of the guide-section dialect implemented by
// parseMarkdown in pages/IndustryGuidePage.tsx. That renderer works one source
// line at a time and supports exactly four constructs:
//
//   1. a line starting "• " or "- " is a bullet item (bold parsed in the rest)
//   2. a line matching /^(\d+)\.\s+(.+)$/ is a numbered item (number kept)
//   3. a line that starts and ends with ** and has no other ** is a subheading
//   4. **text** runs (no * inside) are strong; everything else is plain text
//
// Blank lines are spacing only. There are no links, no inline code, no raw
// HTML and no other Markdown: a "[label](url)" or "<b>" sequence is plain text
// and is emitted escaped. The checks run in the source order above, so
// "- **x**" is a bullet, not a heading, and "**A** and **B**" is a paragraph.
//
// Departures from the React renderer, all deliberate:
//   - consecutive bullet lines become one semantic <ul>, consecutive numbered
//     lines one <ol>; the source numbers are preserved via start/value.
//   - subheadings are h3 (the React page used h4 under an h2 section title,
//     skipping a level); natively the section title is still the h2, so its
//     subheadings are h3 and the document outline has no gap.
//   - a bold line with nothing inside ("**", "***", "** **") is never an empty
//     heading; it stays a paragraph. Its inline tokens follow the source
//     regex exactly: "**" and "***" are literal text, while "** **" is a
//     whitespace-only strong run (the source renderer bolds a space too).
//   - CRLF input is normalised to LF before splitting.
// Paragraphs stay one per source line, as in the React output.

export const HEADING_TAG = 'h3';

const BOLD_RUN = /(\*\*[^*]+\*\*)/g;
const NUMBERED = /^(\d+)\.\s+(.+)$/;

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ESCAPES[character]);
}

// Bold runs only. split() with a capture group alternates plain and captured
// parts, so odd indexes are always complete **...** runs.
export function inlineTokens(text) {
  if (!text) return [];
  const tokens = [];
  text.split(BOLD_RUN).forEach((part, index) => {
    if (!part) return;
    if (index % 2 === 1) tokens.push({ type: 'strong', value: part.slice(2, -2) });
    else tokens.push({ type: 'text', value: part });
  });
  return tokens;
}

export function isSubheadingLine(line) {
  if (!line.startsWith('**') || !line.endsWith('**') || line.length < 5) return false;
  const inner = line.slice(2, -2);
  return !inner.includes('**') && inner.trim() !== '';
}

export function blockTokens(content) {
  const blocks = [];
  let list = null;
  for (const line of String(content ?? '').replace(/\r\n/g, '\n').split('\n')) {
    if (line.startsWith('• ') || line.startsWith('- ')) {
      if (!list || list.type !== 'ul') { list = { type: 'ul', items: [] }; blocks.push(list); }
      list.items.push(inlineTokens(line.slice(2)));
      continue;
    }
    const numbered = line.match(NUMBERED);
    if (numbered) {
      const number = Number(numbered[1]);
      if (!list || list.type !== 'ol') { list = { type: 'ol', start: number, items: [] }; blocks.push(list); }
      list.items.push({ number, children: inlineTokens(numbered[2]) });
      continue;
    }
    list = null;
    if (isSubheadingLine(line)) { blocks.push({ type: 'h3', children: [{ type: 'text', value: line.slice(2, -2) }] }); continue; }
    if (line.trim() === '') continue;
    blocks.push({ type: 'p', children: inlineTokens(line) });
  }
  return blocks;
}

export function visibleText(tokens) {
  return tokens.map(token => token.value).join('');
}

export function inlineHtml(tokens) {
  return tokens.map(token => (token.type === 'strong' ? `<strong>${escapeHtml(token.value)}</strong>` : escapeHtml(token.value))).join('');
}

function orderedListHtml(block) {
  const start = block.start === 1 ? '' : ` start="${block.start}"`;
  let expected = block.start;
  const items = block.items.map(item => {
    const value = item.number === expected ? '' : ` value="${item.number}"`;
    expected = item.number + 1;
    return `<li${value}>${inlineHtml(item.children)}</li>`;
  });
  return `<ol${start}>${items.join('')}</ol>`;
}

export function blockHtml(block) {
  switch (block.type) {
    case 'h3': return `<${HEADING_TAG}>${inlineHtml(block.children)}</${HEADING_TAG}>`;
    case 'p': return `<p>${inlineHtml(block.children)}</p>`;
    case 'ul': return `<ul>${block.items.map(item => `<li>${inlineHtml(item)}</li>`).join('')}</ul>`;
    case 'ol': return orderedListHtml(block);
    default: throw new Error(`Unknown guide block type ${block.type}`);
  }
}

// Fully escaped HTML for one section's content. Safe to place with set:html
// because every character of source text passes through escapeHtml and the
// only tags emitted are the fixed set above.
export function renderGuideContent(content) {
  return blockTokens(content).map(blockHtml).join('\n');
}

export function hasList(content) { return blockTokens(content).some(block => block.type === 'ul' || block.type === 'ol'); }
export function hasSubheading(content) { return blockTokens(content).some(block => block.type === 'h3'); }
