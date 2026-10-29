import assert from 'node:assert/strict';
import test from 'node:test';
import { refreshHomepageMasthead, startHomepageEnhancements } from './homepage-enhance.ts';

test('homepage masthead renderer updates the UK day, issue and neutral contact month', () => {
  const issue = { textContent: '' };
  const day = { firstChild: { textContent: '' }, querySelector: () => issue };
  const month = { textContent: '' };
  const root = { querySelectorAll(selector: string) { return selector.includes('day') ? [day] : [month]; } } as unknown as Document;
  refreshHomepageMasthead(root, new Date('2026-09-15T11:00:00Z'));
  assert.equal(day.firstChild.textContent, '● Tue · Issue №');
  assert.match(issue.textContent, /^\d+$/);
  assert.equal(month.textContent, 'September 2026');
});

test('BFCache restore refreshes the masthead', () => {
  const listeners = new Map<string, (event: PageTransitionEvent) => void>();
  const cleared: number[] = [];
  let nowIndex = 0;
  const issue = { textContent: '' };
  const day = { firstChild: { textContent: '' }, querySelector: () => issue };
  const month = { textContent: '' };
  const root = { querySelectorAll(selector: string) { return selector.includes('day') ? [day] : selector.includes('month') ? [month] : []; } } as unknown as Document;
  const runtime = {
    addEventListener(type: 'pagehide' | 'pageshow', listener: (event: PageTransitionEvent) => void) { listeners.set(type, listener); },
    setInterval() { return 42; },
    clearInterval(handle: number) { cleared.push(handle); },
  };

  startHomepageEnhancements({
    root,
    runtime,
    now: () => [new Date('2026-09-15T11:00:00Z'), new Date('2026-10-16T11:00:00Z')][Math.min(nowIndex++, 1)],
  });
  assert.equal(month.textContent, 'September 2026');

  listeners.get('pagehide')?.({ persisted: true } as PageTransitionEvent);
  assert.deepEqual(cleared, []);

  listeners.get('pageshow')?.({ persisted: true } as PageTransitionEvent);
  assert.equal(month.textContent, 'October 2026');
});

test('final pagehide cleans up the masthead timer once', () => {
  const listeners = new Map<string, (event: PageTransitionEvent) => void>();
  const cleared: number[] = [];
  const root = { querySelectorAll() { return []; } } as unknown as Document;
  const runtime = {
    addEventListener(type: 'pagehide' | 'pageshow', listener: (event: PageTransitionEvent) => void) { listeners.set(type, listener); },
    setInterval() { return 7; },
    clearInterval(handle: number) { cleared.push(handle); },
  };

  startHomepageEnhancements({ root, runtime });
  listeners.get('pagehide')?.({ persisted: false } as PageTransitionEvent);
  listeners.get('pagehide')?.({ persisted: false } as PageTransitionEvent);
  assert.deepEqual(cleared, [7]);
});
