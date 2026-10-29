import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Contact } from '../components/Contact';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  CheckCircle, Clock, Users, Phone, FileText,
  ArrowRight, HelpCircle, Zap, Lock, RefreshCw, Calendar,
  Server, Key, ClipboardCheck
} from 'lucide-react';

// Common concerns and answers
const concerns = [
  {
    question: "Will there be downtime during the switch?",
    answer: "No. We run both systems in parallel during handover. Your team won't notice a thing - they'll just start getting faster support.",
    icon: Clock
  },
  {
    question: "What if our current provider won't cooperate?",
    answer: "We've dealt with difficult handovers before. We know how to obtain passwords, documentation, and access without their help if necessary. It's rare, but we're prepared.",
    icon: Lock
  },
  {
    question: "How long does the transition take?",
    answer: "Typically 2-4 weeks from signing to full handover. Smaller businesses can be faster. We never rush - we'd rather do it right than do it fast.",
    icon: Calendar
  },
  {
    question: "What do you need from us?",
    answer: "Just access to your Microsoft 365 admin portal (or we can help get it), a list of your devices, and 30 minutes for a kickoff call. We handle the rest.",
    icon: ClipboardCheck
  },
  {
    question: "What about our existing contracts?",
    answer: "We'll review your current agreements and advise on the best time to switch. We can often work around notice periods by running in parallel.",
    icon: FileText
  },
  {
    question: "Will you understand our industry?",
    answer: "We specialise in Manufacturing, Legal, Engineering, and Healthcare. Check our Industries page - if you're in one of these sectors, we already speak your language.",
    icon: Users
  }
];

// Onboarding steps
const steps = [
  {
    number: "1",
    title: "Discovery Call",
    desc: "A 30-minute video call to understand your current setup, pain points, and goals. No sales pressure - just fact-finding.",
    duration: "Day 1",
    icon: Phone
  },
  {
    number: "2",
    title: "Technical Audit",
    desc: "We remotely audit your systems (with permission) to document everything. We identify risks, opportunities, and create a transition plan.",
    duration: "Days 2-5",
    icon: Server
  },
  {
    number: "3",
    title: "Proposal & Agreement",
    desc: "A clear, jargon-free proposal with fixed monthly pricing. No hidden fees. You'll know exactly what you're paying before signing.",
    duration: "Day 6-7",
    icon: FileText
  },
  {
    number: "4",
    title: "Credential Handover",
    desc: "We contact your old provider (or help you do it) to obtain all passwords, documentation, and admin access. This is often the trickiest part - we handle it.",
    duration: "Days 8-14",
    icon: Key
  },
  {
    number: "5",
    title: "System Setup",
    desc: "We install our monitoring tools, configure your backups, set up your helpdesk access, and deploy security policies. All in the background.",
    duration: "Days 15-21",
    icon: RefreshCw
  },
  {
    number: "6",
    title: "Go Live & Training",
    desc: "Your team gets a quick orientation on how to contact us. We're now your IT department. Old provider access is revoked securely.",
    duration: "Day 22+",
    icon: Zap
  }
];

// What we take over
const takeoverItems = [
  "Microsoft 365 / Google Workspace administration",
  "Domain name management (DNS)",
  "Server and network monitoring",
  "Backup management and testing",
  "Antivirus and security tools",
  "Hardware warranty tracking",
  "Software license management",
  "User onboarding/offboarding",
  "Password management systems",
  "Printer and peripheral support"
];

export const OnboardingPage: React.FC = () => {
  const breadcrumbItems = [
    { label: 'Resources', href: '/resources' },
    { label: 'Onboarding Process' }
  ];

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Switch IT Providers",
    "description": "A step-by-step guide to transitioning your business IT support to Fresh Tech with zero downtime.",
    "step": steps.map((step, idx) => ({
      "@type": "HowToStep",
      "position": idx + 1,
      "name": step.title,
      "text": step.desc
    }))
  };

  return (
    <div className="bg-white">
      <SEO
        title="Switching IT Provider? Here's How It Works"
        description="Worried about switching IT providers? Our proven onboarding process ensures zero downtime. See exactly what happens from day 1."
        schema={pageSchema}
        breadcrumbs={breadcrumbItems.map(item => ({
          name: item.label,
          item: item.href || '/onboarding'
        }))}
      />

      {/* Hero */}
      <div className="bg-neutral text-white pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/20 z-0"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <Breadcrumbs
            items={breadcrumbItems}
            variant="light"
            className="mb-6 justify-center [&_ol]:justify-center"
          />
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl mb-6">
            Switching Providers?<br />
            <span className="text-highlight">Here's How It Works</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Worried about the hassle of changing IT support? We've done this dozens of times.
            Here's exactly what happens - no surprises, no downtime, no drama.
          </p>
        </div>
      </div>

      {/* Trust Banner */}
      <section className="bg-primary py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-white text-center">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span className="font-medium">Zero Downtime Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span className="font-medium">We Handle Your Old Provider</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span className="font-medium">Fixed Monthly Pricing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Common Concerns */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl text-neutral mb-4">
              Your Concerns, Answered
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We know switching IT providers feels risky. Here are the questions everyone asks - and honest answers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {concerns.map((concern, idx) => {
              const Icon = concern.icon;
              return (
                <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral mb-2">{concern.question}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{concern.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Steps */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl text-neutral mb-4">
              The Onboarding Timeline
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From first call to full support in around 3 weeks. Here's what happens at each stage.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isLast = idx === steps.length - 1;
              return (
                <div key={idx} className="flex gap-6 mb-8">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-heading text-xl shrink-0">
                      {step.number}
                    </div>
                    {!isLast && (
                      <div className="w-0.5 bg-primary/20 grow mt-2"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="bg-gray-50 rounded-xl p-6 grow mb-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <Icon size={20} className="text-primary" />
                        <h3 className="font-heading text-xl text-neutral">{step.title}</h3>
                      </div>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full shrink-0">
                        {step.duration}
                      </span>
                    </div>
                    <p className="text-gray-600">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What We Take Over */}
      <section className="py-20 bg-neutral text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl mb-4">What We Take Over</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              When you switch to Fresh Tech, we become your complete IT department. Here's everything we manage:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {takeoverItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-lg">
                <CheckCircle size={18} className="text-highlight shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Now CTA */}
      <section className="py-20 bg-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <HelpCircle size={48} className="text-accent mx-auto mb-6" />
            <h2 className="font-heading text-3xl md:text-4xl text-neutral mb-6">
              Still Putting Up With Poor IT Support?
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Every week you wait is another week of slow responses, unresolved issues, and security risks.
              The switch is easier than you think - and we'll prove it with a free, no-obligation discovery call.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-accent text-neutral px-8 py-4 rounded-lg font-bold shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all"
              >
                Book Your Free Discovery Call
                <ArrowRight size={18} />
              </Link>
              <a
                href="tel:+441584517234"
                className="inline-flex items-center gap-2 bg-white text-neutral px-8 py-4 rounded-lg font-bold border-2 border-gray-200 hover:border-primary hover:text-primary transition-colors"
              >
                <Phone size={18} />
                01584 517 234
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Schema Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-2xl text-neutral mb-8 text-center">Quick Answers</h2>

            <div className="space-y-4">
              <details className="bg-gray-50 rounded-xl p-6 group">
                <summary className="font-bold text-neutral cursor-pointer flex items-center justify-between">
                  What if we're locked into a contract with our current provider?
                  <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-600 mt-4">
                  We can start the onboarding process before your contract ends. We'll run in parallel,
                  so you're fully transitioned the moment your old contract expires. No gap, no overlap fees.
                </p>
              </details>

              <details className="bg-gray-50 rounded-xl p-6 group">
                <summary className="font-bold text-neutral cursor-pointer flex items-center justify-between">
                  Do you offer a trial period?
                  <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-600 mt-4">
                  Our contracts are typically 12 months, but we're confident you'll want to stay.
                  If you're unhappy in the first 30 days, talk to us - we'll make it right or let you go.
                </p>
              </details>

              <details className="bg-gray-50 rounded-xl p-6 group">
                <summary className="font-bold text-neutral cursor-pointer flex items-center justify-between">
                  What happens if you can't get our passwords from the old provider?
                  <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-600 mt-4">
                  It's rare, but it happens. We have processes for resetting admin access, proving domain ownership,
                  and rebuilding systems if necessary. We've never failed to complete a handover.
                </p>
              </details>

              <details className="bg-gray-50 rounded-xl p-6 group">
                <summary className="font-bold text-neutral cursor-pointer flex items-center justify-between">
                  How much does onboarding cost?
                  <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-600 mt-4">
                  For most businesses, onboarding is included in your first month's fee. Complex migrations
                  (e.g., moving from an on-premise server to the cloud) may incur a one-time project fee,
                  which we'll quote upfront.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>

      <Contact />
    </div>
  );
};
