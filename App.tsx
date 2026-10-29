import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CookieBanner } from './components-v2/CookieBanner';
import { Loader2 } from 'lucide-react';
import { exactRedirects, prefixRedirects, regexRedirects } from './data/legacyRedirects';

// Eager load Home for LCP optimization
// v2 redesign branch: top conversion routes render their v2 ports (Layout dispatches to LayoutV2 chrome).
import { HomePageV2 as Home } from './pages-v2/HomePageV2';

// Lazy load other page components for performance
const ServicesPage = lazy(() => import('./pages-v2/ServicesPageV2').then(module => ({ default: module.ServicesPageV2 })));
const ServiceDetailPage = lazy(() => import('./pages-v2/ServiceDetailPageV2').then(module => ({ default: module.ServiceDetailPageV2 })));
const BlogPage = lazy(() => import('./pages-v2/BlogPageV2').then(module => ({ default: module.BlogPageV2 })));
const BlogPostPage = lazy(() => import('./pages-v2/BlogPostPageV2').then(module => ({ default: module.BlogPostPageV2 })));
const ScheduledPostsPage = lazy(() => import('./pages/ScheduledPostsPage').then(module => ({ default: module.ScheduledPostsPage })));
const CaseStudiesPage = lazy(() => import('./pages-v2/CaseStudiesPageV2').then(module => ({ default: module.CaseStudiesPageV2 })));
const CaseStudyDetailPage = lazy(() => import('./pages-v2/CaseStudyDetailPageV2').then(module => ({ default: module.CaseStudyDetailPageV2 })));
const AboutPage = lazy(() => import('./pages-v2/AboutPageV2').then(module => ({ default: module.AboutPageV2 })));
const IndustriesPage = lazy(() => import('./pages-v2/IndustriesPageV2').then(module => ({ default: module.IndustriesPageV2 })));
const IndustryDetailPage = lazy(() => import('./pages-v2/IndustryDetailPageV2').then(module => ({ default: module.IndustryDetailPageV2 })));
const PricingPage = lazy(() => import('./pages-v2/PricingPageV2').then(module => ({ default: module.PricingPageV2 })));
const ContactPage = lazy(() => import('./pages-v2/ContactPageV2').then(module => ({ default: module.ContactPageV2 })));
const FaqPage = lazy(() => import('./pages/FaqPage').then(module => ({ default: module.FaqPage })));
const LocationPage = lazy(() => import('./pages-v2/LocationPageV2').then(module => ({ default: module.LocationPageV2 })));
const ResourceCentrePage = lazy(() => import('./pages/ResourceCentrePage').then(module => ({ default: module.ResourceCentrePage })));
const MicrosoftPremiumPage = lazy(() => import('./pages-v2/MicrosoftPremiumPageV2').then(module => ({ default: module.MicrosoftPremiumPageV2 })));
const PrivacyPolicyPage = lazy(() => import('./pages-v2/PrivacyPolicyPageV2').then(module => ({ default: module.PrivacyPolicyPageV2 })));
const CookiePolicyPage = lazy(() => import('./pages-v2/CookiePolicyPageV2').then(module => ({ default: module.CookiePolicyPageV2 })));
const TermsPage = lazy(() => import('./pages-v2/TermsPageV2').then(module => ({ default: module.TermsPageV2 })));
const LegalDocumentPage = lazy(() => import('./pages-v2/LegalDocumentPageV2').then(module => ({ default: module.LegalDocumentPageV2 })));
const CareersPage = lazy(() => import('./pages-v2/CareersPageV2').then(module => ({ default: module.CareersPageV2 })));
const NotFoundPage = lazy(() => import('./pages-v2/NotFoundPageV2').then(module => ({ default: module.NotFoundPageV2 })));
const ITHealthCheckPage = lazy(() => import('./pages-v2/ITHealthCheckPageV2').then(module => ({ default: module.ITHealthCheckPageV2 })));
const EmailSecurityCheckPage = lazy(() => import('./pages-v2/EmailSecurityCheckPageV2').then(module => ({ default: module.EmailSecurityCheckPageV2 })));
const EmailSecurityGuidePage = lazy(() => import('./pages-v2/EmailSecurityGuidePageV2').then(module => ({ default: module.EmailSecurityGuidePageV2 })));
const OnboardingPage = lazy(() => import('./pages-v2/OnboardingPageV2').then(module => ({ default: module.OnboardingPageV2 })));
const IndustryGuidePage = lazy(() => import('./pages/IndustryGuidePage').then(module => ({ default: module.IndustryGuidePage })));
const ServiceLocationPage = lazy(() => import('./pages-v2/ServiceLocationPageV2').then(module => ({ default: module.ServiceLocationPageV2 })));
const TechExplainerPage = lazy(() => import('./pages/TechExplainerPage').then(module => ({ default: module.TechExplainerPage })));
const TechnologyLandingPage = lazy(() => import('./pages/TechnologyLandingPage').then(module => ({ default: module.TechnologyLandingPage })));
const IndustryPage = lazy(() => import('./pages-v2/IndustryDetailPageV2').then(module => ({ default: module.IndustryDetailPageV2 })));
const ProblemPage = lazy(() => import('./pages/ProblemPage').then(module => ({ default: module.ProblemPage })));
const SupportPage = lazy(() => import('./pages/SupportPage').then(module => ({ default: module.SupportPage })));
const ReferralPage = lazy(() => import('./pages-v2/ReferralPageV2').then(module => ({ default: module.ReferralPageV2 })));
const AuthorPage = lazy(() => import('./pages/AuthorPage').then(module => ({ default: module.AuthorPage })));
const CloudBackupNecessityPage = lazy(() => import('./pages/CloudBackupNecessityPage').then(module => ({ default: module.CloudBackupNecessityPage })));
const BusinessPremiumUpgradePage = lazy(() => import('./pages/BusinessPremiumUpgradePage').then(module => ({ default: module.BusinessPremiumUpgradePage })));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage').then(module => ({ default: module.ComparisonPage })));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage').then(module => ({ default: module.GlossaryPage })));
const ManagedPrintGuidePage = lazy(() => import('./pages/ManagedPrintGuidePage').then(module => ({ default: module.ManagedPrintGuidePage })));
const AIAcceptableUsePolicyPage = lazy(() => import('./pages-v2/AIAcceptableUsePolicyPageV2').then(module => ({ default: module.AIAcceptableUsePolicyPageV2 })));
const WhyTrustUsPage = lazy(() => import('./pages-v2/WhyTrustUsPageV2').then(module => ({ default: module.WhyTrustUsPageV2 })));
const FoundationMonitoringPage = lazy(() => import('./pages-v2/FoundationMonitoringPageV2').then(module => ({ default: module.FoundationMonitoringPageV2 })));
const ComparePage = lazy(() => import('./pages-v2/ComparePageV2').then(module => ({ default: module.ComparePageV2 })));
const CoManagedITPage = lazy(() => import('./pages-v2/CoManagedITPageV2').then(module => ({ default: module.CoManagedITPageV2 })));
const TechnologyStackPage = lazy(() => import('./pages-v2/TechnologyStackPageV2').then(module => ({ default: module.TechnologyStackPageV2 })));
const ServiceStandardsPage = lazy(() => import('./pages-v2/ServiceStandardsPageV2').then(module => ({ default: module.ServiceStandardsPageV2 })));
const SupportUpgradePage = lazy(() => import('./pages-v2/SupportUpgradePageV2').then(module => ({ default: module.SupportUpgradePageV2 })));

// Always use BrowserRouter — production, prerender (Playwright on localhost),
// and dev all serve the SPA with index.html fallback for unknown paths.
// HashRouter on localhost was previously emitting href="#/path" into the
// prerendered HTML that ships to Google, kneecapping the internal link graph.
const Router = BrowserRouter;

// Loading fallback
// Updated to min-h-screen to ensure footer is pushed below the fold during load, preventing CLS
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="animate-spin text-primary" size={48} />
  </div>
);

// Component to handle Wildcard Redirects (e.g., /news/xyz -> /blog)
const LegacyWildcardHandler = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  
  // Strip trailing slash for exact match consistency (except root)
  const cleanPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;

  // 1. Exact Match
  if (exactRedirects[cleanPath]) {
      return <Navigate to={exactRedirects[cleanPath]} replace />;
  }

  // 2. Prefix Match
  // We sort by length descending to ensure specific prefixes match before general ones
  // e.g. /news/2023/ should match before /news/ if both existed
  const prefixMatch = Object.keys(prefixRedirects).find(prefix => path.startsWith(prefix));
  if (prefixMatch) {
      return <Navigate to={prefixRedirects[prefixMatch]} replace />;
  }

  // 3. Regex Match
  const regexMatch = regexRedirects.find(r => r.pattern.test(path));
  if (regexMatch) {
      return <Navigate to={regexMatch.to} replace />;
  }

  // If no match, render 404 (children)
  return <>{children}</>;
};

// Router-neutral tree. The client wraps it in BrowserRouter (App); the
// build-time homepage SSR entry (entry-server.tsx) wraps it in StaticRouter.
// Both must render the identical tree for hydrateRoot to adopt the markup.
export function AppShell() {
  return (
    <>
        <ScrollToTop />
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:slug" element={<ServiceDetailPage />} />
            <Route path="/microsoft-business-premium" element={<MicrosoftPremiumPage />} />
            <Route path="/foundation-monitoring" element={<FoundationMonitoringPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/co-managed-it" element={<CoManagedITPage />} />
            <Route path="/technology-stack" element={<TechnologyStackPage />} />
            <Route path="/service-standards" element={<ServiceStandardsPage />} />
            <Route path="/cloud-backup-necessity" element={<CloudBackupNecessityPage />} />
            <Route path="/managed-print-guide" element={<ManagedPrintGuidePage />} />
            <Route path="/ai-acceptable-use-policy" element={<AIAcceptableUsePolicyPage />} />
            <Route path="/upgrade-to-business-premium" element={<BusinessPremiumUpgradePage />} />
            <Route path="/industries" element={<IndustriesPage />} />
            <Route path="/industries/:slug" element={<IndustryDetailPage />} />
            <Route path="/case-studies" element={<CaseStudiesPage />} />
            <Route path="/case-studies/:slug" element={<CaseStudyDetailPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/scheduled" element={<ScheduledPostsPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/team/:slug" element={<AuthorPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/resources" element={<ResourceCentrePage />} />
            <Route path="/it-health-check" element={<ITHealthCheckPage />} />
            <Route path="/email-security-check" element={<EmailSecurityCheckPage />} />
            <Route path="/email-security-guide" element={<EmailSecurityGuidePage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/locations/:city" element={<LocationPage />} />
            <Route path="/guides/:industry" element={<IndustryGuidePage />} />

            {/* Service + Location Pages */}
            <Route path="/it-support-shropshire" element={<ServiceLocationPage />} />
            <Route path="/it-support-herefordshire" element={<ServiceLocationPage />} />
            <Route path="/it-support-worcestershire" element={<ServiceLocationPage />} />
            <Route path="/it-support-powys" element={<ServiceLocationPage />} />
            <Route path="/cyber-essentials-shropshire" element={<ServiceLocationPage />} />
            <Route path="/cyber-essentials-herefordshire" element={<ServiceLocationPage />} />
            <Route path="/cyber-essentials-worcestershire" element={<ServiceLocationPage />} />
            <Route path="/cyber-essentials-powys" element={<ServiceLocationPage />} />
            <Route path="/microsoft-365-shropshire" element={<ServiceLocationPage />} />
            <Route path="/microsoft-365-herefordshire" element={<ServiceLocationPage />} />
            <Route path="/microsoft-365-worcestershire" element={<ServiceLocationPage />} />
            <Route path="/microsoft-365-powys" element={<ServiceLocationPage />} />

            {/* Town-Level Service + Location Pages */}
            <Route path="/it-support-ludlow" element={<ServiceLocationPage />} />
            <Route path="/it-support-shrewsbury" element={<ServiceLocationPage />} />
            <Route path="/it-support-telford" element={<ServiceLocationPage />} />
            <Route path="/it-support-hereford" element={<ServiceLocationPage />} />
            <Route path="/it-support-worcester" element={<ServiceLocationPage />} />
            <Route path="/it-support-kidderminster" element={<ServiceLocationPage />} />
            <Route path="/cyber-essentials-shrewsbury" element={<ServiceLocationPage />} />
            <Route path="/cyber-essentials-telford" element={<ServiceLocationPage />} />
            <Route path="/cyber-essentials-hereford" element={<ServiceLocationPage />} />
            <Route path="/cyber-essentials-worcester" element={<ServiceLocationPage />} />
            <Route path="/cyber-essentials-kidderminster" element={<ServiceLocationPage />} />
            <Route path="/microsoft-365-shrewsbury" element={<ServiceLocationPage />} />
            <Route path="/microsoft-365-telford" element={<ServiceLocationPage />} />
            <Route path="/microsoft-365-hereford" element={<ServiceLocationPage />} />
            <Route path="/microsoft-365-worcester" element={<ServiceLocationPage />} />
            <Route path="/microsoft-365-kidderminster" element={<ServiceLocationPage />} />

            {/* Industry Vertical Pages */}
            <Route path="/industries/accountants" element={<IndustryPage />} />
            <Route path="/industries/solicitors" element={<IndustryPage />} />
            <Route path="/industries/manufacturing" element={<IndustryPage />} />
            <Route path="/industries/agriculture" element={<IndustryPage />} />
            <Route path="/industries/healthcare" element={<IndustryPage />} />
            <Route path="/industries/professional-services" element={<IndustryPage />} />
            <Route path="/industries/charities" element={<IndustryPage />} />
            <Route path="/industries/education" element={<IndustryPage />} />
            <Route path="/industries/construction" element={<IndustryPage />} />
            <Route path="/industries/hospitality" element={<IndustryPage />} />
            <Route path="/industries/estate-agents" element={<IndustryPage />} />
            <Route path="/industries/financial-advisers" element={<IndustryPage />} />
            <Route path="/industries/recruitment" element={<IndustryPage />} />

            {/* Problem-Focused Pages */}
            <Route path="/slow-computers" element={<ProblemPage />} />
            <Route path="/it-security-audit" element={<ProblemPage />} />
            <Route path="/switch-it-provider" element={<ProblemPage />} />
            <Route path="/ransomware-recovery" element={<ProblemPage />} />
            <Route path="/office-move-it" element={<ProblemPage />} />
            <Route path="/email-account-hacked" element={<ProblemPage />} />
            <Route path="/laptop-stolen-lost" element={<ProblemPage />} />
            <Route path="/business-email-compromise" element={<ProblemPage />} />
            <Route path="/data-breach-discovered" element={<ProblemPage />} />
            <Route path="/windows-10-end-of-life" element={<ProblemPage />} />
            <Route path="/office-wifi-problems" element={<ProblemPage />} />
            <Route path="/staff-clicking-phishing" element={<ProblemPage />} />
            <Route path="/server-end-of-life" element={<ProblemPage />} />
            <Route path="/it-provider-not-responding" element={<ProblemPage />} />
            <Route path="/new-business-it-setup" element={<ProblemPage />} />

            {/* Comparison/Decision Pages */}
            <Route path="/break-fix-vs-managed-it" element={<ComparisonPage />} />
            <Route path="/in-house-vs-outsourced-it" element={<ComparisonPage />} />
            <Route path="/microsoft-365-plans-compared" element={<ComparisonPage />} />

            {/* Glossary */}
            <Route path="/glossary" element={<GlossaryPage />} />

            {/* Technology Explainer Pages */}
            <Route path="/technology" element={<TechnologyLandingPage />} />
            <Route path="/technology/:slug" element={<TechExplainerPage />} />

            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/cookie-policy" element={<CookiePolicyPage />} />
            <Route path="/terms-conditions" element={<TermsPage />} />
            <Route path="/terms-of-business/:version?" element={<LegalDocumentPage slug="terms-of-business" />} />
            <Route path="/dpa/:version?" element={<LegalDocumentPage slug="dpa" />} />
            <Route path="/sub-processors" element={<LegalDocumentPage slug="sub-processors" />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/support-upgrade" element={<SupportUpgradePage />} />
            <Route path="/refer" element={<ReferralPage />} />
            <Route path="/why-trust-us" element={<WhyTrustUsPage />} />

            {/* Catch all - Check for Legacy Redirects first, then 404 */}
            <Route path="*" element={
               <LegacyWildcardHandler>
                  <NotFoundPage />
               </LegacyWildcardHandler>
            } />
            </Routes>
          </Suspense>
        </Layout>
        <CookieBanner />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppShell />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
