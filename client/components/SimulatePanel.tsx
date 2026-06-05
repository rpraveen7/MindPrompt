'use client';

import React from 'react';
import { X, Loader2, Play } from 'lucide-react';

interface SimulatePanelProps {
    originalOutput: string;
    optimizedOutput: string;
    loading: boolean;
    onClose: () => void;
}

export const SimulatePanel: React.FC<SimulatePanelProps> = ({
    originalOutput,
    optimizedOutput,
    loading,
    onClose,
}) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-5xl h-[75vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-emerald-400 fill-current" />
                        <h2 className="text-white font-semibold">Output Comparison</h2>
                        <span className="text-xs text-slate-500 ml-1">
                            — what each prompt actually produces
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                        <p className="text-sm">Running both prompts through the model…</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
                        {/* Original output */}
                        <div className="flex-1 flex flex-col border-b sm:border-b-0 sm:border-r border-slate-800 min-h-0">
                            <div className="shrink-0 bg-slate-800/50 px-4 py-3 border-b border-slate-800">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Original Prompt → Output
                                </h3>
                            </div>
                            <div className="flex-1 overflow-auto p-4">
                                <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300 leading-relaxed">
                                    {originalOutput}
                                </pre>
                            </div>
                        </div>

                        {/* Optimized output */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="shrink-0 bg-emerald-950/30 px-4 py-3 border-b border-slate-800">
                                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                                    Optimized Prompt → Output
                                </h3>
                            </div>
                            <div className="flex-1 overflow-auto p-4">
                                <pre className="whitespace-pre-wrap font-mono text-sm text-emerald-100 leading-relaxed">
                                    {optimizedOutput}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
