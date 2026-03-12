-- ═══════════════════════════════════════════════════════════════
-- VCT PLATFORM — Migration 0040: Federation Seed Data
-- 63 tỉnh/thành phố + Central federation unit
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

-- ── 63 Provinces ──
INSERT INTO federation_provinces (code, name, region, has_fed, club_count, vdv_count, coach_count) VALUES
-- Miền Bắc (25)
('HN',   'Hà Nội',           'north', true,  38, 980,  72),
('HP',   'Hải Phòng',        'north', true,  15, 420,  28),
('QN',   'Quảng Ninh',       'north', false,  8, 180,  12),
('VP',   'Vĩnh Phúc',        'north', false,  5, 120,   8),
('BN',   'Bắc Ninh',         'north', false,  6, 150,  10),
('HD',   'Hải Dương',        'north', false,  7, 160,  11),
('HY',   'Hưng Yên',         'north', false,  4, 90,    6),
('TB',   'Thái Bình',        'north', false,  5, 110,   7),
('HNA',  'Hà Nam',           'north', false,  3, 70,    5),
('NDB',  'Nam Định',         'north', true,  12, 350,  22),
('NB',   'Ninh Bình',        'north', false,  4, 100,   7),
('TH',   'Thanh Hóa',        'north', true,  18, 500,  35),
('NA',   'Nghệ An',          'north', true,  15, 420,  28),
('HT',   'Hà Tĩnh',         'north', false,  6, 140,   9),
('PT',   'Phú Thọ',          'north', false,  5, 120,   8),
('TN',   'Thái Nguyên',      'north', false,  4, 100,   7),
('BG',   'Bắc Giang',        'north', false,  5, 110,   8),
('BK',   'Bắc Kạn',         'north', false,  2, 40,    3),
('TQ',   'Tuyên Quang',      'north', false,  2, 45,    3),
('LCI',  'Lào Cai',          'north', false,  3, 60,    4),
('YB',   'Yên Bái',          'north', false,  2, 50,    3),
('SL',   'Sơn La',           'north', false,  3, 55,    4),
('LC',   'Lai Châu',         'north', false,  1, 25,    2),
('DB',   'Điện Biên',        'north', false,  2, 35,    3),
('HG',   'Hà Giang',         'north', false,  2, 40,    3),
-- Miền Trung (13)
('QB',   'Quảng Bình',       'central', false,  5, 120,   8),
('QTR',  'Quảng Trị',        'central', false,  4, 90,    6),
('TTH',  'Thừa Thiên Huế',  'central', true,  12, 320,  22),
('DN',   'Đà Nẵng',          'central', true,  15, 420,  28),
('QNA',  'Quảng Nam',        'central', false,  8, 200,  14),
('QNG',  'Quảng Ngãi',       'central', false,  6, 150,  10),
('BDI',  'Bình Định',        'central', true,  35, 900,  60),
('PY',   'Phú Yên',          'central', false,  5, 110,   7),
('KH',   'Khánh Hòa',        'central', true,  10, 280,  18),
('NT',   'Ninh Thuận',       'central', false,  4, 90,    6),
('BT',   'Bình Thuận',       'central', false,  6, 150,  10),
('GL',   'Gia Lai',          'central', false,  5, 120,   8),
('KT',   'Kon Tum',          'central', false,  3, 60,    4),
-- Miền Nam (25)
('HCM',  'TP Hồ Chí Minh',  'south', true,  45, 1200, 85),
('BD',   'Bình Dương',       'south', true,  22, 650,  40),
('DNI',  'Đồng Nai',         'south', true,  18, 480,  32),
('BR',   'Bà Rịa - Vũng Tàu','south', true,  10, 280,  18),
('TNI',  'Tây Ninh',         'south', false,  6, 140,   9),
('BP',   'Bình Phước',       'south', false,  4, 90,    6),
('LA',   'Long An',          'south', true,   8, 220,  15),
('DT',   'Đồng Tháp',       'south', false,  6, 150,  10),
('AG',   'An Giang',         'south', true,  12, 350,  22),
('TG',   'Tiền Giang',       'south', false,  7, 180,  12),
('BL',   'Bến Tre',          'south', false,  5, 130,   9),
('VL',   'Vĩnh Long',        'south', false,  5, 120,   8),
('CT',   'Cần Thơ',          'south', true,  15, 400,  28),
('HGI',  'Hậu Giang',        'south', false,  4, 90,    6),
('KG',   'Kiên Giang',       'south', false,  6, 150,  10),
('ST',   'Sóc Trăng',        'south', false,  4, 100,   7),
('TV',   'Trà Vinh',         'south', false,  3, 70,    5),
('BLI',  'Bạc Liêu',        'south', false,  3, 60,    4),
('CM',   'Cà Mau',           'south', false,  4, 100,   7),
('DL',   'Đắk Lắk',         'south', false,  7, 180,  12),
('DLK',  'Đắk Nông',         'south', false,  3, 60,    4),
('LDO',  'Lâm Đồng',        'south', true,   8, 220,  15),
('CBG',  'Cao Bằng',          'north', false,  2, 40,   3),
('LSO',  'Lạng Sơn',          'north', false,  3, 60,   4),
('PGI',  'Phú Giáo',          'south', false,  2, 35,   2)
ON CONFLICT (code) DO NOTHING;
