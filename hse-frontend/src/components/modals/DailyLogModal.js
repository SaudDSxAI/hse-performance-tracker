import React from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { dailyLogTaskFields } from '../../utils/constants';

export const DailyLogModal = ({
    isOpen,
    onClose,
    form,
    setForm,
    selectedDate,
    onSave,
    loading
}) => {
    if (!isOpen) return null;

    const logItems = dailyLogTaskFields;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border shadow-2xl">
                <div className="flex justify-between items-center p-5 border-b border-border sticky top-0 bg-surface z-10 shadow-sm">
                    <h2 className="text-xl font-bold text-text-main">Daily Log - {selectedDate}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-background rounded-lg text-text-body transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-body mb-1">Time IN</label>
                            <input
                                type="time"
                                value={form.timeIn || ''}
                                onChange={e => setForm({ ...form, timeIn: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-body mb-1">Time OUT</label>
                            <input
                                type="time"
                                value={form.timeOut || ''}
                                onChange={e => setForm({ ...form, timeOut: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    {logItems.map(item => (
                        <div key={item.key} className="p-4 bg-background border border-border rounded-xl">
                            <p className="text-sm font-medium text-text-main mb-3">{item.label}</p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, [item.key]: true })}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${form[item.key] === true
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'bg-surface text-text-body hover:bg-primary/10 border border-border'
                                        }`}
                                >
                                    <CheckCircle size={16} />
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, [item.key]: false })}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${form[item.key] === false
                                        ? 'bg-error text-white shadow-lg shadow-error/20'
                                        : 'bg-surface text-text-body hover:bg-error/10 border border-border'
                                        }`}
                                >
                                    <XCircle size={16} />
                                    No
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, [item.key]: null })}
                                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${form[item.key] === null || form[item.key] === undefined
                                        ? 'bg-text-body text-white'
                                        : 'bg-surface text-text-body hover:bg-background border border-border'
                                        }`}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Comment and Description */}
                    <div className="space-y-4 pt-2">
                        <div className="p-4 bg-background border border-border rounded-xl">
                            <label className="block text-sm font-medium text-text-main mb-2">Comment</label>
                            <input
                                type="text"
                                value={form.comment || ''}
                                onChange={e => setForm({ ...form, comment: e.target.value })}
                                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Optional comment..."
                            />
                        </div>
                        <div className="p-4 bg-background border border-border rounded-xl">
                            <label className="block text-sm font-medium text-text-main mb-2">Description</label>
                            <textarea
                                value={form.description || ''}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none"
                                placeholder="Optional description..."
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="sticky bottom-0 bg-surface pt-4 border-t border-border -mx-6 px-6 -mb-6 pb-6">
                        <button
                            onClick={onSave}
                            disabled={loading}
                            className="w-full bg-primary text-white px-4 py-3 rounded-xl hover:opacity-90 disabled:opacity-50 font-bold transition-all shadow-lg shadow-primary/30"
                        >
                            {loading ? 'Saving...' : 'Save Daily Log'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
