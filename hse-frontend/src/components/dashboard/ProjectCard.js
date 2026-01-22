import React from 'react';
import { MapPin, Building2, Users, Edit2, Trash2, ChevronRight, Shield, User } from 'lucide-react';
import { PerformanceGauge } from '../common/PerformanceGauge';

export const ProjectCard = ({
    project,
    performance,
    onView,
    onEdit,
    onDelete,
    riskOptions
}) => {
    return (
        <div
            className="bg-surface rounded-2xl shadow-lg border border-border overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
            onClick={() => onView(project)}
        >
            {/* Header with HSE Lead */}
            <div className="p-5 border-b border-border bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative group/lead">
                            <img
                                src={project.hseLead?.photo || project.hseLeadPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.hseLead?.name || project.hseLeadName || 'HSE')}&size=150&background=047857&color=fff`}
                                alt={project.hseLead?.name || project.hseLeadName}
                                className="w-14 h-14 rounded-full object-cover border-3 border-surface shadow-lg group-hover/lead:border-primary transition-all"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-success rounded-full p-1 border-2 border-surface shadow-sm">
                                <Shield size={10} className="text-white" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-text-main group-hover:text-primary transition-colors leading-snug">{project.name}</h3>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <User size={10} className="text-text-body" />
                                <p className="text-[10px] text-text-body font-black uppercase tracking-widest">{project.hseLead?.name || project.hseLeadName}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                                className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors shadow-sm bg-surface/50"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(project); }}
                                className="p-2 hover:bg-error/10 rounded-lg text-error transition-colors shadow-sm bg-surface/50"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        {performance !== undefined && (
                            <div className="scale-75 origin-top-right -mr-2">
                                <PerformanceGauge percentage={performance} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-5">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-text-body text-[11px] font-bold uppercase tracking-wider bg-background/50 px-2 py-1 rounded-md border border-border/50">
                        <MapPin size={12} className="text-primary" />
                        <span className="truncate max-w-[100px]">{project.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-body text-[11px] font-bold uppercase tracking-wider bg-background/50 px-2 py-1 rounded-md border border-border/50">
                        <Building2 size={12} className="text-primary" />
                        <span className="truncate max-w-[100px]">{project.company}</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-2.5 bg-primary/[0.03] rounded-xl text-center border border-primary/10 transition-colors group-hover:bg-primary/[0.06]">
                        <p className="font-black text-primary text-base leading-none mb-1">{project.manpower || 0}</p>
                        <p className="text-[8px] text-primary/60 uppercase font-black tracking-widest">Manpower</p>
                    </div>
                    <div className="p-2.5 bg-success/[0.03] rounded-xl text-center border border-success/10 transition-colors group-hover:bg-success/[0.06]">
                        <p className="font-black text-success text-base leading-none mb-1">{project.manHours || 0}</p>
                        <p className="text-[8px] text-success/60 uppercase font-black tracking-widest">Man-hours</p>
                    </div>
                    <div className="p-2.5 bg-amber/[0.03] rounded-xl text-center border border-amber/10 transition-colors group-hover:bg-amber/[0.06]">
                        <p className="font-black text-amber-600 text-base leading-none mb-1">{project.newInductions || 0}</p>
                        <p className="text-[8px] text-amber-600/60 uppercase font-black tracking-widest text-[#D97706]">Inductions</p>
                    </div>
                </div>

                {/* High Risk Activities */}
                {project.highRisk && project.highRisk.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {project.highRisk.map(risk => {
                            const option = riskOptions.find(r => r.key === risk);
                            if (!option) return null;
                            const Icon = option.icon;
                            return (
                                <span key={risk} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all ${option.color.replace('bg-', 'bg-opacity-10 bg-').replace('text-', 'border-opacity-20 border- text-')}`}>
                                    <Icon size={10} />
                                    {option.label}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Performance Footer */}
                <div className="pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-text-body text-[10px] font-black uppercase tracking-widest">
                            <Users size={12} className="text-primary/60" />
                            <span>{project.candidates?.length || 0} Members</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        View Details
                        <ChevronRight size={14} />
                    </div>
                </div>
            </div>
        </div>
    );
};
