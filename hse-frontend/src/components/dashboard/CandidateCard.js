import React from 'react';
import { Camera, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { PerformanceGauge } from '../common/PerformanceGauge';

export const CandidateCard = ({
    candidate,
    performance,
    isFirst,
    isLast,
    onView,
    onEdit,
    onDelete,
    onPhotoClick,
    onMoveUp,
    onMoveDown
}) => {
    return (
        <div
            className="bg-surface rounded-xl border border-border p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group relative"
            onClick={() => onView(candidate)}
        >
            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(candidate); }}
                    className="p-1.5 bg-surface/80 hover:bg-primary/10 rounded-lg text-primary transition-colors shadow-sm"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(candidate); }}
                    className="p-1.5 bg-surface/80 hover:bg-error/10 rounded-lg text-error transition-colors shadow-sm"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Reorder Buttons */}
            <div className="absolute top-2 left-2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {!isFirst && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onMoveUp(candidate); }}
                        className="p-1 bg-surface/80 hover:bg-background rounded text-text-body hover:text-text-main transition-colors shadow-sm"
                    >
                        <ArrowUp size={12} />
                    </button>
                )}
                {!isLast && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onMoveDown(candidate); }}
                        className="p-1 bg-surface/80 hover:bg-background rounded text-text-body hover:text-text-main transition-colors shadow-sm"
                    >
                        <ArrowDown size={12} />
                    </button>
                )}
            </div>

            {/* Photo */}
            <div className="flex justify-center mb-4 mt-2">
                <div
                    className="relative group/photo cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); onPhotoClick(e, candidate); }}
                >
                    <img
                        src={candidate.photo}
                        alt={candidate.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-surface shadow-md group-hover/photo:border-primary transition-colors"
                    />
                    <div className="absolute inset-0 bg-primary/40 rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={14} className="text-white" />
                    </div>
                </div>
            </div>

            {/* Name & Role */}
            <div className="text-center mb-4">
                <p className="font-bold text-text-main text-sm truncate">{candidate.name}</p>
                {candidate.role && (
                    <p className="text-[10px] text-text-body truncate uppercase font-bold tracking-tighter opacity-70">
                        {candidate.role}
                    </p>
                )}
            </div>

            {/* Performance Gauge */}
            <div className="flex justify-center">
                {Object.keys(candidate.dailyLogs || {}).length > 0 ? (
                    <PerformanceGauge percentage={performance} />
                ) : (
                    <div className="text-xs text-text-body">No data</div>
                )}
            </div>
        </div>
    );
};
