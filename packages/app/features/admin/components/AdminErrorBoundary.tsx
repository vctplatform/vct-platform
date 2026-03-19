import React from 'react'
import { VCT_Icons } from '../../components/vct-icons'
import { VCT_Button } from '../../components/vct-ui'

interface Props {
    children: React.ReactNode
    fallback?: React.ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

/**
 * Error Boundary for admin module pages.
 * Catches render errors and shows a branded error UI with retry option.
 * Prevents a single page crash from taking down the entire admin panel.
 */
export class AdminErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Log to console in development, can be wired to error reporting service
        console.error('[AdminErrorBoundary]', error, info.componentStack)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback

            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] px-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-(--vct-accent-red)/10 flex items-center justify-center mb-4">
                        <VCT_Icons.AlertTriangle size={32} className="text-(--vct-accent-red)" />
                    </div>
                    <h2 className="text-xl font-bold text-(--vct-text-primary) mb-2">
                        Đã xảy ra lỗi
                    </h2>
                    <p className="text-sm text-(--vct-text-tertiary) max-w-md mb-1">
                        Trang admin gặp sự cố. Vui lòng thử lại hoặc liên hệ bộ phận kỹ thuật.
                    </p>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre className="mt-2 p-3 bg-(--vct-bg-base) rounded-lg text-xs text-(--vct-accent-red) max-w-lg overflow-auto text-left border border-(--vct-border-subtle)">
                            {this.state.error.message}
                        </pre>
                    )}
                    <VCT_Button
                        variant="primary"
                        size="sm"
                        className="mt-6"
                        onClick={this.handleRetry}
                        icon={<VCT_Icons.Refresh size={14} />}
                    >
                        Thử lại
                    </VCT_Button>
                </div>
            )
        }

        return this.props.children
    }
}
