'use client'
import * as React from 'react'
import type { FC, ReactNode } from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type RichTextToolbar =
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikethrough'
    | 'orderedList'
    | 'unorderedList'
    | 'link'

export interface VCTRichTextEditorProps {
    /** HTML content */
    value?: string
    /** Change handler — receives HTML string */
    onChange?: (html: string) => void
    /** Placeholder text */
    placeholder?: string
    /** Toolbar buttons to show */
    toolbar?: RichTextToolbar[]
    /** Label above the editor */
    label?: ReactNode
    /** Error message */
    error?: ReactNode
    /** Minimum height */
    minHeight?: number
    /** Disable the editor */
    disabled?: boolean
    className?: string
}

/* ------------------------------------------------------------------ */
/*  Toolbar button config                                              */
/* ------------------------------------------------------------------ */

interface ToolbarConfig {
    command: string
    icon: string
    title: string
    value?: string
}

const TOOLBAR_MAP: Record<RichTextToolbar, ToolbarConfig> = {
    bold: { command: 'bold', icon: 'B', title: 'In đậm' },
    italic: { command: 'italic', icon: 'I', title: 'In nghiêng' },
    underline: { command: 'underline', icon: 'U', title: 'Gạch chân' },
    strikethrough: {
        command: 'strikeThrough',
        icon: 'S',
        title: 'Gạch ngang',
    },
    orderedList: {
        command: 'insertOrderedList',
        icon: '1.',
        title: 'Danh sách đánh số',
    },
    unorderedList: {
        command: 'insertUnorderedList',
        icon: '•',
        title: 'Danh sách dấu chấm',
    },
    link: { command: 'createLink', icon: '🔗', title: 'Chèn liên kết' },
}

const DEFAULT_TOOLBAR: RichTextToolbar[] = [
    'bold',
    'italic',
    'underline',
    'orderedList',
    'unorderedList',
    'link',
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const VCT_RichTextEditor = ({
    value = '',
    onChange,
    placeholder = 'Nhập nội dung...',
    toolbar = DEFAULT_TOOLBAR,
    label,
    error,
    minHeight = 160,
    disabled = false,
    className,
}: VCTRichTextEditorProps) => {
    const editorRef = React.useRef<HTMLDivElement>(null)
    const isInitialMount = React.useRef(true)

    /* Set initial content only on mount */
    React.useEffect(() => {
        if (isInitialMount.current && editorRef.current && value) {
            editorRef.current.innerHTML = value
            isInitialMount.current = false
        }
    }, [value])

    const handleInput = () => {
        if (!editorRef.current) return
        const html = editorRef.current.innerHTML
        onChange?.(html === '<br>' ? '' : html)
    }

    const execCommand = (config: ToolbarConfig) => {
        if (disabled) return

        if (config.command === 'createLink') {
            const url = window.prompt('Nhập URL:')
            if (url) {
                document.execCommand('createLink', false, url)
            }
        } else {
            document.execCommand(config.command, false, config.value)
        }

        editorRef.current?.focus()
        handleInput()
    }

    const isEmpty = !value || value === '<br>'

    return (
        <div className={cn('grid gap-1.5', className ?? '')}>
            {label ? (
                <label className="text-xs font-bold text-vct-text-secondary">
                    {label}
                </label>
            ) : null}

            <div
                className={cn(
                    'rounded-xl border overflow-hidden transition',
                    error ? 'border-red-500' : 'border-vct-border focus-within:border-vct-accent',
                    disabled && 'opacity-60 cursor-not-allowed'
                )}
            >
                {/* Toolbar */}
                <div className="flex items-center gap-0.5 border-b border-vct-border bg-vct-elevated px-2 py-1.5">
                    {toolbar.map((key) => {
                        const config = TOOLBAR_MAP[key]
                        const isTextStyle = ['bold', 'italic', 'underline', 'strikethrough'].includes(key)

                        return (
                            <button
                                key={key}
                                type="button"
                                title={config.title}
                                onClick={() => execCommand(config)}
                                disabled={disabled}
                                className={cn(
                                    'inline-flex h-7 w-7 items-center justify-center rounded-md text-xs transition',
                                    'text-vct-text-muted hover:bg-vct-input hover:text-vct-text',
                                    'disabled:cursor-not-allowed disabled:opacity-40',
                                    isTextStyle && key === 'bold' && 'font-extrabold',
                                    isTextStyle && key === 'italic' && 'italic',
                                    isTextStyle && key === 'underline' && 'underline',
                                    isTextStyle && key === 'strikethrough' && 'line-through'
                                )}
                            >
                                {config.icon}
                            </button>
                        )
                    })}
                </div>

                {/* Editable area */}
                <div className="relative">
                    <div
                        ref={editorRef}
                        contentEditable={!disabled}
                        onInput={handleInput}
                        className={cn(
                            'w-full px-4 py-3 text-sm text-vct-text outline-none',
                            'prose prose-sm max-w-none',
                            '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
                            '[&_a]:text-vct-accent [&_a]:underline',
                            'bg-vct-input'
                        )}
                        style={{ minHeight }}
                        role="textbox"
                        aria-multiline="true"
                        suppressContentEditableWarning
                    />

                    {/* Placeholder overlay */}
                    {isEmpty ? (
                        <div
                            className="pointer-events-none absolute left-4 top-3 text-sm text-vct-text-muted"
                            aria-hidden="true"
                        >
                            {placeholder}
                        </div>
                    ) : null}
                </div>
            </div>

            {error ? (
                <div role="alert" className="text-xs font-semibold text-red-500">
                    {error}
                </div>
            ) : null}
        </div>
    )
}

export const VCTRichTextEditor = VCT_RichTextEditor as FC<VCTRichTextEditorProps>
