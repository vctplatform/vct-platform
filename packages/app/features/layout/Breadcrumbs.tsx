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
      <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold text-vct-text-muted">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1
          const hasLink = Boolean(item.href && !isCurrent)
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="opacity-50">/</span>}
              {isCurrent ? (
                <span aria-current="page" className="text-vct-text">{item.label}</span>
              ) : hasLink ? (
                <a href={item.href} className="vct-breadcrumb-link">
                  {item.label}
                </a>
              ) : (
                <span className="vct-breadcrumb-link">{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
