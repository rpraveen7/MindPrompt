import React, { useState } from 'react';
import { LockKeyhole, Loader2 } from 'lucide-react';

interface ForgotPasswordProps {
    onBack: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            await fetch('http://localhost:8000/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            setSent(true);
        } catch {
            // Ignore error for mock
            setSent(true);
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="text-center space-y-4">
                <div className="flex justify-center">
                    <div className="p-3 border-2 border-slate-200 rounded-full">
                        <LockKeyhole className="w-8 h-8 text-slate-200" />
                    </div>
                </div>
                <h3 className="font-semibold text-slate-200">Email Sent</h3>
                <p className="text-sm text-slate-400 px-4">
                    We sent an email to the address associated with <strong>{username}</strong> with a link to get back into your account.
                </p>
                <button
                    onClick={onBack}
                    className="text-indigo-400 font-semibold text-sm hover:text-indigo-300"
                >
                    Back to Login
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-center">
            <div className="flex justify-center mb-2">
                <div className="p-3 border-2 border-slate-700 rounded-full">
                    <LockKeyhole className="w-12 h-12 text-slate-200" />
                </div>
            </div>
            <h3 className="font-semibold text-slate-200">Trouble logging in?</h3>
            <p className="text-sm text-slate-400 px-4 mb-4">
                Enter your username and we&apos;ll send you a link to get back into your account.
            </p>

            <div>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-slate-500"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded text-sm transition-colors disabled:opacity-50 flex items-center justify-center"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Login Link'}
            </button>

            <div className="mt-4 border-t border-slate-800 pt-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-slate-200 font-semibold text-sm hover:text-slate-400"
                >
                    Back to Login
                </button>
            </div>
        </form>
    );
};
