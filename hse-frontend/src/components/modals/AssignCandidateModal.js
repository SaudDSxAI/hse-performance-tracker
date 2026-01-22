import React from 'react';
import { X, CheckCircle, Check, Shield } from 'lucide-react';

export const AssignCandidateModal = ({
    isOpen,
    selectedSection,
    onClose,
    candidates, // unassigned candidates
    selectedCandidates,
    setSelectedCandidates,
    onAssign,
    loading
}) => {
    if (!isOpen || !selectedSection) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-surface rounded-2xl max-w-2xl w-full border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-border bg-surface shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-text-main">Assign Candidates</h3>
                        <p className="text-sm text-text-body">To section: <span className="font-bold text-primary">{selectedSection.name}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-background rounded-lg text-text-body transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {candidates.length === 0 ? (
                        <div className="text-center py-12 bg-background rounded-xl border border-dashed border-border">
                            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                                <Shield size={24} className="text-text-body opacity-20" />
                            </div>
                            <p className="text-text-body font-medium">All eligible candidates are already assigned.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex gap-3 mb-6 sticky top-0 bg-surface py-2 z-10 border-b border-border/50">
                                <button
                                    onClick={() => {
                                        const allIds = candidates.map(c => c.id);
                                        setSelectedCandidates(allIds);
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 text-sm font-bold transition-all"
                                >
                                    Select All Available
                                </button>
                                <button
                                    onClick={() => setSelectedCandidates([])}
                                    className="flex-1 px-4 py-2.5 bg-background text-text-body border border-border rounded-xl hover:bg-border text-sm font-bold transition-all"
                                >
                                    Deselect All
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                                {candidates.map(candidate => {
                                    const isSelected = selectedCandidates.includes(candidate.id);
                                    return (
                                        <div
                                            key={candidate.id}
                                            className={`group flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected
                                                ? 'bg-primary/5 border-primary ring-1 ring-primary shadow-lg shadow-primary/5'
                                                : 'bg-background border-border hover:border-text-body/30'
                                                }`}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedCandidates(selectedCandidates.filter(id => id !== candidate.id));
                                                } else {
                                                    setSelectedCandidates([...selectedCandidates, candidate.id]);
                                                }
                                            }}
                                        >
                                            <div className={`relative shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 transition-colors ${isSelected ? 'border-primary' : 'border-border group-hover:border-text-body/30'}`}>
                                                <img src={candidate.photo} alt={candidate.name} className="w-full h-full object-cover" />
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                        <CheckCircle size={20} className="text-primary fill-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-bold truncate ${isSelected ? 'text-primary' : 'text-text-main'}`}>{candidate.name}</p>
                                                {candidate.role && <p className="text-xs text-text-body truncate font-medium uppercase tracking-wider">{candidate.role}</p>}
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}>
                                                {isSelected && <Check size={14} className="text-white stroke-[3px]" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                <div className="p-6 border-t border-border bg-background shrink-0 flex flex-col gap-3">
                    <button
                        onClick={() => {
                            if (selectedCandidates.length > 0) {
                                onAssign(selectedSection.id, selectedCandidates);
                            }
                        }}
                        disabled={loading || selectedCandidates.length === 0}
                        className="w-full bg-primary text-white px-6 py-4 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Processing Assignments...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                <span>Assign {selectedCandidates.length} Selected Candidate{selectedCandidates.length !== 1 ? 's' : ''}</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-3 text-text-body hover:text-text-main font-bold text-sm uppercase tracking-widest transition-colors"
                        disabled={loading}
                    >
                        Go Back / Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
