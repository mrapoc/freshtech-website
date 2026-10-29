import postcss from 'postcss';

const START_COMMENT = 'Complete pricing route';
const FOLLOWING_CASE_SELECTOR = '.cs-hero .service-hero-grid';

const selectorsOf = rule => rule.selectors.map(selector => selector.trim());

// `standalone: true` validates a stylesheet that contains only pricing CSS
// (src/styles/pricing.css): the block runs from the start marker to end of
// file. The default keeps the legacy global.css contract, where the block ends
// at the first following case-study rule.
export function assertPricingCssScoped(css, { standalone = false } = {}) {
  const root = postcss.parse(css, { from: undefined });
  const start = root.nodes.findIndex(node => node.type === 'comment' && node.text.trim() === START_COMMENT);
  if (start < 0) throw new Error('Complete pricing CSS block marker is missing');
  const boundary = standalone ? root.nodes.length : root.nodes.findIndex((node, index) => {
    if (index <= start) return false;
    let found = false;
    if (node.type === 'rule') found = selectorsOf(node).includes(FOLLOWING_CASE_SELECTOR);
    else if ('walkRules' in node) node.walkRules(rule => {
      if (selectorsOf(rule).includes(FOLLOWING_CASE_SELECTOR)) found = true;
    });
    return found;
  });
  if (boundary < 0) throw new Error('Complete pricing CSS block or following case-study boundary is missing');

  const pricingRules = [];
  const collectRules = node => {
    if (node.type === 'rule') pricingRules.push(node);
    if ('nodes' in node && node.nodes) node.nodes.forEach(collectRules);
  };
  root.nodes.slice(start + 1, boundary).forEach(collectRules);
  if (!pricingRules.length) throw new Error('Complete pricing CSS block has no rules');

  for (const rule of pricingRules) {
    for (const selector of selectorsOf(rule)) {
      if (selector !== '.pricing-page' && !selector.startsWith('.pricing-page ')) {
        throw new Error(`Pricing CSS selector is not route-scoped: ${selector}`);
      }
    }
  }

  const finePrintSelectors = [];
  root.walkRules(rule => finePrintSelectors.push(...selectorsOf(rule).filter(selector => selector.endsWith('.fine-print'))));
  if (!finePrintSelectors.includes('.pricing-page .fine-print') || finePrintSelectors.includes('.fine-print')) {
    throw new Error('Pricing fine print selector is not route-scoped');
  }
}
