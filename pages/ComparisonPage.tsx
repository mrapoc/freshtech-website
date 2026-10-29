import React, { useState, useEffect } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { comparisonPages } from '../data/content';
import { Contact } from '../components/Contact';
import { SEO } from '../components/SEO';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Shield, Cloud, Monitor, Wrench, User, Users } from 'lucide-react';
import { Testimonials } from '../components/Testimonials';
import { RichText } from '../components/RichText';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { trackServiceView } from '../utils/analytics';

export const ComparisonPage = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, '');
  const data = comparisonPages[slug];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (data) {
      trackServiceView(`comparison_${data.slug}`);
    }
  }, [data]);

  if (!data) {
    return <Navigate to="/404" />;
  }

  const iconMap: Record<string, React.ElementType> = {
    Shield, Cloud, Monitor, Wrench, User, Users, CheckCircle
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": data.h1,
    "description": data.metaDesc,
    "author": {
      "@type": "Organization",
      "name": "Fresh Tech"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Fresh Tech",
      "logo": {
        "@type": "ImageObject",
        "url": "https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/fresh-tech-logo.png"
      }
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      }
    }))
  };

  return (
    <>
      <SEO
        title={data.title}
        description={data.metaDesc}
        canonical={`https://fresh-tech.uk/${data.slug}`}
        schema={[articleSchema, faqSchema]}
      />

      {/* Hero */}
      <section className="bg-linear-to-br from-primary via-primary to-secondary text-white pt-32 pb-20">
        <div className="container max-w-4xl mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: 'Resources', href: '/resources' },
              { label: data.h1 }
            ]}
            variant="light"
          />
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{data.h1}</h1>
          <p className="text-xl text-gray-200 mb-8 leading-relaxed">{data.intro}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/contact"
              className="bg-accent text-neutral font-bold px-8 py-4 rounded-lg shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all"
            >
              {data.cta}
            </Link>
            <a
              href="tel:01584517234"
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-lg transition-all"
            >
              Call 01584 517 234
            </a>
          </div>
        </div>
      </section>

      {/* Options Comparison */}
      <section className="py-16 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-primary">The Options</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">A straightforward comparison of your choices</p>
          <div className={`grid gap-8 ${data.options.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            {data.options.map((option, index) => {
              const IconComponent = iconMap[option.icon] || CheckCircle;
              const isRecommended = index === data.options.length - 1 && data.options.length > 2;
              return (
                <div key={index} className={`rounded-2xl p-8 ${isRecommended ? 'bg-primary text-white ring-4 ring-accent shadow-xl relative' : 'bg-gray-50 border border-gray-200'}`}>
                  {isRecommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-4 py-1 rounded-full">
                      Recommended
                    </span>
                  )}
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center mb-4 ${isRecommended ? 'bg-white/10' : 'bg-primary/10'}`}>
                    <IconComponent className={`w-7 h-7 ${isRecommended ? 'text-white' : 'text-primary'}`} />
                  </div>
                  <h3 className={`text-2xl font-bold mb-3 ${isRecommended ? 'text-white' : 'text-gray-900'}`}>{option.name}</h3>
                  <p className={`mb-6 text-sm ${isRecommended ? 'text-gray-200' : 'text-gray-600'}`}>{option.desc}</p>

                  <div className="mb-4">
                    <h4 className={`font-semibold text-sm mb-2 ${isRecommended ? 'text-green-300' : 'text-green-700'}`}>Advantages</h4>
                    <ul className="space-y-2">
                      {option.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isRecommended ? 'text-green-300' : 'text-green-600'}`} />
                          <span className={isRecommended ? 'text-gray-100' : 'text-gray-700'}>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h4 className={`font-semibold text-sm mb-2 ${isRecommended ? 'text-red-300' : 'text-red-600'}`}>Disadvantages</h4>
                    <ul className="space-y-2">
                      {option.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <XCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isRecommended ? 'text-red-300' : 'text-red-400'}`} />
                          <span className={isRecommended ? 'text-gray-200' : 'text-gray-600'}>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`rounded-lg p-4 ${isRecommended ? 'bg-white/10' : 'bg-blue-50'}`}>
                    <p className={`text-sm font-medium ${isRecommended ? 'text-white' : 'text-blue-900'}`}>
                      <strong>Best for:</strong> {option.bestFor}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-primary">Side-by-Side Comparison</h2>
          <p className="text-center text-gray-600 mb-12">Feature-by-feature breakdown</p>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-xs overflow-hidden">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  {data.options.map((option, i) => (
                    <th key={i} className="text-left p-4 font-semibold">{option.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.comparisonRows.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-4 font-medium text-gray-900">{row.feature}</td>
                    {row.values.map((value, i) => (
                      <td key={i} className="p-4 text-gray-600 text-sm">{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Verdict */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-linear-to-br from-primary to-secondary rounded-2xl p-8 md:p-12 text-white">
            <h2 className="text-3xl font-bold mb-6">Our Verdict</h2>
            <div className="text-lg leading-relaxed text-gray-100">
              <RichText text={data.verdict} />
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Content */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="prose prose-lg max-w-none">
            <RichText text={data.content} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-primary">Common Questions</h2>
          <p className="text-center text-gray-600 mb-12">Answers to questions we hear most often</p>
          <div className="space-y-4">
            {data.faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-100 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <div className="text-gray-600 leading-relaxed">
                      <RichText text={faq.a} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-linear-to-br from-primary to-secondary text-white">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make the Right Choice?</h2>
          <p className="text-xl text-gray-200 mb-8">We'll assess your current setup and recommend the best approach for your business - with no obligation.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="bg-accent text-neutral font-bold px-8 py-4 rounded-lg shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all"
            >
              {data.cta}
            </Link>
            <a
              href="tel:01584517234"
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-lg transition-all"
            >
              Call 01584 517 234
            </a>
          </div>
        </div>
      </section>

      <Testimonials />
      <Contact />
    </>
  );
};
