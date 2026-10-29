import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Clock, AlertTriangle, PoundSterling, TrendingUp, ArrowRight } from 'lucide-react';

interface CostInputs {
  monthlyInvoice: number;
  users: number;
  downtimeHours: number;
  avgHourlyRate: number;
  adHocCallouts: number;
  calloutCost: number;
  staffITHours: number;
}

const defaultInputs: CostInputs = {
  monthlyInvoice: 500,
  users: 10,
  downtimeHours: 4,
  avgHourlyRate: 25,
  adHocCallouts: 2,
  calloutCost: 100,
  staffITHours: 5
};

export const TrueCostCalculator: React.FC = () => {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState<CostInputs>(defaultInputs);
  const [showResults, setShowResults] = useState(false);

  const handleInputChange = (field: keyof CostInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs(prev => ({ ...prev, [field]: numValue }));
  };

  const calculateCosts = () => {
    // Monthly costs
    const invoiceCost = inputs.monthlyInvoice;
    const downtimeCost = inputs.downtimeHours * inputs.avgHourlyRate * inputs.users;
    const calloutCost = inputs.adHocCallouts * inputs.calloutCost;
    const staffTimeCost = inputs.staffITHours * inputs.avgHourlyRate;

    const monthlyTotal = invoiceCost + downtimeCost + calloutCost + staffTimeCost;
    const annualTotal = monthlyTotal * 12;
    const perUserCost = monthlyTotal / (inputs.users || 1);

    // What Fresh Tech would cost (estimated)
    const freshTechPerUser = 45; // Mid-range estimate
    const freshTechMonthly = inputs.users * freshTechPerUser;
    const freshTechAnnual = freshTechMonthly * 12;

    // Hidden costs that Fresh Tech eliminates
    const eliminatedDowntime = downtimeCost * 0.9; // 90% reduction
    const _eliminatedCallouts = calloutCost; // All included
    const _eliminatedStaffTime = staffTimeCost * 0.7; // 70% reduction

    const potentialSavings = (monthlyTotal - freshTechMonthly) + eliminatedDowntime * 0.5;

    return {
      breakdown: {
        invoice: invoiceCost,
        downtime: downtimeCost,
        callouts: calloutCost,
        staffTime: staffTimeCost
      },
      monthlyTotal,
      annualTotal,
      perUserCost,
      freshTechMonthly,
      freshTechAnnual,
      potentialSavings: Math.max(0, potentialSavings),
      hiddenCostsTotal: downtimeCost + calloutCost + staffTimeCost
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleGetQuote = () => {
    const costs = calculateCosts();
    navigate('/contact', {
      state: {
        trueCostResult: {
          currentMonthly: costs.monthlyTotal,
          currentAnnual: costs.annualTotal,
          hiddenCosts: costs.hiddenCostsTotal,
          users: inputs.users,
          breakdown: costs.breakdown
        }
      }
    });
  };

  if (showResults) {
    const costs = calculateCosts();
    const hiddenPercentage = Math.round((costs.hiddenCostsTotal / costs.monthlyTotal) * 100);

    return (
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden max-w-3xl mx-auto">
        <div className="bg-neutral text-white p-6">
          <h3 className="font-heading text-2xl text-center">Your True IT Cost</h3>
          <p className="text-gray-400 text-center text-sm">Based on your inputs</p>
        </div>

        <div className="p-6">
          {/* Main Cost Display */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-red-50 p-6 rounded-xl text-center">
              <div className="text-sm text-red-600 font-bold uppercase tracking-wider mb-1">True Monthly Cost</div>
              <div className="text-4xl font-heading text-red-700">{formatCurrency(costs.monthlyTotal)}</div>
              <div className="text-red-600 text-sm mt-1">{formatCurrency(costs.annualTotal)}/year</div>
            </div>
            <div className="bg-gray-100 p-6 rounded-xl text-center">
              <div className="text-sm text-gray-600 font-bold uppercase tracking-wider mb-1">Your Invoice Shows</div>
              <div className="text-4xl font-heading text-gray-700">{formatCurrency(costs.breakdown.invoice)}</div>
              <div className="text-gray-500 text-sm mt-1">Only {100 - hiddenPercentage}% of real cost</div>
            </div>
          </div>

          {/* Hidden Costs Breakdown */}
          <div className="mb-8">
            <h4 className="font-bold text-neutral mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" />
              Hidden Costs Your Invoice Doesn't Show
            </h4>
            <div className="space-y-3">
              {costs.breakdown.downtime > 0 && (
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-orange-600" />
                    <span className="text-gray-700">Downtime productivity loss</span>
                  </div>
                  <span className="font-bold text-orange-700">{formatCurrency(costs.breakdown.downtime)}/mo</span>
                </div>
              )}
              {costs.breakdown.callouts > 0 && (
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <PoundSterling size={16} className="text-orange-600" />
                    <span className="text-gray-700">Ad-hoc callout fees</span>
                  </div>
                  <span className="font-bold text-orange-700">{formatCurrency(costs.breakdown.callouts)}/mo</span>
                </div>
              )}
              {costs.breakdown.staffTime > 0 && (
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-orange-600" />
                    <span className="text-gray-700">Staff time on IT issues</span>
                  </div>
                  <span className="font-bold text-orange-700">{formatCurrency(costs.breakdown.staffTime)}/mo</span>
                </div>
              )}
            </div>
          </div>

          {/* Comparison with Fresh Tech */}
          <div className="bg-green-50 p-6 rounded-xl mb-6">
            <h4 className="font-bold text-green-700 mb-4 flex items-center gap-2">
              <TrendingUp size={18} />
              With All-Inclusive Support (Like Fresh Tech)
            </h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-green-600">Estimated Monthly</div>
                <div className="text-2xl font-heading text-green-700">{formatCurrency(costs.freshTechMonthly)}</div>
              </div>
              <div>
                <div className="text-sm text-green-600">Per User</div>
                <div className="text-2xl font-heading text-green-700">~£45</div>
              </div>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✓ No ad-hoc callout fees - everything included</li>
              <li>✓ 90% less downtime with proactive monitoring</li>
              <li>✓ Your staff focus on their job, not IT issues</li>
            </ul>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={handleGetQuote}
              className="bg-accent hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-bold transition-colors inline-flex items-center gap-2"
            >
              Get an Accurate Quote for Your Business
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => setShowResults(false)}
              className="block mx-auto mt-3 text-gray-500 hover:text-gray-700 text-sm"
            >
              Adjust my numbers
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden max-w-2xl mx-auto">
      <div className="bg-neutral text-white p-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Calculator size={28} />
          <h3 className="font-heading text-2xl">True IT Cost Calculator</h3>
        </div>
        <p className="text-gray-400 text-center text-sm">Your invoice isn't the full picture. Let's find the real number.</p>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {/* Monthly Invoice */}
          <div>
            <label className="block text-sm font-bold text-neutral mb-2">
              Current monthly IT invoice
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
              <input
                type="number"
                value={inputs.monthlyInvoice}
                onChange={(e) => handleInputChange('monthlyInvoice', e.target.value)}
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Number of Users */}
          <div>
            <label className="block text-sm font-bold text-neutral mb-2">
              Number of staff using IT
            </label>
            <input
              type="number"
              value={inputs.users}
              onChange={(e) => handleInputChange('users', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          {/* Downtime */}
          <div className="bg-orange-50 p-4 rounded-xl">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral">Hidden Cost: Downtime</span>
                <p className="text-xs text-gray-500">Hours lost waiting for IT issues to be fixed</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Hours of downtime/month</label>
                <input
                  type="number"
                  value={inputs.downtimeHours}
                  onChange={(e) => handleInputChange('downtimeHours', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Avg hourly rate (£)</label>
                <input
                  type="number"
                  value={inputs.avgHourlyRate}
                  onChange={(e) => handleInputChange('avgHourlyRate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Ad-hoc Callouts */}
          <div className="bg-orange-50 p-4 rounded-xl">
            <div className="flex items-start gap-2 mb-3">
              <PoundSterling size={18} className="text-orange-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral">Hidden Cost: Extra Charges</span>
                <p className="text-xs text-gray-500">Call-out fees, project work, "not included" items</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Extra callouts/month</label>
                <input
                  type="number"
                  value={inputs.adHocCallouts}
                  onChange={(e) => handleInputChange('adHocCallouts', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Avg cost per callout (£)</label>
                <input
                  type="number"
                  value={inputs.calloutCost}
                  onChange={(e) => handleInputChange('calloutCost', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Staff Time */}
          <div className="bg-orange-50 p-4 rounded-xl">
            <div className="flex items-start gap-2 mb-3">
              <Clock size={18} className="text-orange-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral">Hidden Cost: Staff Time</span>
                <p className="text-xs text-gray-500">Non-IT staff time spent on IT issues (rebooting, waiting, troubleshooting)</p>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Total hours/month across all staff</label>
              <input
                type="number"
                value={inputs.staffITHours}
                onChange={(e) => handleInputChange('staffITHours', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary text-sm"
              />
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={() => setShowResults(true)}
            className="w-full bg-primary hover:bg-blue-700 text-white py-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Calculator size={20} />
            Calculate My True IT Cost
          </button>
        </div>
      </div>
    </div>
  );
};
