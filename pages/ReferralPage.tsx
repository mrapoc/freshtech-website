import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { PageHeader } from '../components/PageHeader';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  Gift, Users, CheckCircle, Send, Loader2,
  Shield, Clock, Handshake, ArrowRight, Star
} from 'lucide-react';

// Benefits for the referred business
const benefitsForReferral = [
  {
    icon: Clock,
    title: "Priority Onboarding",
    description: "Referred businesses get fast-tracked through our onboarding process"
  },
  {
    icon: Shield,
    title: "Free IT Health Check",
    description: "A complimentary assessment of their current IT setup worth £250"
  },
  {
    icon: Handshake,
    title: "No Hard Sell",
    description: "Just an honest conversation about whether we're the right fit"
  }
];

// Why clients refer us
const whyRefer = [
  "Genuinely helpful support that solves problems",
  "Plain English - no confusing jargon",
  "Fixed monthly pricing with no surprises",
  "Proactive monitoring that prevents issues",
  "Local team who understand small business"
];

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export const ReferralPage = () => {
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [formData, setFormData] = useState({
    yourName: '',
    yourCompany: '',
    yourEmail: '',
    referralName: '',
    referralCompany: '',
    referralEmail: '',
    referralPhone: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');

    try {
      const referralContact = [
        formData.referralEmail && `Email: ${formData.referralEmail}`,
        formData.referralPhone && `Phone: ${formData.referralPhone}`
      ].filter(Boolean).join('\n');

      const messageBody = [
        `REFERRAL FROM:`,
        `${formData.yourName} at ${formData.yourCompany} (${formData.yourEmail})`,
        ``,
        `REFERRING:`,
        `${formData.referralName} at ${formData.referralCompany}`,
        referralContact,
        formData.message && `\nADDITIONAL NOTES:\n${formData.message}`
      ].filter(Boolean).join('\n');

      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.yourName} (Referral)`,
          email: formData.yourEmail,
          phone: formData.referralPhone || '',
          message: messageBody
        })
      });

      if (response.ok) {
        setFormStatus('success');
        setFormData({
          yourName: '',
          yourCompany: '',
          yourEmail: '',
          referralName: '',
          referralCompany: '',
          referralEmail: '',
          referralPhone: '',
          message: ''
        });
      } else {
        setFormStatus('error');
      }
    } catch {
      setFormStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="bg-white">
      <SEO
        title="Refer a Business - Help Your Contacts Get Better IT"
        description="Know a business struggling with IT? Refer them to Fresh Tech. We'll give them priority onboarding and a free IT health check."
        canonicalPath="/refer"
      />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Refer a Business', href: '/refer' }
        ]}
      />

      <PageHeader
        title="Refer a Business"
        subtitle="Know someone who deserves better IT support? Introduce us and we'll take great care of them."
        highlightText="Thank You"
      />

      {/* Intro Section */}
      <section className="py-12 bg-gray-50 border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Gift className="w-16 h-16 text-primary mx-auto mb-6" />
            <p className="text-xl text-gray-700 leading-relaxed">
              The best compliment we can receive is a referral. If you've had a positive experience
              with Fresh Tech, and know a business owner or manager who's frustrated with their IT,
              we'd love the introduction.
            </p>
          </div>
        </div>
      </section>

      {/* What They Get */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-center mb-4">What Your Referral Gets</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We want to make a great first impression, so referred businesses get special treatment.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {benefitsForReferral.map((benefit, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Form */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-heading font-bold text-center mb-4">Make the Introduction</h2>
            <p className="text-center text-gray-600 mb-8">
              Fill in the details below and we'll reach out to them with a friendly hello.
              No pressure, no hard sell - just an offer to help if they need it.
            </p>

            {formStatus === 'success' ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-800 mb-2">Thank You!</h3>
                <p className="text-green-700 mb-6">
                  We really appreciate the referral. We'll reach out to them within 24 hours
                  with a friendly introduction.
                </p>
                <button
                  onClick={() => setFormStatus('idle')}
                  className="text-green-600 font-medium hover:underline"
                >
                  Refer another business
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200">
                {/* Your Details */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Your Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="yourName" className="block text-sm font-medium mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="yourName"
                        name="yourName"
                        required
                        value={formData.yourName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label htmlFor="yourCompany" className="block text-sm font-medium mb-1">
                        Your Company *
                      </label>
                      <input
                        type="text"
                        id="yourCompany"
                        name="yourCompany"
                        required
                        value={formData.yourCompany}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                        placeholder="Acme Ltd"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="yourEmail" className="block text-sm font-medium mb-1">
                        Your Email *
                      </label>
                      <input
                        type="email"
                        id="yourEmail"
                        name="yourEmail"
                        required
                        value={formData.yourEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                        placeholder="john@acme.co.uk"
                      />
                    </div>
                  </div>
                </div>

                {/* Referral Details */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-accent" />
                    Who Are You Referring?
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="referralName" className="block text-sm font-medium mb-1">
                        Their Name *
                      </label>
                      <input
                        type="text"
                        id="referralName"
                        name="referralName"
                        required
                        value={formData.referralName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="referralCompany" className="block text-sm font-medium mb-1">
                        Their Company *
                      </label>
                      <input
                        type="text"
                        id="referralCompany"
                        name="referralCompany"
                        required
                        value={formData.referralCompany}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                        placeholder="Smith & Co"
                      />
                    </div>
                    <div>
                      <label htmlFor="referralEmail" className="block text-sm font-medium mb-1">
                        Their Email
                      </label>
                      <input
                        type="email"
                        id="referralEmail"
                        name="referralEmail"
                        value={formData.referralEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                        placeholder="jane@smithco.co.uk"
                      />
                    </div>
                    <div>
                      <label htmlFor="referralPhone" className="block text-sm font-medium mb-1">
                        Their Phone
                      </label>
                      <input
                        type="tel"
                        id="referralPhone"
                        name="referralPhone"
                        value={formData.referralPhone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                        placeholder="01234 567890"
                      />
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-8">
                  <label htmlFor="message" className="block text-sm font-medium mb-1">
                    Anything we should know? (Optional)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary resize-none"
                    placeholder="e.g., They're having issues with their email provider, looking to switch from X..."
                  />
                </div>

                {formStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    Something went wrong. Please try again or email us at{' '}
                    <a href="mailto:hello@fresh-tech.uk" className="underline">hello@fresh-tech.uk</a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="w-full bg-accent text-neutral px-6 py-4 rounded-lg font-bold text-lg shadow-comic hover:shadow-comic-hover hover:translate-y-[2px] transition-all border-2 border-neutral disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {formStatus === 'submitting' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Referral
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  We'll mention your name when we reach out so they know it's a trusted introduction.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Why Clients Refer Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-heading font-bold text-center mb-4">Why Our Clients Refer Us</h2>
            <p className="text-center text-gray-600 mb-8">
              We don't ask for referrals. They happen because clients genuinely want to help their contacts.
            </p>

            <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
              <ul className="space-y-4">
                {whyRefer.map((reason, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-highlight shrink-0" />
                    <span className="text-lg">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">Want to see what our clients say?</p>
              <Link
                to="/case-studies"
                className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
              >
                Read our case studies
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative: Share This Page */}
      <section className="py-12 bg-neutral text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-heading font-bold mb-4">Or Simply Share This Page</h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">
            If you'd rather your contact reach out themselves, just send them this link.
            They can fill in the form and mention your name.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <code className="bg-white/10 px-4 py-2 rounded-lg text-sm">
              fresh-tech.uk/refer
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText('https://fresh-tech.uk/refer');
                alert('Link copied!');
              }}
              className="bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
