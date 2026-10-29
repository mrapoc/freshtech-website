import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ArrowRight, Activity, AlertTriangle, RefreshCw, HardDrive, Cloud, Shield, Users, Wrench } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface Question {
  id: number;
  category: string;
  categoryIcon: React.ElementType;
  question: string;
  explainer: string;
  weight: number; // 1-3, higher = more critical
}

const questions: Question[] = [
  {
    id: 1,
    category: "Hardware",
    categoryIcon: HardDrive,
    question: "Are all your computers and laptops less than 5 years old and running Windows 11?",
    explainer: "Windows 10 reached end-of-life in October 2025. Older hardware is slower and may not support modern security features.",
    weight: 3
  },
  {
    id: 2,
    category: "Hardware",
    categoryIcon: HardDrive,
    question: "Do your laptops have Solid State Drives (SSDs) rather than traditional spinning hard drives?",
    explainer: "SSDs are 5-10x faster than old hard drives. They dramatically improve boot times and application loading.",
    weight: 2
  },
  {
    id: 3,
    category: "Backup",
    categoryIcon: Cloud,
    question: "Do you have automatic cloud backups of all critical business data (not just local USB drives)?",
    explainer: "Local backups can be destroyed in a fire, flood, or ransomware attack. Cloud backups are your last line of defence.",
    weight: 3
  },
  {
    id: 4,
    category: "Backup",
    categoryIcon: Cloud,
    question: "Have you tested restoring from backup in the last 12 months?",
    explainer: "A backup you've never tested is not a backup. Many businesses discover corruption only when they need to restore.",
    weight: 2
  },
  {
    id: 5,
    category: "Security",
    categoryIcon: Shield,
    question: "Is Multi-Factor Authentication (MFA) enabled on all email and cloud accounts?",
    explainer: "MFA blocks 99.9% of automated account attacks. It's the single most important security control you can enable.",
    weight: 3
  },
  {
    id: 6,
    category: "Security",
    categoryIcon: Shield,
    question: "Do you have endpoint protection (antivirus) that's centrally managed and monitored?",
    explainer: "Consumer antivirus on individual PCs is not enough. You need visibility across all devices from one dashboard.",
    weight: 2
  },
  {
    id: 7,
    category: "Security",
    categoryIcon: Shield,
    question: "Have your staff received cyber security awareness training in the last year?",
    explainer: "Phishing emails are the #1 attack vector. Training helps staff spot scams before they click.",
    weight: 2
  },
  {
    id: 8,
    category: "Productivity",
    categoryIcon: Users,
    question: "Can your team work remotely with the same access to files and systems as in the office?",
    explainer: "Modern businesses need flexibility. Cloud-based systems let your team work from anywhere.",
    weight: 2
  },
  {
    id: 9,
    category: "Productivity",
    categoryIcon: Users,
    question: "Do you have a central document management system (like SharePoint) rather than files scattered on individual PCs?",
    explainer: "When files live on local PCs, they can't be backed up, searched, or accessed by colleagues.",
    weight: 2
  },
  {
    id: 10,
    category: "Support",
    categoryIcon: Wrench,
    question: "Do you have a dedicated IT support provider who proactively monitors your systems?",
    explainer: "Reactive IT (fixing things when they break) costs more than proactive IT (preventing problems).",
    weight: 2
  },
  {
    id: 11,
    category: "Support",
    categoryIcon: Wrench,
    question: "Can you get IT help within 15 minutes when something urgent goes wrong?",
    explainer: "Downtime costs money. Every minute waiting for help is lost productivity.",
    weight: 1
  },
  {
    id: 12,
    category: "Strategy",
    categoryIcon: Activity,
    question: "Do you have a documented IT roadmap or strategy for the next 12-24 months?",
    explainer: "Without a plan, IT becomes reactive and expensive. Strategic planning saves money long-term.",
    weight: 1
  }
];

// Group questions by category for results display
const categories = ['Hardware', 'Backup', 'Security', 'Productivity', 'Support', 'Strategy'];

export const ITHealthCheck: React.FC = () => {
  const [step, setStep] = useState(0); // 0 = Intro, 1-12 = Questions, 13 = Results
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  // Broadcast quiz results to chat widget when quiz completes. Must run
  // unconditionally (before any early return) to keep hook order stable.
  const isComplete = step > questions.length;
  useEffect(() => {
    if (!isComplete) return;
    const score = calculateScore();
    const result = getResultData();
    (window as Window & { __freshpsa_quiz_result?: unknown }).__freshpsa_quiz_result = {
      quizName: 'IT Health Check',
      score,
      title: result.title,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

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

  const getCategoryScores = () => {
    return categories.map(cat => {
      const catQuestions = questions.filter(q => q.category === cat);
      const passed = catQuestions.filter((q, _i) => {
        const questionIndex = questions.findIndex(qq => qq.id === q.id);
        return answers[questionIndex + 1];
      }).length;
      return {
        category: cat,
        passed,
        total: catQuestions.length,
        percentage: Math.round((passed / catQuestions.length) * 100)
      };
    });
  };

  const getResultData = () => {
    const score = calculateScore();
    if (score >= 85) return {
      color: 'text-green-600',
      bg: 'bg-green-100',
      border: 'border-green-300',
      title: 'Excellent IT Health!',
      text: "Your IT infrastructure is in great shape. A few tweaks could make it even better.",
      icon: CheckCircle
    };
    if (score >= 60) return {
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      border: 'border-yellow-300',
      title: 'Room for Improvement',
      text: "You have a reasonable foundation, but there are gaps that could be costing you time and money.",
      icon: AlertTriangle
    };
    if (score >= 35) return {
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      border: 'border-orange-300',
      title: 'Significant Risks',
      text: "Your IT setup has critical gaps that are exposing your business to unnecessary risk and inefficiency.",
      icon: AlertTriangle
    };
    return {
      color: 'text-red-600',
      bg: 'bg-red-100',
      border: 'border-red-300',
      title: 'Urgent Action Required',
      text: "Your current IT infrastructure is putting your business at serious risk. We need to talk.",
      icon: XCircle
    };
  };

  const sendToContact = () => {
    const score = calculateScore();
    const categoryScores = getCategoryScores();

    // Get specific failed questions with details for the contact form
    const failedQuestions = questions
      .filter((q, i) => !answers[i + 1])
      .map(q => ({
        category: q.category,
        question: q.question,
        weight: q.weight
      }));

    // Group failures by category
    const failuresByCategory = categoryScores
      .filter(c => c.percentage < 100)
      .map(c => ({
        category: c.category,
        passed: c.passed,
        total: c.total,
        percentage: c.percentage,
        failures: failedQuestions.filter(f => f.category === c.category)
      }));

    navigate('/contact', {
      state: {
        healthCheckResult: {
          score,
          categoryScores,
          failuresByCategory,
          criticalIssues: failedQuestions.filter(f => f.weight === 3).length
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
          <Activity size={48} className="mx-auto mb-4 text-highlight" />
          <h3 className="font-heading text-3xl">IT Health Check</h3>
          <p className="text-blue-100">Diagnose your business technology in 3 minutes.</p>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-600 mb-6 text-lg">
            Answer 12 quick questions covering hardware, security, backups, productivity, and support. Get a personalised score and recommendations.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8 text-center">
            <div className="p-3">
              <HardDrive className="mx-auto text-primary mb-2" size={28} />
              <span className="text-xs font-bold text-gray-500">Hardware</span>
            </div>
            <div className="p-3">
              <Cloud className="mx-auto text-primary mb-2" size={28} />
              <span className="text-xs font-bold text-gray-500">Backup</span>
            </div>
            <div className="p-3">
              <Shield className="mx-auto text-primary mb-2" size={28} />
              <span className="text-xs font-bold text-gray-500">Security</span>
            </div>
          </div>

          <button onClick={() => setStep(1)} className="bg-accent text-neutral px-8 py-4 rounded-lg font-bold text-xl shadow-comic hover:shadow-comic-hover hover:translate-y-[2px] transition-all border-2 border-neutral">
            Start Health Check
          </button>
        </div>
      </div>
    );
  }

  // Result Screen
  if (isComplete) {
    const result = getResultData();
    const score = calculateScore();
    const categoryScores = getCategoryScores();
    const ResultIcon = result.icon;

    return (
      <div className="bg-white rounded-2xl shadow-xl border-4 border-neutral overflow-hidden max-w-3xl mx-auto my-12">
        <div className={`p-8 text-center ${result.bg}`}>
          <ResultIcon size={48} className={`mx-auto mb-4 ${result.color}`} />
          <h3 className="font-heading text-2xl text-neutral mb-2">Your IT Health Score</h3>
          <div className={`font-heading text-6xl mb-4 ${result.color}`}>{score}%</div>
          <h4 className={`font-bold text-xl ${result.color}`}>{result.title}</h4>
        </div>

        <div className="p-8">
          <p className="text-gray-600 text-center mb-8 text-lg">{result.text}</p>

          {/* Category Breakdown */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {categoryScores.map(cat => (
              <div
                key={cat.category}
                className={`p-4 rounded-xl border-2 ${cat.percentage === 100 ? 'border-green-200 bg-green-50' : cat.percentage >= 50 ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-neutral">{cat.category}</span>
                  <span className={`font-bold ${cat.percentage === 100 ? 'text-green-600' : cat.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {cat.passed}/{cat.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${cat.percentage === 100 ? 'bg-green-500' : cat.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations based on failed categories */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
            <h5 className="font-bold text-neutral mb-4 flex items-center gap-2">
              <Wrench size={20} className="text-primary" /> Recommended Next Steps
            </h5>
            <ul className="space-y-3 text-sm text-gray-600">
              {categoryScores.filter(c => c.percentage < 100).slice(0, 4).map(cat => (
                <li key={cat.category} className="flex items-start gap-2">
                  <ArrowRight size={16} className="text-accent shrink-0 mt-0.5" />
                  <span>
                    {cat.category === 'Hardware' && (
                      <>Upgrade ageing PCs to <Link to="/services/hardware-procurement" className="text-primary hover:underline">Windows 11 devices</Link> for better security and speed.</>
                    )}
                    {cat.category === 'Backup' && (
                      <>Implement automated <Link to="/services/cloud-solutions" className="text-primary hover:underline">cloud backups</Link> with regular restore testing.</>
                    )}
                    {cat.category === 'Security' && (
                      <>Enable MFA and consider <Link to="/services/cybersecurity" className="text-primary hover:underline">managed security</Link> with staff training.</>
                    )}
                    {cat.category === 'Productivity' && (
                      <>Move to <Link to="/microsoft-business-premium" className="text-primary hover:underline">Microsoft 365</Link> for easy remote working and collaboration.</>
                    )}
                    {cat.category === 'Support' && (
                      <>Consider <Link to="/services/managed-it-support" className="text-primary hover:underline">proactive IT support</Link> to prevent issues before they happen.</>
                    )}
                    {cat.category === 'Strategy' && (
                      <>Book a <Link to="/services/strategic-projects" className="text-primary hover:underline">strategic IT review</Link> to plan your technology roadmap.</>
                    )}
                  </span>
                </li>
              ))}
              {categoryScores.every(c => c.percentage === 100) && (
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                  <span>Your IT is in excellent shape! Consider a <Link to="/services/cyber-essentials" className="text-primary hover:underline">Cyber Essentials Plus</Link> certification to prove it.</span>
                </li>
              )}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={sendToContact} className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
               Get a Free Consultation <ArrowRight size={20} />
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
            <XCircle size={20} /> No / Unsure
          </button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start text-sm text-blue-800">
           <div className="mt-1"><AlertTriangle size={16} /></div>
           <p><strong>Why this matters:</strong> {currentQ.explainer}</p>
        </div>
      </div>
    </div>
  );
};
