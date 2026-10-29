import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, ArrowRight, Clock, MessageSquare, TrendingUp, Shield, Users, FileText, Phone, Zap } from 'lucide-react';

interface Question {
  id: number;
  category: string;
  categoryIcon: React.ElementType;
  question: string;
  goodSign: string;
  badSign: string;
  weight: number;
}

const questions: Question[] = [
  {
    id: 1,
    category: "Response Time",
    categoryIcon: Clock,
    question: "When you log a support ticket, do you typically get a response within 15 minutes?",
    goodSign: "Fast response = proactive team",
    badSign: "Slow response = overloaded or understaffed",
    weight: 3
  },
  {
    id: 2,
    category: "Communication",
    categoryIcon: MessageSquare,
    question: "Does your IT provider explain issues in plain English (not jargon)?",
    goodSign: "Good communication builds trust",
    badSign: "Jargon can hide lack of solutions",
    weight: 2
  },
  {
    id: 3,
    category: "Proactive",
    categoryIcon: TrendingUp,
    question: "Have they proactively suggested improvements to your IT in the last 6 months?",
    goodSign: "Proactive = partner, not just fixer",
    badSign: "Reactive only = waiting for problems",
    weight: 3
  },
  {
    id: 4,
    category: "Security",
    categoryIcon: Shield,
    question: "Do they regularly update you on security threats and how you're protected?",
    goodSign: "Security-focused = modern approach",
    badSign: "Silence on security = potential gaps",
    weight: 3
  },
  {
    id: 5,
    category: "Availability",
    categoryIcon: Phone,
    question: "Can you reach a real person (not just voicemail) when you call during business hours?",
    goodSign: "Available = properly resourced",
    badSign: "Always voicemail = stretched thin",
    weight: 2
  },
  {
    id: 6,
    category: "Transparency",
    categoryIcon: FileText,
    question: "Do you clearly understand what's included in your contract vs. what costs extra?",
    goodSign: "Clear pricing = honest relationship",
    badSign: "Surprise bills = poor communication",
    weight: 2
  },
  {
    id: 7,
    category: "Knowledge",
    categoryIcon: Users,
    question: "Does your IT provider know your business well enough to anticipate your needs?",
    goodSign: "Business understanding = strategic value",
    badSign: "Generic support = commodity service",
    weight: 2
  },
  {
    id: 8,
    category: "Resolution",
    categoryIcon: Zap,
    question: "Are most issues fixed on the first contact (without being passed around)?",
    goodSign: "First-time fix = skilled engineers",
    badSign: "Escalation loops = junior staff or poor training",
    weight: 3
  }
];

export const ITProviderScorecard: React.FC = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (answer: boolean) => {
    const newAnswers = { ...answers, [questions[currentQuestion].id]: answer };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let earned = 0;
    let total = 0;
    const failures: { category: string; question: string; impact: string }[] = [];

    questions.forEach(q => {
      total += q.weight;
      if (answers[q.id]) {
        earned += q.weight;
      } else {
        failures.push({
          category: q.category,
          question: q.question,
          impact: q.badSign
        });
      }
    });

    return {
      score: Math.round((earned / total) * 100),
      failures,
      yesCount: Object.values(answers).filter(Boolean).length,
      noCount: Object.values(answers).filter(v => !v).length
    };
  };

  const getVerdict = (score: number) => {
    if (score >= 85) return {
      title: "Your IT Provider Is Doing Well",
      color: "text-green-600",
      bg: "bg-green-50",
      message: "You're in good hands. Your provider shows signs of being proactive and professional. Still, it never hurts to know your options."
    };
    if (score >= 60) return {
      title: "Room For Improvement",
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      message: "Your IT support has gaps. Some of these could be costing you money or leaving you vulnerable. Worth exploring alternatives."
    };
    if (score >= 40) return {
      title: "Significant Concerns",
      color: "text-orange-600",
      bg: "bg-orange-50",
      message: "Multiple red flags here. Your current provider may be coasting on your contract. Time for a serious conversation - or a change."
    };
    return {
      title: "Time To Switch",
      color: "text-red-600",
      bg: "bg-red-50",
      message: "Your IT provider is failing you. These gaps put your business at risk. We'd strongly recommend exploring other options immediately."
    };
  };

  const handleGetHelp = () => {
    const result = calculateScore();
    navigate('/contact', {
      state: {
        providerScorecardResult: {
          score: result.score,
          failures: result.failures,
          yesCount: result.yesCount,
          noCount: result.noCount
        }
      }
    });
  };

  if (showResults) {
    const result = calculateScore();
    const verdict = getVerdict(result.score);

    return (
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden max-w-2xl mx-auto">
        <div className={`${verdict.bg} p-6 text-center`}>
          <div className={`text-5xl font-heading ${verdict.color} mb-2`}>{result.score}%</div>
          <h3 className={`font-heading text-2xl ${verdict.color}`}>{verdict.title}</h3>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">{verdict.message}</p>

          {/* Score Breakdown */}
          <div className="flex justify-center gap-8 mb-6 pb-6 border-b border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 font-bold text-2xl">
                <CheckCircle size={20} /> {result.yesCount}
              </div>
              <div className="text-gray-500 text-sm">Doing Well</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-red-600 font-bold text-2xl">
                <XCircle size={20} /> {result.noCount}
              </div>
              <div className="text-gray-500 text-sm">Needs Work</div>
            </div>
          </div>

          {/* Failures List */}
          {result.failures.length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold text-neutral mb-3">Areas of Concern:</h4>
              <div className="space-y-2">
                {result.failures.map((failure, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-red-700">{failure.category}:</span>
                      <span className="text-red-600 ml-1">{failure.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-neutral text-white p-6 rounded-xl text-center">
            <h4 className="font-heading text-xl mb-2">Want To Compare?</h4>
            <p className="text-gray-300 text-sm mb-4">
              See how Fresh Tech stacks up against your current provider. No obligation, just honest advice.
            </p>
            <button
              onClick={handleGetHelp}
              className="bg-accent hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center gap-2"
            >
              Get a Free Comparison
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const Icon = question.categoryIcon;
  const progress = ((currentQuestion) / questions.length) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="h-2 bg-gray-100">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-6 md:p-8">
        {/* Category Badge */}
        <div className="flex items-center gap-2 text-primary mb-4">
          <Icon size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">{question.category}</span>
          <span className="text-gray-400 text-sm ml-auto">{currentQuestion + 1} of {questions.length}</span>
        </div>

        {/* Question */}
        <h3 className="font-heading text-xl md:text-2xl text-neutral mb-6">
          {question.question}
        </h3>

        {/* Answer Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleAnswer(true)}
            className="p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all group"
          >
            <CheckCircle size={32} className="mx-auto mb-2 text-green-600" />
            <span className="font-bold text-green-700">Yes</span>
            <p className="text-xs text-green-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {question.goodSign}
            </p>
          </button>

          <button
            onClick={() => handleAnswer(false)}
            className="p-4 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all group"
          >
            <XCircle size={32} className="mx-auto mb-2 text-red-600" />
            <span className="font-bold text-red-700">No</span>
            <p className="text-xs text-red-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {question.badSign}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
