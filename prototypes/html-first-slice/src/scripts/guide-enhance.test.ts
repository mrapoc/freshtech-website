import assert from 'node:assert/strict';
import test from 'node:test';
import { findSectionForHash, readGuideProgress, renderGuideProgress, resolveHashTarget, revealSection, setSectionExpanded, startGuideEnhancements } from './guide-enhance.ts';

// guide-enhance.ts calls CSS.escape (only inside functions, never at module
// load) for every id lookup. Provide the real contract (escape non-identifier
// characters) rather than an identity stub, and have the fake DOM's #id matcher
// unescape it, so the round trip is exercised by the malformed-fragment cases.
(globalThis as { CSS?: unknown }).CSS ??= { escape: (value: string) => value.replace(/[^\w-]/g, character => `\\${character}`) };
const cssUnescape = (value: string) => value.replace(/\\(.)/g, '$1');

// --- Minimal fake DOM: only the selector grammar guide-enhance.ts uses -------
// Supports descendant chains of compound selectors made of tag, #id, .class,
// [attr] and [attr^="value"]. No siblings, no pseudo-classes, no :scope.
type Listener = (event: { target: FakeNode }) => void;
class FakeNode {
  tag: string;
  parent: FakeNode | null = null;
  children: FakeNode[] = [];
  attrs: Record<string, string>;
  hidden = false;
  checked = false;
  textContent = '';
  max = 0;
  value = 0;
  focused = 0;
  scrolled: Array<Record<string, unknown> | undefined> = [];
  listeners = new Map<string, Listener[]>();
  classList = { add: (name: string) => { this.attrs.class = `${this.attrs.class ?? ''} ${name}`.trim(); } };
  constructor(tag: string, attrs: Record<string, string> = {}, ...children: FakeNode[]) {
    this.tag = tag;
    this.attrs = { ...attrs };
    for (const child of children) { child.parent = this; this.children.push(child); }
  }
  getAttribute(name: string) { return this.attrs[name] ?? null; }
  hasAttribute(name: string) { return name in this.attrs; }
  setAttribute(name: string, value: string) { this.attrs[name] = value; }
  addEventListener(type: string, listener: Listener) { this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]); }
  dispatch(type: string, target: FakeNode = this) { for (const listener of this.listeners.get(type) ?? []) listener({ target }); }
  click() { this.dispatch('click'); }
  focus() { this.focused += 1; }
  scrollIntoView(options?: Record<string, unknown>) { this.scrolled.push(options); }
  contains(node: FakeNode | null): boolean { return node === this || (!!node && this.contains(node.parent)); }
  closest(selector: string): FakeNode | null { return matches(this, selector) ? this : this.parent?.closest(selector) ?? null; }
  *descendants(): Generator<FakeNode> { for (const child of this.children) { yield child; yield* child.descendants(); } }
  querySelectorAll(selector: string) { return [...this.descendants()].filter(node => matchesChain(node, selector, this)); }
  querySelector(selector: string) { return this.querySelectorAll(selector)[0] ?? null; }
}
function matches(node: FakeNode, compound: string) {
  return [...compound.matchAll(/([a-z0-9]+)|#((?:[^.#[\\]|\\.)+)|\.([\w-]+)|\[([\w-]+)(?:\^="([^"]*)")?\]/g)].every(([, tag, id, cls, attr, prefix]) => {
    if (tag) return node.tag === tag;
    if (id) return node.attrs.id === cssUnescape(id);
    if (cls) return (node.attrs.class ?? '').split(/\s+/).includes(cls);
    if (prefix !== undefined) return (node.attrs[attr] ?? '').startsWith(prefix);
    return attr in node.attrs;
  });
}
function matchesChain(node: FakeNode, selector: string, root: FakeNode): boolean {
  const parts = selector.trim().split(/\s+/);
  if (!matches(node, parts[parts.length - 1])) return false;
  let ancestor = node.parent;
  for (let index = parts.length - 2; index >= 0; index -= 1) {
    while (ancestor && ancestor !== root && !matches(ancestor, parts[index])) ancestor = ancestor.parent;
    if (!ancestor || ancestor === root) return false;
    ancestor = ancestor.parent;
  }
  return true;
}
const el = (tag: string, attrs: Record<string, string> = {}, ...children: FakeNode[]) => new FakeNode(tag, attrs, ...children);

// --- Fixture mirroring GuidePage.astro hooks ----------------------------------
function guideSection(id: string, checkIds: string[]) {
  return el('section', { id: `guide-section-${id}`, 'data-guide-section': '' },
    el('div', { 'data-guide-header': '' },
      el('h2', { id: `guide-title-${id}` }),
      el('button', { 'data-guide-toggle': '', 'aria-expanded': 'true', 'aria-controls': `guide-body-${id}`, hidden: '' }, el('span', { 'data-guide-toggle-text': '' }))),
    el('div', { id: `guide-body-${id}` },
      el('div', { class: 'guide-content' }),
      ...checkIds.map(check => el('input', { type: 'checkbox', id: `guide-check-${check}`, 'data-guide-check': '' }))));
}
function guidePage(sectionChecks: Record<string, string[]>) {
  const sections = Object.entries(sectionChecks).map(([id, checks]) => guideSection(id, checks));
  const page = el('main', { id: 'main-content', 'data-guide-page': 'engineering' },
    el('div', { 'data-guide-actions': '' }, el('button', { 'data-guide-print': '' }), el('button', { 'data-guide-print': '' })),
    el('nav', { class: 'guide-toc' }, el('h2', { id: 'guide-toc-heading' }), ...sections.map(section => el('a', { href: `#${section.attrs.id}` }))),
    ...sections,
    el('div', { 'data-guide-progress': '' },
      el('span', { 'data-guide-progress-count': '' }), el('progress', { 'data-guide-progress-bar': '' }),
      el('strong', { 'data-guide-progress-percent': '' }), el('p', { 'data-guide-progress-complete': '' })));
  for (const node of [page.querySelector('[data-guide-actions]'), page.querySelector('[data-guide-progress]'), ...page.querySelectorAll('[data-guide-toggle]')]) node!.hidden = true;
  const doc = el('html', {}, page);
  return { doc: doc as unknown as Document, page, sections, boxes: page.querySelectorAll('[data-guide-check]'), toggles: page.querySelectorAll('[data-guide-toggle]') };
}
function fakeRuntime(hash = '') {
  const listeners = new Map<string, Array<(event: Event) => void>>();
  const runtime = {
    prints: 0, listeners, location: { hash },
    print() { runtime.prints += 1; },
    addEventListener(type: string, listener: (event: Event) => void) { listeners.set(type, [...(listeners.get(type) ?? []), listener]); },
    fire(type: string) { for (const listener of listeners.get(type) ?? []) listener({} as Event); },
  };
  return runtime;
}
const strip = (page: FakeNode) => ({
  count: page.querySelector('[data-guide-progress-count]')!, percent: page.querySelector('[data-guide-progress-percent]')!,
  bar: page.querySelector('[data-guide-progress-bar]')!, complete: page.querySelector('[data-guide-progress-complete]')!,
});
const expanded = (toggle: FakeNode, page: FakeNode) => ({
  aria: toggle.getAttribute('aria-expanded'), text: toggle.querySelector('[data-guide-toggle-text]')!.textContent,
  bodyHidden: page.querySelector(`#${toggle.getAttribute('aria-controls')}`)!.hidden,
});

// --- Progress ----------------------------------------------------------------
test('progress uses the source rounding, reports 0 for an empty checklist and 100 only when every box is ticked', () => {
  const { page, boxes } = guidePage({ workstations: ['a', 'b', 'c'], network: [] });
  assert.deepEqual(readGuideProgress(page as unknown as ParentNode), { completed: 0, total: 3, percent: 0 });
  boxes[0].checked = true;
  assert.deepEqual(readGuideProgress(page as unknown as ParentNode), { completed: 1, total: 3, percent: 33 });
  boxes[1].checked = true;
  assert.deepEqual(readGuideProgress(page as unknown as ParentNode), { completed: 2, total: 3, percent: 67 });
  boxes[2].checked = true;
  assert.deepEqual(readGuideProgress(page as unknown as ParentNode), { completed: 3, total: 3, percent: 100 });
  assert.deepEqual(readGuideProgress(guidePage({ empty: [] }).page as unknown as ParentNode), { completed: 0, total: 0, percent: 0 });
});

test('progress renderer writes count, percentage, bar value and the Complete! status together', () => {
  const { page } = guidePage({ s: ['a', 'b'] });
  const nodes = strip(page);
  renderGuideProgress(page as unknown as ParentNode, { completed: 1, total: 2, percent: 50 });
  assert.equal(nodes.count.textContent, '1');
  assert.equal(nodes.percent.textContent, '50%');
  assert.deepEqual([nodes.bar.max, nodes.bar.value, nodes.bar.textContent], [2, 1, '50%']);
  assert.equal(nodes.complete.hidden, true);
  renderGuideProgress(page as unknown as ParentNode, { completed: 2, total: 2, percent: 100 });
  assert.equal(nodes.complete.hidden, false);
  renderGuideProgress(page as unknown as ParentNode, { completed: 0, total: 2, percent: 0 });
  assert.deepEqual([nodes.count.textContent, nodes.percent.textContent, nodes.complete.hidden], ['0', '0%', true]);
});

test('start reveals the controls, tracks checkbox changes and keeps the strip hidden when there is nothing to count', () => {
  const { doc, page, boxes } = guidePage({ s: ['a', 'b', 'c', 'd'] });
  const runtime = fakeRuntime();
  startGuideEnhancements({ root: doc, runtime });
  assert.equal(page.querySelector('[data-guide-actions]')!.hidden, false);
  assert.equal(page.querySelector('[data-guide-progress]')!.hidden, false);
  assert.ok(page.querySelectorAll('[data-guide-toggle]').every(toggle => !toggle.hidden));
  boxes[0].checked = true; boxes[0].dispatch('change');
  assert.deepEqual([strip(page).count.textContent, strip(page).percent.textContent], ['1', '25%']);
  // BFCache restore re-reads restored checkbox state.
  boxes[1].checked = true; runtime.fire('pageshow');
  assert.equal(strip(page).percent.textContent, '50%');

  const empty = guidePage({ s: [] });
  startGuideEnhancements({ root: empty.doc, runtime: fakeRuntime() });
  assert.equal(empty.page.querySelector('[data-guide-progress]')!.hidden, true);
});

// --- Expand / collapse and print ----------------------------------------------
test('toggle click flips aria-expanded, body hidden and the Hide/Show text, then back', () => {
  const { doc, page, toggles } = guidePage({ s: ['a'] });
  startGuideEnhancements({ root: doc, runtime: fakeRuntime() });
  toggles[0].click();
  assert.deepEqual(expanded(toggles[0], page), { aria: 'false', text: 'Show', bodyHidden: true });
  toggles[0].click();
  assert.deepEqual(expanded(toggles[0], page), { aria: 'true', text: 'Hide', bodyHidden: false });
});

test('beforeprint opens every collapsed section and afterprint restores exactly the reader\'s collapsed set', () => {
  const { doc, page, toggles } = guidePage({ one: ['a'], two: [], three: [] });
  const runtime = fakeRuntime();
  startGuideEnhancements({ root: doc, runtime });
  toggles[0].click(); toggles[2].click();
  runtime.fire('beforeprint');
  assert.ok(toggles.every(toggle => expanded(toggle, page).aria === 'true' && !expanded(toggle, page).bodyHidden));
  runtime.fire('afterprint');
  assert.deepEqual(toggles.map(toggle => expanded(toggle, page).aria), ['false', 'true', 'false']);
  // A second print cycle with nothing collapsed leaves everything open.
  toggles[0].click(); toggles[2].click();
  runtime.fire('beforeprint'); runtime.fire('afterprint');
  assert.ok(toggles.every(toggle => expanded(toggle, page).aria === 'true'));
});

test('a repeated beforeprint in one print cycle keeps the first snapshot, afterprint restores it once and the next cycle starts fresh', () => {
  const { doc, page, toggles } = guidePage({ one: [], two: [], three: [] });
  const runtime = fakeRuntime();
  startGuideEnhancements({ root: doc, runtime });
  toggles[0].click(); toggles[2].click();
  // Print preview re-layout: beforeprint fires twice before afterprint.
  runtime.fire('beforeprint'); runtime.fire('beforeprint');
  assert.ok(toggles.every(toggle => expanded(toggle, page).aria === 'true' && !expanded(toggle, page).bodyHidden));
  runtime.fire('afterprint');
  assert.deepEqual(toggles.map(toggle => expanded(toggle, page).aria), ['false', 'true', 'false']);
  // A stray repeated afterprint changes nothing.
  runtime.fire('afterprint');
  assert.deepEqual(toggles.map(toggle => expanded(toggle, page).aria), ['false', 'true', 'false']);
  // A separate cycle snapshots the reader's current set, not the previous one.
  toggles[0].click(); toggles[1].click();
  runtime.fire('beforeprint');
  assert.ok(toggles.every(toggle => expanded(toggle, page).aria === 'true'));
  runtime.fire('afterprint');
  assert.deepEqual(toggles.map(toggle => expanded(toggle, page).aria), ['true', 'false', 'false']);
});

// --- Fragment resolution ------------------------------------------------------
test('hash resolution accepts prefixed, bare and child-target fragments and ignores malformed or foreign ones', () => {
  const { page, sections } = guidePage({ backups: ['eng-1'], network: [] });
  const root = page as unknown as ParentNode;
  assert.equal(findSectionForHash('#guide-section-backups', root), sections[0] as unknown as HTMLElement);
  assert.equal(findSectionForHash('#backups', root), sections[0] as unknown as HTMLElement);
  assert.equal(findSectionForHash('guide-body-network', root), sections[1] as unknown as HTMLElement);
  assert.equal(findSectionForHash('#guide-check-eng-1', root), sections[0] as unknown as HTMLElement);
  assert.equal(findSectionForHash('#guide-section-%62ackups', root), sections[0] as unknown as HTMLElement);
  assert.equal(findSectionForHash('', root), null);
  assert.equal(findSectionForHash('#', root), null);
  assert.equal(findSectionForHash('#%E0%A4%A', root), null); // malformed percent-encoding keeps the raw fragment
  assert.equal(findSectionForHash('#guide-toc-heading', root), null); // exists, but outside any section
  assert.equal(findSectionForHash('#guide-section-nope', root), null);
  assert.equal(findSectionForHash('#a"b]c', root), null); // reaches the escaped lookup without throwing
  // The mapped flag is set only when the fragment has no element of its own.
  assert.deepEqual(resolveHashTarget('#backups', root), { section: sections[0], mapped: true });
  assert.deepEqual(resolveHashTarget('#guide-section-backups', root), { section: sections[0], mapped: false });
  assert.deepEqual(resolveHashTarget('#guide-check-eng-1', root), { section: sections[0], mapped: false });
  assert.deepEqual(resolveHashTarget('#guide-section-nope', root), { section: null, mapped: false });
});

test('TOC click and hashchange open a collapsed section and move focus to its heading', () => {
  const { doc, page, toggles, sections } = guidePage({ one: [], two: [] });
  const runtime = fakeRuntime('#two');
  startGuideEnhancements({ root: doc, runtime });
  // Initial fragment (bare source id) is handled once on start. The browser
  // had no #two element to scroll to, so the section is scrolled explicitly
  // (block start, no smooth behaviour requested) before focus moves.
  const headingTwo = sections[1].querySelector('h2')!;
  assert.deepEqual([headingTwo.getAttribute('tabindex'), headingTwo.focused], ['-1', 1]);
  assert.deepEqual(sections[1].scrolled, [{ block: 'start' }]);

  toggles[0].click();
  assert.equal(expanded(toggles[0], page).bodyHidden, true);
  page.querySelectorAll('.guide-toc a[href^="#"]')[0].click();
  assert.deepEqual(expanded(toggles[0], page), { aria: 'true', text: 'Hide', bodyHidden: false });
  const headingOne = sections[0].querySelector('h2')!;
  assert.deepEqual([headingOne.getAttribute('tabindex'), headingOne.focused], ['-1', 1]);
  // TOC links keep native fragment navigation: no explicit scroll.
  assert.deepEqual(sections[0].scrolled, []);

  // hashchange to a prefixed target inside a collapsed section: the native
  // scroll had a hidden target, so the section is scrolled explicitly.
  toggles[0].click();
  runtime.location.hash = '#guide-section-one';
  runtime.fire('hashchange');
  assert.deepEqual([expanded(toggles[0], page).aria, headingOne.focused], ['true', 2]);
  assert.deepEqual(sections[0].scrolled, [{ block: 'start' }]);
  // hashchange to a prefixed target in an open section leaves the native landing spot alone.
  runtime.fire('hashchange');
  assert.deepEqual([headingOne.focused, sections[0].scrolled.length], [3, 1]);
  // hashchange to a legacy bare id always scrolls, open or not.
  runtime.location.hash = '#one';
  runtime.fire('hashchange');
  assert.deepEqual([headingOne.focused, sections[0].scrolled.length], [4, 2]);

  // revealSection without focus only expands.
  toggles[0].click();
  revealSection(sections[0] as unknown as HTMLElement, page as unknown as ParentNode, false);
  assert.deepEqual([expanded(toggles[0], page).aria, headingOne.focused, sections[0].scrolled.length], ['true', 4, 2]);
  // setSectionExpanded tolerates a toggle whose body is missing.
  const orphan = el('button', { 'aria-controls': 'missing' }, el('span', { 'data-guide-toggle-text': '' }));
  setSectionExpanded(orphan as unknown as HTMLElement, false, page as unknown as ParentNode);
  assert.deepEqual([orphan.getAttribute('aria-expanded'), orphan.querySelector('[data-guide-toggle-text]')!.textContent], ['false', 'Show']);
});

// --- Runtime surface ------------------------------------------------------------
test('start touches only the injected runtime: four listeners, print on demand, nothing else', () => {
  const { doc, page } = guidePage({ s: ['a'] });
  const runtime = fakeRuntime();
  startGuideEnhancements({ root: doc, runtime });
  assert.deepEqual([...runtime.listeners.keys()].sort(), ['afterprint', 'beforeprint', 'hashchange', 'pageshow']);
  assert.equal(runtime.prints, 0);
  for (const button of page.querySelectorAll('[data-guide-print]')) button.click();
  assert.equal(runtime.prints, 2);
  // The injected runtime exposes only print, addEventListener and location.
  // Any fetch, storage or cookie access would need window/document globals,
  // which this process does not define, so the whole suite would throw.
});

test('start is a no-op on a page without the guide hook', () => {
  const runtime = fakeRuntime();
  startGuideEnhancements({ root: el('html', {}, el('main', { id: 'main-content' })) as unknown as Document, runtime });
  assert.deepEqual([...runtime.listeners.keys()], []);
});
