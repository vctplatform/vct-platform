'use client'
import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { CSSProperties, FC, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn, VCT_Button } from './vct-ui-layout'

export interface VCTLoadingOverlayProps {
  show?: boolean
  open?: boolean
  message?: ReactNode
  title?: ReactNode
  desc?: ReactNode
  className?: string
}

export interface VCTModalProps {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  width?: string | number
  className?: string
  style?: CSSProperties
}

export interface VCTToastProps {
  isVisible: boolean
  message: ReactNode
  type?: 'success' | 'warning' | 'error' | 'info' | string
  onClose?: () => void
  durationMs?: number
  className?: string
}

export interface VCTConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: ReactNode
  message?: ReactNode
  preview?: ReactNode
  confirmLabel?: ReactNode
  confirmVariant?: 'primary' | 'danger' | 'secondary' | string
  loading?: boolean
}

const TOAST_TONE_CLASS: Record<'success' | 'warning' | 'error' | 'info', string> = {
  success: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-600',
  warning: 'border-amber-500/35 bg-amber-500/10 text-amber-600',
  error: 'border-red-500/35 bg-red-500/10 text-red-600',
  info: 'border-sky-500/35 bg-sky-500/10 text-sky-600',
}

const toneFromType = (type: string) =>
  (['success', 'warning', 'error', 'info'].includes(type)
    ? type
    : 'success') as 'success' | 'warning' | 'error' | 'info'

export const VCT_LoadingOverlay = ({
  show,
  open,
  message,
  title,
  desc,
  className,
}: VCTLoadingOverlayProps) => {
  const visible = show ?? open ?? false
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className={cn(
            'fixed inset-0 z-[400] grid place-items-center bg-slate-950/40 backdrop-blur-[1px]',
            className ?? ''
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="grid place-items-center gap-2 rounded-2xl border border-vct-border bg-vct-elevated px-6 py-5 shadow-[var(--vct-shadow-lg)]"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
          >
            <span
              className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-vct-accent border-r-transparent"
              aria-hidden="true"
            />
            <div className="text-sm font-extrabold text-vct-text">
              {title ?? message ?? 'Loading'}
            </div>
            {desc ? (
              <div className="text-xs text-vct-text-secondary">{desc}</div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export const VCT_Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width = '600px',
  className,
  style,
}: VCTModalProps) => {
  const titleId = React.useId()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  React.useEffect(() => {
    if (!isOpen) return
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeydown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [isOpen, onClose])

  if (!isMounted) {
    return null
  }

  const modalNode = (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close dialog backdrop"
            onClick={onClose}
            className="fixed inset-0 z-[400] border-none bg-slate-950/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            className={cn(
              'fixed left-1/2 top-1/2 z-[410] w-[calc(100vw-24px)] max-h-[min(90vh,900px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-vct-border bg-vct-elevated shadow-[var(--vct-shadow-xl)]',
              className ?? ''
            )}
            style={{ maxWidth: width, ...style }}
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.2 }}
          >
            <header className="flex items-center justify-between border-b border-vct-border px-4 py-3">
              <h3 id={titleId} className="m-0 text-base font-black text-vct-text">
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-md px-2 py-1 text-sm font-bold text-vct-text-muted transition hover:bg-vct-input hover:text-vct-text"
              >
                x
              </button>
            </header>
            <div className="vct-hide-scrollbar max-h-[calc(min(90vh,900px)-120px)] overflow-y-auto px-4 py-4">
              {children}
            </div>
            {footer ? (
              <footer className="flex justify-end gap-3 border-t border-vct-border px-4 py-3">{footer}</footer>
            ) : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )

  return createPortal(modalNode, document.body)
}

export const VCT_Toast = ({
  isVisible,
  message,
  type = 'success',
  onClose,
  durationMs = 3200,
  className,
}: VCTToastProps) => {
  React.useEffect(() => {
    if (!isVisible || !onClose || durationMs <= 0) return
    const timer = window.setTimeout(onClose, durationMs)
    return () => window.clearTimeout(timer)
  }, [durationMs, isVisible, onClose])

  const tone = toneFromType(type)
  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed bottom-4 right-4 z-[500] max-w-[420px] rounded-xl border px-3 py-2 text-sm font-semibold shadow-[var(--vct-shadow-lg)]',
            TOAST_TONE_CLASS[tone],
            className ?? ''
          )}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
        >
          <div className="flex items-start gap-2">
            <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-current" />
            <div className="flex-1">{message}</div>
            {onClose ? (
              <button
                type="button"
                aria-label="Close toast"
                onClick={onClose}
                className="rounded px-1.5 py-0.5 text-xs font-black hover:bg-black/5"
              >
                x
              </button>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export const VCT_ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  preview,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  loading = false,
}: VCTConfirmDialogProps) => (
  <VCT_Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    width={520}
    footer={
      <div className="flex justify-end gap-2">
        <VCT_Button variant="ghost" onClick={onClose}>
          Cancel
        </VCT_Button>
        <VCT_Button
          variant={
            confirmVariant === 'danger'
              ? 'danger'
              : confirmVariant === 'secondary'
                ? 'secondary'
                : 'primary'
          }
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </VCT_Button>
      </div>
    }
  >
    <div className="grid gap-3">
      {message ? <p className="m-0 text-sm text-vct-text-secondary">{message}</p> : null}
      {preview ? (
        <div className="rounded-xl border border-vct-border bg-vct-input px-3 py-2 text-sm text-vct-text">
          {preview}
        </div>
      ) : null}
    </div>
  </VCT_Modal>
)

export const VCTLoadingOverlay = VCT_LoadingOverlay as FC<VCTLoadingOverlayProps>
export const VCTModal = VCT_Modal as FC<VCTModalProps>
export const VCTToast = VCT_Toast as FC<VCTToastProps>
export const VCTConfirmDialog = VCT_ConfirmDialog as FC<VCTConfirmDialogProps>
