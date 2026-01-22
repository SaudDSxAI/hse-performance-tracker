import React from 'react';
import { X } from 'lucide-react';

export const KpiModal = ({
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
            <div className="bg-surface rounded-xl w-full max-w-md border border-border shadow-2xl">
                <div className="flex justify-between items-center p-5 border-b border-border">
                    <h2 className="text-xl font-bold text-text-main">Update Monthly KPIs</h2>
                    <button onClick={onClose} className="p-2 hover:bg-background rounded-lg text-text-body transition-colors"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-body mb-1">Observations Open</label>
                            <input type="number" value={form.observationsOpen || 0} onChange={e => setForm({ ...form, observationsOpen: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-body mb-1">Observations Closed</label>
                            <input type="number" value={form.observationsClosed || 0} onChange={e => setForm({ ...form, observationsClosed: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-body mb-1">Violations Issued</label>
                        <input type="number" value={form.violations || 0} onChange={e => setForm({ ...form, violations: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-body mb-1">NCRs Open</label>
                            <input type="number" value={form.ncrsOpen || 0} onChange={e => setForm({ ...form, ncrsOpen: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-body mb-1">NCRs Closed</label>
                            <input type="number" value={form.ncrsClosed || 0} onChange={e => setForm({ ...form, ncrsClosed: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-body mb-1">Weekly Reports Open</label>
                            <input type="number" value={form.weeklyReportsOpen || 0} onChange={e => setForm({ ...form, weeklyReportsOpen: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-body mb-1">Weekly Reports Closed</label>
                            <input type="number" value={form.weeklyReportsClosed || 0} onChange={e => setForm({ ...form, weeklyReportsClosed: parseInt(e.target.value) || 0 })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                    </div>
                    <button onClick={onSave} disabled={loading} className="w-full bg-primary text-white px-4 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 font-bold transition-all shadow-lg shadow-primary/20">
                        {loading ? 'Saving...' : 'Save Monthly KPIs'}
                    </button>
                </div>
            </div>
        </div>
    );
};
