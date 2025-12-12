'use client';

import React, { useState, useEffect } from 'react';
import { PromptInput } from '../components/PromptInput';
import { DiffViewer } from '../components/DiffViewer';
import { MetricsBar } from '../components/MetricsBar';
import { Sidebar } from '../components/Sidebar';
import { Zap, LogOut } from 'lucide-react';
import { AuthCard } from '../components/Auth/AuthCard';
import { LoginForm } from '../components/Auth/LoginForm';
import { SignupForm } from '../components/Auth/SignupForm';
import { ForgotPassword } from '../components/Auth/ForgotPassword';

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

type AuthView = 'login' | 'signup' | 'forgot';

export default function Home() {
    // Auth State
    const [token, setToken] = useState<string | null>(null);
    const [authView, setAuthView] = useState<AuthView>('login');
    
    // App State
    const [input, setInput] = useState('');
    const [original, setOriginal] = useState('');
    const [optimized, setOptimized] = useState('');
    const [metrics, setMetrics] = useState<{ original: Metric, optimized: Metric } | null>(null);
    const [similar, setSimilar] = useState<Prompt[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        // 1. Check Token
        const savedToken = localStorage.getItem('mindprompt_token');
        if (savedToken) {
            setToken(savedToken);
        }

        // 2. Load History
        const savedHistory = localStorage.getItem('mindprompt_history');
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                // Filter items older than 7 days
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                const valid = parsed.filter((item: HistoryItem) => item.timestamp > sevenDaysAgo);
                
                setHistory(valid);
                
                if (valid.length !== parsed.length) {
                    localStorage.setItem('mindprompt_history', JSON.stringify(valid));
                }
            } catch (e) {
                console.error("Failed to load history", e);
            }
        }
    }, []);

    const handleLoginSuccess = (newToken: string) => {
        localStorage.setItem('mindprompt_token', newToken);
        setToken(newToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('mindprompt_token');
        setToken(null);
        setAuthView('login');
    };

    const handleOptimize = async (text: string) => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/optimize', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}` // Uncomment when backend enforces auth
                },
                body: JSON.stringify({ prompt: text })
            });
            
            if (!res.ok) throw new Error('Optimization failed');
            
            const data = await res.json();
            setOriginal(data.original_prompt);
            setOptimized(data.optimized_prompt);
            setMetrics({
                original: data.original_metrics,
                optimized: data.optimized_metrics
            });
            setSimilar(data.similar_prompts);

            // Save to History
            const newItem: HistoryItem = {
                id: crypto.randomUUID(),
                original: data.original_prompt,
                optimized: data.optimized_prompt,
                original_metrics: data.original_metrics,
                optimized_metrics: data.optimized_metrics,
                timestamp: Date.now()
            };
            
            const newHistory = [newItem, ...history];
            setHistory(newHistory);
            localStorage.setItem('mindprompt_history', JSON.stringify(newHistory));

        } catch (err) {
            console.error(err);
            alert("Failed to optimize prompt. Ensure backend is running.");
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
            optimized: item.optimized_metrics
        });
    };

    const handleDeleteHistory = (id: string) => {
        const newHistory = history.filter(item => item.id !== id);
        setHistory(newHistory);
        localStorage.setItem('mindprompt_history', JSON.stringify(newHistory));
    };

    // --- RENDER AUTH SCREENS ---
    if (!token) {
        if (authView === 'login') {
            return (
                <AuthCard
                    footerLink={{
                        text: "Don't have an account?",
                        actionText: "Sign up",
                        onAction: () => setAuthView('signup')
                    }}
                >
                    <LoginForm 
                        onLogin={handleLoginSuccess} 
                        onForgotPassword={() => setAuthView('forgot')} 
                    />
                </AuthCard>
            );
        }
        if (authView === 'signup') {
            return (
                <AuthCard
                    footerLink={{
                        text: "Have an account?",
                        actionText: "Log in",
                        onAction: () => setAuthView('login')
                    }}
                >
                    <SignupForm onSignupSuccess={handleLoginSuccess} />
                </AuthCard>
            );
        }
        if (authView === 'forgot') {
            return (
                <AuthCard>
                    <ForgotPassword onBack={() => setAuthView('login')} />
                </AuthCard>
            );
        }
    }

    // --- RENDER APP SCREEN ---
    return (
        <div className="flex h-screen bg-slate-900 font-sans text-slate-50">
            {/* Sidebar */}
            <Sidebar 
                prompts={similar} 
                history={history}
                onSelect={setInput} 
                onSelectHistory={handleSelectHistory}
                onDeleteHistory={handleDeleteHistory}
            />
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Zap className="w-6 h-6 fill-current" />
                        <h1 className="text-xl font-bold tracking-tight text-white">MindPrompt</h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-slate-500 font-mono">v1.0.0</div>
                        <button 
                            onClick={handleLogout}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                            title="Log out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>
                
                {/* Input Area */}
                <PromptInput value={input} onChange={setInput} onOptimize={handleOptimize} isLoading={loading} />
                
                {/* Metrics */}
                {metrics && (
                    <MetricsBar original={metrics.original} optimized={metrics.optimized} />
                )}
                
                {/* Diff View */}
                <DiffViewer oldValue={original} newValue={optimized} />
            </div>
        </div>
    );
}