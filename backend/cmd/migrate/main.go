package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type migration struct {
	Version string
	Name    string
	Path    string
	IsDown  bool
}

func main() {
	migrationsDir := flag.String("migrations", "migrations", "path to migration SQL directory")
	seedsDir := flag.String("seeds", filepath.Join("sql", "seeds"), "path to seed SQL directory")
	flag.Parse()

	if flag.NArg() < 1 {
		usage()
		os.Exit(1)
	}

	command := strings.ToLower(strings.TrimSpace(flag.Arg(0)))
	databaseURL := resolveDatabaseURL()
	if databaseURL == "" {
		exitWithError("missing database url: set VCT_POSTGRES_URL or DATABASE_URL")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		exitWithError("connect postgres failed: %v", err)
	}
	defer pool.Close()

	if err := ensureMigrationsTable(ctx, pool); err != nil {
		exitWithError("ensure schema_migrations failed: %v", err)
	}

	switch command {
	case "up":
		if err := runUp(ctx, pool, *migrationsDir); err != nil {
			exitWithError("%v", err)
		}
	case "down":
		if err := runDown(ctx, pool, *migrationsDir); err != nil {
			exitWithError("%v", err)
		}
	case "status":
		if err := runStatus(ctx, pool, *migrationsDir); err != nil {
			exitWithError("%v", err)
		}
	case "seed":
		if err := runSeed(ctx, pool, *seedsDir); err != nil {
			exitWithError("%v", err)
		}
	default:
		usage()
		exitWithError("unsupported command %q", command)
	}
}

func usage() {
	fmt.Fprintln(os.Stderr, "Usage: go run ./cmd/migrate [up|down|status|seed] [--migrations migrations] [--seeds sql/seeds]")
}

func resolveDatabaseURL() string {
	if value := strings.TrimSpace(os.Getenv("VCT_POSTGRES_URL")); value != "" {
		return value
	}
	return strings.TrimSpace(os.Getenv("DATABASE_URL"))
}

func ensureMigrationsTable(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`)
	return err
}

func runUp(ctx context.Context, pool *pgxpool.Pool, migrationsDir string) error {
	migrations, err := listMigrations(migrationsDir)
	if err != nil {
		return err
	}
	if len(migrations) == 0 {
		fmt.Println("no migration files found")
		return nil
	}

	applied, err := loadAppliedVersions(ctx, pool)
	if err != nil {
		return err
	}

	appliedCount := 0
	for _, m := range migrations {
		if m.IsDown {
			continue
		}
		if _, ok := applied[m.Version]; ok {
			continue
		}
		if err := applySQLFile(ctx, pool, m.Path); err != nil {
			return fmt.Errorf("apply migration %s failed: %w", m.Name, err)
		}
		if _, err := pool.Exec(
			ctx,
			`INSERT INTO schema_migrations(version, name) VALUES ($1, $2)`,
			m.Version,
			m.Name,
		); err != nil {
			return fmt.Errorf("record migration %s failed: %w", m.Name, err)
		}
		fmt.Printf("applied %s\n", m.Name)
		appliedCount++
	}

	if appliedCount == 0 {
		fmt.Println("no pending migrations")
	}
	return nil
}

func runDown(ctx context.Context, pool *pgxpool.Pool, migrationsDir string) error {
	var version, name string
	err := pool.QueryRow(
		ctx,
		`SELECT version, name FROM schema_migrations ORDER BY version DESC LIMIT 1`,
	).Scan(&version, &name)
	if err != nil {
		return errors.New("no applied migration to roll back")
	}

	downFile, err := findDownMigrationFile(migrationsDir, version)
	if err != nil {
		return err
	}

	if err := applySQLFile(ctx, pool, downFile.Path); err != nil {
		return fmt.Errorf("apply down migration %s failed: %w", downFile.Name, err)
	}
	if _, err := pool.Exec(ctx, `DELETE FROM schema_migrations WHERE version=$1`, version); err != nil {
		return fmt.Errorf("remove migration record %s failed: %w", name, err)
	}

	fmt.Printf("rolled back %s via %s\n", name, downFile.Name)
	return nil
}

func runStatus(ctx context.Context, pool *pgxpool.Pool, migrationsDir string) error {
	migrations, err := listMigrations(migrationsDir)
	if err != nil {
		return err
	}
	applied, err := loadAppliedVersions(ctx, pool)
	if err != nil {
		return err
	}

	if len(migrations) == 0 {
		fmt.Println("no migration files found")
		return nil
	}

	fmt.Println("MIGRATION STATUS")
	for _, m := range migrations {
		if m.IsDown {
			continue
		}
		state := "pending"
		if _, ok := applied[m.Version]; ok {
			state = "applied"
		}
		fmt.Printf("- [%s] %s\n", state, m.Name)
	}
	return nil
}

func runSeed(ctx context.Context, pool *pgxpool.Pool, seedsDir string) error {
	seeds, err := listSQLFiles(seedsDir)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			fmt.Println("seed directory not found, skip")
			return nil
		}
		return err
	}
	if len(seeds) == 0 {
		fmt.Println("no seed files found")
		return nil
	}

	for _, seed := range seeds {
		if err := applySQLFile(ctx, pool, seed); err != nil {
			return fmt.Errorf("apply seed %s failed: %w", filepath.Base(seed), err)
		}
		fmt.Printf("seeded %s\n", filepath.Base(seed))
	}
	return nil
}

func listMigrations(dir string) ([]migration, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	result := make([]migration, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if !strings.HasSuffix(strings.ToLower(name), ".sql") {
			continue
		}

		version := migrationVersionFromFile(name)
		if version == "" {
			continue
		}

		result = append(result, migration{
			Version: version,
			Name:    name,
			Path:    filepath.Join(dir, name),
			IsDown:  strings.HasSuffix(strings.ToLower(strings.TrimSuffix(name, ".sql")), "_down"),
		})
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].Version == result[j].Version {
			return result[i].Name < result[j].Name
		}
		return result[i].Version < result[j].Version
	})
	return result, nil
}

func listSQLFiles(dir string) ([]string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	files := make([]string, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if strings.HasSuffix(strings.ToLower(name), ".sql") {
			files = append(files, filepath.Join(dir, name))
		}
	}
	sort.Strings(files)
	return files, nil
}

func findDownMigrationFile(dir, version string) (migration, error) {
	migrations, err := listMigrations(dir)
	if err != nil {
		return migration{}, err
	}
	for _, m := range migrations {
		if m.IsDown && m.Version == version {
			return m, nil
		}
	}
	return migration{}, fmt.Errorf("no down migration for version %s (expected file %s_*_down.sql)", version, version)
}

func loadAppliedVersions(ctx context.Context, pool *pgxpool.Pool) (map[string]struct{}, error) {
	rows, err := pool.Query(ctx, `SELECT version FROM schema_migrations`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := map[string]struct{}{}
	for rows.Next() {
		var version string
		if err := rows.Scan(&version); err != nil {
			return nil, err
		}
		result[version] = struct{}{}
	}
	return result, rows.Err()
}

func migrationVersionFromFile(name string) string {
	if len(name) < 4 {
		return ""
	}
	base := strings.TrimSuffix(name, filepath.Ext(name))
	parts := strings.Split(base, "_")
	if len(parts) < 2 {
		return ""
	}
	version := strings.TrimSpace(parts[0])
	if version == "" {
		return ""
	}
	for _, char := range version {
		if char < '0' || char > '9' {
			return ""
		}
	}
	return version
}

func applySQLFile(ctx context.Context, pool *pgxpool.Pool, path string) error {
	body, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	sqlText := strings.TrimSpace(string(body))
	if sqlText == "" {
		return nil
	}
	_, err = pool.Exec(ctx, sqlText)
	return err
}

func exitWithError(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "migrate: "+format+"\n", args...)
	os.Exit(1)
}
