// Standalone routes ported one by one from the retired React site to native
// Astro pages. `source` names the React component each was ported from, as
// recorded in its test-fixtures/standalone baseline.
export const STANDALONE_ROUTES = Object.freeze([
  { route: '/privacy-policy', name: 'privacy-policy', source: 'pages-v2/PrivacyPolicyPageV2.tsx' },
  { route: '/terms-conditions', name: 'terms-conditions', source: 'pages-v2/TermsPageV2.tsx' },
  { route: '/cookie-policy', name: 'cookie-policy', source: 'pages-v2/CookiePolicyPageV2.tsx' },
  { route: '/support-upgrade', name: 'support-upgrade', source: 'pages-v2/SupportUpgradePageV2.tsx' },
  { route: '/technology-stack', name: 'technology-stack', source: 'pages-v2/TechnologyStackPageV2.tsx' },
  { route: '/glossary', name: 'glossary', source: 'pages/GlossaryPage.tsx' },
  { route: '/service-standards', name: 'service-standards', source: 'pages-v2/ServiceStandardsPageV2.tsx' },
  { route: '/co-managed-it', name: 'co-managed-it', source: 'pages-v2/CoManagedITPageV2.tsx' },
  { route: '/foundation-monitoring', name: 'foundation-monitoring', source: 'pages-v2/FoundationMonitoringPageV2.tsx' },
  // /careers left this list on 16 October 2026: it now carries the recruitment
  // advert (src/lib/recruitment.mjs) rather than a port of CareersPageV2.tsx,
  // so there is no React baseline to compare. The emitted-HTML quality gate and
  // the marker-discovered standalone browser gate still cover it.
  { route: '/onboarding', name: 'onboarding', source: 'pages-v2/OnboardingPageV2.tsx' },
  { route: '/support', name: 'support', source: 'pages/SupportPage.tsx' },
  { route: '/faq', name: 'faq', source: 'pages/FaqPage.tsx' },
  { route: '/refer', name: 'refer', source: 'pages-v2/ReferralPageV2.tsx' },
  { route: '/it-health-check', name: 'it-health-check', source: 'pages-v2/ITHealthCheckPageV2.tsx' },
  { route: '/ai-acceptable-use-policy', name: 'ai-acceptable-use-policy', source: 'pages-v2/AIAcceptableUsePolicyPageV2.tsx' },
  { route: '/about', name: 'about', source: 'pages-v2/AboutPageV2.tsx' },
  { route: '/why-trust-us', name: 'why-trust-us', source: 'pages-v2/WhyTrustUsPageV2.tsx' },
  { route: '/resources', name: 'resources', source: 'pages/ResourceCentrePage.tsx' },
  { route: '/compare', name: 'compare', source: 'pages-v2/ComparePageV2.tsx' },
  { route: '/microsoft-business-premium', name: 'microsoft-business-premium', source: 'pages-v2/MicrosoftPremiumPageV2.tsx' },
  { route: '/upgrade-to-business-premium', name: 'upgrade-to-business-premium', source: 'pages/BusinessPremiumUpgradePage.tsx' },
  { route: '/managed-print-guide', name: 'managed-print-guide', source: 'pages/ManagedPrintGuidePage.tsx' },
  { route: '/cloud-backup-necessity', name: 'cloud-backup-necessity', source: 'pages/CloudBackupNecessityPage.tsx' },
  { route: '/email-security-check', name: 'email-security-check', source: 'pages-v2/EmailSecurityCheckPageV2.tsx' },
  { route: '/email-security-guide', name: 'email-security-guide', source: 'pages-v2/EmailSecurityGuidePageV2.tsx' },
  // name matches the route's dist directory path (minus the leading slash):
  // scripts/standalone-browser-check.mjs discovers routes by reading that path
  // back out of the data-standalone-page marker, so a versioned route's name
  // must be "slug/version", not "slug-version".
  { route: '/terms-of-business', name: 'terms-of-business', source: 'pages-v2/LegalDocumentPageV2.tsx' },
  { route: '/terms-of-business/v1-0', name: 'terms-of-business/v1-0', source: 'pages-v2/LegalDocumentPageV2.tsx' },
  { route: '/dpa', name: 'dpa', source: 'pages-v2/LegalDocumentPageV2.tsx' },
  { route: '/dpa/v1-0', name: 'dpa/v1-0', source: 'pages-v2/LegalDocumentPageV2.tsx' },
  { route: '/sub-processors', name: 'sub-processors', source: 'pages-v2/LegalDocumentPageV2.tsx' },
]);
