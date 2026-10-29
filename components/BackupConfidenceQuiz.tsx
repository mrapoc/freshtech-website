import React, { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, HardDrive, AlertTriangle, RefreshCw, Cloud, Clock, Shield, FileWarning } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: number;
  category: string;
  categoryIcon: React.ElementType;
  question: string;
  simpleExplainer: string;
  weight: number;
  scary?: boolean; // For highlighting critical questions
}

const questions: Question[] = [
  {
    id: 1,
    category: "Backup Exists",
    categoryIcon: Cloud,
    question: "Do you have automatic backups running every day without anyone having to remember to do it?",
    simpleExplainer: "Manual backups get forgotten. Automatic backups happen even when you're on holiday or when Dave's off sick.",
    weight: 3,
    scary: true
  },
  {
    id: 2,
    category: "Backup Exists",
    categoryIcon: Cloud,
    question: "Are your backups stored somewhere other than your office (cloud or offsite)?",
    simpleExplainer: "If your backup is on a USB drive in your desk drawer, a fire or flood destroys both your data AND your backup.",
    weight: 3,
    scary: true
  },
  {
    id: 3,
    category: "What's Backed Up",
    categoryIcon: FileWarning,
    question: "Are ALL your important business files being backed up - including emails, accounting data, and documents?",
    simpleExplainer: "Many businesses only back up some data. When disaster strikes, they discover their invoices or emails weren't included.",
    weight: 3
  },
  {
    id: 4,
    category: "What's Backed Up",
    categoryIcon: FileWarning,
    question: "If you use cloud services like Microsoft 365, are those backed up separately?",
    simpleExplainer: "Surprise: Microsoft doesn't fully back up your emails and OneDrive. If you delete something (or a hacker does), it's gone after 30-90 days.",
    weight: 2
  },
  {
    id: 5,
    category: "Recovery Time",
    categoryIcon: Clock,
    question: "Do you know how long it would take to get your systems working again after a complete failure?",
    simpleExplainer: "If you can't answer this, you haven't tested your recovery. Some businesses discover it takes weeks, not hours.",
    weight: 2
  },
  {
    id: 6,
    category: "Recovery Time",
    categoryIcon: Clock,
    question: "Have you actually tested restoring from backup in the last 12 months?",
    simpleExplainer: "A backup you've never tested is not a backup. Many businesses discover corruption or missing files only when they desperately need to restore.",
    weight: 3,
    scary: true
  },
  {
    id: 7,
    category: "Ransomware Protection",
    categoryIcon: Shield,
    question: "Would your backups survive a ransomware attack that encrypts everything on your network?",
    simpleExplainer: "Modern ransomware specifically targets and encrypts backups. You need 'air-gapped' or immutable backups that attackers can't reach.",
    weight: 3,
    scary: true
  },
  {
    id: 8,
    category: "Ransomware Protection",
    categoryIcon: Shield,
    question: "Do you keep multiple versions of backups going back at least 30 days?",
    simpleExplainer: "If ransomware is in your system for 2 weeks before you notice, yesterday's backup is also infected. You need to go back further.",
    weight: 2
  }
];

export const BackupConfidenceQuiz: React.FC = () => {
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

  const getScaryFailures = () => {
    return questions.filter((q, i) => q.scary && !answers[i + 1]);
  };

  const getResultData = () => {
    const score = calculateScore();
    const scaryFails = getScaryFailures();

    if (score >= 85 && scaryFails.length === 0) return {
      color: 'text-green-600',
      bg: 'bg-green-100',
      title: 'Well Protected!',
      text: "Your backup strategy is solid. You're in a better position than most businesses to survive a disaster.",
      icon: CheckCircle,
      riskLevel: 'Low'
    };
    if (score >= 60) return {
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      title: 'Gaps in Your Safety Net',
      text: "You have some backup coverage, but there are holes that could cause serious problems in a real disaster.",
      icon: AlertTriangle,
      riskLevel: 'Medium'
    };
    if (score >= 35) return {
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      title: 'Significant Risk',
      text: "Your business could lose critical data in a disaster. You're gambling with your company's survival.",
      icon: AlertTriangle,
      riskLevel: 'High'
    };
    return {
      color: 'text-red-600',
      bg: 'bg-red-100',
      title: 'Danger Zone',
      text: "Your business is one hard drive failure, ransomware attack, or fire away from catastrophic data loss.",
      icon: XCircle,
      riskLevel: 'Critical'
    };
  };

  const sendToContact = () => {
    const score = calculateScore();
    const scaryFails = getScaryFailures();

    const failedQuestions = questions
      .filter((q, i) => !answers[i + 1])
      .map(q => ({
        category: q.category,
        question: q.question,
        weight: q.weight,
        scary: q.scary
      }));

    navigate('/contact', {
      state: {
        backupQuizResult: {
          score,
          criticalGaps: scaryFails.length,
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
        <div className="bg-neutral p-6 text-white text-center">
          <HardDrive size={48} className="mx-auto mb-4 text-highlight" />
          <h3 className="font-heading text-3xl">Could Your Business Survive Data Loss?</h3>
          <p className="text-gray-300">Take our 2-minute Backup Confidence Test.</p>
        </div>
        <div className="p-8 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-red-800 text-sm font-medium">
              <strong>Did you know?</strong> 60% of small businesses that lose their data shut down within 6 months.
              Yet most business owners haven't tested their backups in years - if they have backups at all.
            </p>
          </div>

          <p className="text-gray-600 mb-6 text-lg">
            Answer 8 honest questions to find out if your backups would actually save you in a crisis.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8 text-center text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <Cloud className="mx-auto text-primary mb-2" size={24} />
              <span className="font-bold text-gray-600">Backup Coverage</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Shield className="mx-auto text-primary mb-2" size={24} />
              <span className="font-bold text-gray-600">Ransomware Survival</span>
            </div>
          </div>

          <button onClick={() => setStep(1)} className="bg-accent text-white px-8 py-4 rounded-lg font-bold text-xl shadow-comic hover:shadow-comic-hover hover:translate-y-1 transition-all border-2 border-neutral">
            Test My Backups
          </button>
        </div>
      </div>
    );
  }

  // Result Screen
  if (step > questions.length) {
    const result = getResultData();
    const score = calculateScore();
    const scaryFails = getScaryFailures();
    const ResultIcon = result.icon;

    return (
      <div className="bg-white rounded-2xl shadow-xl border-4 border-neutral overflow-hidden max-w-3xl mx-auto my-12">
        <div className={`p-8 text-center ${result.bg}`}>
          <ResultIcon size={48} className={`mx-auto mb-4 ${result.color}`} />
          <h3 className="font-heading text-2xl text-neutral mb-2">Your Backup Confidence Score</h3>
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

          {/* Critical failures */}
          {scaryFails.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
              <h5 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                <AlertTriangle size={20} />
                Critical Gaps ({scaryFails.length})
              </h5>
              <ul className="space-y-2 text-sm text-red-700">
                {scaryFails.map((q, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <XCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{q.question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* The cost of not acting */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
            <h5 className="font-bold text-neutral mb-3">The Real Cost of Data Loss:</h5>
            <div className="grid md:grid-cols-3 gap-4 text-center text-sm">
              <div className="p-3">
                <p className="font-heading text-2xl text-red-600">£5,600</p>
                <p className="text-gray-500">Average cost per hour of downtime for SMEs</p>
              </div>
              <div className="p-3">
                <p className="font-heading text-2xl text-red-600">60%</p>
                <p className="text-gray-500">of businesses close within 6 months of major data loss</p>
              </div>
              <div className="p-3">
                <p className="font-heading text-2xl text-red-600">21 days</p>
                <p className="text-gray-500">Average time to recover from ransomware without proper backups</p>
              </div>
            </div>
          </div>

          {/* What we do */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-8">
            <h5 className="font-bold text-primary mb-3">Our Backup Solution Includes:</h5>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span><strong>Automatic daily backups</strong> - no one needs to remember anything</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span><strong>Cloud storage</strong> - survives fire, flood, and theft</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span><strong>Ransomware-proof</strong> - immutable backups attackers can't touch</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span><strong>Regular test restores</strong> - we prove it works, not just hope</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={sendToContact} className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
               Fix My Backup Gaps <ArrowRight size={20} />
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
          {currentQ.scary && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Critical</span>
          )}
        </div>

        <h3 className="font-heading text-2xl md:text-3xl text-neutral mb-6 leading-tight">
          {currentQ.question}
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 py-4 px-6 rounded-xl border-2 border-green-200 bg-green-50 text-green-700 font-bold hover:bg-green-100 hover:border-green-300 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} /> Yes, definitely
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 py-4 px-6 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 font-bold hover:bg-red-100 hover:border-red-300 transition-all flex items-center justify-center gap-2"
          >
            <XCircle size={20} /> No / I'm not sure
          </button>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg flex gap-3 items-start text-sm text-amber-800">
           <div className="mt-1"><AlertTriangle size={16} /></div>
           <p><strong>Real talk:</strong> {currentQ.simpleExplainer}</p>
        </div>
      </div>
    </div>
  );
};
