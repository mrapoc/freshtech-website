import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Contact } from '../components/Contact';
import { SEO } from '../components/SEO';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  Printer,
  PoundSterling,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  BarChart3,
  TrendingDown,
  FileWarning,
  Key,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BookOpen,
  Handshake,
  CircleDollarSign,
  ScrollText,
  Wrench,
  PackageCheck,
  Eye,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ManagedPrintGuidePage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openTrap, setOpenTrap] = useState<number | null>(null);

  const breadcrumbItems = [
    { label: 'Resources', href: '/resources' },
    { label: 'Managed Print Guide' }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const toggleTrap = (index: number) => {
    setOpenTrap(openTrap === index ? null : index);
  };

  const contractTraps = [
    {
      title: "Volume Commitments",
      icon: BarChart3,
      description: "Some suppliers require you to commit to a minimum number of prints per quarter. Fall short and you still pay for the prints you didn't make. Exceed the limit and you're charged at a higher rate. Volume commitments only ever benefit the supplier.",
    },
    {
      title: "Toner Coverage Limitations",
      icon: Eye,
      description: "The agreed cost per page may only cover a certain percentage of an A4 page in toner - sometimes as low as 5%. Any toner used beyond that threshold is charged at an inflated rate. This is rarely explained upfront and can add thousands to your annual costs.",
    },
    {
      title: "Development Meters (Colour Print Trick)",
      icon: CircleDollarSign,
      description: "Some contracts charge per colour, not per colour print. Since a colour printer uses four toner colours (cyan, magenta, yellow, black), each colour page costs you four clicks instead of one. A '5p per colour click' contract actually means 20p per colour page.",
    },
    {
      title: "Termination Clauses",
      icon: Lock,
      description: "Exit penalties are deliberately designed to make leaving more expensive than staying, even when you're overpaying. If you realise mid-contract that you're getting a bad deal, the termination fee ensures you can't walk away without paying through the nose.",
    },
    {
      title: "Automatic Renewal",
      icon: Clock,
      description: "Most lease agreements auto-renew if you don't give written notice within a narrow window - typically 3 to 6 months before the end date. Miss it by a week and you're locked in for another year. These clauses exist for one reason: to catch you out.",
    },
    {
      title: "Hidden Fees",
      icon: FileWarning,
      description: "Network support charges, consumable delivery fees, parts warranty surcharges after year one - we've seen all of these buried in the small print. Individually they look small. Collectively they can add 20-30% to your expected costs.",
    },
    {
      title: "Annual Price Increases",
      icon: TrendingDown,
      description: "Buried in the terms will be a clause allowing the supplier to increase costs each year, often by RPI or a fixed percentage. Over a 5-year contract, compound increases can push your costs significantly above what you originally agreed to.",
    },
  ];

  const faqs = [
    {
      q: "How much does a managed print service cost?",
      a: "It depends entirely on your print volumes, which is why we start with a free print audit. The hardware cost is a one-off purchase (typically spread over 10 interest-free monthly payments). The ongoing service is a simple cost-per-page covering all toner, parts, and engineer callouts. Most businesses find the total cost is significantly lower than what they were spending on ad-hoc toner purchases."
    },
    {
      q: "What if we don't print enough to justify managed print?",
      a: "Then we'll tell you. Honestly. If your print volumes are low and your current setup is working fine, managed print may not make sense. That's exactly what the print audit is designed to establish - we'll only recommend it if the numbers genuinely stack up."
    },
    {
      q: "We're currently in a lease contract. Can you help?",
      a: "Yes. We can review your existing contract, identify the notice period and renewal date, and advise on the most cost-effective exit strategy. Even if the end date is years away, getting it in the diary now means you won't miss the cancellation window and get auto-renewed."
    },
    {
      q: "What brands do you supply?",
      a: "We're not tied to any single manufacturer. Our print partner assesses your requirements and recommends the best device for the job regardless of brand. A small office with light printing gets a different recommendation to a busy accounts department churning through thousands of pages a month."
    },
    {
      q: "What does the service agreement include?",
      a: "Everything except paper. Toner, parts, consumables, labour, callouts, and support are all included in the cost-per-page charge. It's a 12-month rolling agreement - no 5-year lock-ins, no automatic renewals, and you can leave with reasonable notice."
    },
    {
      q: "Is the print audit really free?",
      a: "Yes. We deploy monitoring software that runs in the background for around a month and collects the data. We then analyse it and present the findings. If improvements can be made, we'll show you the numbers. If everything is already in good shape, that's the end of it. No obligation, no pressure."
    },
    {
      q: "Do you cover the whole UK?",
      a: "Yes. Our print partner provides national coverage with direct manufacturer warranty and service. Whether you have one office or multiple sites across the country, you're covered."
    },
    {
      q: "What about printer security?",
      a: "Business-grade managed printers include features that consumer devices don't: secure print release (documents only print when you authenticate at the device), encrypted storage, access controls, and managed firmware updates. We ensure print devices are properly secured as part of the setup."
    },
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "The Ultimate Guide to Managed Print Solutions",
    "description": "Everything you need to know about managed print: hidden costs, lease traps, ownership models, print audits, and how to take control of your business printing costs.",
    "author": {
      "@type": "Organization",
      "name": "Fresh Tech",
      "url": "https://fresh-tech.uk"
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
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <div className="bg-white">
      <SEO
        title="The Ultimate Guide to Managed Print Solutions | Fresh Tech"
        description="Everything you need to know about business printing costs, lease traps, ownership models, and how a print audit can save your business thousands. Free guide from Fresh Tech."
        breadcrumbs={breadcrumbItems.map(item => ({
          name: item.label,
          item: item.href || '/managed-print-guide'
        }))}
        schema={[articleSchema, faqSchema]}
      />

      <PageHeader
        title="The Ultimate Guide to Managed Print"
        subtitle="Everything you need to know about taking control of your business printing costs. No jargon, no hard sell - just honest advice."
        highlightText="Managed Print"
      />

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-8">
        <Breadcrumbs items={breadcrumbItems} className="justify-center" />
      </div>

      {/* Hero / Introduction */}
      <section className="py-12 bg-linear-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Complete Guide</span>
              </div>
              <h2 className="font-heading text-2xl md:text-3xl text-neutral mb-4">
                Printing: The Forgotten Line in Your IT Budget
              </h2>
              <p className="text-gray-600 mb-4">
                Ask most business owners how much they spend on printing and you'll get a blank stare. Yet it's one of the largest
                unmonitored costs in a typical IT budget - and the less you track something, the more it costs.
              </p>
              <p className="text-gray-600 mb-6">
                This guide covers everything from why cheap printers aren't cheap, to how lease contracts
                catch businesses out, to exactly how a print audit works. Whether you're buying toner from Amazon
                or locked into a 5-year copier lease, this will help you make better decisions.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  <PoundSterling className="w-4 h-4" /> Cost Control
                </span>
                <span className="inline-flex items-center gap-1 text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                  <AlertTriangle className="w-4 h-4" /> Lease Traps
                </span>
                <span className="inline-flex items-center gap-1 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  <Search className="w-4 h-4" /> Print Audit
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-2xl transform rotate-3"></div>
              <img
                src="https://res.cloudinary.com/djkmeg5se/image/upload/f_auto,q_auto/managed-print-cost-savings.jpg"
                alt="Business printing cost analysis and managed print solutions"
                width={800}
                height={500}
                loading="lazy"
                decoding="async"
                className="relative rounded-2xl shadow-xl border-4 border-white w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What Is Managed Print? */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
              <Printer className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-heading text-3xl text-neutral mb-4">What Is Managed Print?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Managed print is a complete service that covers your business printing hardware, supplies, and maintenance
              in one package - so you know exactly what printing costs and never have to think about toner again.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <PackageCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Business-Grade Hardware</h3>
              <p className="text-gray-600 text-sm">
                Printers and copiers built for business workloads, not consumer devices repackaged with a higher price tag.
                The right device for your actual print volumes, regardless of brand.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">All-Inclusive Service</h3>
              <p className="text-gray-600 text-sm">
                Toner, parts, consumables, labour, and callouts all included. You just add paper.
                When something goes wrong, a qualified engineer is a phone call away - with national coverage.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Monitored Costs</h3>
              <p className="text-gray-600 text-sm">
                A simple cost-per-page model means you always know what printing costs. No more surprise toner orders,
                no more ad-hoc purchases on Amazon, and no more guessing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Hidden Cost of Cheap Printers */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <PoundSterling className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="font-heading text-3xl text-neutral mb-4">The Hidden Cost of Cheap Printers</h2>
            <p className="text-lg text-gray-600">
              That printer you bought for under a hundred pounds was designed to be cheap to buy and expensive to run.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xs border border-gray-200 mb-8">
            <h3 className="font-bold text-xl mb-6 text-neutral">The Razor-and-Blades Problem</h3>
            <p className="text-gray-600 mb-6">
              Printer manufacturers sell hardware at razor-thin margins (some even at a loss) because the real money is
              in consumables. A set of replacement toner cartridges for a typical desktop colour printer can cost more
              than the printer itself. Over two to three years, you might spend five to ten times the purchase price on toner alone.
            </p>

            <div className="bg-red-50 rounded-xl p-6 mb-6">
              <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Real Example: The Numbers Behind a 'Cheap' Printer
              </h4>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-lg p-4">
                  <p className="font-semibold text-gray-800 mb-2">HP OfficeJet Pro 8720</p>
                  <p className="text-gray-600">Mono cost per page: <strong>1.67p</strong></p>
                  <p className="text-gray-600">Colour cost per page: <strong>8.80p</strong></p>
                  <p className="text-gray-600 mt-2">Monthly print cost at average volumes: <strong>~£199</strong></p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="font-semibold text-gray-800 mb-2">HP OfficeJet Pro 9010</p>
                  <p className="text-gray-600">Mono cost per page: <strong>1.80p</strong></p>
                  <p className="text-gray-600">Colour cost per page: <strong>6.41p</strong></p>
                  <p className="text-gray-600 mt-2">Monthly print cost at average volumes: <strong>~£91</strong></p>
                </div>
              </div>
              <p className="text-red-700 font-semibold mt-4">
                Combined annual running cost: £3,481 - for two printers that cost under £200 each to buy.
              </p>
            </div>

            <div className="bg-green-50 rounded-xl p-6">
              <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> The Same Workload on a Managed Device
              </h4>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-gray-500 mb-1">Mono cost per page</p>
                  <p className="text-2xl font-bold text-green-700">0.8p</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-gray-500 mb-1">Colour cost per page</p>
                  <p className="text-2xl font-bold text-green-700">5p</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-gray-500 mb-1">Annual running cost</p>
                  <p className="text-2xl font-bold text-green-700">£1,939</p>
                </div>
              </div>
              <p className="text-green-700 font-semibold mt-4">
                Annual saving: £1,542. Over five years: £7,710. The hardware pays for itself within 18 months.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ownership vs Leasing */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
              <Key className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="font-heading text-3xl text-neutral mb-4">Ownership vs Leasing: The Full Picture</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Over 80% of businesses lease their printing equipment. We think most of them shouldn't.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Leasing */}
            <div className="bg-white rounded-xl p-8 shadow-xs border border-red-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-bold text-xl text-red-700">The Typical Lease Model</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">You never own the equipment</span>
                    <p className="text-gray-600 text-sm">At the end of 5 years of payments, the leasing company collects the device (at your expense) and you start over</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">You pay far more than the device is worth</span>
                    <p className="text-gray-600 text-sm">The leasing company pays the dealer upfront, then charges you the capital cost plus interest, admin fees, insurance, and more</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">You're forced to upgrade on their schedule</span>
                    <p className="text-gray-600 text-sm">Most leased devices would happily run for 8-10 years, but the lease forces replacement at year 5 whether you need it or not</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Walking away is deliberately expensive</span>
                    <p className="text-gray-600 text-sm">Termination clauses ensure that even when you know you're overpaying, it costs more to leave than to stay</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Ownership */}
            <div className="bg-white rounded-xl p-8 shadow-xs border border-green-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-xl text-green-700">Our Ownership Model</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">You own the device outright</span>
                    <p className="text-gray-600 text-sm">Pay once (or over 10 interest-free monthly instalments) and it's yours. No lease, no residual value games</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Run it for as long as it works</span>
                    <p className="text-gray-600 text-sm">Business-grade devices last the best part of a decade. Replace it when you need to, not when a contract tells you to</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">0% interest purchase plan available</span>
                    <p className="text-gray-600 text-sm">Spread the cost over 10 monthly payments with no deposit and no third-party finance company involved</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">12-month rolling service - no lock-in</span>
                    <p className="text-gray-600 text-sm">A simple service agreement covering toner, parts, and callouts. Leave with reasonable notice if you're not happy</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Lease Case Study */}
          <div className="bg-amber-50 rounded-2xl p-8 border border-amber-200">
            <div className="flex items-center gap-3 mb-4">
              <ScrollText className="w-6 h-6 text-amber-700" />
              <h3 className="font-bold text-xl text-amber-900">Case Study: The £40,000 Copier Lease</h3>
            </div>
            <p className="text-gray-700 mb-4">
              A business approached us coming into the last year of a 5-year copier lease. They had two HP Color LaserJet MFPs
              on a lease costing £2,000 per quarter (£1,000 per machine). Over the full 5-year term, they would have spent
              <strong> £40,000</strong> on two copiers they didn't even own at the end.
            </p>
            <p className="text-gray-700 mb-4">
              The equivalent devices through us would cost approximately £3,500 each to purchase outright - roughly £7,000 total.
              The customer used our 0% purchase plan to spread the cost over 10 months. Once paid, they own the equipment and
              can run it for as long as it serves them.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-gray-500 text-sm mb-1">5-year lease cost</p>
                <p className="text-2xl font-bold text-red-600">£40,000</p>
                <p className="text-gray-500 text-xs mt-1">Owned nothing at the end</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-gray-500 text-sm mb-1">Purchase cost</p>
                <p className="text-2xl font-bold text-green-600">~£7,000</p>
                <p className="text-gray-500 text-xs mt-1">Owned outright</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-gray-500 text-sm mb-1">Saving</p>
                <p className="text-2xl font-bold text-primary">£33,000</p>
                <p className="text-gray-500 text-xs mt-1">Over the lease term</p>
              </div>
            </div>
            <p className="text-amber-800 text-sm mt-6">
              The business also moved from a 5-year service contract to a 12-month rolling agreement. No more being
              handcuffed to a supplier. They didn't even need new equipment - the existing devices had years of life left.
              They were only being replaced because the lease was up.
            </p>
          </div>
        </div>
      </section>

      {/* Contract Traps - What to Watch Out For */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <FileWarning className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="font-heading text-3xl text-neutral mb-4">What to Watch Out For in Print Contracts</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The print industry has a tarnished reputation for good reason. If something looks too good to be true, it probably is.
              Here are the tactics to be aware of.
            </p>
          </div>

          <div className="space-y-3">
            {contractTraps.map((trap, index) => {
              const IconComponent = trap.icon;
              return (
                <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleTrap(index)}
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                      <IconComponent className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="font-semibold text-neutral flex-1">{trap.title}</span>
                    {openTrap === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {openTrap === index && (
                    <div className="px-5 pb-5 pl-19">
                      <p className="text-gray-600 ml-14">{trap.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 bg-primary/5 rounded-xl p-6 border border-primary/20">
            <p className="text-gray-700">
              <strong>Our position:</strong> We publish clear pricing, use 12-month rolling service agreements, don't require volume
              commitments, and don't hide fees in the small print. If that sounds different to what you're used to, it's because it is.
              Read more about our approach on our{' '}
              <Link to="/services/managed-print" className="text-primary hover:underline font-semibold">
                managed print service page
              </Link>.
            </p>
          </div>
        </div>
      </section>

      {/* How the Print Audit Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <Search className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="font-heading text-3xl text-neutral mb-4">How Our Free Print Audit Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Not sure if managed print would benefit your business? The print audit is the fastest way to find out.
              No cost, no commitment - just data.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg z-10">
                1
              </div>
              <div className="bg-blue-50 rounded-xl p-6 pt-8 h-full border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Printer className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-3">Monitor</h3>
                <p className="text-gray-600 text-sm">
                  We deploy an intelligent monitoring agent to your network. It identifies every printing device you're
                  running and begins tracking usage data - how much each device prints, in colour and mono, and the
                  associated costs. This runs quietly in the background for around four weeks.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg z-10">
                2
              </div>
              <div className="bg-blue-50 rounded-xl p-6 pt-8 h-full border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-3">Analyse</h3>
                <p className="text-gray-600 text-sm">
                  Our print specialists analyse the collected data, break down the running costs of your current
                  equipment, and build a comprehensive report on your current situation. This includes cost per page,
                  total monthly and annual expenditure, and where waste is occurring.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg z-10">
                3
              </div>
              <div className="bg-blue-50 rounded-xl p-6 pt-8 h-full border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingDown className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-3">Improve</h3>
                <p className="text-gray-600 text-sm">
                  We present the findings to you. If improvements can be made, we'll have real facts and figures to
                  back it up, along with detailed recommendations. If your setup is already in good shape, we'll tell
                  you that too. No pressure, no obligation.
                </p>
              </div>
            </div>
          </div>

          {/* What the report covers */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="font-bold text-xl mb-6 text-center">What the Print Audit Report Covers</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: PoundSterling, text: "Current equipment running costs" },
                { icon: BarChart3, text: "Full usage report by device" },
                { icon: Printer, text: "Detailed print volume breakdown" },
                { icon: CircleDollarSign, text: "Average annual consumable spend" },
                { icon: TrendingDown, text: "Recommendations for improvement" },
                { icon: CheckCircle, text: "Projected savings with managed print" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-4">
                    <Icon className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-gray-700 text-sm font-medium">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
              <ShieldCheck className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="font-heading text-3xl text-neutral mb-4">The Security Side of Print</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Printers are network devices. An unsecured printer is a genuine entry point for attackers.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xs border border-gray-200 mb-8">
            <p className="text-gray-600 mb-4">
              In 2020, ethical hacking group CyberNews demonstrated this by remotely accessing nearly 28,000 unsecured
              printers worldwide. These weren't sophisticated attacks - they simply found devices exposed to the internet
              with no security configured.
            </p>
            <p className="text-gray-600 mb-6">
              Consumer printers typically have no meaningful security features. Business-grade managed devices include
              protections that most businesses don't know they need until it's too late.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Lock, title: "Secure Print Release", desc: "Documents only print when the user authenticates at the device. No more sensitive papers left in the output tray." },
                { icon: ShieldCheck, title: "Encrypted Storage", desc: "Documents held in the printer's memory are encrypted, protecting data at rest." },
                { icon: Key, title: "Access Controls", desc: "Restrict who can print, copy, scan, and access device settings." },
                { icon: Wrench, title: "Managed Firmware Updates", desc: "Firmware is kept up to date as part of the service, closing known vulnerabilities." },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="bg-purple-50 rounded-lg p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-neutral">{item.title}</h4>
                    </div>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">
              If you're working towards{' '}
              <Link to="/services/cyber-essentials" className="text-primary hover:underline font-semibold">Cyber Essentials</Link>
              {' '}certification or improving your overall{' '}
              <Link to="/services/cybersecurity" className="text-primary hover:underline font-semibold">cyber security</Link>
              {' '}posture, your print devices should be part of that conversation.
            </p>
          </div>
        </div>
      </section>

      {/* What You Get With Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <Handshake className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-heading text-3xl text-neutral mb-4">Our Commitments</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We work with a specialist print partner who shares our approach to honest, transparent business.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "Nothing Hidden Below the Line", desc: "What we quote is what you'll pay. No surprise fees, no hidden clauses, no inflated charges buried in the small print." },
              { title: "No Long-Term Contracts", desc: "12-month rolling service agreements with easy termination. We'll never ask you to sign a 5-year contract." },
              { title: "No Hard Sell", desc: "If our proposal makes sense, the numbers will speak for themselves. We don't do pressure selling." },
              { title: "Complete Honesty", desc: "If managed print doesn't make financial sense for your business, we'll tell you. We'd rather earn your trust than take your money for something you don't need." },
              { title: "Qualified Engineers", desc: "Direct manufacturer warranty with nationally covered, fully qualified engineers trained on the specific equipment you have." },
              { title: "No Brand Loyalty", desc: "The right device for the job, regardless of manufacturer. Recommendations based on your needs, not our commission structure." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-green-50 rounded-lg p-5">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-neutral">{item.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl text-neutral mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-neutral pr-4">{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-600">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="font-heading text-3xl text-neutral mb-4">Ready to Find Out What Printing Really Costs You?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Our free print audit takes the guesswork out of print costs. We'll deploy monitoring software, collect the data,
            and give you a clear picture of what you're spending - with recommendations only if the numbers justify it.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-lg transition-colors shadow-lg"
            >
              Request a Free Print Audit <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/services/managed-print"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-primary font-semibold px-8 py-4 rounded-lg transition-colors border-2 border-primary"
            >
              View Managed Print Service <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <Contact />
    </div>
  );
};
