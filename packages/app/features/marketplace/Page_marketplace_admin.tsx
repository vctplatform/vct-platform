'use client'

import * as React from 'react'
import type {
  MarketplaceOrder,
  MarketplaceProduct,
  MarketplaceUpsertProductInput,
} from '@vct/shared-types'

import {
  VCT_Badge,
  VCT_Button,
  VCT_Input,
  VCT_Modal,
  VCT_NumberInput,
  VCT_Select,
  VCT_Tabs,
  VCT_Textarea,
  VCT_Toast,
} from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { useAuth } from '../auth/AuthProvider'
import { apiClient } from '../data/api-client'
import { AdminGuard } from '../admin/components/AdminGuard'
import { AdminPageShell } from '../admin/components/AdminPageShell'
import {
  useCreateMarketplaceProduct,
  useMarketplaceSellerDashboard,
  useMarketplaceSellerOrders,
  useMarketplaceSellerProducts,
} from '../hooks/useMarketplaceAPI'
import {
  formatCurrencyVND,
  marketplaceCategoryLabels,
  marketplaceOrderStatusLabels,
  marketplacePaymentStatusLabels,
  marketplaceStatusLabels,
  marketplaceStatusTone,
} from './marketplace-ui'

const blankProduct: MarketplaceUpsertProductInput = {
  title: '',
  short_description: '',
  description: '',
  category: 'dung_cu',
  condition: 'new',
  martial_art: 'Vo Co Truyen',
  price_vnd: 500000,
  compare_at_price_vnd: 0,
  stock_quantity: 1,
  minimum_order_quantity: 1,
  location: '',
  featured: false,
  tags: [],
  specs: [
    { label: 'Chat lieu', value: '' },
    { label: 'Kich thuoc', value: '' },
  ],
  shipping: {
    lead_time_days: 3,
    delivery_zones: ['Toan quoc'],
    shipping_fee_vnd: 35000,
    pickup_available: false,
  },
}

export const Page_marketplace_admin = () => (
  <AdminGuard
    requiredRoles={[
      'admin',
      'federation_president',
      'federation_secretary',
      'provincial_admin',
      'club_leader',
      'club_vice_leader',
      'club_secretary',
      'club_accountant',
      'coach',
    ]}
  >
    <Page_marketplace_admin_content />
  </AdminGuard>
)

const Page_marketplace_admin_content = () => {
  const { token, currentUser } = useAuth()
  const { data: dashboard, refetch: refetchDashboard } = useMarketplaceSellerDashboard()
  const { data: productsData, refetch: refetchProducts, isLoading: productsLoading } = useMarketplaceSellerProducts()
  const { data: ordersData, refetch: refetchOrders, isLoading: ordersLoading } = useMarketplaceSellerOrders()
  const { mutate: createProduct, isLoading: creatingProduct } = useCreateMarketplaceProduct()

  const [activeTab, setActiveTab] = React.useState('inventory')
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [form, setForm] = React.useState<MarketplaceUpsertProductInput>(blankProduct)
  const [toast, setToast] = React.useState<{
    visible: boolean
    type: 'success' | 'warning' | 'error' | 'info'
    message: string
  }>({ visible: false, type: 'success', message: '' })

  const products = productsData?.items ?? []
  const orders = ordersData?.items ?? []

  const stats = dashboard
    ? [
        {
          label: 'San pham dang ban',
          value: dashboard.summary.active_products,
          icon: <VCT_Icons.ShoppingBag size={18} />,
          color: 'var(--vct-accent-cyan)',
        },
        {
          label: 'Don can xu ly',
          value: dashboard.summary.pending_orders,
          icon: <VCT_Icons.ClipboardList size={18} />,
          color: 'var(--vct-warning)',
        },
        {
          label: 'Don hoan tat',
          value: dashboard.summary.completed_orders,
          icon: <VCT_Icons.CheckCircle size={18} />,
          color: 'var(--vct-success)',
        },
        {
          label: 'Doanh thu gross',
          value: formatCurrencyVND(dashboard.summary.gross_revenue_vnd),
          icon: <VCT_Icons.DollarSign size={18} />,
          color: 'var(--vct-gold)',
        },
      ]
    : []

  const handleCreateProduct = async () => {
    try {
      const payload: MarketplaceUpsertProductInput = {
        ...form,
        tags: (form.tags ?? []).filter(Boolean),
        specs: (form.specs ?? []).filter((spec) => spec.label && spec.value),
      }
      await createProduct(payload)
      setIsModalOpen(false)
      setForm(blankProduct)
      setToast({
        visible: true,
        type: 'success',
        message: 'Da dang san pham moi vao VCT Marketplace',
      })
      await Promise.all([refetchProducts(), refetchDashboard()])
    } catch (error) {
      setToast({
        visible: true,
        type: 'error',
        message: error instanceof Error ? error.message : 'Khong the tao san pham',
      })
    }
  }

  const updateOrder = async (
    order: MarketplaceOrder,
    patch: Partial<Pick<MarketplaceOrder, 'status' | 'payment_status' | 'notes'>>
  ) => {
    try {
      await apiClient.patch<MarketplaceOrder>(
        `/api/v1/marketplace/seller/orders/${order.id}`,
        patch,
        token ?? undefined
      )
      setToast({
        visible: true,
        type: 'success',
        message: `Da cap nhat don ${order.order_code}`,
      })
      await Promise.all([refetchOrders(), refetchDashboard()])
    } catch (error) {
      setToast({
        visible: true,
        type: 'error',
        message: error instanceof Error ? error.message : 'Khong the cap nhat don',
      })
    }
  }

  return (
    <>
      <VCT_Toast
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((current) => ({ ...current, visible: false }))}
      />
      <AdminPageShell
        title="VCT Marketplace"
        subtitle="Workspace quan tri cho seller, CLB va admin van hanh module thuong mai dien tu."
        icon={<VCT_Icons.ShoppingBag size={28} className="text-(--vct-warning)" />}
        stats={stats}
        actions={
          <div className="flex flex-wrap gap-3">
            <a href="/marketplace">
              <VCT_Button variant="secondary" icon={<VCT_Icons.ChevronRight size={16} />}>
                Xem catalog cong khai
              </VCT_Button>
            </a>
            <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => setIsModalOpen(true)}>
              Dang san pham
            </VCT_Button>
          </div>
        }
      >
      <div className="mb-6 rounded-[28px] border border-vct-border bg-vct-elevated p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted">
              Workspace
            </div>
            <div className="mt-1 text-lg font-black text-vct-text">
              {currentUser?.name || currentUser?.username || 'Seller'}
            </div>
          </div>
          <VCT_Badge text="VCT Marketplace seller mode" type="info" pulse={false} />
        </div>
      </div>

      <VCT_Tabs
        className="mb-6"
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'inventory', label: 'Ton kho', count: products.length, icon: <VCT_Icons.ShoppingBag size={16} /> },
          { key: 'orders', label: 'Don hang', count: orders.length, icon: <VCT_Icons.ClipboardList size={16} /> },
          { key: 'signals', label: 'Tin hieu', icon: <VCT_Icons.AlertTriangle size={16} /> },
        ]}
      />

      {activeTab === 'inventory' ? (
        <section className="grid gap-4">
          {(productsLoading ? [] : products).map((product) => (
            <InventoryRow key={product.id} product={product} />
          ))}
          {!productsLoading && products.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-vct-border bg-vct-bg px-6 py-10 text-center text-sm text-vct-text-secondary">
              Chua co san pham nao. Tao listing dau tien de kich hoat VCT Marketplace.
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === 'orders' ? (
        <section className="grid gap-4">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} onUpdate={updateOrder} />
          ))}
          {!ordersLoading && orders.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-vct-border bg-vct-bg px-6 py-10 text-center text-sm text-vct-text-secondary">
              Chua co don hang nao. Don moi tu catalog cong khai se hien thi tai day.
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === 'signals' && dashboard ? (
        <section className="grid gap-5 desktop:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] border border-vct-border bg-vct-elevated p-5">
            <h2 className="text-lg font-black text-vct-text">Canh bao ton kho</h2>
            <div className="mt-4 grid gap-3">
              {dashboard.low_stock_products.map((product) => (
                <div key={product.id} className="rounded-2xl border border-vct-border bg-vct-bg px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-vct-text">{product.title}</div>
                      <div className="mt-1 text-sm text-vct-text-secondary">
                        Con {product.stock_quantity} san pham
                      </div>
                    </div>
                    <VCT_Badge text={marketplaceStatusLabels[product.status]} type={marketplaceStatusTone(product.status)} pulse={false} />
                  </div>
                </div>
              ))}
              {dashboard.low_stock_products.length === 0 ? (
                <div className="rounded-2xl border border-vct-border bg-vct-bg px-4 py-4 text-sm text-vct-text-secondary">
                  Chua co canh bao ton kho.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[30px] border border-vct-border bg-vct-elevated p-5">
            <h2 className="text-lg font-black text-vct-text">Don gan day</h2>
            <div className="mt-4 grid gap-3">
              {dashboard.recent_orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-vct-border bg-vct-bg px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-vct-text">{order.order_code}</div>
                      <div className="mt-1 text-sm text-vct-text-secondary">{order.buyer_name}</div>
                    </div>
                    <div className="text-right">
                      <VCT_Badge text={marketplaceOrderStatusLabels[order.status]} type={marketplaceStatusTone(order.status)} pulse={false} />
                      <div className="mt-2 text-sm font-black text-vct-text">
                        {formatCurrencyVND(order.total_vnd)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <VCT_Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dang san pham moi"
        width={860}
        footer={
          <>
            <VCT_Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Dong
            </VCT_Button>
            <VCT_Button onClick={handleCreateProduct} loading={creatingProduct}>
              Tao listing
            </VCT_Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 tablet:grid-cols-2">
            <VCT_Input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Ten san pham"
            />
            <VCT_Input
              value={form.short_description}
              onChange={(event) =>
                setForm((current) => ({ ...current, short_description: event.target.value }))
              }
              placeholder="Mo ta ngan"
            />
            <VCT_Select
              value={form.category}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  category: value as MarketplaceUpsertProductInput['category'],
                }))
              }
              options={Object.entries(marketplaceCategoryLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <VCT_Select
              value={form.condition}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  condition: value as MarketplaceUpsertProductInput['condition'],
                }))
              }
              options={[
                { value: 'new', label: 'Moi' },
                { value: 'like_new', label: 'Nhu moi' },
                { value: 'used', label: 'Da qua su dung' },
                { value: 'collector', label: 'Suu tam' },
              ]}
            />
            <VCT_NumberInput
              value={form.price_vnd}
              min={1000}
              step={50000}
              label="Gia ban"
              onChange={(value) => setForm((current) => ({ ...current, price_vnd: value }))}
            />
            <VCT_NumberInput
              value={form.stock_quantity}
              min={0}
              label="Ton kho"
              onChange={(value) => setForm((current) => ({ ...current, stock_quantity: value }))}
            />
            <VCT_Input
              value={form.location}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              placeholder="Khu vuc giao hang"
            />
            <VCT_Input
              value={form.martial_art}
              onChange={(event) => setForm((current) => ({ ...current, martial_art: event.target.value }))}
              placeholder="Dong mon / muc dich"
            />
          </div>

          <VCT_Textarea
            rows={5}
            value={form.description}
            onChange={(value) => setForm((current) => ({ ...current, description: value }))}
            placeholder="Mo ta day du cho san pham..."
          />

          <div className="grid gap-4 tablet:grid-cols-2">
            {form.specs?.map((spec, index) => (
              <div key={`${spec.label}-${index}`} className="grid gap-3 rounded-2xl border border-vct-border bg-vct-bg p-4">
                <VCT_Input
                  value={spec.label}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      specs: (current.specs ?? []).map((item, itemIndex) =>
                        itemIndex === index ? { ...item, label: event.target.value } : item
                      ),
                    }))
                  }
                  placeholder="Nhan thuoc tinh"
                />
                <VCT_Input
                  value={spec.value}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      specs: (current.specs ?? []).map((item, itemIndex) =>
                        itemIndex === index ? { ...item, value: event.target.value } : item
                      ),
                    }))
                  }
                  placeholder="Gia tri"
                />
              </div>
            ))}
          </div>
        </div>
      </VCT_Modal>
      </AdminPageShell>
    </>
  )
}

const InventoryRow = ({ product }: { product: MarketplaceProduct }) => (
  <div className="rounded-[28px] border border-vct-border bg-vct-elevated p-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <VCT_Badge text={marketplaceCategoryLabels[product.category]} type="info" pulse={false} />
          <VCT_Badge text={marketplaceStatusLabels[product.status]} type={marketplaceStatusTone(product.status)} pulse={false} />
        </div>
        <h3 className="mt-3 text-xl font-black text-vct-text">{product.title}</h3>
        <p className="mt-2 text-sm leading-6 text-vct-text-secondary">{product.short_description}</p>
      </div>
      <div className="grid min-w-[220px] gap-3 rounded-[24px] border border-vct-border bg-vct-bg p-4">
        <div className="text-right">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted">
            Gia ban
          </div>
          <div className="mt-1 text-lg font-black text-vct-text">{formatCurrencyVND(product.price_vnd)}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted">
              Ton
            </div>
            <div className="mt-1 font-bold text-vct-text">{product.stock_quantity}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted">
              Seller
            </div>
            <div className="mt-1 font-bold text-vct-text">{product.seller_name}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const OrderRow = ({
  order,
  onUpdate,
}: {
  order: MarketplaceOrder
  onUpdate: (
    order: MarketplaceOrder,
    patch: Partial<Pick<MarketplaceOrder, 'status' | 'payment_status' | 'notes'>>
  ) => Promise<void>
}) => {
  const nextAction =
    order.status === 'pending'
      ? { label: 'Xac nhan', patch: { status: 'confirmed' as const } }
      : order.status === 'confirmed'
        ? { label: 'Dong goi', patch: { status: 'preparing' as const } }
        : order.status === 'preparing'
          ? { label: 'Ban giao VC', patch: { status: 'shipping' as const, payment_status: 'deposit_paid' as const } }
          : order.status === 'shipping'
            ? { label: 'Hoan tat', patch: { status: 'completed' as const, payment_status: 'paid' as const } }
            : null

  return (
    <div className="rounded-[28px] border border-vct-border bg-vct-elevated p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <VCT_Badge text={marketplaceOrderStatusLabels[order.status]} type={marketplaceStatusTone(order.status)} pulse={false} />
            <VCT_Badge text={marketplacePaymentStatusLabels[order.payment_status]} type={marketplaceStatusTone(order.payment_status)} pulse={false} />
          </div>
          <h3 className="mt-3 text-xl font-black text-vct-text">{order.order_code}</h3>
          <p className="mt-2 text-sm leading-6 text-vct-text-secondary">
            {order.buyer_name} · {order.buyer_phone}
          </p>
          <div className="mt-3 grid gap-2">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-vct-border bg-vct-bg px-4 py-3 text-sm text-vct-text-secondary">
                {item.product_title} · {item.quantity} x {formatCurrencyVND(item.unit_price_vnd)}
              </div>
            ))}
          </div>
        </div>
        <div className="grid min-w-[240px] gap-3 rounded-[24px] border border-vct-border bg-vct-bg p-4">
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-vct-text-muted">
              Tong gia tri
            </div>
            <div className="mt-1 text-lg font-black text-vct-text">{formatCurrencyVND(order.total_vnd)}</div>
          </div>
          <div className="grid gap-2">
            {nextAction ? (
              <VCT_Button
                className="justify-center"
                onClick={() => onUpdate(order, nextAction.patch)}
              >
                {nextAction.label}
              </VCT_Button>
            ) : null}
            {order.status !== 'cancelled' && order.status !== 'completed' ? (
              <VCT_Button
                variant="secondary"
                className="justify-center"
                onClick={() => onUpdate(order, { status: 'cancelled' })}
              >
                Huy don
              </VCT_Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
