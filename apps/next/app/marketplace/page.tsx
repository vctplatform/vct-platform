'use client'
import { redirect } from 'next/navigation'

// Marketplace đã bị loại bỏ khỏi hệ thống (không thuộc core business)
// Redirect về trang cộng đồng thay thế
export default function MarketplacePage() {
    redirect('/community')
}
