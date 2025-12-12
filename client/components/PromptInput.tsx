import React, { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';

interface PromptInputProps {
    value: string;
    onChange: (value: string) => void;
    onOptimize: (prompt: string) => void;
    isLoading: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, onOptimize, isLoading }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onOptimize(value);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                onOptimize(value);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-900 border-b border-slate-800">
            <div className="flex gap-2">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your rough prompt here... (e.g., 'Write code for a snake game')"
                    className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none resize-none h-24 font-mono text-sm text-slate-200 placeholder-slate-500"
                />
                <button
                    type="submit"
                    disabled={isLoading || !value.trim()}
                    className="bg-indigo-600 text-white px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 min-w-[100px] transition-colors shadow-lg shadow-indigo-500/20"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                    <span>Enhance</span>
                </button>
            </div>
        </form>
    );
};
