import { FEEDS, formatBusinessTime, formatMonth, formatPeriod, formatRate, formatTime, itemKey, parseFeedback, parseMetrics, readFeed, retainFeedback } from '../lib/website-proof.mjs';
import { googleRatingLabel, parseGoogleRating } from '../lib/google-rating.mjs';

// The projection is never stored in a cookie, localStorage or a service worker.
// Existing nodes survive revalidation: only withdrawals are removed while reading.
export function startWebsiteProof({ root = document, runtime = window, fetcher = fetch } = {}) {
  const containers = [...root.querySelectorAll('[data-website-proof]')];
  const googleLinks = [...root.querySelectorAll('[data-google-rating]')];
  if (!containers.length && !googleLinks.length) return;
  const feeds = { ...FEEDS, ...(googleLinks.length ? { google: '/api/google-rating' } : {}) };
  const startedAt = Date.now(), monotonicStart = runtime.performance.now();
  let serverTime = 0, serverTick = 0;
  const now = () => Math.max(Date.now(), startedAt + runtime.performance.now() - monotonicStart, serverTime + runtime.performance.now() - serverTick);
  let suspended = root.visibilityState === 'hidden', disposed = false, generation = 0;
  const states = Object.fromEntries(Object.keys(feeds).map(feed => [feed, { values: [], initialised: false, expiry: 0, timer: null, controller: null }]));
  const element = (tag, text, className) => {
    const node = root.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function paint(feed) {
    const state = states[feed];
    if (feed === 'google') {
      const valid = !suspended && state.expiry > now() && state.values.length;
      for (const link of googleLinks) link.querySelector('[data-google-rating-label]').textContent = valid ? googleRatingLabel(state.values[0]) : 'Read our reviews';
      return;
    }
    for (const container of containers) {
      const section = container.querySelector(`[data-proof-${feed}]`);
      if (!section) continue;
      const fallback = container.querySelector('[data-proof-fallback]');
      const cards = section.querySelector(feed === 'metrics' ? '[data-proof-metric-cards]' : '[data-proof-feedback-cards]');
      const values = state.values;
      if (suspended || state.expiry <= now() || !values.length) {
        if (fallback) fallback.hidden = false;
        section.hidden = true;
        cards.replaceChildren();
        continue;
      }
      if (fallback) fallback.hidden = true;
      if (feed === 'metrics') {
        const metric = values[0], keys = values.map(value => value.key).join(' ');
        // Keep the disclosure node, its open state and keyboard focus on refresh
        // while the same figures are showing.
        if (cards.dataset.proofCompact === 'true' && cards.firstElementChild && cards.dataset.proofKeys === keys) {
          for (const value of values) {
            const pair = cards.querySelector(`[data-proof-metric="${value.key}"]`);
            pair.querySelector('.proof-time').textContent = formatTime(value.value_seconds);
            pair.querySelector('.proof-rate').textContent = formatRate(value.service_rate_percent);
          }
          cards.querySelector('.proof-period').textContent = `Reporting period: ${formatPeriod(metric)} (UK dates).`;
          section.hidden = false;
          continue;
        }
        if (cards.dataset.proofCompact === 'true') {
          // Calls, then tickets. Both share the same 28 complete UK days.
          const labels = { call_wait: ['Average queue wait for answered support calls', 'Eligible support queue calls answered by a person'],
            ticket_first_response: ['Average first reply to support emails, in business hours', 'Support emails answered within one business hour'] };
          const card = element('article');
          for (const value of values) {
            const pair = element('dl', undefined, 'proof-pair');
            pair.dataset.proofMetric = value.key;
            const time = element('div'), rate = element('div');
            time.append(element('dt', labels[value.key][0]), element('dd', formatTime(value.value_seconds), 'proof-time'));
            rate.append(element('dt', labels[value.key][1]), element('dd', formatRate(value.service_rate_percent), 'proof-rate'));
            pair.append(time, rate);
            card.append(pair);
          }
          const details = element('details', undefined, 'proof-method');
          details.append(element('summary', 'How we measure these figures'), element('p', 'Average wait is measured from joining the support queue to a person answering, among answered calls only. The answer rate includes missed and abandoned calls as unanswered.'));
          if (values.some(value => value.key === 'ticket_first_response')) details.append(element('p', 'First reply covers support issues our clients raised by email or our portal: the time to the first written reply from a technician, counted in business hours (Mon–Fri 09:00–17:30 UK, excluding bank holidays). Unanswered issues count against the one-hour figure. Automated notifications, billing and sales emails are excluded.'));
          details.append(element('p', 'These figures are not a time to fix a problem or every customer’s experience.'));
          card.append(element('p', `Reporting period: ${formatPeriod(metric)} (UK dates).`, 'proof-period'), element('p', 'Past results, not a promise.', 'proof-note'), details);
          cards.dataset.proofKeys = keys;
          cards.replaceChildren(card);
        } else cards.replaceChildren(...values.map(metric => {
          const card = element('article');
          if (metric.key === 'call_wait') card.append(element('h3', 'Average queue wait for answered support calls'), element('p', formatTime(metric.value_seconds), 'proof-time'),
            element('p', `${formatRate(metric.service_rate_percent)} of eligible support queue calls answered by a person`, 'proof-rate'),
            element('p', 'From joining the support queue to a human answer, among answered calls. Missed and abandoned calls remain in the answer-rate denominator.'));
          else card.append(element('h3', 'Average first reply to support emails'), element('p', formatBusinessTime(metric.value_seconds), 'proof-time'),
            element('p', `${formatRate(metric.service_rate_percent)} answered within one business hour`, 'proof-rate'),
            element('p', 'Support issues our clients raised by email or our portal. Time to the first written reply from a technician, counted in business hours (Mon–Fri 09:00–17:30 UK, excluding bank holidays). Unanswered issues count against the one-hour figure. Automated notifications, billing and sales emails are excluded.'));
          card.append(element('p', `Reporting period: ${formatPeriod(metric)} (UK dates).`, 'proof-period'));
          return card;
        }));
      } else {
        const retained = new Set(state.values.map(itemKey));
        for (const card of [...cards.children]) if (!retained.has(card.dataset.proofKey)) card.remove();
        // Populate on the first render (or after a cleared suspended view) only.
        if (!cards.children.length) for (const item of state.values) {
          const card = element('blockquote');
          card.dataset.proofKey = itemKey(item);
          const footer = element('footer');
          footer.append(element('strong', item.first_name));
          if (item.rating !== null) footer.append(element('span', ` · ${item.rating}`));
          if (item.feedback_month !== null) { const time = element('time', ` · ${formatMonth(item.feedback_month)}`); time.dateTime = item.feedback_month; footer.append(time); }
          card.append(element('p', item.comment), footer);
          cards.append(card);
        }
      }
      section.hidden = false;
    }
  }
  function clear(feed) {
    const state = states[feed];
    state.values = []; state.expiry = 0;
    runtime.clearTimeout(state.timer); state.timer = null;
    paint(feed);
  }
  function expire(feed) {
    const state = states[feed];
    runtime.clearTimeout(state.timer);
    if (state.expiry <= now()) return clear(feed);
    state.timer = runtime.setTimeout(() => expire(feed), Math.min(state.expiry - now(), 60_000));
  }
  async function refresh(feed, force = false) {
    const state = states[feed];
    if (suspended || disposed || state.controller) return;
    // Google's provider defines a bounded observation lifetime. Reuse it until
    // expiry, while always revalidating when a reader returns to the page.
    if (feed === 'google' && !force && state.values.length && state.expiry > now()) return;
    if (state.expiry <= now()) clear(feed);
    const controller = new AbortController(), currentGeneration = generation;
    state.controller = controller;
    const timeout = runtime.setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetcher(feeds[feed], { signal: controller.signal, credentials: 'omit', cache: 'no-store', redirect: 'error', headers: { Accept: 'application/json' } });
      const data = await readFeed(response);
      if (disposed || suspended || currentGeneration !== generation || controller.signal.aborted) return;
      const date = Date.parse(response.headers.get('x-proof-source-date') ?? ''), age = response.headers.get('age') ?? '0';
      if (Number.isFinite(date) && /^\d+$/.test(age)) { serverTime = Math.max(now(), date + Number(age) * 1000); serverTick = runtime.performance.now(); }
      if (feed === 'google') {
        state.values = parseGoogleRating(data, now());
        state.expiry = state.values[0]?.expiry ?? 0;
      } else if (feed === 'metrics') {
        state.values = parseMetrics(data, now());
        // The earliest expiry clears both figures; the next minute's check restores the fresh one.
        state.expiry = state.values.length ? Math.min(...state.values.map(metric => metric.expiry)) : 0;
      } else {
        const valid = parseFeedback(data, now());
        state.values = state.initialised ? retainFeedback(state.values, valid) : (valid?.items ?? []);
        state.expiry = valid?.expiry ?? 0;
      }
      // A failed/empty first attempt has shown the reader nothing yet. Allow a
      // later first selection, then retain only those cards for this visit.
      if (state.values.length) state.initialised = true;
      paint(feed); expire(feed);
    } catch {
      if (currentGeneration === generation && !disposed) clear(feed);
    } finally {
      runtime.clearTimeout(timeout);
      if (state.controller === controller) state.controller = null;
    }
  }
  const refreshAll = (force = false) => { for (const feed of Object.keys(feeds)) void refresh(feed, force); };
  function hide() {
    suspended = true; generation++;
    for (const feed of Object.keys(feeds)) { states[feed].controller?.abort(); states[feed].controller = null; paint(feed); }
  }
  function restore() {
    // Never reveal a pre-suspension snapshot before a new valid response.
    hide(); suspended = false; refreshAll(true);
  }
  const visibility = () => root.visibilityState === 'hidden' ? hide() : restore();
  const pagehide = event => { hide(); if (!event.persisted) dispose(); };
  const pageshow = event => { if (event.persisted) restore(); };
  const interval = runtime.setInterval(refreshAll, 60_000);
  root.addEventListener('visibilitychange', visibility);
  runtime.addEventListener('pagehide', pagehide);
  runtime.addEventListener('pageshow', pageshow);
  function dispose() {
    disposed = true; runtime.clearInterval(interval);
    for (const feed of Object.keys(feeds)) { states[feed].controller?.abort(); clear(feed); }
    root.removeEventListener('visibilitychange', visibility);
    runtime.removeEventListener('pagehide', pagehide);
    runtime.removeEventListener('pageshow', pageshow);
  }
  refreshAll();
  return { dispose };
}
