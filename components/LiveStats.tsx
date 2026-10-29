import React from 'react';
import { createDeferredResource, formatMinutes, metricNumber } from '../utils/publicMetrics';

export interface ReportData {
  AverageResponseTimeLast30DaysMinutes: number | null;
  AverageResolutionTimeLast30DaysMinutes: number | null;
  LatestFResponseDate: string | null;
  CallWaitTimeInMinutes: number | null;
}
export interface ReviewData { User: string; Score: string; Comment: string }

export function parseReportData(data: unknown): ReportData {
  const candidate = Array.isArray(data) ? data[0] : data;
  if (!candidate || typeof candidate !== 'object') throw new Error('Invalid report');
  const row = candidate as Record<string, unknown>;
  const result = {
    AverageResponseTimeLast30DaysMinutes: metricNumber(row.AverageResponseTimeLast30DaysMinutes),
    AverageResolutionTimeLast30DaysMinutes: metricNumber(row.AverageResolutionTimeLast30DaysMinutes),
    CallWaitTimeInMinutes: metricNumber(row.CallWaitTimeInMinutes),
    LatestFResponseDate: typeof row.LatestFResponseDate === 'string' && Number.isFinite(Date.parse(row.LatestFResponseDate)) ? row.LatestFResponseDate : null,
  };
  if (result.AverageResponseTimeLast30DaysMinutes === null && result.CallWaitTimeInMinutes === null) throw new Error('No valid metrics');
  return result;
}

// The helpdesk ReportData feed is retired (see AGENTS.md). The retained React
// app no longer calls it, so its figures show as unavailable.
const useStatsResource = createDeferredResource<{ stats: ReportData | null; review: ReviewData | null }>(
  { stats: null, review: null },
  async () => { throw new Error('ReportData is retired'); }
);

export const useLiveStats = () => {
  const { data, ...state } = useStatsResource();
  return { ...data, ...state };
};

export const LiveStats: React.FC<{ variant?: 'full' | 'contained'; className?: string }> = ({ variant = 'full', className = '' }) => {
  const { stats, review, loading, fetchedAt } = useLiveStats();
  return (
    <section className={`bg-neutral text-white py-8 px-6 ${variant === 'contained' ? 'rounded-3xl' : ''} ${className}`} aria-label="Helpdesk performance">
      <h2 className="font-heading text-2xl mb-4">Helpdesk performance</h2>
      <dl className="grid gap-6 sm:grid-cols-2">
        <div><dt>Average response, last 30 days</dt><dd className="font-heading text-2xl mt-2">{formatMinutes(stats?.AverageResponseTimeLast30DaysMinutes, loading)}</dd></div>
        <div><dt>Average call wait</dt><dd className="font-heading text-2xl mt-2">{formatMinutes(stats?.CallWaitTimeInMinutes, loading)}</dd></div>
      </dl>
      {review && <blockquote className="mt-6"><p>{review.Comment}</p><footer>{review.User}: {review.Score}</footer></blockquote>}
      <p className="text-sm mt-4">{fetchedAt ? `Report retrieved ${new Date(fetchedAt).toLocaleString('en-GB', { timeZone: 'Europe/London' })} (UK time).` : loading ? 'Loading helpdesk report…' : 'The helpdesk report is currently unavailable.'}</p>
    </section>
  );
};
