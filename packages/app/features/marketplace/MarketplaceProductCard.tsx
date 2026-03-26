'use client'

import * as React from 'react'
import type { MarketplaceProduct } from '@vct/shared-types'

import { VCT_Badge, VCT_Button } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import {
  categoryAccentMap,
  formatCurrencyVND,
  marketplaceCategoryLabels,
  marketplaceConditionLabels,
  marketplaceStatusLabels,
  marketplaceStatusTone,
} from './marketplace-ui'

interface MarketplaceProductCardProps {
  product: MarketplaceProduct
  priority?: boolean
}

const productCategoryIcon = (category: MarketplaceProduct['category']) => {
  switch (category) {
    case 'vo_phuc':
      return <VCT_Icons.User size={18} />
    case 'bao_ho':
      return <VCT_Icons.ShieldCheck size={18} />
    case 'binh_khi':
      return <VCT_Icons.Swords size={18} />
    case 'san_dau':
      return <VCT_Icons.Layers size={18} />
    default:
      return <VCT_Icons.ShoppingBag size={18} />
  }
}

export function MarketplaceProductCard({
  product,
}: MarketplaceProductCardProps) {
  const accent = categoryAccentMap[product.category]

  return (
    <article
      className="group overflow-hidden rounded-[28px] border border-vct-border bg-vct-elevated shadow-(--vct-shadow-sm) transition hover:-translate-y-0.5 hover:border-vct-border-strong"
      style={{
        background: `linear-gradient(180deg, ${accent}10 0%, transparent 22%), var(--vct-bg-elevated)`,
      }}
    >
      <div className="relative overflow-hidden border-b border-vct-border p-5">
        <div
          className="absolute inset-x-6 top-4 h-24 rounded-full blur-3xl"
          style={{ background: `${accent}22` }}
          aria-hidden="true"
        />
        <div className="relative flex items-start justify-between gap-4">
          <div
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10"
            style={{ backgroundColor: `${accent}1a`, color: accent }}
          >
            {productCategoryIcon(product.category)}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <VCT_Badge
              type={marketplaceStatusTone(product.status)}
              text={marketplaceStatusLabels[product.status]}
              pulse={false}
            />
            <VCT_Badge
              type="info"
              text={marketplaceConditionLabels[product.condition]}
              pulse={false}
            />
          </div>
        </div>

        <div className="relative mt-6 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-vct-border bg-vct-bg/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-secondary">
            {productCategoryIcon(product.category)}
            {marketplaceCategoryLabels[product.category]}
          </div>
          <div>
            <h3 className="text-lg font-black leading-tight text-vct-text">
              {product.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-vct-text-secondary">
              {product.short_description}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[26px] font-black leading-none text-vct-text">
              {formatCurrencyVND(product.price_vnd)}
            </div>
            {product.compare_at_price_vnd > product.price_vnd ? (
              <div className="mt-1 text-xs font-semibold text-vct-text-muted line-through">
                {formatCurrencyVND(product.compare_at_price_vnd)}
              </div>
            ) : null}
          </div>
          <div className="rounded-2xl border border-vct-border bg-vct-bg px-3 py-2 text-right">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted">
              Ton kho
            </div>
            <div className="text-sm font-black text-vct-text">
              {product.stock_quantity}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-vct-border bg-vct-bg px-3 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted">
              Nguoi ban
            </div>
            <div className="mt-1 font-semibold text-vct-text">
              {product.seller_name}
            </div>
          </div>
          <div className="rounded-2xl border border-vct-border bg-vct-bg px-3 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted">
              Khu vuc
            </div>
            <div className="mt-1 inline-flex items-center gap-1 font-semibold text-vct-text">
              <VCT_Icons.MapPin size={14} />
              {product.location || 'Toan quoc'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {product.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-vct-border px-2.5 py-1 text-[11px] font-semibold text-vct-text-secondary"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex gap-3">
          <a href={`/marketplace/${product.slug}`} className="flex-1">
            <VCT_Button
              type="button"
              variant="primary"
              className="w-full justify-center"
              icon={<VCT_Icons.ChevronRight size={16} />}
            >
              Xem chi tiet
            </VCT_Button>
          </a>
        </div>
      </div>
    </article>
  )
}
