import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { createDeferredResource, formatMinutes, metricNumber } from '../../utils/publicMetrics';
import { parseReportData, useLiveStats } from '../../components/LiveStats';

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it.each([null, undefined, '', ' ', true, {}, -1, NaN, Infinity, '3min', '-2'])('rejects malformed metric %s', value => {
  expect(metricNumber(value)).toBeNull();
  expect(formatMinutes(value)).toBe('Unavailable');
});
it('preserves zero and measured values without a less-than prefix or five-minute cap', () => {
  expect(formatMinutes(0)).toBe('0 min');
  expect(formatMinutes('18.5')).toBe('18.5 min');
  expect(formatMinutes(null, true)).toBe('Loading…');
  expect(parseReportData([{ CallWaitTimeInMinutes: '0', AverageResponseTimeLast30DaysMinutes: '18.5' }])).toMatchObject({ CallWaitTimeInMinutes: 0, AverageResponseTimeLast30DaysMinutes: 18.5 });
  expect(() => parseReportData({ CallWaitTimeInMinutes: 'bad' })).toThrow();
});
it('shares one deferred request, caches the result and cancels a pending last subscriber', async () => {
  vi.useFakeTimers();
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete');
  const fetcher = vi.fn().mockResolvedValue(12);
  const useResource = createDeferredResource<number | null>(null, fetcher, 10);
  const first = renderHook(useResource), second = renderHook(useResource);
  expect(fetcher).not.toHaveBeenCalled();
  await act(async () => { await vi.advanceTimersByTimeAsync(20); });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(first.result.current.data).toBe(12);
  expect(second.result.current.data).toBe(12);
  first.unmount(); second.unmount();
  const third = renderHook(useResource);
  expect(third.result.current.data).toBe(12);
  expect(fetcher).toHaveBeenCalledTimes(1);
  third.unmount();
  const cancelledFetch = vi.fn();
  const pending = renderHook(createDeferredResource(null, cancelledFetch, 10));
  pending.unmount();
  await act(async () => { await vi.advanceTimersByTimeAsync(100); });
  expect(cancelledFetch).not.toHaveBeenCalled();
});
it('aborts an in-flight request after the last consumer unmounts', async () => {
  vi.useFakeTimers();
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete');
  let signal: AbortSignal | undefined;
  const fetcher = vi.fn((incoming: AbortSignal) => { signal = incoming; return new Promise<null>(() => {}); });
  const hook = renderHook(createDeferredResource(null, fetcher, 1));
  await act(async () => { await vi.advanceTimersByTimeAsync(2); });
  expect(signal?.aborted).toBe(false);
  hook.unmount();
  expect(signal?.aborted).toBe(true);
});
it('failure leaves null data rather than a numerical substitute', async () => {
  vi.useFakeTimers();
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete');
  const hook = renderHook(createDeferredResource(null, vi.fn().mockRejectedValue(new Error('offline')), 1));
  await act(async () => { await vi.advanceTimersByTimeAsync(2); });
  expect(hook.result.current).toMatchObject({ data: null, loading: false, error: true, fetchedAt: null });
});

it('never calls the retired helpdesk report and leaves the figures unavailable', async () => {
  vi.useFakeTimers();
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete');
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const hook = renderHook(useLiveStats);
  await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
  expect(fetcher).not.toHaveBeenCalled();
  expect(hook.result.current).toMatchObject({ stats: null, review: null, error: true });
});
