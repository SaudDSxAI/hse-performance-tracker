import React, { useState } from 'react';
import { X, Lock, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { changePassword } from '../../api';

export const SettingsModal = ({ isOpen, onClose, currentUser }) => {
    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (form.newPassword !== form.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (form.newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await changePassword(form.currentPassword, form.newPassword);
            setSuccess('Password updated successfully!');
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => {
                onClose();
                setSuccess('');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden relative animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-br from-primary/5 to-transparent p-6 border-b border-border relative">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 hover:bg-border/50 rounded-full transition-colors text-text-body"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-text-main leading-tight">Security Settings</h2>
                            <p className="text-xs text-text-body font-bold uppercase tracking-widest opacity-60">Update your access credentials</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* User Info Read-only */}
                    <div className="bg-background/50 rounded-2xl p-4 border border-border/50 flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-black text-primary">
                            {currentUser?.username[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-text-body uppercase tracking-tighter opacity-40">Active Account</p>
                            <p className="text-sm font-bold text-text-main">{currentUser?.full_name || currentUser?.username}</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="relative group">
                            <label className="text-[10px] font-black text-text-body absolute top-2 left-4 z-10 uppercase tracking-tighter opacity-40">Current Password</label>
                            <input
                                type="password"
                                value={form.currentPassword}
                                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                                className="w-full bg-background border border-border rounded-2xl px-4 pt-6 pb-2.5 text-text-main font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <label className="text-[10px] font-black text-text-body absolute top-2 left-4 z-10 uppercase tracking-tighter opacity-40">New Password</label>
                            <input
                                type="password"
                                value={form.newPassword}
                                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                                className="w-full bg-background border border-border rounded-2xl px-4 pt-6 pb-2.5 text-text-main font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                placeholder="Minimum 6 characters"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <label className="text-[10px] font-black text-text-body absolute top-2 left-4 z-10 uppercase tracking-tighter opacity-40">Confirm New Password</label>
                            <input
                                type="password"
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                className="w-full bg-background border border-border rounded-2xl px-4 pt-6 pb-2.5 text-text-main font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                placeholder="Repeat new password"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-2xl">
                            <AlertCircle size={16} className="text-error shrink-0" />
                            <p className="text-error text-xs font-black uppercase tracking-tight">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-2xl">
                            <CheckCircle2 size={16} className="text-success shrink-0" />
                            <p className="text-success text-xs font-black uppercase tracking-tight">{success}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-4 rounded-2xl hover:opacity-90 disabled:opacity-50 font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Updating Credentials...' : (
                            <>
                                <ShieldCheck size={18} />
                                Update Password
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
