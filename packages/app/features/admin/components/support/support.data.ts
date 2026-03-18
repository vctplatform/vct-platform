/**
 * Support module — Data, Types, Constants, and Mock Data
 * Extracted from Page_admin_support.tsx to reduce file size.
 */

import type {
    SupportTicket, TicketReply, FAQ, InternalNote,
    TicketActivity, SupportCategory, CannedResponse, BadgeConfig,
} from '../../admin.types'

// ── Re-export types ──
export type {
    SupportTicket, TicketReply, FAQ, InternalNote,
    TicketActivity, SupportCategory, CannedResponse,
}

// ════════════════════════════════════════
// CONSTANTS & BADGE MAPS
// ════════════════════════════════════════

export const STATUS_BADGE: Record<string, BadgeConfig> = {
    open: { label: 'Mới mở', type: 'info' },
    in_progress: { label: 'Đang xử lý', type: 'warning' },
    waiting_customer: { label: 'Chờ KH', type: 'neutral' },
    resolved: { label: 'Đã giải quyết', type: 'success' },
    closed: { label: 'Đã đóng', type: 'neutral' },
}

export const PRIORITY_BADGE: Record<string, { label: string; type: 'neutral' | 'info' | 'warning' | 'danger' }> = {
    low: { label: '▽ Thấp', type: 'neutral' },
    medium: { label: '● Trung bình', type: 'info' },
    high: { label: '△ Cao', type: 'warning' },
    critical: { label: '⚠ Khẩn cấp', type: 'danger' },
}

export const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

export const TYPE_BADGE: Record<string, BadgeConfig> = {
    account: { label: 'Tài khoản', type: 'info' },
    technical: { label: 'Kỹ thuật', type: 'danger' },
    tournament: { label: 'Giải đấu', type: 'success' },
    payment: { label: 'Thanh toán', type: 'warning' },
    general: { label: 'Chung', type: 'neutral' },
}

export const CANNED_RESPONSES: CannedResponse[] = [
    { id: 'CR-01', label: '🔄 Reset mật khẩu', content: 'Bạn vui lòng nhấn "Quên mật khẩu" trên trang đăng nhập → Nhập email → Nhận OTP → Đặt mật khẩu mới. Nếu vẫn gặp lỗi, vui lòng cung cấp email đăng ký để chúng tôi hỗ trợ.' },
    { id: 'CR-02', label: '📋 Yêu cầu thêm info', content: 'Để xử lý yêu cầu, chúng tôi cần thêm thông tin: 1) Ảnh chụp lỗi, 2) Trình duyệt/thiết bị đang dùng, 3) Thời điểm xảy ra. Vui lòng bổ sung!' },
    { id: 'CR-03', label: '✅ Đã sửa lỗi', content: 'Lỗi đã được khắc phục. Vui lòng thử lại và xác nhận. Nếu vấn đề vẫn tiếp tục, hãy mở lại ticket này.' },
    { id: 'CR-04', label: '🕐 Đang xử lý', content: 'Chúng tôi đã tiếp nhận và đang xử lý. Dự kiến hoàn thành trong 24h. Chúng tôi sẽ cập nhật ngay khi có kết quả.' },
]

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════

export const MOCK_TICKETS: SupportTicket[] = [
    { id: 'TK-001', maTicket: 'TK-001', tieuDe: 'Không thể đăng nhập vào hệ thống', noiDung: 'Tôi đã thử đăng nhập nhiều lần nhưng hệ thống báo lỗi 401.', loai: 'account', mucUuTien: 'high', trangThai: 'open', danhMuc: 'Tài khoản', nguoiTaoTen: 'Nguyễn Văn An', nguoiTaoEmail: 'an@vct.vn', soTraLui: 0, createdAt: '2026-03-17 10:30', updatedAt: '2026-03-17 10:30' },
    { id: 'TK-002', maTicket: 'TK-002', tieuDe: 'Lỗi hiển thị bảng xếp hạng', noiDung: 'Bảng xếp hạng VĐV không hiển thị đúng thứ tự.', loai: 'technical', mucUuTien: 'critical', trangThai: 'in_progress', danhMuc: 'Kỹ thuật', nguoiTaoTen: 'Trần Thị Bình', nguoiTaoEmail: 'binh@vct.vn', nguoiXuLyTen: 'Admin VCT', soTraLui: 2, createdAt: '2026-03-16 15:20', updatedAt: '2026-03-17 09:15' },
    { id: 'TK-003', maTicket: 'TK-003', tieuDe: 'Yêu cầu thêm hạng cân mới cho giải tỉnh', noiDung: 'Giải võ cổ truyền tỉnh Bình Định cần thêm hạng cân U18 từ 54kg đến 57kg.', loai: 'tournament', mucUuTien: 'medium', trangThai: 'waiting_customer', danhMuc: 'Giải đấu', nguoiTaoTen: 'Võ Đại Hùng', nguoiTaoEmail: 'hung@vct.vn', nguoiXuLyTen: 'Admin VCT', soTraLui: 3, createdAt: '2026-03-15 08:45', updatedAt: '2026-03-17 14:00' },
    { id: 'TK-004', maTicket: 'TK-004', tieuDe: 'Hóa đơn thanh toán lệ phí giải không hiển thị', noiDung: 'Tôi đã thanh toán lệ phí tham gia giải thi đấu nhưng hóa đơn không hiển thị.', loai: 'payment', mucUuTien: 'high', trangThai: 'resolved', danhMuc: 'Thanh toán', nguoiTaoTen: 'Lê Minh Cường', nguoiTaoEmail: 'cuong@vct.vn', nguoiXuLyTen: 'Admin VCT', soTraLui: 4, createdAt: '2026-03-14 11:00', updatedAt: '2026-03-16 16:30' },
    { id: 'TK-005', maTicket: 'TK-005', tieuDe: 'Đề xuất tính năng quản lý lịch tập luyện', noiDung: 'Đề xuất thêm tính năng lịch tập luyện cá nhân cho VĐV.', loai: 'general', mucUuTien: 'low', trangThai: 'open', danhMuc: 'Chung', nguoiTaoTen: 'Phạm Thị Dung', nguoiTaoEmail: 'dung@vct.vn', soTraLui: 0, createdAt: '2026-03-17 08:00', updatedAt: '2026-03-17 08:00' },
    { id: 'TK-006', maTicket: 'TK-006', tieuDe: 'App mobile bị crash khi xem kết quả trận đấu', noiDung: 'Khi mở chi tiết kết quả trận đối kháng trên app mobile, app bị crash.', loai: 'technical', mucUuTien: 'critical', trangThai: 'in_progress', danhMuc: 'Kỹ thuật', nguoiTaoTen: 'Hoàng Văn Phong', nguoiTaoEmail: 'phong@vct.vn', nguoiXuLyTen: 'DevTeam', soTraLui: 5, createdAt: '2026-03-16 20:00', updatedAt: '2026-03-17 11:45' },
    { id: 'TK-007', maTicket: 'TK-007', tieuDe: 'Cập nhật thông tin CLB bị từ chối', noiDung: 'Tôi đã nộp yêu cầu cập nhật thông tin CLB VCT Huế nhưng bị từ chối.', loai: 'account', mucUuTien: 'medium', trangThai: 'closed', danhMuc: 'Tài khoản', nguoiTaoTen: 'Nguyễn Thị Lan', nguoiTaoEmail: 'lan@vct.vn', nguoiXuLyTen: 'Admin VCT', soTraLui: 6, createdAt: '2026-03-10 14:30', updatedAt: '2026-03-12 09:00' },
    { id: 'TK-008', maTicket: 'TK-008', tieuDe: 'Không thể tải xuống chứng nhận đai', noiDung: 'Nút "Tải chứng nhận" không hoạt động. Chrome 121.', loai: 'technical', mucUuTien: 'medium', trangThai: 'open', danhMuc: 'Kỹ thuật', nguoiTaoTen: 'Trần Văn Minh', nguoiTaoEmail: 'minh@vct.vn', soTraLui: 0, createdAt: '2026-03-17 14:20', updatedAt: '2026-03-17 14:20' },
]

export const MOCK_REPLIES: TicketReply[] = [
    { id: 'R-001', ticketId: 'TK-002', sender: 'Trần Thị Bình', senderRole: 'customer', content: 'Bảng xếp hạng VĐV không hiển thị đúng thứ tự.', createdAt: '2026-03-16 15:20' },
    { id: 'R-002', ticketId: 'TK-002', sender: 'Admin VCT', senderRole: 'admin', content: 'Chào bạn Bình, cảm ơn đã báo cáo lỗi. Chúng tôi đã tiếp nhận và đang kiểm tra.', createdAt: '2026-03-16 16:00' },
    { id: 'R-003', ticketId: 'TK-002', sender: 'Trần Thị Bình', senderRole: 'customer', content: 'Bảng xếp hạng Đối kháng, hạng cân 54kg nam.', createdAt: '2026-03-17 09:15' },
    { id: 'R-004', ticketId: 'TK-006', sender: 'Hoàng Văn Phong', senderRole: 'customer', content: 'Khi mở chi tiết kết quả trận đối kháng trên app mobile, app bị crash.', createdAt: '2026-03-16 20:00' },
    { id: 'R-005', ticketId: 'TK-006', sender: 'DevTeam', senderRole: 'admin', content: 'Cảm ơn anh đã báo. Anh dùng Android version mấy?', createdAt: '2026-03-16 21:30' },
    { id: 'R-006', ticketId: 'TK-006', sender: 'Hoàng Văn Phong', senderRole: 'customer', content: 'Android 14, Samsung S23. App v2.1.0.', createdAt: '2026-03-17 08:00' },
    { id: 'R-007', ticketId: 'TK-006', sender: 'DevTeam', senderRole: 'admin', content: 'Đã reproduce được lỗi. Đang fix. ETA: hôm nay 14h.', createdAt: '2026-03-17 10:00' },
    { id: 'R-008', ticketId: 'TK-006', sender: 'DevTeam', senderRole: 'admin', content: 'Đã deploy hotfix v2.1.1. Vui lòng cập nhật app.', createdAt: '2026-03-17 11:45' },
    { id: 'R-009', ticketId: 'TK-004', sender: 'Lê Minh Cường', senderRole: 'customer', content: 'Tôi đã thanh toán lệ phí tham gia giải nhưng hóa đơn không hiển thị.', createdAt: '2026-03-14 11:00' },
    { id: 'R-010', ticketId: 'TK-004', sender: 'Admin VCT', senderRole: 'admin', content: 'Đã kiểm tra, thanh toán qua VNPay bị delay webhook. Hóa đơn đã được bổ sung.', createdAt: '2026-03-14 14:30' },
]

export const MOCK_FAQS: FAQ[] = [
    { id: 'FAQ-001', cauHoi: 'Làm thế nào để đăng ký tài khoản VĐV?', traLoi: 'Truy cập trang đăng ký, chọn vai trò "Võ sinh / VĐV", điền đầy đủ thông tin cá nhân, tải lên ảnh chân dung và chờ CLB/HLV xác nhận.', danhMuc: 'Tài khoản', luotXem: 1250, isActive: true },
    { id: 'FAQ-002', cauHoi: 'Quy trình đăng ký tham gia giải đấu như thế nào?', traLoi: 'VĐV đăng nhập → Chọn giải đấu → Chọn hạng cân/nội dung → Nộp lệ phí → Chờ BTC xác nhận.', danhMuc: 'Giải đấu', luotXem: 980, isActive: true },
    { id: 'FAQ-003', cauHoi: 'Thanh toán lệ phí giải đấu bằng những hình thức nào?', traLoi: 'VCT Platform hỗ trợ: Chuyển khoản ngân hàng, Ví MoMo, ZaloPay, VNPay.', danhMuc: 'Thanh toán', luotXem: 756, isActive: true },
    { id: 'FAQ-004', cauHoi: 'Lỗi đăng nhập, quên mật khẩu xử lý thế nào?', traLoi: 'Nhấn "Quên mật khẩu" → Nhập email đăng ký → Nhận OTP → Đặt mật khẩu mới.', danhMuc: 'Tài khoản', luotXem: 2100, isActive: true },
    { id: 'FAQ-005', cauHoi: 'Làm sao để xem kết quả giải đấu?', traLoi: 'Vào mục "Giải đấu" → Chọn giải → Tab "Kết quả".', danhMuc: 'Giải đấu', luotXem: 540, isActive: true },
    { id: 'FAQ-006', cauHoi: 'Cách liên hệ hỗ trợ kỹ thuật?', traLoi: 'Tạo ticket hỗ trợ qua hệ thống, gửi email support@vct.vn, hoặc gọi hotline 1900-xxxx.', danhMuc: 'Chung', luotXem: 320, isActive: true },
]

export const MOCK_CATEGORIES: SupportCategory[] = [
    { id: 'CAT-001', ten: 'Tài khoản & Đăng nhập', moTa: 'Đăng ký, đăng nhập, quên mật khẩu', icon: 'Users', mauSac: '#0ea5e9', soTicket: 12, isActive: true },
    { id: 'CAT-002', ten: 'Hỗ trợ Kỹ thuật', moTa: 'Lỗi hệ thống, bug, vấn đề hiển thị', icon: 'Wrench', mauSac: '#8b5cf6', soTicket: 8, isActive: true },
    { id: 'CAT-003', ten: 'Giải đấu & Thi đấu', moTa: 'Đăng ký giải, lịch thi, kết quả', icon: 'Trophy', mauSac: '#10b981', soTicket: 15, isActive: true },
    { id: 'CAT-004', ten: 'Thanh toán & Hóa đơn', moTa: 'Lệ phí, thanh toán online, hoàn tiền', icon: 'DollarSign', mauSac: '#f59e0b', soTicket: 5, isActive: true },
    { id: 'CAT-005', ten: 'Đề xuất & Góp ý', moTa: 'Đề xuất tính năng mới, góp ý', icon: 'MessageSquare', mauSac: '#ec4899', soTicket: 3, isActive: true },
    { id: 'CAT-006', ten: 'Chứng nhận & Đai cấp', moTa: 'Chứng nhận thăng đai, lịch sử đai cấp', icon: 'Award', mauSac: '#f97316', soTicket: 7, isActive: true },
]

export const MOCK_NOTES: InternalNote[] = [
    { id: 'N-001', ticketId: 'TK-002', author: 'Admin VCT', content: 'KH đã liên hệ qua hotline, urgently cần fix trước giải vô địch.', createdAt: '2026-03-15 09:00' },
    { id: 'N-002', ticketId: 'TK-002', author: 'DevTeam', content: 'Bug confirmed, do cache bảng xếp hạng không invalidate.', createdAt: '2026-03-15 10:30' },
    { id: 'N-003', ticketId: 'TK-006', author: 'Admin VCT', content: 'Đã escalate cho DevTeam, timeout do query N+1.', createdAt: '2026-03-16 14:15' },
]

export const MOCK_ACTIVITIES: TicketActivity[] = [
    { id: 'A-001', ticketId: 'TK-002', action: 'created', actor: 'Trần Thị Bình', createdAt: '2026-03-14 08:00' },
    { id: 'A-002', ticketId: 'TK-002', action: 'assigned', actor: 'Admin VCT', detail: 'Nhận xử lý', createdAt: '2026-03-14 08:30' },
    { id: 'A-003', ticketId: 'TK-002', action: 'replied', actor: 'Admin VCT', detail: 'Đã phản hồi lần đầu', createdAt: '2026-03-14 08:45' },
    { id: 'A-004', ticketId: 'TK-002', action: 'note', actor: 'Admin VCT', detail: 'Thêm ghi chú nội bộ', createdAt: '2026-03-15 09:00' },
    { id: 'A-005', ticketId: 'TK-002', action: 'resolved', actor: 'Admin VCT', createdAt: '2026-03-15 14:00' },
    { id: 'A-006', ticketId: 'TK-006', action: 'created', actor: 'Phạm Hồng Đức', createdAt: '2026-03-16 11:00' },
    { id: 'A-007', ticketId: 'TK-006', action: 'assigned', actor: 'Admin VCT', createdAt: '2026-03-16 11:20' },
    { id: 'A-008', ticketId: 'TK-006', action: 'escalated', actor: 'Admin VCT', detail: 'Escalate → DevTeam', createdAt: '2026-03-16 14:15' },
]
