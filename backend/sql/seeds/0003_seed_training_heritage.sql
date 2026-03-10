-- ===============================================================
-- VCT Platform — Seed Data (Enterprise)
-- Initial reference data, sample martial schools, feature flags
-- ===============================================================

-- ════════════════════════════════════════════════════════
-- SAMPLE TENANTS (Liên đoàn)
-- ════════════════════════════════════════════════════════

INSERT INTO core.tenants (name, code, tenant_type, domain) VALUES
  ('Liên đoàn Võ thuật cổ truyền Việt Nam', 'vtct_vn', 'federation', 'vtct.vn'),
  ('Liên đoàn VTCT TP.HCM', 'vtct_hcm', 'federation', NULL),
  ('Liên đoàn VTCT Hà Nội', 'vtct_hn', 'federation', NULL),
  ('Liên đoàn VTCT Bình Định', 'vtct_bdi', 'federation', NULL),
  ('Liên đoàn VTCT Đà Nẵng', 'vtct_dn', 'federation', NULL)
ON CONFLICT (code) DO NOTHING;

-- ════════════════════════════════════════════════════════
-- MARTIAL SCHOOLS (Môn phái)
-- ════════════════════════════════════════════════════════

INSERT INTO platform.martial_schools (tenant_id, name, name_han_nom, code, founder, founded_year, origin_location, description, is_recognized)
SELECT t.id,
  vals.name, vals.name_han_nom, vals.code, vals.founder,
  vals.founded_year, vals.origin_location, vals.description, true
FROM core.tenants t
CROSS JOIN (VALUES
  ('Võ Bình Định', '武平定', 'binh_dinh', 'Nhiều dòng phái', 1700, 'Bình Định', 'Hệ thống võ học truyền thống vùng Bình Định, nổi tiếng với quyền và binh khí'),
  ('Tân Khánh Bà Trà', '新慶婆茶', 'tkbt', 'Đinh Ngọc Năm', 1750, 'Bình Dương', 'Một trong những phái võ lâu đời nhất miền Nam'),
  ('Vovinam Việt Võ Đạo', '越武道', 'vovinam', 'Nguyễn Lộc', 1938, 'Hà Nội', 'Môn võ thuật tổng hợp hiện đại của Việt Nam'),
  ('Kim Kê', '金雞', 'kim_ke', 'Không rõ', 1800, 'Bình Định', 'Phái võ cổ truyền với đặc trưng kỹ thuật chân'),
  ('Thiếu Lâm Nội Gia', '少林內家', 'thieu_lam', 'Từ Trung Quốc', 1600, 'Nhiều vùng', 'Dòng Thiếu Lâm truyền vào Việt Nam'),
  ('Bạch Mi', '白眉', 'bach_mi', 'Bạch Mi đạo nhân', 1600, 'Quảng Đông → Việt Nam', 'Quyền pháp Bạch Mi chú trọng nội lực'),
  ('Hồng Gia Quyền', '洪家拳', 'hong_gia', 'Hồng Hi Quan', 1700, 'Phúc Kiến → Việt Nam', 'Nổi tiếng với quyền pháp cương mãnh'),
  ('Sa Long Cương', '沙龍崗', 'sa_long_cuong', 'Trương Thanh Đăng', 1964, 'Sài Gòn', 'Tổng hợp nhiều dòng võ Trung Hoa và Việt Nam')
) AS vals(name, name_han_nom, code, founder, founded_year, origin_location, description)
WHERE t.code = 'vct_system'
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════
-- SAMPLE TRAINING DATA
-- ════════════════════════════════════════════════════════

INSERT INTO training.curricula (tenant_id, name, code, school_style, description)
SELECT t.id, vals.name, vals.code, vals.style, vals.description
FROM core.tenants t
CROSS JOIN (VALUES
  ('Giáo trình Võ cổ truyền cơ bản', 'vct_co_ban', 'Tổng hợp', 'Chương trình đào tạo cơ bản cho người mới bắt đầu'),
  ('Giáo trình Quyền thuật nâng cao', 'quyen_nang_cao', 'Tổng hợp', 'Chương trình quyền thuật dành cho đai xanh trở lên'),
  ('Giáo trình Binh khí cổ truyền', 'binh_khi', 'Tổng hợp', 'Đào tạo các loại binh khí truyền thống: côn, kiếm, thương, đao')
) AS vals(name, code, style, description)
WHERE t.code = 'vct_system'
ON CONFLICT DO NOTHING;

INSERT INTO training.techniques (tenant_id, name_vi, name_en, category, difficulty_level, description)
SELECT t.id, vals.name_vi, vals.name_en, vals.category, vals.diff, vals.description
FROM core.tenants t
CROSS JOIN (VALUES
  ('Mã bộ tấn pháp', 'Horse Stance Footwork', 'don', 1, 'Các thế tấn cơ bản trong võ cổ truyền'),
  ('Trực quyền', 'Straight Punch', 'don', 2, 'Đấm thẳng — kỹ thuật nền tảng'),
  ('Liên hoàn cước', 'Combination Kicks', 'don', 4, 'Các đòn cước liên hoàn phối hợp'),
  ('Lão hổ thượng sơn quyền', 'Tiger Ascending Mountain Form', 'quyen', 5, 'Bài quyền truyền thống Bình Định'),
  ('Ngọc trản quyền', 'Jade Cup Form', 'quyen', 6, 'Bài quyền nổi tiếng miền Trung'),
  ('Roi Thuận Truyền', 'Thuan Truyen Staff', 'binh_khi', 7, 'Bài binh khí côn pháp Bình Định'),
  ('Song đao phá trận', 'Double Saber Breaking Formation', 'binh_khi', 8, 'Bài đao pháp nâng cao'),
  ('Đối luyện tay không', 'Empty Hand Sparring Drill', 'song_luyen', 5, 'Bài đối luyện cơ bản 2 người')
) AS vals(name_vi, name_en, category, diff, description)
WHERE t.code = 'vct_system'
ON CONFLICT DO NOTHING;
