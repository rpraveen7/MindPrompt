import React from 'react';

interface DiffViewerProps {
    oldValue: string;
    newValue: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ oldValue, newValue }) => {
    if (!oldValue && !newValue) return (
        <div className="flex-1 flex items-center justify-center text-slate-500 bg-slate-900 h-full">
            <p>Enter a prompt above to see the optimization result.</p>
        </div>
    );

    return (
        <div className="flex-1 overflow-hidden bg-slate-900 flex flex-col sm:flex-row h-full">
            {/* Original Prompt Column */}
            <div className="flex-1 flex flex-col border-b sm:border-b-0 sm:border-r border-slate-800 min-h-[50%] sm:min-h-0">
                <div className="bg-slate-800/50 p-3 border-b border-slate-800 flex justify-between items-center backdrop-blur-sm sticky top-0">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Original Prompt</h3>
                    <span className="text-xs text-slate-500 font-mono">Input</span>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-slate-900/50">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300 leading-relaxed max-w-none">
                        {oldValue}
                    </pre>
                </div>
            </div>

            {/* Optimized Prompt Column */}
            <div className="flex-1 flex flex-col min-h-[50%] sm:min-h-0 relative">
                <div className="bg-emerald-950/30 p-3 border-b border-slate-800 flex justify-between items-center backdrop-blur-sm sticky top-0">
                    <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        Optimized Prompt
                    </h3>
                    <span className="text-xs text-emerald-500/70 font-mono">CO-STAR Output</span>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-slate-900/50 relative">
                     {/* Subtle grid pattern for the "engineered" look */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                    
                    <pre className="whitespace-pre-wrap font-mono text-sm text-emerald-100 leading-relaxed max-w-none relative z-10">
                        {newValue}
                    </pre>
                </div>
            </div>
        </div>
    );
};