'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PromptInput } from '../components/PromptInput';
import { DiffViewer } from '../components/DiffViewer';
import { MetricsBar } from '../components/MetricsBar';
import { Sidebar } from '../components/Sidebar';
import { ApiKeySetup } from '../components/ApiKeySetup';
import { ApiKeySettings } from '../components/ApiKeySettings';
import { Zap, Settings } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const STORAGE_KEY = 'mindprompt_api_key';

interface Metric {
    token_count: number;
    readability_score: number;
}

interface Prompt {
    act?: string;
    prompt: string;
}

interface HistoryItem {
    id: string;
    original: string;
    optimized: string;
    original_metrics: Metric;
    optimized_metrics: Metric;
    timestamp: number;
}

interface ApiHistoryItem {
    id: string;
    original_text: string;
    optimized_text: string;
    model_used: string | null;
    token_count_original: number;
    token_count_optimized: number;
    readability_original: number;
    readability_optimized: number;
    created_at: string;
}

function mapApiHistory(item: ApiHistoryItem): HistoryItem {
    return {
        id: item.id,
        original: item.original_text,
        optimized: item.optimized_text,
        original_metrics: {
            token_count: item.token_count_original,
            readability_score: item.readability_original,
        },
        optimized_metrics: {
            token_count: item.token_count_optimized,
            readability_score: item.readability_optimized,
        },
        timestamp: new Date(item.created_at).getTime(),
    };
}

export default function Home() {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    const [input, setInput] = useState('');
    const [original, setOriginal] = useState('');
    const [optimized, setOptimized] = useState('');
    const [metrics, setMetrics] = useState<{ original: Metric; optimized: Metric; examplesUsed: number } | null>(null);
    const [similar, setSimilar] = useState<Prompt[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Load API key from storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setApiKey(saved);
    }, []);

    // Load history from API whenever API key changes
    const loadHistory = useCallback(async (key: string) => {
        try {
            const res = await fetch(`${API_URL}/history`, {
                headers: { 'X-Gemini-Api-Key': key },
            });
            if (!res.ok) return;
            const data: ApiHistoryItem[] = await res.json();
            setHistory(data.map(mapApiHistory));
        } catch {
            // Non-fatal — history just won't load
        }
    }, []);

    useEffect(() => {
        if (apiKey) loadHistory(apiKey);
        else setHistory([]);
    }, [apiKey, loadHistory]);

    const handleSaveApiKey = (key: string) => {
        localStorage.setItem(STORAGE_KEY, key);
        setApiKey(key);
    };

    const handleClearApiKey = () => {
        localStorage.removeItem(STORAGE_KEY);
        setApiKey(null);
        setShowSettings(false);
        setHistory([]);
        setOriginal('');
        setOptimized('');
        setMetrics(null);
        setSimilar([]);
    };

    const handleOptimize = async (text: string) => {
        if (!apiKey) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/optimize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Gemini-Api-Key': apiKey,
                },
                body: JSON.stringify({ prompt: text }),
            });

            if (res.status === 401) {
                alert('Your API key was rejected. Please check it in settings.');
                return;
            }
            if (!res.ok) throw new Error('Optimization failed');

            const data = await res.json();
            setOriginal(data.original_prompt);
            setOptimized(data.optimized_prompt);
            setMetrics({
                original: data.original_metrics,
                optimized: data.optimized_metrics,
                examplesUsed: data.examples_used ?? 0,
            });
            setSimilar(data.similar_prompts);

            // Refresh history from API (new item was saved server-side)
            loadHistory(apiKey);
        } catch (err) {
            console.error(err);
            alert('Failed to optimize prompt. Ensure the backend is running.');
        } finally {
            setLoading(false);
        }
    };


    const handleSelectHistory = (item: HistoryItem) => {
        setInput(item.original);
        setOriginal(item.original);
        setOptimized(item.optimized);
        setMetrics({
            original: item.original_metrics,
            optimized: item.optimized_metrics,
            examplesUsed: 0,
        });
    };

    const handleDeleteHistory = async (id: string) => {
        if (!apiKey) return;
        setHistory((prev) => prev.filter((h) => h.id !== id));
        try {
            await fetch(`${API_URL}/history/${id}`, {
                method: 'DELETE',
                headers: { 'X-Gemini-Api-Key': apiKey },
            });
        } catch {
            // Silently fail — UI already updated optimistically
        }
    };

    // Show API key setup screen if no key
    if (!apiKey) {
        return <ApiKeySetup onSubmit={handleSaveApiKey} />;
    }

    return (
        <div className="flex h-screen bg-slate-900 font-sans text-slate-50">
            <Sidebar
                prompts={similar}
                history={history}
                onSelect={setInput}
                onSelectHistory={handleSelectHistory}
                onDeleteHistory={handleDeleteHistory}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Zap className="w-6 h-6 fill-current" />
                        <h1 className="text-xl font-bold tracking-tight text-white">MindPrompt</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-slate-500 font-mono">v2.0.0</div>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="text-slate-400 hover:text-emerald-400 transition-colors"
                            title="API Key Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <PromptInput
                    value={input}
                    onChange={setInput}
                    onOptimize={handleOptimize}
                    isLoading={loading}
                />

                {metrics && (
                    <MetricsBar
                        original={metrics.original}
                        optimized={metrics.optimized}
                        examplesUsed={metrics.examplesUsed}
                    />
                )}

                <DiffViewer
                    oldValue={original}
                    newValue={optimized}
                />
            </div>

            {/* Modals */}
            {showSettings && (
                <ApiKeySettings
                    currentKey={apiKey}
                    onSave={handleSaveApiKey}
                    onClear={handleClearApiKey}
                    onClose={() => setShowSettings(false)}
                />
            )}

        </div>
    );
}
