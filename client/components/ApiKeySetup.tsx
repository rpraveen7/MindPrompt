'use client';

import React, { useState } from 'react';
import { Zap, Key, ExternalLink } from 'lucide-react';

interface ApiKeySetupProps {
    onSubmit: (key: string) => void;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onSubmit }) => {
    const [key, setKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = key.trim();
        if (trimmed) onSubmit(trimmed);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="flex items-center gap-2 text-indigo-400 justify-center mb-8">
                    <Zap className="w-8 h-8 fill-current" />
                    <h1 className="text-3xl font-bold text-white">MindPrompt</h1>
                </div>

                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl shadow-black/30">
                    <div className="flex items-center gap-2 mb-2">
                        <Key className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-lg font-semibold text-white">Enter your Gemini API Key</h2>
                    </div>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Your key is stored only in your browser and sent directly with each request.
                        It is never persisted on our servers.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="AIza..."
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 font-mono text-sm transition-colors"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!key.trim()}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-emerald-900/30"
                        >
                            Get Started
                        </button>
                    </form>

                    <p className="text-slate-500 text-xs mt-5 text-center flex items-center justify-center gap-1">
                        Get a free key at
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-0.5 transition-colors"
                        >
                            Google AI Studio <ExternalLink className="w-3 h-3" />
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};
