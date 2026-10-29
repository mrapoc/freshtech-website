// Framework-neutral port of utils/publicMetrics.ts and the report parser in
// components/LiveStats.tsx. Values are validated strictly: JSON numbers or
// plain decimal strings only, never coerced booleans, negatives or NaN.

/** Public metric values may be JSON numbers or decimal strings, never coerced booleans. */
export function metricNumber(value) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+(?:\.\d+)?$/.test(value.trim()))) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function formatMinutes(value, loading = false) {
  const number = metricNumber(value);
  return number === null ? (loading ? 'Loading…' : 'Unavailable') : `${Number(number.toFixed(1))} min`;
}

/** Mirrors parseReportData in components/LiveStats.tsx: first row of an array or a bare object. */
export function parseReportData(data) {
  const candidate = Array.isArray(data) ? data[0] : data;
  if (!candidate || typeof candidate !== 'object') throw new Error('Invalid report');
  const row = candidate;
  const result = {
    AverageResponseTimeLast30DaysMinutes: metricNumber(row.AverageResponseTimeLast30DaysMinutes),
    AverageResolutionTimeLast30DaysMinutes: metricNumber(row.AverageResolutionTimeLast30DaysMinutes),
    CallWaitTimeInMinutes: metricNumber(row.CallWaitTimeInMinutes),
    LatestFResponseDate: typeof row.LatestFResponseDate === 'string' && Number.isFinite(Date.parse(row.LatestFResponseDate)) ? row.LatestFResponseDate : null,
  };
  if (result.AverageResponseTimeLast30DaysMinutes === null && result.CallWaitTimeInMinutes === null) throw new Error('No valid metrics');
  return result;
}
