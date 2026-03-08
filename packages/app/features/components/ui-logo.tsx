import * as React from 'react';

export const UI_Logo = ({ size = 48, className = "" }: { size?: number, className?: string }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="vct-wing-red-enhanced" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ff4d4d" />
                    <stop offset="60%" stop-color="#ef4444" />
                    <stop offset="100%" stop-color="#7f1d1d" />
                </linearGradient>

                <linearGradient id="vct-wing-blue-enhanced" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#60a5fa" />
                    <stop offset="100%" stop-color="#1e3a8a" />
                </linearGradient>

                <linearGradient id="vct-glass-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#a5f3fc" stop-opacity="0.8" />
                    <stop offset="100%" stop-color="#0284c7" stop-opacity="0.4" />
                </linearGradient>

                <radialGradient id="vct-core-glow-grad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
                    <stop offset="50%" stop-color="#22d3ee" stop-opacity="0.8" />
                    <stop offset="100%" stop-color="#22d3ee" stop-opacity="0" />
                </radialGradient>

                <filter id="vct-main-shadow" x="-20%" y="-10%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="20" stdDeviation="15" flood-color="#000000" flood-opacity="0.3" />
                </filter>

                <filter id="vct-glass-blur">
                    <feGaussianBlur stdDeviation="3" />
                </filter>

                <filter id="vct-neon-blur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <g filter="url(#vct-main-shadow)">
                <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0 0; 0 -15; 0 0"
                    dur="4s"
                    repeatCount="indefinite"
                />

                <path d="M112 112 L256 400 L176 400 L32 112 Z" fill="url(#vct-wing-red-enhanced)" />

                <path d="M400 112 L256 400 L336 400 L480 112 Z" fill="url(#vct-wing-blue-enhanced)" />

                <g filter="url(#vct-glass-blur)">
                    <polygon points="256,192 336,320 256,448 176,320" fill="url(#vct-glass-cyan)" opacity="0.9" />
                </g>
                <polygon points="256,192 336,320 256,448 176,320" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.5" fill="none" />

                <g filter="url(#vct-neon-blur)">
                    <circle cx="256" cy="320" r="18" fill="url(#vct-core-glow-grad)">
                        <animate
                            attributeName="r"
                            values="16;22;16"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="opacity"
                            values="0.5;0.9;0.5"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle cx="256" cy="320" r="8" fill="#ffffff" />
                </g>
            </g>
        </svg>
    );
};
