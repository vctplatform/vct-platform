'use client'

import * as React from 'react'

// ════════════════════════════════════════
// AdminSkeletonCard — Reusable skeleton loading variants
// Replaces all inline skeleton components across admin pages.
// ════════════════════════════════════════

interface SkeletonProps {
    className?: string
}

/** Card skeleton — for grid items, config cards, feature flag cards */
export const AdminSkeletonCard: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div className={`bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5 animate-pulse ${className}`}>
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="h-5 w-40 bg-(--vct-bg-card) rounded" />
                    <div className="h-4 w-24 bg-(--vct-bg-card) rounded" />
                </div>
                <div className="h-4 w-3/4 bg-(--vct-bg-card) rounded" />
                <div className="flex gap-4">
                    <div className="h-3 w-20 bg-(--vct-bg-card) rounded" />
                    <div className="h-3 w-28 bg-(--vct-bg-card) rounded" />
                </div>
            </div>
            <div className="h-8 w-14 bg-(--vct-bg-card) rounded-full shrink-0" />
        </div>
    </div>
)

/** Hero skeleton — for page hero sections, user detail headers */
export const AdminSkeletonHero: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div className={`bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6 animate-pulse ${className}`}>
        <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-(--vct-bg-card) shrink-0" />
            <div className="flex-1 space-y-3">
                <div className="h-5 w-48 bg-(--vct-bg-card) rounded" />
                <div className="h-4 w-36 bg-(--vct-bg-card) rounded" />
                <div className="flex gap-3">
                    <div className="h-5 w-20 bg-(--vct-bg-card) rounded-full" />
                    <div className="h-5 w-24 bg-(--vct-bg-card) rounded-full" />
                </div>
            </div>
        </div>
    </div>
)

/** Metric card skeleton — for infrastructure metrics, stat cards */
export const AdminSkeletonMetric: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div className={`bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5 animate-pulse ${className}`}>
        <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-(--vct-bg-card) shrink-0" />
            <div className="h-4 w-28 bg-(--vct-bg-card) rounded" />
        </div>
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <div className="h-3 w-24 bg-(--vct-bg-card) rounded" />
                <div className="h-3 w-16 bg-(--vct-bg-card) rounded" />
            </div>
            <div className="flex justify-between items-center">
                <div className="h-3 w-20 bg-(--vct-bg-card) rounded" />
                <div className="h-3 w-12 bg-(--vct-bg-card) rounded" />
            </div>
        </div>
    </div>
)

/** Timeline skeleton — for activity logs, event feeds */
export const AdminSkeletonTimeline: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div className={`space-y-4 animate-pulse ${className}`}>
        {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-(--vct-bg-card) shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 bg-(--vct-bg-card) rounded" />
                    <div className="h-3 w-1/2 bg-(--vct-bg-card) rounded" />
                </div>
                <div className="h-3 w-16 bg-(--vct-bg-card) rounded shrink-0" />
            </div>
        ))}
    </div>
)

/** Service item skeleton — for dashboard service status list */
export const AdminSkeletonServiceItem: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div className={`flex items-center justify-between p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle) animate-pulse ${className}`}>
        <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-(--vct-bg-elevated)" />
            <div className="h-4 w-32 bg-(--vct-bg-elevated) rounded" />
        </div>
        <div className="flex items-center gap-4">
            <div className="h-3 w-16 bg-(--vct-bg-elevated) rounded" />
            <div className="h-3 w-12 bg-(--vct-bg-elevated) rounded" />
        </div>
    </div>
)

/** Grid of skeleton cards — renders N skeleton cards in a responsive grid */
export const AdminSkeletonGrid: React.FC<{ count?: number; cols?: number } & SkeletonProps> = ({
    count = 4,
    cols = 2,
    className = '',
}) => (
    <div className={`grid gap-4 ${cols === 2 ? 'grid-cols-1 lg:grid-cols-2' : cols === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} ${className}`}>
        {[...Array(count)].map((_, i) => (
            <AdminSkeletonMetric key={i} />
        ))}
    </div>
)

/** Section skeleton — for generic content sections */
export const AdminSkeletonSection: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div className={`bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6 animate-pulse ${className}`}>
        <div className="h-6 w-48 bg-(--vct-bg-card) rounded mb-6" />
        {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-4">
                <div className="h-3 w-20 bg-(--vct-bg-card) rounded mb-3" />
                <div className="grid grid-cols-2 gap-2">
                    {[...Array(4)].map((_, j) => (
                        <div key={j} className="h-12 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)" />
                    ))}
                </div>
            </div>
        ))}
    </div>
)
