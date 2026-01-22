import React from 'react';
import { X } from 'lucide-react';

export const CandidateModal = ({
    isOpen,
    onClose,
    form,
    setForm,
    onSave,
    loading
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl w-full max-w-sm border border-border shadow-2xl">
                <div className="flex justify-between items-center p-5 border-b border-border">
                    <h2 className="text-xl font-bold text-text-main">{form.id ? 'Edit' : 'Add'} Candidate</h2>
                    <button onClick={onClose} className="p-2 hover:bg-background rounded-lg text-text-body transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-body mb-1">Name *</label>
                        <input
                            value={form.name || ''}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-body mb-1">Role / Position</label>
                        <input
                            value={form.role || ''}
                            onChange={e => setForm({ ...form, role: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Optional"
                        />
                    </div>
                    <button
                        onClick={onSave}
                        disabled={!form.name || loading}
                        className="w-full bg-primary text-white px-4 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 font-medium transition-all shadow-lg shadow-primary/20"
                    >
                        {loading ? 'Saving...' : (form.id ? 'Update' : 'Add') + ' Candidate'}
                    </button>
                </div>
            </div>
        </div>
    );
};
