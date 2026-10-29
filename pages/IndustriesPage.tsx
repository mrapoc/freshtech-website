
import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Contact } from '../components/Contact';
import { PageHeader } from '../components/PageHeader';
import { SmartImage } from '../components/SmartImage';
import { ArrowRight, Shield, Award, Clock, Factory, Scale, Cpu, Building, BadgeCheck, BookOpen, Leaf, Truck, Heart, Stethoscope } from 'lucide-react';
import { industryPages } from '../data/content';
import { industryGuides } from '../data/industryGuides';
import { useInView } from '../hooks/useInView';

// Industry icons mapping
const industryIcons: Record<string, React.ElementType> = {
  'accountants': Scale,
  'solicitors': Scale,
  'manufacturing': Factory,
  'agriculture': Leaf,
  'healthcare': Stethoscope,
  'professional-services': Cpu,
  'charities': Heart,
  'education': BookOpen,
  // Legacy slugs
  'legal': Scale,
  'engineering': Cpu,
  'veterinary': Heart,
  'renewable-energy': Leaf,
  'retail-distribution': Truck,
};

// Compliance badges
const complianceBadges = [
  { name: "Cyber Essentials", desc: "Government-backed security certification" },
  { name: "GDPR Compliant", desc: "Data protection expertise" },
  { name: "ISO 27001 Ready", desc: "Information security management" },
  { name: "NHS DSP Toolkit", desc: "Healthcare data security" },
];

// Sector expertise stats
const sectorStats = [
  { stat: "10+", label: "Years sector experience", icon: Clock },
  { stat: "8", label: "Industries served", icon: Factory },
  { stat: "100%", label: "Compliance success rate", icon: Shield },
  { stat: "5.0", label: "Google rating", icon: Award },
];

// Industry comparison data
const industryComparison = [
  {
    challenge: "Compliance Requirements",
    manufacturing: "Health & Safety, ISO 9001",
    legal: "SRA, GDPR, Client Confidentiality",
    engineering: "CAD Data Security, IP Protection",
    healthcare: "NHS DSP Toolkit, CQC"
  },
  {
    challenge: "Critical Systems",
    manufacturing: "ERP, Production Lines, SCADA",
    legal: "Case Management, Document Storage",
    engineering: "CAD/CAM, Simulation Software",
    healthcare: "Patient Records, Booking Systems"
  },
  {
    challenge: "Downtime Impact",
    manufacturing: "£10,000+/hour production loss",
    legal: "Missed court deadlines, client trust",
    engineering: "Project delays, design loss",
    healthcare: "Patient safety, appointment chaos"
  },
  {
    challenge: "Fresh Tech Solution",
    manufacturing: "24/7 monitoring, rapid onsite",
    legal: "Encrypted systems, secure remote",
    engineering: "High-spec workstations, backup",
    healthcare: "NHS-compliant, disaster recovery"
  },
];

export const IndustriesPage = () => {
  const [cardsRef, cardsInView] = useInView(0.05);
  const [ctaRef, ctaInView] = useInView(0.15);
  // Helper to optimize images for card grid (max width 800px)
  const getCardImage = (url: string) => {
      if (!url) return '';
      if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
          return url.replace('/upload/', '/upload/w_800,f_auto,q_auto/');
      }
      return url;
  };

  return (
    <div className="bg-gray-50">
      <SEO title="Industries" description="Specialist IT support for engineering, legal, manufacturing, healthcare and more. Sector-specific compliance, systems integration, and technology expertise." />

      <PageHeader
        title="Specialized Support"
        subtitle="Different heroes have different environments. Whether you're on a factory floor or in a courtroom, we know your software."
        highlightText="Sector Expertise"
      />

      {/* Stats Banner */}
      <section className="bg-neutral text-white py-12 border-b-4 border-accent">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {sectorStats.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx}>
                  <Icon size={24} className="text-highlight mx-auto mb-2" />
                  <div className="text-4xl font-heading text-highlight mb-1">{item.stat}</div>
                  <div className="text-gray-300 text-sm">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sector Expertise Intro */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-3xl text-neutral mb-6">Why Sector Expertise Matters</h2>
            <p className="text-lg text-gray-600 mb-8">
              A law firm needs different IT than a factory floor. We don't just understand technology - we understand
              <strong> your industry's regulations, software, and workflows</strong>. From SRA compliance for solicitors to
              SCADA systems for manufacturers, we speak your language.
            </p>

            {/* Compliance Badges */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {complianceBadges.map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                  <BadgeCheck size={18} className="text-green-600" />
                  <span className="font-medium text-sm text-neutral">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industry Cards Grid */}
      <div ref={cardsRef as React.RefObject<HTMLDivElement>} className="container mx-auto px-4 py-16">
        <div className={`text-center mb-12 transition-all duration-700 ${cardsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-heading text-3xl text-neutral mb-4">Our Specialist Sectors</h2>
          <p className="text-gray-600">Click to explore sector-specific challenges and solutions</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {Object.values(industryPages).map((ind, i) => {
            const Icon = industryIcons[ind.slug] || Building;
            return (
              <div key={i} className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col group hover:border-primary transition-all duration-500 ${cardsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: `${150 + (i % 2) * 150}ms` }}>
                 <div className="h-48 overflow-hidden relative bg-linear-to-br from-primary to-primary-dark">
                    <SmartImage
                      src={getCardImage(ind.heroImage)}
                      alt={ind.name}
                      className="w-full h-full object-cover group-hover:scale-105"
                      fallbackText={`${ind.name} IT Support`}
                    />
                    <div className="absolute inset-0 bg-neutral/40 group-hover:bg-neutral/20 transition-colors pointer-events-none"></div>
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg">
                      <Icon size={24} className="text-primary" />
                    </div>
                    <div className="absolute bottom-4 left-4 bg-accent text-white px-3 py-1 font-bold text-xs uppercase rounded-sm shadow-xs">
                       {ind.name}
                    </div>
                 </div>
                 <div className="p-8 flex flex-col grow">
                    <h2 className="font-heading text-2xl mb-4 text-neutral">{ind.name} Support</h2>
                    <p className="text-gray-600 mb-6 grow line-clamp-3">
                      {ind.desc}
                    </p>

                    {/* Quick highlights */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Compliance Ready</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Sector Software</span>
                      <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full font-medium">Local Support</span>
                    </div>

                    {industryGuides[ind.slug] && (
                      <Link
                        to={`/guides/${ind.slug}`}
                        className="mb-4 flex items-center gap-3 p-3 bg-linear-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20 hover:border-primary hover:shadow-md transition-all group"
                      >
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary shadow-xs group-hover:bg-primary group-hover:text-white transition-colors">
                          <BookOpen size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-500 uppercase">Free Interactive Guide</p>
                          <p className="text-sm font-bold text-neutral group-hover:text-primary transition-colors">
                            {ind.name} IT Checklist
                          </p>
                        </div>
                        <ArrowRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}

                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                       <Link to={`/industries/${ind.slug}`} className="font-bold text-primary hover:text-accent flex items-center gap-2">
                          Explore Sector <ArrowRight size={18} />
                       </Link>
                    </div>
                 </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Industry Comparison Table */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl text-neutral mb-4">Sector Challenges at a Glance</h2>
            <p className="text-gray-600">Every industry has unique IT requirements. Here's how we address them.</p>
          </div>

          {/* Desktop: Table view */}
          <div className="hidden lg:block">
            <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-lg">
              <thead>
                <tr className="bg-neutral text-white">
                  <th className="p-4 text-left font-bold">Challenge</th>
                  <th className="p-4 text-center font-bold">
                    <Factory size={18} className="inline mr-2" />
                    Manufacturing
                  </th>
                  <th className="p-4 text-center font-bold">
                    <Scale size={18} className="inline mr-2" />
                    Legal
                  </th>
                  <th className="p-4 text-center font-bold">
                    <Cpu size={18} className="inline mr-2" />
                    Engineering
                  </th>
                  <th className="p-4 text-center font-bold">
                    <Building size={18} className="inline mr-2" />
                    Healthcare
                  </th>
                </tr>
              </thead>
              <tbody>
                {industryComparison.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-4 font-bold text-neutral border-b border-gray-100">{row.challenge}</td>
                    <td className="p-4 text-center text-sm text-gray-600 border-b border-gray-100">{row.manufacturing}</td>
                    <td className="p-4 text-center text-sm text-gray-600 border-b border-gray-100">{row.legal}</td>
                    <td className="p-4 text-center text-sm text-gray-600 border-b border-gray-100">{row.engineering}</td>
                    <td className="p-4 text-center text-sm text-gray-600 border-b border-gray-100">{row.healthcare}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet: Card view */}
          <div className="lg:hidden space-y-6">
            {industryComparison.map((row, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-neutral text-white p-4">
                  <h3 className="font-bold text-lg">{row.challenge}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Factory size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-neutral mb-1">Manufacturing</p>
                      <p className="text-sm text-gray-600">{row.manufacturing}</p>
                    </div>
                  </div>
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Scale size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-neutral mb-1">Legal</p>
                      <p className="text-sm text-gray-600">{row.legal}</p>
                    </div>
                  </div>
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Cpu size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-neutral mb-1">Engineering</p>
                      <p className="text-sm text-gray-600">{row.engineering}</p>
                    </div>
                  </div>
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Building size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-neutral mb-1">Healthcare</p>
                      <p className="text-sm text-gray-600">{row.healthcare}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* General CTA */}
      <div ref={ctaRef as React.RefObject<HTMLDivElement>} className="container mx-auto px-4 py-16">
        <div className={`bg-neutral rounded-3xl p-12 text-center text-white relative overflow-hidden transition-all duration-700 ${ctaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-highlight rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
            <div className="relative z-10">
               <h2 className="font-heading text-3xl mb-4">Don't see your industry?</h2>
               <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                 We work with accountants, architects, logistics firms, and non-profits too.
                 If you use technology to do business, we can help.
               </p>
               <div className="flex flex-wrap justify-center gap-4">
                 <Link to="/contact" className="inline-block bg-accent text-neutral px-8 py-4 rounded-lg font-bold shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all">
                    Let's have a coffee & chat
                 </Link>
                 <Link to="/case-studies" className="inline-block bg-white text-neutral px-8 py-4 rounded-lg font-bold border-2 border-neutral shadow-comic-hover hover:shadow-comic hover:translate-y-[-2px] transition-all">
                    View Case Studies
                 </Link>
               </div>
            </div>
        </div>
      </div>

      <Contact />
    </div>
  );
};
