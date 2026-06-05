'use client';

import React, { useState } from 'react';
import { Key, X, Eye, EyeOff, Trash2 } from 'lucide-react';

interface ApiKeySettingsProps {
    currentKey: string;
    onSave: (key: string) => void;
    onClear: () => void;
    onClose: () => void;
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({
    currentKey,
    onSave,
    onClear,
    onClose,
}) => {
    const [newKey, setNewKey] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);

    const maskedCurrent = currentKey
        ? `${currentKey.slice(0, 6)}${'•'.repeat(20)}${currentKey.slice(-4)}`
        : '';

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newKey.trim();
        if (trimmed) {
            onSave(trimmed);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-emerald-400" />
                        <h2 className="text-white font-semibold">API Key Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Current key display */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                            Current Key
                        </label>
                        <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-4 py-3 border border-slate-700">
                            <span className="flex-1 font-mono text-sm text-slate-300 truncate">
                                {showCurrent ? currentKey : maskedCurrent}
                            </span>
                            <button
                                onClick={() => setShowCurrent((v) => !v)}
                                className="text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Update key form */}
                    <form onSubmit={handleSave} className="space-y-3">
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Replace with New Key
                        </label>
                        <input
                            type="password"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            placeholder="AIza..."
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 font-mono text-sm transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={!newKey.trim()}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                        >
                            Save New Key
                        </button>
                    </form>

                    {/* Danger zone */}
                    <div className="pt-2 border-t border-slate-800">
                        <button
                            onClick={onClear}
                            className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Remove key and sign out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
