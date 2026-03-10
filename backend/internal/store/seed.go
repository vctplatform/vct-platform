package store

import "fmt"

func SeedData() map[string]map[string]map[string]any {
	entities := map[string][]map[string]any{
		"teams": {
			{"id": "DV01", "ma": "BD", "ten": "Đoàn Bình Định", "tat": "BĐ", "loai": "doan_tinh", "tinh": "Bình Định", "truong_doan": "Nguyễn Văn Trọng", "sdt": "0900000001", "email": "bd@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV02", "ma": "HN", "ten": "Đoàn Hà Nội", "tat": "HN", "loai": "doan_tinh", "tinh": "Hà Nội", "truong_doan": "Trần Tuấn Anh", "sdt": "0900000002", "email": "hn@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV03", "ma": "HCM", "ten": "Đoàn TP.HCM", "tat": "HCM", "loai": "doan_tinh", "tinh": "TP Hồ Chí Minh", "truong_doan": "Lý Thanh Tùng", "sdt": "0900000003", "email": "hcm@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV04", "ma": "DN", "ten": "Đoàn Đà Nẵng", "tat": "ĐN", "loai": "doan_tinh", "tinh": "TP Đà Nẵng", "truong_doan": "Phan Quốc Việt", "sdt": "0900000004", "email": "dn@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV05", "ma": "TH", "ten": "Đoàn Thanh Hóa", "tat": "TH", "loai": "doan_tinh", "tinh": "Thanh Hóa", "truong_doan": "Lê Đình Hải", "sdt": "0900000005", "email": "th@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV06", "ma": "NA", "ten": "Đoàn Nghệ An", "tat": "NA", "loai": "doan_tinh", "tinh": "Nghệ An", "truong_doan": "Cao Xuân Hà", "sdt": "0900000006", "email": "na@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV07", "ma": "TTH", "ten": "Đoàn TT Huế", "tat": "Huế", "loai": "doan_tinh", "tinh": "TT Huế", "truong_doan": "Trương Văn Khoa", "sdt": "0900000007", "email": "hue@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV08", "ma": "BDG", "ten": "Đoàn Bình Dương", "tat": "BDg", "loai": "doan_tinh", "tinh": "Bình Dương", "truong_doan": "Hoàng Minh Tuấn", "sdt": "0900000008", "email": "bdg@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV09", "ma": "CT", "ten": "Đoàn Cần Thơ", "tat": "CT", "loai": "doan_tinh", "tinh": "TP Cần Thơ", "truong_doan": "Đặng Minh Phụng", "sdt": "0900000009", "email": "ct@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV10", "ma": "DNI", "ten": "Đoàn Đồng Nai", "tat": "ĐNai", "loai": "doan_tinh", "tinh": "Đồng Nai", "truong_doan": "Bùi Danh Liêm", "sdt": "0900000010", "email": "dni@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV11", "ma": "HP", "ten": "Đoàn Hải Phòng", "tat": "HP", "loai": "doan_tinh", "tinh": "TP Hải Phòng", "truong_doan": "Phạm Minh Tuấn", "sdt": "0900000011", "email": "hp@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV12", "ma": "KH", "ten": "Đoàn Khánh Hòa", "tat": "KH", "loai": "doan_tinh", "tinh": "Khánh Hòa", "truong_doan": "Nguyễn Hữu Vinh", "sdt": "0900000012", "email": "kh@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV13", "ma": "AG", "ten": "Đoàn An Giang", "tat": "AG", "loai": "doan_tinh", "tinh": "An Giang", "truong_doan": "Trần Thanh Phong", "sdt": "0900000013", "email": "ag@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV14", "ma": "QNM", "ten": "Đoàn Quảng Nam", "tat": "QNam", "loai": "doan_tinh", "tinh": "Quảng Nam", "truong_doan": "Võ Minh Đạt", "sdt": "0900000014", "email": "qnam@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV15", "ma": "BR", "ten": "Đoàn BR-VT", "tat": "BRVT", "loai": "doan_tinh", "tinh": "Bà Rịa - Vũng Tàu", "truong_doan": "Lê Quốc Bảo", "sdt": "0900000015", "email": "brvt@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV16", "ma": "LA", "ten": "Đoàn Long An", "tat": "LA", "loai": "doan_tinh", "tinh": "Long An", "truong_doan": "Huỳnh Văn Tài", "sdt": "0900000016", "email": "la@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV17", "ma": "QNG", "ten": "Đoàn Quảng Ngãi", "tat": "QNg", "loai": "doan_tinh", "tinh": "Quảng Ngãi", "truong_doan": "Đoàn Minh Khoa", "sdt": "0900000017", "email": "qng@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV18", "ma": "PY", "ten": "Đoàn Phú Yên", "tat": "PY", "loai": "doan_tinh", "tinh": "Phú Yên", "truong_doan": "Nguyễn Thanh Sơn", "sdt": "0900000018", "email": "py@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV19", "ma": "TG", "ten": "Đoàn Tiền Giang", "tat": "TG", "loai": "doan_tinh", "tinh": "Tiền Giang", "truong_doan": "Đỗ Hữu Tân", "sdt": "0900000019", "email": "tg@vct.vn", "trang_thai": "da_xac_nhan"},
			{"id": "DV20", "ma": "DL", "ten": "Đoàn Đắk Lắk", "tat": "ĐL", "loai": "doan_tinh", "tinh": "Đắk Lắk", "truong_doan": "Trần Quốc Huy", "sdt": "0900000020", "email": "dl@vct.vn", "trang_thai": "cho_xac_nhan"},
		},
		"athletes": seedAthletes(),
		"content-categories": {
			// Quyền
			{"id": "NDQ01", "ten": "Ngọc Trản Quyền", "hinh_thuc": "ca_nhan", "gioi": "nu", "lua_tuoi": "Thanh niên", "trang_thai": "active"},
			{"id": "NDQ02", "ten": "Lão Mai Quyền", "hinh_thuc": "ca_nhan", "gioi": "nam", "lua_tuoi": "Thanh niên", "trang_thai": "active"},
			{"id": "NDQ03", "ten": "Hùng Kê Quyền", "hinh_thuc": "ca_nhan", "gioi": "nam", "lua_tuoi": "Thanh niên", "trang_thai": "active"},
			{"id": "NDQ04", "ten": "Tứ Linh Đao", "hinh_thuc": "ca_nhan", "gioi": "nam", "lua_tuoi": "Thanh niên", "trang_thai": "active"},
			{"id": "NDQ05", "ten": "Song Luyện Tay Không", "hinh_thuc": "doi", "gioi": "hon_hop", "lua_tuoi": "Thanh niên", "trang_thai": "active"},
			{"id": "NDQ06", "ten": "Song Luyện Vũ Khí", "hinh_thuc": "doi", "gioi": "hon_hop", "lua_tuoi": "Thanh niên", "trang_thai": "active"},
			{"id": "NDQ07", "ten": "Đồng Đội Quyền Nam", "hinh_thuc": "dong_doi", "gioi": "nam", "lua_tuoi": "Thanh niên", "trang_thai": "active"},
			{"id": "NDQ08", "ten": "Đồng Đội Quyền Nữ", "hinh_thuc": "dong_doi", "gioi": "nu", "lua_tuoi": "Thanh niên", "trang_thai": "active"},
			{"id": "NDQ09", "ten": "Roi Thuận", "hinh_thuc": "ca_nhan", "gioi": "nam", "lua_tuoi": "Thanh niên", "trang_thai": "active"},
			{"id": "NDQ10", "ten": "Kiếm Thuật", "hinh_thuc": "ca_nhan", "gioi": "nu", "lua_tuoi": "Thanh niên", "trang_thai": "active"},
			// Đối kháng
			{"id": "HC48", "ten": "Nam 48kg", "loai": "doi_khang", "gioi": "nam", "trang_thai": "active"},
			{"id": "HC52", "ten": "Nam 52kg", "loai": "doi_khang", "gioi": "nam", "trang_thai": "active"},
			{"id": "HC55", "ten": "Nam 55kg", "loai": "doi_khang", "gioi": "nam", "trang_thai": "active"},
			{"id": "HC60", "ten": "Nam 60kg", "loai": "doi_khang", "gioi": "nam", "trang_thai": "active"},
			{"id": "HC65", "ten": "Nam 65kg", "loai": "doi_khang", "gioi": "nam", "trang_thai": "active"},
			{"id": "HC70", "ten": "Nam 70kg", "loai": "doi_khang", "gioi": "nam", "trang_thai": "active"},
			{"id": "HC80", "ten": "Nam 80kg", "loai": "doi_khang", "gioi": "nam", "trang_thai": "active"},
			{"id": "HCN45", "ten": "Nữ 45kg", "loai": "doi_khang", "gioi": "nu", "trang_thai": "active"},
			{"id": "HCN48", "ten": "Nữ 48kg", "loai": "doi_khang", "gioi": "nu", "trang_thai": "active"},
			{"id": "HCN52", "ten": "Nữ 52kg", "loai": "doi_khang", "gioi": "nu", "trang_thai": "active"},
			{"id": "HCN56", "ten": "Nữ 56kg", "loai": "doi_khang", "gioi": "nu", "trang_thai": "active"},
			{"id": "HCN60", "ten": "Nữ 60kg", "loai": "doi_khang", "gioi": "nu", "trang_thai": "active"},
		},
		"referees": {
			{"id": "TT01", "ho_ten": "Đặng Quốc Minh", "cap_bac": "quoc_gia", "chuyen_mon": "ca_hai", "trang_thai": "xac_nhan"},
			{"id": "TT02", "ho_ten": "Võ Hải Yến", "cap_bac": "cap_1", "chuyen_mon": "quyen", "trang_thai": "xac_nhan"},
			{"id": "TT03", "ho_ten": "Trần Văn Hùng", "cap_bac": "quoc_gia", "chuyen_mon": "doi_khang", "trang_thai": "xac_nhan"},
			{"id": "TT04", "ho_ten": "Nguyễn Thị Hoa", "cap_bac": "cap_1", "chuyen_mon": "quyen", "trang_thai": "xac_nhan"},
			{"id": "TT05", "ho_ten": "Lê Minh Phương", "cap_bac": "quoc_gia", "chuyen_mon": "doi_khang", "trang_thai": "xac_nhan"},
			{"id": "TT06", "ho_ten": "Phạm Đức Anh", "cap_bac": "cap_1", "chuyen_mon": "ca_hai", "trang_thai": "xac_nhan"},
			{"id": "TT07", "ho_ten": "Hoàng Văn Sơn", "cap_bac": "quoc_gia", "chuyen_mon": "doi_khang", "trang_thai": "xac_nhan"},
			{"id": "TT08", "ho_ten": "Bùi Thị Nga", "cap_bac": "cap_2", "chuyen_mon": "quyen", "trang_thai": "xac_nhan"},
			{"id": "TT09", "ho_ten": "Đỗ Quang Vinh", "cap_bac": "cap_1", "chuyen_mon": "doi_khang", "trang_thai": "xac_nhan"},
			{"id": "TT10", "ho_ten": "Ngô Thanh Tâm", "cap_bac": "quoc_gia", "chuyen_mon": "ca_hai", "trang_thai": "xac_nhan"},
		},
		"arenas": {
			{"id": "S01", "ten": "Sàn 1", "vi_tri": "Nhà thi đấu A", "loai": "doi_khang", "trang_thai": "san_sang"},
			{"id": "S02", "ten": "Sàn 2", "vi_tri": "Nhà thi đấu A", "loai": "quyen", "trang_thai": "san_sang"},
			{"id": "S03", "ten": "Sàn 3", "vi_tri": "Nhà thi đấu B", "loai": "doi_khang", "trang_thai": "san_sang"},
			{"id": "S04", "ten": "Sàn 4", "vi_tri": "Nhà thi đấu B", "loai": "quyen", "trang_thai": "san_sang"},
		},
		"schedule":            seedSchedule(),
		"combat-matches":      seedCombatMatches(),
		"form-performances":   seedFormPerformances(),
		"registration":        seedRegistrations(),
		"weigh-ins":           seedWeighIns(),
		"referee-assignments": seedRefereeAssignments(),
		"appeals": {
			{"id": "KN01", "doan_id": "DV02", "doan_ten": "Đoàn Hà Nội", "loai": "khieu_nai", "trang_thai": "dang_xu_ly", "ly_do": "Đề nghị xem lại điểm kỹ thuật trận TD03", "thoi_gian_nop": "2026-08-15T10:20:00+07:00"},
			{"id": "KN02", "doan_id": "DV05", "doan_ten": "Đoàn Thanh Hóa", "loai": "khang_nghi", "trang_thai": "da_giai_quyet", "ly_do": "Phản đối quyết định trọng tài trận TD05", "thoi_gian_nop": "2026-08-16T14:30:00+07:00"},
			{"id": "KN03", "doan_id": "DV03", "doan_ten": "Đoàn TP.HCM", "loai": "khieu_nai", "trang_thai": "cho_xu_ly", "ly_do": "Kiểm tra lại kết quả cân VĐV đối phương", "thoi_gian_nop": "2026-08-17T09:00:00+07:00"},
		},
		"results": seedResults(),
		"tournament-config": {
			{"id": "TOURNAMENT-2026", "ten_giai": "Giải Vô Địch Võ Cổ Truyền Toàn Quốc 2026", "ma_giai": "VCT-2026", "cap_do": "quoc_gia", "ngay_bat_dau": "2026-08-15", "ngay_ket_thuc": "2026-08-20", "dia_diem": "Nhà thi đấu Quy Nhơn, Bình Định", "trang_thai": "dang_dien_ra", "operation_shift": "sang", "so_doan": 20, "so_vdv": 60, "so_noi_dung": 22, "so_san": 4},
		},
	}

	seed := make(map[string]map[string]map[string]any, len(entities))
	for entity, items := range entities {
		seed[entity] = make(map[string]map[string]any, len(items))
		for _, item := range items {
			id, ok := item["id"].(string)
			if !ok || id == "" {
				continue
			}
			seed[entity][id] = cloneMap(item)
		}
	}
	return seed
}

// ── Helper seed functions ────────────────────────────────────

func seedAthletes() []map[string]any {
	type a struct {
		id, ten, gioi, doan, doanTen string
		can                          float64
	}
	raw := []a{
		{"VDV01", "Phạm Hoàng Nam", "nam", "DV01", "BĐ", 55}, {"VDV02", "Lê Thu Hương", "nu", "DV02", "HN", 50},
		{"VDV03", "Nguyễn Đức Mạnh", "nam", "DV01", "BĐ", 60}, {"VDV04", "Trần Thị Lan", "nu", "DV01", "BĐ", 48},
		{"VDV05", "Võ Minh Tuấn", "nam", "DV02", "HN", 65}, {"VDV06", "Đỗ Thị Ngọc", "nu", "DV02", "HN", 52},
		{"VDV07", "Lý Quốc Huy", "nam", "DV03", "HCM", 55}, {"VDV08", "Phan Ngọc Mai", "nu", "DV03", "HCM", 48},
		{"VDV09", "Huỳnh Thanh Long", "nam", "DV03", "HCM", 70}, {"VDV10", "Nguyễn Thị Tuyết", "nu", "DV03", "HCM", 56},
		{"VDV11", "Trương Văn Đạt", "nam", "DV04", "ĐN", 60}, {"VDV12", "Lê Hoàng Yến", "nu", "DV04", "ĐN", 52},
		{"VDV13", "Cao Minh Quân", "nam", "DV05", "TH", 55}, {"VDV14", "Phạm Thu Thảo", "nu", "DV05", "TH", 45},
		{"VDV15", "Nguyễn Hữu Phúc", "nam", "DV06", "NA", 65}, {"VDV16", "Trần Khánh Linh", "nu", "DV06", "NA", 48},
		{"VDV17", "Đặng Quốc Toàn", "nam", "DV07", "Huế", 70}, {"VDV18", "Hoàng Thị Hạnh", "nu", "DV07", "Huế", 52},
		{"VDV19", "Bùi Thanh Tú", "nam", "DV08", "BDg", 60}, {"VDV20", "Võ Thị Kim Ngân", "nu", "DV08", "BDg", 56},
		{"VDV21", "Lê Đình Khôi", "nam", "DV09", "CT", 55}, {"VDV22", "Nguyễn Thị Bảo Trâm", "nu", "DV09", "CT", 48},
		{"VDV23", "Phạm Quốc Đại", "nam", "DV10", "ĐNai", 65}, {"VDV24", "Trần Thị Mỹ Duyên", "nu", "DV10", "ĐNai", 52},
		{"VDV25", "Hoàng Anh Kiệt", "nam", "DV11", "HP", 70}, {"VDV26", "Lê Thị Thu Hà", "nu", "DV11", "HP", 45},
		{"VDV27", "Nguyễn Tấn Phát", "nam", "DV12", "KH", 55}, {"VDV28", "Võ Ngọc Diễm", "nu", "DV12", "KH", 48},
		{"VDV29", "Trần Quang Hải", "nam", "DV13", "AG", 60}, {"VDV30", "Phạm Thị Ánh Nguyệt", "nu", "DV13", "AG", 56},
		{"VDV31", "Đỗ Minh Trí", "nam", "DV14", "QNam", 48}, {"VDV32", "Nguyễn Thùy Linh", "nu", "DV14", "QNam", 52},
		{"VDV33", "Lê Hoàng Phúc", "nam", "DV15", "BRVT", 80}, {"VDV34", "Trần Thị Cẩm Tú", "nu", "DV15", "BRVT", 60},
		{"VDV35", "Huỳnh Đức Long", "nam", "DV16", "LA", 52}, {"VDV36", "Phạm Ngọc Anh", "nu", "DV16", "LA", 45},
		{"VDV37", "Nguyễn Hoàng Sơn", "nam", "DV17", "QNg", 65}, {"VDV38", "Võ Thị Thanh Tâm", "nu", "DV17", "QNg", 48},
		{"VDV39", "Cao Đức Vinh", "nam", "DV18", "PY", 55}, {"VDV40", "Lê Thị Kim Oanh", "nu", "DV18", "PY", 52},
		{"VDV41", "Trần Minh Hoàng", "nam", "DV19", "TG", 60}, {"VDV42", "Nguyễn Thị Hồng Nhung", "nu", "DV19", "TG", 56},
		{"VDV43", "Phạm Anh Quân", "nam", "DV20", "ĐL", 70}, {"VDV44", "Đỗ Thị Phương", "nu", "DV20", "ĐL", 48},
		// Extra VĐV for teams with 3+ entries
		{"VDV45", "Nguyễn Thành Đạt", "nam", "DV01", "BĐ", 70}, {"VDV46", "Trần Hương Giang", "nu", "DV01", "BĐ", 52},
		{"VDV47", "Lê Quốc Anh", "nam", "DV03", "HCM", 60}, {"VDV48", "Phạm Thị Bích", "nu", "DV03", "HCM", 45},
		{"VDV49", "Võ Đình Phong", "nam", "DV02", "HN", 48}, {"VDV50", "Nguyễn Ngọc Châu", "nu", "DV02", "HN", 56},
		{"VDV51", "Hoàng Trung Kiên", "nam", "DV04", "ĐN", 52}, {"VDV52", "Trần Thị Diệu", "nu", "DV04", "ĐN", 60},
		{"VDV53", "Bùi Xuân Trường", "nam", "DV05", "TH", 80}, {"VDV54", "Nguyễn Thị Hằng", "nu", "DV05", "TH", 52},
		{"VDV55", "Đặng Anh Dũng", "nam", "DV06", "NA", 48}, {"VDV56", "Lê Thanh Thúy", "nu", "DV06", "NA", 60},
		{"VDV57", "Phạm Tiến Dũng", "nam", "DV07", "Huế", 55}, {"VDV58", "Cao Thị Lan Anh", "nu", "DV07", "Huế", 45},
		{"VDV59", "Trần Hữu Nghĩa", "nam", "DV08", "BDg", 65}, {"VDV60", "Nguyễn Thị Thanh Trúc", "nu", "DV08", "BDg", 48},
	}
	out := make([]map[string]any, len(raw))
	for i, v := range raw {
		out[i] = map[string]any{"id": v.id, "ho_ten": v.ten, "gioi": v.gioi, "doan_id": v.doan, "doan_ten": v.doanTen, "can_nang": v.can, "trang_thai": "du_dieu_kien"}
	}
	return out
}

func seedSchedule() []map[string]any {
	days := []string{"2026-08-15", "2026-08-16", "2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20"}
	sessions := []struct{ phien, start, end string }{{"sang", "08:00", "11:30"}, {"chieu", "14:00", "17:30"}}
	contents := []struct {
		nd, san string
		tran    int
	}{
		{"Nam 55kg", "S01", 8}, {"Nam 60kg", "S01", 8}, {"Nam 65kg", "S03", 6}, {"Nam 70kg", "S03", 4},
		{"Nữ 48kg", "S01", 6}, {"Nữ 52kg", "S03", 6}, {"Ngọc Trản Quyền", "S02", 0}, {"Lão Mai Quyền", "S02", 0},
		{"Đồng Đội Quyền Nam", "S04", 0}, {"Roi Thuận", "S04", 0}, {"Nam 48kg", "S03", 4}, {"Nữ 56kg", "S01", 4},
	}
	var out []map[string]any
	seq := 1
	for di, day := range days {
		for si, s := range sessions {
			ci := (di*2 + si) % len(contents)
			c := contents[ci]
			out = append(out, map[string]any{
				"id": fmt.Sprintf("L%02d", seq), "ngay": day, "phien": s.phien,
				"gio_bat_dau": s.start, "gio_ket_thuc": s.end,
				"san_id": c.san, "noi_dung": c.nd, "so_tran": c.tran, "trang_thai": "xac_nhan",
			})
			seq++
		}
	}
	return out
}

func seedCombatMatches() []map[string]any {
	type m struct {
		id, san, hc, st                       string
		doID, doTen, doDoan, xID, xTen, xDoan string
		doD, xD                               int
	}
	raw := []m{
		{"TD01", "S01", "Nam 55kg", "ket_thuc", "VDV01", "Phạm Hoàng Nam", "BĐ", "VDV07", "Lý Quốc Huy", "HCM", 5, 2},
		{"TD02", "S01", "Nam 55kg", "ket_thuc", "VDV13", "Cao Minh Quân", "TH", "VDV21", "Lê Đình Khôi", "CT", 3, 4},
		{"TD03", "S01", "Nam 60kg", "ket_thuc", "VDV03", "Nguyễn Đức Mạnh", "BĐ", "VDV11", "Trương Văn Đạt", "ĐN", 4, 3},
		{"TD04", "S01", "Nam 60kg", "dang_dau", "VDV19", "Bùi Thanh Tú", "BDg", "VDV29", "Trần Quang Hải", "AG", 0, 0},
		{"TD05", "S03", "Nam 65kg", "ket_thuc", "VDV05", "Võ Minh Tuấn", "HN", "VDV15", "Nguyễn Hữu Phúc", "NA", 6, 3},
		{"TD06", "S03", "Nam 65kg", "chua_dau", "VDV23", "Phạm Quốc Đại", "ĐNai", "VDV37", "Nguyễn Hoàng Sơn", "QNg", 0, 0},
		{"TD07", "S01", "Nữ 48kg", "ket_thuc", "VDV04", "Trần Thị Lan", "BĐ", "VDV08", "Phan Ngọc Mai", "HCM", 3, 5},
		{"TD08", "S01", "Nữ 48kg", "chua_dau", "VDV16", "Trần Khánh Linh", "NA", "VDV22", "Nguyễn Thị Bảo Trâm", "CT", 0, 0},
		{"TD09", "S03", "Nữ 52kg", "ket_thuc", "VDV06", "Đỗ Thị Ngọc", "HN", "VDV12", "Lê Hoàng Yến", "ĐN", 4, 4},
		{"TD10", "S03", "Nam 70kg", "chua_dau", "VDV09", "Huỳnh Thanh Long", "HCM", "VDV17", "Đặng Quốc Toàn", "Huế", 0, 0},
		{"TD11", "S01", "Nam 48kg", "ket_thuc", "VDV31", "Đỗ Minh Trí", "QNam", "VDV49", "Võ Đình Phong", "HN", 2, 5},
		{"TD12", "S03", "Nam 80kg", "chua_dau", "VDV33", "Lê Hoàng Phúc", "BRVT", "VDV53", "Bùi Xuân Trường", "TH", 0, 0},
	}
	out := make([]map[string]any, len(raw))
	for i, v := range raw {
		out[i] = map[string]any{
			"id": v.id, "san_id": v.san, "hang_can": v.hc, "trang_thai": v.st,
			"vdv_do":   map[string]any{"id": v.doID, "ten": v.doTen, "doan": v.doDoan, "diem": v.doD},
			"vdv_xanh": map[string]any{"id": v.xID, "ten": v.xTen, "doan": v.xDoan, "diem": v.xD},
		}
	}
	return out
}

func seedFormPerformances() []map[string]any {
	type f struct {
		id, san, vdv, ten, doan, nd, tt string
		diem                            []float64
		tb                              float64
		xh                              int
	}
	raw := []f{
		{"Q01", "S02", "VDV02", "Lê Thu Hương", "HN", "Ngọc Trản Quyền", "da_cham", []float64{8.8, 8.9, 9.0, 8.7, 8.9}, 8.86, 1},
		{"Q02", "S02", "VDV04", "Trần Thị Lan", "BĐ", "Ngọc Trản Quyền", "da_cham", []float64{8.5, 8.7, 8.6, 8.8, 8.7}, 8.66, 2},
		{"Q03", "S02", "VDV08", "Phan Ngọc Mai", "HCM", "Ngọc Trản Quyền", "da_cham", []float64{8.3, 8.5, 8.4, 8.6, 8.5}, 8.46, 3},
		{"Q04", "S04", "VDV01", "Phạm Hoàng Nam", "BĐ", "Lão Mai Quyền", "da_cham", []float64{9.1, 9.0, 8.9, 9.2, 9.0}, 9.04, 1},
		{"Q05", "S04", "VDV07", "Lý Quốc Huy", "HCM", "Lão Mai Quyền", "da_cham", []float64{8.7, 8.8, 8.9, 8.6, 8.8}, 8.76, 2},
		{"Q06", "S04", "VDV13", "Cao Minh Quân", "TH", "Lão Mai Quyền", "da_cham", []float64{8.4, 8.5, 8.6, 8.3, 8.5}, 8.46, 3},
		{"Q07", "S02", "VDV39", "Cao Đức Vinh", "PY", "Roi Thuận", "da_cham", []float64{8.9, 9.0, 8.8, 9.1, 8.9}, 8.94, 1},
		{"Q08", "S02", "VDV57", "Phạm Tiến Dũng", "Huế", "Roi Thuận", "da_cham", []float64{8.6, 8.7, 8.5, 8.8, 8.7}, 8.66, 2},
		{"Q09", "S04", "VDV40", "Lê Thị Kim Oanh", "PY", "Kiếm Thuật", "dang_cham", []float64{}, 0, 0},
		{"Q10", "S04", "VDV28", "Võ Ngọc Diễm", "KH", "Kiếm Thuật", "cho_thi", []float64{}, 0, 0},
	}
	out := make([]map[string]any, len(raw))
	for i, v := range raw {
		out[i] = map[string]any{"id": v.id, "san_id": v.san, "vdv_id": v.vdv, "vdv_ten": v.ten, "doan_ten": v.doan, "noi_dung": v.nd, "diem": v.diem, "diem_tb": v.tb, "xep_hang": v.xh, "trang_thai": v.tt}
	}
	return out
}

func seedRegistrations() []map[string]any {
	type r struct{ id, vdv, ten, doan, doanTen, loai, nd, ndTen, tt string }
	raw := []r{
		{"DK01", "VDV01", "Phạm Hoàng Nam", "DV01", "BĐ", "doi_khang", "HC55", "Nam 55kg", "da_duyet"},
		{"DK02", "VDV01", "Phạm Hoàng Nam", "DV01", "BĐ", "quyen", "NDQ02", "Lão Mai Quyền", "da_duyet"},
		{"DK03", "VDV02", "Lê Thu Hương", "DV02", "HN", "quyen", "NDQ01", "Ngọc Trản Quyền", "da_duyet"},
		{"DK04", "VDV03", "Nguyễn Đức Mạnh", "DV01", "BĐ", "doi_khang", "HC60", "Nam 60kg", "da_duyet"},
		{"DK05", "VDV07", "Lý Quốc Huy", "DV03", "HCM", "doi_khang", "HC55", "Nam 55kg", "da_duyet"},
		{"DK06", "VDV05", "Võ Minh Tuấn", "DV02", "HN", "doi_khang", "HC65", "Nam 65kg", "da_duyet"},
		{"DK07", "VDV04", "Trần Thị Lan", "DV01", "BĐ", "doi_khang", "HCN48", "Nữ 48kg", "da_duyet"},
		{"DK08", "VDV08", "Phan Ngọc Mai", "DV03", "HCM", "doi_khang", "HCN48", "Nữ 48kg", "da_duyet"},
		{"DK09", "VDV06", "Đỗ Thị Ngọc", "DV02", "HN", "doi_khang", "HCN52", "Nữ 52kg", "da_duyet"},
		{"DK10", "VDV09", "Huỳnh Thanh Long", "DV03", "HCM", "doi_khang", "HC70", "Nam 70kg", "da_duyet"},
		{"DK11", "VDV43", "Phạm Anh Quân", "DV20", "ĐL", "doi_khang", "HC70", "Nam 70kg", "cho_duyet"},
		{"DK12", "VDV33", "Lê Hoàng Phúc", "DV15", "BRVT", "doi_khang", "HC80", "Nam 80kg", "da_duyet"},
	}
	out := make([]map[string]any, len(raw))
	for i, v := range raw {
		out[i] = map[string]any{"id": v.id, "vdv_id": v.vdv, "vdv_ten": v.ten, "doan_id": v.doan, "doan_ten": v.doanTen, "loai": v.loai, "nd_id": v.nd, "nd_ten": v.ndTen, "trang_thai": v.tt}
	}
	return out
}

func seedWeighIns() []map[string]any {
	type w struct {
		id, vdv, ten, doan, hc, kq string
		can                        float64
	}
	raw := []w{
		{"CAN01", "VDV01", "Phạm Hoàng Nam", "BĐ", "Nam 55kg", "dat", 54.8},
		{"CAN02", "VDV07", "Lý Quốc Huy", "HCM", "Nam 55kg", "dat", 54.5},
		{"CAN03", "VDV03", "Nguyễn Đức Mạnh", "BĐ", "Nam 60kg", "dat", 59.2},
		{"CAN04", "VDV05", "Võ Minh Tuấn", "HN", "Nam 65kg", "dat", 64.1},
		{"CAN05", "VDV04", "Trần Thị Lan", "BĐ", "Nữ 48kg", "dat", 47.6},
		{"CAN06", "VDV08", "Phan Ngọc Mai", "HCM", "Nữ 48kg", "dat", 47.9},
		{"CAN07", "VDV06", "Đỗ Thị Ngọc", "HN", "Nữ 52kg", "dat", 51.3},
		{"CAN08", "VDV09", "Huỳnh Thanh Long", "HCM", "Nam 70kg", "dat", 69.5},
	}
	out := make([]map[string]any, len(raw))
	for i, v := range raw {
		out[i] = map[string]any{"id": v.id, "vdv_id": v.vdv, "vdv_ten": v.ten, "doan_ten": v.doan, "hang_can_dk": v.hc, "can_thuc_te": v.can, "ket_qua": v.kq}
	}
	return out
}

func seedRefereeAssignments() []map[string]any {
	return []map[string]any{
		{"id": "PA01", "tt_id": "TT01", "san_id": "S01", "vai_tro": "chinh", "ngay": "2026-08-15", "phien": "sang"},
		{"id": "PA02", "tt_id": "TT03", "san_id": "S01", "vai_tro": "phu", "ngay": "2026-08-15", "phien": "sang"},
		{"id": "PA03", "tt_id": "TT02", "san_id": "S02", "vai_tro": "chinh", "ngay": "2026-08-15", "phien": "sang"},
		{"id": "PA04", "tt_id": "TT05", "san_id": "S03", "vai_tro": "chinh", "ngay": "2026-08-15", "phien": "chieu"},
		{"id": "PA05", "tt_id": "TT04", "san_id": "S04", "vai_tro": "chinh", "ngay": "2026-08-15", "phien": "chieu"},
		{"id": "PA06", "tt_id": "TT07", "san_id": "S01", "vai_tro": "chinh", "ngay": "2026-08-16", "phien": "sang"},
		{"id": "PA07", "tt_id": "TT10", "san_id": "S03", "vai_tro": "chinh", "ngay": "2026-08-16", "phien": "chieu"},
		{"id": "PA08", "tt_id": "TT06", "san_id": "S01", "vai_tro": "phu", "ngay": "2026-08-16", "phien": "sang"},
	}
}

func seedResults() []map[string]any {
	return []map[string]any{
		{"id": "RS01", "loai": "doi_khang", "noi_dung": "Nam 55kg", "vdv_ten": "Phạm Hoàng Nam", "doan": "BĐ", "ket_qua": "Thắng điểm", "diem": "5:2", "huy_chuong": ""},
		{"id": "RS02", "loai": "doi_khang", "noi_dung": "Nam 55kg", "vdv_ten": "Lê Đình Khôi", "doan": "CT", "ket_qua": "Thắng điểm", "diem": "4:3", "huy_chuong": ""},
		{"id": "RS03", "loai": "doi_khang", "noi_dung": "Nam 60kg", "vdv_ten": "Nguyễn Đức Mạnh", "doan": "BĐ", "ket_qua": "Thắng điểm", "diem": "4:3", "huy_chuong": ""},
		{"id": "RS04", "loai": "doi_khang", "noi_dung": "Nam 65kg", "vdv_ten": "Võ Minh Tuấn", "doan": "HN", "ket_qua": "Thắng điểm", "diem": "6:3", "huy_chuong": ""},
		{"id": "RS05", "loai": "quyen", "noi_dung": "Ngọc Trản Quyền", "vdv_ten": "Lê Thu Hương", "doan": "HN", "ket_qua": "8.86 điểm", "diem": "8.86", "huy_chuong": "vang"},
		{"id": "RS06", "loai": "quyen", "noi_dung": "Lão Mai Quyền", "vdv_ten": "Phạm Hoàng Nam", "doan": "BĐ", "ket_qua": "9.04 điểm", "diem": "9.04", "huy_chuong": "vang"},
		{"id": "RS07", "loai": "doi_khang", "noi_dung": "Nữ 48kg", "vdv_ten": "Phan Ngọc Mai", "doan": "HCM", "ket_qua": "Thắng điểm", "diem": "5:3", "huy_chuong": ""},
		{"id": "RS08", "loai": "doi_khang", "noi_dung": "Nam 48kg", "vdv_ten": "Võ Đình Phong", "doan": "HN", "ket_qua": "Thắng điểm", "diem": "5:2", "huy_chuong": ""},
	}
}
