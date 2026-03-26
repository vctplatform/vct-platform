'use client'

import * as React from 'react'

import type { MarketplaceCreateOrderInput } from '@vct/shared-types'

import {
  VCT_Badge,
  VCT_Button,
  VCT_Input,
  VCT_Modal,
  VCT_NumberInput,
  VCT_PageContainer,
  VCT_Textarea,
  VCT_Toast,
} from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import {
  useCreateMarketplaceOrder,
  useMarketplaceCatalog,
  useMarketplaceProduct,
} from '../hooks/useMarketplaceAPI'
import { MarketplaceProductCard } from './MarketplaceProductCard'
import {
  categoryAccentMap,
  formatCurrencyVND,
  marketplaceCategoryLabels,
  marketplaceConditionLabels,
  marketplaceStatusLabels,
  marketplaceStatusTone,
} from './marketplace-ui'

interface PageMarketplaceProductProps {
  slug: string
}

const blankOrderForm: MarketplaceCreateOrderInput = {
  quantity: 1,
  buyer_name: '',
  buyer_phone: '',
  buyer_email: '',
  buyer_address: '',
  notes: '',
}

export const Page_marketplace_product = ({
  slug,
}: PageMarketplaceProductProps) => {
  const { data: product, isLoading, error, refetch } = useMarketplaceProduct(slug)
  const { data: relatedData } = useMarketplaceCatalog({
    category: product?.category,
  })
  const { mutate: createOrder, isLoading: isSubmitting } = useCreateMarketplaceOrder()

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [toast, setToast] = React.useState<{
    visible: boolean
    type: 'success' | 'error' | 'info'
    message: string
  }>({ visible: false, type: 'info', message: '' })
  const [form, setForm] = React.useState<MarketplaceCreateOrderInput>(blankOrderForm)

  React.useEffect(() => {
    if (!product) return
    setForm((current) => ({
      ...current,
      quantity: Math.max(product.minimum_order_quantity, current.quantity || 1),
    }))
  }, [product])

  const relatedProducts = React.useMemo(
    () =>
      (relatedData?.items ?? [])
        .filter((item) => item.id !== product?.id)
        .slice(0, 3),
    [product?.id, relatedData?.items]
  )

  const openOrderModal = () => {
    if (!product) return
    setForm({
      ...blankOrderForm,
      product_id: product.id,
      product_slug: product.slug,
      quantity: product.minimum_order_quantity,
    })
    setIsModalOpen(true)
  }

  const submitOrder = async () => {
    if (!product) return
    try {
      await createOrder({
        ...form,
        product_id: product.id,
        product_slug: product.slug,
      })
      setIsModalOpen(false)
      setToast({
        visible: true,
        type: 'success',
        message: 'Don hang da duoc tao. Seller se lien he xac nhan trong thoi gian ngan nhat.',
      })
      await refetch()
    } catch (mutationError) {
      setToast({
        visible: true,
        type: 'error',
        message:
          mutationError instanceof Error
            ? mutationError.message
            : 'Khong the tao don hang',
      })
    }
  }

  if (isLoading && !product) {
    return (
      <VCT_PageContainer size="wide" animated>
        <div className="h-[380px] animate-pulse rounded-[32px] border border-vct-border bg-vct-elevated" />
      </VCT_PageContainer>
    )
  }

  if (error || !product) {
    return (
      <VCT_PageContainer size="wide" animated>
        <div className="rounded-[32px] border border-red-500/30 bg-red-500/10 px-6 py-8 text-sm font-semibold text-red-600">
          {error?.message ?? 'Khong tim thay san pham'}
        </div>
      </VCT_PageContainer>
    )
  }

  const accent = categoryAccentMap[product.category]

  return (
    <VCT_PageContainer size="wide" animated>
      <VCT_Toast
        isVisible={toast.visible}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((current) => ({ ...current, visible: false }))}
      />

      <div
        className="overflow-hidden rounded-[34px] border border-vct-border bg-vct-elevated shadow-(--vct-shadow-sm)"
        style={{
          background: `linear-gradient(135deg, ${accent}12 0%, transparent 36%), var(--vct-bg-elevated)`,
        }}
      >
        <div className="grid gap-0 desktop:grid-cols-[1.15fr_0.85fr]">
          <div className="border-b border-vct-border p-6 desktop:border-b-0 desktop:border-r desktop:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <VCT_Badge
                text={marketplaceCategoryLabels[product.category]}
                type="info"
                pulse={false}
              />
              <VCT_Badge
                text={marketplaceConditionLabels[product.condition]}
                type="warning"
                pulse={false}
              />
              <VCT_Badge
                text={marketplaceStatusLabels[product.status]}
                type={marketplaceStatusTone(product.status)}
                pulse={false}
              />
            </div>

            <h1 className="mt-5 text-[34px] font-black leading-[1.05] text-vct-text">
              {product.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-vct-text-secondary">
              {product.description}
            </p>

            <div className="mt-6 grid gap-3 tablet:grid-cols-3">
              {[
                {
                  label: 'Seller',
                  value: product.seller_name,
                  icon: <VCT_Icons.UserCheck size={16} />,
                },
                {
                  label: 'Khu vuc giao',
                  value: product.location || 'Toan quoc',
                  icon: <VCT_Icons.MapPin size={16} />,
                },
                {
                  label: 'Lead time',
                  value: `${product.shipping.lead_time_days} ngay`,
                  icon: <VCT_Icons.Clock size={16} />,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-[24px] border border-vct-border bg-vct-bg px-4 py-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted">
                    {item.icon}
                    {item.label}
                  </div>
                  <div className="mt-2 text-sm font-bold text-vct-text">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted">
                Cau hinh chi tiet
              </div>
              <div className="mt-3 grid gap-3 tablet:grid-cols-2">
                {product.specs.map((spec) => (
                  <div key={`${spec.label}-${spec.value}`} className="rounded-[22px] border border-vct-border bg-vct-bg px-4 py-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted">
                      {spec.label}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-vct-text">{spec.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-vct-border px-3 py-1.5 text-xs font-semibold text-vct-text-secondary"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="p-6 desktop:p-8">
            <div className="rounded-[28px] border border-vct-border bg-vct-bg p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted">
                Gia niem yet
              </div>
              <div className="mt-3 text-[34px] font-black leading-none text-vct-text">
                {formatCurrencyVND(product.price_vnd)}
              </div>
              {product.compare_at_price_vnd > product.price_vnd ? (
                <div className="mt-2 text-sm text-vct-text-muted line-through">
                  {formatCurrencyVND(product.compare_at_price_vnd)}
                </div>
              ) : null}

              <div className="mt-5 grid gap-3">
                {[
                  {
                    label: 'Ton kho hien tai',
                    value: `${product.stock_quantity} san pham`,
                  },
                  {
                    label: 'Muc dat toi thieu',
                    value: `${product.minimum_order_quantity} san pham`,
                  },
                  {
                    label: 'Phi giao du kien',
                    value: formatCurrencyVND(product.shipping.shipping_fee_vnd),
                  },
                  {
                    label: 'Pham vi giao',
                    value: product.shipping.delivery_zones.join(', ') || 'Toan quoc',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-vct-border px-4 py-3">
                    <span className="text-sm text-vct-text-secondary">{item.label}</span>
                    <span className="text-sm font-bold text-vct-text">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <VCT_Button
                  className="justify-center"
                  icon={<VCT_Icons.ShoppingBag size={16} />}
                  onClick={openOrderModal}
                  disabled={product.stock_quantity <= 0}
                >
                  Dat mua ngay
                </VCT_Button>
                <a href="/admin/marketplace">
                  <VCT_Button
                    variant="secondary"
                    className="w-full justify-center"
                    icon={<VCT_Icons.ChevronRight size={16} />}
                  >
                    Mo seller workspace
                  </VCT_Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 ? (
        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-vct-text">San pham cung danh muc</h2>
              <p className="mt-1 text-sm text-vct-text-secondary">
                Goi y them mat hang de bo sung cho vo duong va clb cua ban.
              </p>
            </div>
            <a href="/marketplace">
              <VCT_Button variant="secondary" icon={<VCT_Icons.ChevronRight size={16} />}>
                Ve catalog
              </VCT_Button>
            </a>
          </div>
          <div className="grid gap-5 tablet:grid-cols-2 desktop:grid-cols-3">
            {relatedProducts.map((item) => (
              <MarketplaceProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <VCT_Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tao don mua nhanh"
        width={720}
        footer={
          <>
            <VCT_Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Dong
            </VCT_Button>
            <VCT_Button onClick={submitOrder} loading={isSubmitting}>
              Gui don hang
            </VCT_Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="rounded-2xl border border-vct-border bg-vct-bg px-4 py-4">
            <div className="text-sm font-bold text-vct-text">{product.title}</div>
            <div className="mt-1 text-sm text-vct-text-secondary">
              {formatCurrencyVND(product.price_vnd)} / san pham
            </div>
          </div>

          <div className="grid gap-4 tablet:grid-cols-2">
            <VCT_Input
              value={form.buyer_name}
              onChange={(event) =>
                setForm((current) => ({ ...current, buyer_name: event.target.value }))
              }
              placeholder="Ten nguoi mua"
            />
            <VCT_Input
              value={form.buyer_phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, buyer_phone: event.target.value }))
              }
              placeholder="So dien thoai"
            />
            <VCT_Input
              value={form.buyer_email}
              onChange={(event) =>
                setForm((current) => ({ ...current, buyer_email: event.target.value }))
              }
              placeholder="Email"
            />
            <VCT_NumberInput
              value={form.quantity}
              min={product.minimum_order_quantity}
              max={product.stock_quantity}
              onChange={(value) =>
                setForm((current) => ({ ...current, quantity: value }))
              }
              label="So luong"
            />
          </div>

          <VCT_Input
            value={form.buyer_address}
            onChange={(event) =>
              setForm((current) => ({ ...current, buyer_address: event.target.value }))
            }
            placeholder="Dia chi giao hang"
          />

          <VCT_Textarea
            value={form.notes}
            onChange={(value) =>
              setForm((current) => ({ ...current, notes: value }))
            }
            rows={4}
            placeholder="Ghi chu cho seller..."
          />

          <div className="rounded-2xl border border-vct-border bg-vct-bg px-4 py-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-vct-text-secondary">Tam tinh san pham</span>
              <span className="font-bold text-vct-text">
                {formatCurrencyVND((form.quantity || 0) * product.price_vnd)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-vct-text-secondary">Phi giao du kien</span>
              <span className="font-bold text-vct-text">
                {formatCurrencyVND(product.shipping.shipping_fee_vnd)}
              </span>
            </div>
            <div className="mt-3 border-t border-vct-border pt-3 flex items-center justify-between gap-3">
              <span className="text-vct-text-secondary">Tong du kien</span>
              <span className="text-base font-black text-vct-text">
                {formatCurrencyVND(
                  (form.quantity || 0) * product.price_vnd + product.shipping.shipping_fee_vnd
                )}
              </span>
            </div>
          </div>
        </div>
      </VCT_Modal>
    </VCT_PageContainer>
  )
}
