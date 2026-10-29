// Public projections only. A new definition needs a label/semantics review here
// and in server/api/website-proof.php before it can be displayed.
export const CALL_DEFINITION = 'yeastar.inbound_human_queue.28_complete_days.v1';
// v2 approved by Sam on 9 October 2026.
export const TICKET_DEFINITION = 'superops.first_tech_reply.client_incidents.business_hours.28_complete_days.v2';
const DEFINITIONS = { call_wait: CALL_DEFINITION, ticket_first_response: TICKET_DEFINITION };
export const FEEDS = { metrics: '/api/website-metrics', feedback: '/api/website-feedback' };
export const MAX_BYTES = 8192;
const metricFields = ['status', 'source', 'value_seconds', 'service_rate_percent', 'definition_id', 'observed_at', 'expires_at', 'period_start', 'period_end'];
const itemFields = ['first_name', 'comment', 'rating', 'feedback_month'];
export function exactKeys(value, keys) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
export function utc(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(value)) return NaN;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 19) === value.slice(0, 19) ? parsed : NaN;
}
function metricShape(value, source) {
  return exactKeys(value, metricFields) && value.source === source
    && ['available', 'stale', 'unavailable'].includes(value.status);
}
const londonParts = value => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
}).formatToParts(value).reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {});
export function validCallPeriod(start, end) {
  const a = londonParts(start), b = londonParts(end);
  const midnight = p => p.hour === '00' && p.minute === '00' && p.second === '00';
  return midnight(a) && midnight(b) && start % 1000 === 0 && end % 1000 === 0
    && Date.UTC(+b.year, +b.month - 1, +b.day) - Date.UTC(+a.year, +a.month - 1, +a.day) === 28 * 86400000;
}
export function parseMetrics(data, now = Date.now()) {
  if (!exactKeys(data, ['schema_version', 'status', 'metrics']) || data.schema_version !== 2
    || !['available', 'partial', 'unavailable'].includes(data.status)
    || !exactKeys(data.metrics, ['ticket_first_response', 'call_wait'])
    || !metricShape(data.metrics.ticket_first_response, 'superops') || !metricShape(data.metrics.call_wait, 'yeastar')) return [];
  const count = Object.values(data.metrics).filter(metric => metric.status === 'available').length;
  if (data.status !== (count === 2 ? 'available' : count === 1 ? 'partial' : 'unavailable')) return [];
  // Calls first, then tickets. Each is shown only under its exact reviewed definition.
  return ['call_wait', 'ticket_first_response'].flatMap(key => {
    const metric = data.metrics[key];
    if (metric.status !== 'available' || metric.definition_id !== DEFINITIONS[key]
      || typeof metric.value_seconds !== 'number' || !Number.isFinite(metric.value_seconds) || metric.value_seconds < 0
      || typeof metric.service_rate_percent !== 'number' || !Number.isFinite(metric.service_rate_percent)
      || metric.service_rate_percent < 0 || metric.service_rate_percent > 100) return [];
    const start = utc(metric.period_start), end = utc(metric.period_end);
    const observed = utc(metric.observed_at), expires = utc(metric.expires_at);
    if (!(start < end && end <= observed && observed <= now && now < expires && expires - observed <= 180000000)
      || !validCallPeriod(start, end)) return [];
    return [{ ...metric, key, expiry: expires }];
  });
}
function text(value, max) {
  return typeof value === 'string' && value.trim().length > 0 && [...value].length <= max && !/[\u0000-\u001f\u007f]/u.test(value);
}
export function parseFeedback(data, now = Date.now()) {
  if (!exactKeys(data, ['schema_version', 'status', 'selected_on', 'expires_at', 'items']) || data.schema_version !== 1
    || !['available', 'stale', 'unavailable'].includes(data.status) || !Array.isArray(data.items)) return null;
  if (data.status !== 'available') return null;
  if (typeof data.selected_on !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.selected_on)) return null;
  const start = utc(`${data.selected_on}T00:00:00Z`), expiry = utc(data.expires_at);
  if (!(start <= now && now < expiry && expiry <= start + 259200000) || data.items.length < 1 || data.items.length > 3) return null;
  if (!data.items.every(item => exactKeys(item, itemFields) && text(item.first_name, 40) && text(item.comment, 400)
    && (item.rating === null || text(item.rating, 32))
    && (item.feedback_month === null || (typeof item.feedback_month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(item.feedback_month)
      && item.feedback_month <= data.selected_on.slice(0, 7))))) return null;
  if (new Set(data.items.map(itemKey)).size !== data.items.length) return null;
  return { items: data.items.map(item => ({ ...item })), expiry };
}
export const itemKey = item => JSON.stringify(itemFields.map(key => item[key]));
export function retainFeedback(previous, current) {
  const allowed = new Set((current?.items ?? []).map(itemKey));
  return previous.filter(item => allowed.has(itemKey(item)));
}
export function formatTime(seconds) {
  if (seconds < 60) { const n = Math.ceil(seconds); return `${n} ${n === 1 ? 'second' : 'seconds'}`; }
  const hours = seconds >= 3600;
  const n = Math.ceil(seconds / (hours ? 360 : 6)) / 10;
  return `${n.toLocaleString('en-GB', { maximumFractionDigits: 1 })} ${hours ? (n === 1 ? 'hour' : 'hours') : (n === 1 ? 'minute' : 'minutes')}`;
}
// Ticket timing counts business hours only, so the unit says so.
export const formatBusinessTime = seconds => formatTime(seconds).replace(/ (seconds?|minutes?|hours?)$/, ' business $1');
export const formatRate = rate => `${(Math.floor(rate * 10) / 10).toLocaleString('en-GB', { maximumFractionDigits: 1 })}%`;
export function formatPeriod(metric) {
  const format = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'long', year: 'numeric' });
  return `${format.format(utc(metric.period_start))} to ${format.format(utc(metric.period_end) - 1)}`;
}
export const formatMonth = month => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(`${month}-01T00:00:00Z`));

export async function readFeed(response) {
  if (!response.ok || response.redirected || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')
    || Number(response.headers.get('content-length')) > MAX_BYTES || !response.body) throw new Error('Unavailable');
  const reader = response.body.getReader(), chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BYTES) throw new Error('Unavailable');
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
