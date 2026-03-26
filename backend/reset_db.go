package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	url := os.Getenv("VCT_POSTGRES_URL")
	if url == "" {
		url = os.Getenv("DATABASE_URL")
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		fmt.Printf("Connect failed: %v\n", err)
		os.Exit(1)
	}
	defer pool.Close()

	// Drop schemas
	schemas := []string{"public", "core", "extensions", "platform", "training", "people", "tournament", "system", "api_v1"}
	for _, schema := range schemas {
		query := fmt.Sprintf("DROP SCHEMA IF EXISTS %s CASCADE;", schema)
		_, err := pool.Exec(ctx, query)
		if err != nil {
			fmt.Printf("Failed to drop schema %s: %v\n", schema, err)
		} else {
			fmt.Printf("Dropped schema %s\n", schema)
		}
	}

	// Recreate public schema
	_, err = pool.Exec(ctx, "CREATE SCHEMA public;")
	if err != nil {
		fmt.Printf("Failed to recreate schema public: %v\n", err)
	} else {
		fmt.Println("Recreated schema public")
	}

	fmt.Println("Database reset successful.")
}
