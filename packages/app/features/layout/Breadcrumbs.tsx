'use client'
import * as React from 'react'
import type { BreadcrumbItem } from './route-registry'

export interface VCTBreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export const VCT_Breadcrumbs = ({ items, className = '' }: VCTBreadcrumbsProps) => {
  if (!items.length) return null

  return (
    <nav aria-label="Đường dẫn trang" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-xs font-semibold text-vct-text-muted">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1
          const hasLink = Boolean(item.href && !isCurrent)
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
              {index > 0 && (
                <svg
                  aria-hidden="true"
                  className="h-3 w-3 opacity-40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
              {isCurrent ? (
                <span aria-current="page" className="font-bold text-vct-accent">
                  {item.label}
                </span>
              ) : hasLink ? (
                <a
                  href={item.href}
                  className="rounded px-1 py-0.5 transition hover:bg-(--vct-bg-hover) hover:text-vct-text"
                >
                  {item.label}
                </a>
              ) : (
                <span className="px-1 py-0.5">{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
