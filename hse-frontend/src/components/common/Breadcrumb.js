import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumb = ({
    selectedProject,
    selectedCandidate,
    onHome,
    onProjectClick
}) => {
    return (
        <div className="flex items-center gap-2 text-sm text-text-body mb-4">
            <button onClick={onHome} className="hover:text-primary flex items-center gap-1 transition-colors">
                <Home size={14} />Home
            </button>
            {selectedProject && (
                <>
                    <ChevronRight size={14} className="text-text-body/50" />
                    <button
                        onClick={() => onProjectClick(selectedProject)}
                        className={`hover:text-primary transition-colors ${!selectedCandidate ? 'text-text-main font-medium' : ''}`}
                    >
                        {selectedProject.name}
                    </button>
                </>
            )}
            {selectedCandidate && (
                <>
                    <ChevronRight size={14} className="text-text-body/50" />
                    <span className="text-text-main font-medium">{selectedCandidate.name}</span>
                </>
            )}
        </div>
    );
};
