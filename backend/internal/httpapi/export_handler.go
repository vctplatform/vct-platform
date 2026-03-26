package httpapi

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"vct-platform/backend/internal/auth"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — DATA EXPORT HANDLER
// Export BTC results, finance, athletes to CSV/JSON.
// GET /api/v1/export/{type}?format=csv|json&giai_id=...
// ═══════════════════════════════════════════════════════════════

func (s *Server) handleBTCExport(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	exportType := strings.TrimPrefix(r.URL.Path, "/api/v1/export/")
	format := r.URL.Query().Get("format")
	if format == "" {
		format = "csv"
	}
	giaiID := r.URL.Query().Get("giai_id")

	switch exportType {
	case "team-results":
		s.exportTeamResults(w, r, format, giaiID)
	case "finance":
		s.exportFinance(w, r, format, giaiID)
	case "weigh-ins":
		s.exportWeighIns(w, r, format, giaiID)
	case "assignments":
		s.exportAssignments(w, r, format, giaiID)
	case "protests":
		s.exportProtests(w, r, format, giaiID)
	default:
		apiError(w, http.StatusBadRequest, CodeBadRequest, fmt.Sprintf("Loại export '%s' không hỗ trợ. Hỗ trợ: team-results, finance, weigh-ins, assignments, protests", exportType))
	}
}

func (s *Server) exportTeamResults(w http.ResponseWriter, r *http.Request, format, giaiID string) {
	results, err := s.Extended.BTC.ListTeamResults(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}

	if format == "json" {
		setExportHeaders(w, "team-results", "json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"export_type": "team-results",
			"exported_at": time.Now().UTC().Format(time.RFC3339),
			"count":       len(results),
			"data":        results,
		})
		return
	}

	setExportHeaders(w, "team-results", "csv")
	cw := csv.NewWriter(w)
	cw.Write([]string{"Hạng", "Đoàn", "Tỉnh", "HCV", "HCB", "HCĐ", "Tổng HC", "Điểm"})
	for _, r := range results {
		cw.Write([]string{
			fmt.Sprintf("%d", r.XepHang), r.DoanTen, r.Tinh,
			fmt.Sprintf("%d", r.HCV), fmt.Sprintf("%d", r.HCB), fmt.Sprintf("%d", r.HCD),
			fmt.Sprintf("%d", r.TongHC), fmt.Sprintf("%d", r.Diem),
		})
	}
	cw.Flush()
}

func (s *Server) exportFinance(w http.ResponseWriter, r *http.Request, format, giaiID string) {
	entries, err := s.Extended.BTC.ListFinance(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}

	if format == "json" {
		setExportHeaders(w, "finance", "json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"export_type": "finance",
			"exported_at": time.Now().UTC().Format(time.RFC3339),
			"count":       len(entries),
			"data":        entries,
		})
		return
	}

	setExportHeaders(w, "finance", "csv")
	cw := csv.NewWriter(w)
	cw.UseCRLF = true
	cw.Write([]string{"Loại", "Danh mục", "Mô tả", "Số tiền", "Đoàn", "Trạng thái", "Ngày GD"})
	for _, f := range entries {
		cw.Write([]string{
			f.Loai, f.DanhMuc, f.MoTa,
			fmt.Sprintf("%.0f", f.SoTien), f.DoanTen, f.TrangThai, f.NgayGD,
		})
	}
	cw.Flush()
}

func (s *Server) exportWeighIns(w http.ResponseWriter, r *http.Request, format, giaiID string) {
	records, err := s.Extended.BTC.ListWeighIns(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}

	if format == "json" {
		setExportHeaders(w, "weigh-ins", "json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"export_type": "weigh-ins",
			"exported_at": time.Now().UTC().Format(time.RFC3339),
			"count":       len(records),
			"data":        records,
		})
		return
	}

	setExportHeaders(w, "weigh-ins", "csv")
	cw := csv.NewWriter(w)
	cw.Write([]string{"VĐV", "Đoàn", "Hạng cân", "Cân nặng", "Giới hạn", "Kết quả", "Lần cân", "Người cân"})
	for _, wi := range records {
		cw.Write([]string{
			wi.VdvTen, wi.DoanTen, wi.HangCan,
			fmt.Sprintf("%.1f", wi.CanNang), fmt.Sprintf("%.1f", wi.GioiHan),
			wi.KetQua, fmt.Sprintf("%d", wi.LanCan), wi.NguoiCan,
		})
	}
	cw.Flush()
}

func (s *Server) exportAssignments(w http.ResponseWriter, r *http.Request, format, giaiID string) {
	assignments, err := s.Extended.BTC.ListAssignments(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}

	if format == "json" {
		setExportHeaders(w, "assignments", "json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"export_type": "assignments",
			"exported_at": time.Now().UTC().Format(time.RFC3339),
			"count":       len(assignments),
			"data":        assignments,
		})
		return
	}

	setExportHeaders(w, "assignments", "csv")
	cw := csv.NewWriter(w)
	cw.Write([]string{"Trọng tài", "Cấp bậc", "Chuyên môn", "Sàn", "Ngày", "Phiên", "Vai trò", "Trạng thái"})
	for _, a := range assignments {
		cw.Write([]string{
			a.TrongTaiTen, a.CapBac, a.ChuyenMon,
			a.SanTen, a.Ngay, a.Phien, a.VaiTro, a.TrangThai,
		})
	}
	cw.Flush()
}

func (s *Server) exportProtests(w http.ResponseWriter, r *http.Request, format, giaiID string) {
	protests, err := s.Extended.BTC.ListProtests(r.Context(), giaiID)
	if err != nil {
		apiInternal(w, err)
		return
	}

	if format == "json" {
		setExportHeaders(w, "protests", "json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"export_type": "protests",
			"exported_at": time.Now().UTC().Format(time.RFC3339),
			"count":       len(protests),
			"data":        protests,
		})
		return
	}

	setExportHeaders(w, "protests", "csv")
	cw := csv.NewWriter(w)
	cw.Write([]string{"Trận", "Người nộp", "Đoàn", "Loại KN", "Lý do", "Trạng thái", "Quyết định", "Người XL"})
	for _, p := range protests {
		cw.Write([]string{
			p.TranMoTa, p.NguoiNop, p.DoanTen,
			p.LoaiKN, p.LyDo, p.TrangThai, p.QuyetDinh, p.NguoiXL,
		})
	}
	cw.Flush()
}

func setExportHeaders(w http.ResponseWriter, name, format string) {
	timestamp := time.Now().Format("2006-01-02")
	if format == "json" {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="vct_%s_%s.json"`, name, timestamp))
	} else {
		w.Header().Set("Content-Type", "text/csv; charset=utf-8")
		w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="vct_%s_%s.csv"`, name, timestamp))
		// BOM for Excel
		w.Write([]byte{0xEF, 0xBB, 0xBF})
	}
}
