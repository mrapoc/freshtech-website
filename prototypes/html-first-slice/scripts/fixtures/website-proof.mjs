// Synthetic fixtures, imported only by tests. Never part of an application build.
export const FIXTURE_NOW = Date.parse('2026-09-22T12:00:00Z');
export const emptyMetric = source => ({ status: 'unavailable', source, value_seconds: null, service_rate_percent: null, definition_id: null, observed_at: null, expires_at: null, period_start: null, period_end: null });
export const metricsFixture = () => ({ schema_version: 2, status: 'partial', metrics: {
  ticket_first_response: emptyMetric('superops'),
  call_wait: { status: 'available', source: 'yeastar', value_seconds: 24.1, service_rate_percent: 93.7,
    definition_id: 'yeastar.inbound_human_queue.28_complete_days.v1', observed_at: '2026-09-22T11:59:00Z',
    expires_at: '2026-09-22T12:29:00Z', period_start: '2026-08-24T23:00:00Z', period_end: '2026-09-21T23:00:00Z' },
} });
export const feedbackFixture = () => ({ schema_version: 1, status: 'available', selected_on: '2026-09-22', expires_at: '2026-09-23T00:00:00Z', items: [
  { first_name: 'TestAlex', comment: 'Synthetic fixture: clear explanations and a useful next step.', rating: 'Happy', feedback_month: '2026-08' },
  { first_name: 'TestRobin', comment: 'Synthetic fixture: <img src=x onerror=alert(1)> stays literal.', rating: null, feedback_month: null },
  { first_name: 'TestJo', comment: 'Synthetic fixture: the support options were explained clearly.', rating: 'Satisfied', feedback_month: '2026-09' },
] });
export const unavailableFeedback = () => ({ schema_version: 1, status: 'unavailable', selected_on: null, expires_at: null, items: [] });
