import React, { useState } from 'react';
import { SEO } from '../components/SEO';
import { Contact } from '../components/Contact';
import { ITHealthCheck } from '../components/ITHealthCheck';
import { BackupConfidenceQuiz } from '../components/BackupConfidenceQuiz';
import { EmailSecurityQuiz } from '../components/EmailSecurityQuiz';
import { RemoteWorkQuiz } from '../components/RemoteWorkQuiz';
import { ITProviderScorecard } from '../components/ITProviderScorecard';
import { TrueCostCalculator } from '../components/TrueCostCalculator';
import { ReplaceOrRepairQuiz } from '../components/ReplaceOrRepairQuiz';
import { RateYourITQuiz } from '../components/RateYourITQuiz';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { AlertTriangle, Shield, HardDrive, Cloud, Quote, TrendingUp, CheckCircle, ArrowRight, Users, Clock, Award, Laptop, Mail, ChevronDown, Star, Monitor, PoundSterling } from 'lucide-react';

// Stats about what businesses discover
const discoveryStats = [
  { stat: "73%", label: "Find outdated hardware", icon: HardDrive, color: "red" },
  { stat: "61%", label: "Identify security gaps", icon: Shield, color: "orange" },
  { stat: "54%", label: "Discover backup issues", icon: Cloud, color: "blue" },
  { stat: "89%", label: "Get actionable insights", icon: TrendingUp, color: "green" },
];

// Testimonials (sanitized for privacy)
const testimonials = [
  {
    quote: "The health check revealed security vulnerabilities we didn't know existed. Fresh Tech explained them clearly and fixed them within a week.",
    author: "Managing Director",
    role: "Professional Services",
    company: "Shropshire, 15 users",
    result: "Security posture significantly improved"
  },
  {
    quote: "We thought our backups were running fine. Turns out they'd been silently failing for months. This free assessment potentially saved our business.",
    author: "Operations Manager",
    role: "Manufacturing",
    company: "South Shropshire, 30 users",
    result: "Backup reliability now at 100%"
  }
];

// Deep Dive Quizzes Component
const DeepDiveQuizzes: React.FC = () => {
  const [openQuiz, setOpenQuiz] = useState<string | null>(null);

  const quizzes = [
    {
      id: 'provider',
      title: 'Is Your IT Provider Doing Their Job?',
      description: '8 questions that reveal whether your current IT support is up to scratch.',
      icon: Star,
      color: 'bg-purple-500',
      component: <ITProviderScorecard />
    },
    {
      id: 'rating',
      title: 'Rate Your Current IT Support',
      description: 'Grade your IT provider across 10 key areas. See how they compare.',
      icon: CheckCircle,
      color: 'bg-indigo-500',
      component: <RateYourITQuiz />
    },
    {
      id: 'truecost',
      title: 'True IT Cost Calculator',
      description: 'Your invoice isn\'t the full picture. Find the hidden costs.',
      icon: PoundSterling,
      color: 'bg-green-600',
      component: <TrueCostCalculator />
    },
    {
      id: 'backup',
      title: 'Backup Confidence Check',
      description: 'Would your business survive if your server failed tomorrow?',
      icon: HardDrive,
      color: 'bg-red-500',
      component: <BackupConfidenceQuiz />
    },
    {
      id: 'email',
      title: 'Email Security Check',
      description: '90% of cyber attacks start with email. How protected are you?',
      icon: Mail,
      color: 'bg-orange-500',
      component: <EmailSecurityQuiz />
    },
    {
      id: 'remote',
      title: 'Remote Work Readiness',
      description: 'Can your team work productively from anywhere?',
      icon: Laptop,
      color: 'bg-blue-500',
      component: <RemoteWorkQuiz />
    },
    {
      id: 'hardware',
      title: 'Replace or Repair?',
      description: 'Should you fix that old computer or replace it? Find out.',
      icon: Monitor,
      color: 'bg-gray-600',
      component: <ReplaceOrRepairQuiz />
    }
  ];

  return (
    <section className="py-16 bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl text-neutral mb-3">Want to Dig Deeper?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Take our specialized assessments to get detailed insights into specific areas of your IT.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {quizzes.map((quiz) => {
            const Icon = quiz.icon;
            const isOpen = openQuiz === quiz.id;

            return (
              <div key={quiz.id} className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenQuiz(isOpen ? null : quiz.id)}
                  className="w-full p-6 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`${quiz.color} text-white p-3 rounded-lg`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-xl text-neutral">{quiz.title}</h3>
                    <p className="text-gray-500 text-sm">{quiz.description}</p>
                  </div>
                  <ChevronDown
                    size={24}
                    className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    {quiz.component}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const ITHealthCheckPage: React.FC = () => {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "IT Health Check - Free Self Assessment",
    "description": "Take our free IT health check to assess your business technology. Get a personalised score and recommendations for hardware, security, backup, and more.",
    "url": "https://fresh-tech.uk/it-health-check",
    "publisher": {
      "@type": "Organization",
      "name": "Fresh Tech IT Support",
      "url": "https://fresh-tech.uk"
    }
  };

  return (
    <div className="bg-white">
      <SEO
        title="IT Health Check - Free Self Assessment"
        description="Take our free 3-minute IT health check. Assess your hardware, security, backups, and productivity. Get a personalised score and recommendations."
        schema={pageSchema}
        breadcrumbs={[
          { name: "Resources", item: "/resources" },
          { name: "IT Health Check", item: "/it-health-check" }
        ]}
      />

      {/* Hero Section */}
      <div className="bg-neutral text-white pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/20 z-0"></div>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2B7AB1 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <Breadcrumbs
            items={[
              { label: 'Resources', href: '/resources' },
              { label: 'IT Health Check' }
            ]}
            variant="light"
            className="mb-6 justify-center [&_ol]:justify-center"
          />
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1 rounded-full text-sm font-bold mb-6 backdrop-blur-xs">
            Free Assessment Tool
          </div>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl mb-6">
            How Healthy Is Your IT?
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Answer 12 quick questions about your technology. Get a personalised health score and expert recommendations in under 3 minutes.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Clock size={16} className="text-highlight" />
              <span>3 minutes</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Users size={16} className="text-highlight" />
              <span>500+ businesses assessed</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Award size={16} className="text-highlight" />
              <span>100% free, no signup</span>
            </div>
          </div>
        </div>
      </div>

      {/* What Businesses Discover Stats */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl mb-2">What Businesses Discover</h2>
            <p className="text-gray-400 text-sm">Based on 500+ assessments completed</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {discoveryStats.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                    item.color === 'red' ? 'bg-red-500/20 text-red-400' :
                    item.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                    item.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    <Icon size={24} />
                  </div>
                  <div className="text-3xl font-heading text-white mb-1">{item.stat}</div>
                  <div className="text-gray-400 text-sm">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quiz Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <ITHealthCheck />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl text-neutral mb-4">Real Results From Real Businesses</h2>
            <p className="text-gray-600">See what others discovered with their IT Health Check</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-gray-50 rounded-2xl p-8 border border-gray-100 relative">
                <Quote size={32} className="absolute top-6 right-6 text-primary/10" />
                <blockquote className="text-lg text-neutral mb-6 leading-relaxed">
                  "{t.quote}"
                </blockquote>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    {t.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-bold text-neutral">{t.author}</div>
                    <div className="text-sm text-gray-500">{t.role} · {t.company}</div>
                  </div>
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2">
                  <TrendingUp size={16} />
                  {t.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep Dive Quizzes */}
      <DeepDiveQuizzes />

      {/* Sample Score Card */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-heading text-3xl text-neutral mb-6">
                  Your Personalised Score Card
                </h2>
                <p className="text-gray-600 mb-6">
                  After completing the assessment, you'll receive a detailed breakdown of your IT health across 4 key areas:
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 shrink-0 mt-1" size={20} />
                    <div>
                      <strong className="text-neutral">Hardware Health</strong>
                      <p className="text-sm text-gray-500">Age, performance, and warranty status</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 shrink-0 mt-1" size={20} />
                    <div>
                      <strong className="text-neutral">Security Posture</strong>
                      <p className="text-sm text-gray-500">Antivirus, MFA, and access controls</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 shrink-0 mt-1" size={20} />
                    <div>
                      <strong className="text-neutral">Backup Reliability</strong>
                      <p className="text-sm text-gray-500">Recovery testing and offsite copies</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 shrink-0 mt-1" size={20} />
                    <div>
                      <strong className="text-neutral">Productivity Tools</strong>
                      <p className="text-sm text-gray-500">Software licensing and collaboration</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Sample Score Visual */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-primary/20">
                <div className="text-center mb-6">
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Sample Score</div>
                  <div className="w-32 h-32 mx-auto rounded-full border-8 border-primary flex items-center justify-center">
                    <span className="text-4xl font-heading text-primary">72%</span>
                  </div>
                  <div className="mt-4 text-lg font-bold text-neutral">Good, But Room to Improve</div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Hardware</span>
                      <span className="font-bold text-green-600">85%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Security</span>
                      <span className="font-bold text-orange-600">58%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: '58%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Backup</span>
                      <span className="font-bold text-red-600">45%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Productivity</span>
                      <span className="font-bold text-primary">100%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                    <span className="text-gray-600">
                      <strong className="text-neutral">Top Priority:</strong> Your backup system needs attention. Consider offsite replication.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Take The Check */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl md:text-4xl text-neutral mb-6">
              Why Check Your IT Health?
            </h2>
            <p className="text-gray-600 text-lg mb-12">
              Many business owners don't realise their technology is holding them back until something breaks.
              This quick assessment helps you identify risks and opportunities before they become problems.
            </p>

            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="text-3xl font-heading text-primary mb-3">1.</div>
                <h3 className="font-bold text-neutral mb-2">Identify Risks</h3>
                <p className="text-gray-600 text-sm">
                  Discover security gaps, outdated hardware, and backup weaknesses before they cause downtime.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="text-3xl font-heading text-primary mb-3">2.</div>
                <h3 className="font-bold text-neutral mb-2">Get Recommendations</h3>
                <p className="text-gray-600 text-sm">
                  Receive actionable advice tailored to your score, with links to solutions that can help.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="text-3xl font-heading text-primary mb-3">3.</div>
                <h3 className="font-bold text-neutral mb-2">Start a Conversation</h3>
                <p className="text-gray-600 text-sm">
                  Share your results with us for a free, no-obligation consultation about improving your IT.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-neutral text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl mb-4">Ready to Discover Your Score?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Scroll up and take the 3-minute assessment. It's free, instant, and could save your business from costly surprises.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-accent text-neutral px-8 py-4 rounded-lg font-bold shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all inline-flex items-center gap-2"
          >
            Take The Health Check Now
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <Contact />
    </div>
  );
};
