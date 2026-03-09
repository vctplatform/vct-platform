'use client'

/**
 * VCT Error Boundary
 * 
 * Global error boundary component for catching rendering errors
 * and displaying a user-friendly fallback UI.
 */

import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class VCT_ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[VCT ErrorBoundary]', error, errorInfo)
        // TODO: Send to monitoring service (Sentry, etc.)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback

            return (
                <div
                    style={{
                        minHeight: '50vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '2rem',
                        fontFamily: "'Inter', sans-serif",
                    }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--vct-text-primary, #fff)', margin: '0 0 0.5rem' }}>
                        Đã xảy ra lỗi
                    </h2>
                    <p style={{ color: 'var(--vct-text-secondary, #94a3b8)', maxWidth: 400, lineHeight: 1.5 }}>
                        Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang hoặc liên hệ ban tổ chức.
                    </p>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre
                            style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                borderRadius: 8,
                                background: 'rgba(239,68,68,0.1)',
                                color: '#ef4444',
                                fontSize: 12,
                                maxWidth: 600,
                                overflow: 'auto',
                                textAlign: 'left',
                            }}
                        >
                            {this.state.error.message}
                            {'\n'}
                            {this.state.error.stack}
                        </pre>
                    )}
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: null })
                            window.location.reload()
                        }}
                        style={{
                            marginTop: '1.5rem',
                            padding: '10px 24px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#00bcd4',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        🔄 Tải lại trang
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

/**
 * VCT SEO Meta Component
 * 
 * Standard metadata for all pages following Next.js App Router conventions.
 */
export function generateVCTMetadata({
    title,
    description,
    path = '/',
}: {
    title: string
    description?: string
    path?: string
}) {
    const siteName = 'VCT Platform - Hệ thống Quản lý Giải đấu Võ Cổ Truyền'
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vct-platform.vn'

    return {
        title: `${title} | VCT Platform`,
        description: description || 'Hệ thống quản lý giải đấu Võ Cổ Truyền Việt Nam — chấm điểm, lịch thi đấu, HCV, và quản lý VĐV.',
        metadataBase: new URL(baseUrl),
        openGraph: {
            title: `${title} | ${siteName}`,
            description,
            url: `${baseUrl}${path}`,
            siteName,
            locale: 'vi_VN',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${title} | VCT Platform`,
            description,
        },
        viewport: {
            width: 'device-width',
            initialScale: 1,
            maximumScale: 1,
            userScalable: false,
        },
        themeColor: '#00bcd4',
        appleWebApp: {
            capable: true,
            statusBarStyle: 'black-translucent',
            title: 'VCT Platform',
        },
        manifest: '/manifest.json',
    }
}
