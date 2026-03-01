import React, { useEffect, useState } from 'react';

interface ProgressRingProps {
    radius: number;
    stroke: number;
    progress: number; // 0 to 100
    color?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
    radius,
    stroke,
    progress,
    color = '#4F7CFF'
}) => {
    const [animatedProgress, setAnimatedProgress] = useState(0);

    useEffect(() => {
        // Small delay to trigger the animation on mount
        const timeout = setTimeout(() => {
            setAnimatedProgress(progress);
        }, 100);
        return () => clearTimeout(timeout);
    }, [progress]);

    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg
                height={radius * 2}
                width={radius * 2}
                className="transform -rotate-90"
            >
                {/* Background Ring */}
                <circle
                    stroke="rgba(255,255,255,0.05)"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                {/* Progress Ring */}
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="transition-all duration-1000 ease-out"
                    pointerEvents="none"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[12px] font-medium text-white/80">{Math.round(animatedProgress)}%</span>
            </div>
        </div>
    );
};
