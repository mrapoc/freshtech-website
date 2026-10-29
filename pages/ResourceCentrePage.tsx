import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SEO } from '../components/SEO';
import { Contact } from '../components/Contact';
import { blogPosts, caseStudies, faqCategories } from '../data/content';
import { industryGuides } from '../data/industryGuides';
import { isHeld } from '../data/editorialHolds';
import { BookOpen, HelpCircle, Briefcase, ArrowRight, Activity, FileText, Users, Award, TrendingUp, Shield, Zap, Star, Printer, CheckSquare, Monitor, Lock, Key, ShieldCheck, Laptop, BadgeCheck, RefreshCw, FileWarning, Wifi, Server, Globe, Mail, AlertTriangle, Cloud, Bot } from 'lucide-react';
import { BuyersGuideCta } from '../components/BuyersGuideCta';
import { SmartImage } from '../components/SmartImage';

// Learning paths for different user needs
const learningPaths = [
  {
    title: "New to IT Support?",
    desc: "Start here to understand what managed IT means for your business",
    icon: Users,
    color: "blue",
    steps: [
      { label: "Read: Managed IT Explained", link: "/services/managed-it-support" },
      { label: "Take: IT Health Check", link: "/it-health-check" },
      { label: "View: Pricing Calculator", link: "/pricing" },
    ]
  },
  {
    title: "Security Focused",
    desc: "Learn how to protect your business from cyber threats",
    icon: Shield,
    color: "red",
    steps: [
      { label: "Guide: Cyber Essentials", link: "/services/cyber-essentials" },
      { label: "Blog: Password Security Tips", link: "/blog/password-security-tips" },
      { label: "Compare: Business Premium", link: "/microsoft-business-premium" },
    ]
  },
  {
    title: "Switching Provider?",
    desc: "Everything you need to know about transitioning IT support",
    icon: TrendingUp,
    color: "green",
    steps: [
      { label: "Guide: Onboarding Process", link: "/onboarding" },
      { label: "Case Study: Smooth Transitions", link: "/case-studies" },
      { label: "Contact: Free Consultation", link: "/contact" },
    ]
  },
];

// Helper to check if a post date is in the future
const isFuturePost = (dateString: string): boolean => {
  const postDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return postDate > today;
};

export const ResourceCentrePage = () => {
  // Calculate resource stats (exclude scheduled posts)
  const publishedPosts = useMemo(() => blogPosts.filter(p => !isHeld(p.slug) && !isFuturePost(p.date)), []);
  const totalBlogPosts = publishedPosts.length;
  const totalCaseStudies = caseStudies.length;
  const totalFaqs = faqCategories.flatMap(cat => cat.items).length;

  // Sort blog posts by date descending (newest first)
  const latestPosts = useMemo(() => {
    return [...publishedPosts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2);
  }, [publishedPosts]);

  // Sort case studies by ID descending (assuming higher ID is newer) to get the latest one
  const spotlightStudy = useMemo(() => {
    if (caseStudies.length === 0) return null;
    return [...caseStudies].sort((a, b) => Number(b.id) - Number(a.id))[0];
  }, []);

  return (
    <div className="bg-white">
      <SEO title="Resource Centre" description="Guides, case studies, and FAQs to help your business master its technology. 10+ years of IT expertise in one place." />

      <PageHeader
        title="Resource Centre"
        subtitle="The Fresh Tech knowledge base. Guides, success stories, and answers to your burning questions."
        highlightText="Knowledge Hub"
      />

      {/* Stats Banner */}
      <section className="bg-neutral text-white py-10 border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <BookOpen size={24} className="text-highlight mx-auto mb-2" />
              <div className="text-4xl font-heading text-highlight mb-1">{totalBlogPosts}+</div>
              <div className="text-gray-300 text-sm">Blog Articles</div>
            </div>
            <div>
              <Briefcase size={24} className="text-highlight mx-auto mb-2" />
              <div className="text-4xl font-heading text-highlight mb-1">{totalCaseStudies}</div>
              <div className="text-gray-300 text-sm">Case Studies</div>
            </div>
            <div>
              <HelpCircle size={24} className="text-highlight mx-auto mb-2" />
              <div className="text-4xl font-heading text-highlight mb-1">{totalFaqs}+</div>
              <div className="text-gray-300 text-sm">FAQ Answers</div>
            </div>
            <div>
              <Award size={24} className="text-highlight mx-auto mb-2" />
              <div className="text-4xl font-heading text-highlight mb-1">10+</div>
              <div className="text-gray-300 text-sm">Years Expertise</div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl text-neutral mb-4">Where Should You Start?</h2>
            <p className="text-gray-600">Choose a learning path based on your goals</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {learningPaths.map((path, idx) => {
              const Icon = path.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-primary transition-colors">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                    path.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    path.color === 'red' ? 'bg-red-100 text-red-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    <Icon size={28} />
                  </div>
                  <h3 className="font-heading text-xl text-neutral mb-2">{path.title}</h3>
                  <p className="text-gray-600 text-sm mb-6">{path.desc}</p>

                  <div className="space-y-3">
                    {path.steps.map((step, sIdx) => (
                      <Link
                        key={sIdx}
                        to={step.link}
                        className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition-colors group"
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          path.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                          path.color === 'red' ? 'bg-red-100 text-red-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {sIdx + 1}
                        </span>
                        <span className="group-hover:underline">{step.label}</span>
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">

          {/* Main Grid Navigation */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
              {/* Blog Link */}
              <div className="bg-white border-2 border-gray-100 p-8 rounded-2xl shadow-lg hover:border-primary transition-all group">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                      <BookOpen size={28} />
                  </div>
                  <h3 className="font-heading text-2xl text-neutral mb-2">Latest News</h3>
                  <p className="text-sm text-gray-500 mb-1">{totalBlogPosts}+ articles</p>
                  <p className="text-gray-600 mb-6">Tips, tricks, and industry updates from our team.</p>
                  <Link to="/blog" className="font-bold text-primary flex items-center gap-2 hover:translate-x-1 transition-transform">
                      Read The Blog <ArrowRight size={18} />
                  </Link>
              </div>

              {/* Case Studies Link */}
              <div className="bg-white border-2 border-gray-100 p-8 rounded-2xl shadow-lg hover:border-accent transition-all group">
                  <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-6 group-hover:bg-accent group-hover:text-white transition-colors">
                      <Briefcase size={28} />
                  </div>
                  <h3 className="font-heading text-2xl text-neutral mb-2">Case Studies</h3>
                  <p className="text-sm text-gray-500 mb-1">{totalCaseStudies} success stories</p>
                  <p className="text-gray-600 mb-6">Real stories of how we've helped local businesses.</p>
                  <Link to="/case-studies" className="font-bold text-accent flex items-center gap-2 hover:translate-x-1 transition-transform">
                      View Success Stories <ArrowRight size={18} />
                  </Link>
              </div>

              {/* FAQ Link */}
              <div className="bg-white border-2 border-gray-100 p-8 rounded-2xl shadow-lg hover:border-neutral transition-all group">
                  <div className="w-14 h-14 bg-neutral/10 rounded-xl flex items-center justify-center text-neutral mb-6 group-hover:bg-neutral group-hover:text-white transition-colors">
                      <HelpCircle size={28} />
                  </div>
                  <h3 className="font-heading text-2xl text-neutral mb-2">FAQ</h3>
                  <p className="text-sm text-gray-500 mb-1">{totalFaqs}+ answers</p>
                  <p className="text-gray-600 mb-6">Quick answers to common questions about our support.</p>
                  <Link to="/faq" className="font-bold text-neutral flex items-center gap-2 hover:translate-x-1 transition-transform">
                      Get Answers <ArrowRight size={18} />
                  </Link>
              </div>

              {/* IT Health Check Link */}
              <div className="bg-white border-2 border-gray-100 p-8 rounded-2xl shadow-lg hover:border-green-500 transition-all group">
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6 group-hover:bg-green-500 group-hover:text-white transition-colors">
                      <Activity size={28} />
                  </div>
                  <h3 className="font-heading text-2xl text-neutral mb-2">IT Health Check</h3>
                  <p className="text-sm text-gray-500 mb-1">3-minute assessment</p>
                  <p className="text-gray-600 mb-6">Free assessment of your business technology.</p>
                  <Link to="/it-health-check" className="font-bold text-green-600 flex items-center gap-2 hover:translate-x-1 transition-transform">
                      Take The Quiz <ArrowRight size={18} />
                  </Link>
              </div>
          </div>

          {/* Essential Guides Section */}
          <div className="mb-20">
              <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="font-heading text-3xl text-neutral">Essential Guides</h2>
                    <p className="text-gray-500 text-sm mt-1">In-depth guides on critical IT topics every business should understand</p>
                  </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Cloud Backup Necessity Guide */}
                  <Link
                    to="/cloud-backup-necessity"
                    className="group relative bg-linear-to-br from-blue-50 via-white to-purple-50 p-8 rounded-2xl border-2 border-blue-200 hover:border-primary hover:shadow-xl transition-all overflow-hidden"
                  >
                      <div className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                        Featured
                      </div>
                      <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                              <Cloud size={28} />
                          </div>
                          <div>
                              <h4 className="font-heading text-xl text-neutral group-hover:text-primary transition-colors">Why Microsoft 365 & Google Workspace Need Backing Up</h4>
                              <p className="text-sm text-gray-500 mt-1">The cloud backup myth explained</p>
                          </div>
                      </div>
                      <p className="text-gray-600 mb-4">Microsoft and Google explicitly state they're not responsible for your data loss. This guide explains why independent backup is essential, with real ToS quotes and relatable scenarios.</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Microsoft 365</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Google Workspace</span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">OneDrive KFM</span>
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Intune</span>
                      </div>
                      <span className="text-primary font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Read the guide <ArrowRight size={14} />
                      </span>
                  </Link>

                  {/* Microsoft Business Premium Guide */}
                  <Link
                    to="/microsoft-business-premium"
                    className="group bg-linear-to-br from-orange-50 via-white to-amber-50 p-8 rounded-2xl border-2 border-orange-200 hover:border-accent hover:shadow-xl transition-all"
                  >
                      <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-accent group-hover:text-white transition-colors shrink-0">
                              <ShieldCheck size={28} />
                          </div>
                          <div>
                              <h4 className="font-heading text-xl text-neutral group-hover:text-accent transition-colors">Why Microsoft 365 Business Premium?</h4>
                              <p className="text-sm text-gray-500 mt-1">The complete security bundle explained</p>
                          </div>
                      </div>
                      <p className="text-gray-600 mb-4">Business Premium includes Intune, Defender, Conditional Access, and more. See how it compares to piecing together individual tools -and why it's our recommended licence.</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Intune</span>
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Defender</span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Conditional Access</span>
                      </div>
                      <span className="text-accent font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Compare options <ArrowRight size={14} />
                      </span>
                  </Link>

                  {/* AI Acceptable Use Policy Template */}
                  <Link
                    to="/ai-acceptable-use-policy"
                    className="group relative bg-linear-to-br from-green-50 via-white to-emerald-50 p-8 rounded-2xl border-2 border-green-200 hover:border-green-500 hover:shadow-xl transition-all overflow-hidden"
                  >
                      <div className="absolute top-4 right-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Free Template
                      </div>
                      <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors shrink-0">
                              <Bot size={28} />
                          </div>
                          <div>
                              <h4 className="font-heading text-xl text-neutral group-hover:text-green-600 transition-colors">AI Acceptable Use Policy</h4>
                              <p className="text-sm text-gray-500 mt-1">Ready-to-use policy template</p>
                          </div>
                      </div>
                      <p className="text-gray-600 mb-4">A comprehensive AI policy template covering data classification, approved tools, deepfakes, BYOD, and more. Copy it, print it, or save as PDF, completely free.</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Copy & Paste</span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Print-Friendly</span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">27 Sections</span>
                      </div>
                      <span className="text-green-600 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Get the template <ArrowRight size={14} />
                      </span>
                  </Link>
              </div>
          </div>

          {/* Industry Guides Section */}
          <div className="mb-20">
              <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="font-heading text-3xl text-neutral">Industry IT Guides</h2>
                    <p className="text-gray-500 text-sm mt-1">Free interactive checklists for your sector</p>
                  </div>
                  <Link to="/industries" className="text-primary font-bold hidden md:block hover:underline">View All Industries</Link>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(industryGuides).map(([slug, guide]) => (
                      <Link
                        key={slug}
                        to={`/guides/${slug}`}
                        className="group bg-linear-to-br from-primary/5 to-accent/5 p-6 rounded-xl border-2 border-gray-100 hover:border-primary hover:shadow-lg transition-all"
                      >
                          <div className="flex items-start justify-between mb-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                  <CheckSquare size={24} />
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Printer size={14} />
                                  Printable
                              </div>
                          </div>
                          <h4 className="font-heading text-lg text-neutral mb-2 group-hover:text-primary transition-colors">{guide.title}</h4>
                          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{guide.subtitle}</p>
                          <div className="flex items-center justify-between">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">{guide.industry}</span>
                              <span className="text-primary font-medium text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                  Open Guide <ArrowRight size={14} />
                              </span>
                          </div>
                      </Link>
                  ))}
              </div>
          </div>

          {/* Technology Explained Section */}
          <div className="mb-20">
              <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="font-heading text-3xl text-neutral">Technology Explained</h2>
                    <p className="text-gray-500 text-sm mt-1">Plain-English guides to the tech that protects your business</p>
                  </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { slug: 'rmm', title: 'What is RMM?', desc: 'How we monitor your systems 24/7 and fix issues before you notice them.', icon: Monitor, bgColor: 'bg-blue-100', textColor: 'text-blue-600', hoverBg: 'group-hover:bg-blue-600' },
                    { slug: 'edr-mdr', title: 'EDR & MDR Explained', desc: 'Why traditional antivirus isn\'t enough and how we go beyond it.', icon: Shield, bgColor: 'bg-red-100', textColor: 'text-red-600', hoverBg: 'group-hover:bg-red-600' },
                    { slug: 'application-control', title: 'Application Control', desc: 'How blocking unknown software stops ransomware in its tracks.', icon: Lock, bgColor: 'bg-purple-100', textColor: 'text-purple-600', hoverBg: 'group-hover:bg-purple-600' },
                    { slug: 'admin-rights', title: 'Why No Admin Rights?', desc: 'The security reason behind removing local admin - and how we make it painless.', icon: Key, bgColor: 'bg-amber-100', textColor: 'text-amber-600', hoverBg: 'group-hover:bg-amber-600' },
                    { slug: 'itdr', title: 'Identity Protection (ITDR)', desc: 'Protecting your Microsoft 365 accounts from hackers who log in, not break in.', icon: Users, bgColor: 'bg-green-100', textColor: 'text-green-600', hoverBg: 'group-hover:bg-green-600' },
                    { slug: 'conditional-access', title: 'Conditional Access', desc: 'Smart rules that control who can access your data and when.', icon: ShieldCheck, bgColor: 'bg-blue-100', textColor: 'text-blue-600', hoverBg: 'group-hover:bg-blue-600' },
                    { slug: 'intune-autopilot', title: 'Intune & Autopilot', desc: 'Modern device management that keeps laptops secure and easy to deploy.', icon: Laptop, bgColor: 'bg-indigo-100', textColor: 'text-indigo-600', hoverBg: 'group-hover:bg-indigo-600' },
                    { slug: 'ncsc', title: 'The NCSC', desc: 'UK\'s National Cyber Security Centre and their guidance for businesses.', icon: BadgeCheck, bgColor: 'bg-teal-100', textColor: 'text-teal-600', hoverBg: 'group-hover:bg-teal-600' },
                    { slug: 'patching', title: 'Why Patching Matters', desc: 'Understanding why keeping software updated is critical for security.', icon: RefreshCw, bgColor: 'bg-orange-100', textColor: 'text-orange-600', hoverBg: 'group-hover:bg-orange-600' },
                    { slug: 'end-of-life', title: 'End of Life Devices', desc: 'The hidden risks of running outdated Windows and what to do about it.', icon: FileWarning, bgColor: 'bg-red-100', textColor: 'text-red-600', hoverBg: 'group-hover:bg-red-600' },
                    { slug: 'business-networking', title: 'Business Networking', desc: 'From WiFi to cabling - what makes a reliable business network.', icon: Wifi, bgColor: 'bg-cyan-100', textColor: 'text-cyan-600', hoverBg: 'group-hover:bg-cyan-600' },
                    { slug: 'cloud-vs-onpremise', title: 'Cloud vs On-Premise', desc: 'Which is right for your business and what are the trade-offs?', icon: Server, bgColor: 'bg-violet-100', textColor: 'text-violet-600', hoverBg: 'group-hover:bg-violet-600' },
                    { slug: 'zero-trust', title: 'Zero Trust Security', desc: 'The modern security model that assumes breaches will happen.', icon: Globe, bgColor: 'bg-emerald-100', textColor: 'text-emerald-600', hoverBg: 'group-hover:bg-emerald-600' },
                    { slug: 'mfa', title: 'MFA Explained', desc: 'Why passwords alone aren\'t enough and how multi-factor authentication works.', icon: Key, bgColor: 'bg-green-100', textColor: 'text-green-600', hoverBg: 'group-hover:bg-green-600' },
                    { slug: 'phishing', title: 'Phishing Attacks', desc: 'How to spot email scams and protect your business from social engineering.', icon: Mail, bgColor: 'bg-red-100', textColor: 'text-red-600', hoverBg: 'group-hover:bg-red-600' },
                    { slug: 'vpn', title: 'Do I Need a VPN?', desc: 'When VPNs still matter, when they don\'t, and the modern alternatives.', icon: Lock, bgColor: 'bg-purple-100', textColor: 'text-purple-600', hoverBg: 'group-hover:bg-purple-600' },
                  ].map((page) => {
                    const Icon = page.icon;
                    return (
                      <Link
                        key={page.slug}
                        to={`/technology/${page.slug}`}
                        className="group bg-white p-6 rounded-xl border-2 border-gray-100 hover:border-primary hover:shadow-lg transition-all"
                      >
                          <div className={`w-12 h-12 ${page.bgColor} rounded-xl flex items-center justify-center ${page.textColor} mb-4 ${page.hoverBg} group-hover:text-white transition-colors`}>
                              <Icon size={24} />
                          </div>
                          <h4 className="font-heading text-lg text-neutral mb-2 group-hover:text-primary transition-colors">{page.title}</h4>
                          <p className="text-sm text-gray-500 mb-4">{page.desc}</p>
                          <span className="text-primary font-medium text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Explore <ArrowRight size={14} />
                          </span>
                      </Link>
                    );
                  })}
              </div>
          </div>

          {/* Crisis Help Guides */}
          <div className="mb-20">
              <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="font-heading text-3xl text-neutral">IT Crisis Help</h2>
                    <p className="text-gray-500 text-sm mt-1">Free step-by-step guides when things go wrong</p>
                  </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { slug: 'email-account-hacked', title: 'Email Hacked?', desc: 'Step-by-step guide to secure your account and prevent further damage.', icon: Mail, bgColor: 'bg-red-100', textColor: 'text-red-600', hoverBg: 'group-hover:bg-red-600' },
                    { slug: 'laptop-stolen-lost', title: 'Laptop Lost/Stolen?', desc: 'Immediate actions to protect your business data.', icon: Laptop, bgColor: 'bg-orange-100', textColor: 'text-orange-600', hoverBg: 'group-hover:bg-orange-600' },
                    { slug: 'business-email-compromise', title: 'Suspicious Payment Request?', desc: 'How to spot and respond to business email fraud.', icon: AlertTriangle, bgColor: 'bg-amber-100', textColor: 'text-amber-600', hoverBg: 'group-hover:bg-amber-600' },
                    { slug: 'data-breach-discovered', title: 'Data Breach?', desc: 'Your GDPR-compliant response checklist.', icon: Shield, bgColor: 'bg-purple-100', textColor: 'text-purple-600', hoverBg: 'group-hover:bg-purple-600' },
                  ].map((guide) => {
                    const Icon = guide.icon;
                    return (
                      <Link
                        key={guide.slug}
                        to={`/${guide.slug}`}
                        className="group bg-linear-to-br from-red-50 to-orange-50 p-6 rounded-xl border-2 border-red-100 hover:border-red-500 hover:shadow-lg transition-all"
                      >
                          <div className={`w-12 h-12 ${guide.bgColor} rounded-xl flex items-center justify-center ${guide.textColor} mb-4 ${guide.hoverBg} group-hover:text-white transition-colors`}>
                              <Icon size={24} />
                          </div>
                          <h4 className="font-heading text-lg text-neutral mb-2 group-hover:text-red-600 transition-colors">{guide.title}</h4>
                          <p className="text-sm text-gray-500 mb-4">{guide.desc}</p>
                          <span className="text-red-600 font-medium text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Get Help <ArrowRight size={14} />
                          </span>
                      </Link>
                    );
                  })}
              </div>
              <p className="text-center text-sm text-gray-500 mt-6">
                These guides are free for anyone to use - no sales pitch, just help when you need it most.
              </p>
          </div>

          {/* Featured Content Sections */}

          {/* Latest Posts Preview */}
          <div className="mb-20">
              <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="font-heading text-3xl text-neutral">Fresh From The Press</h2>
                    <p className="text-gray-500 text-sm mt-1">Latest insights from our team</p>
                  </div>
                  <Link to="/blog" className="text-primary font-bold hidden md:block hover:underline">View All Articles</Link>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                  {latestPosts.map((post) => (
                      <Link key={post.id} to={`/blog/${post.slug}`} className="group flex gap-4 items-start bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="w-32 h-24 rounded-lg overflow-hidden shrink-0 relative">
                              <SmartImage
                                src={post.image}
                                alt={post.title}
                                width={200}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                          </div>
                          <div>
                              <div className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">{post.date}</div>
                              <h4 className="font-heading text-lg text-neutral group-hover:text-primary transition-colors leading-tight mb-2">{post.title}</h4>
                              <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                          </div>
                      </Link>
                  ))}
              </div>
          </div>

          {/* Case Study Spotlight */}
          {spotlightStudy && (
            <div className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-200 mb-16">
                 <div className="grid md:grid-cols-2 gap-12 items-center">
                     <div>
                         <span className="text-accent font-bold text-sm uppercase tracking-wider mb-2 block">Spotlight Mission</span>
                         <h2 className="font-heading text-3xl md:text-4xl text-neutral mb-4">{spotlightStudy.title}</h2>
                         <p className="text-gray-600 mb-6">{spotlightStudy.challenge}</p>
                         <Link to={`/case-studies/${spotlightStudy.slug}`} className="inline-block bg-white border-2 border-neutral text-neutral px-6 py-3 rounded-lg font-bold hover:bg-neutral hover:text-white transition-colors">
                             Read Full Mission Report
                         </Link>
                     </div>
                     <div className="relative">
                         <div className="absolute inset-0 bg-accent/10 rounded-2xl transform rotate-3"></div>
                         <SmartImage
                            src={spotlightStudy.image}
                            alt={spotlightStudy.client}
                            width={800}
                            className="relative rounded-2xl shadow-xl border-4 border-white w-full"
                          />
                     </div>
                 </div>
            </div>
          )}

          {/* Quick Links Grid */}
          <section className="mb-16">
            <h3 className="font-heading text-2xl text-neutral mb-6 text-center">Quick Access</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/services" className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-primary/10 transition-colors group">
                <Zap size={20} className="text-primary" />
                <span className="font-medium text-sm group-hover:text-primary">Our Services</span>
              </Link>
              <Link to="/pricing" className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-primary/10 transition-colors group">
                <FileText size={20} className="text-primary" />
                <span className="font-medium text-sm group-hover:text-primary">Pricing</span>
              </Link>
              <Link to="/industries" className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-primary/10 transition-colors group">
                <Users size={20} className="text-primary" />
                <span className="font-medium text-sm group-hover:text-primary">Industries</span>
              </Link>
              <Link to="/about" className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-primary/10 transition-colors group">
                <Star size={20} className="text-primary" />
                <span className="font-medium text-sm group-hover:text-primary">About Us</span>
              </Link>
            </div>
          </section>

      </div>

      <BuyersGuideCta />
      <Contact />
    </div>
  );
};
