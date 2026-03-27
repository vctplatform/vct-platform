'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Background v2 (Performance-First Mesh Gradient)
// CSS-only animated orbs. Zero Framer Motion. Zero GPU pressure.
// ════════════════════════════════════════════════════════════════

import React from 'react'

export function PortalBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Base layer — deep navy */}
            <div className="absolute inset-0 bg-vct-bg transition-colors duration-500" />

            {/* Dot grid pattern for depth */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        'radial-gradient(circle, currentColor 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Mesh Gradient Orb 1 — top-left blue/indigo */}
            <div className="portal-orb portal-orb--1" />

            {/* Mesh Gradient Orb 2 — top-right purple/pink */}
            <div className="portal-orb portal-orb--2" />

            {/* Mesh Gradient Orb 3 — bottom-center cyan/emerald */}
            <div className="portal-orb portal-orb--3" />

            {/* Noise texture overlay for analog realism */}
            <svg className="absolute inset-0 h-full w-full opacity-[0.015]" aria-hidden="true">
                <filter id="portal-noise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                </filter>
                <rect width="100%" height="100%" filter="url(#portal-noise)" />
            </svg>

            <style>{`
                .portal-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(120px);
                    will-change: transform;
                    animation-timing-function: ease-in-out;
                    animation-iteration-count: infinite;
                    animation-direction: alternate;
                }
                .portal-orb--1 {
                    top: -15%;
                    left: -10%;
                    width: 60vw;
                    height: 60vh;
                    background: radial-gradient(ellipse at center,
                        rgba(99, 102, 241, 0.25) 0%,
                        rgba(14, 165, 233, 0.15) 40%,
                        transparent 70%);
                    animation: portalFloat1 20s ease-in-out infinite alternate;
                }
                .portal-orb--2 {
                    top: 10%;
                    right: -15%;
                    width: 50vw;
                    height: 50vh;
                    background: radial-gradient(ellipse at center,
                        rgba(168, 85, 247, 0.2) 0%,
                        rgba(236, 72, 153, 0.1) 40%,
                        transparent 70%);
                    animation: portalFloat2 25s ease-in-out infinite alternate;
                }
                .portal-orb--3 {
                    bottom: -20%;
                    left: 15%;
                    width: 70vw;
                    height: 50vh;
                    background: radial-gradient(ellipse at center,
                        rgba(34, 211, 238, 0.18) 0%,
                        rgba(16, 185, 129, 0.1) 40%,
                        transparent 70%);
                    animation: portalFloat3 22s ease-in-out infinite alternate;
                }
                @keyframes portalFloat1 {
                    0%   { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(5%, -5%) scale(1.08); }
                }
                @keyframes portalFloat2 {
                    0%   { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(-6%, 6%) scale(1.12); }
                }
                @keyframes portalFloat3 {
                    0%   { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(4%, -4%) scale(1.05); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .portal-orb { animation: none !important; }
                }
            `}</style>
        </div>
    )
}
