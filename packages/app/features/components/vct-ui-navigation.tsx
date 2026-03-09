'use client'
import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export interface VCTBreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

export interface VCTBreadcrumbProps {
  items: VCTBreadcrumbItem[]
  className?: string
}

export const VCT_Breadcrumb = ({ items, className = '' }: VCTBreadcrumbProps) => {
  if (!items.length) return null

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold text-vct-text-muted">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1
          const key = `${item.label}-${index}`
          return (
            <li key={key} className="inline-flex items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="opacity-50">/</span>}
              {item.href && !isCurrent ? (
                <a
                  href={item.href}
                  onClick={item.onClick}
                  className="vct-breadcrumb-link"
                >
                  {item.label}
                </a>
              ) : (
                <span aria-current={isCurrent ? 'page' : undefined} className={isCurrent ? 'text-vct-text' : 'vct-breadcrumb-link'}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export interface VCTPaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (nextPage: number) => void
  className?: string
}

export const VCT_Pagination = ({
  page,
  pageSize,
  total,
  onChange,
  className = '',
}: VCTPaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
  const current = Math.max(1, Math.min(page, totalPages))

  const pages = React.useMemo(() => {
    const start = Math.max(1, current - 2)
    const end = Math.min(totalPages, current + 2)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [current, totalPages])

  return (
    <nav
      aria-label="Phân trang dữ liệu"
      className={`inline-flex items-center gap-1 rounded-xl border border-vct-border bg-vct-elevated p-1 ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
        aria-label="Trang trước"
        className="rounded-lg px-3 py-1.5 text-sm font-bold text-vct-text-muted transition enabled:hover:bg-vct-input disabled:cursor-not-allowed disabled:opacity-40"
      >
        Trước
      </button>
      {pages.map((item) => (
        <button
          key={item}
          type="button"
          aria-current={item === current ? 'page' : undefined}
          onClick={() => onChange(item)}
          className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${item === current
              ? 'bg-vct-accent text-white'
              : 'text-vct-text-muted hover:bg-vct-input'
            }`}
        >
          {item}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current >= totalPages}
        aria-label="Trang sau"
        className="rounded-lg px-3 py-1.5 text-sm font-bold text-vct-text-muted transition enabled:hover:bg-vct-input disabled:cursor-not-allowed disabled:opacity-40"
      >
        Sau
      </button>
    </nav>
  )
}


