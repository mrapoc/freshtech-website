import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Contact } from '../components/Contact';
import { PageHeader } from '../components/PageHeader';
import {
  Monitor, Shield, Lock, Key, Users, ShieldCheck, Laptop, BadgeCheck,
  RefreshCw, FileWarning, Wifi, Server, Globe, Mail, MailCheck, ArrowRight, BookOpen
} from 'lucide-react';

// All technology explainer pages with their metadata
const techPages = [
  {
    slug: 'rmm',
    title: 'What is RMM?',
    desc: 'How we monitor your systems 24/7 and fix issues before you notice them.',
    icon: Monitor,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    hoverBg: 'group-hover:bg-blue-600',
    category: 'IT Management'
  },
  {
    slug: 'edr-mdr',
    title: 'EDR & MDR Explained',
    desc: 'Why traditional antivirus isn\'t enough and how we go beyond it.',
    icon: Shield,
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
    hoverBg: 'group-hover:bg-red-600',
    category: 'Cyber Security'
  },
  {
    slug: 'application-control',
    title: 'Application Control',
    desc: 'How blocking unknown software stops ransomware in its tracks.',
    icon: Lock,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    hoverBg: 'group-hover:bg-purple-600',
    category: 'Cyber Security'
  },
  {
    slug: 'admin-rights',
    title: 'Why No Admin Rights?',
    desc: 'The security reason behind removing local admin - and how we make it painless.',
    icon: Key,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
    hoverBg: 'group-hover:bg-amber-600',
    category: 'Cyber Security'
  },
  {
    slug: 'itdr',
    title: 'Identity Protection (ITDR)',
    desc: 'Protecting your Microsoft 365 accounts from hackers who log in, not break in.',
    icon: Users,
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    hoverBg: 'group-hover:bg-green-600',
    category: 'Cyber Security'
  },
  {
    slug: 'conditional-access',
    title: 'Conditional Access',
    desc: 'Smart rules that control who can access your data and when.',
    icon: ShieldCheck,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    hoverBg: 'group-hover:bg-blue-600',
    category: 'Microsoft 365'
  },
  {
    slug: 'intune-autopilot',
    title: 'Intune & Autopilot',
    desc: 'Modern device management that keeps laptops secure and easy to deploy.',
    icon: Laptop,
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600',
    hoverBg: 'group-hover:bg-indigo-600',
    category: 'Microsoft 365'
  },
  {
    slug: 'ncsc',
    title: 'The NCSC',
    desc: 'UK\'s National Cyber Security Centre and their guidance for businesses.',
    icon: BadgeCheck,
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-600',
    hoverBg: 'group-hover:bg-teal-600',
    category: 'Compliance'
  },
  {
    slug: 'patching',
    title: 'Why Patching Matters',
    desc: 'Understanding why keeping software updated is critical for security.',
    icon: RefreshCw,
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    hoverBg: 'group-hover:bg-orange-600',
    category: 'IT Management'
  },
  {
    slug: 'end-of-life',
    title: 'End of Life Devices',
    desc: 'The hidden risks of running outdated Windows and what to do about it.',
    icon: FileWarning,
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
    hoverBg: 'group-hover:bg-red-600',
    category: 'IT Management'
  },
  {
    slug: 'business-networking',
    title: 'Business Networking',
    desc: 'From WiFi to cabling - what makes a reliable business network.',
    icon: Wifi,
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-600',
    hoverBg: 'group-hover:bg-cyan-600',
    category: 'Infrastructure'
  },
  {
    slug: 'cloud-vs-onpremise',
    title: 'Cloud vs On-Premise',
    desc: 'Which is right for your business and what are the trade-offs?',
    icon: Server,
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-600',
    hoverBg: 'group-hover:bg-violet-600',
    category: 'Infrastructure'
  },
  {
    slug: 'zero-trust',
    title: 'Zero Trust Security',
    desc: 'The modern security model that assumes breaches will happen.',
    icon: Globe,
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
    hoverBg: 'group-hover:bg-emerald-600',
    category: 'Cyber Security'
  },
  {
    slug: 'mfa',
    title: 'MFA Explained',
    desc: 'Why passwords alone aren\'t enough and how multi-factor authentication works.',
    icon: Key,
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    hoverBg: 'group-hover:bg-green-600',
    category: 'Cyber Security'
  },
  {
    slug: 'phishing',
    title: 'Phishing Attacks',
    desc: 'How to spot email scams and protect your business from social engineering.',
    icon: Mail,
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
    hoverBg: 'group-hover:bg-red-600',
    category: 'Cyber Security'
  },
  {
    slug: 'email-authentication',
    title: 'SPF, DKIM & DMARC',
    desc: 'The three DNS records that stop criminals sending email as your business.',
    icon: MailCheck,
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-600',
    hoverBg: 'group-hover:bg-rose-600',
    category: 'Cyber Security'
  },
  {
    slug: 'vpn',
    title: 'VPN & Zero Trust Networking',
    desc: 'Do you still need a VPN? How modern alternatives like Zero Trust keep you secure.',
    icon: Lock,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    hoverBg: 'group-hover:bg-purple-600',
    category: 'Infrastructure'
  },
];

// Group pages by category
const categories = ['Cyber Security', 'Microsoft 365', 'IT Management', 'Infrastructure', 'Compliance'];

export const TechnologyLandingPage = () => {
  return (
    <>
      <SEO
        title="Technology Explained | Fresh Tech"
        description="Plain-English guides to the technology that protects your business. No jargon, no sales pitch - just clear explanations of what these tools do and why they matter."
        canonical="https://fresh-tech.uk/technology"
      />

      <PageHeader
        title="Technology Explained"
        subtitle="Plain-English guides to the technology that protects your business. No jargon, no sales pitch - just clear explanations of what these tools do and why they matter."
        highlightText="Knowledge Base"
      />

      {/* Introduction Section */}
      <section className="py-12 bg-white border-b">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-4">Why We Created This</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            IT is full of acronyms and technical terms. We believe you deserve to understand
            what you're paying for - and why it matters to your business. These guides explain
            each technology in plain English, focusing on business benefits and real-world risks.
          </p>
        </div>
      </section>

      {/* All Topics Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary mb-4">All Topics</h2>
          <p className="text-center text-gray-600 mb-12">Click any topic to learn more</p>

          {categories.map(category => {
            const categoryPages = techPages.filter(p => p.category === category);
            if (categoryPages.length === 0) return null;

            return (
              <div key={category} className="mb-12">
                <h3 className="text-xl font-bold text-primary mb-6 border-l-4 border-accent pl-4">{category}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryPages.map((page) => {
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
                          Read Guide <ArrowRight size={14} />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Have a question we haven't answered?</h2>
          <p className="text-gray-200 text-lg mb-8">
            We're always happy to explain technology in plain English. Get in touch.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="bg-accent text-neutral font-bold px-8 py-4 rounded-lg shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all"
            >
              Ask a Question
            </Link>
            <Link
              to="/resources"
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-lg transition-all"
            >
              Resource Centre
            </Link>
          </div>
        </div>
      </section>

      <Contact />
    </>
  );
};
