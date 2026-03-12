package tournament

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Tournament Export Utilities
// Generates CSV/tabular data for tournament management exports
// ═══════════════════════════════════════════════════════════════

import (
	"fmt"
	"strings"
)

// ExportFormat defines the output format.
type ExportFormat string

const (
	ExportCSV ExportFormat = "csv"
)

// ── Registration Export ─────────────────────────────────────

// ExportRegistrationsToCSV generates CSV content for a list of registrations.
func ExportRegistrationsToCSV(registrations []*Registration) string {
	var b strings.Builder
	b.WriteString("STT,Tên Đoàn,Tỉnh/TP,Loại,HLV Trưởng,Số VĐV,Số Nội Dung,Trạng Thái,Ngày Đăng Ký\n")
	for i, r := range registrations {
		submittedAt := ""
		if r.SubmittedAt != nil {
			submittedAt = r.SubmittedAt.Format("02/01/2006")
		}
		b.WriteString(fmt.Sprintf("%d,\"%s\",\"%s\",%s,\"%s\",%d,%d,%s,%s\n",
			i+1, r.TeamName, r.Province, translateTeamType(r.TeamType),
			r.HeadCoach, r.TotalAthletes, r.TotalContents,
			translateRegStatus(r.Status), submittedAt))
	}
	return b.String()
}

// ── Athletes Export ──────────────────────────────────────────

// ExportAthletesToCSV generates CSV content for registered athletes.
func ExportAthletesToCSV(athletes []*RegistrationAthlete) string {
	var b strings.Builder
	b.WriteString("STT,Họ Tên,Ngày Sinh,Giới Tính,Cân Nặng,Đai,Trạng Thái\n")
	for i, a := range athletes {
		gender := "Nam"
		if a.Gender == "nu" {
			gender = "Nữ"
		}
		b.WriteString(fmt.Sprintf("%d,\"%s\",%s,%s,%.1f,%s,%s\n",
			i+1, a.AthleteName, a.DateOfBirth, gender,
			a.Weight, a.BeltRank, translateAthleteStatus(a.Status)))
	}
	return b.String()
}

// ── Results Export ───────────────────────────────────────────

// ExportResultsToCSV generates CSV content for tournament results.
func ExportResultsToCSV(results []*TournamentResult) string {
	var b strings.Builder
	b.WriteString("STT,Nội Dung,Loại,HCV,Đoàn HCV,HCB,Đoàn HCB,HCĐ 1,Đoàn HCĐ 1,HCĐ 2,Đoàn HCĐ 2,Xác Nhận\n")
	for i, r := range results {
		confirmed := "Chưa"
		if r.IsFinalized {
			confirmed = "Đã xác nhận"
		}
		b.WriteString(fmt.Sprintf("%d,\"%s\",%s,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%s\n",
			i+1, r.CategoryName, r.ContentType,
			r.GoldName, r.GoldTeam, r.SilverName, r.SilverTeam,
			r.Bronze1Name, r.Bronze1Team, r.Bronze2Name, r.Bronze2Team, confirmed))
	}
	return b.String()
}

// ── Standings Export ─────────────────────────────────────────

// ExportStandingsToCSV generates CSV content for team standings.
func ExportStandingsToCSV(standings []*TeamStanding) string {
	var b strings.Builder
	b.WriteString("Hạng,Đoàn,Tỉnh/TP,Vàng,Bạc,Đồng,Tổng HC,Điểm\n")
	for _, s := range standings {
		b.WriteString(fmt.Sprintf("%d,\"%s\",\"%s\",%d,%d,%d,%d,%d\n",
			s.Rank, s.TeamName, s.Province, s.Gold, s.Silver, s.Bronze, s.TotalMedals, s.Points))
	}
	return b.String()
}

// ── Schedule Export ──────────────────────────────────────────

// ExportScheduleToCSV generates CSV content for tournament schedule.
func ExportScheduleToCSV(slots []*ScheduleSlot) string {
	var b strings.Builder
	b.WriteString("STT,Ngày,Phiên,Sân,Giờ BĐ,Giờ KT,Nội Dung,Loại,Số Trận,Trạng Thái\n")
	for i, s := range slots {
		b.WriteString(fmt.Sprintf("%d,%s,%s,\"%s\",%s,%s,\"%s\",%s,%d,%s\n",
			i+1, s.Date, translateSession(s.Session), s.ArenaName,
			s.StartTime, s.EndTime, s.CategoryName, s.ContentType,
			s.MatchCount, translateSlotStatus(s.Status)))
	}
	return b.String()
}

// ── Category Export ──────────────────────────────────────────

// ExportCategoriesToCSV generates CSV content for tournament categories.
func ExportCategoriesToCSV(categories []*Category) string {
	var b strings.Builder
	b.WriteString("STT,Tên,Loại Nội Dung,Lứa Tuổi,Hạng Cân,Giới Tính,Sự Kiện Đội,Trạng Thái\n")
	for i, c := range categories {
		gender := "Nam"
		if c.Gender == "nu" {
			gender = "Nữ"
		}
		isTeam := "Cá nhân"
		if c.IsTeamEvent {
			isTeam = "Đội"
		}
		b.WriteString(fmt.Sprintf("%d,\"%s\",%s,%s,%s,%s,%s,%s\n",
			i+1, c.Name, c.ContentType, c.AgeGroup,
			c.WeightClass, gender, isTeam, translateCategoryStatus(c.Status)))
	}
	return b.String()
}

// ── Translation helpers ─────────────────────────────────────

func translateTeamType(t string) string {
	switch t {
	case "doan_tinh":
		return "Đoàn tỉnh"
	case "clb":
		return "CLB"
	case "ca_nhan":
		return "Cá nhân"
	default:
		return t
	}
}

func translateRegStatus(s string) string {
	switch s {
	case "nhap":
		return "Nháp"
	case "cho_duyet":
		return "Chờ duyệt"
	case "da_duyet":
		return "Đã duyệt"
	case "tu_choi":
		return "Từ chối"
	case "yeu_cau_bo_sung":
		return "Yêu cầu bổ sung"
	default:
		return s
	}
}

func translateAthleteStatus(s string) string {
	switch s {
	case "du_dieu_kien":
		return "Đủ điều kiện"
	case "thieu_ho_so":
		return "Thiếu hồ sơ"
	case "cho_xac_nhan":
		return "Chờ xác nhận"
	default:
		return s
	}
}

func translateSession(s string) string {
	switch s {
	case "sang":
		return "Sáng"
	case "chieu":
		return "Chiều"
	case "toi":
		return "Tối"
	case "ca_ngay":
		return "Cả ngày"
	default:
		return s
	}
}

func translateSlotStatus(s string) string {
	switch s {
	case "du_kien":
		return "Dự kiến"
	case "xac_nhan":
		return "Xác nhận"
	case "dang_dien_ra":
		return "Đang diễn ra"
	case "hoan_thanh":
		return "Hoàn thành"
	case "hoan":
		return "Hoãn"
	default:
		return s
	}
}

func translateCategoryStatus(s string) string {
	switch s {
	case "active":
		return "Hoạt động"
	case "closed":
		return "Đã đóng"
	case "cancelled":
		return "Đã hủy"
	default:
		return s
	}
}
