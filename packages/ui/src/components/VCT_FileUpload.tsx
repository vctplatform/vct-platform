'use client'
 

import { useState, useRef, useCallback, type CSSProperties } from 'react'

/* ────────────────────────────────────────────
 *  VCT_FileUpload
 *  Drag-and-drop file upload zone with preview,
 *  size validation, and multiple file support.
 * ──────────────────────────────────────────── */

export interface VCT_FileUploadProps {
    /** Accepted file types (e.g. 'image/*', '.pdf,.doc') */
    accept?: string
    /** Allow multiple files */
    multiple?: boolean
    /** Max file size in bytes */
    maxSize?: number
    /** Upload handler */
    onUpload: (files: File[]) => Promise<void>
    /** Show image previews */
    preview?: boolean
    /** Placeholder text */
    placeholder?: string
    /** Disabled state */
    disabled?: boolean
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function VCT_FileUpload({
    accept,
    multiple = false,
    maxSize,
    onUpload,
    preview = true,
    placeholder,
    disabled = false,
}: VCT_FileUploadProps) {
    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const validateAndSet = useCallback(
        (fileList: FileList | File[]) => {
            setError(null)
            const arr = Array.from(fileList)
            // Size check
            if (maxSize) {
                const oversized = arr.find((f) => f.size > maxSize)
                if (oversized) {
                    setError(`${oversized.name} vượt quá giới hạn ${formatFileSize(maxSize)}`)
                    return
                }
            }
            const selected = multiple ? arr : arr.slice(0, 1)
            setFiles(selected)

            // Generate previews for images
            if (preview) {
                const urls: string[] = []
                selected.forEach((f) => {
                    if (f.type.startsWith('image/')) {
                        urls.push(URL.createObjectURL(f))
                    }
                })
                setPreviews(urls)
            }
        },
        [maxSize, multiple, preview],
    )

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)
            if (disabled) return
            validateAndSet(e.dataTransfer.files)
        },
        [disabled, validateAndSet],
    )

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) validateAndSet(e.target.files)
    }

    const handleUpload = async () => {
        if (files.length === 0 || uploading) return
        setUploading(true)
        try {
            await onUpload(files)
            setFiles([])
            setPreviews([])
        } catch {
            setError('Tải lên thất bại, vui lòng thử lại')
        } finally {
            setUploading(false)
        }
    }

    const removeFile = (idx: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== idx))
        setPreviews((prev) => prev.filter((_, i) => i !== idx))
    }

    const zoneStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '32px 24px',
        border: `2px dashed ${isDragging ? 'var(--vct-accent-cyan)' : 'var(--vct-border-subtle)'}`,
        borderRadius: 'var(--vct-radius-lg)',
        background: isDragging ? 'rgba(14,165,233,0.06)' : 'var(--vct-bg-base)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all var(--vct-duration-fast) ease',
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Drop zone */}
            <div
                role="button"
                tabIndex={0}
                aria-label={placeholder ?? 'Kéo thả hoặc chọn tệp'}
                onClick={() => !disabled && inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
                style={zoneStyle}
            >
                {/* Upload icon */}
                <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="var(--vct-text-tertiary)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span style={{ fontSize: 'var(--vct-font-sm)', color: 'var(--vct-text-secondary)', fontWeight: 500 }}>
                    {placeholder ?? 'Kéo thả tệp hoặc nhấp để chọn'}
                </span>
                {maxSize && (
                    <span style={{ fontSize: 'var(--vct-font-xs)', color: 'var(--vct-text-tertiary)' }}>
                        Tối đa {formatFileSize(maxSize)}
                    </span>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                    aria-hidden="true"
                />
            </div>

            {/* Error */}
            {error && (
                <span style={{ fontSize: 'var(--vct-font-xs)', color: 'var(--vct-danger)', fontWeight: 500 }}>
                    {error}
                </span>
            )}

            {/* File list */}
            {files.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {files.map((f, i) => (
                        <div
                            key={`${f.name}-${i}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 12px',
                                borderRadius: 'var(--vct-radius-md)',
                                background: 'var(--vct-bg-elevated)',
                                border: '1px solid var(--vct-border-subtle)',
                            }}
                        >
                            {/* Preview thumbnail */}
                            {preview && previews[i] && (
                                <img
                                    src={previews[i]}
                                    alt={f.name}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        objectFit: 'cover',
                                        borderRadius: 'var(--vct-radius-sm)',
                                        flexShrink: 0,
                                    }}
                                />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: 'var(--vct-font-sm)',
                                    fontWeight: 500,
                                    color: 'var(--vct-text-primary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {f.name}
                                </div>
                                <div style={{ fontSize: 'var(--vct-font-xs)', color: 'var(--vct-text-tertiary)' }}>
                                    {formatFileSize(f.size)}
                                </div>
                            </div>
                            <button
                                onClick={() => removeFile(i)}
                                aria-label={`Xóa ${f.name}`}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 28,
                                    height: 28,
                                    border: 'none',
                                    borderRadius: 'var(--vct-radius-sm)',
                                    background: 'transparent',
                                    color: 'var(--vct-text-tertiary)',
                                    cursor: 'pointer',
                                    fontSize: 16,
                                    flexShrink: 0,
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    {/* Upload button */}
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        aria-label="Tải lên"
                        style={{
                            padding: '8px 20px',
                            border: 'none',
                            borderRadius: 'var(--vct-radius-md)',
                            background: 'var(--vct-accent-cyan)',
                            color: '#fff',
                            fontSize: 'var(--vct-font-sm)',
                            fontWeight: 700,
                            cursor: uploading ? 'wait' : 'pointer',
                            opacity: uploading ? 0.7 : 1,
                            alignSelf: 'flex-end',
                            transition: 'opacity var(--vct-duration-fast) ease',
                        }}
                    >
                        {uploading ? 'Đang tải...' : 'Tải lên'}
                    </button>
                </div>
            )}
        </div>
    )
}
