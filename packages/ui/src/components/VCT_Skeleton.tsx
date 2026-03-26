'use client'

/**
 * VCT_Skeleton — Shimmer loading placeholder
 * Variants: text, circle, card, kpi-row, table
 */

interface SkeletonProps {
    variant?: 'text' | 'circle' | 'card' | 'kpi-row' | 'table'
    width?: string | number
    height?: string | number
    count?: number
    className?: string
}

const shimmerClass = 'animate-pulse rounded-lg bg-(--vct-bg-elevated)'

const TextLine = ({ w = '100%' }: { w?: string }) => (
    <div className={shimmerClass} style={{ width: w, height: 14, marginBottom: 8 }} />
)

const CircleSkeleton = ({ size = 40 }: { size?: number }) => (
    <div className={shimmerClass} style={{ width: size, height: size, borderRadius: '50%' }} />
)

const CardSkeleton = () => (
    <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-card) p-5">
        <div className="flex items-center gap-3 mb-4">
            <CircleSkeleton size={32} />
            <div className="flex-1">
                <TextLine w="60%" />
                <TextLine w="40%" />
            </div>
        </div>
        <TextLine />
        <TextLine w="80%" />
        <TextLine w="50%" />
    </div>
)

const KpiRowSkeleton = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-card) p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className={shimmerClass} style={{ width: 100, height: 12 }} />
                    <CircleSkeleton size={24} />
                </div>
                <div className={shimmerClass} style={{ width: 80, height: 28, marginBottom: 6 }} />
                <div className={shimmerClass} style={{ width: 120, height: 10 }} />
            </div>
        ))}
    </div>
)

const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
    <div className="overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
        {/* Header */}
        <div className="flex gap-4 border-b border-(--vct-border-strong) bg-(--vct-bg-card) p-4">
            {[80, 120, 100, 80, 60].map((w, i) => (
                <div key={i} className={shimmerClass} style={{ width: w, height: 12 }} />
            ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex items-center gap-4 border-b border-(--vct-border-subtle) p-4">
                <CircleSkeleton size={28} />
                <div className="flex-1 flex gap-4">
                    {[140, 100, 80, 60, 70].map((w, i) => (
                        <div key={i} className={shimmerClass} style={{ width: w, height: 14 }} />
                    ))}
                </div>
            </div>
        ))}
    </div>
)

export function VCT_Skeleton({ variant = 'text', width, height, count = 1, className }: SkeletonProps) {
    if (variant === 'circle') return <CircleSkeleton size={typeof width === 'number' ? width : 40} />
    if (variant === 'card') return <div className={className}>{Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}</div>
    if (variant === 'kpi-row') return <KpiRowSkeleton />
    if (variant === 'table') return <TableSkeleton rows={count} />

    // Default: text lines
    return (
        <div className={className}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={shimmerClass} style={{
                    width: width ?? (i === count - 1 ? '60%' : '100%'),
                    height: height ?? 14,
                    marginBottom: 8,
                }} />
            ))}
        </div>
    )
}

/** Pre-composed page skeleton with KPI row + table */
export function VCT_PageSkeleton() {
    return (
        <div className="mx-auto max-w-[1400px] pb-24">
            <VCT_Skeleton variant="kpi-row" />
            <div className="my-6">
                <VCT_Skeleton variant="text" count={1} width={200} height={32} />
            </div>
            <VCT_Skeleton variant="table" count={6} />
        </div>
    )
}
