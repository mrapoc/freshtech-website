
import React from 'react';
import { Services } from '../components/Services';
import { Contact } from '../components/Contact';
import { PageHeader } from '../components/PageHeader';
import { CyberEssentialsPromo } from '../components/CyberEssentialsPromo';
import { techDefinitions, additionalServices, faqCategories } from '../data/content';
import { Key, ShieldAlert, UserCheck, CheckCircle, XCircle, Shield, Activity, Smartphone, Zap, Cloud, BadgeCheck, Check, X, ArrowRight, Lock, Monitor, Eye, Cpu, Server, Database, Wifi, RefreshCw, Globe, Mail, FileCheck, Search, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { useInView } from '../hooks/useInView';

// Comparison table data - comparing provider TYPES, not naming competitors
const comparisonFeatures = [
  { feature: "Response Time", diy: "Depends on staff availability", breakFix: "1-2 business days typical", national: "4-8 hour SLA (remote only)", freshTech: "Under 15 min average" },
  { feature: "Cost Predictability", diy: "Hidden salary/training costs", breakFix: "Unpredictable hourly bills", national: "Fixed but often higher", freshTech: "Fixed per-user monthly" },
  { feature: "Proactive Monitoring", diy: false, breakFix: false, national: true, freshTech: true },
  { feature: "Onsite Support", diy: true, breakFix: "Extra charge", national: "Often outsourced", freshTech: "Included in managed plans" },
  { feature: "Local Knowledge", diy: true, breakFix: "Varies", national: false, freshTech: true },
  { feature: "Cybersecurity Included", diy: false, breakFix: false, national: "Basic only", freshTech: true },
  { feature: "Single Point of Contact", diy: true, breakFix: false, national: false, freshTech: true },
  { feature: "Strategic IT Reviews", diy: false, breakFix: false, national: "Extra charge", freshTech: "Quarterly included" },
];

export const ServicesPage = () => {
  const [introRef, introInView] = useInView(0.15);
  const [compareRef, compareInView] = useInView(0.05);
  const [glossaryRef, glossaryInView] = useInView(0.05);

  // Extract relevant FAQs for schema
  const servicesFaqs = faqCategories
    .filter(cat => ['General IT Support', 'Cyber Security & Compliance'].includes(cat.title))
    .flatMap(cat => cat.items);

  const icons: Record<string, React.ElementType> = {
    Key, ShieldAlert, UserCheck, Activity, Smartphone, Cloud, BadgeCheck,
    Shield, Lock, Monitor, Eye, Cpu, Server, Database, Wifi, RefreshCw,
    Globe, Mail, FileCheck, Search, List, Zap
  };

  return (
    <div className="bg-white">
      <SEO
        title="Business IT Services"
        description="Managed IT support, cyber security, Microsoft 365, cloud migration, and hardware procurement. All-inclusive plans with unlimited helpdesk and proactive monitoring."
        faqs={servicesFaqs}
      />
      <PageHeader 
        title="Our Services" 
        subtitle="From broken printers to cloud migrations, we handle it all so you don't have to."
        highlightText="What We Do"
      />
      
      {/* Intro SEO Block */}
      <div className="container mx-auto px-4 py-12" ref={introRef as React.RefObject<HTMLDivElement>}>
        <div className={`max-w-4xl mx-auto bg-gray-50 p-8 rounded-2xl border border-gray-100 text-left shadow-xs relative overflow-hidden transition-all duration-700 ${introInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
           <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
           <h3 className="font-heading text-xl mb-3 text-neutral relative z-10">Why Managed IT Services?</h3>
           <p className="text-gray-600 mb-4 relative z-10">
              Waiting for technology to break before fixing it (the old "break-fix" model) is a recipe for disaster. Downtime costs money, damages reputation, and frustrates staff. 
           </p>
           <p className="text-gray-600 relative z-10">
              Managed Services flips this script. We proactively monitor your systems to catch issues before they disrupt your day. Whether you are a law firm in Ludlow needing secure email, or a manufacturing plant in Shrewsbury requiring ruggedised hardware, our managed packages ensure your technology drives your business forward.
           </p>
        </div>
      </div>

      {/* Why Fresh Tech Comparison Table */}
      <section className="py-16 bg-white" ref={compareRef as React.RefObject<HTMLElement>}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl text-neutral mb-4">How Do We Compare?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Not all IT support is created equal. Here's how the main options stack up for your business.
            </p>
          </div>

          <div className={`overflow-x-auto transition-all duration-700 ${compareInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-4 text-left font-bold text-neutral border-b-2 border-gray-200">Feature</th>
                  <th className="p-4 text-center font-bold text-gray-600 border-b-2 border-gray-200">DIY / In-House</th>
                  <th className="p-4 text-center font-bold text-gray-600 border-b-2 border-gray-200">Break-Fix Provider</th>
                  <th className="p-4 text-center font-bold text-gray-600 border-b-2 border-gray-200">National IT provider</th>
                  <th className="p-4 text-center font-bold text-primary border-b-2 border-primary bg-primary/5">Fresh Tech</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, idx) => {
                  const renderCell = (value: boolean | string) => {
                    if (value === true) return <Check className="mx-auto text-green-500" size={20} />;
                    if (value === false) return <X className="mx-auto text-red-400" size={20} />;
                    return <span className="text-sm text-gray-600">{value}</span>;
                  };

                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-4 font-medium text-neutral border-b border-gray-100">{row.feature}</td>
                      <td className="p-4 text-center border-b border-gray-100">{renderCell(row.diy)}</td>
                      <td className="p-4 text-center border-b border-gray-100">{renderCell(row.breakFix)}</td>
                      <td className="p-4 text-center border-b border-gray-100">{renderCell(row.national)}</td>
                      <td className="p-4 text-center border-b border-gray-100 bg-primary/5 font-medium text-primary">
                        {typeof row.freshTech === 'boolean' ? (
                          row.freshTech ? <Check className="mx-auto text-green-600" size={20} strokeWidth={3} /> : <X className="mx-auto text-red-500" size={20} />
                        ) : (
                          <span className="text-sm">{row.freshTech}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Based on industry averages. Your experience may vary. <Link to="/contact" className="text-primary hover:underline">Ask us about your specific needs</Link> or <Link to="/onboarding" className="text-primary hover:underline">see how easy it is to switch</Link>.
          </p>
        </div>
      </section>

      <Services />

      {/* Cyber Essentials Promo */}
      <CyberEssentialsPromo />

      {/* Business Premium Promo */}
      <section className="py-12 bg-white">
         <div className="container mx-auto px-4">
             <div className="bg-primary text-white rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 border-4 border-neutral shadow-comic overflow-hidden relative">
                 <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
                 <div className="flex-1 relative z-10">
                     <div className="inline-flex items-center gap-2 bg-highlight text-neutral px-3 py-1 font-bold uppercase tracking-widest text-xs mb-4 rounded-xs">
                        <Zap size={14} /> The Secret Weapon
                     </div>
                     <h2 className="font-heading text-3xl mb-4">Why We Recommend Microsoft Business Premium</h2>
                     <p className="text-gray-200">
                        Stop paying for disjointed antivirus, spam filters, and device management tools. We standardise on Microsoft 365 Business Premium to save you money and boost security.
                     </p>
                 </div>
                 <div className="relative z-10">
                     <Link to="/microsoft-business-premium" className="bg-white text-neutral px-8 py-4 rounded-lg font-bold shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all inline-block">
                        See The Cost Comparison
                     </Link>
                 </div>
             </div>
         </div>
      </section>

      {/* The Tech Translator Section */}
      <section className="py-20 bg-neutral text-white border-y-4 border-primary relative overflow-hidden" ref={glossaryRef as React.RefObject<HTMLElement>}>
         <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2B7AB1 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>

         <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
                <h2 className="font-heading text-3xl md:text-4xl text-highlight mb-4">The Glossary of Protection</h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                    IT providers often use confusing acronyms to hide what you're actually paying for. 
                    Here is what these tools actually do, and why your business risks failure without them.
                </p>
            </div>

            <div className="grid gap-8">
                {techDefinitions.map((def, idx) => {
                    const Icon = icons[def.icon] || Shield;
                    return (
                        <div key={idx} className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-xl flex flex-col lg:flex-row gap-8 items-start hover:border-accent transition-colors duration-300">
                            <div className="shrink-0 bg-gray-700 p-4 rounded-xl border border-gray-600">
                                <Icon size={48} className="text-highlight" />
                            </div>
                            <div className="grow">
                                <h3 className="font-heading text-2xl mb-2 text-white">{def.term}</h3>
                                <p className="text-gray-400 italic mb-6 border-l-2 border-accent pl-4">{def.question}</p>
                                
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="bg-red-900/20 p-6 rounded-xl border border-red-900/50">
                                        <div className="flex items-center gap-2 text-red-400 font-bold mb-2 uppercase text-sm tracking-wider">
                                            <XCircle size={16} /> The Risk
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed">{def.risk}</p>
                                    </div>
                                    <div className="bg-green-900/20 p-6 rounded-xl border border-green-900/50">
                                        <div className="flex items-center gap-2 text-green-400 font-bold mb-2 uppercase text-sm tracking-wider">
                                            <CheckCircle size={16} /> The Fresh Tech Solution
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed">{def.reward}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
         </div>
      </section>

      {/* Hardware Procurement & Networking */}
      <section className="py-20 bg-white">
         <div className="container mx-auto px-4">
             <div className="grid lg:grid-cols-2 gap-16 items-center">
                 <div>
                     <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 font-bold text-xs uppercase rounded-sm mb-4">
                        Dell Premier Partner
                     </div>
                     <h2 className="font-heading text-4xl text-neutral mb-6">We Don't Just Buy Laptops. <br/><span className="text-primary">We Deploy Weapons of Mass Production.</span></h2>
                     <p className="text-lg text-gray-600 mb-6">
                         Many businesses make the mistake of buying consumer-grade laptops from high-street retailers. They save £50 upfront but lose thousands in downtime when the cheap hinges snap or the 'Home' edition of Windows refuses to connect to the server.
                     </p>
                     <p className="text-lg text-gray-600 mb-8">
                         As <strong>Dell Premier Partners</strong>, we supply the full <strong>Dell Pro</strong> range - from everyday office laptops to CAD-grade workstations and USB-C hub monitors. We custom-spec every machine to the user's workload, include a <strong>5-Year Onsite Warranty</strong>, and configure it via Intune before it arrives.
                     </p>

                     <ul className="space-y-4">
                         <li className="flex items-start gap-3">
                             <CheckCircle className="text-green-500 shrink-0 mt-1" />
                             <div>
                                 <strong className="block text-neutral">5-Year Onsite Warranty</strong>
                                 <span className="text-sm text-gray-500">If it breaks, a Dell engineer comes to YOUR office the next business day. No sending it away for weeks.</span>
                             </div>
                         </li>
                         <li className="flex items-start gap-3">
                             <CheckCircle className="text-green-500 shrink-0 mt-1" />
                             <div>
                                 <strong className="block text-neutral">Custom-Spec at Better-Than-Retail Pricing</strong>
                                 <span className="text-sm text-gray-500">We access Dell Premier volume pricing and tailor CPU, RAM, and storage to the role - so you never overpay for power you don't need.</span>
                             </div>
                         </li>
                         <li className="flex items-start gap-3">
                             <CheckCircle className="text-green-500 shrink-0 mt-1" />
                             <div>
                                 <strong className="block text-neutral">Zero Bloatware, Zero Touch</strong>
                                 <span className="text-sm text-gray-500">No trial software or ads. Intune & Autopilot configure the device before it arrives - your team just logs in and works.</span>
                             </div>
                         </li>
                         <li className="flex items-start gap-3">
                             <CheckCircle className="text-green-500 shrink-0 mt-1" />
                             <div>
                                 <strong className="block text-neutral">Ubiquiti UniFi Networking</strong>
                                 <span className="text-sm text-gray-500">One unified platform for WiFi, switching, and security. No licence fees, no vendor lock-in - and we manage it all remotely.</span>
                             </div>
                         </li>
                     </ul>
                     <div className="mt-8">
                         <Link to="/services/hardware-procurement" className="bg-accent text-neutral px-8 py-4 rounded-lg font-bold shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all inline-flex items-center gap-2">
                            See the Full Dell & UniFi Range <ArrowRight size={16} />
                         </Link>
                     </div>
                 </div>
                 <div className="relative">
                     <div className="absolute inset-0 bg-linear-to-tr from-primary/20 to-accent/20 rounded-3xl transform rotate-3"></div>
                     <img
                        src="https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/v1764695784/dell_pro_max_laptop.avif"
                        alt="Dell Pro Max Business Laptop"
                        width={800}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        className="relative rounded-3xl shadow-2xl border-4 border-white z-10 w-full"
                     />
                     <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border-l-4 border-accent z-20">
                         <p className="font-heading text-xl text-neutral">Dell Premier Partner</p>
                         <p className="text-xs text-gray-500">Certified Reseller & Support</p>
                     </div>
                 </div>
             </div>
         </div>
      </section>

      {/* Partnered Solutions */}
      <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                  <h2 className="font-heading text-3xl text-neutral mb-4">Infrastructure & Partnered Solutions</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                      Beyond core IT support, we act as your technical liaison for connectivity, printing, and voice solutions.
                      We partner with the best so you never have to sit on hold with a call centre again.
                  </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {additionalServices.map((service, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs hover:border-secondary transition-colors">
                          <h3 className="font-bold text-lg text-neutral mb-2">{service.title}</h3>
                          <p className="text-sm text-gray-600 mb-4">{service.desc}</p>
                          <p className="text-xs text-gray-500 mb-4">{service.detail}</p>
                          <div className="flex flex-wrap gap-2">
                              {service.tags.map((tag: string, tIdx: number) => (
                                  <span key={tIdx} className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded-sm">
                                      {tag}
                                  </span>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      <div className="bg-white">
        <Contact />
      </div>
    </div>
  );
};
