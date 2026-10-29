// Progressive enhancement for the /blog category filter. The server renders
// every published card; this script reveals the chip toolbar, upgrades the
// hero category links from anchors into filters, hides non-matching cards,
// hides the featured block outside "All" and updates the label and count with
// the same rules as pages-v2/BlogPageV2.tsx.
const page = document.querySelector<HTMLElement>('[data-blog-page]');
const grid = page?.querySelector<HTMLElement>('[data-blog-grid]');
const toolbar = page?.querySelector<HTMLElement>('[data-blog-filters]');

if (page && grid && toolbar) {
  const chips = [...toolbar.querySelectorAll<HTMLButtonElement>('button[data-filter]')];
  const heroLinks = [...page.querySelectorAll<HTMLAnchorElement>('a[data-filter]')];
  const cards = [...grid.querySelectorAll<HTMLElement>('[data-post-category]')];
  const label = page.querySelector<HTMLElement>('[data-filter-label]');
  const count = page.querySelector<HTMLElement>('[data-filter-count]');
  const featured = page.querySelector<HTMLElement>('[data-blog-featured]');
  const empty = page.querySelector<HTMLElement>('[data-filter-empty]');

  const apply = (filter: string) => {
    let shown = 0;
    for (const card of cards) {
      const match = filter === 'All' || card.dataset.postCategory === filter;
      card.hidden = !match;
      if (match) shown++;
    }
    for (const chip of chips) chip.setAttribute('aria-pressed', chip.dataset.filter === filter ? 'true' : 'false');
    for (const link of heroLinks) {
      if (link.dataset.filter === filter) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    if (label) label.textContent = filter === 'All' ? 'All articles' : filter;
    if (count) count.textContent = `${shown} ${shown === 1 ? 'article' : 'articles'}`;
    if (featured) featured.hidden = filter !== 'All';
    if (empty) empty.hidden = shown > 0;
    grid.dataset.activeFilter = filter;
  };

  for (const chip of chips) chip.addEventListener('click', () => apply(chip.dataset.filter ?? 'All'));
  for (const link of heroLinks) {
    link.addEventListener('click', event => {
      event.preventDefault();
      apply(link.dataset.filter ?? 'All');
    });
  }
  toolbar.hidden = false;
  apply('All');
}
