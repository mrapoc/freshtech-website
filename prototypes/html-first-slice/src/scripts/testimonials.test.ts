import assert from 'node:assert/strict';
import test from 'node:test';
import { ROTATION_MS, enhanceTestimonials, type TestimonialElement, type TestimonialEnv } from './testimonials.ts';

// Synthetic records and a tiny fake DOM only; no browser, no network.

class FakeElement implements TestimonialElement {
  hidden = false;
  textContent: string | null = '';
  classes = new Set<string>();
  classList = {
    add: (...names: string[]) => names.forEach(name => this.classes.add(name)),
    remove: (...names: string[]) => names.forEach(name => this.classes.delete(name)),
  };
  private attrs = new Map<string, string>();
  private listeners = new Map<string, Array<(event?: unknown) => void>>();
  children = new Map<string, FakeElement[]>();

  constructor(attrs: Record<string, string> = {}) { Object.entries(attrs).forEach(([name, value]) => this.attrs.set(name, value)); }
  getAttribute(name: string) { return this.attrs.get(name) ?? null; }
  setAttribute(name: string, value: string) { this.attrs.set(name, value); }
  removeAttribute(name: string) { this.attrs.delete(name); }
  addEventListener(type: string, listener: (event?: unknown) => void) { this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]); }
  dispatch(type: string, event?: unknown) { (this.listeners.get(type) ?? []).forEach(listener => listener(event)); }
  querySelectorAll(selector: string) { return this.children.get(selector) ?? []; }
  querySelector(selector: string) { return (this.children.get(selector) ?? [])[0] ?? null; }
  contains(node: unknown) { return node === this || [...this.children.values()].some(list => list.some(child => child === node || child.contains(node))); }
}

function fakeClock() {
  let now = 0;
  let nextId = 1;
  const timers = new Map<number, { at: number; handler: () => void }>();
  return {
    pending: () => timers.size,
    setTimeout(handler: () => void, ms: number) { const id = nextId++; timers.set(id, { at: now + ms, handler }); return id; },
    clearTimeout(handle: unknown) { timers.delete(handle as number); },
    advance(ms: number) {
      const target = now + ms;
      for (;;) {
        const due = [...timers.entries()].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        timers.delete(due[0]);
        now = due[1].at;
        due[1].handler();
      }
      now = target;
    },
  };
}

function fixture(categories: string[], options: { reduced?: boolean; hidden?: boolean; logos?: number } = {}) {
  const section = new FakeElement({ 'data-testimonials': '' });
  const items = categories.map((category, index) => new FakeElement({ 'data-testimonials-item': '', 'data-category': category, 'data-index': String(index) }));
  const dots = categories.map((_, index) => new FakeElement({ 'data-testimonials-dot': '', 'data-index': String(index) }));
  const filters = ['all', 'alpha', 'beta', 'gamma'].map(key => new FakeElement({ 'data-testimonials-filter': key }));
  const pause = new FakeElement({ 'data-testimonials-pause': '' });
  const filterBox = new FakeElement({ 'data-testimonials-filters': '' });
  const controls = new FakeElement({ 'data-testimonials-controls': '' });
  const card = new FakeElement({ 'data-testimonials-card': '' });
  const empty = new FakeElement({ 'data-testimonials-empty': '' });
  const stack = new FakeElement({ 'data-testimonials-stack': '', 'aria-live': 'off' });
  const logos = Array.from({ length: options.logos ?? 2 }, () => new FakeElement({ 'data-testimonials-logo': '' }));
  filterBox.hidden = true; controls.hidden = true; empty.hidden = true;
  section.children.set('[data-testimonials-item]', items);
  section.children.set('[data-testimonials-dot]', dots);
  section.children.set('[data-testimonials-filter]', filters);
  section.children.set('[data-testimonials-pause]', [pause]);
  section.children.set('[data-testimonials-filters]', [filterBox]);
  section.children.set('[data-testimonials-controls]', [controls]);
  section.children.set('[data-testimonials-card]', [card]);
  section.children.set('[data-testimonials-empty]', [empty]);
  section.children.set('[data-testimonials-stack]', [stack]);
  section.children.set('[data-testimonials-logo]', logos);

  const clock = fakeClock();
  const motionListeners: Array<(event: { matches: boolean }) => void> = [];
  const pageListeners: Array<() => void> = [];
  const page = { hidden: options.hidden ?? false, addEventListener(_type: 'visibilitychange', listener: () => void) { pageListeners.push(listener); } };
  const env: TestimonialEnv = {
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    reducedMotion: { matches: options.reduced ?? false, addEventListener(_type, listener) { motionListeners.push(listener); } },
    page,
  };
  const root = { querySelector: () => section };
  const filter = (key: string) => filters.find(button => button.getAttribute('data-testimonials-filter') === key)!;
  const activeIndexes = () => items.flatMap((item, index) => (item.classes.has('is-active') ? [index] : []));
  const setReducedMotion = (matches: boolean) => motionListeners.forEach(listener => listener({ matches }));
  const setPageHidden = (hidden: boolean) => { page.hidden = hidden; pageListeners.forEach(listener => listener()); };
  const live = () => stack.getAttribute('aria-live');
  return { section, items, dots, filters, filter, pause, filterBox, controls, card, empty, stack, live, logos, clock, env, root, activeIndexes, setReducedMotion, setPageHidden };
}

const five = ['alpha', 'beta', 'alpha', 'alpha', 'beta'];

test('first render marks the section enhanced, reveals controls and shows only the first review', () => {
  const f = fixture(five);
  const controller = enhanceTestimonials(f.root, f.env)!;
  assert.ok(f.section.classes.has('is-enhanced'));
  assert.equal(f.filterBox.hidden, false);
  assert.equal(f.controls.hidden, false);
  assert.deepEqual(f.activeIndexes(), [0]);
  assert.deepEqual(f.items.map(item => item.hidden), [false, false, false, false, false]);
  assert.deepEqual(f.items.map(item => item.getAttribute('aria-hidden')), ['false', 'true', 'true', 'true', 'true']);
  assert.ok(f.items.slice(1).every(item => item.classes.has('is-inactive')));
  assert.deepEqual(f.dots.map(dot => dot.getAttribute('aria-label')), [1, 2, 3, 4, 5].map(n => `Go to testimonial ${n} of 5`));
  assert.deepEqual(f.dots.map(dot => dot.getAttribute('aria-current')), ['true', null, null, null, null]);
  assert.deepEqual(f.filters.map(button => button.getAttribute('aria-pressed')), ['true', 'false', 'false', 'false']);
  assert.equal(f.pause.hidden, false);
  assert.equal(f.pause.textContent, 'Pause rotation');
  assert.equal(f.empty.hidden, true);
  assert.deepEqual(controller.state(), { category: 'all', index: 0, count: 5, paused: false, rotating: true });
});

test('rotation advances every 8 seconds and wraps around the filtered list', () => {
  const f = fixture(five);
  const controller = enhanceTestimonials(f.root, f.env)!;
  f.clock.advance(ROTATION_MS - 1);
  assert.equal(controller.state().index, 0);
  f.clock.advance(1);
  assert.equal(controller.state().index, 1);
  assert.deepEqual(f.activeIndexes(), [1]);
  assert.equal(f.dots[1].getAttribute('aria-current'), 'true');
  assert.equal(f.dots[0].getAttribute('aria-current'), null);
  f.clock.advance(ROTATION_MS * 4);
  assert.equal(controller.state().index, 0);
  assert.equal(f.clock.pending(), 1);
});

test('filtering hides excluded categories, renumbers dots and rotates only within the filter', () => {
  const f = fixture(five);
  const controller = enhanceTestimonials(f.root, f.env)!;
  f.clock.advance(ROTATION_MS);
  f.filter('alpha').dispatch('click');
  assert.deepEqual(controller.state(), { category: 'alpha', index: 0, count: 3, paused: false, rotating: true });
  assert.deepEqual(f.items.map(item => item.hidden), [false, true, false, false, true]);
  assert.deepEqual(f.activeIndexes(), [0]);
  assert.deepEqual(f.dots.map(dot => dot.hidden), [false, false, false, true, true]);
  assert.deepEqual(f.dots.slice(0, 3).map(dot => dot.getAttribute('aria-label')), ['Go to testimonial 1 of 3', 'Go to testimonial 2 of 3', 'Go to testimonial 3 of 3']);
  assert.deepEqual(f.filters.map(button => button.getAttribute('aria-pressed')), ['false', 'true', 'false', 'false']);
  f.clock.advance(ROTATION_MS);
  assert.deepEqual(f.activeIndexes(), [2]);
  assert.equal(f.dots[1].getAttribute('aria-current'), 'true');
  f.clock.advance(ROTATION_MS * 2);
  assert.deepEqual(f.activeIndexes(), [0]);
  f.filter('all').dispatch('click');
  assert.deepEqual(f.items.map(item => item.hidden), [false, false, false, false, false]);
  assert.equal(controller.state().count, 5);
});

test('an empty category shows the empty note and stops rotation without hiding the way back', () => {
  const f = fixture(five);
  const controller = enhanceTestimonials(f.root, f.env)!;
  f.filter('gamma').dispatch('click');
  assert.deepEqual(controller.state(), { category: 'gamma', index: 0, count: 0, paused: false, rotating: false });
  assert.ok(f.items.every(item => item.hidden));
  assert.ok(f.dots.every(dot => dot.hidden));
  assert.equal(f.empty.hidden, false);
  assert.equal(f.pause.hidden, true);
  assert.equal(f.clock.pending(), 0);
  assert.equal(f.filterBox.hidden, false);
  f.filter('beta').dispatch('click');
  assert.equal(f.empty.hidden, true);
  assert.deepEqual(f.activeIndexes(), [1]);
});

test('dot clicks select a review and restart the 8 second timer', () => {
  const f = fixture(five);
  const controller = enhanceTestimonials(f.root, f.env)!;
  f.clock.advance(ROTATION_MS - 100);
  f.dots[3].dispatch('click');
  assert.equal(controller.state().index, 3);
  assert.deepEqual(f.activeIndexes(), [3]);
  f.clock.advance(ROTATION_MS - 1);
  assert.equal(controller.state().index, 3);
  f.clock.advance(1);
  assert.equal(controller.state().index, 4);
});

test('the pause button stops and resumes rotation with an updated label', () => {
  const f = fixture(five);
  const controller = enhanceTestimonials(f.root, f.env)!;
  f.pause.dispatch('click');
  assert.equal(f.pause.textContent, 'Resume rotation');
  assert.deepEqual(controller.state(), { category: 'all', index: 0, count: 5, paused: true, rotating: false });
  f.clock.advance(ROTATION_MS * 3);
  assert.equal(controller.state().index, 0);
  f.pause.dispatch('click');
  assert.equal(f.pause.textContent, 'Pause rotation');
  assert.equal(controller.state().rotating, true);
  f.clock.advance(ROTATION_MS);
  assert.equal(controller.state().index, 1);
});

test('hover and focus inside the card pause the timer and leaving restarts a full interval', () => {
  const f = fixture(five);
  const controller = enhanceTestimonials(f.root, f.env)!;
  f.card.dispatch('mouseenter');
  assert.equal(controller.state().rotating, false);
  f.clock.advance(ROTATION_MS * 2);
  assert.equal(controller.state().index, 0);
  f.card.dispatch('mouseleave');
  assert.equal(controller.state().rotating, true);
  f.clock.advance(ROTATION_MS - 1);
  assert.equal(controller.state().index, 0);
  f.clock.advance(1);
  assert.equal(controller.state().index, 1);

  f.section.dispatch('focusin', { relatedTarget: null });
  assert.equal(controller.state().rotating, false);
  f.clock.advance(ROTATION_MS * 2);
  assert.equal(controller.state().index, 1);
  f.section.dispatch('focusout', { relatedTarget: null });
  f.clock.advance(ROTATION_MS);
  assert.equal(controller.state().index, 2);
  assert.equal(f.pause.textContent, 'Pause rotation');
});

test('focus on a category filter pauses rotation and transfers within the section stay paused', () => {
  const f = fixture(five);
  const controller = enhanceTestimonials(f.root, f.env)!;
  const outside = new FakeElement();
  f.section.dispatch('focusin', { relatedTarget: outside });
  assert.equal(controller.state().rotating, false);
  f.clock.advance(ROTATION_MS * 2);
  assert.equal(controller.state().index, 0);

  // Filter -> pause button -> dot: each focusout names a target inside the section.
  f.section.dispatch('focusout', { relatedTarget: f.pause });
  assert.equal(controller.state().rotating, false);
  f.section.dispatch('focusin', { relatedTarget: f.filter('alpha') });
  f.section.dispatch('focusout', { relatedTarget: f.dots[2] });
  assert.equal(controller.state().rotating, false);
  f.clock.advance(ROTATION_MS * 2);
  assert.equal(controller.state().index, 0);

  // Leaving to an element outside the section (or to nothing) resumes.
  f.section.dispatch('focusout', { relatedTarget: outside });
  assert.equal(controller.state().rotating, true);
  f.section.dispatch('focusin', { relatedTarget: outside });
  f.section.dispatch('focusout', undefined);
  assert.equal(controller.state().rotating, true);
  f.clock.advance(ROTATION_MS);
  assert.equal(controller.state().index, 1);
});

test('the live region is off while rotating and polite whenever rotation is paused or manual', () => {
  const f = fixture(five);
  const controller = enhanceTestimonials(f.root, f.env)!;
  assert.equal(f.live(), 'off');
  f.clock.advance(ROTATION_MS);
  assert.equal(f.live(), 'off');

  f.pause.dispatch('click');
  assert.equal(f.live(), 'polite');
  f.dots[3].dispatch('click');
  assert.equal(f.live(), 'polite');
  f.pause.dispatch('click');
  assert.equal(f.live(), 'off');

  f.card.dispatch('mouseenter');
  assert.equal(f.live(), 'polite');
  f.card.dispatch('mouseleave');
  assert.equal(f.live(), 'off');

  f.section.dispatch('focusin', { relatedTarget: null });
  assert.equal(f.live(), 'polite');
  f.section.dispatch('focusout', { relatedTarget: null });
  assert.equal(f.live(), 'off');

  f.setPageHidden(true);
  assert.equal(f.live(), 'polite');
  f.setPageHidden(false);
  assert.equal(f.live(), 'off');

  f.filter('gamma').dispatch('click');
  assert.equal(controller.state().rotating, false);
  assert.equal(f.live(), 'polite');
});

test('reduced motion and single-review lists keep the live region polite', () => {
  const reduced = fixture(five, { reduced: true });
  enhanceTestimonials(reduced.root, reduced.env);
  assert.equal(reduced.live(), 'polite');
  reduced.dots[1].dispatch('click');
  assert.equal(reduced.live(), 'polite');
  reduced.setReducedMotion(false);
  assert.equal(reduced.live(), 'off');
  reduced.setReducedMotion(true);
  assert.equal(reduced.live(), 'polite');

  const single = fixture(['beta']);
  enhanceTestimonials(single.root, single.env);
  assert.equal(single.live(), 'polite');
});

test('prefers-reduced-motion disables autoplay and hides the pause button until the preference changes', () => {
  const f = fixture(five, { reduced: true });
  const controller = enhanceTestimonials(f.root, f.env)!;
  assert.equal(controller.state().rotating, false);
  assert.equal(f.pause.hidden, true);
  assert.equal(f.clock.pending(), 0);
  f.clock.advance(ROTATION_MS * 2);
  assert.deepEqual(f.activeIndexes(), [0]);
  f.dots[2].dispatch('click');
  assert.deepEqual(f.activeIndexes(), [2]);
  assert.equal(controller.state().rotating, false);
  f.setReducedMotion(false);
  assert.equal(controller.state().rotating, true);
  assert.equal(f.pause.hidden, false);
  f.setReducedMotion(true);
  assert.equal(controller.state().rotating, false);
  assert.equal(f.clock.pending(), 0);
});

test('a hidden page pauses rotation and a visible page resumes it', () => {
  const f = fixture(five, { hidden: true });
  const controller = enhanceTestimonials(f.root, f.env)!;
  assert.equal(controller.state().rotating, false);
  f.setPageHidden(false);
  assert.equal(controller.state().rotating, true);
  f.clock.advance(ROTATION_MS);
  assert.equal(controller.state().index, 1);
  f.setPageHidden(true);
  assert.equal(controller.state().rotating, false);
  f.clock.advance(ROTATION_MS * 2);
  assert.equal(controller.state().index, 1);
});

test('a single review shows one dot, no timer and no pause button', () => {
  const f = fixture(['beta']);
  const controller = enhanceTestimonials(f.root, f.env)!;
  assert.deepEqual(controller.state(), { category: 'all', index: 0, count: 1, paused: false, rotating: false });
  assert.equal(f.dots[0].getAttribute('aria-label'), 'Go to testimonial 1 of 1');
  assert.equal(f.dots[0].getAttribute('aria-current'), 'true');
  assert.equal(f.pause.hidden, true);
  assert.equal(f.clock.pending(), 0);
  assert.equal(f.items[0].getAttribute('aria-hidden'), 'false');
});

test('an empty review list enhances without throwing and shows the empty note', () => {
  const f = fixture([]);
  const controller = enhanceTestimonials(f.root, f.env)!;
  assert.deepEqual(controller.state(), { category: 'all', index: 0, count: 0, paused: false, rotating: false });
  assert.equal(f.empty.hidden, false);
  assert.equal(f.controls.hidden, false);
  assert.equal(f.pause.hidden, true);
});

test('a failed logo image hides only itself and other logos stay visible', () => {
  const f = fixture(five, { logos: 3 });
  enhanceTestimonials(f.root, f.env);
  f.logos[1].dispatch('error');
  assert.deepEqual(f.logos.map(logo => logo.hidden), [false, true, false]);
});

test('missing section returns null and destroy clears the pending timer', () => {
  assert.equal(enhanceTestimonials({ querySelector: () => null }, fixture(five).env), null);
  const f = fixture(five);
  const controller = enhanceTestimonials(f.root, f.env)!;
  assert.equal(f.clock.pending(), 1);
  controller.destroy();
  assert.equal(f.clock.pending(), 0);
  f.dots[1].dispatch('click');
  assert.equal(f.clock.pending(), 0);
  assert.equal(controller.state().index, 1);
});
