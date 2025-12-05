# CalTutors-Automation

Lightweight Go service for automating backend tasks for [CalTutors](https://caltutors.org).

### Current Functionality

- Automatically charges students via Stripe every Monday.

### Tech Stack

- Go
- [stripe-go](https://github.com/stripe/stripe-go)
- [robfig/cron](https://github.com/robfig/cron)
- [joho/godotenv](https://github.com/joho/godotenv)

### Setup

```bash
git clone https://github.com/joshzhou/CalTutors-Automation.git
cd CalTutors-Automation
go mod init github.com/joshzhou/CalTutors-Automation
go mod tidy
echo "STRIPE_SECRET_KEY=sk_live_..." > .env
go run ./cmd/charger
```

# IMPORTANT NOTES

## Billing

The auto charge script should run at maximum speed weekly to not overlap with Stripe retry window to avoid duplicate charging.
