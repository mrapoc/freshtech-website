import React, { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, Laptop, AlertTriangle, RefreshCw, Wifi, Cloud, Lock, Video, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: number;
  category: string;
  categoryIcon: React.ElementType;
  question: string;
  simpleExplainer: string; // Plain English explanation
  weight: number;
}

const questions: Question[] = [
  {
    id: 1,
    category: "Internet Access",
    categoryIcon: Wifi,
    question: "Can your staff access work emails and files from home without calling IT first?",
    simpleExplainer: "If someone needs to ring-3 you or IT every time they work from home, that's a sign your systems aren't set up for flexible working.",
    weight: 3
  },
  {
    id: 2,
    category: "File Access",
    categoryIcon: FolderOpen,
    question: "Are your important business files stored in the cloud (like SharePoint or OneDrive) rather than on individual PCs?",
    simpleExplainer: "If files only exist on office computers, remote workers can't access them - and they're not backed up properly either.",
    weight: 3
  },
  {
    id: 3,
    category: "Security",
    categoryIcon: Lock,
    question: "Do your staff need to enter a code from their phone (as well as a password) to log in?",
    simpleExplainer: "This is called Multi-Factor Authentication (MFA). Without it, a stolen password gives hackers full access to your systems.",
    weight: 3
  },
  {
    id: 4,
    category: "Video Calls",
    categoryIcon: Video,
    question: "Can your team easily join video meetings with clients and colleagues using Teams, Zoom, or similar?",
    simpleExplainer: "Video calls have become essential for business. If staff struggle to join meetings, you're losing productivity and appearing unprofessional.",
    weight: 2
  },
  {
    id: 5,
    category: "Device Security",
    categoryIcon: Laptop,
    question: "If a staff member's laptop was stolen, could you remotely wipe the company data from it?",
    simpleExplainer: "Lost laptops happen. Without remote wipe capability, your client data and business secrets walk out the door.",
    weight: 2
  },
  {
    id: 6,
    category: "Cloud Apps",
    categoryIcon: Cloud,
    question: "Do your main business applications (accounting, CRM, etc.) work from any location with internet?",
    simpleExplainer: "Old software installed on office PCs only works in the office. Cloud-based apps work anywhere.",
    weight: 2
  },
  {
    id: 7,
    category: "Internet Access",
    categoryIcon: Wifi,
    question: "If your office internet went down tomorrow, could your team still work from home or a coffee shop?",
    simpleExplainer: "Broadband outages happen. Businesses with cloud systems keep working; those dependent on office servers stop completely.",
    weight: 2
  },
  {
    id: 8,
    category: "Security",
    categoryIcon: Lock,
    question: "Are work laptops protected by company antivirus that IT can manage remotely?",
    simpleExplainer: "Home networks are less secure than offices. Remote laptops need enterprise-grade protection that can be monitored centrally.",
    weight: 2
  }
];

const categories = ['Internet Access', 'File Access', 'Security', 'Video Calls', 'Device Security', 'Cloud Apps'];

export const RemoteWorkQuiz: React.FC = () => {
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

  const getCategoryScores = () => {
    return categories.map(cat => {
      const catQuestions = questions.filter(q => q.category === cat);
      const passed = catQuestions.filter(q => {
        const questionIndex = questions.findIndex(qq => qq.id === q.id);
        return answers[questionIndex + 1];
      }).length;
      return {
        category: cat,
        passed,
        total: catQuestions.length,
        percentage: catQuestions.length > 0 ? Math.round((passed / catQuestions.length) * 100) : 100
      };
    });
  };

  const getResultData = () => {
    const score = calculateScore();
    if (score >= 85) return {
      color: 'text-green-600',
      bg: 'bg-green-100',
      title: 'Ready for Anywhere Working!',
      text: "Your team can work effectively from anywhere. A few tweaks could make it even smoother.",
      icon: CheckCircle
    };
    if (score >= 60) return {
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      title: 'Partially Remote-Ready',
      text: "Your team can work remotely, but there are gaps that are likely causing frustration and security risks.",
      icon: AlertTriangle
    };
    if (score >= 35) return {
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      title: 'Significant Gaps',
      text: "Remote working is probably painful for your team. There are security and productivity issues that need addressing.",
      icon: AlertTriangle
    };
    return {
      color: 'text-red-600',
      bg: 'bg-red-100',
      title: 'Office-Dependent',
      text: "Your business is tied to the office. This limits flexibility, creates security risks, and could cause major disruption if you can't access your premises.",
      icon: XCircle
    };
  };

  const sendToContact = () => {
    const score = calculateScore();
    const categoryScores = getCategoryScores();

    const failedQuestions = questions
      .filter((q, i) => !answers[i + 1])
      .map(q => ({
        category: q.category,
        question: q.question,
        weight: q.weight
      }));

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
        remoteWorkResult: {
          score,
          categoryScores,
          failuresByCategory,
          criticalGaps: failedQuestions.filter(f => f.weight === 3).length
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
          <Laptop size={48} className="mx-auto mb-4 text-highlight" />
          <h3 className="font-heading text-3xl">Can Your Team Work From Anywhere?</h3>
          <p className="text-blue-100">Find out in 2 minutes with our Remote Work Readiness Check.</p>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-600 mb-6 text-lg">
            Whether it's working from home, a client site, or during an office emergency -
            modern businesses need flexibility. Find out if your IT setup supports it.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8 text-center">
            <div className="p-3">
              <Cloud className="mx-auto text-primary mb-2" size={28} />
              <span className="text-xs font-bold text-gray-500">Cloud Access</span>
            </div>
            <div className="p-3">
              <Lock className="mx-auto text-primary mb-2" size={28} />
              <span className="text-xs font-bold text-gray-500">Security</span>
            </div>
            <div className="p-3">
              <Video className="mx-auto text-primary mb-2" size={28} />
              <span className="text-xs font-bold text-gray-500">Collaboration</span>
            </div>
          </div>

          <button onClick={() => setStep(1)} className="bg-accent text-white px-8 py-4 rounded-lg font-bold text-xl shadow-comic hover:shadow-comic-hover hover:translate-y-1 transition-all border-2 border-neutral">
            Start the Check
          </button>
        </div>
      </div>
    );
  }

  // Result Screen
  if (step > questions.length) {
    const result = getResultData();
    const score = calculateScore();
    const categoryScores = getCategoryScores();
    const ResultIcon = result.icon;
    const failedCategories = categoryScores.filter(c => c.percentage < 100);

    return (
      <div className="bg-white rounded-2xl shadow-xl border-4 border-neutral overflow-hidden max-w-3xl mx-auto my-12">
        <div className={`p-8 text-center ${result.bg}`}>
          <ResultIcon size={48} className={`mx-auto mb-4 ${result.color}`} />
          <h3 className="font-heading text-2xl text-neutral mb-2">Your Remote Work Score</h3>
          <div className={`font-heading text-6xl mb-4 ${result.color}`}>{score}%</div>
          <h4 className={`font-bold text-xl ${result.color}`}>{result.title}</h4>
        </div>

        <div className="p-8">
          <p className="text-gray-600 text-center mb-8 text-lg">{result.text}</p>

          {/* Category Breakdown */}
          {failedCategories.length > 0 && (
            <div className="mb-8">
              <h5 className="font-bold text-neutral mb-4">Areas to Improve:</h5>
              <div className="grid md:grid-cols-2 gap-4">
                {failedCategories.map(cat => (
                  <div
                    key={cat.category}
                    className={`p-4 rounded-xl border-2 ${cat.percentage === 0 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-neutral">{cat.category}</span>
                      <span className={`font-bold text-sm ${cat.percentage === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {cat.passed}/{cat.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${cat.percentage === 0 ? 'bg-red-500' : 'bg-yellow-500'}`}
                        style={{ width: `${cat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What we can help with */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-8">
            <h5 className="font-bold text-primary mb-3">How We Can Help:</h5>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span><strong>Microsoft 365 setup</strong> - email, files, and apps that work from anywhere</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span><strong>Security hardening</strong> - MFA, device management, and remote wipe capability</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span><strong>Cloud migration</strong> - move your files and apps off local servers</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={sendToContact} className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
               Get Remote-Ready <ArrowRight size={20} />
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
            <XCircle size={20} /> No / Not Sure
          </button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start text-sm text-blue-800">
           <div className="mt-1"><AlertTriangle size={16} /></div>
           <p><strong>Why this matters:</strong> {currentQ.simpleExplainer}</p>
        </div>
      </div>
    </div>
  );
};
