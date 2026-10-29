// Progressive enhancement for the /case-studies sector filter. The server
// renders every study and hides the filter toolbar; this script reveals the
// toolbar, tracks the pressed sector, hides non-matching cards and updates the
// result count using the same label rules as pages-v2/CaseStudiesPageV2.tsx.
const toolbar = document.querySelector<HTMLElement>('[data-case-study-filters]');
const grid = document.querySelector<HTMLElement>('[data-case-study-grid]');

if (toolbar && grid) {
  const buttons = [...toolbar.querySelectorAll<HTMLButtonElement>('button[data-sector]')];
  const cards = [...grid.querySelectorAll<HTMLElement>('[data-industry]')];
  const count = document.querySelector<HTMLElement>('[data-filter-count]');
  const empty = document.querySelector<HTMLElement>('[data-filter-empty]');
  const total = cards.length;

  const apply = (sector: string) => {
    let shown = 0;
    for (const card of cards) {
      const match = sector === 'All' || card.dataset.industry === sector;
      card.hidden = !match;
      if (match) shown++;
    }
    for (const button of buttons) button.setAttribute('aria-pressed', button.dataset.sector === sector ? 'true' : 'false');
    if (count) count.textContent = sector === 'All' ? `${total} stories` : `${shown} in ${sector}`;
    if (empty) empty.hidden = shown > 0;
    grid.dataset.activeSector = sector;
  };

  for (const button of buttons) button.addEventListener('click', () => apply(button.dataset.sector ?? 'All'));
  toolbar.hidden = false;
  apply('All');
}
