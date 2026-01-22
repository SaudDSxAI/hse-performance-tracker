import React from 'react';
import { Shield, Moon, Sun, LogOut, User, Settings } from 'lucide-react';

export const Navbar = ({
    currentUser,
    darkMode,
    setDarkMode,
    onLogout,
    onSettings
}) => {
    return (
        <nav className="bg-surface border-b border-border sticky top-0 z-40 shadow-sm backdrop-blur-lg bg-opacity-90">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Shield className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight text-text-main leading-none">HSE Tracker</h1>
                            <p className="text-[10px] text-text-body uppercase tracking-widest font-bold opacity-70">Performance Dashboard</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2.5 rounded-xl bg-background hover:bg-border transition-all border border-border shadow-sm"
                            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {darkMode ? <Sun size={18} className="text-warning" /> : <Moon size={18} className="text-text-body" />}
                        </button>

                        <div className="flex items-center gap-3 border-l border-border pl-4 ml-2">
                            <div className="flex flex-col items-end hidden sm:flex">
                                <span className="text-xs font-black text-text-main leading-none">
                                    {currentUser?.full_name || currentUser?.username}
                                </span>
                                <span className="text-[8px] font-black text-text-body uppercase tracking-tighter opacity-50">
                                    {currentUser?.is_admin ? 'Systems Admin' : 'HSE Specialist'}
                                </span>
                            </div>
                            <div className="relative group/user">
                                <div className="w-10 h-10 bg-background rounded-full border-2 border-border flex items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden">
                                    <User size={20} className="text-text-body" />
                                </div>
                                {/* Tooltip / Actions */}
                                <div className="absolute top-full right-0 mt-2 w-48 bg-surface rounded-2xl shadow-2xl border border-border py-2 opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all translate-y-2 group-hover/user:translate-y-0 z-[60]">
                                    <div className="px-4 py-2 border-b border-border/50 mb-1">
                                        <p className="text-[10px] font-black text-text-body uppercase opacity-40">Connected as</p>
                                        <p className="text-xs font-bold text-text-main truncate">{currentUser?.email || currentUser?.username}</p>
                                    </div>
                                    <button
                                        onClick={() => onSettings()}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-text-body hover:text-primary hover:bg-primary/5 transition-all text-left"
                                    >
                                        <Settings size={16} />
                                        Settings & Security
                                    </button>
                                    <button
                                        onClick={onLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-error hover:bg-error/5 transition-all text-left"
                                    >
                                        <LogOut size={16} />
                                        Sign Out Session
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};
