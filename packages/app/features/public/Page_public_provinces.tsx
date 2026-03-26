'use client'
import * as React from 'react'
import { useState, useEffect } from 'react'
import { VCT_Icons } from '@vct/ui'

// Mock Data
const MOCK_PROVINCES = [
  { id: '1', name: 'Hành chính Hà Nội', president: 'Nguyễn Văn A', clubs: 45, members: 3200 },
  { id: '2', name: 'TP. Hồ Chí Minh', president: 'Trần Thị B', clubs: 68, members: 5400 },
  { id: '3', name: 'Đà Nẵng', president: 'Lê Văn C', clubs: 22, members: 1500 },
  { id: '4', name: 'Hải Phòng', president: 'Phạm Văn D', clubs: 18, members: 1200 },
  { id: '5', name: 'Cần Thơ', president: 'Võ Thị E', clubs: 15, members: 850 },
  { id: '6', name: 'Quảng Ninh', president: 'Đinh Văn F', clubs: 12, members: 600 },
]

export const Page_public_provinces = () => {
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Simulate network delay for skeleton
    const t = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(t)
  }, [])

  const filtered = MOCK_PROVINCES.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.president.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="w-full animation-fade-in relative z-10">
      {/* Header */}
      <div className="mb-8 pl-1">
        <h1 className="text-4xl font-black mb-4 tracking-tight drop-shadow-sm">Thành Viên Liên Đoàn</h1>
        <p className="text-slate-400 max-w-2xl leading-relaxed text-sm md:text-base">
          Danh sách các Liên đoàn/Hội Võ Cổ Truyền tỉnh, thành, ngành trực thuộc Liên Đoàn Võ Cổ Truyền Việt Nam.
        </p>
      </div>

      {/* Search */}
      <div className="mb-10 max-w-md relative">
        <VCT_Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder="Tìm kiếm theo Tỉnh/Thành hoặc Chức sắc..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-(--vct-bg-elevated) border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-500 shadow-xl shadow-black/10"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Skeleton loading state
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-(--vct-bg-elevated) border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/10 to-transparent w-[200%] animate-[shimmer_2s_infinite]" />
              <div className="h-5 bg-slate-800 rounded-md w-3/4 mb-5" />
              <div className="space-y-4">
                <div className="h-4 bg-slate-800/60 rounded-md w-1/2" />
                <div className="h-4 bg-slate-800/60 rounded-md w-1/3" />
              </div>
              <div className="mt-8 pt-5 border-t border-slate-800/50 flex justify-between">
                <div className="h-4 bg-slate-800/60 rounded-md w-1/4" />
                <div className="h-4 bg-slate-800/60 rounded-md w-1/4" />
              </div>
            </div>
          ))
        ) : (
          filtered.map(province => (
            <div key={province.id} className="group bg-(--vct-bg-elevated) hover:bg-[#1a253a] border border-slate-800 hover:border-cyan-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10 cursor-pointer overflow-hidden relative">
              
              {/* Card Glow */}
              <div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black tracking-wider uppercase mb-3">
                    <VCT_Icons.MapPin size={10} /> Đơn vị trực thuộc
                  </div>
                  <h3 className="text-xl font-bold leading-tight group-hover:text-cyan-400 transition-colors">{province.name}</h3>
                </div>
              </div>

              <div className="space-y-3 mt-5 pb-4">
                <div className="flex items-center gap-2.5 text-sm text-slate-400">
                  <VCT_Icons.UserCheck size={15} className="text-slate-500" />
                  <span>Cán bộ: <span className="font-semibold text-slate-300">{province.president}</span></span>
                </div>
              </div>

              <div className="mt-2 pt-5 border-t border-slate-800 group-hover:border-slate-700/50 grid grid-cols-2 gap-4 text-sm transition-colors">
                <div>
                  <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Câu Lạc Bộ</div>
                  <div className="font-black text-slate-200">{province.clubs}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Môn Sinh</div>
                  <div className="font-black text-slate-200">{province.members.toLocaleString('vi-VN')}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="py-20 text-center text-slate-500">
          <VCT_Icons.Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">Không tìm thấy Đơn vị nào phù hợp với "{search}"</p>
        </div>
      )}

      {/* Shimmer CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  )
}
