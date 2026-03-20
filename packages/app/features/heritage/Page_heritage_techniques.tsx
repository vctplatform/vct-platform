'use client'
import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Icons } from '../components/vct-icons'

interface Technique {
    id: string; name: string; category: 'quyen' | 'doi_khang' | 'vu_khi' | 'tu_ve'
    level: string; origin: string; description: string; steps: string[]; videoUrl?: string
    tags: string[]
}

const TECHNIQUES: Technique[] = [
    { id: 't1', name: 'Lão Mai Quyền', category: 'quyen', level: 'Trung cấp', origin: 'Bình Định', description: 'Bài quyền mô phỏng cây mai già, kết hợp cương nhu, thân pháp uyển chuyển.', steps: ['Khai quyền: Lão mai tọa', 'Liên hoàn 3 chiêu tay', 'Tấn pháp: Đinh tấn → Trảo mã tấn', 'Đá vòng cầu + xoay người', 'Kết quyền: Mai hoa lạc'], tags: ['Quyền thuật', 'Bình Định'] },
    { id: 't2', name: 'Hùng Kê Quyền', category: 'quyen', level: 'Nâng cao', origin: 'Bình Định', description: 'Bài quyền mô phỏng gà trống, nhanh mạnh, nhiều đòn chân.', steps: ['Thế gà xù lông', 'Liên hoàn mỏ gà', 'Đạp song phi', 'Cánh gà quạt gió', 'Gà vỗ cánh bay'], tags: ['Quyền thuật', 'Đặc trưng'] },
    { id: 't3', name: 'Đấm thẳng - Cross', category: 'doi_khang', level: 'Cơ bản', origin: 'Chung', description: 'Đòn đấm cơ bản với tay thuận, xoay hông tạo lực.', steps: ['Tư thế chuẩn bị', 'Xoay hông + vai', 'Duỗi thẳng tay thuận', 'Xoay nắm đấm', 'Thu về tư thế phòng thủ'], tags: ['Đối kháng', 'Cơ bản'] },
    { id: 't4', name: 'Côn Nhị Khúc', category: 'vu_khi', level: 'Nâng cao', origin: 'Okinawa/Việt hóa', description: 'Kỹ thuật sử dụng côn nhị khúc trong quyền thuật biểu diễn.', steps: ['Cầm côn cơ bản', 'Xoay côn ngang', 'Xoay côn dọc', 'Chuyển tay sau lưng', 'Liên hoàn tấn công'], tags: ['Vũ khí', 'Biểu diễn'] },
    { id: 't5', name: 'Tự vệ chống dao', category: 'tu_ve', level: 'Trung cấp', origin: 'Chung', description: 'Kỹ thuật phòng thủ và tước vũ khí khi bị tấn công bằng dao.', steps: ['Đánh giá tình huống', 'Di chuyển tránh đường dao', 'Bắt tay cầm dao', 'Khóa khớp khuỷu tay', 'Tước dao + khống chế'], tags: ['Tự vệ', 'Thực chiến'] },
]

const CAT_MAP: Record<string, { label: string; color: string; icon: string }> = {
    quyen: { label: 'Quyền thuật', color: '#8b5cf6', icon: '🥋' },
    doi_khang: { label: 'Đối kháng', color: '#ef4444', icon: '⚔️' },
    vu_khi: { label: 'Vũ khí', color: '#f59e0b', icon: '🗡️' },
    tu_ve: { label: 'Tự vệ', color: '#10b981', icon: '🛡️' },
}

export function Page_heritage_techniques() {
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState<Technique | null>(null)

    const filtered = useMemo(() => {
        let list = TECHNIQUES
        if (filter !== 'all') list = list.filter(t => t.category === filter)
        if (search) { const q = search.toLowerCase(); list = list.filter(t => t.name.toLowerCase().includes(q)) }
        return list
    }, [filter, search])

    return (
        <div className="grid gap-6">
            <div>
                <h1 className="m-0 text-2xl font-black">Bách Khoa Kỹ Thuật</h1>
                <p className="mt-1 text-sm text-vct-text-muted">Tuyển tập kỹ thuật võ cổ truyền Việt Nam</p>
            </div>

            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
                {Object.entries(CAT_MAP).map(([k, v]) => (
                    <button key={k} onClick={() => setFilter(filter === k ? 'all' : k)}
                        className={`rounded-xl border p-3 transition text-left ${filter === k ? 'border-vct-accent bg-vct-accent/5' : 'border-vct-border bg-vct-elevated hover:bg-vct-input'}`}>
                        <div className="text-xl mb-1">{v.icon}</div>
                        <div className="text-sm font-bold">{v.label}</div>
                        <div className="text-xs text-vct-text-muted">{TECHNIQUES.filter(t => t.category === k).length} kỹ thuật</div>
                    </button>
                ))}
            </div>

            <div className="relative max-w-md">
                <VCT_Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vct-text-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kỹ thuật..."
                    className="w-full rounded-lg border border-vct-border bg-vct-elevated py-2 pl-9 pr-3 text-sm outline-none focus:border-vct-accent" />
            </div>

            <div className="grid tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
                {filtered.map(tech => {
                    const cat = CAT_MAP[tech.category]!
                    return (
                        <motion.div key={tech.id} layout onClick={() => setSelected(tech)}
                            className="rounded-xl border border-vct-border bg-vct-elevated overflow-hidden hover:shadow-lg hover:border-vct-accent/50 transition cursor-pointer">
                            <div className="h-32 flex items-center justify-center text-6xl" style={{ background: `linear-gradient(135deg, ${cat.color}15, ${cat.color}05)` }}>
                                {cat.icon}
                            </div>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-sm">{tech.name}</span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${cat.color}20`, color: cat.color }}>{cat.label}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-vct-text-muted mb-2">
                                    <span>📍 {tech.origin}</span><span>•</span><span>🎯 {tech.level}</span>
                                </div>
                                <p className="text-xs text-vct-text-muted line-clamp-2 leading-5">{tech.description}</p>
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {tech.tags.map(t => <span key={t} className="rounded-full bg-vct-input px-2 py-0.5 text-[10px] font-bold text-vct-text-muted">#{t}</span>)}
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selected && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z- flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                        <div className="absolute inset-0 bg-black/40" />
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()} className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-vct-bg border border-vct-border rounded-2xl p-6">
                            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-vct-text-muted hover:text-vct-text"><VCT_Icons.Close size={20} /></button>
                            <div className="text-4xl mb-3">{CAT_MAP[selected.category]!.icon}</div>
                            <h2 className="text-xl font-black m-0">{selected.name}</h2>
                            <div className="flex items-center gap-2 text-xs text-vct-text-muted mt-1 mb-4">
                                <span className="px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${CAT_MAP[selected.category]!.color}20`, color: CAT_MAP[selected.category]!.color }}>{CAT_MAP[selected.category]!.label}</span>
                                <span>📍 {selected.origin}</span><span>🎯 {selected.level}</span>
                            </div>
                            <p className="text-sm text-vct-text-muted leading-7 mb-4">{selected.description}</p>
                            <h3 className="text-sm font-bold mb-2">Các bước thực hiện:</h3>
                            <ol className="grid gap-2">
                                {selected.steps.map((s, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm">
                                        <span className="h-6 w-6 rounded-full bg-vct-accent/15 text-vct-accent flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ol>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
