// Reviewed changes from the retained React baseline. All pages still compare.
const title = 'Talk to us about business IT support';
const panel = `${title} Fresh Tech provides business IT support, and we are happy to talk through what you need. If you are already with another provider, our switching guide explains how a move works. Contact us → Read the switching guide →`;
const links = [['/contact', 'Contact us →'], ['/onboarding', 'Read the switching guide →']];
const replacements = [
  ['We respond faster than a speeding bullet (usually under 15 minutes).', 'Tell us what you need help with and how best to reach you.'],
  ['Our average response time is under 15 minutes for urgent issues. We prioritise critical faults that stop you from working.', 'Response priorities depend on the issue and your agreed support terms. Contact us to discuss the cover your business needs.'],
  ['We respond Under 15 minutes.', 'Talk to us Discuss your support.'],
  ['Average response time: under 15 minutesfor tickets logged via the portal', 'Need help with an issue? Log a ticket via the portal or call our team.'],
];
export function applyPublicProofReview(route, baseline) {
  for (const [from, to] of replacements) baseline.content.text = baseline.content.text.replace(from, to);
  if (route === '/faq') { const [from, to] = replacements[1]; baseline.head.schemas = JSON.parse(JSON.stringify(baseline.head.schemas).replace(from, to)); }
  if (route === '/why-trust-us') {
    for (const [from, to] of [
      ['live performance data from our helpdesk (not marketing numbers, real ones)', 'service figures when verified data is available'],
      ['Helpdesk report · Availability depends on the feed Loading… Avg first response Last 30 days Loading… Avg call wait Last 30 days Reviews Customer feedback Read selected reviews below', panel],
      ['When available, the figures above come from our helpdesk report.', 'When available, the figures show historic support queue wait and answer rates.'],
      ['Response time ✕Best efforts (usually hours) ✓Under 15 minutes, measured ', ''],
    ]) baseline.content.text = baseline.content.text.replace(from, to);
    baseline.content.headings.splice(1, 0, [2, title]); baseline.content.links.splice(3, 0, ...links);
  }
  if (route === '/service-standards') {
    baseline.head.description = 'How we measure support queue wait and answer rates, with selected customer feedback when available. Discuss your support needs with our Ludlow team.';
    for (const [from, to] of [
      ['The report below comes from our helpdesk system. It shows average response and call wait times when the source is available.', 'When verified figures are available, we show the measured queue wait together with the proportion of support calls answered by a person.'],
      ['Helpdesk performance Average response, last 30 days Loading… Average call wait Loading… Loading helpdesk report…', panel],
      ['Average response time covers the last 30 days. Average call wait is supplied by the same helpdesk report. The retrieval time shows when this page fetched the report, not when the source data last changed.', 'Average queue wait measures the time from joining the support queue to a human answer, among answered calls. The answer rate includes missed and abandoned calls. The reporting period covers 28 completed UK calendar days and is shown with the figures.'],
      ['If the report cannot be loaded, we show that it is unavailable. These averages describe past service and are not a guaranteed response time for an individual request.', 'Figures and selected feedback are shown only while valid and current. These are historic results, not response or resolution guarantees.'],
      ['Our public review rating reflects how this feels in practice: fast, friendly and genuinely helpful.', 'Read selected customer feedback when available, or explore our published customer stories.'],
    ]) baseline.content.text = baseline.content.text.replace(from, to);
    baseline.content.headings[1] = [2, title]; baseline.content.links.unshift(...links);
  }
}
