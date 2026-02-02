import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Award, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { generateSiteQuiz } from '../services/geminiService';
import { QuizQuestion, Artwork } from '../types';

interface QuizModuleProps {
  artwork: Artwork;
  onComplete: (score: number) => void;
  onClose: () => void;
}

const QuizModule: React.FC<QuizModuleProps> = ({ artwork, onComplete, onClose }) => {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuiz() {
      const data = await generateSiteQuiz(artwork.location.name, artwork.title, artwork.description);
      setQuestions(data);
      setLoading(false);
    }
    fetchQuiz();
  }, [artwork]);

  const handleOptionSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    if (idx === questions![currentIndex].correctAnswer) {
      setScore(s => s + 1);
      if (navigator.vibrate) navigator.vibrate(10);
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 50]);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions!.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      onComplete(score);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
        <p className="text-white font-bold text-sm uppercase tracking-widest">Generating Cultural Challenge...</p>
      </div>
    );
  }

  if (!questions) return <div className="p-8 text-white text-center">Quiz unavailable.</div>;

  const current = questions[currentIndex];

  return (
    <div className="p-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`h-1 w-8 rounded-full ${i <= currentIndex ? 'bg-indigo-500' : 'bg-white/10'}`} />
          ))}
        </div>
        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Question {currentIndex + 1}/3</span>
      </div>

      <h3 className="text-white font-bold text-lg mb-8 leading-tight">{current.question}</h3>

      <div className="space-y-3 mb-8">
        {current.options.map((option, idx) => {
          let stateClass = 'bg-white/5 border-white/10 text-slate-300';
          if (isAnswered) {
            if (idx === current.correctAnswer) stateClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
            else if (idx === selectedOption) stateClass = 'bg-red-500/20 border-red-500 text-red-400';
            else stateClass = 'bg-white/5 border-white/10 text-slate-600 opacity-50';
          } else {
            stateClass = 'bg-white/5 border-white/10 text-slate-300 hover:border-indigo-500 hover:text-white';
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionSelect(idx)}
              disabled={isAnswered}
              className={`w-full text-left p-4 rounded-2xl border transition-all text-sm font-medium flex justify-between items-center ${stateClass}`}
            >
              {option}
              {isAnswered && idx === current.correctAnswer && <CheckCircle2 size={18} />}
              {isAnswered && idx === selectedOption && idx !== current.correctAnswer && <XCircle size={18} />}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <p className="text-xs text-slate-400 mb-6 italic">"{current.explanation}"</p>
          <button 
            onClick={nextQuestion}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
          >
            {currentIndex === questions.length - 1 ? 'Finish Challenge' : 'Next Question'}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizModule;