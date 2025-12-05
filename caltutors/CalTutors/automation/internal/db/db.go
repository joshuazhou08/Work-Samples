package db

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

type Client struct {
    ID              int64  `json:"id"`
    StripeCustomerID string `json:"stripe_customer_id"`
    Email           string `json:"email"`
    FullName        string `json:"full_name"`
    HasValidPayment bool   `json:"has_valid_payment"`
}

func Connect(databaseURL string) {
	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("Failed to create DB pool: %v", err)
	}

	// Test the connection
	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}

	DB = pool
	log.Println("Connected to Postgres (using pool)")
}
