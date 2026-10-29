
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ArrowRight, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const questions = [
  {
    id: 1,
    category: "Firewalls",
    question: "Do you have a firewall protecting your internet connection, and have you changed its default password?",
    explainer: "Your router/firewall is the front door. Default passwords are known to hackers.",
  },
  {
    id: 2,
    category: "Secure Configuration",
    question: "Have you removed software you no longer use, and do you use unique passwords for every account?",
    explainer: "Unused software is a security hole. Reusing passwords means one breach exposes everything.",
  },
  {
    id: 3,
    category: "User Access Control",
    question: "Do you use separate accounts for day-to-day work vs. administrator tasks?",
    explainer: "You shouldn't browse the web as an 'Admin'. If you get a virus while logged in as Admin, the virus gets Admin rights too.",
  },
  {
    id: 4,
    category: "Malware Protection",
    question: "Is antivirus software installed and updated automatically on ALL computers and laptops?",
    explainer: "This includes Windows Defender (which is great!) but it must be active and updating.",
  },
  {
    id: 5,
    category: "Security Update Management",
    question: "Do you install software updates (patches) within 14 days of them being released?",
    explainer: "Hackers exploit known bugs. Updates fix those bugs. Speed is key.",
  }
];

export const CyberReadinessQuiz = () => {
  const [step, setStep] = useState(0); // 0 = Intro, 1-5 = Questions, 6 = Results
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  // Broadcast quiz results to chat widget. Must run unconditionally (before any
  // early return) to keep hook order stable across renders.
  const cyberComplete = step > questions.length;
  useEffect(() => {
    if (!cyberComplete) return;
    const score = calculateScore();
    const result = getResultData();
    (window as Window & { __freshpsa_quiz_result?: unknown }).__freshpsa_quiz_result = {
      quizName: 'Cyber Readiness',
      score,
      title: result.title,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cyberComplete]);

  const handleAnswer = (answer: boolean) => {
    setAnswers(prev => ({ ...prev, [step]: answer }));
    setStep(prev => prev + 1);
  };

  const calculateScore = () => {
    const yesCount = Object.values(answers).filter(a => a).length;
    return Math.round((yesCount / questions.length) * 100);
  };

  const getResultData = () => {
    const score = calculateScore();
    if (score === 100) return { color: 'text-green-600', bg: 'bg-green-100', title: 'Ready for Certification!', text: "You're in great shape. Let's get that badge." };
    if (score >= 60) return { color: 'text-yellow-600', bg: 'bg-yellow-100', title: 'Almost There', text: "You have a solid foundation, but a few critical gaps need closing." };
    return { color: 'text-red-600', bg: 'bg-red-100', title: 'High Risk', text: "Your business is currently vulnerable to basic attacks. We need to act fast." };
  };

  const sendToContact = () => {
    const score = calculateScore();

    // Get failed questions with details
    const failures = questions
      .filter((q, i) => !answers[i + 1])
      .map(q => ({
        category: q.category,
        question: q.question
      }));

    navigate('/contact', {
      state: {
        cyberQuizResult: {
          score,
          totalQuestions: questions.length,
          passedCount: Object.values(answers).filter(a => a).length,
          failures
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
          <Shield size={48} className="mx-auto mb-4 text-highlight" />
          <h3 className="font-heading text-3xl">Is Your Business Secure?</h3>
          <p className="text-blue-100">Take our 60-second Cyber Essentials readiness check.</p>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-600 mb-8 text-lg">
            Cyber Essentials protects you against 80% of common cyber attacks. Find out if you would pass the government standard today.
          </p>
          <button onClick={() => setStep(1)} className="bg-accent text-white px-8 py-4 rounded-lg font-bold text-xl shadow-comic hover:shadow-comic-hover hover:translate-y-1 transition-all border-2 border-neutral">
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  // Result Screen
  if (cyberComplete) {
    const result = getResultData();
    const score = calculateScore();
    return (
      <div className="bg-white rounded-2xl shadow-xl border-4 border-neutral overflow-hidden max-w-2xl mx-auto my-12">
        <div className={`p-8 text-center ${result.bg}`}>
          <h3 className="font-heading text-2xl text-neutral mb-2">Your Readiness Score</h3>
          <div className={`font-heading text-6xl mb-4 ${result.color}`}>{score}%</div>
          <h4 className={`font-bold text-xl ${result.color}`}>{result.title}</h4>
        </div>
        <div className="p-8">
          <p className="text-gray-600 text-center mb-8 text-lg">{result.text}</p>
          
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 text-left">
             <h5 className="font-bold text-neutral mb-3 flex items-center gap-2">
               <CheckCircle className="text-green-500" size={20} /> How we ensure you pass:
             </h5>
             <ul className="space-y-2 text-sm text-gray-600">
               <li>• <strong>Pre-Audit Check:</strong> We scan your network for hidden vulnerabilities.</li>
               <li>• <strong>Policy Pack:</strong> We provide the written policies you need (e.g. Password Policy).</li>
               <li>• <strong>Guaranteed Pass:</strong> We work with the assessor until you get the badge.</li>
             </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={sendToContact} className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
               Get Certified Now <ArrowRight size={20} />
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

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden max-w-2xl mx-auto my-12">
      {/* Progress Bar */}
      <div className="w-full bg-gray-100 h-2">
        <div className="bg-accent h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="p-8 md:p-12">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
           Question {step} of {questions.length} • {currentQ.category}
        </span>
        <h3 className="font-heading text-2xl md:text-3xl text-neutral mb-6 leading-tight">
          {currentQ.question}
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button 
            onClick={() => handleAnswer(true)}
            className="flex-1 py-4 px-6 rounded-xl border-2 border-green-200 bg-green-50 text-green-700 font-bold hover:bg-green-100 hover:border-green-300 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} /> Yes / I think so
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
