import React from 'react';
import { useAnalyticsStore } from '../store/analyticsStore';
import { Award, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

export const PromptEfficiency: React.FC = () => {
  const { metrics } = useAnalyticsStore();

  if (!metrics) return null;

  const score = metrics.efficiency_score;

  // Compute color based on score
  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-emerald-500 border-emerald-500/20';
    if (val >= 60) return 'text-amber-500 border-amber-500/20';
    return 'text-rose-500 border-rose-500/20';
  };

  const getScoreBg = (val: number) => {
    if (val >= 80) return 'bg-emerald-500/10';
    if (val >= 60) return 'bg-amber-500/10';
    return 'bg-rose-500/10';
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">Prompt Efficiency</h2>
        <p className="text-slate-500 mt-1">Optimization metrics calculated based on repetition and structural syntax.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Ring Meter */}
        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-4 shadow-sm shadow-indigo-500/5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Efficiency Rating</h3>
          
          <div className="relative flex items-center justify-center my-4">
            {/* Circular Progress SVG */}
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="rgba(148, 163, 184, 0.1)"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * score) / 100}
                className={`${getScoreColor(score).split(' ')[0]} transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold text-slate-800">{score}</span>
              <span className="text-xs text-slate-400 font-semibold mt-1">/ 100</span>
            </div>
          </div>

          <div className={`px-4 py-1.5 rounded-full border text-xs font-semibold ${getScoreColor(score)} ${getScoreBg(score)}`}>
            {score >= 80 ? 'Optimal Prompting' : score >= 60 ? 'Moderate Efficiency' : 'Action Required'}
          </div>
        </div>

        {/* Actionable Suggestions */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col gap-6 shadow-sm shadow-indigo-500/5">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Guardian Suggestions
          </h3>
          <div className="flex flex-col gap-4">
            {metrics.efficiency_suggestions.map((suggestion, idx) => (
              <div key={idx} className="flex gap-4 items-start bg-white/80 border border-slate-200/60 p-4 rounded-xl shadow-inner">
                <div className="mt-0.5 p-1 rounded bg-amber-500/10 text-amber-600">
                  <ChevronRight className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Improvement Vector</h4>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{suggestion}</p>
                </div>
              </div>
            ))}

            {metrics.efficiency_suggestions.length === 0 && (
              <div className="flex items-center gap-3 text-slate-500 py-6">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Your prompt efficiency is excellent! Keep up the good formatting practice.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details breakdown list */}
      <div className="glass-panel p-6 rounded-2xl shadow-sm shadow-indigo-500/5">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Optimization Parameters Checked</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 border border-slate-200/60 p-4 rounded-xl shadow-inner">
            <span className="text-xs text-slate-500 font-semibold block">Syntax Repetitions</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">Checked (Unique ratio)</span>
            <p className="text-xs text-slate-400 mt-2">Deducts score for copying and pasting identical queries or prompt templates continuously.</p>
          </div>
          <div className="bg-white/80 border border-slate-200/60 p-4 rounded-xl shadow-inner">
            <span className="text-xs text-slate-500 font-semibold block">Thread Expansion</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">Checked (Context bounds)</span>
            <p className="text-xs text-slate-400 mt-2">Flags thread depths exceeding 15 steps. High depths accumulate large history contexts causing rapid token burn.</p>
          </div>
          <div className="bg-white/80 border border-slate-200/60 p-4 rounded-xl shadow-inner">
            <span className="text-xs text-slate-500 font-semibold block">Message Cadence</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">Checked (Frequency intervals)</span>
            <p className="text-xs text-slate-400 mt-2">Penalizes queries sent within 30 seconds of previous output generation, indicating rushed input behavior.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
