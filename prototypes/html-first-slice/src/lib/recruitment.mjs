// Recruitment facts shared by /careers and /recruitment-privacy. Sam locked the
// copy facts on 16 October 2026 and adopted the recruitment privacy policy the
// same day. Applications stay closed until the
// real Indeed listing URL exists: set `open: true` and `listingUrl` together.
export const RECRUITMENT = Object.freeze({
  roleTitle: 'IT Support Engineer (2nd Line)',
  salary: '£30,000 to £35,000 a year',
  contract: 'Permanent, full time',
  applications: Object.freeze({ open: true, listingUrl: 'mailto:jobs@fresh-tech.uk?subject=IT%20Support%20Engineer%20application', privacyApproved: true }),
  hiringTeam: 'Sam and Matt',
  privacyContact: 'hello@fresh-tech.uk',
  privacyEffectiveDate: '19 October 2026',
  retention: 'six months after the recruitment closes',
});

// Only the approved, delivery-tested recruitment address is accepted.
export function canAcceptApplications(config) {
 return config?.open === true && config.privacyApproved === true &&
 config.listingUrl === 'mailto:jobs@fresh-tech.uk?subject=IT%20Support%20Engineer%20application';
}
