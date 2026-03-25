-- ═══════════════════════════════════════════════════════════════
-- VCT PLATFORM — Migration 0040: Federation Seed Data
-- 34 tỉnh/thành phố (sau sáp nhập 2025) + Central federation unit
-- ═══════════════════════════════════════════════════════════════

-- ── Central Federation Unit ──
INSERT INTO federation_units (id, name, short_name, type, status, leader_name, leader_title)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'Liên đoàn Võ Cổ Truyền Việt Nam',
    'LĐ VCT VN',
    'central',
    'active',
    'Chủ tịch Liên đoàn',
    'Chủ tịch'
) ON CONFLICT DO NOTHING;

-- ── 34 Provinces (Sau sáp nhập 2025) ──
INSERT INTO federation_provinces (code, name, region, has_fed, club_count, vdv_count, coach_count) VALUES
-- Miền Bắc (15)
('HN',   'Hà Nội',           'north', true,  60, 1500, 110),
('HP',   'Hải Phòng',        'north', true,  30, 700,  45),
('QN',   'Quảng Ninh',       'north', true,  15, 300,  20),
('BN',   'Bắc Ninh',         'north', true,  20, 400,  25),
('HY',   'Hưng Yên',         'north', true,  15, 250,  18),
('NB',   'Ninh Bình',        'north', true,  25, 550,  35),
('PT',   'Phú Thọ',          'north', true,  18, 400,  28),
('TN',   'Thái Nguyên',      'north', true,  12, 200,  15),
('TQ',   'Tuyên Quang',      'north', false,  8, 120,   8),
('LCI',  'Lào Cai',          'north', true,   9, 150,  10),
('CB',   'Cao Bằng',         'north', false,  5,  80,   5),
('LS',   'Lạng Sơn',         'north', false,  6,  90,   6),
('SL',   'Sơn La',           'north', false,  7, 100,   8),
('DB',   'Điện Biên',        'north', false,  4,  60,   4),
('LC',   'Lai Châu',         'north', false,  3,  40,   3),
-- Miền Trung & Tây Nguyên (11)
('TH',   'Thanh Hóa',        'central', true,  30, 800,  50),
('NA',   'Nghệ An',          'central', true,  25, 600,  40),
('HT',   'Hà Tĩnh',          'central', true,  15, 300,  20),
('HUE',  'Huế',              'central', true,  20, 450,  30),
('DN',   'Đà Nẵng',          'central', true,  25, 650,  45),
('QT',   'Quảng Trị',        'central', true,  12, 250,  15),
('QNG',  'Quảng Ngãi',       'central', true,  18, 400,  25),
('KH',   'Khánh Hòa',        'central', true,  20, 450,  30),
('GL',   'Gia Lai',          'central', true,  14, 300,  20),
('DL',   'Đắk Lắk',          'central', true,  22, 500,  35),
('LDO',  'Lâm Đồng',         'central', true,  20, 450,  30),
-- Miền Nam (8)
('HCM',  'Hồ Chí Minh',      'south', true,  80, 2500, 180),
('CT',   'Cần Thơ',          'south', true,  25, 650,  40),
('DNI',  'Đồng Nai',         'south', true,  40, 1100, 75),
('AG',   'An Giang',         'south', true,  20, 500,  35),
('CM',   'Cà Mau',           'south', true,  15, 350,  22),
('DT',   'Đồng Tháp',        'south', true,  18, 400,  28),
('TNI',  'Tây Ninh',         'south', true,  12, 250,  15),
('VL',   'Vĩnh Long',        'south', true,   8, 180,  12)
ON CONFLICT (code) DO NOTHING;
