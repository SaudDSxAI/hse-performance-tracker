import React from 'react';
import { Trash2 } from 'lucide-react';

export const DeleteConfirmModal = ({
    isOpen,
    deleteConfirm,
    deletePin,
    setDeletePin,
    deletePinError,
    setDeletePinError,
    onClose,
    onConfirm,
    loading
}) => {
    if (!isOpen || !deleteConfirm) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl w-full max-w-sm border border-border shadow-2xl">
                <div className="p-5 text-center">
                    <div className="w-16 h-16 bg-error-bg rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={32} className="text-error" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2 text-text-main">Delete Project</h2>
                    <p className="text-text-body mb-4">
                        Are you sure you want to delete <strong className="text-text-main">"{deleteConfirm.name}"</strong>?
                    </p>
                    <p className="text-sm text-error mb-4 font-medium">This action cannot be undone.</p>

                    {deleteConfirm.hasPin && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-text-body mb-2">Enter Delete PIN</label>
                            <input
                                type="password"
                                value={deletePin}
                                onChange={(e) => { setDeletePin(e.target.value); setDeletePinError(''); }}
                                className={`w-full bg-background border rounded-lg px-4 py-2 text-center text-lg tracking-widest text-text-main outline-none focus:ring-2 focus:ring-error/20 ${deletePinError ? 'border-error' : 'border-border'}`}
                                placeholder="••••"
                            />
                            {deletePinError && (
                                <p className="text-error text-sm mt-1">{deletePinError}</p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-border rounded-lg text-text-body hover:bg-background transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading || (deleteConfirm.hasPin && !deletePin)}
                            className="flex-1 px-4 py-2 bg-error text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all font-medium"
                        >
                            {loading ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
