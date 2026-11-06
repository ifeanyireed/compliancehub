package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatalf("DATABASE_URL environment variable is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer conn.Close(ctx)

	var version string
	var now time.Time
	err = conn.QueryRow(ctx, "SELECT version(), NOW()").Scan(&version, &now)
	if err != nil {
		log.Fatalf("QueryRow failed: %v\n", err)
	}

	fmt.Printf("✅ Connected successfully to Neon Postgres!\n")
	fmt.Printf("Version: %s\n", version)
	fmt.Printf("Database Time: %s\n", now)
}
