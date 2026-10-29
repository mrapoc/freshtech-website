import { formatMinutes } from '../utils/publicMetrics';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { serviceDetails, faqCategories, caseStudies } from '../data/content';
import { Contact } from '../components/Contact';
import { Faq } from '../components/Faq';
import { SEO } from '../components/SEO';
import { CheckCircle, AlertTriangle, ArrowRight, ChevronDown, ChevronUp, ArrowDown, Users, Smartphone, Lock, Rocket, Scale, Smile, Activity, List, Shield, Moon, MapPin, ShieldCheck, Briefcase, Wrench, TrendingDown, History, Share2, FileX, UserCheck, Phone, Clock, MessageSquare, Zap, FileText, ShoppingCart, Truck, CloudLightning, Package, Power, XCircle, Monitor, Timer, RefreshCw, Cpu, Network, Wifi, Award, Database, Server, Globe, Layers, Radio, Cable, ChevronRight, Star, BadgeCheck } from 'lucide-react';
import { CyberReadinessQuiz } from '../components/CyberReadinessQuiz';
import { DowntimeCalculator } from '../components/DowntimeCalculator';
import { RemoteWorkQuiz } from '../components/RemoteWorkQuiz';
import { BackupConfidenceQuiz } from '../components/BackupConfidenceQuiz';
import { EmailSecurityQuiz } from '../components/EmailSecurityQuiz';
import { useLiveStats } from '../components/LiveStats';
import { SmartImage } from '../components/SmartImage';
import { RichText } from '../components/RichText';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useInView } from '../hooks/useInView';

const SalaryComparisonVisual = () => (
    <div className="bg-white rounded-2xl shadow-xl border-4 border-neutral overflow-hidden my-12 transform transition-all hover:shadow-2xl">
        <div className="bg-neutral p-6 text-center text-white relative">
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#2B7AB1 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
             <h3 className="font-heading text-2xl md:text-3xl relative z-10">Hiring Internal IT vs. Fresh Tech Alliance</h3>
        </div>
        
        <div className="grid md:grid-cols-2">
            {/* Left: Internal IT (Red) */}
            <div className="p-8 bg-red-50/50 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col justify-end">
                <div className="mb-8 text-center">
                    <div className="inline-block bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3">The Old Way</div>
                    <h4 className="font-bold text-gray-700 text-xl mb-1">1 Internal IT Hire</h4>
                    <div className="text-4xl font-heading text-red-600">£48,000+ <span className="text-base text-gray-500 font-sans font-normal">/ yr</span></div>
                    <p className="text-xs text-gray-400 mt-2">Source: Payscale UK Average IT Manager Salary</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                        <XCircle className="text-red-500 shrink-0" size={18} />
                        <span>Single point of failure (Sickness/Holiday)</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                        <XCircle className="text-red-500 shrink-0" size={18} />
                        <span>Limited skillset (One person's knowledge)</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                        <XCircle className="text-red-500 shrink-0" size={18} />
                        <span>Tools (RMM/AV) cost extra</span>
                    </li>
                </ul>

                {/* The Red Bar */}
                <div className="w-full bg-gray-200 rounded-t-lg h-48 relative overflow-hidden mx-auto max-w-[120px]">
                    <div className="absolute bottom-0 left-0 w-full h-full bg-red-500 flex items-end justify-center pb-2 transition-all duration-1000 ease-out" style={{ height: '100%' }}>
                       <span className="text-white font-bold text-xs opacity-80 mb-2">High Cost</span>
                    </div>
                </div>
            </div>

            {/* Right: Fresh Tech (Green) */}
            <div className="p-8 bg-green-50/50 flex flex-col justify-end">
                <div className="mb-8 text-center">
                    <div className="inline-block bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3">The Smart Way</div>
                    <h4 className="font-bold text-gray-700 text-xl mb-1">Fresh Tech Alliance</h4>
                    <div className="text-3xl font-heading text-green-600">Lower Investment</div>
                    <p className="text-xs text-gray-400 mt-2">Fixed Monthly Fee</p>
                </div>

                <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                        <CheckCircle className="text-green-600 shrink-0" size={18} />
                        <span><strong>More Value:</strong> Enterprise tools included</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                        <CheckCircle className="text-green-600 shrink-0" size={18} />
                        <span><strong>More Knowledge:</strong> A full team of experts</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                        <CheckCircle className="text-green-600 shrink-0" size={18} />
                        <span><strong>Redundancy:</strong> Never off sick, never on holiday</span>
                    </li>
                </ul>

                {/* The Green Bar */}
                <div className="w-full bg-gray-200 rounded-t-lg h-48 relative overflow-hidden mx-auto max-w-[120px] flex items-end">
                    <div className="w-full bg-green-500 flex items-end justify-center pb-1 rounded-t-sm shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-all duration-1000 ease-out" style={{ height: '15%' }}>
                    </div>
                    <div className="absolute bottom-8 left-0 w-full text-center">
                        <span className="text-green-700 font-bold text-xs">Smart Value</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-gray-100 p-4 text-center border-t border-gray-200">
             <p className="text-gray-600 italic font-medium">"Compare the green bar to the red bar. That is smart business."</p>
        </div>
    </div>
);

const SupportWorkflow = () => {
  const { stats, loading } = useLiveStats();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Cache geometry for performance
  const metrics = useRef({ top: 0, height: 0, windowHeight: 0 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => { if (sectionRef.current) observer.unobserve(sectionRef.current); };
  }, []);

  // Measure on mount/resize
  useEffect(() => {
    const measure = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        metrics.current = {
          top: rect.top + scrollTop,
          height: rect.height,
          windowHeight: window.innerHeight
        };
      }
    };
    
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    return () => {
        window.removeEventListener('resize', measure);
        window.removeEventListener('load', measure);
    }
  }, []);

  // Optimized Scroll Listener
  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const { top, height, windowHeight } = metrics.current;
      
      if (height === 0) {
          ticking = false;
          return;
      }
      
      const scrollTop = window.scrollY;
      const rectTop = top - scrollTop;
      
      const startOffset = windowHeight * 0.8;
      const endOffset = windowHeight * 0.2;
      const totalDistance = height + startOffset - endOffset;
      const scrolledDistance = startOffset - rectTop;
      
      let progress = scrolledDistance / totalDistance;
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;
      
      setScrollProgress(progress);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateProgress();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getWaitTime = () => formatMinutes(stats?.CallWaitTimeInMinutes, loading);

  const getResponseTime = () => formatMinutes(stats?.AverageResponseTimeLast30DaysMinutes, loading);

  return (
    <section ref={sectionRef} className="py-20 bg-secondary/10 border-y-4 border-neutral border-dashed overflow-hidden">
      <div className="container mx-auto px-4">
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="font-heading text-4xl text-neutral mb-4">Lifecycle of a Ticket</h2>
          <p className="text-gray-600">From "Oh no!" to "All fixed!" in record time.</p>
        </div>
        
        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-gray-300 z-0 rounded-full"></div>
          
          {/* Animated Progress Line */}
          <div 
             className="hidden md:block absolute top-12 left-0 h-1 bg-primary z-0 rounded-full transition-all duration-200 ease-out"
             style={{ width: `${scrollProgress * 100}%` }}
          ></div>

          <div className="grid md:grid-cols-4 gap-8 relative z-10">
             {/* Step 1 */}
             <div className={`flex flex-col items-center text-center group transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className={`w-24 h-24 bg-white rounded-full border-4 flex items-center justify-center mb-6 transition-all duration-500 relative z-10 ${scrollProgress > 0.1 ? 'border-primary scale-110 shadow-comic' : 'border-neutral'}`}>
                   <MessageSquare size={32} className="text-primary" />
                   <div className="absolute -top-2 -right-2 bg-highlight text-neutral font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-neutral">1</div>
                   {/* Live Stat Badge */}
                   <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-xs border border-green-200 flex items-center gap-1">
                       <Phone size={10} /> {getWaitTime()}
                   </div>
                </div>
                <h3 className="font-heading text-xl mb-2 mt-4">You Log It</h3>
                <p className="text-sm text-gray-600">Email, Portal, or Phone. We pick it up instantly.</p>
             </div>

             {/* Step 2 */}
             <div className={`flex flex-col items-center text-center group transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className={`w-24 h-24 bg-white rounded-full border-4 flex items-center justify-center mb-6 transition-all duration-500 relative z-10 ${scrollProgress > 0.35 ? 'border-accent scale-110 shadow-comic' : 'border-neutral'}`}>
                   <Timer size={32} className="text-accent" />
                   <div className="absolute -top-2 -right-2 bg-highlight text-neutral font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-neutral">2</div>
                   {/* Live Stat Badge */}
                   <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-xs border border-blue-200 flex items-center gap-1">
                       <Clock size={10} /> {getResponseTime()}
                   </div>
                </div>
                <h3 className="font-heading text-xl mb-2 mt-4">We Triage It</h3>
                <p className="text-sm text-gray-600">Within 15 mins, an engineer is assigned and investigating.</p>
             </div>

             {/* Step 3 */}
             <div className={`flex flex-col items-center text-center group transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className={`w-24 h-24 bg-white rounded-full border-4 flex items-center justify-center mb-6 transition-all duration-500 relative z-10 ${scrollProgress > 0.6 ? 'border-secondary scale-110 shadow-comic' : 'border-neutral'}`}>
                   <Monitor size={32} className="text-secondary" />
                   <div className="absolute -top-2 -right-2 bg-highlight text-neutral font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-neutral">3</div>
                </div>
                <h3 className="font-heading text-xl mb-2 mt-4">Remote Fix</h3>
                <p className="text-sm text-gray-600">90% of issues are fixed remotely via screen share.</p>
             </div>

             {/* Step 4 */}
             <div className={`flex flex-col items-center text-center group transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className={`w-24 h-24 bg-white rounded-full border-4 flex items-center justify-center mb-6 transition-all duration-500 relative z-10 ${scrollProgress > 0.85 ? 'border-neutral scale-110 shadow-comic' : 'border-neutral'}`}>
                   <Truck size={32} className="text-neutral" />
                   <div className="absolute -top-2 -right-2 bg-highlight text-neutral font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-neutral">4</div>
                </div>
                <h3 className="font-heading text-xl mb-2 mt-4">Onsite Backup</h3>
                <p className="text-sm text-gray-600">If it's hardware, we deploy an engineer to your office.</p>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const HardwareWorkflow = () => (
    <section className="py-20 bg-secondary/10 border-y-4 border-neutral border-dashed overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl text-neutral mb-4">The Procurement Process</h2>
          <p className="text-gray-600">From order to desk in 4 simple steps.</p>
        </div>
        
        <div className="relative">
          <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-gray-300 z-0"></div>
  
          <div className="grid md:grid-cols-4 gap-8 relative z-10">
             {/* Step 1 */}
             <div className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 bg-white rounded-full border-4 border-neutral shadow-comic flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10">
                   <ShoppingCart size={32} className="text-primary" />
                   <div className="absolute -top-2 -right-2 bg-highlight text-neutral font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-neutral">1</div>
                </div>
                <h3 className="font-heading text-xl mb-2">Quote & Order</h3>
                <p className="text-sm text-gray-600">You confirm the spec. We place the order with Dell.</p>
             </div>
  
             {/* Step 2 */}
             <div className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 bg-white rounded-full border-4 border-neutral shadow-comic flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10">
                   <CloudLightning size={32} className="text-accent" />
                   <div className="absolute -top-2 -right-2 bg-highlight text-neutral font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-neutral">2</div>
                </div>
                <h3 className="font-heading text-xl mb-2">Intune Prep</h3>
                <p className="text-sm text-gray-600">We configure your software profile in the cloud.</p>
             </div>
  
             {/* Step 3 */}
             <div className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 bg-white rounded-full border-4 border-neutral shadow-comic flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10">
                   <Package size={32} className="text-secondary" />
                   <div className="absolute -top-2 -right-2 bg-highlight text-neutral font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-neutral">3</div>
                </div>
                <h3 className="font-heading text-xl mb-2">Delivery</h3>
                <p className="text-sm text-gray-600">Secure courier delivery to your office or home.</p>
             </div>
  
             {/* Step 4 */}
             <div className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 bg-white rounded-full border-4 border-neutral shadow-comic flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10">
                   <Power size={32} className="text-neutral" />
                   <div className="absolute -top-2 -right-2 bg-highlight text-neutral font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-neutral">4</div>
                </div>
                <h3 className="font-heading text-xl mb-2">Power Up</h3>
                <p className="text-sm text-gray-600">User logs in. Apps install automatically. Ready to work.</p>
             </div>
          </div>
        </div>
      </div>
    </section>
);

// Dell Pro Range Showcase - expert-level product guide
const DellProShowcase: React.FC<{ dellRange: any[], dellMonitors: any[] }> = ({ dellRange, dellMonitors }) => {
  const tierColors: Record<string, string> = {
    'Base': 'from-blue-500 to-blue-600',
    'Plus': 'from-indigo-500 to-indigo-600',
    'Premium': 'from-purple-500 to-purple-600',
    'Workstation': 'from-orange-500 to-red-500'
  };
  const tierBorders: Record<string, string> = {
    'Base': 'border-blue-200 hover:border-blue-400',
    'Plus': 'border-indigo-200 hover:border-indigo-400',
    'Premium': 'border-purple-200 hover:border-purple-400',
    'Workstation': 'border-orange-200 hover:border-orange-400'
  };
  const iconMap: Record<string, React.ElementType> = { Briefcase, Monitor, Award, Cpu };

  return (
    <section className="py-20 bg-white" id="dell-range">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-1.5 font-bold text-xs uppercase tracking-widest rounded-full mb-4">
            <Star size={14} /> Dell Premier Partner
          </div>
          <h2 className="font-heading text-4xl text-neutral mb-4">The Dell Pro Range - Explained</h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            Dell simplified their business lineup in 2025. The old Latitude, OptiPlex, and Precision names are gone - replaced by a clearer tiered system. Here's our honest guide to which tier fits which role, so you never overpay or underspec.
          </p>
        </div>

        {/* Knowledge-sharing intro */}
        <div className="max-w-3xl mx-auto mb-16 bg-gray-50 p-6 rounded-xl border border-gray-100">
          <p className="text-gray-600 text-sm leading-relaxed">
            <strong className="text-neutral">A note from our team:</strong> We believe in transparency. Below you'll find the same spec guidance we use internally when quoting hardware. We'd rather you understood exactly what you're buying and why - even if you end up buying elsewhere. That's how we build trust.
          </p>
        </div>

        {/* Dell Pro Tiers */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20">
          {dellRange.map((tier: any, idx: number) => {
            const Icon = iconMap[tier.icon] || Briefcase;
            return (
              <div key={idx} className={`bg-white rounded-2xl border-2 ${tierBorders[tier.tier]} shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden group`}>
                {/* Tier Header */}
                <div className={`bg-linear-to-r ${tierColors[tier.tier]} p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">
                        {tier.tier === 'Workstation' ? 'Dell Pro Max' : `Dell Pro ${tier.tier}`}
                      </div>
                      <h3 className="font-heading text-2xl">{tier.name} {tier.tier}</h3>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-xs">
                      <Icon size={28} />
                    </div>
                  </div>
                  <p className="text-white/80 text-xs mt-2">Formerly: {tier.formerly}</p>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="inline-block bg-gray-100 text-neutral px-3 py-1 rounded-full text-xs font-bold mb-4">
                    {tier.idealFor}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">{tier.description}</p>

                  {/* Key Specs */}
                  <div className="mb-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Key Specifications</h4>
                    <div className="space-y-2">
                      {tier.specs.map((spec: string, sIdx: number) => (
                        <div key={sIdx} className="flex items-center gap-2 text-sm">
                          <ChevronRight size={14} className="text-primary shrink-0" />
                          <span className="text-gray-700">{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Best For */}
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-green-700 mb-2">We recommend this for</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {tier.bestFor.map((use: string, uIdx: number) => (
                        <div key={uIdx} className="flex items-start gap-2 text-sm">
                          <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
                          <span className="text-gray-700">{use}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dell Monitors Section */}
        <div className="mb-8">
          <div className="text-center mb-12">
            <h3 className="font-heading text-3xl text-neutral mb-4">Dell Pro & UltraSharp Monitors</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A single USB-C cable charges your laptop, drives the display, and connects your peripherals. No docking station needed. Here are the monitors we deploy most often.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dellMonitors.map((monitor: any, idx: number) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{monitor.size}</span>
                  <span className="text-xs text-gray-400 font-mono">{monitor.resolution}</span>
                </div>
                <h4 className="font-heading text-lg text-neutral mb-2 leading-tight">{monitor.name}</h4>
                <div className="text-xs text-gray-500 mb-3 font-mono bg-white px-2 py-1 rounded-sm border border-gray-100 inline-block">{monitor.panel}</div>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{monitor.features}</p>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-700 leading-relaxed"><strong>Ideal for:</strong> {monitor.idealFor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// UniFi Networking Showcase - complete stack guide
const UniFiShowcase: React.FC<{ unifiRange: any }> = ({ unifiRange }) => {
  const categoryConfig: Record<string, { title: string; subtitle: string; icon: React.ElementType; color: string; bgColor: string }> = {
    gateways: { title: 'Security Gateways', subtitle: 'Your network\'s brain and firewall - the central command for everything.', icon: Globe, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    switches: { title: 'Managed Switches', subtitle: 'The backbone connecting every desk, AP, and camera via PoE.', icon: Layers, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    accessPoints: { title: 'WiFi 7 Access Points', subtitle: 'Enterprise wireless coverage, zero dead spots.', icon: Radio, color: 'text-violet-600', bgColor: 'bg-violet-50' }
  };

  return (
    <section className="py-20 bg-neutral text-white relative overflow-hidden" id="unifi-range">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2B7AB1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-highlight px-4 py-1.5 font-bold text-xs uppercase tracking-widest rounded-full mb-4 border border-white/10">
            <Wifi size={14} /> Ubiquiti UniFi Specialists
          </div>
          <h2 className="font-heading text-4xl text-white mb-4">The UniFi Stack - Our Pick for Every SMB</h2>
          <p className="text-gray-300 max-w-3xl mx-auto text-lg">
            We run UniFi on our own network. We deploy it for our clients. Here's the complete product lineup we recommend, why we chose each model, and how they fit together into one unified, manageable network.
          </p>
        </div>

        {/* Why unified matters */}
        <div className="max-w-3xl mx-auto mb-16 bg-white/5 backdrop-blur-xs p-6 rounded-xl border border-white/10">
          <h3 className="font-heading text-lg text-highlight mb-3">Why a unified stack matters for your business</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
              <span className="text-gray-300"><strong className="text-white">One dashboard</strong> for your entire network - gateway, switches, and WiFi. No juggling three vendor portals.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
              <span className="text-gray-300"><strong className="text-white">No licence fees</strong> - unlike Cisco Meraki, you buy UniFi hardware once. No annual subscriptions to keep it running.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
              <span className="text-gray-300"><strong className="text-white">Remote management</strong> - we troubleshoot your network from our office. Firmware updates, VLAN changes, and diagnostics without a site visit.</span>
            </div>
          </div>
        </div>

        {/* Product Categories */}
        {Object.entries(categoryConfig).map(([key, config]) => {
          const items = unifiRange[key] || [];
          const CategoryIcon = config.icon;

          return (
            <div key={key} className="mb-16 last:mb-0">
              <div className="flex items-center gap-4 mb-8">
                <div className={`${config.bgColor} p-3 rounded-xl`}>
                  <CategoryIcon size={24} className={config.color} />
                </div>
                <div>
                  <h3 className="font-heading text-2xl text-white">{config.title}</h3>
                  <p className="text-gray-400 text-sm">{config.subtitle}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="bg-gray-800/80 backdrop-blur-xs rounded-2xl p-6 border border-gray-700 hover:border-accent/50 transition-all duration-300 group hover:shadow-xl hover:shadow-accent/5">
                    <div className="mb-4">
                      <h4 className="font-heading text-lg text-white group-hover:text-highlight transition-colors">{item.name}</h4>
                      <span className="text-xs text-gray-500 font-mono">{item.model}</span>
                    </div>

                    {/* Quick specs based on category */}
                    <div className="space-y-2 mb-4">
                      {item.throughput && (
                        <div className="flex items-center gap-2 text-sm">
                          <Shield size={12} className="text-green-400" />
                          <span className="text-gray-300">{item.throughput}</span>
                        </div>
                      )}
                      {item.ports && (
                        <div className="flex items-center gap-2 text-sm">
                          <Cable size={12} className="text-blue-400" />
                          <span className="text-gray-300">{item.ports}</span>
                        </div>
                      )}
                      {item.standard && (
                        <div className="flex items-center gap-2 text-sm">
                          <Wifi size={12} className="text-violet-400" />
                          <span className="text-gray-300">{item.standard}</span>
                        </div>
                      )}
                      {item.coverage && (
                        <div className="flex items-center gap-2 text-sm">
                          <Radio size={12} className="text-violet-400" />
                          <span className="text-gray-300">{item.coverage}</span>
                        </div>
                      )}
                      {item.clients && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users size={12} className="text-indigo-400" />
                          <span className="text-gray-300">{item.clients} clients</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white/5 rounded-lg px-3 py-1.5 mb-4 inline-block">
                      <span className="text-xs font-bold text-highlight">{item.idealFor}</span>
                    </div>

                    <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* CTA */}
        <div className="text-center mt-16 bg-linear-to-r from-primary/20 to-accent/20 rounded-2xl p-8 border border-white/10">
          <h3 className="font-heading text-2xl text-white mb-3">Not sure which setup you need?</h3>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">Tell us how many staff you have, how many floors, and whether you need cameras or VoIP - we'll design the right stack and quote it within 24 hours.</p>
          <Link to="/contact" className="bg-accent text-neutral px-8 py-4 rounded-lg font-bold shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all inline-block">
            Get a Free Network Design
          </Link>
        </div>
      </div>
    </section>
  );
};

const FeatureItem: React.FC<{ feature: any }> = ({ feature }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={`bg-white p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer group flex flex-col ${
        isOpen ? 'border-primary shadow-comic' : 'border-gray-100 hover:border-primary/50 hover:shadow-lg'
      }`}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className={`font-heading text-xl mb-2 transition-colors ${isOpen ? 'text-primary' : 'text-neutral'}`}>
            {feature.title}
          </h3>
          <p className="text-gray-600 font-medium text-sm md:text-base">
            <RichText text={feature.desc} />
          </p>
          {/* Explicit Read More Indicator */}
          {!isOpen && (
              <span className="text-primary text-xs font-bold uppercase tracking-wider mt-3 inline-flex items-center gap-1 border-b-2 border-transparent group-hover:border-primary transition-colors">
                  Read More <ChevronDown size={14} />
              </span>
          )}
        </div>
        <button
          className={`shrink-0 p-2 rounded-full transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            isOpen ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
          }`}
          aria-expanded={isOpen}
          aria-label={isOpen ? `Collapse ${feature.title}` : `Expand ${feature.title}`}
        >
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      
      <div 
        className={`grid transition-[grid-template-rows,opacity,padding] duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-gray-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="text-gray-600 text-sm leading-relaxed mb-3">
            <RichText text={feature.extendedDesc} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ServiceDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  // Handle fallback gracefully if slug is missing or invalid
  const service = serviceDetails[slug || ''] || serviceDetails['managed-it-support'];

  // Hooks must run unconditionally, before any early return, to keep hook
  // order stable across renders.
  const [problemRef, problemInView] = useInView(0.15);
  const [featuresRef, featuresInView] = useInView(0.05);
  const [deepDiveRef, deepDiveInView] = useInView(0.1);
  const [caseStudyRef, caseStudyInView] = useInView(0.1);
  const [quizRef, quizInView] = useInView(0.1);

  if (!service && slug) {
    return <Navigate to="/404" />;
  }

  const iconMap: Record<string, React.ElementType> = {
      Smartphone, Lock, Rocket, Scale, Smile, Activity, Users, List, Shield, Moon, MapPin, ShieldCheck, Briefcase, Wrench, TrendingDown, History, Share2, FileX, UserCheck, Monitor, FileText, RefreshCw, Cpu, Network, Wifi, Award, Database, Server, Globe, Layers, Radio, Cable
  };

  const getFaqCategoryNames = (s: string) => {
    switch(s) {
      case 'managed-it-support': return ['General IT Support', 'Support Experience', 'Onboarding & Transition'];
      case 'cybersecurity': return ['Cyber Security & Compliance'];
      case 'cyber-essentials': return ['Cyber Essentials Process'];
      case 'hardware-procurement': return ['Service & Coverage'];
      case 'strategic-projects': return ['Growth & Strategy', 'Onboarding & Transition'];
      case 'managed-print': return ['Managed Print'];
      default: return ['General IT Support'];
    }
  }

  const faqCategoryNames = getFaqCategoryNames(slug || '');
  
  // Extract specific FAQ items for Schema
  const relevantFaqs = faqCategories
    .filter(cat => faqCategoryNames.includes(cat.title))
    .flatMap(cat => cat.items);

  const scrollToFeatures = () => {
      const element = document.getElementById('features-grid');
      if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
      }
  };

  // Map services to industries they serve - Key for AI search (used in schema)
  const _serviceIndustryMap: Record<string, string[]> = {
    'managed-it-support': ['Legal Services', 'Accountancy', 'Manufacturing', 'Healthcare', 'Professional Services', 'Agriculture', 'Charities', 'Education'],
    'cybersecurity': ['Legal Services', 'Accountancy', 'Healthcare', 'Financial Services', 'Manufacturing'],
    'cloud-solutions': ['Professional Services', 'Legal Services', 'Accountancy', 'Remote Teams'],
    'cyber-essentials': ['Legal Services', 'Manufacturing', 'Healthcare', 'Government Contractors'],
    'backup-disaster-recovery': ['Legal Services', 'Accountancy', 'Manufacturing', 'Healthcare'],
    'hardware-procurement': ['All Industries']
  };

  // Build Service Schema - Enhanced for AI search
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `https://fresh-tech.uk/services/${slug}`,
    "name": service.title,
    "description": service.description,
    "url": `https://fresh-tech.uk/services/${slug}`,
    "provider": {
        "@type": "LocalBusiness",
        "@id": "https://fresh-tech.uk/#organization",
        "name": "Fresh Tech IT Support",
        "telephone": "+441584517234",
        "email": "hello@fresh-tech.uk"
    },
    "serviceType": service.title,
    "category": "IT Support Services",
    "areaServed": [
        { "@type": "AdministrativeArea", "name": "Shropshire" },
        { "@type": "AdministrativeArea", "name": "Herefordshire" },
        { "@type": "AdministrativeArea", "name": "Worcestershire" },
        { "@type": "AdministrativeArea", "name": "Powys" },
        { "@type": "City", "name": "Ludlow" },
        { "@type": "City", "name": "Shrewsbury" },
        { "@type": "City", "name": "Hereford" },
        { "@type": "City", "name": "Telford" }
    ],
    "audience": {
        "@type": "BusinessAudience",
        "audienceType": "Small and Medium Businesses",
        "numberOfEmployees": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 250
        }
    },
    "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": `${service.title} Packages`,
        "itemListElement": service.features?.slice(0, 5).map((f: { title: string; desc: string }, i: number) => ({
            "@type": "Offer",
            "position": i + 1,
            "itemOffered": {
                "@type": "Service",
                "name": f.title,
                "description": f.desc
            }
        })) || []
    },
    "termsOfService": "https://fresh-tech.uk/terms-conditions",
    "availableChannel": {
        "@type": "ServiceChannel",
        "serviceType": "Remote and Onsite Support",
        "servicePhone": "+44-1584-517234",
        "serviceUrl": "https://fresh-tech.uk/contact"
    },
    "serviceOutput": service.tagline,
    "hoursAvailable": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "17:00"
    },
    "potentialAction": {
        "@type": "OrderAction",
        "target": "https://fresh-tech.uk/contact",
        "name": "Request Quote"
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <SEO 
        title={service.title} 
        description={service.metaDesc || service.tagline}
        image={service.heroImage}
        type="service"
        slug={`/services/${slug}`}
        schema={serviceSchema}
        faqs={relevantFaqs}
      />
      
      {/* 1. Hero Section */}
      <div className="relative pt-32 pb-20 md:pb-28 bg-neutral text-white overflow-hidden">
         <div className="absolute inset-0">
             <SmartImage
               src={service.heroImage}
               alt={service.title}
               className="w-full h-full object-cover opacity-30"
               fetchPriority="high" // Critical LCP optimization
             />
             <div className="absolute inset-0 bg-linear-to-r from-neutral via-neutral/90 to-transparent"></div>
         </div>

         <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row gap-12 items-center">
             <div className="flex-1">
                 <Breadcrumbs
                   items={[
                     { label: 'Services', href: '/services' },
                     { label: service.title }
                   ]}
                   variant="light"
                   className="mb-6"
                 />
                 <h1 className="font-heading text-4xl md:text-6xl mb-6 leading-tight">{service.title}</h1>
                 <p className="text-2xl text-highlight font-heading mb-6">{service.tagline}</p>
                 <div className="prose prose-lg text-gray-300 mb-8 max-w-xl">
                      <p><RichText text={service.description} boldColorClass="text-white" /></p>
                 </div>
                 
                 <div className="flex flex-wrap gap-4">
                     <Link to="/contact" className="bg-accent text-neutral px-8 py-4 rounded-lg font-bold shadow-comic border-2 border-neutral hover:shadow-comic-hover hover:translate-y-[2px] transition-all">
                        Get Started
                     </Link>
                     <button onClick={scrollToFeatures} className="bg-white text-neutral border-2 border-neutral px-8 py-4 rounded-lg font-bold shadow-comic-hover hover:shadow-comic hover:translate-y-[-2px] transition-all flex items-center gap-2">
                        View Features <ArrowDown size={18} />
                     </button>
                 </div>
             </div>
             
             {/* Hero Graphic / Stat Box */}
             <div className="md:w-1/3 w-full">
                 <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl relative">
                     <div className="absolute -top-6 -left-6 bg-highlight text-neutral p-4 rounded-full border-4 border-neutral shadow-lg">
                        <Zap size={32} />
                     </div>
                     <h3 className="font-heading text-xl mb-4 text-white">Why Choose Fresh Tech?</h3>
                     <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                           <CheckCircle className="text-green-400 shrink-0 mt-1" size={20} />
                           <span className="text-gray-200 text-sm">No long-term tie-ins required</span>
                        </li>
                        <li className="flex items-start gap-3">
                           <CheckCircle className="text-green-400 shrink-0 mt-1" size={20} />
                           <span className="text-gray-200 text-sm">Local engineers, rapid response</span>
                        </li>
                        <li className="flex items-start gap-3">
                           <CheckCircle className="text-green-400 shrink-0 mt-1" size={20} />
                           <span className="text-gray-200 text-sm">Proactive monitoring included</span>
                        </li>
                     </ul>
                 </div>
             </div>
         </div>
      </div>

      {/* 2. Value Prop Section (Dynamic based on service type) */}
      <div className="container mx-auto px-4">
          {service.valuePropType === 'salary' && <SalaryComparisonVisual />}
          {service.valuePropType === 'breach' && <DowntimeCalculator />}
          {service.valuePropType === 'hardware' && <HardwareWorkflow />}
          {(service.valuePropType === 'project' || service.valuePropType === 'cloud') && <SupportWorkflow />}
      </div>

      {/* 3. Problem / Solution */}
      <section className="py-20 bg-white" ref={problemRef as React.RefObject<HTMLElement>}>
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
              <div className={`bg-red-50 p-8 rounded-2xl border-l-4 border-red-500 transition-all duration-600 ${problemInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
                  <h3 className="font-heading text-2xl text-red-600 mb-4 flex items-center gap-2">
                      <AlertTriangle /> The Problem
                  </h3>
                  <p className="text-gray-700 text-lg leading-relaxed"><RichText text={service.problem} /></p>
              </div>
              <div className={`bg-green-50 p-8 rounded-2xl border-l-4 border-green-500 transition-all duration-600 ${problemInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`} style={{ transitionDelay: '200ms' }}>
                  <h3 className="font-heading text-2xl text-green-600 mb-4 flex items-center gap-2">
                      <CheckCircle /> The Fresh Tech Fix
                  </h3>
                  <p className="text-gray-700 text-lg leading-relaxed"><RichText text={service.solution} /></p>
              </div>
          </div>
      </section>

      {/* 4. Features Grid */}
      <section id="features-grid" className="py-20 bg-gray-50 border-y border-gray-200" ref={featuresRef as React.RefObject<HTMLElement>}>
          <div className="container mx-auto px-4">
              <div className={`text-center mb-16 transition-all duration-700 ${featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                  <h2 className="font-heading text-4xl text-neutral mb-4">Service Features</h2>
                  <p className="text-gray-600">What's included in the package.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  {service.features?.map((feature: any, idx: number) => (
                      <div key={idx} className={`transition-all duration-500 ${featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: `${150 + idx * 100}ms` }}>
                        <FeatureItem feature={feature} />
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* 5. Deep Dive Sections (Optional) */}
      {service.deepDiveSections && service.deepDiveSections.modules && (
          <section className="py-20 bg-white" ref={deepDiveRef as React.RefObject<HTMLElement>}>
              <div className="container mx-auto px-4">
                  <div className="grid md:grid-cols-3 gap-8">
                      {service.deepDiveSections.modules.map((mod: any, idx: number) => {
                          const Icon = iconMap[mod.icon] || CheckCircle;
                          return (
                              <div key={idx} className={`text-center p-8 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-lg hover:border-primary/30 transition-all duration-500 ${deepDiveInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: `${idx * 150}ms` }}>
                                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                                      <Icon size={32} />
                                  </div>
                                  <h3 className="font-heading text-xl mb-3 text-neutral">{mod.title}</h3>
                                  <p className="text-gray-600 text-sm leading-relaxed"><RichText text={mod.content} /></p>
                              </div>
                          )
                      })}
                  </div>
              </div>
          </section>
      )}

      {/* 5b. Dell Pro Range Showcase (Hardware Procurement only) */}
      {service.dellRange && service.dellMonitors && (
        <DellProShowcase dellRange={service.dellRange} dellMonitors={service.dellMonitors} />
      )}

      {/* 5c. UniFi Networking Showcase (Hardware Procurement only) */}
      {service.unifiRange && (
        <UniFiShowcase unifiRange={service.unifiRange} />
      )}

      {/* 6. Related Case Study */}
      {(() => {
        // Map services to relevant case studies
        const serviceCaseStudyMap: Record<string, string[]> = {
          'cybersecurity': ['legal-email-security', 'manufacturing-modernization'],
          'cyber-essentials': ['manufacturing-modernization'],
          'managed-it-support': ['food-production-uptime', 'accountancy-cloud-migration'],
          'cloud-solutions': ['accountancy-cloud-migration', 'architects-hybrid-working'],
          'hardware-procurement': ['food-production-uptime'],
          'strategic-projects': ['care-home-digital-transformation', 'veterinary-wifi-upgrade'],
        };
        const relatedSlugs = serviceCaseStudyMap[slug || ''] || [];
        const relatedStudies = caseStudies.filter(cs => relatedSlugs.includes(cs.slug)).slice(0, 2);

        if (relatedStudies.length === 0) return null;

        return (
          <section className="py-16 bg-gray-50" ref={caseStudyRef as React.RefObject<HTMLElement>}>
            <div className="container mx-auto px-4">
              <h2 className={`font-heading text-2xl text-center text-neutral mb-8 transition-all duration-700 ${caseStudyInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>See It In Action</h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {relatedStudies.map((study, idx) => (
                  <Link
                    key={study.slug}
                    to={`/case-studies/${study.slug}`}
                    className={`bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 group ${caseStudyInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                    style={{ transitionDelay: `${200 + idx * 150}ms` }}
                  >
                    <div className="h-40 overflow-hidden">
                      <SmartImage
                        src={study.image}
                        alt={study.title}
                        width={400}
                        height={200}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-6">
                      <div className="text-xs text-primary font-bold uppercase tracking-wider mb-2">{study.industry}</div>
                      <h3 className="font-heading text-lg text-neutral mb-2">{study.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{study.outcome}</p>
                      <span className="text-primary font-medium text-sm group-hover:underline">Read case study →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* 7. Interactive Assessment */}
      {(() => {
        const getQuizForService = (serviceSlug: string) => {
          switch(serviceSlug) {
            case 'cloud':
            case 'cloud-solutions':
              return {
                title: "Is Your Team Ready for Remote Work?",
                subtitle: "Take our 2-minute assessment to find out if your IT supports flexible working.",
                quiz: <RemoteWorkQuiz />
              };
            case 'backup-disaster-recovery':
              return {
                title: "How Confident Are You in Your Backups?",
                subtitle: "Would your business survive if your server failed tomorrow?",
                quiz: <BackupConfidenceQuiz />
              };
            case 'cybersecurity':
              return {
                title: "Is Your Email Protected?",
                subtitle: "90% of cyber attacks start with email. See how you score.",
                quiz: <EmailSecurityQuiz />
              };
            case 'cyber-essentials':
              return {
                title: "Are You Ready for Cyber Essentials?",
                subtitle: "Take our quick readiness check to see if you'd pass today.",
                quiz: <CyberReadinessQuiz />
              };
            default:
              return null;
          }
        };

        const quizData = getQuizForService(slug || '');
        if (!quizData) return null;

        return (
          <section className="py-16 bg-white border-t border-gray-200" ref={quizRef as React.RefObject<HTMLElement>}>
            <div className="container mx-auto px-4">
              <div className={`text-center mb-8 transition-all duration-700 ${quizInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h2 className="font-heading text-3xl text-neutral mb-2">{quizData.title}</h2>
                <p className="text-gray-600">{quizData.subtitle}</p>
              </div>
              <div className={`transition-all duration-700 ${quizInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: '200ms' }}>
                {quizData.quiz}
              </div>
            </div>
          </section>
        );
      })()}

      {/* 8. FAQ & Contact */}
      <Faq
        categories={faqCategoryNames}
        title="Common Questions"
        subtitle="Specific answers about this service."
      />
      <Contact />
    </div>
  );
};