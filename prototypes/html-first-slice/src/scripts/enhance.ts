import { createConsentController } from './consent';
document.documentElement.classList.add('enhanced');

const calculator = document.querySelector<HTMLElement>('[data-calculator]');
if (calculator) {
  const rates = JSON.parse(calculator.dataset.rates ?? '{}') as Record<string, number>;
  const minimum = Number(calculator.dataset.minimum);
  const people = calculator.querySelector<HTMLInputElement>('#people');
  const radios = [...calculator.querySelectorAll<HTMLInputElement>('input[name="tier"]')];
  const usersOutput = calculator.querySelector<HTMLOutputElement>('[data-users]');
  const tierOutput = calculator.querySelector<HTMLElement>('[data-tier]');
  const rateOutput = calculator.querySelector<HTMLElement>('[data-rate]');
  const monthlyOutput = calculator.querySelector<HTMLElement>('[data-monthly]');
  const yearlyOutput = calculator.querySelector<HTMLElement>('[data-yearly]');
  const minimumMessage = calculator.querySelector<HTMLElement>('[data-minimum-message]');

  const update = () => {
    if (!people || !usersOutput || !tierOutput || !rateOutput || !monthlyOutput || !yearlyOutput || !minimumMessage) return;
    const tier = radios.find((radio) => radio.checked)?.value ?? 'Plus';
    const users = Number(people.value);
    const rate = rates[tier];
    const rawMonthly = users * rate;
    const minimumApplied = tier !== 'Premium' && rawMonthly < minimum;
    const monthly = minimumApplied ? minimum : rawMonthly;
    usersOutput.value = String(users);
    tierOutput.textContent = tier;
    rateOutput.textContent = String(rate);
    monthlyOutput.textContent = monthly.toLocaleString('en-GB');
    yearlyOutput.textContent = (monthly * 12).toLocaleString('en-GB');
    minimumMessage.hidden = !minimumApplied;
    minimumMessage.textContent = minimumApplied
      ? `£${minimum}/month minimum applied (you'd be at £${rawMonthly} otherwise, kept fair both ways).`
      : '';
  };

  people?.addEventListener('input', update);
  radios.forEach((radio) => radio.addEventListener('change', update));
  update();
  window.addEventListener('pageshow', update);
}

// Review pool grid (/why-trust-us). The markup already shows a default set;
// the module only swaps in a random selection, so a failed import leaves the
// no-JS baseline as delivered.
if (document.querySelector('[data-review-pool]')) {
  void import('./review-pool').then(({ enhanceReviewPool }) => { enhanceReviewPool(document); }).catch(() => {});
}

// Shared testimonials section (SourceTestimonials.astro). The controller is
// loaded on demand only when the section is present, so routes without it
// never fetch the module. A failed import is swallowed on purpose: the markup
// is already the no-JS baseline (every review and logo visible, the filter and
// rotation controls hidden), and nothing here touches it until the controller
// has loaded, so visibility is unchanged if it never does. No consent hooks.
const testimonialsSection = document.querySelector<HTMLElement>('[data-testimonials]');
if (testimonialsSection) {
  let active = true;
  let controller: { destroy(): void } | null = null;
  window.addEventListener('pagehide', event => {
    if (!(event as PageTransitionEvent).persisted) {
      active = false;
      controller?.destroy();
    }
  });
  void import('./testimonials').then(({ enhanceTestimonials }) => {
    if (active) controller = enhanceTestimonials(document);
  }).catch(() => {
    // Leave the server-rendered baseline exactly as delivered.
  });
}

// Email security checker (/email-security-check). Loaded on demand only when
// the tool is present. A failed import leaves the no-JS baseline in place:
// the form has no working submit handler and the <noscript> note inside the
// tool already tells the visitor to call or use /contact instead.
const emailChecker = document.querySelector<HTMLElement>('[data-email-checker]');
if (emailChecker) {
  void import('./email-checker').then(({ init }) => {
    init(document.body);
  }).catch(() => {
    // Leave the server-rendered baseline exactly as delivered.
  });
}

const mobileMenu = document.querySelector<HTMLDetailsElement>('[data-mobile-menu]');
if (mobileMenu) {
  const summary = mobileMenu.querySelector<HTMLElement>('summary');
  const desktop = window.matchMedia('(min-width: 1024px)');
  const focusable = () => [...mobileMenu.querySelectorAll<HTMLElement>('summary, a[href], button:not([disabled])')];
  const closeAtDesktop = () => {
    if (desktop.matches && mobileMenu.open) mobileMenu.open = false;
  };
  desktop.addEventListener('change', closeAtDesktop);
  mobileMenu.addEventListener('toggle', () => {
    document.body.classList.toggle('menu-open', mobileMenu.open);
    summary?.setAttribute('aria-label', mobileMenu.open ? 'Close menu' : 'Open menu');
  });
  mobileMenu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileMenu.open) {
      mobileMenu.open = false;
      summary?.focus();
      event.preventDefault();
      return;
    }
    if (event.key !== 'Tab' || !mobileMenu.open) return;
    const items = focusable();
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      last?.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first?.focus();
      event.preventDefault();
    }
  });
}

document.querySelectorAll<HTMLDetailsElement>('[data-disclosure]').forEach((details) => {
  const summary = details.querySelector<HTMLElement>('summary');
  details.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && details.open) {
      details.open = false;
      summary?.focus();
      event.preventDefault();
    }
  });
  details.addEventListener('focusout', (event) => {
    if (event.relatedTarget instanceof Node && !details.contains(event.relatedTarget)) details.open = false;
  });
});

const consent = createConsentController();
consent.autoArm();
const banner = document.querySelector<HTMLElement>('[data-cookie-banner]');
const cookieDialog = document.querySelector<HTMLDialogElement>('[data-cookie-dialog]');
const analyticsToggle = document.querySelector<HTMLInputElement>('[data-analytics]');
let cookieOpener: HTMLElement | null = null;

const readConsent = consent.getConsent;

function storeConsent(analytics: boolean) {
  consent.setConsent(analytics);
  if (banner) banner.hidden = true;
  if (cookieDialog?.open) cookieDialog.close();
}

if (banner && !readConsent() && !cookieDialog?.open) banner.hidden = false;
document.querySelectorAll<HTMLElement>('[data-consent]').forEach(button => button.addEventListener('click', () => {
  const choice = button.dataset.consent;
  if (choice === 'customise') {
    cookieOpener = button;
    if (banner) banner.hidden = true;
    if (analyticsToggle) analyticsToggle.checked = readConsent()?.analytics ?? false;
    cookieDialog?.showModal();
    cookieDialog?.querySelector<HTMLElement>('#cookie-settings-title')?.focus();
  } else storeConsent(choice === 'accept');
}));
consent.onOpenSettings(() => {
  if (banner) banner.hidden = true;
  if (analyticsToggle) analyticsToggle.checked = readConsent()?.analytics ?? false;
  if (!cookieDialog?.open) cookieDialog?.showModal();
  cookieDialog?.querySelector<HTMLElement>('#cookie-settings-title')?.focus();
});
document.querySelectorAll<HTMLElement>('[data-cookie-settings]').forEach(button => button.addEventListener('click', () => {
  cookieOpener = button;
  consent.openCookieSettings();
}));
document.querySelector<HTMLElement>('[data-save-consent]')?.addEventListener('click', event => { event.preventDefault(); storeConsent(analyticsToggle?.checked ?? false); });
document.querySelector<HTMLElement>('[data-dialog-accept]')?.addEventListener('click', event => { event.preventDefault(); storeConsent(true); });
document.querySelector<HTMLElement>('[data-dialog-reject]')?.addEventListener('click', event => { event.preventDefault(); storeConsent(false); });
cookieDialog?.addEventListener('close', () => {
  if (!readConsent() && banner) banner.hidden = false;
  if (cookieOpener && cookieOpener.offsetParent !== null) cookieOpener.focus();
  else [...document.querySelectorAll<HTMLElement>('[data-cookie-settings]')].find(element => element.offsetParent !== null)?.focus();
});

// Problem and comparison pages: consent-gated `service_view` (mirrors the React
// pages' trackServiceView('problem_' + slug) and ('comparison_' + slug)). Loaded
// on demand only when either family's main element is present, reusing the
// single controller above; the helper
// never loads a vendor or touches storage. A non-persisted pagehide tears the
// helper down; a persisted (back-forward cache) one leaves it intact. If the
// import resolves after pagehide, the helper is simply never started.
const problemPage = document.querySelector<HTMLElement>('[data-problem-page]');
const comparisonPage = document.querySelector<HTMLElement>('[data-comparison-page]');
const viewPage = problemPage ?? comparisonPage;
if (viewPage) {
  let active = true;
  let view: { dispose(): void } | null = null;
  window.addEventListener('pagehide', event => {
    if (!(event as PageTransitionEvent).persisted) {
      active = false;
      view?.dispose();
    }
  });
  void import('./problem-view').then(({ trackProblemView, browserProblemViewEnv, COMPARISON_LABEL_PREFIX, PROBLEM_LABEL_PREFIX }) => {
    if (!active) return;
    view = problemPage
      ? trackProblemView(problemPage.dataset.problemPage, browserProblemViewEnv(consent), PROBLEM_LABEL_PREFIX)
      : trackProblemView(viewPage.dataset.comparisonPage, browserProblemViewEnv(consent), COMPARISON_LABEL_PREFIX);
  }).catch(() => {
    // Analytics is best-effort; the page is unaffected.
  });
}
