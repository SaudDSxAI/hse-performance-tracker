import React from 'react';

export const PerformanceGauge = ({ percentage }) => {
    const getColor = () => {
        if (percentage >= 80) return '#0284C7'; // Darker Sky Blue
        if (percentage >= 60) return '#0EA5E9'; // Main Sky Blue
        if (percentage >= 40) return '#7DD3FC'; // Light Sky Blue
        return '#BAE6FD'; // Pale Sky Blue
    };

    const getLabel = () => {
        if (percentage >= 80) return 'EXCELLENT';
        if (percentage >= 60) return 'GOOD';
        if (percentage >= 40) return 'FAIR';
        return 'POOR';
    };

    const rotation = -90 + (percentage * 1.8);

    // Generate unique ID for this gauge instance
    const uniqueId = `gauge-grad-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="flex flex-col items-center group">
            <div className="relative w-28 h-20 flex items-center justify-center">
                <svg className="w-full h-full drop-shadow-sm" viewBox="0 -5 100 70">
                    <defs>
                        <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.8" />
                            <stop offset="33%" stopColor="#7DD3FC" stopOpacity="0.8" />
                            <stop offset="66%" stopColor="#0EA5E9" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.8" />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="1.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Background Track */}
                    <path
                        d="M 10 55 A 40 40 0 0 1 90 55"
                        fill="none"
                        stroke="currentColor"
                        className="text-border opacity-20"
                        strokeWidth="10"
                        strokeLinecap="round"
                    />

                    {/* Active Track (Gradient) */}
                    <path
                        d="M 10 55 A 40 40 0 0 1 90 55"
                        fill="none"
                        stroke={`url(#${uniqueId})`}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray="125.6"
                        strokeDashoffset={125.6 * (1 - percentage / 100)}
                        className="transition-all duration-1000 ease-out"
                    />

                    {/* Needle */}
                    <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50px 55px', transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                        <line
                            x1="50" y1="55" x2="50" y2="18"
                            stroke={getColor()}
                            strokeWidth="3"
                            strokeLinecap="round"
                            filter="url(#glow)"
                        />
                        <circle cx="50" cy="55" r="4" fill={getColor()} stroke="white" strokeWidth="1.5" />
                    </g>
                </svg>
            </div>
            <div className="text-center -mt-1">
                <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-lg font-black tracking-tighter" style={{ color: getColor() }}>{percentage}</span>
                    <span className="text-[10px] font-bold opacity-40">%</span>
                </div>
                <div
                    className="text-[9px] font-black tracking-[0.15em] uppercase px-2 py-0.5 rounded-full border border-current mt-0.5 mx-auto w-fit transition-all group-hover:bg-current group-hover:text-surface"
                    style={{ color: getColor(), borderColor: `${getColor()}40` }}
                >
                    {getLabel()}
                </div>
            </div>
        </div>
    );
};
