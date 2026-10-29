
import React from 'react';
import { Link } from 'react-router-dom';
import { Faq } from '../components/Faq';
import { Contact } from '../components/Contact';
import { PageHeader } from '../components/PageHeader';
import { SEO } from '../components/SEO';
import { faqCategories } from '../data/content';
import { MessageSquare, Clock, Users, Shield, HelpCircle, Phone, Mail, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';

// Featured questions to highlight at the top
const featuredQuestions = [
  {
    icon: Clock,
    question: "How quickly do you respond?",
    answer: "Our average response time is under 15 minutes for urgent issues. We prioritise critical faults that stop you from working.",
    color: "primary"
  },
  {
    icon: Shield,
    question: "Is cybersecurity included?",
    answer: "Yes. All our managed plans include next-gen antivirus (EDR), email filtering, and our 24/7 SOC powered by Huntress: real human threat hunters watching your environment around the clock, not just an automated alert dashboard.",
    color: "accent"
  },
  {
    icon: Users,
    question: "Can we switch from our current provider?",
    answer: "Absolutely. We handle the entire transition. We talk to your old provider, get the passwords, and migrate everything without disruption. See our onboarding process.",
    color: "secondary",
    link: "/onboarding"
  }
];

// Category quick nav
const categoryNav = [
  { name: "General IT Support", icon: HelpCircle, count: 3, color: "blue" },
  { name: "Cyber Security", icon: Shield, count: 2, color: "red" },
  { name: "Pricing & Costs", icon: BookOpen, count: 2, color: "green" },
  { name: "Onboarding", icon: Users, count: 2, color: "purple" },
];

export const FaqPage = () => {
  // Flatten all FAQs for Schema
  const allFaqs = faqCategories.flatMap(cat => cat.items);
  const totalQuestions = allFaqs.length;

  return (
    <div className="bg-white">
      <SEO
        title="Frequently Asked Questions"
        description="Common questions about our IT support, pricing, and service areas. Get instant answers or contact our team."
        faqs={allFaqs}
      />
      <PageHeader
        title="The Knowledge Base"
        subtitle="Even superheroes have questions. Here are the answers to the most common ones we get asked."
        highlightText="FAQ"
      />

      {/* Stats Banner */}
      <section className="bg-neutral text-white py-12 border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-heading text-highlight mb-2">{totalQuestions}+</div>
              <div className="text-gray-300 text-sm">Questions Answered</div>
            </div>
            <div>
              <div className="text-4xl font-heading text-highlight mb-2">6</div>
              <div className="text-gray-300 text-sm">Topic Categories</div>
            </div>
            <div>
              <div className="text-4xl font-heading text-highlight mb-2">&lt;15m</div>
              <div className="text-gray-300 text-sm">Avg Response Time</div>
            </div>
            <div>
              <div className="text-4xl font-heading text-highlight mb-2">24/7</div>
              <div className="text-gray-300 text-sm">Huntress SOC Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Questions */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl text-neutral mb-4">Most Asked Questions</h2>
            <p className="text-gray-600">The answers everyone wants to know first.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {featuredQuestions.map((fq, idx) => {
              const Icon = fq.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-primary transition-colors">
                  <div className={`w-12 h-12 bg-${fq.color}/10 rounded-xl flex items-center justify-center text-${fq.color} mb-4`}>
                    <Icon size={24} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-lg text-neutral mb-3">{fq.question}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {fq.answer}
                    {(fq as any).link && (
                      <Link to={(fq as any).link} className="text-primary font-medium hover:underline ml-1 inline-flex items-center gap-1">
                        See how it works <ArrowRight size={14} />
                      </Link>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Category Quick Nav */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {categoryNav.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    const faqSection = document.querySelector('.bg-white.pb-20');
                    if (faqSection) faqSection.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-3 bg-gray-50 hover:bg-primary hover:text-white px-5 py-3 rounded-full transition-colors group"
                >
                  <Icon size={18} className="text-primary group-hover:text-white" />
                  <span className="font-medium">{cat.name}</span>
                  <span className="bg-white text-primary text-xs font-bold px-2 py-0.5 rounded-full group-hover:bg-primary/20 group-hover:text-white">
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Full FAQ Section */}
      <Faq detailed={true} />

      {/* Still Have Questions CTA */}
      <section className="py-20 bg-neutral text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl mb-6">Still Have Questions?</h2>
            <p className="text-gray-300 text-lg mb-10">
              Can't find what you're looking for? Our team is standing by to help.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <a
                href="tel:01584517234"
                className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-xl hover:bg-white/20 transition-colors group"
              >
                <Phone size={32} className="text-highlight mx-auto mb-4" />
                <div className="font-bold text-lg mb-1">Call Us</div>
                <div className="text-gray-300 text-sm">01584 517 234</div>
                <div className="text-xs text-gray-400 mt-2">Mon-Fri 9am-5pm</div>
              </a>

              <a
                href="mailto:hello@fresh-tech.uk"
                className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-xl hover:bg-white/20 transition-colors group"
              >
                <Mail size={32} className="text-highlight mx-auto mb-4" />
                <div className="font-bold text-lg mb-1">Email Us</div>
                <div className="text-gray-300 text-sm">hello@fresh-tech.uk</div>
                <div className="text-xs text-gray-400 mt-2">Usually reply within 2 hours</div>
              </a>

              <Link
                to="/contact"
                className="bg-accent border border-accent p-6 rounded-xl hover:bg-orange-600 transition-colors group"
              >
                <MessageSquare size={32} className="text-white mx-auto mb-4" />
                <div className="font-bold text-lg mb-1">Book a Call</div>
                <div className="text-gray-100 text-sm">Free 15-min consultation</div>
                <div className="text-xs text-white/70 mt-2">No obligation</div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl text-neutral mb-2">Explore More Resources</h2>
            <p className="text-gray-600">Guides, case studies, and tools to help your business.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/blog"
              className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg border border-gray-200 hover:border-primary hover:text-primary transition-colors"
            >
              <BookOpen size={18} />
              <span className="font-medium">Read Our Blog</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/case-studies"
              className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg border border-gray-200 hover:border-primary hover:text-primary transition-colors"
            >
              <CheckCircle size={18} />
              <span className="font-medium">View Case Studies</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/it-health-check"
              className="flex items-center gap-2 bg-white px-6 py-3 rounded-lg border border-gray-200 hover:border-primary hover:text-primary transition-colors"
            >
              <Shield size={18} />
              <span className="font-medium">IT Health Check</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <Contact />
    </div>
  );
};
