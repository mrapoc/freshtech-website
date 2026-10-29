
import React, { useState, useEffect } from 'react';
import { Calculator, AlertTriangle, Clock, Wifi, ShieldAlert, CheckCircle } from 'lucide-react';

export const DowntimeCalculator = () => {
  // State for inputs
  const [revenue, setRevenue] = useState(500000); // Annual Revenue
  const [employees, setEmployees] = useState(10);
  const [hourlyRate] = useState(15); // Avg hourly wage
  const [duration, setDuration] = useState(4); // Hours of downtime
  const [impact, setImpact] = useState(100); // % of staff affected

  // State for results
  const [cost, setCost] = useState(0);
  const [freshTechCost, setFreshTechCost] = useState(0);
  const [freshTechHourly, setFreshTechHourly] = useState(0);
  const [scenario, setScenario] = useState<string | null>(null);

  // Constants
  const WORKING_HOURS_PER_YEAR = 250 * 8; // approx 2000
  const SUPPORT_RATE_PER_USER = 35; // Starting monthly cost
  const WORKING_HOURS_PER_MONTH = 160; // 40hr week * 4

  useEffect(() => {
    // 1. Downtime Cost Calculation
    const revenuePerHr = revenue / WORKING_HOURS_PER_YEAR;
    const revenueLoss = revenuePerHr * duration;
    
    const staffCostPerHour = employees * hourlyRate;
    const productivityLoss = staffCostPerHour * duration * (impact / 100);

    // Hidden recovery multiplier (stress, overtime, reputation) - typically 1.5x direct costs for SMBs
    const recoveryMultiplier = 1; 

    setCost(Math.round((revenueLoss + productivityLoss) * recoveryMultiplier));

    // 2. Fresh Tech ROI Calculation
    // Total monthly cost for the whole team
    const totalMonthlySupport = employees * SUPPORT_RATE_PER_USER;
    setFreshTechCost(totalMonthlySupport);

    // Equivalent Hourly Rate (Total Monthly / Working Hours)
    // This shows how cheap it is to have a whole team available per hour compared to the downtime cost per hour
    const hourlyEquivalent = totalMonthlySupport / WORKING_HOURS_PER_MONTH;
    setFreshTechHourly(parseFloat(hourlyEquivalent.toFixed(2)));

  }, [revenue, employees, hourlyRate, duration, impact]);

  // Scenarios
  const applyScenario = (type: 'pc' | 'internet' | 'ransomware') => {
    if (type === 'pc') {
      setScenario('pc');
      setEmployees(1); // Single user
      setDuration(1); // 1 hour per day cumulative
      setImpact(50); // 50% slower
      // Keep revenue same as context
    }
    if (type === 'internet') {
      setScenario('internet');
      setEmployees(10); // Whole office
      setDuration(4); // Half day outage
      setImpact(100); // Total stop
    }
    if (type === 'ransomware') {
      setScenario('ransomware');
      setEmployees(10);
      setDuration(48); // 2 Days to recover from backup (optimistic)
      setImpact(100);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border-4 border-neutral overflow-hidden max-w-4xl mx-auto my-12">
      <div className="bg-neutral p-6 text-white text-center relative overflow-hidden">
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#2B7AB1 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
         <h3 className="font-heading text-3xl text-highlight relative z-10">The Cost of "It'll Be Fine"</h3>
         <p className="text-gray-300 relative z-10">Calculate how much downtime actually costs your business vs. the cost of preventing it.</p>
      </div>

      <div className="p-8">
        {/* Scenarios */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
           <button 
             onClick={() => applyScenario('pc')}
             className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md flex flex-col gap-2 ${scenario === 'pc' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary'}`}
           >
              <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center text-blue-600">
                 <Clock size={20} />
              </div>
              <div>
                 <span className="font-bold text-neutral block">The Slow PC</span>
                 <span className="text-xs text-gray-500">1 staff member struggling with an old machine.</span>
              </div>
           </button>

           <button 
             onClick={() => applyScenario('internet')}
             className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md flex flex-col gap-2 ${scenario === 'internet' ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-accent'}`}
           >
              <div className="bg-orange-100 w-10 h-10 rounded-full flex items-center justify-center text-orange-600">
                 <Wifi size={20} />
              </div>
              <div>
                 <span className="font-bold text-neutral block">Internet Down</span>
                 <span className="text-xs text-gray-500">Virgin/BT outage. No failover line. Office offline.</span>
              </div>
           </button>

           <button 
             onClick={() => applyScenario('ransomware')}
             className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md flex flex-col gap-2 ${scenario === 'ransomware' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-500'}`}
           >
              <div className="bg-red-100 w-10 h-10 rounded-full flex items-center justify-center text-red-600">
                 <ShieldAlert size={20} />
              </div>
              <div>
                 <span className="font-bold text-neutral block">Ransomware</span>
                 <span className="text-xs text-gray-500">Files encrypted. 48 hours to restore backups.</span>
              </div>
           </button>
        </div>

        {/* Calculator Controls */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
           <div className="space-y-6">
              <div>
                 <label htmlFor="revenue-slider" className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                    <span>Annual Revenue (£)</span>
                    <span className="text-primary">{revenue.toLocaleString()}</span>
                 </label>
                 <input
                   id="revenue-slider"
                   type="range"
                   min="50000"
                   max="5000000"
                   step="10000"
                   value={revenue}
                   onChange={(e) => setRevenue(parseInt(e.target.value))}
                   aria-label={`Annual Revenue: £${revenue.toLocaleString()}`}
                   aria-valuemin={50000}
                   aria-valuemax={5000000}
                   aria-valuenow={revenue}
                   aria-valuetext={`£${revenue.toLocaleString()}`}
                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                 />
              </div>
              <div>
                 <label htmlFor="employees-slider" className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                    <span>Number of Staff Affected</span>
                    <span className="text-primary">{employees}</span>
                 </label>
                 <input
                   id="employees-slider"
                   type="range"
                   min="1"
                   max="100"
                   value={employees}
                   onChange={(e) => setEmployees(parseInt(e.target.value))}
                   aria-label={`Number of Staff Affected: ${employees}`}
                   aria-valuemin={1}
                   aria-valuemax={100}
                   aria-valuenow={employees}
                   aria-valuetext={`${employees} staff`}
                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                 />
              </div>
              <div>
                 <label htmlFor="duration-slider" className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                    <span>Duration of Incident (Hours)</span>
                    <span className="text-primary">{duration}h</span>
                 </label>
                 <input
                   id="duration-slider"
                   type="range"
                   min="1"
                   max="100"
                   value={duration}
                   onChange={(e) => setDuration(parseInt(e.target.value))}
                   aria-label={`Duration of Incident: ${duration} hours`}
                   aria-valuemin={1}
                   aria-valuemax={100}
                   aria-valuenow={duration}
                   aria-valuetext={`${duration} hours`}
                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                 />
              </div>
           </div>

           {/* Results Display */}
           <div className="bg-gray-900 rounded-xl p-6 flex flex-col justify-center text-center relative overflow-hidden border-4 border-gray-800">
               <div className="absolute top-0 right-0 p-4 opacity-20">
                  <AlertTriangle size={120} className="text-red-500" />
               </div>
               
               <p className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-2">Estimated Incident Cost</p>
               <div className="text-5xl md:text-6xl font-heading text-white mb-2">
                  £{cost.toLocaleString()}
               </div>
               <p className="text-gray-500 text-xs italic max-w-xs mx-auto mb-6">
                  Includes lost revenue and wasted staff wages. Does not include reputation damage or fines.
               </p>

               {/* Fresh Tech ROI Comparison */}
               <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-4 w-full">
                  <div className="flex items-center justify-center gap-2 mb-2 text-green-400 font-heading text-lg">
                     <CheckCircle size={20} /> VS. Fresh Tech Protection
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-left">
                     <div>
                        <p className="text-xs text-gray-400 uppercase">Monthly Investment</p>
                        <p className="text-xl font-bold text-white">From £{freshTechCost}</p>
                        <p className="text-[10px] text-gray-400">Total for {employees} staff</p>
                     </div>
                     <div className="border-l border-green-500/30 pl-4">
                        <p className="text-xs text-gray-400 uppercase">Hourly Cost</p>
                        <p className="text-xl font-bold text-white">From £{freshTechHourly}</p>
                        <p className="text-[10px] text-gray-400">/hr for full support team</p>
                     </div>
                  </div>
                  
                  <p className="text-[10px] text-green-300 mt-3 text-center border-t border-green-500/30 pt-2">
                     Includes tools, redundancy, and employment costs you'd pay hiring internally.
                  </p>
               </div>
           </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 items-start text-sm text-blue-800">
           <div className="mt-1"><Calculator size={16} /></div>
           <p>
             <strong>Data Source:</strong> Based on UK SMB averages. Beaming's recent study indicates UK businesses lost £3.7bn to downtime in 2023, with the average internet outage costing small businesses £742 in lost productivity alone.
           </p>
        </div>
      </div>
    </div>
  );
};
