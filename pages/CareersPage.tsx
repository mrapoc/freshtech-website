import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { PageHeader } from '../components/PageHeader';
import { Contact } from '../components/Contact';
import {
  Rocket, Heart, Coffee, Laptop, MapPin, Clock, Shield,
  Users, Zap, BookOpen, Send, CheckCircle,
  Briefcase, GraduationCap, Smile, ArrowRight
} from 'lucide-react';

// Company benefits
const benefits = [
  { icon: Laptop, title: "Remote-First", desc: "Work from home with occasional client visits. We trust you to get the job done." },
  { icon: Clock, title: "Flexible Hours", desc: "Core hours 10am-3pm. Start early or finish late - whatever suits your life." },
  { icon: BookOpen, title: "Training Support", desc: "We support certifications, courses, and conferences. Never stop learning." },
  { icon: Heart, title: "Wellbeing Focus", desc: "Mental health days, no emails after 6pm policy, and a supportive team." },
  { icon: Coffee, title: "Great Culture", desc: "Regular team lunches, Friday afternoon gaming, and actual work-life balance." },
  { icon: MapPin, title: "Local Impact", desc: "Help real businesses in our community. See the difference you make." },
];

// What we look for
const qualities = [
  { title: "Problem Solvers", desc: "You see a broken system and can't rest until it's fixed. Curiosity drives you." },
  { title: "Clear Communicators", desc: "You can explain complex tech to non-technical people without being condescending." },
  { title: "Team Players", desc: "You share knowledge, help colleagues, and celebrate wins together." },
  { title: "Continuous Learners", desc: "Technology changes fast. You're excited by that, not intimidated." },
];

// Team values
const values = [
  { icon: Shield, title: "Do The Right Thing", desc: "Even when no one's watching. Honesty and integrity come first." },
  { icon: Users, title: "Clients Are Partners", desc: "We don't just fix problems - we help businesses succeed." },
  { icon: Zap, title: "Keep It Simple", desc: "Clear solutions beat clever ones. No jargon, no ego." },
  { icon: Smile, title: "Enjoy The Journey", desc: "Work should be fulfilling. We have fun while doing great work." },
];

export const CareersPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: `[CAREERS ENQUIRY]\n\nExperience Level: ${formData.experience}\n\n${formData.message}`,
        }),
      });

      if (!response.ok) throw new Error('Failed to send');

      setStatus('success');
      setFormData({ name: '', email: '', phone: '', experience: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="bg-white">
      <SEO
        title="Careers"
        description="Join Fresh Tech - a growing IT support company in Shropshire. We're always looking for talented IT professionals who want to make a difference."
      />

      <PageHeader
        title="Join The Team"
        subtitle="We're building something special. If you're passionate about technology and helping businesses succeed, we'd love to hear from you."
        highlightText="Careers"
      />

      {/* Intro Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold mb-6">
              <Rocket size={16} />
              Growing Team
            </div>
            <h2 className="font-heading text-3xl md:text-4xl text-neutral mb-6">
              Not Just a Job. A Mission.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              At Fresh Tech, we're not just fixing computers - we're helping local businesses thrive in a digital world.
              Every printer we fix, every cyber attack we prevent, every cloud migration we complete makes a real difference
              to someone's livelihood.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              We're a small but ambitious team based in Ludlow, serving businesses across Shropshire, Herefordshire, and beyond.
              While we're not actively recruiting right now, <strong>we're always interested in meeting talented people</strong> who
              might be a great fit for our future growth.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl text-neutral mb-4">Why Work With Us?</h2>
            <p className="text-gray-600">Benefits that actually matter</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 hover:border-primary hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon size={24} />
                </div>
                <h3 className="font-bold text-lg text-neutral mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-neutral text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl mb-4">Our Values</h2>
            <p className="text-gray-300">What guides everything we do</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {values.map((value, idx) => (
              <div key={idx} className="text-center p-6">
                <div className="w-16 h-16 bg-white/10 text-highlight rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon size={28} />
                </div>
                <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                <p className="text-gray-400 text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Look For */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl text-neutral mb-4">What We Look For</h2>
              <p className="text-gray-600">Skills matter, but attitude matters more</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {qualities.map((quality, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral mb-2">{quality.title}</h3>
                    <p className="text-gray-600">{quality.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Skills we appreciate */}
            <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-bold text-lg text-neutral mb-4 flex items-center gap-2">
                <GraduationCap size={20} className="text-primary" />
                Technical Skills We Appreciate
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  'Microsoft 365', 'Azure', 'Windows Server', 'Active Directory',
                  'Networking', 'Cyber Security', 'PowerShell', 'Intune',
                  'Linux', 'Backup Solutions', 'VoIP', 'Remote Support'
                ].map((skill, idx) => (
                  <span key={idx} className="bg-white px-3 py-1 rounded-full text-sm border border-gray-200 text-gray-700">
                    {skill}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Don't tick every box? That's fine. We value potential and willingness to learn over a perfect CV.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expression of Interest Form */}
      <section className="py-16 bg-linear-to-br from-primary to-primary-dark text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-bold mb-4">
                <Briefcase size={16} />
                Expression of Interest
              </div>
              <h2 className="font-heading text-3xl mb-4">Think You'd Be a Great Fit?</h2>
              <p className="text-white/80">
                We're not actively hiring right now, but we're always open to meeting talented people.
                Drop us your details and we'll be in touch when an opportunity arises.
              </p>
            </div>

            {status === 'success' ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="font-heading text-2xl text-neutral mb-2">Thanks for reaching out!</h3>
                <p className="text-gray-600 mb-6">
                  We've received your details and will keep them on file. If a suitable opportunity comes up, we'll be in touch.
                </p>
                <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                  Back to homepage <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="career-name" className="block text-sm font-bold text-gray-700 mb-1">Name *</label>
                    <input
                      id="career-name"
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-200 rounded-lg p-3 text-neutral focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="career-email" className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
                    <input
                      id="career-email"
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-200 rounded-lg p-3 text-neutral focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="career-phone" className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                    <input
                      id="career-phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-200 rounded-lg p-3 text-neutral focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                      placeholder="07xxx xxx xxx"
                    />
                  </div>
                  <div>
                    <label htmlFor="career-experience" className="block text-sm font-bold text-gray-700 mb-1">Experience Level</label>
                    <select
                      id="career-experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-200 rounded-lg p-3 text-neutral focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary bg-white"
                    >
                      <option value="">Select...</option>
                      <option value="apprentice">Looking for apprenticeship</option>
                      <option value="junior">1-2 years (Junior)</option>
                      <option value="mid">3-5 years (Mid-level)</option>
                      <option value="senior">5+ years (Senior)</option>
                      <option value="career-change">Career changer</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="career-message" className="block text-sm font-bold text-gray-700 mb-1">
                    Tell us about yourself *
                  </label>
                  <textarea
                    id="career-message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full border-2 border-gray-200 rounded-lg p-3 text-neutral focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="What interests you about Fresh Tech? What experience do you have? What are you looking for in your next role?"
                  />
                </div>

                {status === 'error' && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    Something went wrong. Please try again or email us directly at hello@fresh-tech.uk
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-primary text-white font-bold py-4 rounded-lg shadow-comic border-2 border-neutral hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={18} />
                  {status === 'sending' ? 'Sending...' : 'Send Expression of Interest'}
                </button>

                <p className="text-center text-xs text-gray-500 mt-4">
                  By submitting, you agree to us storing your details for recruitment purposes.
                  We'll never share your information with third parties.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Alternative CTA */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 mb-4">
            Prefer to send a traditional CV? Email us at{' '}
            <a href="mailto:hello@fresh-tech.uk" className="text-primary font-bold hover:underline">
              hello@fresh-tech.uk
            </a>
          </p>
          <p className="text-sm text-gray-500">
            Or connect with us on{' '}
            <a href="https://linkedin.com/company/9272429" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              LinkedIn
            </a>
          </p>
        </div>
      </section>

      <Contact />
    </div>
  );
};
