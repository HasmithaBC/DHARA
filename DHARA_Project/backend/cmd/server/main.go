package main

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/dharact/backend/internal/config"
	"github.com/dharact/backend/internal/db"
	"github.com/dharact/backend/internal/handlers"
	"github.com/dharact/backend/internal/router"
)

func main() {
	cfg := config.Load()

	conn, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer conn.Close()

	r := router.New(conn, cfg)

	go runDailyDigest(conn, cfg)

	log.Printf("Dhara API listening on :%s (routes under /api/v1)", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

// runDailyDigest implements FR-NOT-003: a digest email to the sales inbox covering new
// leads in the last 24h and leads that have sat in NEW status for more than 48h. It fires
// once per day at (approximately) 08:00 server time — good enough for a single-region
// deployment; a dedicated cron/Cloud Scheduler trigger calling a protected endpoint is the
// straightforward upgrade if the API ever runs multi-region.
func runDailyDigest(conn *sql.DB, cfg *config.Config) {
	for {
		now := time.Now()
		next := time.Date(now.Year(), now.Month(), now.Day(), 8, 0, 0, 0, now.Location())
		if !next.After(now) {
			next = next.Add(24 * time.Hour)
		}
		time.Sleep(time.Until(next))

		var newLast24h, staleOver48h int
		conn.QueryRow(`SELECT count(*) FROM leads WHERE created_at > now() - interval '24 hours'`).Scan(&newLast24h)
		conn.QueryRow(`SELECT count(*) FROM leads WHERE status = 'NEW' AND created_at < now() - interval '48 hours'`).Scan(&staleOver48h)
		handlers.SendDailyDigest(cfg, newLast24h, staleOver48h)
	}
}
