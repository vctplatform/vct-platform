'use client';
import * as React from 'react';

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — BRACKET SVG DEFINITIONS
// Shared gradients, filters, and glow effects for bracket rendering
// ════════════════════════════════════════════════════════════════

export const BracketSVGDefs = () => (
    <defs>
        {/* Background Gradients for Cards */}
        <linearGradient id="grad-red" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff5f5" />
            <stop offset="100%" stopColor="#fff" />
        </linearGradient>
        <linearGradient id="grad-blue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f0f7ff" />
            <stop offset="100%" stopColor="#fff" />
        </linearGradient>

        {/* Indicator Gradients */}
        <linearGradient id="grad-red-indicator" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="var(--vct-danger)" />
        </linearGradient>
        <linearGradient id="grad-blue-indicator" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--vct-info)" />
            <stop offset="100%" stopColor="var(--vct-info)" />
        </linearGradient>

        {/* Match node gradient */}
        <radialGradient id="node-active-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--vct-success)" />
            <stop offset="100%" stopColor="var(--vct-success)" />
        </radialGradient>

        {/* Card Shadows */}
        <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.08" />
        </filter>
        <filter id="card-shadow-hover" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.15" />
        </filter>

        {/* Glow Effects */}
        <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
    </defs>
);

export const BRACKET_FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');`;
