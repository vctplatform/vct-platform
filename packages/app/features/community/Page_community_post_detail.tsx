'use client'
import React, { useState } from 'react'
import { VCT_Icons } from '@vct/ui'

interface Post {
    id: string; author: string; avatar: string; role: string; time: string
    content: string; likes: number; comments: number; images?: string[]; pinned?: boolean
}

const MOCK_POSTS: Post[] = [
    { id: 'p1', author: 'Võ sư Trần Minh Tuấn', avatar: '🥋', role: 'HLV Quốc gia', time: '2 giờ trước', content: 'Chúc mừng đội tuyển đã giành 12 HCV tại giải VĐQG 2026! Kết quả xứng đáng cho 6 tháng tập luyện.', likes: 234, comments: 45, pinned: true },
    { id: 'p2', author: 'CLB Sơn Long TP.HCM', avatar: '🏛️', role: 'Quản lý CLB', time: '5 giờ trước', content: 'Thông báo: Lịch tập Tết Nguyên Đán 2026 - CLB nghỉ từ 28 Tết đến mùng 5. Mùng 6 khai xuân. Chúc mọi người năm mới sức khỏe, võ nghệ tinh tiến!', likes: 89, comments: 12 },
    { id: 'p3', author: 'Nguyễn Hoàng Nam', avatar: '⚔️', role: 'VĐV', time: '1 ngày trước', content: 'Chia sẻ video bài Lão Mai Quyền mà em mới hoàn thiện. Mọi người góp ý giúp em nhé!', likes: 156, comments: 28 },
    { id: 'p4', author: 'Liên đoàn VCT', avatar: '🏆', role: 'Liên đoàn', time: '2 ngày trước', content: 'Thông báo chính thức: Giải Vô địch Quốc gia 2026 sẽ tổ chức tại Bình Định, từ 15-20/06. Hạn đăng ký: 01/05/2026.', likes: 567, comments: 89, pinned: true },
]

export function Page_community_post_detail() {
    const [newComment, setNewComment] = useState('')
    const post = MOCK_POSTS[0]!

    return (
        <div className="grid gap-6 max-w-3xl mx-auto">
            <a href="/community" className="flex items-center gap-1 text-sm text-vct-text-muted hover:text-vct-accent transition">
                <VCT_Icons.ArrowUpRight size={14} className="rotate-[225deg]" /> Quay lại Cộng đồng
            </a>

            {/* Main Post */}
            <div className="rounded-xl border border-vct-border bg-vct-elevated p-6">
                <div className="flex items-start gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-vct-input flex items-center justify-center text-2xl">{post.avatar}</div>
                    <div>
                        <div className="font-bold">{post.author}</div>
                        <div className="flex items-center gap-2 text-xs text-vct-text-muted">
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 font-bold">{post.role}</span>
                            <span>{post.time}</span>
                        </div>
                    </div>
                    {post.pinned && <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 text-xs font-bold">📌 Ghim</span>}
                </div>
                <p className="text-sm leading-7 mb-4">{post.content}</p>
                <div className="flex items-center gap-4 pt-4 border-t border-vct-border text-sm">
                    <button className="flex items-center gap-1 text-vct-text-muted hover:text-red-500 transition font-bold">❤️ {post.likes}</button>
                    <button className="flex items-center gap-1 text-vct-text-muted hover:text-blue-500 transition font-bold">💬 {post.comments}</button>
                    <button className="flex items-center gap-1 text-vct-text-muted hover:text-emerald-500 transition font-bold">🔗 Chia sẻ</button>
                </div>
            </div>

            {/* Comment Input */}
            <div className="flex gap-3 items-start">
                <div className="h-10 w-10 rounded-full bg-vct-accent/15 flex items-center justify-center text-lg shrink-0">👤</div>
                <div className="flex-1">
                    <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Viết bình luận..."
                        className="w-full rounded-xl border border-vct-border bg-vct-elevated p-3 text-sm outline-none focus:border-vct-accent resize-none" rows={3} />
                    <div className="flex justify-end mt-2">
                        <button className="rounded-lg bg-vct-accent px-4 py-2 text-xs font-bold text-white hover:brightness-110 transition">Gửi bình luận</button>
                    </div>
                </div>
            </div>

            {/* Comments */}
            <div className="grid gap-4">
                <h3 className="text-sm font-bold text-vct-text-muted">{post.comments} bình luận</h3>
                {[
                    { author: 'Lê Thị Hương', avatar: '👩', content: 'Tuyệt vời! Xin chúc mừng thầy và các em VĐV.', time: '1 giờ', likes: 12 },
                    { author: 'Phạm Đức Long', avatar: '👨', content: 'Kết quả xứng đáng. Hy vọng giải SEA Games sắp tới cũng thành công.', time: '45 phút', likes: 8 },
                    { author: 'Ngô Thanh Hải', avatar: '🧑', content: 'Em cũng muốn tham gia lớp nâng cao của thầy. Năm sau đăng ký được không ạ?', time: '30 phút', likes: 3 },
                ].map((c, i) => (
                    <div key={i} className="flex gap-3 items-start rounded-xl border border-vct-border bg-vct-elevated/50 p-4">
                        <div className="h-8 w-8 rounded-full bg-vct-input flex items-center justify-center text-lg shrink-0">{c.avatar}</div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold">{c.author}</span>
                                <span className="text-xs text-vct-text-muted">{c.time}</span>
                            </div>
                            <p className="text-sm text-vct-text-muted leading-6">{c.content}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-vct-text-muted">
                                <button className="hover:text-red-500 transition font-bold">❤️ {c.likes}</button>
                                <button className="hover:text-blue-500 transition font-bold">Trả lời</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
