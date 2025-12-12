import React from 'react';
import { ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

interface Metric {
  token_count: number;
  readability_score: number;
}

interface MetricsBarProps {
  original: Metric;
  optimized: Metric;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ original, optimized }) => {
  const tokenSaving = original.token_count - optimized.token_count;
  const tokenPercent = original.token_count > 0 ? (tokenSaving / original.token_count) * 100 : 0;
  
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-slate-900 border-b border-slate-800 text-sm items-center shadow-inner shadow-black/20">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-400">Tokens:</span>
        <span className="line-through text-slate-600">{original.token_count}</span>
        <ArrowRight className="w-4 h-4 text-slate-600" />
        <span className="font-bold text-emerald-400">{optimized.token_count}</span>
        {original.token_count > 0 && (
            <span className={clsx("px-2 py-0.5 rounded text-xs font-medium", tokenSaving >= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20")}>
                {tokenSaving >= 0 ? `-${tokenPercent.toFixed(1)}%` : `+${Math.abs(tokenPercent).toFixed(1)}%`}
            </span>
        )}
      </div>
      
      <div className="h-4 w-px bg-slate-700 mx-2 hidden sm:block" />
      
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-400">Readability (Grade):</span>
         <span className="text-slate-600">{original.readability_score}</span>
        <ArrowRight className="w-4 h-4 text-slate-600" />
        <span className="font-bold text-sky-400">{optimized.readability_score}</span>
      </div>
    </div>
  );
};
