'use client'

/**
 * VCT_Image — Cross-platform image component.
 *
 * On web (Next.js), renders `next/image` for:
 *   - Automatic image optimization (WebP/AVIF)
 *   - Lazy loading with blur placeholder
 *   - Responsive srcset generation
 *
 * Falls back to native `<img>` if Next.js Image is unavailable (React Native web).
 */

import * as React from 'react'

/* ---------- Try to import next/image at build time ---------- */
let NextImage: React.ComponentType<any> | null = null
try {
     
    NextImage = require('next/image').default
} catch {
    // Not in a Next.js environment — will fall back to <img>
}

/* ---------- Types ---------- */
export interface VCTImageProps {
    src: string
    alt: string
    /** Tailwind classes for styling */
    className?: string
    /** Fill mode — image fills its parent (parent must be position:relative) */
    fill?: boolean
    /** Fixed width (only when fill=false) */
    width?: number
    /** Fixed height (only when fill=false) */
    height?: number
    /** Loading priority — set true for above-the-fold images */
    priority?: boolean
    /** Object-fit style */
    objectFit?: 'cover' | 'contain' | 'fill' | 'none'
    /** Inline styles */
    style?: React.CSSProperties
    /** Called when image fails to load */
    onError?: () => void
    /** Draggable attribute */
    draggable?: boolean
    /** Loading strategy */
    loading?: 'lazy' | 'eager'
    /** Sizes hint for responsive images */
    sizes?: string
}

export const VCT_Image: React.FC<VCTImageProps> = ({
    src,
    alt,
    className,
    fill = false,
    width,
    height,
    priority = false,
    objectFit = 'cover',
    style,
    onError,
    draggable,
    loading = 'lazy',
    sizes,
}) => {
    if (NextImage && src) {
        const imgStyle: React.CSSProperties = {
            objectFit,
            ...style,
        }

        if (fill) {
            return (
                <NextImage
                    src={src}
                    alt={alt}
                    fill
                    className={className}
                    style={imgStyle}
                    priority={priority}
                    onError={onError}
                    draggable={draggable}
                    sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
                    unoptimized={src.startsWith('blob:') || src.startsWith('data:')}
                />
            )
        }

        return (
            <NextImage
                src={src}
                alt={alt}
                width={width || 100}
                height={height || 100}
                className={className}
                style={imgStyle}
                priority={priority}
                onError={onError}
                draggable={draggable}
                loading={priority ? undefined : loading}
                unoptimized={src.startsWith('blob:') || src.startsWith('data:')}
            />
        )
    }

    // Fallback: plain <img> for non-Next.js environments or data/blob URLs
    return (
        <img
            src={src}
            alt={alt}
            className={className}
            style={{ objectFit, ...style }}
            loading={loading}
            onError={onError}
            draggable={draggable}
            width={width}
            height={height}
        />
    )
}

export default VCT_Image
