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
// Unsupported claims corrected in the October 2026 truthful-claims review.
const claimReview = {
  '/faq': [
    ["Absolutely. We handle the entire process from gap analysis to certification. We guarantee you'll pass first time.", "Yes. We handle the process from gap analysis to certification. We prepare you alongside our certification partner and only submit when you're ready to pass."],
    ['Then, we work with our assessment partner who will only submit your application once a pass is guaranteed.', "Then we work with our certification partner and only submit your application when they confirm you're ready to pass."],
    ["You won't. Our process is designed so that the final submission only happens after a 'pre-marking' stage. If there are issues, we fix them before the official submission.", "Our process is designed to avoid it. The final submission only happens after a 'pre-marking' stage, and if that finds issues, we fix them before the official submission."],
    ['We have a standard 1-hour response SLA for critical issues, but our average is under 15 minutes.', 'Response targets depend on priority and are the same on every plan: 30 minutes for critical issues and 1 hour for high-priority ones. The full table is on our pricing page.'],
  ],
  '/microsoft-business-premium': [
    ['Business Standard is fine for the basics. Business Premium adds the security and device-management features you actually need to be Cyber Essentials-ready and to actually defend against modern threats.', 'Business Standard covers the core productivity tools. Business Premium adds security and device-management tools that can support a properly configured Cyber Essentials setup and strengthen protection against modern threats.'],
    ['Cyber Essentials ready Not without add-ons Yes, out of the box', 'Cyber Essentials support Licence alone is not enough More security tools; configuration still required'],
  ],
};
const textOnlyClaimReview = {
  '/faq': [['<15m Avg Response Time', 'Ludlow Local Support Team']],
  // Testimonials replaced with verbatim public Google reviews.
  '/why-trust-us': [["Our average client relationship is over 5 years. ★★★★★ \"In healthcare, downtime isn't an option. Fresh Tech ensures our care management systems run 24/7. We've had zero unplanned outages since switching.\" Vince Burmingham Hendra Healthcare ★★★★★ \"When our server failed unexpectedly, they had us back online within 2 hours. That kind of response saves us thousands in lost productivity.\" Stephen Jaques Jaques Int ★★★★★ \"We have been working with Sam and the Fresh Tech team for over 5 years. The response time and service we receive is excellent.\" Helen Graham The Ludlow Nut Company ★★★★★ \"Fresh Tech typically responds in under 15 minutes. It's like having my own IT department, but at a fraction of the cost.\" Iain Urquhart Advanced Pest Management", "Selected Google reviews from business customers. ★★★★★ \"Sam and Matt are amazing. They genuinely care about delivering the best service. We have been using the services of Fresh Tech for a number of years now, on an ad-hoc basis for some services and a recurring basis for others. As our business grows we know that we won't need to look elsewhere for managed IT services - Fresh Tech will be more than capable of servicing our needs, and most likely deliver additional services that we don't currently utilise. Thanks both!\" Nick Bromley Accountancy Google review ★★★★★ \"We are very pleased with the service offered by Fresh Tech. Having just upgraded all our computers to Windows 11, we are very happy with the efficiency, knowledge and attitude of Sam & Matt, making the whole process very streamlined and pain-free!\" Helen Graham Ludlow Nut Co Ltd ★★★★★ \"We have been using Fresh PC's for several years now, the service is first class and very fast. They have built and installed our network and server set-up, and offer excellent and prompt support to our team whenever required, Fresh PC's realise that problems need to be solved/fixed quickly to ensure the business runs as smoothly as possible.\" Stephen Jaques Google review ★★★★★ \"These guys solve any computer issue I have both promptly and efficiently. Being an SME this is quality of service that is invaluable to me.\" Iain Urquhart Google review"]],
};
export function applyPublicProofReview(route, baseline) {
  for (const [from, to] of replacements) baseline.content.text = baseline.content.text.replace(from, to);
  if (route === '/faq') { const [from, to] = replacements[1]; baseline.head.schemas = JSON.parse(JSON.stringify(baseline.head.schemas).replace(from, to)); }
  for (const [from, to] of [...(claimReview[route] ?? []), ...(textOnlyClaimReview[route] ?? [])]) baseline.content.text = baseline.content.text.replace(from, to);
  for (const [from, to] of claimReview[route] ?? []) baseline.head.schemas = JSON.parse(JSON.stringify(baseline.head.schemas).replace(JSON.stringify(from).slice(1, -1), JSON.stringify(to).slice(1, -1)));
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
