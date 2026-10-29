import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from '../data/content';
import { Calendar, Eye, EyeOff, Copy, Check, ExternalLink, Lock, Rss } from 'lucide-react';
import { SmartImage } from '../components/SmartImage';
import { SEO } from '../components/SEO';

// Auth token stored in localStorage — validated server-side via Netlify function
const STORAGE_KEY = 'ft_scheduled_token';

// Netlify function endpoint for server-side password verification
const AUTH_ENDPOINT = '/.netlify/functions/auth-scheduled';

// Helper to check if a post date is in the future
const isFuturePost = (dateString: string): boolean => {
  const postDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return postDate > today;
};

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Days until publish
const daysUntil = (dateString: string): number => {
  const postDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  postDate.setHours(0, 0, 0, 0);
  return Math.ceil((postDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// Component for copy button
const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-sm transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
      {copied ? 'Copied!' : label}
    </button>
  );
};

export const ScheduledPostsPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Verify existing token on mount (server-side validation)
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      setIsVerifying(false);
      return;
    }
    fetch(AUTH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => {
        // Network error — clear stale token
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setIsVerifying(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem(STORAGE_KEY, data.token);
        setIsAuthenticated(true);
      } else {
        setError(data.error || 'Incorrect password');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Get all posts sorted by date
  const allPosts = useMemo(() => {
    return [...blogPosts].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB; // Ascending for scheduled view
    });
  }, []);

  // Separate scheduled and published posts
  const scheduledPosts = useMemo(() => {
    return allPosts.filter(post => isFuturePost(post.date));
  }, [allPosts]);

  const recentlyPublished = useMemo(() => {
    return allPosts
      .filter(post => !isFuturePost(post.date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [allPosts]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://fresh-tech.uk';

  // Loading state while verifying existing token
  if (isVerifying) {
    return (
      <>
        <SEO title="Content Calendar" noIndex={true} />
        <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
        </div>
      </>
    );
  }

  // Password gate
  if (!isAuthenticated) {
    return (
      <>
        <SEO title="Content Calendar" noIndex={true} />
        <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="text-yellow-400" size={28} />
              <h1 className="font-heading text-2xl">Content Calendar</h1>
            </div>
            <p className="text-gray-400 mb-6 text-sm">
              This page is for internal use only. Enter the password to access scheduled posts.
            </p>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-4 text-white placeholder-gray-400 focus:outline-hidden focus:border-yellow-400 focus-visible:ring-2 focus-visible:ring-yellow-400"
                autoFocus
              />
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <button
                type="submit"
                className="w-full bg-yellow-400 text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-300 transition-colors"
              >
                Access Calendar
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Content Calendar" noIndex={true} />
      <div className="bg-gray-900 min-h-screen text-white">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Calendar className="text-yellow-400" size={28} />
                <h1 className="font-heading text-3xl">Content Calendar</h1>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="/rss.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300"
                >
                  <Rss size={16} />
                  RSS Feed
                </a>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          <p className="text-gray-400">
            Preview and queue scheduled posts for social media. URLs are live but hidden from the blog listing.
          </p>
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <EyeOff size={16} className="text-yellow-400" />
              <span><strong>{scheduledPosts.length}</strong> scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-green-400" />
              <span><strong>{blogPosts.length - scheduledPosts.length}</strong> published</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Scheduled Posts */}
        <section className="mb-12">
          <h2 className="font-heading text-2xl mb-6 flex items-center gap-2">
            <EyeOff className="text-yellow-400" size={24} />
            Scheduled Posts
            <span className="text-sm font-normal text-gray-400 ml-2">
              (visible via direct URL only)
            </span>
          </h2>

          {scheduledPosts.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>No scheduled posts. All posts are currently published.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledPosts.map((post) => {
                const days = daysUntil(post.date);
                const postUrl = `${baseUrl}/blog/${post.slug}`;

                return (
                  <div
                    key={post.id}
                    className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-400/50 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row">
                      {/* Image */}
                      <div className="lg:w-48 h-32 lg:h-auto shrink-0">
                        <SmartImage
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="grow p-6">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          {/* Publish date badge */}
                          <span className="inline-flex items-center gap-1 bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">
                            <Calendar size={14} />
                            {formatDate(post.date)}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {days === 1 ? 'Tomorrow' : `In ${days} days`}
                          </span>
                        </div>

                        <h3 className="font-heading text-xl mb-2">
                          <Link
                            to={`/blog/${post.slug}`}
                            className="hover:text-yellow-400 transition-colors"
                          >
                            {post.title}
                          </Link>
                        </h3>

                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags?.map(tag => (
                            <span
                              key={tag}
                              className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Social Media Queue Tools */}
                        <div className="bg-gray-900/50 rounded-lg p-4 space-y-3">
                          <div className="text-xs text-gray-500 uppercase font-bold">
                            Queue to Social Media (Publer)
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <CopyButton text={postUrl} label="URL" />
                            <CopyButton text={post.title} label="Title" />
                            <CopyButton text={post.excerpt} label="Excerpt" />
                            <CopyButton
                              text={`${post.title}\n\n${post.excerpt}\n\n${postUrl}`}
                              label="Full Post"
                            />
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="shrink-0">Preview URL:</span>
                            <code className="bg-gray-800 px-2 py-1 rounded-sm text-yellow-400 truncate grow">
                              {postUrl}
                            </code>
                            <a
                              href={postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-yellow-400 hover:text-yellow-300 shrink-0"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>

                          <div className="text-xs text-gray-500">
                            <strong>Featured Image:</strong>{' '}
                            <code className="text-gray-400">{post.image}</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recently Published */}
        <section>
          <h2 className="font-heading text-xl mb-4 flex items-center gap-2">
            <Eye className="text-green-400" size={20} />
            Recently Published
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentlyPublished.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-green-400/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
                  <Check size={14} />
                  {post.date}
                </div>
                <h3 className="font-bold text-sm mb-1 line-clamp-2">{post.title}</h3>
                <p className="text-gray-400 text-xs line-clamp-2">{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Image Collection System */}
        <section className="mt-12 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="font-heading text-lg mb-4 flex items-center gap-2">
            📸 Blog Image Collection
          </h3>
          <p className="text-sm text-gray-300 mb-4">
            Blog posts automatically get images based on their tags. Each category has a collection of images that rotate for variety.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {[
              { cat: 'security', tags: 'Security, Cyber Essentials, Passwords', count: 3 },
              { cat: 'backup', tags: 'Backup, Disaster Recovery', count: 2 },
              { cat: 'microsoft365', tags: 'Microsoft 365, Productivity', count: 2 },
              { cat: 'hardware', tags: 'Hardware, Windows', count: 2 },
              { cat: 'itSupport', tags: 'IT Support', count: 2 },
              { cat: 'business', tags: 'Strategy, Business, Cost Saving', count: 2 },
              { cat: 'remoteWork', tags: 'Remote Work, Cloud, Holiday', count: 2 },
              { cat: 'training', tags: 'Training', count: 2 },
              { cat: 'compliance', tags: 'GDPR, Compliance', count: 2 },
              { cat: 'ai', tags: 'AI', count: 2 },
              { cat: 'christmas', tags: 'Christmas', count: 1, note: 'ready' },
              { cat: 'easter', tags: 'Easter', count: 1, note: 'needs image' },
              { cat: 'newYear', tags: 'New Year', count: 1, note: 'needs image' },
              { cat: 'summer', tags: 'Summer', count: 1, note: 'needs image' },
              { cat: 'veterinary', tags: 'Veterinary', count: 1 },
            ].map(({ cat, tags, count, note }) => (
              <div key={cat} className={`bg-gray-900/50 rounded-lg p-3 ${note === 'needs image' ? 'border border-yellow-500/30' : ''}`}>
                <div className="font-mono text-yellow-400 text-sm mb-1">{cat}</div>
                <div className="text-xs text-gray-400">{tags}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {count} image{count > 1 ? 's' : ''}
                  {note === 'needs image' && <span className="text-yellow-400 ml-2">(placeholder)</span>}
                  {note === 'ready' && <span className="text-green-400 ml-2">✓</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
            <h4 className="font-bold text-blue-400 text-sm mb-2">Adding More Images</h4>
            <p className="text-sm text-gray-300">
              To add more images to a category, upload to Cloudinary and add the URL to the <code className="bg-gray-700 px-1 rounded-sm">data/blogImages.ts</code> file in the appropriate category array.
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="font-bold text-yellow-400 text-sm mb-2">Need a New Category?</h4>
            <p className="text-sm text-gray-300">
              If you're creating posts with tags that don't fit existing categories, let me know and I'll create a new image collection for that category.
            </p>
          </div>
        </section>

        {/* Cloudinary Image Upload Checklist */}
        <section className="mt-8 bg-gray-800 rounded-xl p-6 border border-yellow-500/30">
          <h3 className="font-heading text-lg mb-4 flex items-center gap-2">
            📋 Cloudinary Image Upload Checklist
          </h3>
          <p className="text-sm text-gray-300 mb-2">
            Upload images to Cloudinary with these <strong>exact filenames</strong>. The system uses Unsplash as fallback until uploaded.
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Cloudinary URL format: <code className="bg-gray-700 px-1 rounded-sm">https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/FILENAME.jpg</code>
          </p>

          <div className="space-y-6">
            {/* Priority: Seasonal */}
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="text-sm font-bold text-red-400 mb-2">🔴 HIGH PRIORITY - Seasonal (All 4 needed per category)</h4>
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-yellow-400 mb-2">Easter</div>
                  <ul className="text-gray-400 space-y-1 font-mono">
                    <li className="flex items-center gap-2">❌ easter-spring-office.jpg</li>
                    <li className="flex items-center gap-2">❌ spring-business-renewal.jpg</li>
                    <li className="flex items-center gap-2">❌ easter-holiday-technology.jpg</li>
                    <li className="flex items-center gap-2">❌ spring-cleaning-it-refresh.jpg</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-yellow-400 mb-2">New Year</div>
                  <ul className="text-gray-400 space-y-1 font-mono">
                    <li className="flex items-center gap-2">❌ new-year-business-planning.jpg</li>
                    <li className="flex items-center gap-2">❌ fresh-start-technology-upgrade.jpg</li>
                    <li className="flex items-center gap-2">❌ annual-it-strategy-review.jpg</li>
                    <li className="flex items-center gap-2">❌ january-business-goals.jpg</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-yellow-400 mb-2">Summer</div>
                  <ul className="text-gray-400 space-y-1 font-mono">
                    <li className="flex items-center gap-2">❌ summer-holiday-it-support.jpg</li>
                    <li className="flex items-center gap-2">❌ vacation-remote-access.jpg</li>
                    <li className="flex items-center gap-2">❌ summer-office-productivity.jpg</li>
                    <li className="flex items-center gap-2">❌ seasonal-business-continuity.jpg</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-yellow-400 mb-2">Christmas</div>
                  <ul className="text-gray-400 space-y-1 font-mono">
                    <li className="flex items-center gap-2">✅ christmas_2025_blog_post.jpg</li>
                    <li className="flex items-center gap-2">❌ holiday-business-season.jpg</li>
                    <li className="flex items-center gap-2">❌ festive-workplace-decorations.jpg</li>
                    <li className="flex items-center gap-2">❌ year-end-it-review.jpg</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Medium Priority: Core Categories */}
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="text-sm font-bold text-orange-400 mb-2">🟠 MEDIUM - Core Blog Categories (2 more each)</h4>
              <div className="grid md:grid-cols-3 gap-3 text-xs">
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-blue-400 mb-1">Security (need 1)</div>
                  <ul className="text-gray-400 font-mono text-[10px]">
                    <li>❌ password-security-authentication.jpg</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-blue-400 mb-1">Backup (need 2)</div>
                  <ul className="text-gray-400 font-mono text-[10px]">
                    <li>❌ business-continuity-planning.jpg</li>
                    <li>❌ automated-backup-solutions.jpg</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-blue-400 mb-1">Microsoft 365 (need 2)</div>
                  <ul className="text-gray-400 font-mono text-[10px]">
                    <li>❌ teams-communication-platform.jpg</li>
                    <li>❌ sharepoint-document-management.jpg</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-blue-400 mb-1">Hardware (need 2)</div>
                  <ul className="text-gray-400 font-mono text-[10px]">
                    <li>❌ network-equipment-setup.jpg</li>
                    <li>❌ computer-upgrade-maintenance.jpg</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-blue-400 mb-1">IT Support (need 2)</div>
                  <ul className="text-gray-400 font-mono text-[10px]">
                    <li>❌ remote-it-assistance.jpg</li>
                    <li>❌ managed-it-services.jpg</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-blue-400 mb-1">Business (need 2)</div>
                  <ul className="text-gray-400 font-mono text-[10px]">
                    <li>❌ enterprise-solutions-planning.jpg</li>
                    <li>❌ digital-transformation-office.jpg</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-blue-400 mb-1">Remote Work (need 2)</div>
                  <ul className="text-gray-400 font-mono text-[10px]">
                    <li>❌ video-conferencing-setup.jpg</li>
                    <li>❌ mobile-workforce-solutions.jpg</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-blue-400 mb-1">Training (need 2)</div>
                  <ul className="text-gray-400 font-mono text-[10px]">
                    <li>❌ security-workshop-presentation.jpg</li>
                    <li>❌ digital-skills-development.jpg</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-blue-400 mb-1">Compliance (need 2)</div>
                  <ul className="text-gray-400 font-mono text-[10px]">
                    <li>❌ compliance-audit-checklist.jpg</li>
                    <li>❌ regulatory-standards-certificate.jpg</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-blue-400 mb-1">AI (need 2)</div>
                  <ul className="text-gray-400 font-mono text-[10px]">
                    <li>❌ machine-learning-technology.jpg</li>
                    <li>❌ copilot-ai-assistant.jpg</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-blue-400 mb-1">Veterinary (need 3)</div>
                  <ul className="text-gray-400 font-mono text-[10px]">
                    <li>❌ animal-clinic-technology.jpg</li>
                    <li>❌ vet-surgery-network.jpg</li>
                    <li>❌ veterinary-software-systems.jpg</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="font-bold text-blue-400 mb-1">Default (need 3)</div>
                  <ul className="text-gray-400 font-mono text-[10px]">
                    <li>❌ business-technology-solutions.jpg</li>
                    <li>❌ professional-it-services.jpg</li>
                    <li>❌ modern-office-technology.jpg</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Other assets */}
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="text-sm font-bold text-green-400 mb-2">🟢 LOW PRIORITY - Other Site Assets</h4>
              <div className="grid md:grid-cols-2 gap-4 text-xs text-gray-400">
                <div>
                  <strong className="text-gray-300">Case Studies (5)</strong>
                  <p className="text-gray-500">Accountancy, Agriculture, Architecture, Charity, Education</p>
                </div>
                <div>
                  <strong className="text-gray-300">Industry Pages (8)</strong>
                  <p className="text-gray-500">Various industry hero images</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="font-bold text-blue-400 text-sm mb-2">Quick Upload Guide</h4>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal ml-4">
              <li>Find a suitable image (1200x630px recommended for social sharing)</li>
              <li>Rename the file to match the exact filename shown above</li>
              <li>Upload to Cloudinary (it will auto-optimise with f_auto,q_auto)</li>
              <li>Let me know when done so I can update the code to use Cloudinary URLs</li>
            </ol>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Total pending: ~50 images | Currently using Unsplash fallbacks (works fine, just slower & less branded)
          </div>
        </section>

        {/* Tips */}
        <section className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="font-heading text-lg mb-4">How This Works</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">1.</span>
              Posts with future dates are hidden from the public blog listing but accessible via direct URL.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">2.</span>
              Copy the URL, title, and excerpt to manually queue posts in Publer for their publish date.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">3.</span>
              On the publish date, posts automatically appear in the main blog listing and RSS feed.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">4.</span>
              Social media preview (OG tags) will pull the featured image and excerpt automatically.
            </li>
          </ul>

          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">
              <Rss size={16} />
              Publer RSS Auto-Scheduling
            </h4>
            <p className="text-sm text-gray-300 mb-2">
              The RSS feed at <code className="bg-gray-700 px-1 rounded-sm">/rss.xml</code> contains <strong>only scheduled (future) posts</strong> - existing posts are excluded to prevent Publer from posting them all at once.
            </p>
            <ul className="text-sm text-gray-400 space-y-1 ml-4 list-disc">
              <li>Only future-dated posts appear in the feed</li>
              <li>Publer auto-schedules based on the <code className="bg-gray-700 px-1 rounded-sm">pubDate</code> value</li>
              <li>Posts are set to publish at <strong>9:00 AM UTC</strong> by default</li>
              <li>Connect the RSS feed to Publer once - it picks up new scheduled posts automatically</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
    </>
  );
};
