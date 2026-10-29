import React, { useState, useEffect } from 'react';
import { Send, Loader2, CheckCircle, AlertTriangle, Phone, Users, Zap, Calculator, Shield, Activity, XCircle, RefreshCw, Laptop, HardDrive, Mail } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { trackContactFormSubmit, trackQuoteRequest } from '../utils/analytics';

// Type definitions for quiz/form data
interface HealthCheckResult {
  score: number;
  categoryScores: { category: string; passed: number; total: number; percentage: number }[];
  failuresByCategory: {
    category: string;
    passed: number;
    total: number;
    percentage: number;
    failures: { category: string; question: string; weight: number }[];
  }[];
  criticalIssues: number;
}

interface CyberQuizResult {
  score: number;
  totalQuestions: number;
  passedCount: number;
  failures: { category: string; question: string }[];
}

interface PricingQuote {
  userCount: number;
  deviceCount: number;
  siteCount: number;
  plan: string;
  estimatedPrice: string | number;
}

interface LicenseComparisonResult {
  currentPlan: string;
  currentPrice: string;
  recommendedPlan: string;
  recommendedPrice: string;
  monthlyGap: string;
  estimatedSavings: string;
}

interface RemoteWorkResult {
  score: number;
  criticalGaps: number;
  failuresByCategory: { category: string; failures: { question: string }[] }[];
}

interface BackupQuizResult {
  score: number;
  criticalGaps: number;
  riskLevel: string;
  failures: { category: string; question: string }[];
}

interface EmailSecurityResult {
  score: number;
  hasMFA: boolean;
  riskLevel: string;
  failures: { category: string; question: string }[];
}

interface ProviderScorecardResult {
  score: number;
  failures: { category: string; question: string; impact: string }[];
  yesCount: number;
  noCount: number;
}

interface TrueCostResult {
  currentMonthly: number;
  currentAnnual: number;
  hiddenCosts: number;
  users: number;
  breakdown: {
    invoice: number;
    downtime: number;
    callouts: number;
    staffTime: number;
  };
}

interface HardwareAssessmentResult {
  recommendation: 'repair' | 'replace' | 'borderline';
  repairScore: number;
  replaceScore: number;
  costFactors: string[];
}

interface ITRatingResult {
  score: number;
  goodCount: number;
  okCount: number;
  poorCount: number;
  improvements: { category: string; rating: string; whatGoodLooksLike: string }[];
}

const companySizes = ['1-5', '6-15', '16-30', '31-50', '50+'];
const painPoints = [
  'Slow response from current IT',
  'Security concerns',
  'Unreliable systems/downtime',
  'Need to switch providers',
  'Growing and need more support',
  'Other'
];

export const ContactForm = () => {
  const location = useLocation();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [formLoadTime] = useState(Date.now()); // Bot trap 3: timing check
  const [showExtended, setShowExtended] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companySize: '',
    painPoint: '',
    message: '',
    honeypot: '' // Bot trap - hidden field
  });

  // Show extended fields after basic info is filled
  useEffect(() => {
    if (formData.name && formData.email && !showExtended) {
      setShowExtended(true);
    }
  }, [formData.name, formData.email, showExtended]);

  // Extract data from different sources
  const quoteRequest: PricingQuote | undefined = location.state?.quoteRequest?.userCount > 0
    ? location.state.quoteRequest
    : undefined;
  const healthCheckResult: HealthCheckResult | undefined = location.state?.healthCheckResult;
  const cyberQuizResult: CyberQuizResult | undefined = location.state?.cyberQuizResult;
  const licenseComparisonResult: LicenseComparisonResult | undefined = location.state?.licenseComparisonResult;
  const remoteWorkResult: RemoteWorkResult | undefined = location.state?.remoteWorkResult;
  const backupQuizResult: BackupQuizResult | undefined = location.state?.backupQuizResult;
  const emailSecurityResult: EmailSecurityResult | undefined = location.state?.emailSecurityResult;
  const providerScorecardResult: ProviderScorecardResult | undefined = location.state?.providerScorecardResult;
  const trueCostResult: TrueCostResult | undefined = location.state?.trueCostResult;
  const hardwareAssessmentResult: HardwareAssessmentResult | undefined = location.state?.hardwareAssessmentResult;
  const itRatingResult: ITRatingResult | undefined = location.state?.itRatingResult;

  // Count how many assessments they've completed (great qualifier!)
  const assessmentCount = [
    quoteRequest, healthCheckResult, cyberQuizResult, licenseComparisonResult,
    remoteWorkResult, backupQuizResult, emailSecurityResult,
    providerScorecardResult, trueCostResult, hardwareAssessmentResult, itRatingResult
  ].filter(Boolean).length;

  // Pre-fill message based on what forms they've completed
  useEffect(() => {
    const messages: string[] = [];

    if (quoteRequest) {
      messages.push(`Pricing Quote Request:
- Staff: ${quoteRequest.userCount}
- Devices: ${quoteRequest.deviceCount}
- Sites: ${quoteRequest.siteCount}
- Plan: ${quoteRequest.plan}
- Estimate: £${quoteRequest.estimatedPrice}/mo`);
    }

    if (healthCheckResult) {
      const failedCategories = healthCheckResult.failuresByCategory.map(c => c.category).join(', ');
      messages.push(`IT Health Check Score: ${healthCheckResult.score}%
Areas needing attention: ${failedCategories || 'None'}`);
    }

    if (cyberQuizResult) {
      const failedCategories = [...new Set(cyberQuizResult.failures.map(f => f.category))].join(', ');
      messages.push(`Cyber Readiness Score: ${cyberQuizResult.score}%
Failed controls: ${failedCategories || 'None'}`);
    }

    if (licenseComparisonResult) {
      messages.push(`License Upgrade Interest:
- Current: ${licenseComparisonResult.currentPlan} (£${licenseComparisonResult.currentPrice}/user)
- Recommended: ${licenseComparisonResult.recommendedPlan} (£${licenseComparisonResult.recommendedPrice}/user)
- Monthly difference: £${licenseComparisonResult.monthlyGap}/user
- Estimated savings vs separate tools: £${licenseComparisonResult.estimatedSavings}/user`);
    }

    if (remoteWorkResult) {
      const failedAreas = remoteWorkResult.failuresByCategory?.map(c => c.category).join(', ') || 'Various';
      messages.push(`Remote Work Readiness: ${remoteWorkResult.score}%
Areas to improve: ${failedAreas}
Critical gaps: ${remoteWorkResult.criticalGaps}`);
    }

    if (backupQuizResult) {
      messages.push(`Backup Confidence: ${backupQuizResult.score}%
Risk Level: ${backupQuizResult.riskLevel}
Critical gaps: ${backupQuizResult.criticalGaps}`);
    }

    if (emailSecurityResult) {
      messages.push(`Email Security: ${emailSecurityResult.score}%
Risk Level: ${emailSecurityResult.riskLevel}
MFA Enabled: ${emailSecurityResult.hasMFA ? 'Yes' : 'No'}`);
    }

    if (providerScorecardResult) {
      const failedAreas = providerScorecardResult.failures.map(f => f.category).join(', ');
      messages.push(`Current IT Provider Scorecard: ${providerScorecardResult.score}%
Areas of concern: ${failedAreas || 'None'}
Passing: ${providerScorecardResult.yesCount}/8, Failing: ${providerScorecardResult.noCount}/8`);
    }

    if (trueCostResult) {
      messages.push(`True IT Cost Analysis:
- Monthly invoice: £${trueCostResult.breakdown.invoice}
- Hidden costs: £${trueCostResult.hiddenCosts}/month
- True monthly total: £${trueCostResult.currentMonthly}
- Annual total: £${trueCostResult.currentAnnual}
- Users: ${trueCostResult.users}`);
    }

    if (hardwareAssessmentResult) {
      messages.push(`Hardware Assessment: ${hardwareAssessmentResult.recommendation.toUpperCase()}
Repair score: ${hardwareAssessmentResult.repairScore}%
Replace score: ${hardwareAssessmentResult.replaceScore}%
Cost factors: ${hardwareAssessmentResult.costFactors.join(', ') || 'None noted'}`);
    }

    if (itRatingResult) {
      const poorAreas = itRatingResult.improvements.filter(i => i.rating === 'poor').map(i => i.category).join(', ');
      messages.push(`Current IT Support Rating: ${itRatingResult.score}% (Grade based on 10 criteria)
Good: ${itRatingResult.goodCount}, OK: ${itRatingResult.okCount}, Poor: ${itRatingResult.poorCount}
Priority improvements: ${poorAreas || 'None critical'}`);
    }

    if (messages.length > 0) {
      messages.push('\nPlease contact me to discuss.');
      setFormData(prev => ({ ...prev, message: messages.join('\n\n') }));
    }
  }, [location.state]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Honeypot Check
    if (formData.honeypot) {
      return;
    }

    // 2. Timing Check - bots submit too fast (< 3 seconds)
    const timeTaken = Date.now() - formLoadTime;
    if (timeTaken < 3000) {
      return; // Silently reject - likely a bot
    }

    setStatus('sending');

    try {
      // Use serverless function to keep API key secure
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          honeypot: formData.honeypot,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          companySize: formData.companySize,
          painPoint: formData.painPoint,
          message: formData.message
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send message");
      }

      setStatus('success');

      // Track conversion in GA4
      if (location.state?.quoteRequest) {
        const q = location.state.quoteRequest;
        trackQuoteRequest(q.plan, q.estimatedPrice, q.userCount);
      } else {
        trackContactFormSubmit(location.pathname);
      }

      setFormData({ name: '', email: '', phone: '', companySize: '', painPoint: '', message: '', honeypot: '' });
      setShowExtended(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
      setStatus('error');
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-neutral">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading text-2xl text-primary-dark">Send a Signal</h3>
        {status !== 'success' && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full ${formData.name && formData.email ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span className={`w-2 h-2 rounded-full ${showExtended && (formData.companySize || formData.painPoint) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span className={`w-2 h-2 rounded-full ${formData.message ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span className="ml-1 font-medium">
              {!formData.name || !formData.email ? 'Step 1 of 3' :
               !formData.message ? 'Step 2 of 3' : 'Ready!'}
            </span>
          </div>
        )}
      </div>

      {/* Assessment Summaries - only shown when data exists and not submitted */}
      {assessmentCount > 0 && status !== 'success' && (
        <div className="mb-6 space-y-4">
          {/* Multi-assessment badge */}
          {assessmentCount > 1 && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
              <span className="text-green-700 text-sm font-medium">
                You've completed {assessmentCount} assessments - we'll tailor our response to your specific needs
              </span>
            </div>
          )}

          {/* Pricing Quote Summary */}
          {quoteRequest && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-2 text-primary-dark font-bold mb-3">
                <Calculator size={18} />
                <span>Pricing Quote</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Staff:</span>
                  <span className="font-medium">{quoteRequest.userCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Devices:</span>
                  <span className="font-medium">{quoteRequest.deviceCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sites:</span>
                  <span className="font-medium">{quoteRequest.siteCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium">{quoteRequest.plan}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-primary/20 flex justify-between items-center">
                <span className="text-gray-600">Estimated:</span>
                <span className="font-heading text-2xl text-primary-dark">£{quoteRequest.estimatedPrice}/mo</span>
              </div>
            </div>
          )}

          {/* IT Health Check Summary */}
          {healthCheckResult && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-orange-700 font-bold">
                  <Activity size={18} />
                  <span>IT Health Check</span>
                </div>
                <span className={`text-lg font-heading ${
                  healthCheckResult.score >= 85 ? 'text-green-600' :
                  healthCheckResult.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {healthCheckResult.score}%
                </span>
              </div>

              {/* Show failed areas with details */}
              {healthCheckResult.failuresByCategory.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-orange-800 uppercase tracking-wider">Areas needing attention:</p>
                  {healthCheckResult.failuresByCategory.map((cat) => (
                    <div key={cat.category} className="bg-white/60 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-800">{cat.category}</span>
                        <span className={`text-xs font-bold ${cat.percentage < 50 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {cat.passed}/{cat.total} passed
                        </span>
                      </div>
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        {cat.failures.slice(0, 2).map((f, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <XCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{f.question}</span>
                          </li>
                        ))}
                        {cat.failures.length > 2 && (
                          <li className="text-gray-400 italic">+{cat.failures.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                  ))}
                  {healthCheckResult.criticalIssues > 0 && (
                    <p className="text-xs text-red-600 font-medium mt-2">
                      ⚠️ {healthCheckResult.criticalIssues} critical issue{healthCheckResult.criticalIssues > 1 ? 's' : ''} found
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cyber Readiness Quiz Summary */}
          {cyberQuizResult && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-red-700 font-bold">
                  <Shield size={18} />
                  <span>Cyber Readiness</span>
                </div>
                <span className={`text-lg font-heading ${
                  cyberQuizResult.score === 100 ? 'text-green-600' :
                  cyberQuizResult.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {cyberQuizResult.score}%
                </span>
              </div>

              {/* Show failed controls */}
              {cyberQuizResult.failures.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Failed Cyber Essentials controls:</p>
                  <ul className="text-xs text-gray-700 space-y-1 bg-white/60 rounded-lg p-2">
                    {cyberQuizResult.failures.map((f, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <XCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                        <span><strong>{f.category}:</strong> {f.question}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-red-600 font-medium">
                    These gaps prevent Cyber Essentials certification
                  </p>
                </div>
              )}
            </div>
          )}

          {/* License Comparison Summary */}
          {licenseComparisonResult && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2 text-blue-700 font-bold mb-3">
                <RefreshCw size={18} />
                <span>License Upgrade</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Current</span>
                  <p className="font-medium text-gray-700">{licenseComparisonResult.currentPlan}</p>
                  <p className="text-gray-500">£{licenseComparisonResult.currentPrice}/user</p>
                </div>
                <div>
                  <span className="text-blue-600 text-xs font-medium">Recommended</span>
                  <p className="font-medium text-blue-700">{licenseComparisonResult.recommendedPlan}</p>
                  <p className="text-blue-600">£{licenseComparisonResult.recommendedPrice}/user</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200 text-xs">
                <p className="text-green-600 font-medium">
                  Saves ~£{licenseComparisonResult.estimatedSavings}/user vs buying security tools separately
                </p>
              </div>
            </div>
          )}

          {/* Remote Work Readiness Summary */}
          {remoteWorkResult && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-purple-700 font-bold">
                  <Laptop size={18} />
                  <span>Remote Work Readiness</span>
                </div>
                <span className={`text-lg font-heading ${
                  remoteWorkResult.score >= 85 ? 'text-green-600' :
                  remoteWorkResult.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {remoteWorkResult.score}%
                </span>
              </div>
              {remoteWorkResult.criticalGaps > 0 && (
                <p className="text-xs text-purple-600">
                  {remoteWorkResult.criticalGaps} critical gap{remoteWorkResult.criticalGaps > 1 ? 's' : ''} affecting remote work capability
                </p>
              )}
            </div>
          )}

          {/* Backup Confidence Summary */}
          {backupQuizResult && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-amber-700 font-bold">
                  <HardDrive size={18} />
                  <span>Backup Confidence</span>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-heading ${
                    backupQuizResult.score >= 85 ? 'text-green-600' :
                    backupQuizResult.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {backupQuizResult.score}%
                  </span>
                  <span className={`block text-xs font-bold ${
                    backupQuizResult.riskLevel === 'Low' ? 'text-green-600' :
                    backupQuizResult.riskLevel === 'Medium' ? 'text-yellow-600' :
                    backupQuizResult.riskLevel === 'High' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {backupQuizResult.riskLevel} Risk
                  </span>
                </div>
              </div>
              {backupQuizResult.criticalGaps > 0 && (
                <p className="text-xs text-amber-700">
                  {backupQuizResult.criticalGaps} critical backup gap{backupQuizResult.criticalGaps > 1 ? 's' : ''} found
                </p>
              )}
            </div>
          )}

          {/* Email Security Summary */}
          {emailSecurityResult && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold">
                  <Mail size={18} />
                  <span>Email Security</span>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-heading ${
                    emailSecurityResult.score >= 85 ? 'text-green-600' :
                    emailSecurityResult.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {emailSecurityResult.score}%
                  </span>
                  <span className={`block text-xs font-bold ${
                    emailSecurityResult.riskLevel === 'Low' ? 'text-green-600' :
                    emailSecurityResult.riskLevel === 'Medium' ? 'text-yellow-600' :
                    emailSecurityResult.riskLevel === 'High' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {emailSecurityResult.riskLevel} Risk
                  </span>
                </div>
              </div>
              {!emailSecurityResult.hasMFA && (
                <p className="text-xs text-red-600 font-medium">
                  Critical: No Multi-Factor Authentication enabled
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {status === 'success' ? (
        <div className="bg-green-50 border border-green-200 p-6 rounded-xl" role="alert" aria-live="polite">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h4 className="font-bold text-xl text-green-800 mb-2 text-center">Signal Received!</h4>
          <p className="text-green-700 text-center">Sam and the team have been alerted.</p>
          <p className="text-green-600 text-sm mt-2 font-medium text-center">We typically respond within 15 minutes during business hours.</p>

          {/* What happens next */}
          <div className="mt-6 pt-4 border-t border-green-200">
            <p className="text-sm font-bold text-green-800 mb-3">What happens next:</p>
            <ol className="text-sm text-green-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>We'll call or email within 15 minutes to clarify your needs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>We'll send a detailed proposal within 24 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>If you proceed, onboarding takes just 48-72 hours</span>
              </li>
            </ol>
          </div>

          {/* Quick reads while waiting */}
          <div className="mt-4 pt-4 border-t border-green-200">
            <p className="text-xs text-green-600 mb-2">While you wait:</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/it-health-check" className="text-xs bg-white text-green-700 px-3 py-1 rounded-full border border-green-300 hover:bg-green-50 transition-colors">
                Take IT Health Check →
              </Link>
              <Link to="/case-studies" className="text-xs bg-white text-green-700 px-3 py-1 rounded-full border border-green-300 hover:bg-green-50 transition-colors">
                View Case Studies →
              </Link>
            </div>
          </div>

          <button onClick={() => setStatus('idle')} className="mt-4 text-sm font-bold text-green-800 underline block mx-auto">Send another message</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot Field - Hidden from screen readers and bots */}
          <div className="hidden" aria-hidden="true">
             <input type="text" name="honeypot" value={formData.honeypot} onChange={handleChange} tabIndex={-1} autoComplete="off" />
          </div>

          <div>
            <label htmlFor="contact-name" className="block text-sm font-bold text-gray-700 mb-1">Name</label>
            <input
                id="contact-name"
                type="text"
                name="name"
                required
                aria-required="true"
                maxLength={100}
                value={formData.name}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                placeholder="Clark Kent"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input
                id="contact-email"
                type="email"
                name="email"
                required
                aria-required="true"
                maxLength={254}
                value={formData.email}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                placeholder="clark@dailyplanet.com"
            />
          </div>
          <div>
            <label htmlFor="contact-phone" className="block text-sm font-bold text-gray-700 mb-1">
              Phone <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                  id="contact-phone"
                  type="tel"
                  name="phone"
                  maxLength={20}
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 rounded-lg p-3 pl-10 focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  placeholder="01234 567 890"
              />
            </div>
          </div>
          {/* Progressive fields - appear after name/email filled */}
          {showExtended && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Users size={14} className="inline mr-1" />
                  Team size <span className="font-normal text-gray-500">(helps us tailor our response)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {companySizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, companySize: size }))}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        formData.companySize === size
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white border-gray-300 hover:border-primary'
                      }`}
                    >
                      {size} staff
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Zap size={14} className="inline mr-1" />
                  Biggest IT headache?
                </label>
                <div className="flex flex-wrap gap-2">
                  {painPoints.map((point) => (
                    <button
                      key={point}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, painPoint: point }))}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        formData.painPoint === point
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white border-gray-300 hover:border-primary'
                      }`}
                    >
                      {point}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="contact-message" className="block text-sm font-bold text-gray-700 mb-1">How can we help?</label>
            <textarea
                id="contact-message"
                name="message"
                required
                aria-required="true"
                maxLength={5000}
                value={formData.message}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary transition-colors h-32 resize-y"
                placeholder="Tell us about your mission..."
            ></textarea>
          </div>

          {status === 'error' && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex flex-col gap-2" role="alert" aria-live="assertive">
               <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle size={16} />
                  <span>Transmission Failed</span>
               </div>
               <span className="text-xs">Error: {errorMessage}</span>
               <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="text-xs font-bold text-red-700 underline hover:text-red-900"
                  >
                    Try Again
                  </button>
                  <span className="text-xs text-red-500">or call <strong>01584 517 234</strong></span>
               </div>
            </div>
          )}

          {/* Response SLA */}
          <p className="text-xs text-gray-500 text-center">
            We typically respond within <strong>15 minutes</strong> during business hours (Mon-Fri, 9am-5pm).
          </p>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full bg-primary-dark text-white font-bold py-4 rounded-lg shadow-comic border-2 border-neutral hover:bg-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {status === 'sending' ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            {status === 'sending' ? 'Transmitting...' : 'Send Message'}
          </button>
        </form>
      )}

      {/* Screen reader status announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {status === 'sending' && 'Sending your message, please wait...'}
        {status === 'success' && 'Message sent successfully! We will respond within 15 minutes.'}
        {status === 'error' && `Error sending message: ${errorMessage}`}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
        <p>Existing Client?</p>
        <p>Email <a href="mailto:support@fresh-tech.uk" className="text-primary-dark font-bold hover:underline">support@fresh-tech.uk</a> or call <a href="tel:01584517234" className="text-primary-dark font-bold hover:underline">01584 517 234</a> for urgent help.</p>
      </div>
    </div>
  );
};
