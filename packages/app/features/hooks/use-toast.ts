'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastState {
  show: boolean
  msg: string
  type: ToastType
}

const INITIAL_TOAST: ToastState = {
  show: false,
  msg: '',
  type: 'success',
}

export const useToast = (durationMs = 3500) => {
  const [toast, setToast] = useState<ToastState>(INITIAL_TOAST)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (!timeoutRef.current) return
    clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }, [])

  const hideToast = useCallback(() => {
    clearTimer()
    setToast((prev) => ({ ...prev, show: false }))
  }, [clearTimer])

  const showToast = useCallback(
    (msg: string, type: ToastType = 'success') => {
      clearTimer()
      setToast({ show: true, msg, type })
      timeoutRef.current = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }))
        timeoutRef.current = null
      }, durationMs)
    },
    [clearTimer, durationMs]
  )

  useEffect(() => () => clearTimer(), [clearTimer])

  return {
    toast,
    showToast,
    hideToast,
  }
}

