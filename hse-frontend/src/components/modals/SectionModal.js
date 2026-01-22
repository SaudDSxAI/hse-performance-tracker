import React from 'react';
import { X } from 'lucide-react';

export const SectionModal = ({
    isOpen,
    mode, // 'add' or 'edit'
    onClose,
    sectionForm,
    setSectionForm,
    onSubmit,
    loading
}) => {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(e);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-surface rounded-xl max-w-md w-full p-6 border border-border shadow-2xl">
                <div className="flex justify-between items-center mb-4 border-b border-border pb-4">
                    <h3 className="text-xl font-bold text-text-main">
                        {mode === 'add' ? 'Add Section' : 'Edit Section'}
                    </h3>
                    <button onClick={onClose} className="text-text-body hover:text-text-main">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-body mb-1">Section Name *</label>
                            <input
                                type="text"
                                value={sectionForm.name || ''}
                                onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="e.g., Civil Works, MEP, Safety Team"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-body mb-1">Description</label>
                            <textarea
                                value={sectionForm.description || ''}
                                onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                                rows="3"
                                placeholder="Optional description"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border border-border rounded-lg px-4 py-2 hover:bg-background text-text-body transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-primary text-white rounded-lg px-4 py-2 hover:opacity-90 disabled:opacity-50 font-medium transition-all shadow-lg shadow-primary/20"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (mode === 'add' ? 'Create' : 'Update')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
