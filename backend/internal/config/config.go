package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

const DefaultJWTSecret = "change-me-before-production-vct-2026"

type Config struct {
	Environment        string
	Address            string
	AllowedOrigins     []string
	DisableAuthForData bool
	AllowDemoUsers     bool
	BootstrapUsersJSON string
	JWTSecret          string
	JWTIssuer          string
	AccessTokenTTL     time.Duration
	RefreshTokenTTL    time.Duration
	AuditLimit         int
	StorageDriver      string
	PostgresURL        string
	PostgresProvider   string
	DBAutoMigrate      bool
	CacheTTL           time.Duration
	CacheMaxEntries    int
	PGPoolMaxConns     int
	PGPoolMinConns     int
	PGPoolMaxIdleTime  time.Duration
}

func Load() Config {
	environment := strings.ToLower(getEnv("VCT_ENV", "development"))
	allowDemoByDefault := environment == "development"
	address := getEnv("VCT_BACKEND_ADDR", ":18080")
	origins := splitCSV(getEnv("VCT_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8081,http://localhost:3101,http://127.0.0.1:3101"))
	disableAuth := strings.EqualFold(getEnv("VCT_DISABLE_AUTH_FOR_DATA", "false"), "true")
	allowDemoUsers := parseBool(getEnv("VCT_ALLOW_DEMO_USERS", boolToString(allowDemoByDefault)), allowDemoByDefault)
	bootstrapUsersJSON := strings.TrimSpace(getEnv("VCT_BOOTSTRAP_USERS_JSON", ""))

	jwtSecret := getEnv("VCT_JWT_SECRET", DefaultJWTSecret)
	jwtIssuer := getEnv("VCT_JWT_ISSUER", "vct-backend")
	accessTTL := parseDuration(getEnv("VCT_ACCESS_TTL", "15m"), 15*time.Minute)
	refreshTTL := parseDuration(getEnv("VCT_REFRESH_TTL", "168h"), 7*24*time.Hour)
	auditLimit := parseInt(getEnv("VCT_AUDIT_LIMIT", "5000"), 5000)
	storageDriver := strings.ToLower(getEnv("VCT_STORAGE_DRIVER", "memory"))
	postgresURL := getEnv("VCT_POSTGRES_URL", "")
	postgresProvider := strings.ToLower(getEnv("VCT_POSTGRES_PROVIDER", "selfhost"))
	dbAutoMigrate := parseBool(getEnv("VCT_DB_AUTO_MIGRATE", "true"), true)
	cacheTTL := parseDuration(getEnv("VCT_CACHE_TTL", "30s"), 30*time.Second)
	cacheMaxEntries := parseInt(getEnv("VCT_CACHE_MAX_ENTRIES", "2000"), 2000)
	pgPoolMaxConns := parseInt(getEnv("VCT_PG_POOL_MAX_CONNS", "25"), 25)
	pgPoolMinConns := parseInt(getEnv("VCT_PG_POOL_MIN_CONNS", "5"), 5)
	pgPoolMaxIdleTime := parseDuration(getEnv("VCT_PG_POOL_MAX_IDLE_TIME", "30m"), 30*time.Minute)

	return Config{
		Environment:        environment,
		Address:            address,
		AllowedOrigins:     origins,
		DisableAuthForData: disableAuth,
		AllowDemoUsers:     allowDemoUsers,
		BootstrapUsersJSON: bootstrapUsersJSON,
		JWTSecret:          jwtSecret,
		JWTIssuer:          jwtIssuer,
		AccessTokenTTL:     accessTTL,
		RefreshTokenTTL:    refreshTTL,
		AuditLimit:         auditLimit,
		StorageDriver:      storageDriver,
		PostgresURL:        postgresURL,
		PostgresProvider:   postgresProvider,
		DBAutoMigrate:      dbAutoMigrate,
		CacheTTL:           cacheTTL,
		CacheMaxEntries:    cacheMaxEntries,
		PGPoolMaxConns:     pgPoolMaxConns,
		PGPoolMinConns:     pgPoolMinConns,
		PGPoolMaxIdleTime:  pgPoolMaxIdleTime,
	}
}

func (c Config) Validate() error {
	secret := strings.TrimSpace(c.JWTSecret)
	if secret == "" {
		return fmt.Errorf("VCT_JWT_SECRET must not be empty")
	}

	env := strings.TrimSpace(strings.ToLower(c.Environment))
	if (env == "production" || env == "staging") && c.AllowDemoUsers {
		return fmt.Errorf("VCT_ALLOW_DEMO_USERS must be false for %s", env)
	}
	if (env == "production" || env == "staging") && secret == DefaultJWTSecret {
		return fmt.Errorf("VCT_JWT_SECRET must be overridden for %s", env)
	}

	return nil
}

func boolToString(value bool) string {
	if value {
		return "true"
	}
	return "false"
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && strings.TrimSpace(value) != "" {
		return strings.TrimSpace(value)
	}
	return fallback
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			origins = append(origins, trimmed)
		}
	}
	return origins
}

func parseDuration(value string, fallback time.Duration) time.Duration {
	duration, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return duration
}

func parseInt(value string, fallback int) int {
	parsed, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil {
		return fallback
	}
	if parsed <= 0 {
		return fallback
	}
	return parsed
}

func parseBool(value string, fallback bool) bool {
	trimmed := strings.TrimSpace(strings.ToLower(value))
	if trimmed == "" {
		return fallback
	}
	switch trimmed {
	case "1", "true", "yes", "y":
		return true
	case "0", "false", "no", "n":
		return false
	default:
		return fallback
	}
}
