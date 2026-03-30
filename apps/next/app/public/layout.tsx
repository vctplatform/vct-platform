import * as React from 'react'
import Link from 'next/link'
import { VCT_Icons } from '@vct/ui'
import { UI_Logo } from '@vct/ui'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-(--vct-bg-base) text-slate-200 flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-(--vct-bg-glass-heavy)/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-xl">
        <Link href="/" className="flex items-center gap-3">
          <UI_Logo size={32} />
          <span className="font-black text-lg tracking-tight text-white">VCT PORTAL</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/public/provinces" className="text-sm font-semibold text-slate-400 hover:text-white transition">Tỉnh/Đơn vị</Link>
          <Link href="/public/clubs" className="text-sm font-semibold text-slate-400 hover:text-white transition">CLB/Võ đường</Link>
          <Link href="/#contact" className="text-sm font-semibold text-slate-400 hover:text-white transition">Liên hệ</Link>
          <Link href="/login" className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 transition">
            Đăng nhập
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto p-6 lg:p-12 relative">
        <div className="absolute top-0 inset-x-0 h-64 bg-linear-to-b from-emerald-500/5 to-transparent -z-10 pointer-events-none" />
        {children}
      </main>
    </div>
  )
}
