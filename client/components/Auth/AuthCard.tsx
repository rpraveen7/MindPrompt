import React from 'react';
import { Zap } from 'lucide-react';

interface AuthCardProps {
    children: React.ReactNode;
    footerLink?: {
        text: string;
        actionText: string;
        onAction: () => void;
    };
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, footerLink }) => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-sm space-y-6">
                {/* Main Card */}
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-lg shadow-xl">
                    {/* Logo */}
                    <div className="flex flex-col items-center justify-center mb-8">
                        <Zap className="w-10 h-10 text-indigo-500 mb-2" />
                        <h1 className="text-2xl font-bold tracking-tight text-white font-mono">MindPrompt</h1>
                    </div>
                    
                    {children}
                </div>

                {/* Footer Card */}
                {footerLink && (
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-center text-sm text-slate-400 shadow-md">
                        {footerLink.text}{' '}
                        <button 
                            onClick={footerLink.onAction}
                            className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
                        >
                            {footerLink.actionText}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
