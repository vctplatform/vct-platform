'use client'
import * as React from 'react'
import { useState, useEffect } from 'react'
import { VCT_Icons } from '@vct/ui'

// Mock Data
const MOCK_CLUBS = [
  { id: '1', name: 'Võ Đường Liên Minh Võ Thuật', location: 'Hà Nội', members: 156, established: 2010 },
  { id: '2', name: 'CLB Võ Cổ Truyền Quận 1', location: 'TP. Hồ Chí Minh', members: 342, established: 1998 },
  { id: '3', name: 'Võ Đường Sông Hàn', location: 'Đà Nẵng', members: 89, established: 2015 },
  { id: '4', name: 'CLB Võ Thuật Đại Cồ Việt', location: 'Hải Phòng', members: 210, established: 2005 },
  { id: '5', name: 'Đường Lang Phái Miền Nam', location: 'Cần Thơ', members: 120, established: 2012 },
  { id: '6', name: 'Hội Võ Cổ Truyền Vạn Phúc', location: 'Quảng Ninh', members: 45, established: 2021 },
]

export const Page_public_clubs = () => {
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Simulate network delay for skeleton
    const t = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(t)
  }, [])

  const filtered = MOCK_CLUBS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.location.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="w-full animation-fade-in relative z-10">
      {/* Header */}
      <div className="mb-8 pl-1">
        <h1 className="text-4xl font-black mb-4 tracking-tight drop-shadow-sm">Danh Sách Câu Lạc Bộ</h1>
        <p className="text-slate-400 max-w-2xl leading-relaxed text-sm md:text-base">
          Khám phá danh sách các Câu Lạc Bộ và Võ Đường trực thuộc Liên Đoàn. Tra cứu thông tin, địa điểm và tìm kiếm CLB phù hợp để tham gia tập luyện.
        </p>
      </div>

      {/* Search */}
      <div className="mb-10 max-w-md relative">
        <VCT_Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder="Tìm kiếm theo tên CLB hoặc Tỉnh/Thành..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-(--vct-bg-elevated) border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-500 shadow-xl shadow-black/10"
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
          filtered.map(club => (
            <div key={club.id} className="group bg-(--vct-bg-elevated) hover:bg-[#1a253a] border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 cursor-pointer overflow-hidden relative">
              
              {/* Card Glow */}
              <div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-wider uppercase mb-3">
                    <VCT_Icons.Shield size={10} /> Võ Đường
                  </div>
                  <h3 className="text-lg font-bold leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2" title={club.name}>{club.name}</h3>
                </div>
              </div>

              <div className="space-y-3 mt-5">
                <div className="flex items-center gap-2.5 text-sm text-slate-400">
                  <VCT_Icons.MapPin size={15} className="text-slate-500" />
                  <span className="font-medium">{club.location}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-400">
                  <VCT_Icons.Users size={15} className="text-slate-500" />
                  <span className="font-medium">{club.members} <span className="opacity-60 text-xs uppercase tracking-wider">Môn sinh</span></span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800 group-hover:border-slate-700/50 flex items-center justify-between text-xs transition-colors">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Thành lập {club.established}</span>
                <span className="text-emerald-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Xem chi tiết <VCT_Icons.ArrowRight size={12} /></span>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="py-20 text-center text-slate-500">
          <VCT_Icons.Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">Không tìm thấy Câu Lạc Bộ nào phù hợp với "{search}"</p>
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
