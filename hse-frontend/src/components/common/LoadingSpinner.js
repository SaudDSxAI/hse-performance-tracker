import React from 'react';
import { Shield } from 'lucide-react';

export const LoadingSpinner = ({ message = 'Loading...' }) => {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-text-body font-medium">{message}</p>
            </div>
        </div>
    );
};

export const EmptyState = ({
    icon: Icon = Shield,
    title,
    description,
    actionLabel,
    onAction
}) => {
    return (
        <div className="text-center py-16 bg-surface rounded-2xl border border-border shadow-xl">
            <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
                <Icon size={40} className="text-text-body opacity-20" />
            </div>
            <h2 className="text-2xl font-bold text-text-main mb-3">{title}</h2>
            <p className="text-text-body mb-8 max-w-sm mx-auto">{description}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl hover:opacity-90 transition-all font-bold shadow-lg shadow-primary/30 mx-auto"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};
