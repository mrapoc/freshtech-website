// Progressive enhancement for /guides/[industry] (GuidePage.astro). The
// server-rendered page is complete without this script: every section is
// open, the checklist checkboxes work natively and nothing here is required
// to read or print the guide. This script only adds what the React page did
// with state:
//   - reveals the Print Guide / Save as PDF buttons (both call window.print)
//   - reveals the checklist progress strip and keeps count, percentage,
//     <progress> value and the Complete! status in step with the checkboxes
//   - reveals the per-section Hide/Show toggles (aria-expanded + hidden body)
//     and lets a click on the section header toggle it, as in the source
//   - expands every collapsed section before printing and restores the
//     reader's collapsed set afterwards, so a printout is always complete
//   - expands a collapsed section when the table of contents, a direct
//     fragment URL or a hashchange points at it (the source's TOC set the
//     section open in state before scrolling), then moves focus to its
//     heading so keyboard and screen-reader users land where they navigated
//   - scrolls to the section itself when the browser's own fragment
//     navigation had nothing to land on: a source bare id (#workstations)
//     that only exists here as #guide-section-workstations, or a target
//     inside a body that was hidden when the fragment changed
// Nothing is persisted: no localStorage, no cookies, no requests.

interface GuideRuntime {
  print(): void;
  addEventListener(type: 'beforeprint' | 'afterprint' | 'pageshow' | 'hashchange', listener: (event: Event) => void): void;
  location?: { hash: string };
}

// Maps a URL fragment to the guide section it points at, or null. Accepts the
// prefixed ids this page renders (#guide-section-backups), the source page's
// bare section ids (#backups) for old links, and any id inside a section
// (#guide-check-…). The fragment is decoded defensively and only ever used
// through CSS.escape, so no selector can be injected. `mapped` is true when
// the fragment itself matches no element and the section was found through
// the guide-section- prefix: the browser's fragment scroll had no target.
export interface HashTarget { section: HTMLElement | null; mapped: boolean }
export function resolveHashTarget(hash: string, root: ParentNode): HashTarget {
  let id = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!id) return { section: null, mapped: false };
  try { id = decodeURIComponent(id); } catch { /* keep the raw fragment */ }
  const byId = (candidate: string) => root.querySelector<HTMLElement>(`#${CSS.escape(candidate)}`);
  const direct = byId(id);
  const target = direct ?? byId(`guide-section-${id}`);
  if (!target) return { section: null, mapped: false };
  return { section: target.closest<HTMLElement>('[data-guide-section]'), mapped: !direct };
}
export function findSectionForHash(hash: string, root: ParentNode): HTMLElement | null {
  return resolveHashTarget(hash, root).section;
}

// Expands the section if collapsed and, when asked, moves focus to its heading
// (made programmatically focusable, so it never joins the tab order and never
// traps). Scrolling is normally left to the browser's own fragment
// navigation; `scroll` asks for an explicit jump to the section start (its
// scroll-margin keeps the heading clear of the sticky header) for the cases
// where native navigation had no visible target. No smooth motion is
// requested, so reduced-motion preferences and the page's own
// scroll-behavior are respected.
export function revealSection(section: HTMLElement, root: ParentNode, focus = true, scroll = false) {
  const toggle = section.querySelector<HTMLElement>('[data-guide-toggle]');
  if (toggle && !isSectionExpanded(toggle)) setSectionExpanded(toggle, true, root);
  if (scroll) section.scrollIntoView({ block: 'start' });
  if (!focus) return;
  const heading = section.querySelector<HTMLElement>('[data-guide-header] h2') ?? section;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
}

export interface GuideProgress { completed: number; total: number; percent: number }

export function readGuideProgress(root: ParentNode): GuideProgress {
  const boxes = [...root.querySelectorAll<HTMLInputElement>('[data-guide-check]')];
  const total = boxes.length;
  const completed = boxes.filter(box => box.checked).length;
  // Same rounding as the source: Math.round((completed / total) * 100), 0 when empty.
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}

export function renderGuideProgress(root: ParentNode, progress: GuideProgress) {
  const strip = root.querySelector<HTMLElement>('[data-guide-progress]');
  if (!strip) return;
  const count = strip.querySelector<HTMLElement>('[data-guide-progress-count]');
  const percent = strip.querySelector<HTMLElement>('[data-guide-progress-percent]');
  const bar = strip.querySelector<HTMLProgressElement>('[data-guide-progress-bar]');
  const complete = strip.querySelector<HTMLElement>('[data-guide-progress-complete]');
  if (count) count.textContent = String(progress.completed);
  if (percent) percent.textContent = `${progress.percent}%`;
  if (bar) {
    bar.max = progress.total;
    bar.value = progress.completed;
    bar.textContent = `${progress.percent}%`;
  }
  if (complete) complete.hidden = progress.percent !== 100;
}

export function setSectionExpanded(toggle: HTMLElement, expanded: boolean, root: ParentNode) {
  const bodyId = toggle.getAttribute('aria-controls');
  const body = bodyId ? root.querySelector<HTMLElement>(`#${CSS.escape(bodyId)}`) : null;
  toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  const text = toggle.querySelector<HTMLElement>('[data-guide-toggle-text]');
  if (text) text.textContent = expanded ? 'Hide' : 'Show';
  if (body) body.hidden = !expanded;
}

export function isSectionExpanded(toggle: HTMLElement) {
  return toggle.getAttribute('aria-expanded') !== 'false';
}

interface GuideEnhancementOptions { root?: Document; runtime?: GuideRuntime }

export function startGuideEnhancements({ root = document, runtime = window }: GuideEnhancementOptions = {}) {
  const page = root.querySelector<HTMLElement>('[data-guide-page]');
  if (!page) return;

  // Print / Save as PDF: both open the print dialog, exactly as the source.
  const actions = page.querySelector<HTMLElement>('[data-guide-actions]');
  page.querySelectorAll<HTMLButtonElement>('[data-guide-print]').forEach(button => {
    button.addEventListener('click', () => runtime.print());
  });
  if (actions) actions.hidden = false;

  // Checklist progress. The strip stays hidden when there is nothing to count
  // (the source renders it only when totalItems > 0).
  const boxes = [...page.querySelectorAll<HTMLInputElement>('[data-guide-check]')];
  const strip = page.querySelector<HTMLElement>('[data-guide-progress]');
  const refreshProgress = () => renderGuideProgress(page, readGuideProgress(page));
  if (boxes.length > 0 && strip) {
    boxes.forEach(box => box.addEventListener('change', refreshProgress));
    refreshProgress();
    strip.hidden = false;
    // BFCache and form restoration can bring checkboxes back already ticked.
    runtime.addEventListener('pageshow', refreshProgress);
  }

  // Expand / collapse. Toggles are hidden until now so a reader without this
  // script never sees a dead control.
  const toggles = [...page.querySelectorAll<HTMLElement>('[data-guide-toggle]')];
  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => setSectionExpanded(toggle, !isSectionExpanded(toggle), page));
    toggle.hidden = false;
  });
  // The source toggled on the whole header; clicks that are not already on the
  // toggle (or on a link/heading text selection) forward to it.
  page.querySelectorAll<HTMLElement>('[data-guide-header]').forEach(header => {
    const toggle = header.querySelector<HTMLElement>('[data-guide-toggle]');
    if (!toggle) return;
    header.classList.add('guide-section-header-clickable');
    header.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (target && (toggle.contains(target) || target.closest('a'))) return;
      if (root.getSelection?.()?.toString()) return;
      toggle.click();
    });
  });

  // Fragment navigation into a collapsed section. TOC links keep their native
  // behaviour (hash update, scroll, history, Enter/Space activation); the
  // section is opened first so the scroll lands on visible content, and focus
  // moves to the heading. hashchange covers back/forward and address-bar
  // edits; the initial fragment is handled once on start. For those two the
  // browser has already tried to scroll before this code runs, so a mapped
  // source id (no element of its own) or a target inside a hidden body is
  // scrolled to explicitly; a prefixed target in an open section is not
  // touched, keeping the native landing spot.
  page.querySelectorAll<HTMLAnchorElement>('.guide-toc a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      const section = findSectionForHash(link.getAttribute('href') ?? '', page);
      if (section) revealSection(section, page);
    });
  });
  const revealFromLocation = () => {
    const hash = runtime.location?.hash ?? '';
    const { section, mapped } = hash ? resolveHashTarget(hash, page) : { section: null, mapped: false };
    if (!section) return;
    const toggle = section.querySelector<HTMLElement>('[data-guide-toggle]');
    const collapsed = !!toggle && !isSectionExpanded(toggle);
    revealSection(section, page, true, mapped || collapsed);
  };
  runtime.addEventListener('hashchange', revealFromLocation);
  revealFromLocation();

  // Printing must show every section. CSS already forces hidden bodies visible
  // in @media print; this keeps aria-expanded truthful during the print and
  // restores the reader's collapsed set afterwards. Browsers can fire
  // beforeprint more than once per print cycle (print preview re-layouts);
  // the snapshot is taken only on the first, since every section is already
  // open by the second and re-snapshotting would lose the reader's set.
  // afterprint restores and clears, so a repeat is harmless and the next
  // separate cycle takes a fresh snapshot.
  let collapsedForPrint: HTMLElement[] | null = null;
  runtime.addEventListener('beforeprint', () => {
    if (collapsedForPrint) return;
    collapsedForPrint = toggles.filter(toggle => !isSectionExpanded(toggle));
    collapsedForPrint.forEach(toggle => setSectionExpanded(toggle, true, page));
  });
  runtime.addEventListener('afterprint', () => {
    collapsedForPrint?.forEach(toggle => setSectionExpanded(toggle, false, page));
    collapsedForPrint = null;
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  startGuideEnhancements();
}
