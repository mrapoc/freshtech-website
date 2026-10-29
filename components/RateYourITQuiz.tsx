import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, ThumbsUp, ThumbsDown, Meh, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  category: string;
  whatGoodLooksLike: string;
}

const questions: Question[] = [
  {
    id: 1,
    question: "How quickly does your IT provider typically respond to urgent issues?",
    category: "Response Time",
    whatGoodLooksLike: "Under 15 minutes for urgent, under 1 hour for standard"
  },
  {
    id: 2,
    question: "Do they proactively contact you about potential issues before they cause problems?",
    category: "Proactivity",
    whatGoodLooksLike: "Regular proactive alerts and quarterly reviews"
  },
  {
    id: 3,
    question: "Can you easily understand the invoices and know exactly what you're paying for?",
    category: "Transparency",
    whatGoodLooksLike: "Clear itemised billing with no surprises"
  },
  {
    id: 4,
    question: "Do they explain technical issues in plain English?",
    category: "Communication",
    whatGoodLooksLike: "Jargon-free explanations and patient support"
  },
  {
    id: 5,
    question: "Are issues usually fixed on the first contact without being passed around?",
    category: "Competence",
    whatGoodLooksLike: "High first-time fix rate from skilled engineers"
  },
  {
    id: 6,
    question: "Do they help you plan for future IT needs and budgets?",
    category: "Strategic Value",
    whatGoodLooksLike: "Regular technology roadmap and budget planning"
  },
  {
    id: 7,
    question: "When you call during business hours, do you get a real person (not voicemail)?",
    category: "Availability",
    whatGoodLooksLike: "Live answer during all business hours"
  },
  {
    id: 8,
    question: "Do they keep your systems updated and secure without you having to ask?",
    category: "Security",
    whatGoodLooksLike: "Automated patching and security monitoring"
  },
  {
    id: 9,
    question: "Are new starters set up quickly and leavers offboarded securely?",
    category: "User Management",
    whatGoodLooksLike: "Same-day setup, immediate secure offboarding"
  },
  {
    id: 10,
    question: "Do you feel like they genuinely care about your business success?",
    category: "Partnership",
    whatGoodLooksLike: "Acts like a partner, not just a vendor"
  }
];

type Rating = 'good' | 'ok' | 'poor';

export const RateYourITQuiz: React.FC = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [ratings, setRatings] = useState<Record<number, Rating>>({});
  const [showResults, setShowResults] = useState(false);

  const handleRating = (rating: Rating) => {
    const newRatings = { ...ratings, [questions[currentQuestion].id]: rating };
    setRatings(newRatings);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    const scores = { good: 0, ok: 0, poor: 0 };
    const categoryResults: { category: string; rating: Rating; whatGoodLooksLike: string }[] = [];

    questions.forEach(q => {
      const rating = ratings[q.id];
      if (rating) {
        scores[rating]++;
        if (rating !== 'good') {
          categoryResults.push({
            category: q.category,
            rating,
            whatGoodLooksLike: q.whatGoodLooksLike
          });
        }
      }
    });

    const totalPoints = scores.good * 10 + scores.ok * 5 + scores.poor * 0;
    const maxPoints = questions.length * 10;
    const percentage = Math.round((totalPoints / maxPoints) * 100);

    return { scores, percentage, improvements: categoryResults };
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A', title: 'Excellent Support', color: 'green', message: "Your IT provider is doing a great job. You're in good hands!" };
    if (percentage >= 75) return { grade: 'B', title: 'Good, But Not Great', color: 'blue', message: 'Solid performance with room for improvement in some areas.' };
    if (percentage >= 60) return { grade: 'C', title: 'Average Support', color: 'yellow', message: 'Your IT support is adequate but there are clear gaps. Worth exploring alternatives.' };
    if (percentage >= 40) return { grade: 'D', title: 'Below Expectations', color: 'orange', message: 'Multiple areas need improvement. Your business deserves better.' };
    return { grade: 'F', title: 'Failing Your Business', color: 'red', message: 'Serious concerns across the board. Time to make a change.' };
  };

  const handleGetHelp = () => {
    const result = calculateScore();
    navigate('/contact', {
      state: {
        itRatingResult: {
          score: result.percentage,
          goodCount: result.scores.good,
          okCount: result.scores.ok,
          poorCount: result.scores.poor,
          improvements: result.improvements
        }
      }
    });
  };

  // Broadcast quiz results to chat widget
  useEffect(() => {
    if (!showResults) return;
    const result = calculateScore();
    const grade = getGrade(result.percentage);
    (window as Window & { __freshpsa_quiz_result?: unknown }).__freshpsa_quiz_result = {
      quizName: 'Rate Your IT',
      score: result.percentage,
      grade: grade.grade,
      title: grade.title,
    };
  }, [showResults]);

  if (showResults) {
    const result = calculateScore();
    const grade = getGrade(result.percentage);

    const gradeColors = {
      green: 'bg-green-50 text-green-700 border-green-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      red: 'bg-red-50 text-red-700 border-red-200'
    };

    return (
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden max-w-2xl mx-auto">
        {/* Grade Display */}
        <div className={`p-8 text-center ${gradeColors[grade.color as keyof typeof gradeColors]}`}>
          <div className="text-6xl font-heading mb-2">{grade.grade}</div>
          <h3 className="font-heading text-2xl mb-1">{grade.title}</h3>
          <div className="text-3xl font-bold">{result.percentage}%</div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">{grade.message}</p>

          {/* Rating Breakdown */}
          <div className="flex justify-center gap-6 mb-6 pb-6 border-b border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 font-bold text-xl">
                <ThumbsUp size={18} /> {result.scores.good}
              </div>
              <div className="text-gray-500 text-xs">Doing Well</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-yellow-600 font-bold text-xl">
                <Meh size={18} /> {result.scores.ok}
              </div>
              <div className="text-gray-500 text-xs">Could Be Better</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-red-600 font-bold text-xl">
                <ThumbsDown size={18} /> {result.scores.poor}
              </div>
              <div className="text-gray-500 text-xs">Needs Work</div>
            </div>
          </div>

          {/* Improvements Needed */}
          {result.improvements.length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold text-neutral mb-3">Where They're Falling Short:</h4>
              <div className="space-y-2">
                {result.improvements.slice(0, 5).map((item, idx) => (
                  <div key={idx} className={`flex items-start gap-2 text-sm p-3 rounded-lg ${
                    item.rating === 'poor' ? 'bg-red-50' : 'bg-yellow-50'
                  }`}>
                    {item.rating === 'poor' ? (
                      <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className={`font-medium ${item.rating === 'poor' ? 'text-red-700' : 'text-yellow-700'}`}>
                        {item.category}
                      </span>
                      <p className="text-gray-600 text-xs mt-0.5">
                        Good IT support: {item.whatGoodLooksLike}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-neutral text-white p-6 rounded-xl text-center">
            <h4 className="font-heading text-xl mb-2">See How We Compare</h4>
            <p className="text-gray-300 text-sm mb-4">
              Get a no-obligation comparison. We'll show you exactly what good IT support looks like.
            </p>
            <button
              onClick={handleGetHelp}
              className="bg-accent hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center gap-2"
            >
              Compare With Fresh Tech
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
            <Star size={20} />
            <span className="font-bold text-sm uppercase tracking-wider">{question.category}</span>
          </div>
          <span className="text-gray-400 text-sm">{currentQuestion + 1} of {questions.length}</span>
        </div>

        {/* Question */}
        <h3 className="font-heading text-xl md:text-2xl text-neutral mb-8">
          {question.question}
        </h3>

        {/* Rating Buttons */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleRating('good')}
            className="p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all text-center group"
          >
            <ThumbsUp size={32} className="mx-auto mb-2 text-green-600" />
            <span className="font-bold text-green-700 text-sm">Yes, Always</span>
          </button>

          <button
            onClick={() => handleRating('ok')}
            className="p-4 rounded-xl border-2 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 hover:border-yellow-400 transition-all text-center group"
          >
            <Meh size={32} className="mx-auto mb-2 text-yellow-600" />
            <span className="font-bold text-yellow-700 text-sm">Sometimes</span>
          </button>

          <button
            onClick={() => handleRating('poor')}
            className="p-4 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all text-center group"
          >
            <ThumbsDown size={32} className="mx-auto mb-2 text-red-600" />
            <span className="font-bold text-red-700 text-sm">Rarely/Never</span>
          </button>
        </div>

        {/* What Good Looks Like Hint */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            <CheckCircle size={12} className="inline mr-1" />
            Good IT support: {question.whatGoodLooksLike}
          </p>
        </div>
      </div>
    </div>
  );
};
