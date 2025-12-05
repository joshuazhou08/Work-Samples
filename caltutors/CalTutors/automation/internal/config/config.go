package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	StripeSecretKey string
	DatabaseURL     string
}

func Load() Config {
	// Load .env ONLY in local development
	if os.Getenv("RAILWAY_ENVIRONMENT_ID") == "" {
		// or check ENVIRONMENT=development
		log.Println("Loading .env file for local development")
		_ = godotenv.Load() // ignore error; local only
	}

	stripeKey := os.Getenv("STRIPE_SECRET_KEY")
	if stripeKey == "" {
		log.Fatal("STRIPE_SECRET_KEY is missing")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is missing")
	}

	return Config{
		StripeSecretKey: stripeKey,
		DatabaseURL:     dbURL,
	}
}
