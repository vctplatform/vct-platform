'use client'
import * as React from 'react'
import type { FC, ReactNode } from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CommentItem {
    /** Author display name */
    author: string
    /** Avatar element (letter, image, or initials) — rendered as-is */
    avatar?: ReactNode
    /** Comment body */
    content: ReactNode
    /** Relative time string */
    time?: string
    /** Like count */
    likes?: number
}

export interface VCTCommentThreadProps {
    /** Existing comments */
    comments: CommentItem[]
    /** Callback when a new comment is submitted */
    onSubmit?: (text: string) => void
    /** Placeholder for input */
    placeholder?: string
    /** Hide the input box */
    hideInput?: boolean
    className?: string
}

/* ------------------------------------------------------------------ */
/*  Avatar helper                                                      */
/* ------------------------------------------------------------------ */

const DefaultAvatar = ({ name }: { name: string }) => {
    const initials = name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
    const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360

    return (
        <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black text-white shrink-0"
            style={{ background: `hsl(${hue} 70% 45%)` }}
        >
            {initials || 'U'}
        </span>
    )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const VCT_CommentThread = ({
    comments,
    onSubmit,
    placeholder = 'Viết bình luận...',
    hideInput = false,
    className,
}: VCTCommentThreadProps) => {
    const [text, setText] = React.useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = text.trim()
        if (!trimmed || !onSubmit) return
        onSubmit(trimmed)
        setText('')
    }

    return (
        <div className={cn('grid gap-4', className ?? '')}>
            {/* Comment list */}
            {comments.length > 0 ? (
                <div className="grid gap-3">
                    {comments.map((c, i) => (
                        <div key={i} className="flex items-start gap-3">
                            {c.avatar ?? <DefaultAvatar name={c.author} />}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-vct-text">{c.author}</span>
                                    {c.time ? (
                                        <span className="text-[11px] text-vct-text-muted">{c.time}</span>
                                    ) : null}
                                </div>
                                <div className="mt-0.5 text-sm text-vct-text-secondary leading-relaxed">
                                    {c.content}
                                </div>
                                {typeof c.likes === 'number' ? (
                                    <button
                                        type="button"
                                        className="mt-1 inline-flex items-center gap-1 text-xs text-vct-text-muted hover:text-red-500 transition"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                            <path
                                                d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 0 1 8 4.5 3.5 3.5 0 0 1 13.5 7C13.5 10.5 8 14 8 14z"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        {c.likes}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            {/* Input */}
            {!hideInput && onSubmit ? (
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 rounded-xl border border-vct-border bg-vct-input px-3 py-2 text-sm text-vct-text outline-none transition placeholder:text-vct-text-muted focus:border-vct-accent"
                    />
                    <button
                        type="submit"
                        disabled={!text.trim()}
                        className={cn(
                            'inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-bold transition',
                            text.trim()
                                ? 'bg-vct-accent text-white hover:opacity-90'
                                : 'bg-vct-input text-vct-text-muted cursor-not-allowed'
                        )}
                    >
                        Gửi
                    </button>
                </form>
            ) : null}
        </div>
    )
}

export const VCTCommentThread = VCT_CommentThread as FC<VCTCommentThreadProps>
