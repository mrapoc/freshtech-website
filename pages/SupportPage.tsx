import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { PageHeader } from '../components/PageHeader';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { contactDetails } from '../data/content';
import {
  MessageSquare, Phone, Mail, Clock,
  ExternalLink, Users, Gift, Shield, Zap,
  CheckCircle, XCircle, HelpCircle, FileText
} from 'lucide-react';

// Support channels with priority order
const supportChannels = [
  {
    title: "Client Portal",
    subtitle: "Recommended - SLA starts immediately",
    description: "Log a ticket and we'll be notified instantly. Full visibility of progress, history, and updates.",
    icon: MessageSquare,
    action: {
      label: "Open Portal",
      href: contactDetails.portal,
      external: true
    },
    highlight: true,
    benefits: [
      "SLA timer starts the moment you submit",
      "Track progress in real-time",
      "Full history of all your tickets",
      "Attach screenshots and files easily"
    ]
  },
  {
    title: "Phone Support",
    subtitle: "For urgent issues",
    description: "Call us directly for critical problems that are stopping your work. We answer Mon-Fri 8:30am-5:30pm.",
    icon: Phone,
    action: {
      label: contactDetails.phone,
      href: `tel:${contactDetails.phone.replace(/\s/g, '')}`
    },
    benefits: [
      "Speak to a real person",
      "Ideal for urgent or complex issues",
      "We'll log the ticket for you"
    ]
  },
  {
    title: "Email Support",
    subtitle: "support@fresh-tech.uk",
    description: "Email creates a ticket automatically. Include as much detail as possible to help us help you faster.",
    icon: Mail,
    action: {
      label: "Send Email",
      href: "mailto:support@fresh-tech.uk"
    },
    benefits: [
      "Auto-creates a ticket in our system",
      "Great for non-urgent requests",
      "Include screenshots as attachments"
    ]
  }
];

// Important warnings
const warnings = [
  {
    icon: XCircle,
    title: "Don't contact staff directly",
    description: "Messaging a team member on their personal number or email risks your issue being missed. They might be on leave, in a meeting, or have moved on. Always use official channels."
  },
  {
    icon: Clock,
    title: "SLA only starts when logged",
    description: "Our response time guarantees only apply once a ticket exists in our system. A text message to a technician doesn't count - use the portal or email."
  },

];

// Useful resources for existing clients
const resources = [
  {
    title: "Microsoft 365 Status",
    description: "Check if Microsoft services are having issues",
    href: "https://status.office365.com/",
    icon: Shield,
    external: true
  },
  {
    title: "Common Questions",
    description: "Quick answers to frequent IT questions",
    href: "/faq",
    icon: HelpCircle
  },
  {
    title: "What We Monitor",
    description: "See how we proactively protect your systems",
    href: "/technology/rmm",
    icon: Zap
  },
  {
    title: "Security Best Practices",
    description: "Tips to keep your team safe online",
    href: "/blog?category=security",
    icon: Shield
  }
];

export const SupportPage = () => {
  return (
    <div className="bg-white">
      <SEO
        title="Get Support - Existing Customers"
        description="How to contact Fresh Tech for IT support. Log tickets via our portal, call, or email. For existing managed service customers only."
        canonicalPath="/support"
      />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Support', href: '/support' }
        ]}
      />

      <PageHeader
        title="Get IT Support"
        subtitle="Already a Fresh Tech customer? Here's how to reach us and get the fastest response."
        highlightText="Existing Customers"
      />

      {/* Priority Message */}
      <section className="bg-primary text-white py-8 border-b-4 border-neutral">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 text-center">
            <Clock className="w-8 h-8 text-highlight shrink-0" />
            <p className="text-lg">
              <span className="font-bold">Average response time: under 15 minutes</span>
              <span className="opacity-80 ml-2">for tickets logged via the portal</span>
            </p>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-center mb-4">How to Reach Us</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Choose the channel that best fits your situation. The portal is fastest for most issues.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {supportChannels.map((channel, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl p-6 shadow-lg border-2 ${
                  channel.highlight
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-gray-200'
                } relative`}
              >
                {channel.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                    FASTEST RESPONSE
                  </div>
                )}

                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                  channel.highlight ? 'bg-primary text-white' : 'bg-gray-100 text-primary'
                }`}>
                  <channel.icon className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-bold mb-1">{channel.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{channel.subtitle}</p>
                <p className="text-gray-600 mb-4">{channel.description}</p>

                <ul className="space-y-2 mb-6">
                  {channel.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <a
                  href={channel.action.href}
                  target={channel.action.external ? "_blank" : undefined}
                  rel={channel.action.external ? "noopener noreferrer" : undefined}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${
                    channel.highlight
                      ? 'bg-primary text-white hover:bg-primary-dark'
                      : 'bg-gray-100 text-neutral hover:bg-gray-200'
                  }`}
                >
                  {channel.action.label}
                  {channel.action.external && <ExternalLink className="w-4 h-4" />}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Warnings Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-center mb-4">Important Notes</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            To ensure you get the best and fastest support, please keep these points in mind.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {warnings.map((warning, index) => (
              <div key={index} className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                <warning.icon className="w-8 h-8 text-amber-600 mb-3" />
                <h3 className="font-bold text-lg mb-2">{warning.title}</h3>
                <p className="text-gray-700 text-sm">{warning.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Useful Resources */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-center mb-4">Useful Resources</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Quick links that might help before you log a ticket.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {resources.map((resource, index) => (
              resource.external ? (
                <a
                  key={index}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-primary hover:shadow-md transition-all group"
                >
                  <resource.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold mb-1 flex items-center gap-2">
                    {resource.title}
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-600">{resource.description}</p>
                </a>
              ) : (
                <Link
                  key={index}
                  to={resource.href}
                  className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-primary hover:shadow-md transition-all group"
                >
                  <resource.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold mb-1">{resource.title}</h3>
                  <p className="text-sm text-gray-600">{resource.description}</p>
                </Link>
              )
            ))}
          </div>
        </div>
      </section>

      {/* Referral CTA */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <Gift className="w-16 h-16 mx-auto mb-6 text-highlight" />
          <h2 className="text-3xl font-heading font-bold mb-4">Know Someone Who Needs Better IT?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            If you've had a good experience with us, we'd love to help your contacts too.
            Refer a business and we'll make the introduction easy.
          </p>
          <Link
            to="/refer"
            className="inline-flex items-center gap-2 bg-accent text-neutral px-8 py-4 rounded-full font-bold text-lg shadow-comic hover:shadow-comic-hover hover:translate-y-[2px] transition-all border-2 border-neutral"
          >
            <Users className="w-5 h-5" />
            Refer a Business
          </Link>
        </div>
      </section>

      {/* Not a Customer Yet? */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-heading font-bold mb-4">Not a Customer Yet?</h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            If you're looking for IT support for your business, we'd love to chat.
            Get in touch to discuss your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors"
            >
              <Mail className="w-5 h-5" />
              Contact Us
            </Link>
            <Link
              to="/it-health-check"
              className="inline-flex items-center justify-center gap-2 bg-gray-100 text-neutral px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
            >
              <FileText className="w-5 h-5" />
              Free IT Health Check
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
