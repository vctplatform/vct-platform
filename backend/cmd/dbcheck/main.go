package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	url := strings.TrimSpace(os.Getenv("VCT_POSTGRES_URL"))
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		fmt.Fprintf(os.Stderr, "connect: %v\n", err)
		os.Exit(1)
	}
	defer pool.Close()

	if len(os.Args) > 1 && os.Args[1] == "drop" {
		dropSQL := `
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
  FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
  END LOOP;
  FOR r IN (SELECT matviewname FROM pg_matviews WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS public.' || quote_ident(r.matviewname) || ' CASCADE';
  END LOOP;
  FOR r IN (SELECT nspname FROM pg_namespace 
            WHERE nspname NOT IN ('public','pg_catalog','information_schema','pg_toast',
                                   'auth','storage','extensions','graphql','graphql_public',
                                   'realtime','pgsodium','pgsodium_masks','vault',
                                   '_analytics','supabase_functions','supabase_migrations',
                                   '_realtime','net','cron','_supabase')
            AND nspname NOT LIKE 'pg_%') LOOP
    EXECUTE 'DROP SCHEMA IF EXISTS ' || quote_ident(r.nspname) || ' CASCADE';
  END LOOP;
END $$;`
		_, err := pool.Exec(ctx, dropSQL, pgx.QueryExecModeSimpleProtocol)
		if err != nil {
			fmt.Fprintf(os.Stderr, "drop error: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("All public tables, views, and custom schemas dropped successfully")
		return
	}

	if len(os.Args) > 1 && os.Args[1] == "fix-uuid" {
		fixSQL := `
CREATE OR REPLACE FUNCTION uuidv7() RETURNS UUID AS $$
DECLARE
    v_time  BIGINT;
    v_bytes BYTEA;
    v_hex   TEXT;
BEGIN
    v_time := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
    v_bytes := gen_random_bytes(16);
    v_bytes := set_byte(v_bytes, 0, ((v_time >> 40) & 255)::INT);
    v_bytes := set_byte(v_bytes, 1, ((v_time >> 32) & 255)::INT);
    v_bytes := set_byte(v_bytes, 2, ((v_time >> 24) & 255)::INT);
    v_bytes := set_byte(v_bytes, 3, ((v_time >> 16) & 255)::INT);
    v_bytes := set_byte(v_bytes, 4, ((v_time >>  8) & 255)::INT);
    v_bytes := set_byte(v_bytes, 5, ( v_time        & 255)::INT);
    v_bytes := set_byte(v_bytes, 6, (get_byte(v_bytes, 6) & 15) | 112);
    v_bytes := set_byte(v_bytes, 8, (get_byte(v_bytes, 8) & 63) | 128);
    v_hex := encode(v_bytes, 'hex');
    RETURN (
        substr(v_hex,  1, 8) || '-' ||
        substr(v_hex,  9, 4) || '-' ||
        substr(v_hex, 13, 4) || '-' ||
        substr(v_hex, 17, 4) || '-' ||
        substr(v_hex, 21, 12)
    )::UUID;
END;
$$ LANGUAGE plpgsql VOLATILE;`
		_, err := pool.Exec(ctx, fixSQL, pgx.QueryExecModeSimpleProtocol)
		if err != nil {
			fmt.Fprintf(os.Stderr, "fix-uuid error: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("uuidv7() function fixed successfully")

		// Test it
		var uuid string
		err = pool.QueryRow(ctx, "SELECT uuidv7()::text").Scan(&uuid)
		if err != nil {
			fmt.Fprintf(os.Stderr, "test uuidv7 error: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Test UUID v7: %s\n", uuid)
		return
	}

	// Default: list tables
	rows, err := pool.Query(ctx, "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name")
	if err != nil {
		fmt.Fprintf(os.Stderr, "query: %v\n", err)
		os.Exit(1)
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var name string
		rows.Scan(&name)
		fmt.Println(name)
		count++
	}
	fmt.Printf("\nTotal: %d tables\n", count)
}
