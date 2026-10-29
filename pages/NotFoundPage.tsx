import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { BookOpen, Home, Search, Phone, FileText, Shield, MapPin, HelpCircle } from 'lucide-react';

// Popular pages to suggest
const popularPages = [
  { title: 'IT Support Services', path: '/services/managed-it-support', icon: Shield },
  { title: 'Cyber Essentials', path: '/services/cyber-essentials', icon: FileText },
  { title: 'Case Studies', path: '/case-studies', icon: BookOpen },
  { title: 'Service Areas', path: '/locations/shropshire', icon: MapPin },
  { title: 'FAQ', path: '/faq', icon: HelpCircle },
  { title: 'Contact Us', path: '/contact', icon: Phone },
];

export const NotFoundPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to blog with search intent (or could implement site search)
      navigate(`/blog?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-neutral text-white px-4 py-12">
      {/* Critical: noIndex={true} tells Google this is a 404 equivalent */}
      <SEO title="Page Not Found" noIndex={true} />

      <h1 className="font-heading text-8xl md:text-9xl text-primary mb-4">404</h1>
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">Villains have stolen this page!</h2>
      <p className="text-gray-400 mb-6 max-w-md text-center text-sm md:text-base">
        The page you're looking for has been moved, deleted, or possibly kidnapped by a rival organization.
      </p>

      {/* Show the attempted URL */}
      <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700 mb-6 max-w-md text-xs text-gray-400 font-mono overflow-x-auto w-full text-center">
        {location.pathname}
      </div>

      {/* Search Box */}
      <form onSubmit={handleSearch} className="w-full max-w-md mb-8">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for what you need..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-800 border-2 border-gray-600 text-white placeholder-gray-400 focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-primary-dark transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Popular Pages */}
      <div className="w-full max-w-2xl mb-8">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">Popular Pages</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {popularPages.map((page) => (
            <Link
              key={page.path}
              to={page.path}
              className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 hover:bg-gray-700 border border-gray-700 hover:border-primary rounded-lg transition-all text-sm"
            >
              <page.icon size={16} className="text-primary shrink-0" />
              <span className="truncate">{page.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 mb-8 max-w-md mx-auto text-sm text-gray-300 text-center">
        <p><strong>Arrived from an old link?</strong></p>
        <p>We recently upgraded our HQ. Old blog posts and news articles have been archived or redirected.</p>
      </div>

      {/* Main CTAs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/" className="bg-accent text-white px-8 py-3 rounded-lg font-bold shadow-comic hover:shadow-comic-hover hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 border-2 border-neutral">
           <Home size={18} /> Return to Base
        </Link>
        <Link to="/contact" className="bg-white text-neutral px-8 py-3 rounded-lg font-bold hover:bg-highlight transition-all flex items-center justify-center gap-2">
           <Phone size={18} /> Contact Support
        </Link>
      </div>
    </div>
  );
};
