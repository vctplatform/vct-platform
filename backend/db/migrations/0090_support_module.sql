-- Phase 3 Roadmap: Customer Support Schema

CREATE TABLE support_categories (
    id VARCHAR(50) PRIMARY KEY,
    ten VARCHAR(255) NOT NULL,
    mo_ta TEXT,
    icon VARCHAR(100),
    mau_sac VARCHAR(20),
    thu_tu INT DEFAULT 0,
    so_ticket INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE faqs (
    id VARCHAR(50) PRIMARY KEY,
    cau_hoi text NOT NULL,
    tra_loi text NOT NULL,
    danh_muc_id VARCHAR(50) REFERENCES support_categories(id) ON DELETE SET NULL,
    danh_muc VARCHAR(255),
    luot_xem INT DEFAULT 0,
    thu_tu INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE support_tickets (
    id VARCHAR(50) PRIMARY KEY,
    ma_ticket VARCHAR(20) UNIQUE NOT NULL,
    tieu_de VARCHAR(255) NOT NULL,
    noi_dung TEXT NOT NULL,
    loai VARCHAR(50) NOT NULL,
    muc_uu_tien VARCHAR(20) NOT NULL,
    trang_thai VARCHAR(20) NOT NULL,
    danh_muc_id VARCHAR(50) REFERENCES support_categories(id) ON DELETE SET NULL,
    nguoi_tao_id VARCHAR(50) NOT NULL,
    nguoi_tao_ten VARCHAR(255),
    nguoi_tao_email VARCHAR(255),
    nguoi_xu_ly_id VARCHAR(50),
    nguoi_xu_ly_ten VARCHAR(255),
    so_tra_loi INT DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_reply_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE ticket_replies (
    id VARCHAR(50) PRIMARY KEY,
    ticket_id VARCHAR(50) REFERENCES support_tickets(id) ON DELETE CASCADE,
    noi_dung TEXT NOT NULL,
    nguoi_tra VARCHAR(255) NOT NULL,
    nguoi_tra_id VARCHAR(50) NOT NULL,
    is_staff BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE attachments (
    id VARCHAR(50) PRIMARY KEY,
    ticket_id VARCHAR(50) REFERENCES support_tickets(id) ON DELETE CASCADE,
    reply_id VARCHAR(50) REFERENCES ticket_replies(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    url VARCHAR(1024) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_tickets_trang_thai ON support_tickets(trang_thai);
CREATE INDEX idx_tickets_muc_uu_tien ON support_tickets(muc_uu_tien);
CREATE INDEX idx_tickets_nguoi_tao ON support_tickets(nguoi_tao_id);
CREATE INDEX idx_replies_ticket ON ticket_replies(ticket_id);
