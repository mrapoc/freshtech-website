import React, { useState, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Contact } from '../components/Contact';
import {
  Printer, Download, CheckCircle2, Circle, Lock, Mail, ArrowRight,
  Shield, FileText, CheckSquare, Lightbulb,
  Phone, BookOpen, ChevronDown, ChevronUp
} from 'lucide-react';
import { industryGuides } from '../data/industryGuides';

interface ChecklistItem {
  id: string;
  text: string;
  priority: 'critical' | 'high' | 'medium';
  tip?: string;
}

interface _GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: string;
  checklist?: ChecklistItem[];
  locked?: boolean;
}

// Parse basic markdown formatting (bold, bullets, headers)
const parseMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // Parse bold text (**text**)
    const parseBold = (str: string): React.ReactNode[] => {
      const parts = str.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-bold text-neutral">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    // Handle bullet points
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return (
        <div key={lineIdx} className="flex gap-2 ml-4 my-1">
          <span className="text-primary">•</span>
          <span>{parseBold(line.slice(2))}</span>
        </div>
      );
    }

    // Handle numbered lists (1. 2. etc)
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      return (
        <div key={lineIdx} className="flex gap-2 ml-4 my-1">
          <span className="text-primary font-bold">{numberedMatch[1]}.</span>
          <span>{parseBold(numberedMatch[2])}</span>
        </div>
      );
    }

    // Handle headers
    if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
      return (
        <h4 key={lineIdx} className="font-bold text-neutral mt-4 mb-2">
          {line.slice(2, -2)}
        </h4>
      );
    }

    // Empty lines
    if (line.trim() === '') {
      return <div key={lineIdx} className="h-2" />;
    }

    // Regular paragraphs
    return <p key={lineIdx} className="my-1">{parseBold(line)}</p>;
  });
};

export const IndustryGuidePage: React.FC = () => {
  const { industry } = useParams<{ industry: string }>();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [email, setEmail] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_submitError, setSubmitError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const guide = industry ? industryGuides[industry] : null;

  // Check if previously unlocked
  React.useEffect(() => {
    const wasUnlocked = localStorage.getItem('guide-unlocked');
    if (wasUnlocked === 'true') {
      setUnlocked(true);
    }
  }, []);

  if (!guide) {
    return <Navigate to="/industries" replace />;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Trigger print dialog which allows saving as PDF
    window.print();
  };

  const toggleCheck = (itemId: string) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Submit to Netlify Forms - this sends an email notification
      const formData = new FormData();
      formData.append('form-name', 'guide-unlock');
      formData.append('email', email);
      formData.append('guide', guide?.title || industry || 'Unknown');
      formData.append('industry', guide?.industry || 'Unknown');
      formData.append('timestamp', new Date().toISOString());

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData as any).toString(),
      });

      if (response.ok) {
        setUnlocked(true);
        setShowEmailForm(false);
        // Store in localStorage so they don't need to re-enter
        localStorage.setItem('guide-unlocked', 'true');
        localStorage.setItem('guide-email', email);
      } else {
        throw new Error('Form submission failed');
      }
    } catch {
      // If Netlify form fails, still unlock for UX
      setUnlocked(true);
      setShowEmailForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalItems = guide.sections.reduce((acc, section) =>
    acc + (section.checklist?.length || 0), 0);
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Critical';
      case 'high': return 'High Priority';
      default: return 'Recommended';
    }
  };

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": guide.title,
    "description": guide.metaDesc,
    "author": {
      "@type": "Organization",
      "name": "Fresh Tech IT Support",
      "@id": "https://fresh-tech.uk/#organization",
      "url": "https://fresh-tech.uk"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Fresh Tech IT Support",
      "logo": {
        "@type": "ImageObject",
        "url": "https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png"
      }
    },
    "articleSection": "Industry Guides",
    "inLanguage": "en-GB",
    "isAccessibleForFree": true
  };

  return (
    <div className="bg-white">
      <SEO
        title={`${guide.title} | Free Guide`}
        description={guide.metaDesc}
        canonical={`/guides/${industry}`}
        schema={pageSchema}
      />

      {/* Print Styles - A4 Optimized */}
      <style>{`
        @media print {
          /* Page setup for A4 */
          @page {
            size: A4;
            margin: 20mm 15mm 25mm 15mm;
          }

          /* Hide web-only elements */
          .no-print,
          header, footer, nav,
          .sticky,
          [class*="Contact"],
          button:not(.print-keep),
          .cursor-pointer > button,
          a[href^="/"],
          a[href^="#"] {
            display: none !important;
          }

          /* Reset backgrounds and shadows for clean print */
          body {
            font-size: 10pt;
            line-height: 1.5;
            color: #1a1a1a !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          * {
            box-shadow: none !important;
          }

          /* Container resets */
          .container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Typography for print */
          h1 { font-size: 22pt !important; margin-bottom: 8pt !important; }
          h2 { font-size: 16pt !important; margin-bottom: 6pt !important; margin-top: 12pt !important; }
          h3 { font-size: 13pt !important; margin-bottom: 4pt !important; }
          h4 { font-size: 11pt !important; margin-bottom: 4pt !important; }
          p, li, div { font-size: 10pt !important; }

          /* Left align all content */
          .guide-content, h1, h2, h3, h4, p {
            text-align: left !important;
          }

          /* Section styling */
          .print-section {
            page-break-inside: avoid;
            margin-bottom: 16pt !important;
          }

          /* Force page break before major sections */
          .print-break {
            page-break-before: always;
            padding-top: 0 !important;
          }

          /* Keep checklists together */
          .checklist-container {
            page-break-inside: avoid;
          }

          /* Checklist items - ensure they don't break */
          .checklist-item {
            page-break-inside: avoid;
            margin-bottom: 8pt !important;
            padding: 8pt !important;
            border: 1pt solid #e5e5e5 !important;
            border-radius: 4pt !important;
          }

          /* Stats grid - keep together */
          .stats-grid {
            page-break-inside: avoid;
            display: flex !important;
            gap: 12pt !important;
            margin-bottom: 16pt !important;
          }

          .stats-grid > div {
            flex: 1 !important;
            padding: 12pt !important;
            border: 1pt solid #2B7AB1 !important;
            border-radius: 4pt !important;
            text-align: center !important;
          }

          /* CTA section - style for print */
          .cta-section {
            page-break-inside: avoid;
            border: 2pt solid #2B7AB1 !important;
            border-radius: 8pt !important;
            padding: 16pt !important;
            margin-top: 20pt !important;
            background: #f8fafc !important;
          }

          .cta-section h2 {
            color: #2B7AB1 !important;
          }

          .cta-section p {
            color: #4a5568 !important;
          }

          /* Priority badges */
          .priority-badge {
            font-size: 8pt !important;
            padding: 2pt 6pt !important;
            border-radius: 2pt !important;
          }

          /* Print header - shown only when printing */
          .print-header {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 12pt;
            margin-bottom: 16pt;
            border-bottom: 2pt solid #2B7AB1;
          }

          .print-header img {
            height: 32pt;
            width: auto;
          }

          .print-header-text {
            text-align: right;
            font-size: 9pt;
            color: #666;
          }

          /* Print footer - shown only when printing */
          .print-footer {
            display: block !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 8pt 15mm;
            border-top: 1pt solid #e5e5e5;
            font-size: 8pt;
            color: #666;
            background: white;
          }

          .print-footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          /* Section headers with icons */
          .section-header {
            display: flex !important;
            align-items: center !important;
            gap: 8pt !important;
            margin-bottom: 8pt !important;
            padding-bottom: 6pt !important;
            border-bottom: 1pt solid #e5e5e5 !important;
          }

          .section-header .icon-box {
            width: 28pt !important;
            height: 28pt !important;
            background: #2B7AB1 !important;
            border-radius: 4pt !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: white !important;
          }

          .section-header svg {
            width: 16pt !important;
            height: 16pt !important;
          }

          /* Intro paragraph */
          .intro-text {
            font-size: 11pt !important;
            line-height: 1.6 !important;
            color: #4a5568 !important;
            margin-bottom: 16pt !important;
            padding: 12pt !important;
            background: #f8fafc !important;
            border-left: 3pt solid #2B7AB1 !important;
          }

          /* Tip boxes */
          .tip-box {
            font-size: 9pt !important;
            color: #666 !important;
            padding-left: 16pt !important;
          }

          /* Links become plain text */
          a {
            color: inherit !important;
            text-decoration: none !important;
          }

          /* Hide expand/collapse indicators */
          [class*="Chevron"],
          .expand-collapse {
            display: none !important;
          }
        }

        @media screen {
          .print-header,
          .print-footer {
            display: none !important;
          }
        }
      `}</style>

      {/* Print Header - Only visible when printing */}
      <div className="print-header">
        <div>
          <img
            src="https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png"
            alt="Fresh Tech"
            width={55}
            height={40}
            loading="lazy"
            style={{ height: '40px' }}
          />
        </div>
        <div className="print-header-text">
          <div style={{ fontWeight: 'bold', color: '#2B7AB1' }}>{guide.title}</div>
          <div>fresh-tech.uk | 01584 517 234</div>
        </div>
      </div>

      {/* Print Footer - Only visible when printing */}
      <div className="print-footer">
        <div className="print-footer-content">
          <span>© Fresh Tech IT Support | hello@fresh-tech.uk</span>
          <span>Downloaded from fresh-tech.uk/guides/{industry}</span>
          <span>01584 517 234</span>
        </div>
      </div>

      {/* Hidden Netlify Form for detection */}
      <form name="guide-unlock" data-netlify="true" netlify-honeypot="bot-field" hidden>
        <input type="email" name="email" />
        <input type="text" name="guide" />
        <input type="text" name="industry" />
        <input type="text" name="timestamp" />
      </form>

      {/* Header */}
      <section className="bg-linear-to-br from-primary via-primary to-neutral pt-32 pb-16 text-white no-print">
        <div className="container mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: 'Industries', href: '/industries' },
              { label: guide.industry, href: `/industries/${industry}` },
              { label: 'Guide' }
            ]}
            variant="light"
          />

          <div className="max-w-4xl mt-8">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen size={24} className="text-highlight" />
              <span className="text-highlight font-medium uppercase tracking-wider text-sm">Free Industry Guide</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl mb-6">{guide.title}</h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl">{guide.subtitle}</p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                <Printer size={20} />
                Print Guide
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-white/10 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white/20 transition-colors"
              >
                <Download size={20} />
                Save as PDF
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Bar (Sticky) */}
      {totalItems > 0 && (
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 py-3 md:py-4 no-print">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between max-w-4xl gap-2">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="text-xs md:text-sm font-medium text-gray-600 whitespace-nowrap">
                  Progress: <span className="text-primary font-bold">{completedCount}/{totalItems}</span>
                </div>
                <div className="flex-1 md:w-48 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[100px]">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs md:text-sm font-bold text-primary">{progressPercent}%</span>
              </div>
              {progressPercent === 100 && (
                <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                  <CheckCircle2 size={18} />
                  Complete!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div ref={printRef} className="container mx-auto px-4 py-12">
        <div className="max-w-4xl">

          {/* Print-only title (since header is hidden) */}
          <div className="hidden print:block print-section mb-8">
            <div className="font-heading text-3xl text-neutral mb-2" role="heading" aria-level={1}>{guide.title}</div>
            <p className="text-gray-500">{guide.subtitle}</p>
          </div>

          {/* Introduction */}
          <div className="prose prose-lg max-w-none mb-12 print-section">
            <p className="text-xl text-gray-600 leading-relaxed intro-text">{guide.intro}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 print-section stats-grid">
            <div className="bg-primary/5 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{guide.stats.readTime}</div>
              <div className="text-sm text-gray-600">Read Time</div>
            </div>
            <div className="bg-primary/5 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{totalItems}</div>
              <div className="text-sm text-gray-600">Checklist Items</div>
            </div>
            <div className="bg-primary/5 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{guide.stats.lastUpdated}</div>
              <div className="text-sm text-gray-600">Last Updated</div>
            </div>
          </div>

          {/* Table of Contents - Screen */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-12 no-print">
            <h2 className="font-heading text-2xl text-neutral mb-6">What's In This Guide</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {guide.sections.map((section, idx) => {
                const Icon = section.icon;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-shadow group"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-neutral group-hover:text-primary transition-colors">
                        {idx + 1}. {section.title}
                      </div>
                      {section.locked && !unlocked && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Lock size={12} /> Premium content
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Table of Contents - Print Only */}
          <div className="hidden print:block mb-8 print-section">
            <h2 className="font-heading text-xl text-neutral mb-4 pb-2 border-b-2 border-primary">Contents</h2>
            <div className="grid grid-cols-2 gap-2">
              {guide.sections.map((section, idx) => (
                <div key={section.id} className="flex items-center gap-2 py-1">
                  <span className="font-bold text-primary">{idx + 1}.</span>
                  <span className="text-neutral">{section.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sections */}
          {guide.sections.map((section, sectionIdx) => {
            const Icon = section.icon;
            const isLocked = section.locked && !unlocked;
            const isExpanded = expandedSections[section.id] !== false;

            return (
              <div
                key={section.id}
                id={section.id}
                className={`mb-12 print-section ${sectionIdx > 0 ? 'print-break' : ''}`}
              >
                <div
                  className="flex items-center gap-4 mb-6 cursor-pointer group section-header"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white icon-box">
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-heading text-2xl text-neutral group-hover:text-primary transition-colors">
                      {section.title}
                    </h2>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg no-print expand-collapse">
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </button>
                </div>

                {isExpanded && (
                  <>
                    {isLocked ? (
                      <div className="bg-gray-100 rounded-2xl p-8 text-center">
                        <Lock size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="font-heading text-xl text-neutral mb-2">Premium Content</h3>
                        <p className="text-gray-600 mb-6">
                          Enter your email to unlock this section and receive future industry insights.
                        </p>

                        {showEmailForm ? (
                          <form onSubmit={handleUnlock} className="max-w-md mx-auto">
                            <input type="hidden" name="form-name" value="guide-unlock" />
                            <input type="hidden" name="bot-field" />
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                              />
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                {isSubmitting ? 'Unlocking...' : 'Unlock'}
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              We'll send you the guide and occasional IT tips. Unsubscribe anytime.
                            </p>
                          </form>
                        ) : (
                          <button
                            onClick={() => setShowEmailForm(true)}
                            className="bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                          >
                            <Mail size={20} />
                            Unlock Free Content
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="guide-content text-gray-600 leading-relaxed mb-8 text-left">
                          {parseMarkdown(section.content)}
                        </div>

                        {/* Checklist */}
                        {section.checklist && section.checklist.length > 0 && (
                          <div className="bg-gray-50 rounded-2xl p-6 checklist-container">
                            <h3 className="font-heading text-lg text-neutral mb-4 flex items-center gap-2">
                              <CheckSquare size={20} className="text-primary" />
                              Action Checklist
                            </h3>
                            <div className="space-y-3">
                              {section.checklist.map((item) => (
                                <div
                                  key={item.id}
                                  className={`flex items-start gap-3 p-4 bg-white rounded-xl border-2 transition-all cursor-pointer checklist-item ${
                                    checkedItems[item.id]
                                      ? 'border-green-300 bg-green-50'
                                      : 'border-gray-200 hover:border-primary/30'
                                  }`}
                                  onClick={() => toggleCheck(item.id)}
                                >
                                  <div className="mt-0.5 no-print">
                                    {checkedItems[item.id] ? (
                                      <CheckCircle2 size={24} className="text-green-600" />
                                    ) : (
                                      <Circle size={24} className="text-gray-300" />
                                    )}
                                  </div>
                                  {/* Print-friendly checkbox */}
                                  <div className="hidden print:block mt-0.5">
                                    <div className="w-4 h-4 border-2 border-gray-400 rounded-sm"></div>
                                  </div>
                                  <div className="flex-1">
                                    <div className={`font-medium ${checkedItems[item.id] ? 'line-through text-gray-500' : 'text-neutral'} print:no-underline print:text-neutral`}>
                                      {item.text}
                                    </div>
                                    {item.tip && (
                                      <div className="text-sm text-gray-500 mt-1 flex items-start gap-1 tip-box">
                                        <Lightbulb size={14} className="mt-0.5 text-yellow-500 no-print" />
                                        <span className="hidden print:inline">💡 </span>
                                        {item.tip}
                                      </div>
                                    )}
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full border priority-badge ${getPriorityColor(item.priority)}`}>
                                    {getPriorityLabel(item.priority)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* Next Steps CTA */}
          <div className="bg-linear-to-br from-primary to-neutral rounded-2xl p-8 text-white text-center print-section cta-section print:bg-none">
            <h2 className="font-heading text-3xl mb-4 print:text-primary">Ready to Implement?</h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto print:text-gray-600">
              This guide gives you the knowledge. We provide the expertise to make it happen.
              Book a free consultation to discuss your {guide.industry.toLowerCase()} IT needs.
            </p>
            <div className="flex flex-wrap justify-center gap-4 no-print">
              <Link
                to="/contact"
                className="bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
              >
                <Phone size={20} />
                Book Free Consultation
              </Link>
              <Link
                to="/it-health-check"
                className="bg-white/10 border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white/20 transition-colors inline-flex items-center gap-2"
              >
                <FileText size={20} />
                Take IT Health Check
              </Link>
            </div>
            {/* Print-only contact info */}
            <div className="hidden print:block text-center mt-4 text-gray-700">
              <p className="font-bold">Contact Fresh Tech for a free consultation:</p>
              <p>📞 01584 517 234 | ✉️ hello@fresh-tech.uk | 🌐 fresh-tech.uk</p>
            </div>
          </div>

          {/* Related Links */}
          <div className="mt-12 pt-12 border-t border-gray-200 no-print">
            <h3 className="font-heading text-xl text-neutral mb-6">Related Resources</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Link
                to={`/industries/${industry}`}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ArrowRight size={20} className="text-primary" />
                <span className="font-medium text-neutral">{guide.industry} IT Services</span>
              </Link>
              <Link
                to="/services/cyber-essentials"
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Shield size={20} className="text-primary" />
                <span className="font-medium text-neutral">Cyber Essentials</span>
              </Link>
              <Link
                to="/pricing"
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <FileText size={20} className="text-primary" />
                <span className="font-medium text-neutral">View Pricing</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Contact />
    </div>
  );
};

export default IndustryGuidePage;
