import React, { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, Mail, AlertTriangle, RefreshCw, Shield, Users, Lock, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: number;
  category: string;
  categoryIcon: React.ElementType;
  question: string;
  simpleExplainer: string;
  weight: number;
}

const questions: Question[] = [
  {
    id: 1,
    category: "Account Security",
    categoryIcon: Lock,
    question: "Do all staff need to enter a code from their phone (as well as password) to access email?",
    simpleExplainer: "This is called MFA. Without it, hackers who steal or guess a password get full access to your emails, files, and potentially your bank accounts.",
    weight: 3
  },
  {
    id: 2,
    category: "Phishing Protection",
    categoryIcon: Mail,
    question: "Does your email system automatically flag suspicious emails before staff see them?",
    simpleExplainer: "Basic spam filters miss clever phishing emails. Advanced protection uses AI to spot fake invoices, CEO impersonation, and suspicious links.",
    weight: 3
  },
  {
    id: 3,
    category: "Staff Training",
    categoryIcon: Users,
    question: "Have your staff received training on spotting phishing emails in the last 12 months?",
    simpleExplainer: "90% of successful cyber attacks start with a phishing email. If your team can't spot them, your technical defences don't matter.",
    weight: 2
  },
  {
    id: 4,
    category: "Staff Training",
    categoryIcon: Users,
    question: "Would your staff know what to do if they accidentally clicked a suspicious link?",
    simpleExplainer: "Quick reporting can prevent disaster. If staff hide mistakes or don't know who to tell, small problems become big breaches.",
    weight: 2
  },
  {
    id: 5,
    category: "Domain Protection",
    categoryIcon: Shield,
    question: "Do you know if someone could send emails that look like they're from your company domain?",
    simpleExplainer: "Without proper email authentication (SPF, DKIM, DMARC), criminals can send emails pretending to be you - to your clients, suppliers, or staff.",
    weight: 2
  },
  {
    id: 6,
    category: "Account Security",
    categoryIcon: Lock,
    question: "Would you know within hours if someone logged into your email from an unusual location?",
    simpleExplainer: "If a hacker in Russia accesses your finance manager's email at 3am, would anyone notice before money leaves your account?",
    weight: 2
  },
  {
    id: 7,
    category: "Phishing Protection",
    categoryIcon: Eye,
    question: "Are links in emails automatically checked before staff can click them?",
    simpleExplainer: "Safe Links technology checks every link at click-time, even if the website became dangerous after the email was sent.",
    weight: 2
  },
  {
    id: 8,
    category: "Phishing Protection",
    categoryIcon: Mail,
    question: "Are email attachments scanned and 'detonated' in a sandbox before reaching staff?",
    simpleExplainer: "Sophisticated malware hides in Word docs and PDFs. Sandbox testing opens attachments in a safe environment to spot threats.",
    weight: 2
  }
];

export const EmailSecurityQuiz: React.FC = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  const handleAnswer = (answer: boolean) => {
    setAnswers(prev => ({ ...prev, [step]: answer }));
    setStep(prev => prev + 1);
  };

  const calculateScore = () => {
    let totalWeight = 0;
    let earnedWeight = 0;

    questions.forEach((q, index) => {
      totalWeight += q.weight;
      if (answers[index + 1]) {
        earnedWeight += q.weight;
      }
    });

    return Math.round((earnedWeight / totalWeight) * 100);
  };

  const getResultData = () => {
    const score = calculateScore();
    // Check specifically for MFA (question 1)
    const hasMFA = answers[1];

    if (score >= 85 && hasMFA) return {
      color: 'text-green-600',
      bg: 'bg-green-100',
      title: 'Well Protected!',
      text: "Your email security is above average. You're taking threats seriously.",
      icon: CheckCircle,
      riskLevel: 'Low'
    };
    if (score >= 60) return {
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      title: 'Partially Protected',
      text: "You have some defences, but gaps remain that attackers could exploit.",
      icon: AlertTriangle,
      riskLevel: 'Medium'
    };
    if (score >= 35) return {
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      title: 'Significant Vulnerabilities',
      text: "Your email is an easy target. Phishing attacks are likely to succeed.",
      icon: AlertTriangle,
      riskLevel: 'High'
    };
    return {
      color: 'text-red-600',
      bg: 'bg-red-100',
      title: 'High Risk',
      text: "Your business email is poorly protected. It's only a matter of time before a successful attack.",
      icon: XCircle,
      riskLevel: 'Critical'
    };
  };

  const sendToContact = () => {
    const score = calculateScore();
    const hasMFA = answers[1];

    const failedQuestions = questions
      .filter((q, i) => !answers[i + 1])
      .map(q => ({
        category: q.category,
        question: q.question,
        weight: q.weight
      }));

    navigate('/contact', {
      state: {
        emailSecurityResult: {
          score,
          hasMFA,
          riskLevel: getResultData().riskLevel,
          failures: failedQuestions
        }
      }
    });
  };

  const resetQuiz = () => {
    setStep(0);
    setAnswers({});
  };

  // Intro Screen
  if (step === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border-4 border-primary overflow-hidden max-w-2xl mx-auto my-12">
        <div className="bg-primary p-6 text-white text-center">
          <Mail size={48} className="mx-auto mb-4 text-highlight" />
          <h3 className="font-heading text-3xl">Is Your Email a Security Risk?</h3>
          <p className="text-blue-100">90% of cyber attacks start with email. Where do you stand?</p>
        </div>
        <div className="p-8 text-center">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-amber-800 text-sm">
              <strong>True story:</strong> A local business lost £42,000 when a staff member replied to a fake "invoice" email
              that looked like it came from their regular supplier. The email had bypassed their basic spam filter.
            </p>
          </div>

          <p className="text-gray-600 mb-6 text-lg">
            Answer 8 questions to find out how protected you really are against email-based attacks.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8 text-center text-xs">
            <div className="p-3 bg-gray-50 rounded-lg">
              <Lock className="mx-auto text-primary mb-2" size={24} />
              <span className="font-bold text-gray-600">Account Security</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Mail className="mx-auto text-primary mb-2" size={24} />
              <span className="font-bold text-gray-600">Phishing Defence</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Users className="mx-auto text-primary mb-2" size={24} />
              <span className="font-bold text-gray-600">Staff Awareness</span>
            </div>
          </div>

          <button onClick={() => setStep(1)} className="bg-accent text-white px-8 py-4 rounded-lg font-bold text-xl shadow-comic hover:shadow-comic-hover hover:translate-y-1 transition-all border-2 border-neutral">
            Check My Email Security
          </button>
        </div>
      </div>
    );
  }

  // Result Screen
  if (step > questions.length) {
    const result = getResultData();
    const score = calculateScore();
    const hasMFA = answers[1];
    const ResultIcon = result.icon;

    const failedQuestions = questions.filter((q, i) => !answers[i + 1]);

    return (
      <div className="bg-white rounded-2xl shadow-xl border-4 border-neutral overflow-hidden max-w-3xl mx-auto my-12">
        <div className={`p-8 text-center ${result.bg}`}>
          <ResultIcon size={48} className={`mx-auto mb-4 ${result.color}`} />
          <h3 className="font-heading text-2xl text-neutral mb-2">Your Email Security Score</h3>
          <div className={`font-heading text-6xl mb-2 ${result.color}`}>{score}%</div>
          <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${
            result.riskLevel === 'Low' ? 'bg-green-200 text-green-800' :
            result.riskLevel === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
            result.riskLevel === 'High' ? 'bg-orange-200 text-orange-800' :
            'bg-red-200 text-red-800'
          }`}>
            {result.riskLevel} Risk
          </div>
          <h4 className={`font-bold text-xl mt-3 ${result.color}`}>{result.title}</h4>
        </div>

        <div className="p-8">
          <p className="text-gray-600 text-center mb-8 text-lg">{result.text}</p>

          {/* MFA Warning */}
          {!hasMFA && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                <AlertTriangle size={20} />
                <span>Critical: No Multi-Factor Authentication</span>
              </div>
              <p className="text-sm text-red-600">
                This is the #1 thing you can do to protect your email. 99.9% of account compromise attacks are stopped by MFA.
                We can set this up for you in less than an hour.
              </p>
            </div>
          )}

          {/* Other failures */}
          {failedQuestions.length > 0 && (
            <div className="mb-8">
              <h5 className="font-bold text-neutral mb-3">Security Gaps Found:</h5>
              <ul className="space-y-2 text-sm">
                {failedQuestions.filter(q => q.id !== 1 || hasMFA).slice(0, 4).map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 bg-gray-50 p-3 rounded-lg">
                    <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <span>{q.question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What we recommend */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-8">
            <h5 className="font-bold text-primary mb-3">Our Email Security Package:</h5>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span><strong>MFA setup</strong> for all accounts</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span><strong>Advanced threat protection</strong> (AI-powered)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span><strong>Safe Links & Attachments</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span><strong>Domain authentication</strong> (SPF/DKIM/DMARC)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span><strong>Staff phishing training</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span><strong>24/7 monitoring</strong> for suspicious logins</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-4">
              Included with Microsoft 365 Business Premium - often at no extra cost if you upgrade from Standard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={sendToContact} className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
               Secure My Email <ArrowRight size={20} />
            </button>
            <button onClick={resetQuiz} className="text-gray-400 font-bold hover:text-neutral flex items-center justify-center gap-2">
               <RefreshCw size={16} /> Retake
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Question Screen
  const currentQ = questions[step - 1];
  const progress = ((step - 1) / questions.length) * 100;
  const CategoryIcon = currentQ.categoryIcon;

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden max-w-2xl mx-auto my-12">
      {/* Progress Bar */}
      <div className="w-full bg-gray-100 h-2">
        <div className="bg-accent h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="p-8 md:p-12">
        <div className="flex items-center gap-2 mb-4">
          <CategoryIcon size={20} className="text-primary" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
             Question {step} of {questions.length} • {currentQ.category}
          </span>
        </div>

        <h3 className="font-heading text-2xl md:text-3xl text-neutral mb-6 leading-tight">
          {currentQ.question}
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 py-4 px-6 rounded-xl border-2 border-green-200 bg-green-50 text-green-700 font-bold hover:bg-green-100 hover:border-green-300 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} /> Yes
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 py-4 px-6 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 font-bold hover:bg-red-100 hover:border-red-300 transition-all flex items-center justify-center gap-2"
          >
            <XCircle size={20} /> No / Don't know
          </button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start text-sm text-blue-800">
           <div className="mt-1"><AlertTriangle size={16} /></div>
           <p><strong>Plain English:</strong> {currentQ.simpleExplainer}</p>
        </div>
      </div>
    </div>
  );
};
