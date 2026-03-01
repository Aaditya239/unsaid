'use client';

import { useEffect, useState } from 'react';

const generateParticles = (count: number) => {
    return Array.from({ length: count }).map((_, i) => ({
        id: i,
        size: Math.random() * 14 + 6, // 6px to 20px
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 20, // 20s to 40s
        delay: Math.random() * -40, // Random phase
        color: Math.random() > 0.5 ? 'rgba(59,130,246,0.06)' : 'rgba(168,85,247,0.06)',
        tx: (Math.random() - 0.5) * 150, // Gentle X movement
        ty: -(Math.random() * 200 + 100), // Upward drift
    }));
};

export const AmbientParticles = () => {
    const [particles, setParticles] = useState<any[]>([]);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
            setParticles(generateParticles(15));
        }
    }, []);

    if (particles.length === 0) return null;

    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden motion-reduce:hidden">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        width: p.size,
                        height: p.size,
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        background: p.color,
                        boxShadow: `0 0 40px 20px ${p.color}`,
                        animation: `ambient-float-${p.id} ${p.duration}s infinite linear`,
                        animationDelay: `${p.delay}s`,
                        willChange: 'transform',
                    }}
                />
            ))}
            <style dangerouslySetInnerHTML={{
                __html: particles.map((p) => `
          @keyframes ambient-float-${p.id} {
            0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0; }
            20% { opacity: 1; scale: 1.2; }
            80% { opacity: 1; scale: 0.9; }
            100% { transform: translate3d(${p.tx}px, ${p.ty}px, 0) scale(1); opacity: 0; }
          }
        `).join('\n')
            }} />
        </div>
    );
};
