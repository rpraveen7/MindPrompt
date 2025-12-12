import React from 'react';
import { BookOpen, Clock, History, X } from 'lucide-react';

interface Prompt {
    act?: string;
    prompt: string;
}

interface HistoryItem {
    id: string;
    original: string;
    optimized: string;
    timestamp: number;
}

interface SidebarProps {
    prompts: Prompt[];
    history: HistoryItem[];
    onSelect: (prompt: string) => void;
    onSelectHistory: (item: HistoryItem) => void;
    onDeleteHistory: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ prompts, history, onSelect, onSelectHistory, onDeleteHistory }) => {
    // Format timestamp to readable date
    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="w-80 bg-slate-900 border-r border-slate-800 h-full overflow-y-auto flex flex-col hidden lg:flex">
            {/* History Section */}
            <div className="p-4 border-b border-slate-800 flex-1 overflow-y-auto min-h-[200px]">
                <h3 className="font-bold text-slate-300 flex items-center gap-2 mb-4 sticky top-0 bg-slate-900 z-10 py-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    Recent History
                </h3>
                <div className="space-y-3">
                    {history.length === 0 ? (
                        <p className="text-slate-500 text-sm italic">No history yet.</p>
                    ) : (
                        history.map((item) => (
                            <div 
                                key={item.id} 
                                onClick={() => onSelectHistory(item)}
                                className="p-3 bg-slate-800/50 rounded border border-slate-700/50 text-xs hover:bg-slate-800 hover:border-emerald-500/30 transition-colors cursor-pointer group relative pr-6"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteHistory(item.id);
                                    }}
                                    className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-slate-700/50 rounded"
                                    title="Delete"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                                <div className="flex justify-between text-slate-500 mb-1">
                                    <span className="font-mono text-[10px]">{formatDate(item.timestamp)}</span>
                                </div>
                                <p className="text-slate-300 line-clamp-2 group-hover:text-emerald-200 transition-colors">{item.original}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Golden Prompts Section */}
            <div className="p-4 flex-1 overflow-y-auto border-t border-slate-800 bg-slate-900/50">
                <h3 className="font-bold text-slate-300 flex items-center gap-2 mb-4 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 py-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    Similar Golden Prompts
                </h3>
                <div className="space-y-4">
                    {prompts.length === 0 ? (
                        <p className="text-slate-500 text-sm">No similar prompts found yet. Try optimizing a prompt!</p>
                    ) : (
                        prompts.map((p, i) => (
                            <div 
                                key={i} 
                                onClick={() => onSelect(p.prompt)}
                                className="p-3 bg-slate-800 rounded border border-slate-700 text-xs hover:bg-slate-750 hover:border-indigo-500/30 transition-colors cursor-pointer group" 
                                title="Click to use this prompt"
                            >
                                {p.act && <div className="font-semibold text-indigo-400 mb-1 group-hover:text-indigo-300">{p.act}</div>}
                                <p className="text-slate-300 line-clamp-4 leading-relaxed group-hover:text-slate-200">{p.prompt}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
