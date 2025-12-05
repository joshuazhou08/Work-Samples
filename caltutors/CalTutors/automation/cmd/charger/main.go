package main

import (
	"log"

	"github.com/joshuazhou08/CalTutors-Automation/internal/billing"
	"github.com/joshuazhou08/CalTutors-Automation/internal/charges"
	"github.com/joshuazhou08/CalTutors-Automation/internal/config"
	"github.com/joshuazhou08/CalTutors-Automation/internal/db"
	"github.com/joshuazhou08/CalTutors-Automation/internal/db/client"
)

func main() {
	cfg := config.Load()

	// --- Init Postgres ---
	db.Connect(cfg.DatabaseURL)
	pool := db.DB
	// --- Init Repositories ---
	billingRepo := billing.NewPostgresBillingRepo(pool)

	stripeRepo := charges.NewStripeChargeRepo()
	clientRepo := client.NewClientRepo()
	// Set global Stripe key
	charges.InitStripe(cfg.StripeSecretKey)

	// --- Init Billing Service ---
	svc := billing.NewService(stripeRepo, billingRepo, clientRepo)

	log.Println("Starting billing cycle...")

	// --- Run billing cycle ---
	err := svc.ProcessUnchargedSessions()
	if err != nil {
		log.Fatalf("Billing cycle failed: %v", err)
	}

	log.Println("Billing cycle completed successfully.")
}
