
import React, { useState } from 'react';
import { Check, X, RefreshCw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LicenseComparator = () => {
    const navigate = useNavigate();
    const [currentPlan, setCurrentPlan] = useState<'basic' | 'standard'>('standard');

    // Approximate UK RRP (Annual Commit equivalent monthly)
    const PRICES = {
        basic: 4.90,
        standard: 10.30,
        premium: 18.10,
        security_stack: 15.00 // Est cost of 3rd party tools
    };

    const gap = (PRICES.premium - PRICES[currentPlan]).toFixed(2);
    const savings = (PRICES[currentPlan] + PRICES.security_stack - PRICES.premium).toFixed(2);

    const handleUpgradeClick = () => {
        navigate('/contact', {
            state: {
                licenseComparisonResult: {
                    currentPlan: currentPlan === 'basic' ? 'Business Basic' : 'Business Standard',
                    currentPrice: PRICES[currentPlan].toFixed(2),
                    recommendedPlan: 'Business Premium',
                    recommendedPrice: PRICES.premium.toFixed(2),
                    monthlyGap: gap,
                    estimatedSavings: savings
                }
            }
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden my-12">
            <div className="bg-neutral p-6 text-white text-center">
                <h3 className="font-heading text-2xl text-highlight flex items-center justify-center gap-2">
                    <RefreshCw size={24} /> License Upgrade Calculator
                </h3>
                <p className="text-gray-300 text-sm">Select your current license to see the value gap.</p>
            </div>

            <div className="p-8">
                {/* Controls */}
                <div className="flex justify-center mb-8">
                    <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                        <button 
                            onClick={() => setCurrentPlan('basic')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${currentPlan === 'basic' ? 'bg-white text-primary shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Business Basic (£{PRICES.basic.toFixed(2)})
                        </button>
                        <button 
                            onClick={() => setCurrentPlan('standard')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${currentPlan === 'standard' ? 'bg-white text-primary shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Business Standard (£{PRICES.standard.toFixed(2)})
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                    {/* Current State */}
                    <div className="space-y-4 opacity-70 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                        <h4 className="font-bold text-center text-gray-500 uppercase tracking-widest text-xs">Current Setup</h4>
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
                            <div className="text-xl font-bold text-gray-700 mb-1">Microsoft 365 {currentPlan === 'basic' ? 'Basic' : 'Standard'}</div>
                            <div className="text-3xl font-heading text-neutral mb-4">£{PRICES[currentPlan].toFixed(2)}</div>
                            <ul className="text-left space-y-2 text-sm text-gray-600 mb-6">
                                <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Email & Calendar</li>
                                <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Web/Mobile Apps</li>
                                {currentPlan === 'standard' && <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Desktop Apps (Word/Excel)</li>}
                                <li className="flex items-center gap-2 text-red-400"><X size={16} /> No Device Management (Intune)</li>
                                <li className="flex items-center gap-2 text-red-400"><X size={16} /> No Advanced Phishing Protection</li>
                                <li className="flex items-center gap-2 text-red-400"><X size={16} /> No Conditional Access (Geo-block)</li>
                            </ul>
                        </div>
                    </div>

                    {/* Upgrade State */}
                    <div className="space-y-4 relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md z-10 whitespace-nowrap">
                            Recommended Upgrade
                        </div>
                        <h4 className="font-bold text-center text-primary uppercase tracking-widest text-xs">Business Premium</h4>
                        <div className="bg-blue-50 p-6 rounded-xl border-2 border-primary text-center shadow-lg relative overflow-hidden">
                             <div className="text-xl font-bold text-primary mb-1">Business Premium</div>
                             <div className="text-4xl font-heading text-primary mb-2">£{PRICES.premium.toFixed(2)}</div>
                             <p className="text-xs text-blue-600 font-bold mb-4">
                                 Difference: Only £{gap} / month
                             </p>

                             <ul className="text-left space-y-2 text-sm text-gray-700 mb-6">
                                <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> <strong>Everything</strong> in Standard</li>
                                <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> <strong>Intune:</strong> Wipe lost laptops remotely</li>
                                <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> <strong>Defender:</strong> Enterprise Antivirus included</li>
                                <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> <strong>Azure P1:</strong> Block hackers by country</li>
                            </ul>
                            
                            <div className="bg-white p-3 rounded-lg border border-blue-200 text-xs">
                                <p className="text-gray-500 mb-1">To get these features separately with 3rd party tools would cost approx <strong>£{PRICES.security_stack.toFixed(2)}</strong> extra.</p>
                                <p className="text-green-600 font-bold">
                                    Upgrading saves you approx £{savings} per user vs buying separate tools!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button onClick={handleUpgradeClick} className="inline-flex items-center bg-accent text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-lg">
                        Upgrade My Licenses <ArrowRight className="ml-2" size={18} />
                    </button>
                    <p className="text-[10px] text-gray-400 mt-4">
                        *Prices based on Microsoft UK RRP for Annual Commitment, paid monthly. Excludes VAT.
                    </p>
                </div>
            </div>
        </div>
    );
};
