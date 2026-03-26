'use client'
import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FC, ReactNode } from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VCTTagInputProps {
    /** Current tags */
    tags: string[]
    /** Change handler — receives full tag array */
    onChange: (tags: string[]) => void
    /** Placeholder in the input */
    placeholder?: string
    /** Maximum number of tags allowed */
    maxTags?: number
    /** Autocomplete suggestions */
    suggestions?: string[]
    /** Label above the input */
    label?: ReactNode
    /** Error message */
    error?: ReactNode
    /** Disable the input */
    disabled?: boolean
    className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const VCT_TagInput = ({
    tags,
    onChange,
    placeholder = 'Nhập và nhấn Enter...',
    maxTags,
    suggestions = [],
    label,
    error,
    disabled = false,
    className,
}: VCTTagInputProps) => {
    const [inputValue, setInputValue] = React.useState('')
    const [showSuggestions, setShowSuggestions] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const atLimit = maxTags !== undefined && tags.length >= maxTags

    /* Filtered suggestions */
    const filtered = React.useMemo(() => {
        if (!inputValue.trim()) return []
        const lower = inputValue.toLowerCase()
        return suggestions
            .filter(
                (s) =>
                    s.toLowerCase().includes(lower) &&
                    !tags.includes(s)
            )
            .slice(0, 8)
    }, [inputValue, suggestions, tags])

    const addTag = (tag: string) => {
        const trimmed = tag.trim()
        if (!trimmed || tags.includes(trimmed) || atLimit) return
        onChange([...tags, trimmed])
        setInputValue('')
        setShowSuggestions(false)
    }

    const removeTag = (index: number) => {
        onChange(tags.filter((_, i) => i !== index))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag(inputValue)
        } else if (
            e.key === 'Backspace' &&
            !inputValue &&
            tags.length > 0
        ) {
            removeTag(tags.length - 1)
        }
    }

    /* Close suggestions on click-outside */
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div className={cn('grid gap-1.5', className ?? '')} ref={containerRef}>
            {label ? (
                <label className="text-xs font-bold text-vct-text-secondary">
                    {label}
                </label>
            ) : null}

            <div
                className={cn(
                    'flex flex-wrap items-center gap-1.5 rounded-xl border px-3 py-2 transition',
                    error
                        ? 'border-red-500'
                        : 'border-vct-border focus-within:border-vct-accent',
                    'bg-vct-input',
                    disabled && 'opacity-60 cursor-not-allowed'
                )}
                onClick={() => inputRef.current?.focus()}
            >
                {/* Tags */}
                <AnimatePresence mode="popLayout">
                    {tags.map((tag, i) => (
                        <motion.span
                            key={tag}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            className="inline-flex items-center gap-1 rounded-lg border border-vct-border bg-vct-elevated px-2 py-1 text-xs font-semibold text-vct-text"
                        >
                            {tag}
                            {!disabled ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeTag(i)
                                    }}
                                    className="ml-0.5 text-vct-text-muted hover:text-red-500 transition"
                                    aria-label={`Xóa ${tag}`}
                                >
                                    ×
                                </button>
                            ) : null}
                        </motion.span>
                    ))}
                </AnimatePresence>

                {/* Input */}
                {!atLimit ? (
                    <input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value)
                            setShowSuggestions(true)
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={tags.length === 0 ? placeholder : ''}
                        disabled={disabled}
                        className="flex-1 min-w-[100px] border-none bg-transparent text-sm text-vct-text outline-none placeholder:text-vct-text-muted"
                    />
                ) : null}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && filtered.length > 0 ? (
                <div className="relative">
                    <div className="absolute top-0 left-0 right-0 z-50 max-h-48 overflow-y-auto rounded-xl border border-vct-border bg-vct-elevated shadow-xl">
                        {filtered.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => addTag(s)}
                                className="flex w-full items-center px-3 py-2 text-sm text-vct-text transition hover:bg-vct-input"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Meta row */}
            <div className="flex items-center justify-between">
                {error ? (
                    <div role="alert" className="text-xs font-semibold text-red-500">
                        {error}
                    </div>
                ) : (
                    <span />
                )}
                {maxTags ? (
                    <span className="text-[11px] font-semibold text-vct-text-muted tabular-nums">
                        {tags.length}/{maxTags}
                    </span>
                ) : null}
            </div>
        </div>
    )
}

export const VCTTagInput = VCT_TagInput as FC<VCTTagInputProps>
