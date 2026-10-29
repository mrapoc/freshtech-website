import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { Menu, X, Phone, MessageSquare, MessageCircle, Video, ChevronDown, Facebook, Linkedin, HelpCircle, Gift, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { contactDetails } from '../data/content';
import { industryNavigation, problemNavigation } from '../data/navigation';
import { ObfuscatedEmail } from './ObfuscatedEmail';
import { FestiveProvider, FestiveToggle } from './ChristmasTheme';
import { ScrollProgress } from './ScrollProgress';
import { BusinessHours } from './BusinessHours';
import { initAITracking } from '../utils/analytics';
import { openCookieSettings } from '../utils/consent';
import { LayoutV2 } from '../components-v2/LayoutV2';

// Routes that use the v2 design system. Layout dispatches to LayoutV2
// for these paths so the redesigned pages get their own nav/footer/chrome.
// Add a route here when porting another page to v2.
const V2_EXACT_ROUTES = new Set<string>([
  '/',
  '/about',
  '/pricing',
  '/contact',
  '/services',
  '/case-studies',
  '/blog',
  '/industries',
  '/why-trust-us',
  '/onboarding',
  '/careers',
  '/refer',
  '/it-health-check',
  '/microsoft-business-premium',
  '/privacy-policy',
  '/cookie-policy',
  '/terms-conditions',
  '/terms-of-business',
  '/dpa',
  '/sub-processors',
  '/ai-acceptable-use-policy',
  '/foundation-monitoring',
  '/compare',
  '/co-managed-it',
  '/technology-stack',
  '/service-standards',
  '/support-upgrade',
]);
// Prefix matches for dynamic routes: /services/:slug, /case-studies/:slug, etc.
// Service+location routes (/it-support-..., /cyber-essentials-..., /microsoft-365-...)
// all render via ServiceLocationPageV2, so they get v2 chrome too.
const V2_PREFIXES = [
  '/services/', '/case-studies/', '/blog/', '/industries/', '/locations/',
  '/terms-of-business/', '/dpa/',
  '/it-support-', '/cyber-essentials-', '/microsoft-365-',
];
const V2_ACTIVE_PAGE: Record<string, string> = {
  '/':              'Home',
  '/about':         'About',
  '/pricing':       'Pricing',
  '/contact':       'Contact',
  '/services':      'Services',
  '/case-studies':  'Case Studies',
  '/blog':          'Blog',
  '/industries':    'Sectors',
  '/why-trust-us':  'Why Trust Us',
  '/onboarding':    'Onboarding',
  '/careers':       'Careers',
  '/refer':         'Refer',
  '/it-health-check':            'IT Health Check',
  '/microsoft-business-premium': 'Business Premium',
};
const isV2Route = (pathname: string): boolean => {
  if (V2_EXACT_ROUTES.has(pathname)) return true;
  return V2_PREFIXES.some(p => pathname.startsWith(p));
};

// Lazy load non-critical components to reduce initial bundle and improve LCP
const CalendlyModal = lazy(() => import('./CalendlyModal').then(m => ({ default: m.CalendlyModal })));
const KonamiCodeHandler = lazy(() => import('./KonamiCode').then(m => ({ default: m.KonamiCodeHandler })));
const KeyboardShortcuts = lazy(() => import('./KeyboardShortcuts').then(m => ({ default: m.KeyboardShortcuts })));
const BackToTop = lazy(() => import('./BackToTop').then(m => ({ default: m.BackToTop })));
const ExitIntentSlide = lazy(() => import('./ExitIntentSlide').then(m => ({ default: m.ExitIntentSlide })));

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

  // Mobile submenu states
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileIndustriesOpen, setMobileIndustriesOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);

  const location = useLocation();
  const [pageAnnouncement, setPageAnnouncement] = useState('');

  // Announce page changes for screen readers
  useEffect(() => {
    // Get the page title from document after React Helmet updates it
    const timeoutId = setTimeout(() => {
      const title = document.title?.split(' | ')[0] || 'Page loaded';
      setPageAnnouncement(`Navigated to ${title}`);
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Track AI referrals (ChatGPT, Perplexity, Claude, etc.) - runs once on mount
  const aiTrackingInitialized = useRef(false);
  useEffect(() => {
    if (!aiTrackingInitialized.current) {
      aiTrackingInitialized.current = true;
      initAITracking();
    }
  }, []);

  // Helper to close menu on navigation
  const handleNavClick = () => {
    setIsMenuOpen(false);
    setMobileServicesOpen(false);
    setMobileIndustriesOpen(false);
    setMobileResourcesOpen(false);
  };

  const openBooking = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCalendlyOpen(true);
    setIsMenuOpen(false);
  };

  // v2 redesign branch: dispatch to LayoutV2 for routes matched by isV2Route.
  // Hooks above still run so the legacy Layout's state stays consistent
  // even when we render the v2 chrome instead.
  if (isV2Route(location.pathname)) {
    return (
      <FestiveProvider>
        <LayoutV2 activePage={V2_ACTIVE_PAGE[location.pathname]}>
          {children}
        </LayoutV2>
      </FestiveProvider>
    );
  }

  return (
    <FestiveProvider>
      <div className="min-h-screen font-sans text-neutral bg-white selection:bg-highlight flex flex-col overflow-x-hidden">
        {/* Skip to content link for keyboard/screen reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-sm focus:font-bold focus:shadow-lg"
        >
          Skip to main content
        </a>

        {/* Screen reader page change announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {pageAnnouncement}
        </div>

        {/* Lazy load modal only when opened */}
        {isCalendlyOpen && (
          <Suspense fallback={null}>
            <CalendlyModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
          </Suspense>
        )}

        {/* Scroll Progress Bar */}
        <ScrollProgress />

        {/* Lazy load non-critical easter eggs after initial render */}
        <Suspense fallback={null}>
          <KonamiCodeHandler />
          <KeyboardShortcuts />
        </Suspense>

        {/* Utility Bar */}
        <div className="bg-neutral text-white text-xs py-2 px-4 hidden md:flex justify-end lg:justify-between items-center relative z-60">
          {/* Hide on tablet, show on large screens */}
          <div className="hidden lg:flex items-center gap-4">
            <span>Serving Shropshire, Herefordshire, Worcestershire & Powys</span>
            <span className="text-gray-500">|</span>
            <BusinessHours className="text-gray-300" />
          </div>

          <div className="flex gap-4 font-bold items-center">
            {/* Holiday Toggle */}
            <FestiveToggle />

            <button onClick={openBooking} className="flex items-center gap-1 hover:text-accent transition-colors">
               <Video size={12} /> Book Discovery Call
            </button>
            <a href={`tel:${contactDetails.phone.replace(/\s/g, '')}`} className="hover:text-accent transition-colors">{contactDetails.phone}</a>
            <ObfuscatedEmail className="hover:text-accent transition-colors" label="hello@fresh-tech.uk" />
          </div>
        </div>

        {/* Sticky Header - Fixed Height to prevent CLS/Jumps */}
        <header className="sticky top-0 z-40 bg-white border-b-4 border-primary shadow-xs h-[76px] lg:h-[90px]">
          <div className="container mx-auto px-4 h-full flex justify-between items-center">
            {/* Logo - Unskewed and Clean */}
            <Link to="/" className="flex items-center gap-2 h-full py-2" onClick={handleNavClick}>
              <img
                src="https://res.cloudinary.com/djkmeg5se/image/upload/w_200,f_auto,q_auto/fresh-tech-logo.png"
                alt="Fresh Tech IT Support"
                width="97"
                height="70"
                fetchPriority="high"
                decoding="sync"
                // Fixed width class to prevent w-auto layout shift
                className="h-full w-[97px] object-contain"
              />
            </Link>

            {/* Desktop Nav - Updated to text-primary-dark for accessibility (Contrast 6.2:1) */}
            <nav className="hidden lg:flex gap-8 items-center font-semibold text-primary-dark text-sm xl:text-base h-full">
              <Link to="/" className="hover:text-accent-dark transition-colors">Home</Link>
              {/* About Dropdown */}
              <div className="relative group cursor-pointer h-full flex items-center">
                 <Link to="/about" className="flex items-center gap-1 hover:text-accent-dark transition-colors py-4 h-full">
                   About <ChevronDown size={16} />
                 </Link>
                 <div className="absolute top-full left-0 w-56 bg-white border-2 border-neutral shadow-xl rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                    <Link to="/about" className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 hover:text-accent-dark">Meet the Team</Link>
                    <Link to="/why-trust-us" className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 hover:text-accent-dark">Why Trust Us</Link>
                    <Link to="/onboarding" className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 hover:text-accent-dark">How Switching Works</Link>
                    <Link to="/careers" className="block px-4 py-3 hover:bg-gray-50 hover:text-accent-dark rounded-b-lg">Careers</Link>
                 </div>
              </div>

              {/* Services Dropdown */}
              <div className="relative group cursor-pointer h-full flex items-center">
                 <Link to="/services" className="flex items-center gap-1 hover:text-accent-dark transition-colors py-4 h-full">
                   Services <ChevronDown size={16} />
                 </Link>
                 <div className="absolute top-full left-0 w-64 bg-white border-2 border-neutral shadow-xl rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                    <Link to="/services/managed-it-support" className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 hover:text-accent-dark">IT Support</Link>
                    <Link to="/services/cybersecurity" className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 hover:text-accent-dark">Cyber Security</Link>
                    <Link to="/services/cyber-essentials" className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 hover:text-accent-dark">Cyber Essentials</Link>
                    <Link to="/services/cloud-solutions" className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 hover:text-accent-dark">Cloud & Digital Transformation</Link>
                    <Link to="/services/strategic-projects" className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 hover:text-accent-dark">Strategic Projects</Link>
                    <Link to="/services/hardware-procurement" className="block px-4 py-3 hover:bg-gray-50 hover:text-accent-dark rounded-b-lg">Hardware Procurement</Link>
                 </div>
              </div>

              {/* Industries Dropdown - Main Link Clickable */}
              <div className="relative group h-full flex items-center">
                 <Link to="/industries" className="flex items-center gap-1 hover:text-accent-dark transition-colors py-4 h-full">
                   Industries <ChevronDown size={16} />
                 </Link>
                 <div className="absolute top-full left-0 w-64 bg-white border-2 border-neutral shadow-xl rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                    {industryNavigation.map((ind, index, arr) => (
                      <Link
                        key={ind.slug}
                        to={`/industries/${ind.slug}`}
                        className={`block px-4 py-3 hover:bg-gray-50 hover:text-accent-dark ${index !== arr.length - 1 ? 'border-b border-gray-100' : 'rounded-b-lg'}`}
                      >
                        {ind.h1.replace('IT Support for ', '')}
                      </Link>
                    ))}
                 </div>
              </div>

              {/* Resource Centre Dropdown */}
              <div className="relative group h-full flex items-center">
                 <Link to="/resources" className="flex items-center gap-1 hover:text-accent-dark transition-colors py-4 h-full">
                   Resource Centre <ChevronDown size={16} />
                 </Link>
                 <div className="absolute top-full left-0 w-64 bg-white border-2 border-neutral shadow-xl rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                    <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-dark bg-gray-50 border-b border-gray-100">Essential Guides</div>
                    <Link to="/cloud-backup-necessity" className="block px-4 py-3 hover:bg-blue-50 border-b border-gray-100 hover:text-primary">Why Cloud Backup is Essential</Link>
                    <Link to="/microsoft-business-premium" className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 hover:text-accent-dark">Why Business Premium?</Link>
                    <Link to="/blog" className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 hover:text-accent-dark">Blog & News</Link>
                    <Link to="/case-studies" className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 hover:text-accent-dark">Case Studies</Link>
                    <Link to="/faq" className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 hover:text-accent-dark">FAQ</Link>
                    <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 border-t border-gray-100">Crisis Help</div>
                    <Link to="/email-account-hacked" className="block px-4 py-3 hover:bg-red-50 border-b border-gray-100 hover:text-red-600">Email Hacked?</Link>
                    <Link to="/ransomware-recovery" className="block px-4 py-3 hover:bg-red-50 hover:text-red-600 rounded-b-lg">Ransomware Attack?</Link>
                 </div>
              </div>

              <Link to="/pricing" className="hover:text-accent-dark transition-colors">Pricing</Link>

              <div className="flex gap-2">
                {/* Book Chat: Darker Text & Border for Accessiblity */}
                <button onClick={openBooking} className="bg-white text-primary-dark px-4 py-2 rounded-full font-bold border-2 border-primary-dark hover:bg-primary-dark hover:text-white transition-all text-sm">
                  Book Chat
                </button>
                {/* Contact: Black text on Orange for high contrast */}
                <Link to="/contact" className="bg-accent text-neutral px-5 py-2 rounded-full font-bold shadow-comic hover:shadow-comic-hover hover:translate-y-[2px] transition-all border-2 border-neutral text-sm">
                  Contact
                </Link>
              </div>
            </nav>

            {/* Mobile Menu Toggle */}
            <div className="flex lg:hidden items-center gap-2">
               {/* Mobile Holiday Toggle - renders as fragments to avoid gap styling issues */}
               <FestiveToggle isMobile={true} />
               
               <button
                className="text-primary-dark focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
              </button>
            </div>
          </div>

          {/* Mobile Nav Drawer */}
          {isMenuOpen && (
            <div id="mobile-menu" className="lg:hidden absolute top-full left-0 w-full bg-white border-b-4 border-primary shadow-xl p-4 flex flex-col gap-2 z-50 max-h-[85vh] overflow-y-auto">
               <Link to="/" onClick={handleNavClick} className="py-3 border-b border-gray-100 font-bold text-lg text-neutral">Home</Link>
               <Link to="/about" onClick={handleNavClick} className="py-3 border-b border-gray-100 font-bold text-lg text-neutral">About Us</Link>
               <Link to="/why-trust-us" onClick={handleNavClick} className="py-3 border-b border-gray-100 pl-4 text-gray-600">Why Trust Us</Link>
               <Link to="/onboarding" onClick={handleNavClick} className="py-3 border-b border-gray-100 pl-4 text-gray-600">How Switching Works</Link>

               {/* Mobile Services */}
               <div>
                  <div className="flex justify-between items-center border-b border-gray-100">
                      <Link to="/services" onClick={handleNavClick} className="grow py-3 font-bold text-lg text-neutral">Services</Link>
                      <button
                          onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                          className="p-3 text-neutral focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                          aria-expanded={mobileServicesOpen}
                          aria-label={mobileServicesOpen ? "Collapse services menu" : "Expand services menu"}
                      >
                          <ChevronDown size={20} className={`transition-transform ${mobileServicesOpen ? 'rotate-180' : ''}`} />
                      </button>
                  </div>
                  {mobileServicesOpen && (
                    <div className="pl-4 bg-gray-50 border-b border-gray-100">
                      <Link to="/services/managed-it-support" onClick={handleNavClick} className="block py-2 text-gray-700">IT Support</Link>
                      <Link to="/services/cybersecurity" onClick={handleNavClick} className="block py-2 text-gray-700">Cyber Security</Link>
                      <Link to="/services/cyber-essentials" onClick={handleNavClick} className="block py-2 text-gray-700">Cyber Essentials</Link>
                      <Link to="/services/cloud-solutions" onClick={handleNavClick} className="block py-2 text-gray-700">Cloud & Digital Transformation</Link>
                      <Link to="/services/strategic-projects" onClick={handleNavClick} className="block py-2 text-gray-700">Strategic Projects</Link>
                      <Link to="/services/hardware-procurement" onClick={handleNavClick} className="block py-2 text-gray-700">Hardware</Link>
                    </div>
                  )}
               </div>

               {/* Mobile Industries */}
               <div>
                  <div className="flex justify-between items-center border-b border-gray-100">
                     <Link to="/industries" onClick={handleNavClick} className="grow py-3 font-bold text-lg text-neutral">Industries</Link>
                     <button
                        onClick={() => setMobileIndustriesOpen(!mobileIndustriesOpen)}
                        className="p-3 text-neutral focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                        aria-expanded={mobileIndustriesOpen}
                        aria-label={mobileIndustriesOpen ? "Collapse industries menu" : "Expand industries menu"}
                     >
                        <ChevronDown size={20} className={`transition-transform ${mobileIndustriesOpen ? 'rotate-180' : ''}`} />
                     </button>
                  </div>
                  {mobileIndustriesOpen && (
                    <div className="pl-4 bg-gray-50 border-b border-gray-100">
                      {industryNavigation.map(ind => (
                        <Link key={ind.slug} to={`/industries/${ind.slug}`} onClick={handleNavClick} className="block py-2 text-gray-700">
                          {ind.h1.replace('IT Support for ', '')}
                        </Link>
                      ))}
                    </div>
                  )}
               </div>
              
               {/* Mobile Resource Centre */}
               <div>
                  <div className="flex justify-between items-center border-b border-gray-100">
                     <Link to="/resources" onClick={handleNavClick} className="grow py-3 font-bold text-lg text-neutral">Resource Centre</Link>
                     <button
                        onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
                        className="p-3 text-neutral focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                        aria-expanded={mobileResourcesOpen}
                        aria-label={mobileResourcesOpen ? "Collapse resources menu" : "Expand resources menu"}
                     >
                        <ChevronDown size={20} className={`transition-transform ${mobileResourcesOpen ? 'rotate-180' : ''}`} />
                     </button>
                  </div>
                  {mobileResourcesOpen && (
                    <div className="pl-4 bg-gray-50 border-b border-gray-100">
                      <div className="py-2 text-xs font-bold uppercase tracking-wider text-primary-dark">Essential Guides</div>
                      <Link to="/cloud-backup-necessity" onClick={handleNavClick} className="block py-2 text-primary font-semibold">Why Cloud Backup is Essential</Link>
                      <Link to="/microsoft-business-premium" onClick={handleNavClick} className="block py-2 text-primary-dark font-semibold">Why Business Premium?</Link>
                      <Link to="/blog" onClick={handleNavClick} className="block py-2 text-gray-700">Blog</Link>
                      <Link to="/case-studies" onClick={handleNavClick} className="block py-2 text-gray-700">Case Studies</Link>
                      <Link to="/faq" onClick={handleNavClick} className="block py-2 text-gray-700">FAQ</Link>
                      <div className="py-2 text-xs font-bold uppercase tracking-wider text-red-600">Crisis Help</div>
                      <Link to="/email-account-hacked" onClick={handleNavClick} className="block py-2 text-red-600">Email Hacked?</Link>
                      <Link to="/ransomware-recovery" onClick={handleNavClick} className="block py-2 text-red-600">Ransomware Attack?</Link>
                    </div>
                  )}
               </div>

               <Link to="/pricing" onClick={handleNavClick} className="py-3 border-b border-gray-100 font-bold text-lg text-neutral">Pricing</Link>
               
               <div className="pt-4 space-y-3">
                   <Link to="/contact" onClick={handleNavClick} className="block w-full text-center border-2 border-primary-dark text-primary-dark py-3 rounded-lg font-bold">
                      Contact Us
                   </Link>
                   <button onClick={openBooking} className="w-full bg-accent text-center text-neutral py-3 rounded-lg font-bold shadow-comic border-2 border-neutral">
                      Book Teams Chat
                   </button>
               </div>
            </div>
          )}
        </header>

        <main id="main-content" role="main" className="grow pb-20 md:pb-0">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-neutral text-white pt-16 pb-24 md:pb-8 border-t-8 border-highlight">
          <div className="container mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Col 1: Company */}
            <div>
               {/* Using White Logo for Footer - Inline Styles to force explicit size and prevent CLS */}
              <img
                  src="https://res.cloudinary.com/djkmeg5se/image/upload/w_150,f_auto,q_auto/fresh-tech-logo-white.png"
                  alt="Fresh Tech IT Support"
                  width="66"
                  height="48"
                  loading="lazy"
                  decoding="async"
                  style={{ width: '66px', height: '48px' }}
                  className="mb-6 block"
              />
              <h4 className="font-bold text-lg mb-4 text-highlight">Company</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><Link to="/about" className="hover:text-white hover:translate-x-1 transition-transform inline-block">About Us</Link></li>
                <li><Link to="/why-trust-us" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Why Trust Us</Link></li>
                <li><Link to="/contact" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Contact</Link></li>
                <li><Link to="/pricing" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Pricing</Link></li>
                <li><Link to="/case-studies" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Case Studies</Link></li>
                <li><Link to="/blog" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Careers</Link></li>
              </ul>
              <div className="flex gap-4 mt-6">
                 <a href={contactDetails.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-accent transition-colors"><Facebook size={20} /></a>
                 <a href={contactDetails.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-gray-400 hover:text-accent transition-colors"><Linkedin size={20} /></a>
              </div>

              {/* Technology Explained */}
              <h4 className="font-bold text-lg mb-3 mt-8 text-highlight">Technology Explained</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><Link to="/technology/rmm" className="hover:text-white hover:translate-x-1 transition-transform inline-block">What is RMM?</Link></li>
                <li><Link to="/technology/edr-mdr" className="hover:text-white hover:translate-x-1 transition-transform inline-block">EDR & MDR Explained</Link></li>
                <li><Link to="/technology/application-control" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Application Control</Link></li>
                <li><Link to="/technology/admin-rights" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Why No Admin Rights?</Link></li>
                <li><Link to="/technology/itdr" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Identity Protection (ITDR)</Link></li>
                <li><Link to="/technology/vpn" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Do I Need a VPN?</Link></li>
                <li><Link to="/technology" className="hover:text-white hover:translate-x-1 transition-transform inline-block text-accent">View All Guides →</Link></li>
              </ul>
            </div>

            {/* Col 2: Services */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-highlight">Services</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><Link to="/services/managed-it-support" className="hover:text-white hover:translate-x-1 transition-transform inline-block">IT Support</Link></li>
                <li><Link to="/services/cybersecurity" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Cyber Security</Link></li>
                <li><Link to="/services/cyber-essentials" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Cyber Essentials</Link></li>
                <li><Link to="/services/cloud-solutions" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Cloud Solutions</Link></li>
                <li><Link to="/services/hardware-procurement" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Hardware</Link></li>
                <li><Link to="/services/strategic-projects" className="hover:text-white hover:translate-x-1 transition-transform inline-block">Projects</Link></li>
              </ul>

              {/* Common IT Problems */}
              <h4 className="font-bold text-lg mb-3 mt-8 text-highlight">IT Problems We Solve</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                {problemNavigation.map(problem => (
                  <li key={problem.slug}>
                    <Link to={`/${problem.slug}`} className="hover:text-white hover:translate-x-1 transition-transform inline-block">
                      {problem.h1.replace('Dealing with ', '').replace('How to ', '').replace(' Successfully', '').replace(' - Expert IT Support', '')}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Service Areas - Counties with key towns */}
            <div className="lg:col-span-2">
              <h4 className="font-bold text-lg mb-4 text-highlight">Service Areas</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
                {/* Shropshire */}
                <div>
                  <Link to="/locations/shropshire" className="font-bold text-white hover:text-accent transition-colors block mb-2 py-1">Shropshire</Link>
                  <ul className="text-gray-400 space-y-2 text-xs">
                    <li className="flex flex-wrap gap-x-2 gap-y-1"><Link to="/locations/ludlow" className="hover:text-white py-0.5">Ludlow</Link> <span className="text-gray-600 hidden sm:inline">•</span> <Link to="/locations/shrewsbury" className="hover:text-white py-0.5">Shrewsbury</Link></li>
                    <li className="flex flex-wrap gap-x-2 gap-y-1"><Link to="/locations/telford" className="hover:text-white py-0.5">Telford</Link> <span className="text-gray-600 hidden sm:inline">•</span> <Link to="/locations/oswestry" className="hover:text-white py-0.5">Oswestry</Link></li>
                    <li className="flex flex-wrap gap-x-2 gap-y-1"><Link to="/locations/bridgnorth" className="hover:text-white py-0.5">Bridgnorth</Link> <span className="text-gray-600 hidden sm:inline">•</span> <Link to="/locations/market-drayton" className="hover:text-white py-0.5">Market Drayton</Link></li>
                  </ul>
                </div>
                {/* Herefordshire */}
                <div>
                  <Link to="/locations/herefordshire" className="font-bold text-white hover:text-accent transition-colors block mb-2 py-1">Herefordshire</Link>
                  <ul className="text-gray-400 space-y-2 text-xs">
                    <li className="flex flex-wrap gap-x-2 gap-y-1"><Link to="/locations/hereford" className="hover:text-white py-0.5">Hereford</Link> <span className="text-gray-600 hidden sm:inline">•</span> <Link to="/locations/leominster" className="hover:text-white py-0.5">Leominster</Link></li>
                    <li className="flex flex-wrap gap-x-2 gap-y-1"><Link to="/locations/ross-on-wye" className="hover:text-white py-0.5">Ross-on-Wye</Link> <span className="text-gray-600 hidden sm:inline">•</span> <Link to="/locations/ledbury" className="hover:text-white py-0.5">Ledbury</Link></li>
                    <li className="flex flex-wrap gap-x-2 gap-y-1"><Link to="/locations/bromyard" className="hover:text-white py-0.5">Bromyard</Link> <span className="text-gray-600 hidden sm:inline">•</span> <Link to="/locations/kington" className="hover:text-white py-0.5">Kington</Link></li>
                  </ul>
                </div>
                {/* Worcestershire */}
                <div>
                  <Link to="/locations/worcestershire" className="font-bold text-white hover:text-accent transition-colors block mb-2 py-1">Worcestershire</Link>
                  <ul className="text-gray-400 space-y-2 text-xs">
                    <li className="flex flex-wrap gap-x-2 gap-y-1"><Link to="/locations/worcester" className="hover:text-white py-0.5">Worcester</Link> <span className="text-gray-600 hidden sm:inline">•</span> <Link to="/locations/malvern" className="hover:text-white py-0.5">Malvern</Link></li>
                    <li className="flex flex-wrap gap-x-2 gap-y-1"><Link to="/locations/kidderminster" className="hover:text-white py-0.5">Kidderminster</Link> <span className="text-gray-600 hidden sm:inline">•</span> <Link to="/locations/redditch" className="hover:text-white py-0.5">Redditch</Link></li>
                    <li className="flex flex-wrap gap-x-2 gap-y-1"><Link to="/locations/bromsgrove" className="hover:text-white py-0.5">Bromsgrove</Link> <span className="text-gray-600 hidden sm:inline">•</span> <Link to="/locations/droitwich" className="hover:text-white py-0.5">Droitwich</Link></li>
                  </ul>
                </div>
                {/* Powys */}
                <div>
                  <Link to="/locations/powys" className="font-bold text-white hover:text-accent transition-colors block mb-2 py-1">Powys</Link>
                  <ul className="text-gray-400 space-y-2 text-xs">
                    <li className="flex flex-wrap gap-x-2 gap-y-1"><Link to="/locations/welshpool" className="hover:text-white py-0.5">Welshpool</Link> <span className="text-gray-600 hidden sm:inline">•</span> <Link to="/locations/newtown" className="hover:text-white py-0.5">Newtown</Link></li>
                    <li className="flex flex-wrap gap-x-2 gap-y-1"><Link to="/locations/brecon" className="hover:text-white py-0.5">Brecon</Link> <span className="text-gray-600 hidden sm:inline">•</span> <Link to="/locations/builth-wells" className="hover:text-white py-0.5">Builth Wells</Link></li>
                    <li><Link to="/locations/llandrindod-wells" className="hover:text-white py-0.5">Llandrindod Wells</Link></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Col 4: Support & Contact */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-highlight">Support</h4>
              <ul className="space-y-3 text-gray-300 text-sm">
                 <li>
                   <Link to="/support" className="flex items-center gap-2 hover:text-white transition-colors">
                      <HelpCircle size={16} className="text-accent" /> Get Support
                   </Link>
                 </li>
                 <li>
                   <a
                     href={contactDetails.portal}
                     target="_blank"
                     rel="noreferrer"
                     aria-label="Client Portal (opens in new tab)"
                     className="flex items-center gap-2 hover:text-white transition-colors"
                   >
                      <MessageSquare size={16} className="text-accent" /> Client Portal
                   </a>
                 </li>
                 <li>
                   <button onClick={openBooking} className="flex items-center gap-2 hover:text-white transition-colors">
                      <Video size={16} className="text-accent" /> Book Discovery Call
                   </button>
                 </li>
                 <li>
                   <Link to="/refer" className="flex items-center gap-2 hover:text-white transition-colors">
                      <Gift size={16} className="text-accent" /> Refer a Business
                   </Link>
                 </li>
              </ul>
              <address className="not-italic text-gray-300 text-sm mt-6 space-y-1">
                <p className="font-bold text-white">{contactDetails.legal?.tradingAs}</p>
                <p>{contactDetails.address.line1}</p>
                <p>{contactDetails.address.line2}, {contactDetails.address.postcode}</p>
                <p className="pt-2">
                   <a href={`tel:${contactDetails.phone.replace(/\s/g, '')}`} className="text-white hover:text-accent font-bold">{contactDetails.phone}</a>
                </p>
              </address>

              {/* Cyber Essentials Badge - Styled component (more reliable than external images) */}
              <a
                href="https://registry.blockmarktech.com/certificates/d814fc98-ac12-42d2-803a-ba214816fd98/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex flex-col items-center gap-1 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors group"
                title="View Cyber Essentials Certificate"
              >
                <ShieldCheck size={32} className="text-green-400 group-hover:text-green-300" />
                <span className="text-xs font-bold text-white text-center leading-tight">Cyber Essentials<br/>Certified</span>
              </a>
            </div>
          </div>
          <div className="text-center text-gray-300 text-xs border-t border-gray-700 pt-8 px-4">
            <div className="mb-2">
              &copy; {new Date().getFullYear()} {contactDetails.legal?.name}. All rights reserved. Company No. {contactDetails.legal?.companyNumber}.
            </div>
            <div className="space-x-4">
               <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
               <Link to="/cookie-policy" className="hover:text-white">Cookie Policy</Link>
               <button type="button" onClick={() => openCookieSettings()} className="hover:text-white underline">Cookie Settings</button>
               <Link to="/terms-conditions" className="hover:text-white">Terms & Conditions</Link>
               <Link to="/terms-of-business" className="hover:text-white">Terms of Business</Link>
               <Link to="/dpa" className="hover:text-white">DPA</Link>
            </div>
          </div>
        </footer>

        {/* Back to Top Button - lazy loaded as not needed initially */}
        <Suspense fallback={null}>
          <BackToTop />
        </Suspense>

        {/* Exit Intent Slide-in for Health Check - lazy loaded */}
        <Suspense fallback={null}>
          <ExitIntentSlide />
        </Suspense>

        {/* Fixed Contact Link (Desktop/Tablet) - prominent, easy to spot */}
        <Link
          to="/contact"
          className="hidden md:flex fixed bottom-6 left-6 z-50 items-center gap-3 bg-accent hover:bg-accent/90 text-neutral px-6 py-4 rounded-full shadow-comic hover:shadow-comic-hover hover:-translate-y-1 transition-all duration-200 group border-2 border-neutral"
          aria-label="Get in touch"
        >
          <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
          <span className="font-bold text-lg">Get in touch</span>
        </Link>

        {/* Fixed Conversion Bar (Mobile) - 3 CTAs */}
        <div className="fixed bottom-0 left-0 w-full bg-neutral shadow-[0_-4px_10px_rgba(0,0,0,0.2)] flex md:hidden z-50">
          <a href={`tel:${contactDetails.phone.replace(/\s/g, '')}`} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-white hover:bg-white/10 transition-colors">
            <Phone size={16} />
            <span className="text-xs font-bold">Call</span>
          </a>
          <Link
            to="/contact"
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-white hover:bg-white/10 transition-colors border-x border-white/20"
          >
            <MessageCircle size={16} />
            <span className="text-xs font-bold">Contact</span>
          </Link>
          <button onClick={openBooking} className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-accent text-neutral font-bold hover:bg-accent/90 transition-colors">
            <Video size={16} />
            <span className="text-xs font-bold">Book Call</span>
          </button>
        </div>
      </div>
    </FestiveProvider>
  );
};
