package billing

import (
	"context"
	"log"

	"github.com/joshuazhou08/CalTutors-Automation/internal/charges"
	"github.com/joshuazhou08/CalTutors-Automation/internal/db/client"
	"github.com/shopspring/decimal"
)

type Service struct {
	chargeRepo  charges.Repository
	billingRepo Repository
	clientRepo  client.Repository
}

func NewService(chargeRepo charges.Repository, billingRepo Repository, clientRepo client.Repository) *Service {
	return &Service{
		chargeRepo:  chargeRepo,
		billingRepo: billingRepo,
		clientRepo:  clientRepo,
	}
}

// ProcessUnchargedSessions processes uncharged sessions and creates invoices for them.
func (s *Service) ProcessUnchargedSessions() error {
	ctx := context.Background()

	sessionsByClient, err := s.billingRepo.GetUnchargedSessions(ctx)
	if err != nil {
		return err
	}

	for clientID, sessions := range sessionsByClient {

		// 1️⃣ Load the customer by internal ID (clean & correct)
		cust, err := s.clientRepo.GetCustomerByID(ctx, clientID)
		if err != nil {
			log.Printf("Skipping client %d: cannot load customer: %v", clientID, err)
			continue
		}

		// 2️⃣ Skip if client does NOT have a valid payment method
		if !cust.HasValidPayment {
			log.Printf("Skipping billing for client %d (%s): invalid payment method",
				cust.ID, cust.Email)
			continue
		}

		// 3️⃣ Calculate total amount owed (in cents)
		var totalAmountCents int64 = 0

		chargeInput := charges.ChargeInput{
			ClientID:         clientID,
			StripeCustomerID: cust.StripeCustomerID, // pulled from customer, not session
			Timezone:         cust.Timezone,
			Sessions:         make([]charges.ChargeSession, len(sessions)),
		}

		for i, sess := range sessions {
			// Compute price for this session
			minDec := decimal.NewFromInt(int64(sess.DurationMin))
			amountCents := sess.StudentRate.
				Mul(minDec).
				Div(decimal.NewFromInt(60)).  // convert minutes → hours
				Mul(decimal.NewFromInt(100)). // dollars → cents
				IntPart()

			totalAmountCents += amountCents

			chargeInput.Sessions[i] = charges.ChargeSession{
				ID:          sess.ID,
				TutorName:   sess.TutorName,
				StartTime:   sess.StartTime,
				DurationMin: sess.DurationMin,
				StudentRate: sess.StudentRate,
				TutorRate:   sess.TutorRate,
			}
		}

		chargeInput.AmountCents = totalAmountCents

		// Apply available credits (stored locally in cents)
		if cust.BalanceCents > 0 {
			if cust.BalanceCents >= totalAmountCents {
				chargeInput.CreditsAppliedCents = totalAmountCents
			} else {
				chargeInput.CreditsAppliedCents = cust.BalanceCents
			}
		}

		// 4️⃣ Create the Stripe invoice (via your charges repo)
		result := s.chargeRepo.Charge(chargeInput)
		if !result.Success {
			log.Printf("Failed to invoice client %d (%s): %v",
				clientID, cust.Email, result.Error)
			continue
		}

		log.Printf("Created invoice %s for client %d (%s)",
			result.StripeChargeID, cust.ID, cust.Email)
	}

	return nil
}
