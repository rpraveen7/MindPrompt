import React, { useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface SignupFormProps {
    onSignupSuccess: (token: string) => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSignupSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:8000/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                const data = await res.json();
                // Check for specific bcrypt error
                if (data.detail && data.detail.includes('72 bytes')) {
                    throw new Error('Password is too long (max ~72 characters).');
                }
                throw new Error(data.detail || 'Signup failed');
            }
            
            const data = await res.json();
            onSignupSuccess(data.access_token);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="text-center text-slate-400 text-sm mb-4 px-4">
                Sign up to see optimized prompts from your friends (and AI).
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-slate-500 pr-10"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded text-sm transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign up'}
                </button>

                {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            </form>
        </div>
    );
};
