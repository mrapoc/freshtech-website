import React, { useState, useEffect, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Users, Server, Globe, Monitor, CalendarCheck, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackCalendlyOpen } from '../utils/analytics';

const CalendlyModal = lazy(() => import('./CalendlyModal').then(m => ({ default: m.CalendlyModal })));

export const PricingCalculator = () => {
  const [userCount, setUserCount] = useState(10);
  const [deviceCount, setDeviceCount] = useState(10);
  const [siteCount, setSiteCount] = useState(1);
  const [plan, setPlan] = useState<'remote' | 'onsite'>('remote');
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

  // Pricing Logic
  // Remote: £35/user
  // Onsite: £45/user
  // Site Fee: £10 per site (Infrastructure)
  // Device Fee: £10 per device (Patching/Security)
  useEffect(() => {
    const userRate = plan === 'remote' ? 35 : 45;
    
    const userCost = userCount * userRate;
    const siteCost = siteCount * 10;
    const deviceCost = deviceCount * 10;
    
    setEstimatedPrice(userCost + siteCost + deviceCost);
  }, [userCount, deviceCount, siteCount, plan]);

  const quoteData = {
    userCount,
    deviceCount,
    siteCount,
    plan: plan === 'remote' ? 'Remote Support' : 'Remote & Onsite Support',
    estimatedPrice
  };

  return (
  <>
    <div className="bg-white rounded-3xl shadow-xl border-4 border-neutral overflow-hidden">
      <div className="bg-neutral text-white p-6 text-center">
        <h3 className="font-heading text-2xl text-highlight">Quick Cost Estimator</h3>
        <p className="text-gray-400 text-sm">Get a rough idea of your investment.</p>
      </div>
      
      <div className="p-8">
        {/* Inputs */}
        <div className="space-y-6 mb-8">
          
          {/* Users */}
          <div>
            <label htmlFor="user-count" className="flex justify-between font-bold text-neutral mb-2">
              <span className="flex items-center gap-2"><Users size={18} /> Number of Staff (Users)</span>
              <span className="text-primary-dark text-xl">{userCount}</span>
            </label>
            <input 
              id="user-count"
              type="range" 
              min="1" 
              max="100" 
              step="1" 
              value={userCount} 
              onChange={(e) => setUserCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              aria-label="Number of staff (users)"
            />
          </div>

          {/* Devices */}
          <div>
            <label htmlFor="device-count" className="flex justify-between font-bold text-neutral mb-2">
              <span className="flex items-center gap-2"><Monitor size={18} /> Number of Devices</span>
              <span className="text-primary-dark text-xl">{deviceCount}</span>
            </label>
            <input 
              id="device-count"
              type="range" 
              min="1" 
              max="100" 
              step="1" 
              value={deviceCount} 
              onChange={(e) => setDeviceCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              aria-label="Number of devices"
            />
            <div className="text-[10px] text-gray-400 mt-1">Covers patching, security & monitoring (£10/device)</div>
          </div>

          {/* Sites */}
          <div>
            <label htmlFor="site-count" className="flex justify-between font-bold text-neutral mb-2">
              <span className="flex items-center gap-2"><Globe size={18} /> Number of Sites</span>
              <span className="text-primary-dark text-xl">{siteCount}</span>
            </label>
            <input 
              id="site-count"
              type="range" 
              min="1" 
              max="10" 
              step="1" 
              value={siteCount} 
              onChange={(e) => setSiteCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              aria-label="Number of sites"
            />
            <div className="text-[10px] text-gray-400 mt-1">Covers router/switch infrastructure (£10/site)</div>
          </div>

          {/* Plan Toggle */}
          <div>
            <span className="block font-bold text-neutral mb-3 flex items-center gap-2">
               <Server size={18} /> Support Level
            </span>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setPlan('remote')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center ${plan === 'remote' ? 'border-primary bg-primary/10 text-primary-dark shadow-comic' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                aria-pressed={plan === 'remote'}
              >
                <span className="font-heading text-lg">Remote</span>
                <span className="text-xs mt-1">From £35/user</span>
              </button>
              <button 
                onClick={() => setPlan('onsite')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center ${plan === 'onsite' ? 'border-accent bg-accent/10 text-accent-dark shadow-comic' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                aria-pressed={plan === 'onsite'}
              >
                <span className="font-heading text-lg">Inc. Onsite</span>
                <span className="text-xs mt-1">From £45/user</span>
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200 mb-6">
           <p className="text-gray-500 text-sm uppercase tracking-widest mb-1">Estimated Monthly Investment</p>
           <div className="flex items-baseline justify-center gap-1 text-neutral">
             <span className="text-sm font-bold">Starting From</span>
             <span className="font-heading text-5xl text-primary-dark">£{estimatedPrice}</span>
             <span className="text-xl font-bold">/mo</span>
           </div>
           <p className="text-xs text-gray-400 mt-2 italic">*Excludes VAT. Subject to survey.</p>
        </div>

        {/* Dual CTAs */}
        <div className="space-y-3 mb-6">
          <Link
            to="/contact"
            state={{ quoteRequest: quoteData }}
            className="block w-full bg-accent text-neutral text-center py-4 rounded-lg font-bold text-lg shadow-comic hover:shadow-comic-hover hover:translate-y-[2px] transition-all border-2 border-neutral"
          >
            Get Exact Quote
          </Link>
          <button
            onClick={() => { trackCalendlyOpen(); setIsCalendlyOpen(true); }}
            className="flex items-center justify-center gap-2 w-full bg-white text-neutral text-center py-3 rounded-lg font-medium border border-gray-300 hover:border-neutral transition-all"
          >
            <CalendarCheck size={18} />
            or book a discovery call
          </button>
        </div>

        {/* Guarantee & Social Proof */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ShieldCheck size={16} className="text-green-600 shrink-0" />
            <span><strong>30-day money-back guarantee</strong> - not happy? Full refund.</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users size={16} className="text-primary shrink-0" />
            <span>Our average client stays <strong>5+ years</strong> - and counting</span>
          </div>
        </div>
      </div>
    </div>
    {isCalendlyOpen && createPortal(
      <Suspense fallback={null}>
        <CalendlyModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
      </Suspense>,
      document.body
    )}
  </>
  );
};