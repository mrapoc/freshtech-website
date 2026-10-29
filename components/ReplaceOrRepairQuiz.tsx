import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, ArrowRight, Wrench, ShoppingCart, AlertTriangle } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: {
    label: string;
    repairPoints: number;
    replacePoints: number;
    costImplication?: string;
  }[];
}

const questions: Question[] = [
  {
    id: 'age',
    question: "How old is the device?",
    options: [
      { label: "Less than 2 years", repairPoints: 3, replacePoints: 0 },
      { label: "2-4 years", repairPoints: 2, replacePoints: 1 },
      { label: "4-6 years", repairPoints: 1, replacePoints: 2 },
      { label: "Over 6 years", repairPoints: 0, replacePoints: 3, costImplication: "Parts may be unavailable" }
    ]
  },
  {
    id: 'issue',
    question: "What's the main problem?",
    options: [
      { label: "Slow performance / freezing", repairPoints: 2, replacePoints: 1 },
      { label: "Screen damage", repairPoints: 1, replacePoints: 2, costImplication: "Screen repairs often cost 40-60% of device value" },
      { label: "Battery not holding charge", repairPoints: 3, replacePoints: 0 },
      { label: "Won't turn on / hardware failure", repairPoints: 0, replacePoints: 3 },
      { label: "Multiple issues", repairPoints: 0, replacePoints: 3 }
    ]
  },
  {
    id: 'history',
    question: "Has it been repaired before?",
    options: [
      { label: "No, first issue", repairPoints: 3, replacePoints: 0 },
      { label: "Yes, once", repairPoints: 2, replacePoints: 1 },
      { label: "Yes, multiple times", repairPoints: 0, replacePoints: 3, costImplication: "Repeated repairs suggest underlying problems" }
    ]
  },
  {
    id: 'warranty',
    question: "Is it under warranty?",
    options: [
      { label: "Yes, manufacturer warranty", repairPoints: 3, replacePoints: 0 },
      { label: "Yes, extended warranty", repairPoints: 3, replacePoints: 0 },
      { label: "No / expired", repairPoints: 1, replacePoints: 2 },
      { label: "Not sure", repairPoints: 1, replacePoints: 1 }
    ]
  },
  {
    id: 'specs',
    question: "How do the specs compare to current needs?",
    options: [
      { label: "Still plenty powerful", repairPoints: 3, replacePoints: 0 },
      { label: "Adequate but not great", repairPoints: 2, replacePoints: 1 },
      { label: "Struggling with modern software", repairPoints: 0, replacePoints: 3, costImplication: "Productivity loss compounds repair cost" },
      { label: "Not sure", repairPoints: 1, replacePoints: 1 }
    ]
  },
  {
    id: 'os',
    question: "What operating system does it run?",
    options: [
      { label: "Windows 11", repairPoints: 3, replacePoints: 0 },
      { label: "Windows 10 (upgradeable to 11)", repairPoints: 2, replacePoints: 1 },
      { label: "Windows 10 (can't upgrade to 11)", repairPoints: 0, replacePoints: 3, costImplication: "Windows 10 support ends Oct 2025" },
      { label: "macOS (recent)", repairPoints: 2, replacePoints: 1 },
      { label: "Older OS / unsupported", repairPoints: 0, replacePoints: 3 }
    ]
  },
  {
    id: 'criticality',
    question: "How critical is this device to daily work?",
    options: [
      { label: "Essential - can't work without it", repairPoints: 1, replacePoints: 2, costImplication: "Downtime costs may exceed repair savings" },
      { label: "Important but have workarounds", repairPoints: 2, replacePoints: 1 },
      { label: "Nice to have / backup device", repairPoints: 3, replacePoints: 0 }
    ]
  }
];

export const ReplaceOrRepairQuiz: React.FC = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { repairPoints: number; replacePoints: number; costNote?: string }>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (option: typeof questions[0]['options'][0]) => {
    const question = questions[currentQuestion];
    const newAnswers = {
      ...answers,
      [question.id]: {
        repairPoints: option.repairPoints,
        replacePoints: option.replacePoints,
        costNote: option.costImplication
      }
    };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateResult = () => {
    let repairTotal = 0;
    let replaceTotal = 0;
    const costNotes: string[] = [];

    Object.values(answers).forEach(answer => {
      repairTotal += answer.repairPoints;
      replaceTotal += answer.replacePoints;
      if (answer.costNote) costNotes.push(answer.costNote);
    });

    const total = repairTotal + replaceTotal;
    const repairPercentage = Math.round((repairTotal / total) * 100);
    const replacePercentage = 100 - repairPercentage;

    let recommendation: 'repair' | 'replace' | 'borderline';
    if (repairPercentage >= 65) recommendation = 'repair';
    else if (replacePercentage >= 65) recommendation = 'replace';
    else recommendation = 'borderline';

    return { repairPercentage, replacePercentage, recommendation, costNotes };
  };

  const handleGetHelp = () => {
    const result = calculateResult();
    navigate('/contact', {
      state: {
        hardwareAssessmentResult: {
          recommendation: result.recommendation,
          repairScore: result.repairPercentage,
          replaceScore: result.replacePercentage,
          costFactors: result.costNotes
        }
      }
    });
  };

  if (showResults) {
    const result = calculateResult();

    const verdicts = {
      repair: {
        title: "Repair Makes Sense",
        icon: Wrench,
        color: "green",
        message: "Based on your answers, repairing this device is likely the more cost-effective choice. The device still has useful life left."
      },
      replace: {
        title: "Time to Replace",
        icon: ShoppingCart,
        color: "blue",
        message: "The numbers suggest replacement is the smarter investment. Repair costs, plus hidden productivity losses, likely outweigh a new device."
      },
      borderline: {
        title: "It's a Close Call",
        icon: AlertTriangle,
        color: "yellow",
        message: "This one could go either way. The decision depends on factors like exact repair cost and your budget timing. Let's discuss."
      }
    };

    const verdict = verdicts[result.recommendation];
    const VerdictIcon = verdict.icon;

    return (
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden max-w-2xl mx-auto">
        <div className={`p-6 text-center ${
          verdict.color === 'green' ? 'bg-green-50' :
          verdict.color === 'blue' ? 'bg-blue-50' :
          'bg-yellow-50'
        }`}>
          <VerdictIcon size={48} className={`mx-auto mb-3 ${
            verdict.color === 'green' ? 'text-green-600' :
            verdict.color === 'blue' ? 'text-blue-600' :
            'text-yellow-600'
          }`} />
          <h3 className={`font-heading text-2xl ${
            verdict.color === 'green' ? 'text-green-700' :
            verdict.color === 'blue' ? 'text-blue-700' :
            'text-yellow-700'
          }`}>{verdict.title}</h3>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">{verdict.message}</p>

          {/* Score Bars */}
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-green-700 flex items-center gap-1"><Wrench size={14} /> Repair</span>
                <span className="font-bold text-green-700">{result.repairPercentage}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${result.repairPercentage}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-blue-700 flex items-center gap-1"><ShoppingCart size={14} /> Replace</span>
                <span className="font-bold text-blue-700">{result.replacePercentage}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${result.replacePercentage}%` }} />
              </div>
            </div>
          </div>

          {/* Cost Notes */}
          {result.costNotes.length > 0 && (
            <div className="bg-orange-50 p-4 rounded-xl mb-6">
              <h4 className="font-bold text-orange-700 mb-2 flex items-center gap-2">
                <AlertTriangle size={16} />
                Cost Factors to Consider
              </h4>
              <ul className="text-sm text-orange-700 space-y-1">
                {result.costNotes.map((note, idx) => (
                  <li key={idx}>• {note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="bg-neutral text-white p-6 rounded-xl text-center">
            <h4 className="font-heading text-xl mb-2">Want Expert Advice?</h4>
            <p className="text-gray-300 text-sm mb-4">
              We can assess the device properly and give you exact costs for both options - no obligation.
            </p>
            <button
              onClick={handleGetHelp}
              className="bg-accent hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center gap-2"
            >
              Get a Professional Assessment
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion) / questions.length) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="h-2 bg-gray-100">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-primary">
            <Monitor size={20} />
            <span className="font-bold text-sm uppercase tracking-wider">Hardware Assessment</span>
          </div>
          <span className="text-gray-400 text-sm">{currentQuestion + 1} of {questions.length}</span>
        </div>

        {/* Question */}
        <h3 className="font-heading text-xl md:text-2xl text-neutral mb-6">
          {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              className="w-full p-4 text-left rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <span className="font-medium text-neutral group-hover:text-primary">{option.label}</span>
              {option.costImplication && (
                <span className="block text-xs text-orange-600 mt-1">⚠️ {option.costImplication}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
