import React, { useState } from 'react';
import { Shield, Eye, EyeOff, User, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage = ({ onLogin, onSignup, loading, error }) => {
    const [mode, setMode] = useState('login'); // 'login' or 'signup'
    const [form, setForm] = useState({
        username: '',
        password: '',
        email: '',
        fullName: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (mode === 'login') {
            await onLogin(form.username, form.password);
        } else {
            await onSignup({
                username: form.username,
                password: form.password,
                email: form.email,
                full_name: form.fullName
            });
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'signup' : 'login');
        setForm({ username: '', password: '', email: '', fullName: '' });
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]"></div>
            </div>

            <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-[440px] p-8 border border-border relative z-10">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary/40 rotate-3">
                        <Shield className="text-white" size={32} />
                    </div>
                    <h1 className="text-4xl font-black text-text-main tracking-tight">HSE DASHBOARD</h1>
                    <p className="text-text-body mt-2 font-bold uppercase tracking-widest text-[10px] opacity-60">
                        {mode === 'login' ? 'Secure Access Portal' : 'Create Management Account'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <>
                            <div className="relative group">
                                <label className="text-[10px] font-black text-text-body absolute top-2 left-4 z-10 uppercase tracking-tighter opacity-40">Full Name</label>
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 mt-1 text-text-body opacity-40 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={form.fullName}
                                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                    className="w-full bg-background border border-border rounded-2xl pl-12 pr-4 pt-6 pb-2.5 text-text-main font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    placeholder="e.g. Faisal Ahmad"
                                    required={mode === 'signup'}
                                />
                            </div>
                            <div className="relative group">
                                <label className="text-[10px] font-black text-text-body absolute top-2 left-4 z-10 uppercase tracking-tighter opacity-40">Email Address</label>
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 mt-1 text-text-body opacity-40 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full bg-background border border-border rounded-2xl pl-12 pr-4 pt-6 pb-2.5 text-text-main font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    placeholder="name@company.com"
                                    required={mode === 'signup'}
                                />
                            </div>
                        </>
                    )}

                    <div className="relative group">
                        <label className="text-[10px] font-black text-text-body absolute top-2 left-4 z-10 uppercase tracking-tighter opacity-40">Username</label>
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 mt-1 text-text-body opacity-40 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            className="w-full bg-background border border-border rounded-2xl pl-12 pr-4 pt-6 pb-2.5 text-text-main font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    <div className="relative group">
                        <label className="text-[10px] font-black text-text-body absolute top-2 left-4 z-10 uppercase tracking-tighter opacity-40">Password</label>
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 mt-1 text-text-body opacity-40 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full bg-background border border-border rounded-2xl pl-12 pr-12 pt-6 pb-2.5 text-text-main font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 mt-1 text-text-body hover:text-text-main transition-colors p-1"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl animate-shake">
                            <p className="text-red-500 text-xs font-black text-center uppercase tracking-tight">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-4 rounded-2xl hover:opacity-95 disabled:opacity-50 font-black text-base uppercase tracking-[0.1em] transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 group"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                {mode === 'login' ? 'Proceed to Dashboard' : 'Create My Account'}
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-border/50 text-center">
                    <p className="text-text-body text-xs font-bold opacity-60">
                        {mode === 'login' ? "Don't have an account yet?" : "Already part of the team?"}
                    </p>
                    <button
                        onClick={toggleMode}
                        className="mt-2 text-primary font-black text-sm uppercase tracking-widest hover:underline underline-offset-4"
                    >
                        {mode === 'login' ? 'Signup Now' : 'Back to Login'}
                    </button>
                </div>

                <div className="flex items-center justify-center gap-2 mt-8 opacity-20 hover:opacity-100 transition-opacity cursor-default">
                    <CheckCircle2 size={12} className="text-success" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Encrypted Connection</span>
                </div>
            </div>
        </div>
    );
};

