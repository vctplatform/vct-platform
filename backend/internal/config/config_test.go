package config

import (
	"os"
	"testing"
)

func TestValidate_ProductionRejectsDefaultSecret(t *testing.T) {
	cfg := Config{
		Environment: "production",
		JWTSecret:   DefaultJWTSecret,
	}
	err := cfg.Validate()
	if err == nil {
		t.Fatal("expected error when production uses default JWT secret")
	}
}

func TestValidate_ProductionRejectsDemoUsers(t *testing.T) {
	cfg := Config{
		Environment:    "production",
		JWTSecret:      "a-real-secret-for-production",
		AllowDemoUsers: true,
	}
	err := cfg.Validate()
	if err == nil {
		t.Fatal("expected error when production allows demo users")
	}
}

func TestValidate_StagingRejectsDefaultSecret(t *testing.T) {
	cfg := Config{
		Environment: "staging",
		JWTSecret:   DefaultJWTSecret,
	}
	err := cfg.Validate()
	if err == nil {
		t.Fatal("expected error when staging uses default JWT secret")
	}
}

func TestValidate_ProductionAcceptsRealSecret(t *testing.T) {
	cfg := Config{
		Environment:    "production",
		JWTSecret:      "my-super-secure-jwt-secret-2026",
		AllowDemoUsers: false,
	}
	err := cfg.Validate()
	if err != nil {
		t.Fatalf("expected no error for valid production config, got: %v", err)
	}
}

func TestValidate_DevelopmentAcceptsDefaults(t *testing.T) {
	cfg := Config{
		Environment:    "development",
		JWTSecret:      DefaultJWTSecret,
		AllowDemoUsers: true,
	}
	err := cfg.Validate()
	if err != nil {
		t.Fatalf("expected no error for development config, got: %v", err)
	}
}

func TestValidate_EmptySecretRejected(t *testing.T) {
	cfg := Config{
		Environment: "development",
		JWTSecret:   "",
	}
	err := cfg.Validate()
	if err == nil {
		t.Fatal("expected error for empty JWT secret")
	}
}

func TestValidate_WhitespaceOnlySecretRejected(t *testing.T) {
	cfg := Config{
		Environment: "development",
		JWTSecret:   "   ",
	}
	err := cfg.Validate()
	if err == nil {
		t.Fatal("expected error for whitespace-only JWT secret")
	}
}

func TestLoad_DefaultValues(t *testing.T) {
	// Clear any existing env vars to test defaults
	envVars := []string{
		"VCT_ENV", "VCT_BACKEND_ADDR", "VCT_JWT_SECRET",
		"VCT_STORAGE_DRIVER", "VCT_CACHE_TTL",
	}
	saved := make(map[string]string)
	for _, key := range envVars {
		if val, ok := os.LookupEnv(key); ok {
			saved[key] = val
		}
		os.Unsetenv(key)
	}
	defer func() {
		for key, val := range saved {
			os.Setenv(key, val)
		}
	}()

	cfg := Load()

	if cfg.Environment != "development" {
		t.Errorf("expected default environment 'development', got '%s'", cfg.Environment)
	}
	if cfg.JWTSecret != DefaultJWTSecret {
		t.Errorf("expected default JWT secret, got '%s'", cfg.JWTSecret)
	}
	if cfg.StorageDriver != "memory" {
		t.Errorf("expected default storage driver 'memory', got '%s'", cfg.StorageDriver)
	}
	if cfg.CacheTTL.Seconds() != 30 {
		t.Errorf("expected default cache TTL 30s, got %v", cfg.CacheTTL)
	}
	if cfg.CacheMaxEntries != 2000 {
		t.Errorf("expected default cache max entries 2000, got %d", cfg.CacheMaxEntries)
	}
}

func TestParseBool_AllVariants(t *testing.T) {
	cases := []struct {
		input    string
		expected bool
	}{
		{"true", true},
		{"TRUE", true},
		{"True", true},
		{"1", true},
		{"yes", true},
		{"y", true},
		{"false", false},
		{"FALSE", false},
		{"0", false},
		{"no", false},
		{"n", false},
	}

	for _, tc := range cases {
		result := parseBool(tc.input, !tc.expected)
		if result != tc.expected {
			t.Errorf("parseBool(%q): expected %v, got %v", tc.input, tc.expected, result)
		}
	}
}

func TestParseBool_EmptyFallback(t *testing.T) {
	result := parseBool("", true)
	if !result {
		t.Error("expected fallback true for empty string")
	}

	result = parseBool("", false)
	if result {
		t.Error("expected fallback false for empty string")
	}
}

func TestParseBool_InvalidFallback(t *testing.T) {
	result := parseBool("maybe", true)
	if !result {
		t.Error("expected fallback true for invalid string")
	}
}

func TestParseInt_Valid(t *testing.T) {
	result := parseInt("42", 10)
	if result != 42 {
		t.Errorf("expected 42, got %d", result)
	}
}

func TestParseInt_ZeroUseFallback(t *testing.T) {
	result := parseInt("0", 10)
	if result != 10 {
		t.Errorf("expected fallback 10 for zero, got %d", result)
	}
}

func TestParseInt_NegativeUseFallback(t *testing.T) {
	result := parseInt("-5", 10)
	if result != 10 {
		t.Errorf("expected fallback 10 for negative, got %d", result)
	}
}

func TestParseInt_InvalidUseFallback(t *testing.T) {
	result := parseInt("abc", 99)
	if result != 99 {
		t.Errorf("expected fallback 99 for invalid, got %d", result)
	}
}

func TestParseDuration_Valid(t *testing.T) {
	result := parseDuration("5m", 0)
	if result.Minutes() != 5 {
		t.Errorf("expected 5 minutes, got %v", result)
	}
}

func TestParseDuration_InvalidUseFallback(t *testing.T) {
	result := parseDuration("invalid", 30e9) // 30s in nanoseconds
	if result.Seconds() != 30 {
		t.Errorf("expected fallback 30s, got %v", result)
	}
}
