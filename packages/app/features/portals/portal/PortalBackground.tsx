'use client'
// ════════════════════════════════════════════════════════════════
// VCT PORTAL — Grand Lobby Background v3 (Aurora + Particles)
// Dramatic aurora light effect with floating particles.
// CSS-only. Zero JS animation overhead. Zero GPU pressure.
// ════════════════════════════════════════════════════════════════

import React from 'react'

export function PortalBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Base layer — deep space navy */}
            <div className="absolute inset-0 bg-[#080B16] transition-colors duration-500" />

            {/* Subtle star field */}
            <div className="portal-stars" aria-hidden="true" />
            <div className="portal-stars portal-stars--layer2" aria-hidden="true" />

            {/* Dot grid pattern for depth */}
            <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage:
                        'radial-gradient(circle, rgba(255,255,255,0.5) 0.5px, transparent 0.5px)',
                    backgroundSize: '32px 32px',
                }}
            />

            {/* Aurora: Primary wave — indigo/blue sweep */}
            <div className="portal-aurora portal-aurora--1" />

            {/* Aurora: Secondary wave — purple/magenta */}
            <div className="portal-aurora portal-aurora--2" />

            {/* Aurora: Tertiary accent — cyan/emerald */}
            <div className="portal-aurora portal-aurora--3" />

            {/* Ambient glow — warm center spot */}
            <div className="portal-ambient-glow" />

            {/* Vignette (darkened edges for focus) */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 80% 60% at 50% 40%, transparent 30%, rgba(0,0,0,0.6) 100%)',
                }}
            />

            {/* Noise texture overlay for analog realism */}
            <svg className="absolute inset-0 h-full w-full opacity-[0.012]" aria-hidden="true">
                <filter id="portal-noise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                </filter>
                <rect width="100%" height="100%" filter="url(#portal-noise)" />
            </svg>

            {/* Horizontal light beam — subtle at bottom */}
            <div className="portal-floor-light" />

            <style>{`
                /* ── Star Layers ── */
                .portal-stars {
                    position: absolute;
                    inset: 0;
                    background-image:
                        radial-gradient(1.5px 1.5px at  20px  30px, rgba(255,255,255,0.3), transparent),
                        radial-gradient(1px   1px   at  80px 120px, rgba(255,255,255,0.2), transparent),
                        radial-gradient(1.5px 1.5px at 160px  60px, rgba(255,255,255,0.25), transparent),
                        radial-gradient(1px   1px   at 250px 200px, rgba(255,255,255,0.15), transparent),
                        radial-gradient(1.5px 1.5px at 380px  90px, rgba(255,255,255,0.2), transparent),
                        radial-gradient(1px   1px   at 480px 280px, rgba(255,255,255,0.18), transparent),
                        radial-gradient(1.5px 1.5px at 600px 150px, rgba(255,255,255,0.22), transparent);
                    background-size: 700px 400px;
                    animation: portalStarDrift 60s linear infinite;
                }
                .portal-stars--layer2 {
                    background-image:
                        radial-gradient(1px 1px at  40px 180px, rgba(200,220,255,0.15), transparent),
                        radial-gradient(1px 1px at 300px  40px, rgba(200,220,255,0.12), transparent),
                        radial-gradient(1px 1px at 520px 260px, rgba(200,220,255,0.1), transparent);
                    background-size: 600px 350px;
                    animation: portalStarDrift 90s linear infinite reverse;
                }
                @keyframes portalStarDrift {
                    from { transform: translateY(0); }
                    to   { transform: translateY(-400px); }
                }

                /* ── Aurora Waves ── */
                .portal-aurora {
                    position: absolute;
                    filter: blur(100px);
                    will-change: transform, opacity;
                    animation-timing-function: ease-in-out;
                    animation-iteration-count: infinite;
                    animation-direction: alternate;
                    border-radius: 50%;
                }
                .portal-aurora--1 {
                    top: -25%;
                    left: -15%;
                    width: 80vw;
                    height: 55vh;
                    background: linear-gradient(
                        135deg,
                        rgba(99, 102, 241, 0.22) 0%,
                        rgba(14, 165, 233, 0.12) 50%,
                        rgba(59, 130, 246, 0.08) 100%
                    );
                    animation: auroraWave1 16s ease-in-out infinite alternate;
                }
                .portal-aurora--2 {
                    top: 5%;
                    right: -20%;
                    width: 60vw;
                    height: 50vh;
                    background: linear-gradient(
                        225deg,
                        rgba(168, 85, 247, 0.18) 0%,
                        rgba(236, 72, 153, 0.08) 50%,
                        rgba(139, 92, 246, 0.06) 100%
                    );
                    animation: auroraWave2 22s ease-in-out infinite alternate;
                }
                .portal-aurora--3 {
                    bottom: -25%;
                    left: 10%;
                    width: 70vw;
                    height: 45vh;
                    background: linear-gradient(
                        45deg,
                        rgba(34, 211, 238, 0.14) 0%,
                        rgba(16, 185, 129, 0.08) 50%,
                        rgba(6, 182, 212, 0.05) 100%
                    );
                    animation: auroraWave3 19s ease-in-out infinite alternate;
                }

                @keyframes auroraWave1 {
                    0%   { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.8; }
                    50%  { transform: translate(3%, -3%) scale(1.05) rotate(2deg); opacity: 1; }
                    100% { transform: translate(6%, -6%) scale(1.1) rotate(4deg); opacity: 0.7; }
                }
                @keyframes auroraWave2 {
                    0%   { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.7; }
                    50%  { transform: translate(-4%, 4%) scale(1.08) rotate(-3deg); opacity: 1; }
                    100% { transform: translate(-8%, 8%) scale(1.15) rotate(-5deg); opacity: 0.6; }
                }
                @keyframes auroraWave3 {
                    0%   { transform: translate(0, 0) scale(1); opacity: 0.6; }
                    50%  { transform: translate(5%, -3%) scale(1.06); opacity: 0.9; }
                    100% { transform: translate(3%, -5%) scale(1.1); opacity: 0.5; }
                }

                /* ── Ambient warm glow (center-stage light) ── */
                .portal-ambient-glow {
                    position: absolute;
                    top: 10%;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 50vw;
                    height: 40vh;
                    background: radial-gradient(
                        ellipse at center,
                        rgba(99, 102, 241, 0.08) 0%,
                        rgba(139, 92, 246, 0.04) 40%,
                        transparent 70%
                    );
                    filter: blur(60px);
                    animation: ambientPulse 10s ease-in-out infinite alternate;
                }
                @keyframes ambientPulse {
                    0%   { opacity: 0.5; transform: translateX(-50%) scale(1); }
                    100% { opacity: 0.8; transform: translateX(-50%) scale(1.08); }
                }

                /* ── Floor light (reflected light on bottom) ── */
                .portal-floor-light {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(
                        90deg,
                        transparent 5%,
                        rgba(99, 102, 241, 0.15) 25%,
                        rgba(139, 92, 246, 0.2) 50%,
                        rgba(99, 102, 241, 0.15) 75%,
                        transparent 95%
                    );
                    box-shadow: 0 0 30px 10px rgba(99, 102, 241, 0.05);
                }

                @media (prefers-reduced-motion: reduce) {
                    .portal-aurora,
                    .portal-stars,
                    .portal-ambient-glow { animation: none !important; }
                }
            `}</style>
        </div>
    )
}
