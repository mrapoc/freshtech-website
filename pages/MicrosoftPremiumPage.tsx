
import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Contact } from '../components/Contact';
import { SEO } from '../components/SEO';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Check, Shield, Zap, Smartphone, Cloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LicenseComparator } from '../components/LicenseComparator';

export const MicrosoftPremiumPage = () => {
  const breadcrumbItems = [
    { label: 'Services', href: '/services' },
    { label: 'Microsoft Business Premium' }
  ];

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://fresh-tech.uk/microsoft-business-premium#service",
    "name": "Microsoft 365 Business Premium Migration & Management",
    "description": "Migration and management of Microsoft 365 Business Premium including Defender for Business, Intune device management, and Conditional Access setup for SMBs.",
    "url": "https://fresh-tech.uk/microsoft-business-premium",
    "provider": {
      "@type": "LocalBusiness",
      "@id": "https://fresh-tech.uk/#organization",
      "name": "Fresh Tech IT Support",
      "telephone": "+441584517234"
    },
    "serviceType": "Microsoft 365 License Consulting",
    "category": "IT Support Services",
    "areaServed": [
      { "@type": "AdministrativeArea", "name": "Shropshire" },
      { "@type": "AdministrativeArea", "name": "Herefordshire" },
      { "@type": "AdministrativeArea", "name": "Worcestershire" }
    ],
    "audience": {
      "@type": "BusinessAudience",
      "audienceType": "Small to Medium Businesses"
    },
    "potentialAction": {
      "@type": "OrderAction",
      "target": "https://fresh-tech.uk/contact",
      "name": "Talk to us about Licensing"
    }
  };

  return (
    <div className="bg-white">
      <SEO
        title="Why Microsoft 365 Business Premium?"
        description="Stop paying for disjointed security tools. Discover why Business Premium is the only license your business needs."
        type="service"
        schema={serviceSchema}
        breadcrumbs={breadcrumbItems.map(item => ({
          name: item.label,
          item: item.href || '/microsoft-business-premium'
        }))}
      />
      
      <PageHeader
        title="The One License To Rule Them All"
        subtitle="Why smart businesses are ditching disparate 3rd party tools and standardizing on Microsoft 365 Business Premium."
        highlightText="Business Premium"
      />

      {/* Introduction */}
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <Breadcrumbs items={breadcrumbItems} className="mb-8 justify-center" />
          <h2 className="font-heading text-3xl text-neutral mb-6">Stop Paying Twice for Security</h2>
          <p className="text-lg text-gray-600 mb-8">
              Many businesses start with "Business Standard" for email and Word. Then they buy antivirus from Sophos, spam filtering from Mimecast, and maybe a device management tool.
              Suddenly, you are paying £30+ per user for a disjointed stack of tools that don't talk to each other.
          </p>
          <p className="text-lg text-gray-600">
              <strong>Microsoft 365 Business Premium</strong> bundles enterprise-grade security, device management, and productivity into one subscription. It's cheaper, simpler, and more secure.
          </p>
          
          {/* Interactive Widget */}
          <LicenseComparator />
      </div>

      {/* Comparison Table */}
      <section className="bg-gray-50 py-20 border-y border-gray-200">
          <div className="container mx-auto px-4">
              <h3 className="font-heading text-3xl text-center mb-12">The "Patchwork" Problem</h3>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {/* The Old Way */}
                  <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden opacity-75">
                      <div className="bg-gray-200 p-4 text-center font-bold text-gray-600 uppercase tracking-widest">
                          The Old Way (Separate Tools)
                      </div>
                      <div className="p-6 space-y-4">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                              <span className="text-sm text-gray-600">Microsoft 365 Standard</span>
                              <span className="font-bold">£10.30</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                              <span className="text-sm text-gray-600">3rd Party Antivirus (Sophos/ESET)</span>
                              <span className="font-bold">£3.87</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                              <span className="text-sm text-gray-600">Spam Filtering (Mimecast)</span>
                              <span className="font-bold">£2.61</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                              <span className="text-sm text-gray-600">MFA Tool (Duo)</span>
                              <span className="font-bold">£2.30</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                              <span className="text-sm text-gray-600">Device Management (MDM)</span>
                              <span className="font-bold">£4.73</span>
                          </div>
                      </div>
                      <div className="bg-gray-100 p-6 text-center">
                          <p className="text-sm text-gray-500 mb-1">Total Per User/Month</p>
                          <p className="text-3xl font-heading text-gray-600">£23.81+</p>
                          <p className="text-xs text-red-500 mt-2">Plus 5 different support numbers to call when things break.</p>
                      </div>
                  </div>

                  {/* The Business Premium Way */}
                  <div className="bg-white rounded-xl shadow-2xl border-4 border-primary overflow-hidden transform md:scale-105 z-10">
                      <div className="bg-primary p-4 text-center font-bold text-white uppercase tracking-widest flex items-center justify-center gap-2">
                          <Zap size={18} className="text-yellow-300" /> Business Premium
                      </div>
                      <div className="p-6 space-y-4">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                              <span className="text-sm text-gray-800 font-medium">Office Apps (Word, Excel, Teams)</span>
                              <span className="font-bold text-green-600 flex items-center gap-1"><Check size={14}/> Included</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                              <span className="text-sm text-gray-800 font-medium">Defender for Business (Next-Gen AV)</span>
                              <span className="font-bold text-green-600 flex items-center gap-1"><Check size={14}/> Included</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                              <span className="text-sm text-gray-800 font-medium">Defender for Office 365 (Anti-Phishing)</span>
                              <span className="font-bold text-green-600 flex items-center gap-1"><Check size={14}/> Included</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                              <span className="text-sm text-gray-800 font-medium">Conditional Access (MFA)</span>
                              <span className="font-bold text-green-600 flex items-center gap-1"><Check size={14}/> Included</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                              <span className="text-sm text-gray-800 font-medium">Intune (Device Management)</span>
                              <span className="font-bold text-green-600 flex items-center gap-1"><Check size={14}/> Included</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                              <span className="text-sm text-gray-800 font-medium">Azure Virtual Desktop Rights</span>
                              <span className="font-bold text-green-600 flex items-center gap-1"><Check size={14}/> Included</span>
                          </div>
                      </div>
                      <div className="bg-primary/10 p-6 text-center">
                          <p className="text-sm text-primary font-bold mb-1">Total Per User/Month</p>
                          <p className="text-4xl font-heading text-primary">£18.10*</p>
                          <p className="text-[10px] text-gray-500 mt-2">*Single vendor. Single bill. Integrated support.</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Key Features Grid */}
      <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
              <h3 className="font-heading text-3xl text-center mb-12">3 Game-Changing Features</h3>
              
              <div className="grid md:grid-cols-3 gap-8">
                  <div className="p-6 border border-gray-200 rounded-xl hover:border-primary transition-colors group">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Shield size={24} />
                      </div>
                      <h4 className="font-bold text-lg mb-2">Defender for Business</h4>
                      <p className="text-sm text-gray-600">
                          Enterprise-grade protection against ransomware and zero-day exploits. It talks directly to our support dashboard so we see threats instantly.
                      </p>
                  </div>
                  <div className="p-6 border border-gray-200 rounded-xl hover:border-primary transition-colors group">
                      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Smartphone size={24} />
                      </div>
                      <h4 className="font-bold text-lg mb-2">Intune Device Management</h4>
                      <p className="text-sm text-gray-600">
                          We can wipe lost laptops remotely, push WiFi passwords automatically, and ensure every device is encrypted. Zero-touch setup for new staff.
                      </p>
                  </div>
                  <div className="p-6 border border-gray-200 rounded-xl hover:border-primary transition-colors group">
                      <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Cloud size={24} />
                      </div>
                      <h4 className="font-bold text-lg mb-2">Conditional Access</h4>
                      <p className="text-sm text-gray-600">
                          Smart security. Only allow logins from trusted countries or compliant devices. Block hackers at the front door based on their location.
                      </p>
                  </div>
              </div>
          </div>
      </section>

      <div className="bg-gray-50 py-20 text-center">
          <div className="container mx-auto px-4">
              <h2 className="font-heading text-3xl text-neutral mb-6">Ready to Upgrade?</h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  We can migrate your existing licenses to Business Premium without disruption. 
                  You'll save money and sleep better knowing your business is secured by Microsoft's best technology.
              </p>
              <Link to="/contact" className="bg-accent text-neutral px-8 py-4 rounded-lg font-bold shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all">
                  Talk to us about Licensing
              </Link>
          </div>
      </div>

      <Contact />
    </div>
  );
};
