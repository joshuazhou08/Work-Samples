package charges

import (
	"time"

	"github.com/shopspring/decimal"
)

type ChargeSession struct {
	ID          int64
	TutorName   string
	StartTime   time.Time
	DurationMin int
	StudentRate decimal.Decimal
	TutorRate   decimal.Decimal
}

type ChargeInput struct {
	ClientID            int64
	StripeCustomerID    string
	AmountCents         int64
	CreditsAppliedCents int64
	Timezone            string

	Sessions []ChargeSession
}

// ChargeResult is returned after a charge is attempted.
type ChargeResult struct {
	Success        bool
	Error          error
	StripeChargeID string
}

// Repository defines an interface for charging clients.
type Repository interface {
	Charge(input ChargeInput) ChargeResult
}
