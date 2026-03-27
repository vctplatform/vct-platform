package httpapi

import (
	"net/http"
	"time"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/domain/activity"
)

// handlePortalActivities handles GET /api/v1/portal/activities
func (s *Server) handlePortalActivities(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
	// 1. Authenticate user
	_, err := s.principalFromRequest(r)
	if err != nil && !s.cfg.DisableAuthForData {
		writeAuthError(w, err)
		return
	}

	if r.Method != http.MethodGet {
		apiMethodNotAllowed(w)
		return
	}

	// 2. Generate activity feed (mocked based on context/role for now until Event Bus is fully queryable)
	feed := []activity.ActivityItem{
		{
			ID:          newUUID(),
			Title:       "Cảnh báo hệ thống",
			Description: "Hãy thiết lập mã bảo vệ tài khoản (2FA) để đảm bảo an toàn.",
			Timestamp:   time.Now().Add(-1 * time.Hour),
			Type:        "alert",
		},
		{
			ID:          newUUID(),
			Title:       "Truy cập gần đây",
			Description: "Bạn vừa đăng nhập cách đây 1 giờ trên trình duyệt mới.",
			Timestamp:   time.Now().Add(-1*time.Hour - 5*time.Minute),
			Type:        "update",
		},
		{
			ID:          newUUID(),
			Title:       "Chào mừng trở lại!",
			Description: "Hệ thống VCT Platform v3 đã cập nhật thành công.",
			Timestamp:   time.Now().Add(-24 * time.Hour),
			Type:        "match",
		},
	}

	// 3. Return JSON response
	success(w, http.StatusOK, map[string]any{
		"items": feed,
	})
}
