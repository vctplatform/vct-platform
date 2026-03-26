'use client'
import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import type { FC } from 'react'
import { VCT_Image } from './VCT_Image'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GalleryImage {
    src: string
    alt?: string
    caption?: string
}

export interface VCTImageGalleryProps {
    /** Array of images */
    images: GalleryImage[]
    /** Grid columns */
    columns?: 2 | 3 | 4
    /** Aspect ratio class */
    aspectRatio?: 'square' | '4/3' | '16/9' | 'auto'
    className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const ASPECT: Record<string, string> = {
    square: 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video',
    auto: '',
}

const COL: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
}

export const VCT_ImageGallery = ({
    images,
    columns = 3,
    aspectRatio = '4/3',
    className,
}: VCTImageGalleryProps) => {
    const [lightboxIdx, setLightboxIdx] = React.useState<number | null>(null)

    /* Navigation */
    const goNext = React.useCallback(
        () => setLightboxIdx((prev) => (prev !== null ? (prev + 1) % images.length : null)),
        [images.length]
    )
    const goPrev = React.useCallback(
        () => setLightboxIdx((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null)),
        [images.length]
    )

    /* Keyboard */
    React.useEffect(() => {
        if (lightboxIdx === null) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxIdx(null)
            if (e.key === 'ArrowRight') goNext()
            if (e.key === 'ArrowLeft') goPrev()
        }
        document.addEventListener('keydown', handler)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', handler)
            document.body.style.overflow = ''
        }
    }, [lightboxIdx, goNext, goPrev])

    const currentImage = lightboxIdx !== null ? images[lightboxIdx] : null

    return (
        <>
            {/* Grid */}
            <div className={cn('grid gap-2', COL[columns], className ?? '')}>
                {images.map((img, i) => (
                    <button
                        key={`${img.src}-${i}`}
                        type="button"
                        onClick={() => setLightboxIdx(i)}
                        className={cn(
                            'group relative overflow-hidden rounded-xl border border-vct-border bg-vct-input transition hover:border-vct-accent focus:outline-none focus:ring-2 focus:ring-vct-accent/50',
                            ASPECT[aspectRatio]
                        )}
                    >
                        <VCT_Image
                            src={img.src}
                            alt={img.alt ?? ''}
                            className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                            fill
                            objectFit="cover"
                            loading="lazy"
                            sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        {img.caption ? (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-6 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                                {img.caption}
                            </div>
                        ) : null}
                    </button>
                ))}
            </div>

            {/* Lightbox */}
            {typeof document !== 'undefined'
                ? createPortal(
                    <AnimatePresence>
                        {currentImage ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z- flex items-center justify-center bg-black/80 backdrop-blur-md"
                                onClick={() => setLightboxIdx(null)}
                            >
                                {/* Image */}
                                <motion.img
                                    key={lightboxIdx}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    src={currentImage.src}
                                    alt={currentImage.alt ?? ''}
                                    className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                />

                                {/* Caption */}
                                {currentImage.caption ? (
                                    <div className="absolute bottom-6 text-sm font-semibold text-white/90">
                                        {currentImage.caption}
                                    </div>
                                ) : null}

                                {/* Counter */}
                                <div className="absolute top-5 right-5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white tabular-nums">
                                    {(lightboxIdx ?? 0) + 1} / {images.length}
                                </div>

                                {/* Close */}
                                <button
                                    type="button"
                                    onClick={() => setLightboxIdx(null)}
                                    className="absolute top-5 left-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                                    aria-label="Đóng"
                                >
                                    ✕
                                </button>

                                {/* Prev / Next */}
                                {images.length > 1 ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); goPrev() }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white text-lg transition hover:bg-white/20"
                                            aria-label="Ảnh trước"
                                        >
                                            ‹
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); goNext() }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white text-lg transition hover:bg-white/20"
                                            aria-label="Ảnh tiếp"
                                        >
                                            ›
                                        </button>
                                    </>
                                ) : null}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>,
                    document.body
                )
                : null}
        </>
    )
}

export const VCTImageGallery = VCT_ImageGallery as FC<VCTImageGalleryProps>
