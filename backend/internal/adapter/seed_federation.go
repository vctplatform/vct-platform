package adapter

import (
	"fmt"
	"time"

	"vct-platform/backend/internal/domain/certification"
	"vct-platform/backend/internal/domain/discipline"
	"vct-platform/backend/internal/domain/document"
	"vct-platform/backend/internal/domain/federation"
	intl "vct-platform/backend/internal/domain/international"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — SEED DATA FOR NATIONAL-LEVEL SUBSYSTEM
// Comprehensive mock data: 63 provinces, org hierarchy,
// personnel, certifications, discipline, documents, intl.
// ═══════════════════════════════════════════════════════════════

// ── Province Seed Data ───────────────────────────────────────

func SeedProvinces() map[string]federation.Province {
	now := time.Now().UTC()
	type prov struct {
		code    string
		name    string
		region  federation.RegionCode
		hasFed  bool
		clubs   int
		coaches int
		vdv     int
	}
	raw := []prov{
		// ── Miền Bắc (28 tỉnh/TP) ──
		{"HN", "TP Hà Nội", federation.RegionNorth, true, 45, 120, 850},
		{"HP", "TP Hải Phòng", federation.RegionNorth, true, 18, 40, 280},
		{"QN2", "Quảng Ninh", federation.RegionNorth, true, 12, 25, 180},
		{"BN", "Bắc Ninh", federation.RegionNorth, true, 10, 22, 150},
		{"HD", "Hải Dương", federation.RegionNorth, true, 8, 18, 120},
		{"HY", "Hưng Yên", federation.RegionNorth, false, 5, 10, 60},
		{"TB", "Thái Bình", federation.RegionNorth, true, 9, 20, 140},
		{"HA", "Hà Nam", federation.RegionNorth, false, 4, 8, 45},
		{"NB", "Ninh Bình", federation.RegionNorth, true, 7, 15, 95},
		{"ND", "Nam Định", federation.RegionNorth, true, 11, 24, 165},
		{"VP", "Vĩnh Phúc", federation.RegionNorth, false, 6, 12, 70},
		{"PT", "Phú Thọ", federation.RegionNorth, true, 8, 16, 105},
		{"BG", "Bắc Giang", federation.RegionNorth, true, 7, 14, 90},
		{"BK", "Bắc Kạn", federation.RegionNorth, false, 2, 4, 20},
		{"TN", "Thái Nguyên", federation.RegionNorth, true, 9, 18, 115},
		{"TQ", "Tuyên Quang", federation.RegionNorth, false, 3, 6, 30},
		{"YB", "Yên Bái", federation.RegionNorth, false, 3, 5, 25},
		{"LC", "Lào Cai", federation.RegionNorth, false, 4, 7, 35},
		{"LC2", "Lai Châu", federation.RegionNorth, false, 1, 2, 10},
		{"SL", "Sơn La", federation.RegionNorth, false, 3, 5, 22},
		{"DB", "Điện Biên", federation.RegionNorth, false, 2, 3, 12},
		{"HG", "Hà Giang", federation.RegionNorth, false, 2, 4, 15},
		{"CB", "Cao Bằng", federation.RegionNorth, false, 2, 3, 12},
		{"LS", "Lạng Sơn", federation.RegionNorth, false, 3, 6, 28},
		{"HB", "Hòa Bình", federation.RegionNorth, false, 4, 8, 40},
		// ── Miền Trung (19 tỉnh/TP) ──
		{"TH", "Thanh Hóa", federation.RegionCentral, true, 15, 35, 250},
		{"NA", "Nghệ An", federation.RegionCentral, true, 12, 28, 200},
		{"HT", "Hà Tĩnh", federation.RegionCentral, true, 8, 18, 120},
		{"QB", "Quảng Bình", federation.RegionCentral, false, 5, 10, 55},
		{"QT", "Quảng Trị", federation.RegionCentral, false, 4, 8, 40},
		{"TTH", "TT Huế", federation.RegionCentral, true, 14, 30, 210},
		{"DN", "TP Đà Nẵng", federation.RegionCentral, true, 20, 45, 320},
		{"QNM", "Quảng Nam", federation.RegionCentral, true, 10, 22, 150},
		{"QNG", "Quảng Ngãi", federation.RegionCentral, true, 8, 16, 100},
		{"BD", "Bình Định", federation.RegionCentral, true, 35, 80, 600},
		{"PY", "Phú Yên", federation.RegionCentral, true, 7, 14, 85},
		{"KH", "Khánh Hòa", federation.RegionCentral, true, 12, 25, 170},
		{"NT", "Ninh Thuận", federation.RegionCentral, false, 4, 8, 38},
		{"BT", "Bình Thuận", federation.RegionCentral, true, 9, 18, 110},
		{"GL", "Gia Lai", federation.RegionCentral, false, 5, 10, 50},
		{"KT", "Kon Tum", federation.RegionCentral, false, 3, 5, 22},
		{"DL", "Đắk Lắk", federation.RegionCentral, true, 8, 16, 95},
		{"DN2", "Đắk Nông", federation.RegionCentral, false, 3, 5, 20},
		{"LD", "Lâm Đồng", federation.RegionCentral, true, 7, 14, 80},
		// ── Miền Nam (19 tỉnh/TP) ──
		{"HCM", "TP Hồ Chí Minh", federation.RegionSouth, true, 55, 150, 1200},
		{"CT", "TP Cần Thơ", federation.RegionSouth, true, 14, 30, 200},
		{"BDG", "Bình Dương", federation.RegionSouth, true, 18, 40, 280},
		{"DNI", "Đồng Nai", federation.RegionSouth, true, 15, 32, 220},
		{"BR", "Bà Rịa - Vũng Tàu", federation.RegionSouth, true, 10, 20, 130},
		{"TG", "Tiền Giang", federation.RegionSouth, true, 8, 16, 100},
		{"LA", "Long An", federation.RegionSouth, true, 9, 18, 115},
		{"BL", "Bến Tre", federation.RegionSouth, false, 5, 10, 55},
		{"TV", "Trà Vinh", federation.RegionSouth, false, 4, 8, 40},
		{"VL", "Vĩnh Long", federation.RegionSouth, false, 6, 12, 65},
		{"DT", "Đồng Tháp", federation.RegionSouth, true, 7, 14, 85},
		{"AG", "An Giang", federation.RegionSouth, true, 10, 22, 140},
		{"KG", "Kiên Giang", federation.RegionSouth, true, 8, 16, 100},
		{"HGG", "Hậu Giang", federation.RegionSouth, false, 3, 6, 30},
		{"ST", "Sóc Trăng", federation.RegionSouth, false, 5, 10, 50},
		{"BLC", "Bạc Liêu", federation.RegionSouth, false, 4, 7, 32},
		{"CM", "Cà Mau", federation.RegionSouth, false, 4, 8, 38},
		{"TN2", "Tây Ninh", federation.RegionSouth, true, 7, 14, 80},
		{"BP", "Bình Phước", federation.RegionSouth, false, 5, 10, 48},
	}

	data := make(map[string]federation.Province, len(raw))
	for i, p := range raw {
		id := fmt.Sprintf("prov-%03d", i+1)
		data[id] = federation.Province{
			ID:         id,
			Code:       p.code,
			Name:       p.name,
			Region:     p.region,
			HasFed:     p.hasFed,
			ClubCount:  p.clubs,
			CoachCount: p.coaches,
			VDVCount:   p.vdv,
			CreatedAt:  now,
			UpdatedAt:  now,
		}
	}
	return data
}

// ── Federation Unit Seed Data ────────────────────────────────

func SeedFederationUnits() map[string]federation.FederationUnit {
	now := time.Now().UTC()
	units := []federation.FederationUnit{
		// Central
		{ID: "unit-central", Name: "Liên đoàn Võ thuật cổ truyền Việt Nam", ShortName: "LĐ VCT VN", Type: federation.UnitTypeCentral, Status: federation.UnitStatusActive, Address: "36 Trần Phú, Ba Đình, Hà Nội", Phone: "024-3733-5657", Email: "lienDoan@vct.vn", Website: "https://vct.vn", FoundedDate: "1991-06-15", LeaderName: "Nguyễn Danh Thái", LeaderTitle: "Chủ tịch", ClubCount: 520, MemberCount: 8500, CreatedAt: now, UpdatedAt: now},
		// Central Committees
		{ID: "unit-bkt", Name: "Ban Kỹ thuật", ShortName: "BKT", Type: federation.UnitTypeCommittee, ParentID: "unit-central", Status: federation.UnitStatusActive, LeaderName: "Trần Minh Đức", LeaderTitle: "Trưởng ban", CreatedAt: now, UpdatedAt: now},
		{ID: "unit-btt", Name: "Ban Trọng tài", ShortName: "BTT", Type: federation.UnitTypeCommittee, ParentID: "unit-central", Status: federation.UnitStatusActive, LeaderName: "Lê Hữu Phước", LeaderTitle: "Trưởng ban", CreatedAt: now, UpdatedAt: now},
		{ID: "unit-byt", Name: "Ban Y tế - Phòng chống doping", ShortName: "BYT", Type: federation.UnitTypeCommittee, ParentID: "unit-central", Status: federation.UnitStatusActive, LeaderName: "Phạm Thị Lan", LeaderTitle: "Trưởng ban", CreatedAt: now, UpdatedAt: now},
		{ID: "unit-btc", Name: "Ban Tổ chức - Thi đấu", ShortName: "BTC", Type: federation.UnitTypeCommittee, ParentID: "unit-central", Status: federation.UnitStatusActive, LeaderName: "Võ Quốc Hùng", LeaderTitle: "Trưởng ban", CreatedAt: now, UpdatedAt: now},
		{ID: "unit-bkl", Name: "Ban Kỷ luật", ShortName: "BKL", Type: federation.UnitTypeCommittee, ParentID: "unit-central", Status: federation.UnitStatusActive, LeaderName: "Hồ Sỹ Nam", LeaderTitle: "Trưởng ban", CreatedAt: now, UpdatedAt: now},
		{ID: "unit-bdt", Name: "Ban Đào tạo - Phong trào", ShortName: "BĐT", Type: federation.UnitTypeCommittee, ParentID: "unit-central", Status: federation.UnitStatusActive, LeaderName: "Nguyễn Thị Mai", LeaderTitle: "Trưởng ban", CreatedAt: now, UpdatedAt: now},
		// Provincial Units (top 10 provinces)
		{ID: "unit-hcm", Name: "LĐ Võ thuật cổ truyền TP.HCM", ShortName: "LĐ HCM", Type: federation.UnitTypeProvince, ParentID: "unit-central", ProvinceID: "prov-045", Status: federation.UnitStatusActive, Address: "55 Nguyễn Thị Minh Khai, Q.1, HCM", Phone: "028-3829-1234", Email: "hcm@vct.vn", FoundedDate: "1995-03-20", LeaderName: "Lý Thanh Tùng", LeaderTitle: "Chủ tịch", ClubCount: 55, MemberCount: 1200, CreatedAt: now, UpdatedAt: now},
		{ID: "unit-hn", Name: "LĐ Võ thuật cổ truyền Hà Nội", ShortName: "LĐ HN", Type: federation.UnitTypeProvince, ParentID: "unit-central", ProvinceID: "prov-001", Status: federation.UnitStatusActive, Address: "1 Trịnh Hoài Đức, Đống Đa, HN", Phone: "024-3851-5678", Email: "hn@vct.vn", FoundedDate: "1993-08-10", LeaderName: "Trần Tuấn Anh", LeaderTitle: "Chủ tịch", ClubCount: 45, MemberCount: 850, CreatedAt: now, UpdatedAt: now},
		{ID: "unit-bd", Name: "LĐ Võ thuật cổ truyền Bình Định", ShortName: "LĐ BĐ", Type: federation.UnitTypeProvince, ParentID: "unit-central", ProvinceID: "prov-035", Status: federation.UnitStatusActive, Address: "17 Nguyễn Huệ, Quy Nhơn, BĐ", Phone: "0256-382-9999", Email: "bd@vct.vn", FoundedDate: "1992-01-05", LeaderName: "Nguyễn Văn Trọng", LeaderTitle: "Chủ tịch", ClubCount: 35, MemberCount: 600, CreatedAt: now, UpdatedAt: now},
		{ID: "unit-dn", Name: "LĐ Võ thuật cổ truyền Đà Nẵng", ShortName: "LĐ ĐN", Type: federation.UnitTypeProvince, ParentID: "unit-central", ProvinceID: "prov-032", Status: federation.UnitStatusActive, Address: "20 Phan Châu Trinh, Hải Châu, ĐN", Phone: "0236-356-7890", Email: "dn@vct.vn", FoundedDate: "1997-05-01", LeaderName: "Phan Quốc Việt", LeaderTitle: "Chủ tịch", ClubCount: 20, MemberCount: 320, CreatedAt: now, UpdatedAt: now},
		{ID: "unit-bdg", Name: "LĐ Võ thuật cổ truyền Bình Dương", ShortName: "LĐ BDg", Type: federation.UnitTypeProvince, ParentID: "unit-central", ProvinceID: "prov-047", Status: federation.UnitStatusActive, Email: "bdg@vct.vn", LeaderName: "Hoàng Minh Tuấn", LeaderTitle: "Chủ tịch", ClubCount: 18, MemberCount: 280, CreatedAt: now, UpdatedAt: now},
		{ID: "unit-th", Name: "LĐ Võ thuật cổ truyền Thanh Hóa", ShortName: "LĐ TH", Type: federation.UnitTypeProvince, ParentID: "unit-central", ProvinceID: "prov-026", Status: federation.UnitStatusActive, Email: "th@vct.vn", LeaderName: "Lê Đình Hải", LeaderTitle: "Chủ tịch", ClubCount: 15, MemberCount: 250, CreatedAt: now, UpdatedAt: now},
		{ID: "unit-tth", Name: "LĐ Võ thuật cổ truyền TT Huế", ShortName: "LĐ Huế", Type: federation.UnitTypeProvince, ParentID: "unit-central", ProvinceID: "prov-031", Status: federation.UnitStatusActive, Email: "hue@vct.vn", LeaderName: "Trương Văn Khoa", LeaderTitle: "Chủ tịch", ClubCount: 14, MemberCount: 210, CreatedAt: now, UpdatedAt: now},
		{ID: "unit-ct", Name: "LĐ Võ thuật cổ truyền Cần Thơ", ShortName: "LĐ CT", Type: federation.UnitTypeProvince, ParentID: "unit-central", ProvinceID: "prov-046", Status: federation.UnitStatusActive, Email: "ct@vct.vn", LeaderName: "Đặng Minh Phụng", LeaderTitle: "Chủ tịch", ClubCount: 14, MemberCount: 200, CreatedAt: now, UpdatedAt: now},
		{ID: "unit-na", Name: "LĐ Võ thuật cổ truyền Nghệ An", ShortName: "LĐ NA", Type: federation.UnitTypeProvince, ParentID: "unit-central", ProvinceID: "prov-027", Status: federation.UnitStatusActive, Email: "na@vct.vn", LeaderName: "Cao Xuân Hà", LeaderTitle: "Chủ tịch", ClubCount: 12, MemberCount: 200, CreatedAt: now, UpdatedAt: now},
		{ID: "unit-dni", Name: "LĐ Võ thuật cổ truyền Đồng Nai", ShortName: "LĐ ĐNai", Type: federation.UnitTypeProvince, ParentID: "unit-central", ProvinceID: "prov-048", Status: federation.UnitStatusActive, Email: "dni@vct.vn", LeaderName: "Bùi Danh Liêm", LeaderTitle: "Chủ tịch", ClubCount: 15, MemberCount: 220, CreatedAt: now, UpdatedAt: now},
	}

	data := make(map[string]federation.FederationUnit, len(units))
	for _, u := range units {
		data[u.ID] = u
	}
	return data
}

// ── Personnel Seed Data ──────────────────────────────────────

func SeedPersonnel() map[string]federation.PersonnelAssignment {
	now := time.Now().UTC()
	personnel := []federation.PersonnelAssignment{
		// Central leadership
		{ID: "pers-001", UserID: "user-ct01", UserName: "Nguyễn Danh Thái", UnitID: "unit-central", UnitName: "LĐ VCT VN", Position: "Chủ tịch", RoleCode: "president", StartDate: "2020-01-15", IsActive: true, DecisionNo: "QĐ-001/2020/LĐ", CreatedAt: now},
		{ID: "pers-002", UserID: "user-ct02", UserName: "Lê Minh Hoàng", UnitID: "unit-central", UnitName: "LĐ VCT VN", Position: "Phó Chủ tịch thường trực", RoleCode: "vice_president", StartDate: "2020-01-15", IsActive: true, DecisionNo: "QĐ-002/2020/LĐ", CreatedAt: now},
		{ID: "pers-003", UserID: "user-ct03", UserName: "Phạm Văn An", UnitID: "unit-central", UnitName: "LĐ VCT VN", Position: "Tổng Thư ký", RoleCode: "secretary_general", StartDate: "2020-01-15", IsActive: true, DecisionNo: "QĐ-003/2020/LĐ", CreatedAt: now},
		{ID: "pers-004", UserID: "user-ct04", UserName: "Trần Thị Bích Ngọc", UnitID: "unit-central", UnitName: "LĐ VCT VN", Position: "Phó Chủ tịch", RoleCode: "vice_president", StartDate: "2020-02-01", IsActive: true, CreatedAt: now},
		// Committee heads
		{ID: "pers-005", UserID: "user-bkt01", UserName: "Trần Minh Đức", UnitID: "unit-bkt", UnitName: "Ban Kỹ thuật", Position: "Trưởng ban", RoleCode: "committee_head", StartDate: "2021-03-01", IsActive: true, CreatedAt: now},
		{ID: "pers-006", UserID: "user-btt01", UserName: "Lê Hữu Phước", UnitID: "unit-btt", UnitName: "Ban Trọng tài", Position: "Trưởng ban", RoleCode: "committee_head", StartDate: "2021-03-01", IsActive: true, CreatedAt: now},
		{ID: "pers-007", UserID: "user-byt01", UserName: "Phạm Thị Lan", UnitID: "unit-byt", UnitName: "Ban Y tế", Position: "Trưởng ban", RoleCode: "committee_head", StartDate: "2021-03-01", IsActive: true, CreatedAt: now},
		{ID: "pers-008", UserID: "user-btc01", UserName: "Võ Quốc Hùng", UnitID: "unit-btc", UnitName: "Ban Tổ chức", Position: "Trưởng ban", RoleCode: "committee_head", StartDate: "2021-03-01", IsActive: true, CreatedAt: now},
		{ID: "pers-009", UserID: "user-bkl01", UserName: "Hồ Sỹ Nam", UnitID: "unit-bkl", UnitName: "Ban Kỷ luật", Position: "Trưởng ban", RoleCode: "committee_head", StartDate: "2021-03-01", IsActive: true, CreatedAt: now},
		{ID: "pers-010", UserID: "user-bdt01", UserName: "Nguyễn Thị Mai", UnitID: "unit-bdt", UnitName: "Ban Đào tạo", Position: "Trưởng ban", RoleCode: "committee_head", StartDate: "2021-03-01", IsActive: true, CreatedAt: now},
		// Provincial leaders
		{ID: "pers-011", UserID: "user-hcm01", UserName: "Lý Thanh Tùng", UnitID: "unit-hcm", UnitName: "LĐ HCM", Position: "Chủ tịch", RoleCode: "province_president", StartDate: "2019-06-01", IsActive: true, CreatedAt: now},
		{ID: "pers-012", UserID: "user-hn01", UserName: "Trần Tuấn Anh", UnitID: "unit-hn", UnitName: "LĐ HN", Position: "Chủ tịch", RoleCode: "province_president", StartDate: "2020-01-10", IsActive: true, CreatedAt: now},
		{ID: "pers-013", UserID: "user-bd01", UserName: "Nguyễn Văn Trọng", UnitID: "unit-bd", UnitName: "LĐ BĐ", Position: "Chủ tịch", RoleCode: "province_president", StartDate: "2018-09-01", IsActive: true, CreatedAt: now},
		{ID: "pers-014", UserID: "user-dn01", UserName: "Phan Quốc Việt", UnitID: "unit-dn", UnitName: "LĐ ĐN", Position: "Chủ tịch", RoleCode: "province_president", StartDate: "2021-01-15", IsActive: true, CreatedAt: now},
		{ID: "pers-015", UserID: "user-ct01b", UserName: "Đặng Minh Phụng", UnitID: "unit-ct", UnitName: "LĐ CT", Position: "Chủ tịch", RoleCode: "province_president", StartDate: "2022-03-01", IsActive: true, CreatedAt: now},
	}

	data := make(map[string]federation.PersonnelAssignment, len(personnel))
	for _, p := range personnel {
		data[p.ID] = p
	}
	return data
}

// ── Certification Seed Data ──────────────────────────────────

func SeedCertifications() map[string]certification.Certificate {
	now := time.Now().UTC()
	certs := []certification.Certificate{
		{ID: "cert-001", CertNumber: "HLV-2025-0042", Type: certification.CertCoach, HolderType: "person", HolderID: "user-bd01", HolderName: "Nguyễn Văn Trọng", Grade: "Cấp quốc gia", Status: certification.CertStatusActive, IssuedBy: "unit-central", IssuedByName: "LĐ VCT VN", IssuedAt: now, ValidFrom: "2025-01-01", ValidUntil: "2029-12-31", VerifyCode: "VCT-HLV-2025-0042", ProvinceID: "prov-035", DecisionNo: "QĐ-42/2025/LĐ", CreatedAt: now, UpdatedAt: now},
		{ID: "cert-002", CertNumber: "TT-2025-0015", Type: certification.CertReferee, HolderType: "person", HolderID: "user-btt01", HolderName: "Lê Hữu Phước", Grade: "Trọng tài quốc gia", Status: certification.CertStatusActive, IssuedBy: "unit-central", IssuedByName: "LĐ VCT VN", IssuedAt: now, ValidFrom: "2025-03-01", ValidUntil: "2028-02-28", VerifyCode: "VCT-TT-2025-0015", DecisionNo: "QĐ-15/2025/LĐ", CreatedAt: now, UpdatedAt: now},
		{ID: "cert-003", CertNumber: "CLB-2024-0088", Type: certification.CertClub, HolderType: "club", HolderID: "club-bd01", HolderName: "CLB Võ Bình Định - Quy Nhơn", Grade: "Hạng A", Status: certification.CertStatusActive, IssuedBy: "unit-bd", IssuedByName: "LĐ BĐ", IssuedAt: now, ValidFrom: "2024-06-01", ValidUntil: "2027-05-31", VerifyCode: "VCT-CLB-2024-0088", ProvinceID: "prov-035", CreatedAt: now, UpdatedAt: now},
		{ID: "cert-004", CertNumber: "DAI-2025-0123", Type: certification.CertBeltRank, HolderType: "person", HolderID: "VDV01", HolderName: "Phạm Hoàng Nam", Grade: "Đai đen nhị đẳng", Status: certification.CertStatusActive, IssuedBy: "unit-central", IssuedByName: "LĐ VCT VN", IssuedAt: now, ValidFrom: "2025-08-01", VerifyCode: "VCT-DAI-2025-0123", ProvinceID: "prov-035", CreatedAt: now, UpdatedAt: now},
		{ID: "cert-005", CertNumber: "HLV-2023-0091", Type: certification.CertCoach, HolderType: "person", HolderID: "user-hcm02", HolderName: "Trần Quang Vinh", Grade: "Cấp 1", Status: certification.CertStatusExpiring, IssuedBy: "unit-hcm", IssuedByName: "LĐ HCM", IssuedAt: now.AddDate(-2, 0, 0), ValidFrom: "2023-04-01", ValidUntil: "2026-03-31", VerifyCode: "VCT-HLV-2023-0091", ProvinceID: "prov-045", CreatedAt: now.AddDate(-2, 0, 0), UpdatedAt: now},
	}

	data := make(map[string]certification.Certificate, len(certs))
	for _, c := range certs {
		data[c.ID] = c
	}
	return data
}

// ── Discipline Seed Data ─────────────────────────────────────

func SeedDisciplineCases() map[string]*discipline.DisciplineCase {
	now := time.Now().UTC()
	cases := []*discipline.DisciplineCase{
		{ID: "case-001", CaseNumber: "KL-2026-001", ViolationType: discipline.ViolWeightFraud, SubjectType: "athlete", SubjectID: "VDV-FAKE-01", SubjectName: "Nguyễn Văn X", Description: "VĐV khai gian cân nặng để thi đấu hạng cân thấp hơn", TournamentID: "TOURNAMENT-2026", Status: discipline.CaseStatusInvestigating, ReportedBy: "user-btt01", ReportedByName: "Lê Hữu Phước", InvestigatorID: "user-bkl01", Evidence: []discipline.Evidence{{ID: "ev-001", Type: "document", Description: "Biên bản cân kỹ thuật", AddedBy: "user-btt01", AddedAt: now.Format(time.RFC3339)}}, CreatedAt: now.AddDate(0, 0, -5), UpdatedAt: now},
		{ID: "case-002", CaseNumber: "KL-2026-002", ViolationType: discipline.ViolUnsportsmanlike, SubjectType: "athlete", SubjectID: "VDV-FAKE-02", SubjectName: "Trần Văn Y", Description: "Hành vi phi thể thao trong trận đấu vòng loại", TournamentID: "TOURNAMENT-2026", Status: discipline.CaseStatusDecided, ReportedBy: "user-btc01", ReportedByName: "Võ Quốc Hùng", Sanctions: []discipline.Sanction{{ID: "sanc-001", Type: discipline.SanctionWarning, StartDate: now.Format("2006-01-02"), DecidedBy: "user-bkl01", DecidedAt: now.Format(time.RFC3339), Reason: "Vi phạm lần đầu — cảnh cáo"}}, CreatedAt: now.AddDate(0, 0, -3), UpdatedAt: now},
		{ID: "case-003", CaseNumber: "KL-2025-015", ViolationType: discipline.ViolAdminBreach, SubjectType: "club", SubjectID: "club-hcm-05", SubjectName: "CLB Tân Bình", Description: "CLB không nộp báo cáo hoạt động năm 2025 đúng hạn", Status: discipline.CaseStatusFinal, ReportedBy: "user-hcm01", ReportedByName: "Lý Thanh Tùng", Sanctions: []discipline.Sanction{{ID: "sanc-002", Type: discipline.SanctionFine, Amount: 2000000, StartDate: "2025-12-01", DecidedBy: "user-bkl01", DecidedAt: "2025-12-15T10:00:00Z", Reason: "Vi phạm quy chế báo cáo — phạt 2 triệu đồng"}}, CreatedAt: now.AddDate(0, -3, 0), UpdatedAt: now.AddDate(0, -2, 0)},
	}

	data := make(map[string]*discipline.DisciplineCase, len(cases))
	for _, c := range cases {
		data[c.ID] = c
	}
	return data
}

// ── Document Seed Data ───────────────────────────────────────

func SeedDocuments() map[string]*document.OfficialDocument {
	now := time.Now().UTC()
	docs := []*document.OfficialDocument{
		{ID: "doc-001", Number: "QĐ-01/2026/LĐ-VCT", Type: document.DocTypeDecision, Title: "Quyết định tổ chức Giải Vô địch Võ cổ truyền toàn quốc 2026", Summary: "Phê duyệt kế hoạch tổ chức giải VĐ VCT toàn quốc tại Bình Định, 15-20/08/2026", IssuedBy: "unit-central", IssuedByName: "LĐ VCT VN", EffectiveDate: "2026-01-15", SignedBy: "user-ct01", SignedByName: "Nguyễn Danh Thái", Status: document.DocStatusPublished, PublishedAt: &now, EntityLinks: []document.EntityLink{{EntityType: document.LinkTournament, EntityID: "TOURNAMENT-2026", EntityName: "Giải VĐ VCT 2026", LinkType: "primary"}}, CreatedAt: now, UpdatedAt: now},
		{ID: "doc-002", Number: "TB-05/2026/LĐ-VCT", Type: document.DocTypeNotice, Title: "Thông báo mở đăng ký tham dự Giải VĐ VCT toàn quốc 2026", Summary: "Thời hạn đăng ký: 01/04 - 31/07/2026. Mỗi đoàn tối đa 3 VĐV/nội dung.", IssuedBy: "unit-central", IssuedByName: "LĐ VCT VN", EffectiveDate: "2026-03-01", SignedBy: "user-ct03", SignedByName: "Phạm Văn An", Status: document.DocStatusPublished, PublishedAt: &now, CreatedAt: now, UpdatedAt: now},
		{ID: "doc-003", Number: "QC-02/2026/LĐ-VCT", Type: document.DocTypeRegulation, Title: "Quy chế thi đấu Giải VĐ Võ cổ truyền toàn quốc 2026", Summary: "Quy chế chi tiết về thể lệ, nội dung thi đấu, tiêu chuẩn trọng tài, phân hạng cân", IssuedBy: "unit-bkt", IssuedByName: "Ban Kỹ thuật", EffectiveDate: "2026-02-20", SignedBy: "user-bkt01", SignedByName: "Trần Minh Đức", Status: document.DocStatusPublished, PublishedAt: &now, Attachments: []document.Attachment{{Name: "quy_che_2026.pdf", URL: "/docs/quy_che_2026.pdf", MimeType: "application/pdf", SizeKB: 2450}}, CreatedAt: now, UpdatedAt: now},
		{ID: "doc-004", Number: "BC-03/2026/LĐ-VCT", Type: document.DocTypeReport, Title: "Báo cáo tình hình hoạt động Liên đoàn 6 tháng đầu năm 2026", Summary: "Tổng hợp kết quả hoạt động: 12 giải đấu, 520 CLB, 8500 hội viên", IssuedBy: "unit-central", IssuedByName: "LĐ VCT VN", EffectiveDate: "2026-07-15", SignedBy: "user-ct03", SignedByName: "Phạm Văn An", Status: document.DocStatusDraft, CreatedAt: now, UpdatedAt: now},
		{ID: "doc-005", Number: "QĐ-18/2026/LĐ-VCT", Type: document.DocTypeDecision, Title: "Quyết định bổ nhiệm Trưởng ban trọng tài Giải toàn quốc 2026", Summary: "Bổ nhiệm ông Lê Hữu Phước làm Trưởng ban trọng tài giải VĐ VCT 2026", IssuedBy: "unit-central", IssuedByName: "LĐ VCT VN", EffectiveDate: "2026-06-01", SignedBy: "user-ct01", SignedByName: "Nguyễn Danh Thái", Status: document.DocStatusPublished, PublishedAt: &now, EntityLinks: []document.EntityLink{{EntityType: document.LinkReferee, EntityID: "user-btt01", EntityName: "Lê Hữu Phước", LinkType: "subject"}}, CreatedAt: now, UpdatedAt: now},
	}

	data := make(map[string]*document.OfficialDocument, len(docs))
	for _, d := range docs {
		data[d.ID] = d
	}
	return data
}

// ── International Seed Data ──────────────────────────────────

func SeedPartners() map[string]intl.PartnerOrganization {
	now := time.Now().UTC()
	partners := []intl.PartnerOrganization{
		{ID: "partner-001", Name: "International Vovinam Federation (IVF)", Country: "France", CountryCode: "FR", OrgType: "federation", ContactName: "Master Nguyen Van Chieu", ContactEmail: "contact@vovinam-ivf.org", Website: "https://vovinam-ivf.org", Status: intl.PartnerActive, MouSigned: true, CreatedAt: now, UpdatedAt: now},
		{ID: "partner-002", Name: "Asian Traditional Martial Arts Federation", Country: "South Korea", CountryCode: "KR", OrgType: "federation", ContactName: "Dr. Kim Sung Ho", ContactEmail: "info@atmaf.org", Website: "https://atmaf.org", Status: intl.PartnerActive, MouSigned: true, CreatedAt: now, UpdatedAt: now},
		{ID: "partner-003", Name: "World Traditional Martial Arts Committee", Country: "Japan", CountryCode: "JP", OrgType: "committee", ContactName: "Prof. Tanaka Hiroshi", ContactEmail: "wtmac@martial-arts.jp", Website: "https://wtmac.jp", Status: intl.PartnerPending, MouSigned: false, CreatedAt: now, UpdatedAt: now},
	}

	data := make(map[string]intl.PartnerOrganization, len(partners))
	for _, p := range partners {
		data[p.ID] = p
	}
	return data
}

func SeedInternationalEvents() map[string]intl.InternationalEvent {
	now := time.Now().UTC()
	events := []intl.InternationalEvent{
		{ID: "intl-evt-001", Name: "Giải Vovinam Thế giới lần thứ 7", EventType: intl.EventCompetition, HostCountry: "Algeria", HostCity: "Algiers", PartnerOrgID: "partner-001", HostOrg: "IVF", StartDate: now.AddDate(0, 3, 0), EndDate: now.AddDate(0, 3, 7), Status: "upcoming", Budget: 500000000, CreatedAt: now},
		{ID: "intl-evt-002", Name: "Hội thảo Võ cổ truyền Châu Á 2026", EventType: intl.EventSeminar, HostCountry: "Vietnam", HostCity: "Hà Nội", PartnerOrgID: "unit-central", HostOrg: "LĐ VCT VN", StartDate: now.AddDate(0, 6, 0), EndDate: now.AddDate(0, 6, 3), Status: "planning", Budget: 200000000, CreatedAt: now},
	}

	data := make(map[string]intl.InternationalEvent, len(events))
	for _, e := range events {
		data[e.ID] = e
	}
	return data
}

func SeedDelegations() map[string]intl.Delegation {
	now := time.Now().UTC()
	delegations := []intl.Delegation{
		{ID: "deleg-001", EventID: "intl-evt-001", TeamName: "Đoàn Việt Nam tham dự Giải Vovinam TG lần 7", DelegationType: intl.DelegationOutbound, HeadOfDelegation: "Nguyễn Danh Thái", Status: intl.DelegationPlanning, Members: []intl.DelegationMember{
			{ID: "dm-001", PersonName: "Nguyễn Danh Thái", Role: "Trưởng đoàn"},
			{ID: "dm-002", PersonName: "Trần Minh Đức", Role: "HLV trưởng"},
			{ID: "dm-003", PersonName: "Phạm Hoàng Nam", Role: "VĐV", AthleteID: "VDV01"},
			{ID: "dm-004", PersonName: "Lê Thu Hương", Role: "VĐV", AthleteID: "VDV02"},
		}, TotalBudget: 350000000, Notes: "Dự kiến 12 VĐV + 3 HLV + 2 trọng tài + ban lãnh đạo", CreatedAt: now, UpdatedAt: now},
		{ID: "deleg-002", EventID: "intl-evt-002", TeamName: "Đoàn Hàn Quốc tham dự Hội thảo VCT Châu Á", DelegationType: intl.DelegationInbound, HeadOfDelegation: "Dr. Kim Sung Ho", Status: intl.DelegationApproved, Members: []intl.DelegationMember{
			{ID: "dm-005", PersonName: "Dr. Kim Sung Ho", Role: "Trưởng đoàn"},
			{ID: "dm-006", PersonName: "Park Ji Yeon", Role: "Chuyên gia kỹ thuật"},
		}, CreatedAt: now, UpdatedAt: now},
	}

	data := make(map[string]intl.Delegation, len(delegations))
	for _, d := range delegations {
		data[d.ID] = d
	}
	return data
}
