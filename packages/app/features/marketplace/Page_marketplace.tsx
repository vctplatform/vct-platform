'use client'

import * as React from 'react'

import {
  VCT_Badge,
  VCT_Button,
  VCT_EmptyState,
  VCT_PageContainer,
  VCT_PageHero,
  VCT_SearchInput,
  VCT_Select,
  VCT_StatRow,
  VCT_Toast,
} from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { useMarketplaceCatalog } from '../hooks/useMarketplaceAPI'
import { MarketplaceProductCard } from './MarketplaceProductCard'
import {
  categoryAccentMap,
  formatCompactVND,
  marketplaceCategoryLabels,
  marketplaceConditionLabels,
} from './marketplace-ui'

const skeletons = Array.from({ length: 6 }, (_, index) => index)

export const Page_marketplace = () => {
  const [search, setSearch] = React.useState('')
  const [category, setCategory] = React.useState('all')
  const [condition, setCondition] = React.useState('all')
  const [featuredOnly, setFeaturedOnly] = React.useState(false)
  const [toastVisible, setToastVisible] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const deferredSearch = React.useDeferredValue(search)

  const { data, isLoading, error } = useMarketplaceCatalog({
    search: deferredSearch,
    category: category !== 'all' ? category : undefined,
    condition: condition !== 'all' ? condition : undefined,
    featured: featuredOnly,
  })

  const stats = data
    ? [
        {
          label: 'San pham dang ban',
          value: data.stats.total_products,
          icon: <VCT_Icons.ShoppingBag size={18} />,
          color: 'var(--vct-accent-cyan)',
        },
        {
          label: 'Nha ban dang hoat dong',
          value: data.stats.active_sellers,
          icon: <VCT_Icons.Users size={18} />,
          color: 'var(--vct-success)',
        },
        {
          label: 'Don da chot',
          value: data.stats.completed_orders,
          icon: <VCT_Icons.CheckCircle size={18} />,
          color: 'var(--vct-warning)',
        },
        {
          label: 'Gia tri ton kho',
          value: formatCompactVND(data.stats.total_inventory_vnd),
          icon: <VCT_Icons.DollarSign size={18} />,
          color: 'var(--vct-gold)',
        },
      ]
    : []

  const featuredProducts = data?.featured ?? []

  return (
    <VCT_PageContainer size="wide" animated>
      <VCT_Toast
        isVisible={toastVisible}
        message="Workspace quan tri cho seller nam trong Admin > Marketplace."
        type="info"
        onClose={() => setToastVisible(false)}
      />

      <VCT_PageHero
        title="VCT Marketplace"
        subtitle="San thuong mai dien tuyen cho thiet bi, dung cu, binh khi va ha tang vo duong. Tim nhanh nguon hang phu hop cho CLB, BTC va vo sinh."
        badge="Module moi"
        badgeType="success"
        icon={<VCT_Icons.ShoppingBag size={26} />}
        gradientFrom="rgba(249,115,22,0.12)"
        gradientTo="rgba(14,165,233,0.08)"
        actions={
          <div className="flex flex-wrap gap-3">
            <a href="/admin/marketplace">
              <VCT_Button icon={<VCT_Icons.ChevronRight size={16} />}>
                Seller workspace
              </VCT_Button>
            </a>
            <VCT_Button
              variant="secondary"
              icon={<VCT_Icons.AlertTriangle size={16} />}
              onClick={() => setToastVisible(true)}
            >
              Huong dan ban hang
            </VCT_Button>
          </div>
        }
      />

      {stats.length > 0 ? <VCT_StatRow items={stats} className="mb-8" /> : null}

      <section className="mb-8 grid gap-6 desktop:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[30px] border border-vct-border bg-vct-elevated p-5 shadow-(--vct-shadow-sm)">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-vct-text">Hang noi bat trong tuan</h2>
              <p className="mt-1 text-sm text-vct-text-secondary">
                Lua chon duoc mua nhieu boi cac vo duong va ban to chuc.
              </p>
            </div>
            {featuredOnly ? (
              <VCT_Badge text="Dang loc hang noi bat" type="warning" pulse={false} />
            ) : null}
          </div>

          {isLoading && featuredProducts.length === 0 ? (
            <div className="grid gap-4 tablet:grid-cols-2">
              {skeletons.slice(0, 2).map((item) => (
                <div
                  key={item}
                  className="h-[220px] animate-pulse rounded-[26px] border border-vct-border bg-vct-bg"
                />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid gap-4 tablet:grid-cols-2">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-[26px] border border-vct-border bg-vct-bg p-5"
                  style={{
                    background: `linear-gradient(180deg, ${categoryAccentMap[product.category]}12 0%, transparent 30%), var(--vct-bg)`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted">
                        {marketplaceCategoryLabels[product.category]}
                      </div>
                      <h3 className="mt-2 text-xl font-black text-vct-text">
                        {product.title}
                      </h3>
                    </div>
                    <VCT_Badge text={marketplaceConditionLabels[product.condition]} type="info" pulse={false} />
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-vct-text-secondary">
                    {product.description}
                  </p>
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <div className="text-[24px] font-black text-vct-text">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          maximumFractionDigits: 0,
                        }).format(product.price_vnd)}
                      </div>
                      <div className="mt-1 text-sm text-vct-text-secondary">
                        {product.seller_name}
                      </div>
                    </div>
                    <a href={`/marketplace/${product.slug}`}>
                      <VCT_Button variant="secondary" icon={<VCT_Icons.ChevronRight size={16} />}>
                        Mo
                      </VCT_Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <VCT_EmptyState
              title="Chua co hang noi bat"
              description="Du lieu se duoc cap nhat ngay khi seller bat dau dang san pham."
              icon={<VCT_Icons.Star size={24} />}
            />
          )}
        </div>

        <div className="rounded-[30px] border border-vct-border bg-vct-elevated p-5 shadow-(--vct-shadow-sm)">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-vct-border bg-vct-bg text-vct-accent">
              <VCT_Icons.ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-vct-text">Cam ket cua VCT Marketplace</h2>
              <p className="mt-1 text-sm text-vct-text-secondary">
                Nhanh hon cho mua sam CLB, an toan hon cho binh khi va bao ho.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {[
              {
                title: 'Seller ro nguon goc',
                desc: 'Thong tin nguoi ban, khu vuc va vai tro duoc hien thi xuyen suot tren tung san pham.',
                icon: <VCT_Icons.UserCheck size={16} />,
              },
              {
                title: 'Ton kho va giao hang minh bach',
                desc: 'Ton kho, phi ship va lead time duoc day ra ngay tu contract backend.',
                icon: <VCT_Icons.Clock size={16} />,
              },
              {
                title: 'Tach rieng cong khai va quan tri',
                desc: 'Catalog cong khai cho nguoi mua, seller workspace rieng cho quan ly san pham va don hang.',
                icon: <VCT_Icons.ClipboardList size={16} />,
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-vct-border bg-vct-bg px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-bold text-vct-text">
                  {item.icon}
                  {item.title}
                </div>
                <p className="mt-1 text-sm leading-6 text-vct-text-secondary">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-[30px] border border-vct-border bg-vct-elevated p-5 shadow-(--vct-shadow-sm)">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <VCT_SearchInput
              value={search}
              onChange={(value) => {
                startTransition(() => setSearch(value))
              }}
              placeholder="Tim theo ten san pham, seller hoac tu khoa..."
              loading={isPending}
              onClear={() => setSearch('')}
            />
          </div>
          <VCT_Select
            value={category}
            onChange={(value) => startTransition(() => setCategory(value))}
            options={[
              { value: 'all', label: 'Tat ca danh muc' },
              ...(data?.facets.categories.map((item) => ({
                value: item.key,
                label: `${item.label} (${item.count})`,
              })) ?? []),
            ]}
          />
          <VCT_Select
            value={condition}
            onChange={(value) => startTransition(() => setCondition(value))}
            options={[
              { value: 'all', label: 'Moi tinh trang' },
              ...(data?.facets.conditions.map((item) => ({
                value: item.key,
                label: `${item.label} (${item.count})`,
              })) ?? []),
            ]}
          />
          <VCT_Button
            variant={featuredOnly ? 'primary' : 'secondary'}
            icon={<VCT_Icons.Star size={16} />}
            onClick={() => startTransition(() => setFeaturedOnly((current) => !current))}
          >
            {featuredOnly ? 'Bo loc noi bat' : 'Chi hang noi bat'}
          </VCT_Button>
        </div>
      </section>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600">
          {error.message}
        </div>
      ) : null}

      {isLoading && !data ? (
        <div className="grid gap-5 tablet:grid-cols-2 desktop:grid-cols-3">
          {skeletons.map((item) => (
            <div
              key={item}
              className="h-[420px] animate-pulse rounded-[28px] border border-vct-border bg-vct-elevated"
            />
          ))}
        </div>
      ) : data?.items.length ? (
        <section className="grid gap-5 tablet:grid-cols-2 desktop:grid-cols-3">
          {data.items.map((product) => (
            <MarketplaceProductCard key={product.id} product={product} />
          ))}
        </section>
      ) : (
        <VCT_EmptyState
          title="Khong tim thay san pham phu hop"
          description="Thu doi tu khoa tim kiem hoac bo loc danh muc de hien thi them mat hang."
          icon={<VCT_Icons.ShoppingBag size={28} />}
          actionLabel="Bo loc"
          onAction={() => {
            setSearch('')
            setCategory('all')
            setCondition('all')
            setFeaturedOnly(false)
          }}
        />
      )}
    </VCT_PageContainer>
  )
}
