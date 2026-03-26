'use client'
import * as React from 'react'
import type { CSSProperties, FC } from 'react'
import { VCT_Image } from './VCT_Image'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away'
export type AvatarShape = 'circle' | 'rounded'

export interface VCTAvatarProps {
    /** Image URL — falls back to initials if missing or fails to load */
    src?: string | null
    /** Name used for initials fallback and alt text */
    name?: string
    /** Pixel size (width & height) */
    size?: number
    /** Shape of the avatar */
    shape?: AvatarShape
    /** Status indicator */
    status?: AvatarStatus
    /** Custom style */
    style?: CSSProperties
    className?: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const PALETTE = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6',
]

function hashString(str: string): number {
    let h = 0
    for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) | 0
    }
    return Math.abs(h)
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
        return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
    }
    return (parts[0]?.[0] ?? '?').toUpperCase()
}

const STATUS_COLOR: Record<AvatarStatus, string> = {
    online: 'bg-emerald-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-amber-500',
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const VCT_Avatar = ({
    src,
    name = '?',
    size = 40,
    shape = 'circle',
    status,
    style,
    className,
}: VCTAvatarProps) => {
    const [imgError, setImgError] = React.useState(false)
    const showImage = src && !imgError

    const color = PALETTE[hashString(name) % PALETTE.length]!
    const fontSize = Math.max(10, Math.round(size * 0.36))

    const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl'
    const statusSize = Math.max(8, Math.round(size * 0.25))

    return (
        <span
            className={cn(
                'relative inline-flex shrink-0 items-center justify-center overflow-hidden',
                shapeClass,
                className ?? ''
            )}
            style={{
                width: size,
                height: size,
                backgroundColor: showImage ? 'transparent' : color,
                ...style,
            }}
            aria-label={name}
        >
            {showImage ? (
                <VCT_Image
                    src={src}
                    alt={name}
                    onError={() => setImgError(true)}
                    className={cn('h-full w-full', shapeClass)}
                    fill
                    objectFit="cover"
                    draggable={false}
                    sizes={`${size}px`}
                />
            ) : (
                <span
                    className="select-none font-extrabold text-white"
                    style={{ fontSize }}
                >
                    {getInitials(name)}
                </span>
            )}

            {/* Status dot */}
            {status ? (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 border-2 border-vct-bg',
                        shape === 'circle' ? 'rounded-full' : 'rounded-full',
                        STATUS_COLOR[status],
                        status === 'online' && 'animate-pulse'
                    )}
                    style={{ width: statusSize, height: statusSize }}
                    aria-label={status}
                />
            ) : null}
        </span>
    )
}

export const VCTAvatar = VCT_Avatar as FC<VCTAvatarProps>
