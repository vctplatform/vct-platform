-- ═══════════════════════════════════════════════════════════════
-- VCT PLATFORM — FEDERATION PR: news_articles
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS federation_news_articles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    summary         TEXT NOT NULL DEFAULT '',
    content         TEXT NOT NULL DEFAULT '',
    category        VARCHAR(50) NOT NULL DEFAULT 'Giải đấu',
    image_url       TEXT DEFAULT '',
    author          VARCHAR(200) NOT NULL DEFAULT '',
    author_id       VARCHAR(100) DEFAULT '',
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'review', 'published')),
    published_at    TIMESTAMPTZ,
    view_count      INTEGER NOT NULL DEFAULT 0,
    tags            TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fed_articles_status ON federation_news_articles(status);
CREATE INDEX idx_fed_articles_category ON federation_news_articles(category);
CREATE INDEX idx_fed_articles_published ON federation_news_articles(published_at DESC)
    WHERE status = 'published';

-- Seed data
INSERT INTO federation_news_articles (title, summary, category, author, status, view_count) VALUES
('Giải Vô địch Võ Cổ Truyền Toàn quốc 2024 chính thức khởi tranh',
 'Giải đấu quy tụ hơn 500 VĐV từ 42 tỉnh/thành.', 'Giải đấu', 'Ban TT', 'published', 3420),
('Liên đoàn ký kết hợp tác với Liên đoàn Wushu Trung Quốc',
 'Thỏa thuận hợp tác đào tạo HLV và trao đổi VĐV.', 'Quốc tế', 'Ban ĐN', 'published', 2180),
('Khai mạc lớp tập huấn Trọng tài quốc gia 2024',
 '120 trọng tài từ 30 tỉnh/thành tham dự.', 'Đào tạo', 'Ban TT', 'published', 1560),
('Thông báo sửa đổi Luật thi đấu 128/2024',
 'Cập nhật điểm số, quy tắc phạt và hạng cân mới.', 'Quy chế', 'Ban KHVB', 'published', 4200),
('VĐV Bình Định giành 3 HCV tại SEA Games',
 'Đoàn Bình Định xuất sắc thi đấu tại SEA Games.', 'Thành tích', 'Ban TT', 'draft', 0),
('Kế hoạch phát triển phong trào Võ Cổ Truyền 2024-2026',
 'Chiến lược 3 năm phát triển VCT toàn quốc.', 'Chiến lược', 'BCH LĐ', 'review', 0)
ON CONFLICT DO NOTHING;
