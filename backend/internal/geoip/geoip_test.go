package geoip

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func seedDB() *Database {
	db := NewDatabase()
	db.AddCIDR("10.0.0.0/8", "VN", "Việt Nam", "Hồ Chí Minh", "TP.HCM", "Asia/Ho_Chi_Minh")
	db.AddCIDR("172.16.0.0/12", "US", "United States", "California", "San Francisco", "America/Los_Angeles")
	db.AddCIDR("192.168.0.0/16", "JP", "Japan", "Tokyo", "Shibuya", "Asia/Tokyo")
	return db
}

func TestLookup_Found(t *testing.T) {
	db := seedDB()
	info := db.Lookup("10.1.2.3")
	if info == nil {
		t.Fatal("expected geo info")
	}
	if info.CountryCode != "VN" {
		t.Errorf("expected VN, got %s", info.CountryCode)
	}
	if info.City != "TP.HCM" {
		t.Errorf("expected TP.HCM, got %s", info.City)
	}
	if info.IP != "10.1.2.3" {
		t.Error("should include queried IP")
	}
}

func TestLookup_NotFound(t *testing.T) {
	db := seedDB()
	info := db.Lookup("8.8.8.8")
	if info != nil {
		t.Error("expected nil for unknown IP")
	}
}

func TestLookup_InvalidIP(t *testing.T) {
	db := seedDB()
	info := db.Lookup("not-an-ip")
	if info != nil {
		t.Error("expected nil for invalid IP")
	}
}

func TestAddCIDR_Invalid(t *testing.T) {
	db := NewDatabase()
	err := db.AddCIDR("invalid", "XX", "", "", "", "")
	if err == nil {
		t.Error("expected error for invalid CIDR")
	}
}

func TestAccessRules_AllowAll(t *testing.T) {
	rules := NewAccessRules(ModeAllowAll)
	rules.Block("CN")

	if !rules.IsAllowed("VN") {
		t.Error("VN should be allowed")
	}
	if rules.IsAllowed("CN") {
		t.Error("CN should be blocked")
	}
}

func TestAccessRules_BlockAll(t *testing.T) {
	rules := NewAccessRules(ModeBlockAll)
	rules.Allow("VN")
	rules.Allow("JP")

	if !rules.IsAllowed("VN") {
		t.Error("VN should be allowed")
	}
	if rules.IsAllowed("US") {
		t.Error("US should be blocked (not in allow list)")
	}
}

func TestContext(t *testing.T) {
	info := &GeoInfo{CountryCode: "VN", Country: "Việt Nam"}
	ctx := WithGeoInfo(context.Background(), info)

	got := FromContext(ctx)
	if got == nil || got.CountryCode != "VN" {
		t.Error("expected VN from context")
	}

	if FromContext(context.Background()) != nil {
		t.Error("expected nil from empty context")
	}
}

func TestEnrichMiddleware(t *testing.T) {
	db := seedDB()
	handler := EnrichMiddleware(db)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		info := FromContext(r.Context())
		if info == nil || info.CountryCode != "VN" {
			t.Error("expected VN geo info in context")
		}
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/api/test", nil)
	req.Header.Set("X-Forwarded-For", "10.0.0.1")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != 200 {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestGeoFenceMiddleware_Allowed(t *testing.T) {
	db := seedDB()
	rules := NewAccessRules(ModeAllowAll)

	handler := GeoFenceMiddleware(db, rules)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/api/test", nil)
	req.Header.Set("X-Real-IP", "10.0.0.1")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != 200 {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestGeoFenceMiddleware_Blocked(t *testing.T) {
	db := seedDB()
	rules := NewAccessRules(ModeAllowAll)
	rules.Block("JP")

	handler := GeoFenceMiddleware(db, rules)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	}))

	req := httptest.NewRequest("GET", "/api/test", nil)
	req.Header.Set("X-Real-IP", "192.168.1.1") // JP range
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", rec.Code)
	}
}

func TestExtractIP_XForwardedFor(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("X-Forwarded-For", "1.2.3.4, 5.6.7.8")

	ip := extractIP(req)
	if ip != "1.2.3.4" {
		t.Errorf("expected 1.2.3.4, got %s", ip)
	}
}

func TestDatabaseSize(t *testing.T) {
	db := seedDB()
	if db.Size() != 3 {
		t.Errorf("expected 3 entries, got %d", db.Size())
	}
}
