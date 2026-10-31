// Enhancement controller for SourceTestimonials.astro, mirroring the state in
// components/Testimonials.tsx: an active category (default "all"), an active
// index within the filtered list that resets on category change, an 8 second
// rotation and pause-on-hover. Added here: an explicit pause button for
// keyboard users, pause while keyboard focus is anywhere in the section
// (filters included), while the page is hidden and under
// prefers-reduced-motion (no autoplay at all), plus dot labels that reflect
// the current filter. The review stack's live region is "off" while automatic
// rotation runs and "polite" only when paused or manually driven, so screen
// readers never hear unprompted rotations. The opening review is random, so
// every visit starts somewhere different in the pool. Not auto-initialised: the consumer
// imports enhanceTestimonials(root) and wires it in later.
//
// The DOM surface is deliberately tiny so the controller runs against fake
// elements in node tests. Timers and media/visibility state come from an
// injectable environment for the same reason.

export const ROTATION_MS = 8000;
export const ALL_CATEGORY = 'all';

export interface TestimonialElement {
  hidden: boolean;
  textContent: string | null;
  classList: { add(...names: string[]): void; remove(...names: string[]): void };
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  addEventListener(type: string, listener: (event?: unknown) => void): void;
  querySelector(selector: string): unknown;
  querySelectorAll(selector: string): Iterable<unknown>;
  contains?(node: unknown): boolean;
}

export interface FocusTransferEvent { relatedTarget?: unknown }

export interface TestimonialRoot {
  querySelector(selector: string): unknown;
}

export interface TestimonialEnv {
  setTimeout(handler: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
  reducedMotion: { matches: boolean; addEventListener?(type: 'change', listener: (event: { matches: boolean }) => void): void };
  page: { hidden: boolean; addEventListener(type: 'visibilitychange', listener: () => void): void };
  // Picks the opening review; [0, 1) like Math.random. Omitted means start at 0.
  random?: () => number;
}

export interface TestimonialState {
  category: string;
  index: number;
  count: number;
  paused: boolean;
  rotating: boolean;
}

export interface TestimonialController {
  state(): TestimonialState;
  destroy(): void;
}

export function browserEnv(): TestimonialEnv {
  const reducedMotion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  return {
    setTimeout: (handler, ms) => setTimeout(handler, ms),
    clearTimeout: handle => clearTimeout(handle as number),
    reducedMotion,
    page: document,
    random: Math.random,
  };
}

export function enhanceTestimonials(root: TestimonialRoot, env: TestimonialEnv = browserEnv()): TestimonialController | null {
  const section = root.querySelector('[data-testimonials]') as TestimonialElement | null;
  if (!section) return null;

  const all = (selector: string) => Array.from(section.querySelectorAll(selector)) as TestimonialElement[];
  const one = (selector: string) => section.querySelector(selector) as TestimonialElement | null;
  const items = all('[data-testimonials-item]');
  const dots = all('[data-testimonials-dot]');
  const filters = all('[data-testimonials-filter]');
  const pause = one('[data-testimonials-pause]');
  const filterBox = one('[data-testimonials-filters]');
  const controls = one('[data-testimonials-controls]');
  const card = one('[data-testimonials-card]');
  const empty = one('[data-testimonials-empty]');
  const stack = one('[data-testimonials-stack]');

  let category = ALL_CATEGORY;
  // Open on a random review so visitors see different parts of the pool.
  let index = items.length ? Math.min(items.length - 1, Math.floor((env.random?.() ?? 0) * items.length)) : 0;
  let userPaused = false;
  let hovered = false;
  let focused = false;
  let reduced = env.reducedMotion.matches;
  let timer: unknown = null;
  let destroyed = false;

  const visible = () => items.filter(item => category === ALL_CATEGORY || item.getAttribute('data-category') === category);
  const canRotate = (count: number) => count > 1 && !reduced;
  const shouldRun = (count: number) => canRotate(count) && !userPaused && !hovered && !focused && !env.page.hidden;

  function stop() {
    if (timer !== null) env.clearTimeout(timer);
    timer = null;
  }

  function render() {
    const current = visible();
    const count = current.length;
    if (index >= count) index = 0;

    items.forEach(item => {
      const shown = current.includes(item);
      const active = shown && current[index] === item;
      item.hidden = !shown;
      item.setAttribute('aria-hidden', active ? 'false' : 'true');
      item.classList.remove(active ? 'is-inactive' : 'is-active');
      item.classList.add(active ? 'is-active' : 'is-inactive');
    });

    dots.forEach((dot, position) => {
      dot.hidden = position >= count;
      if (dot.hidden) return;
      dot.setAttribute('aria-label', `Go to testimonial ${position + 1} of ${count}`);
      if (position === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });

    filters.forEach(button => {
      button.setAttribute('aria-pressed', button.getAttribute('data-testimonials-filter') === category ? 'true' : 'false');
    });

    if (empty) empty.hidden = count > 0;
    if (pause) {
      pause.hidden = !canRotate(count);
      pause.textContent = userPaused ? 'Resume rotation' : 'Pause rotation';
    }

    stop();
    if (!destroyed && shouldRun(count)) {
      timer = env.setTimeout(() => {
        timer = null;
        index = (index + 1) % visible().length;
        render();
      }, ROTATION_MS);
    }
    // Announce changes only when they are user-driven or rotation is paused.
    stack?.setAttribute('aria-live', timer !== null ? 'off' : 'polite');
  }

  filters.forEach(button => {
    button.addEventListener('click', () => {
      category = button.getAttribute('data-testimonials-filter') ?? ALL_CATEGORY;
      index = 0;
      render();
    });
  });

  dots.forEach((dot, position) => {
    dot.addEventListener('click', () => {
      index = position;
      render();
    });
  });

  pause?.addEventListener('click', () => {
    userPaused = !userPaused;
    render();
  });

  if (card) {
    card.addEventListener('mouseenter', () => { hovered = true; render(); });
    card.addEventListener('mouseleave', () => { hovered = false; render(); });
  }

  // Focus anywhere in the section (filters, dots, pause button, card) pauses
  // rotation; a transfer between two elements inside the section stays paused.
  section.addEventListener('focusin', () => { focused = true; render(); });
  section.addEventListener('focusout', event => {
    const next = (event as FocusTransferEvent | undefined)?.relatedTarget;
    if (next && section.contains?.(next)) return;
    focused = false;
    render();
  });

  env.page.addEventListener('visibilitychange', () => render());
  env.reducedMotion.addEventListener?.('change', event => {
    reduced = event.matches;
    render();
  });

  // LogoItem in LogoCarousel.tsx drops a failed image; here only the <img> is
  // hidden so the reserved 130x40 box keeps the row stable.
  all('[data-testimonials-logo]').forEach(image => {
    image.addEventListener('error', () => { image.hidden = true; });
  });

  section.classList.add('is-enhanced');
  render();
  if (filterBox) filterBox.hidden = false;
  if (controls) controls.hidden = false;

  return {
    state: () => ({ category, index, count: visible().length, paused: userPaused, rotating: timer !== null }),
    destroy() {
      destroyed = true;
      stop();
    },
  };
}
