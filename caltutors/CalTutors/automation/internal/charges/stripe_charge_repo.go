package charges

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/shopspring/decimal"
	"github.com/stripe/stripe-go/v80"
	"github.com/stripe/stripe-go/v80/invoice"
	"github.com/stripe/stripe-go/v80/invoiceitem"
)

type StripeChargeRepo struct{}

func InitStripe(key string) {
	stripe.Key = key
}

func NewStripeChargeRepo() *StripeChargeRepo {
	return &StripeChargeRepo{}
}

func (r *StripeChargeRepo) Charge(input ChargeInput) ChargeResult {
	log.Printf("Charging Stripe customer %s for %d cents",
		input.StripeCustomerID, input.AmountCents)

	loc := time.Local
	if input.Timezone != "" {
		if tz, err := time.LoadLocation(input.Timezone); err == nil {
			loc = tz
		}
	}

	type invoiceSession struct {
		ID          int64  `json:"id"`
		TutorName   string `json:"tutor_name"`
		StartTime   string `json:"start_time"`
		DurationMin int    `json:"duration_min"`
		StudentRate string `json:"student_rate"`
		TutorRate   string `json:"tutor_rate"`
	}

	sessions := make([]invoiceSession, len(input.Sessions))
	sessionAmounts := make([]int64, len(input.Sessions))
	var sessionTotalCents int64

	for i, sess := range input.Sessions {
		startLocal := sess.StartTime.In(loc)
		amountCents := sess.StudentRate.
			Mul(decimal.NewFromInt(int64(sess.DurationMin))).
			Div(decimal.NewFromInt(60)).
			Mul(decimal.NewFromInt(100)).
			IntPart()

		sessions[i] = invoiceSession{
			ID:          sess.ID,
			TutorName:   sess.TutorName,
			StartTime:   startLocal.Format(time.RFC3339),
			DurationMin: sess.DurationMin,
			StudentRate: sess.StudentRate.String(),
			TutorRate:   sess.TutorRate.String(),
		}

		sessionAmounts[i] = amountCents
		sessionTotalCents += amountCents
	}

	sessionsJSON, _ := json.Marshal(sessions)
	creditToApply := input.CreditsAppliedCents
	if creditToApply > sessionTotalCents {
		creditToApply = sessionTotalCents
	}

	finalAmountCents := sessionTotalCents - creditToApply

	// CREATE INVOICE FIRST (empty draft)
	invParams := &stripe.InvoiceParams{
		Customer:    stripe.String(input.StripeCustomerID),
		AutoAdvance: stripe.Bool(false), // don't auto-finalize automatically
	}

	// metadata belongs on the invoice
	invParams.AddMetadata("client_id", fmt.Sprintf("%d", input.ClientID))
	invParams.AddMetadata("sessions", string(sessionsJSON))
	invParams.AddMetadata("total_amount", fmt.Sprintf("%d", sessionTotalCents))
	invParams.AddMetadata("credits_applied", fmt.Sprintf("%d", creditToApply))
	invParams.AddMetadata("final_amount", fmt.Sprintf("%d", finalAmountCents))

	inv, err := invoice.New(invParams)
	if err != nil {
		return ChargeResult{
			Success: false,
			Error:   fmt.Errorf("failed to create invoice: %w", err),
		}
	}

	log.Printf("Created draft invoice %s for %s", inv.ID, input.StripeCustomerID)

	for i, sess := range input.Sessions {
		startLocal := sess.StartTime.In(loc)
		desc := fmt.Sprintf("Session with %s on %s (%d min)",
			sess.TutorName, startLocal.Format("2006-01-02 03:04 PM MST"), sess.DurationMin)

		itemParams := &stripe.InvoiceItemParams{
			Invoice:     stripe.String(inv.ID), // <-- critical
			Customer:    stripe.String(input.StripeCustomerID),
			Amount:      stripe.Int64(sessionAmounts[i]),
			Currency:    stripe.String("usd"),
			Description: stripe.String(desc),
		}

		item, err := invoiceitem.New(itemParams)
		if err != nil {
			return ChargeResult{
				Success: false,
				Error:   fmt.Errorf("failed to create invoice item: %w", err),
			}
		}

		log.Printf("Created invoice item %s for session %d (amount=%d)", item.ID, sess.ID, item.Amount)
	}

	if creditToApply > 0 {
		creditParams := &stripe.InvoiceItemParams{
			Invoice:     stripe.String(inv.ID),
			Customer:    stripe.String(input.StripeCustomerID),
			Amount:      stripe.Int64(-creditToApply),
			Currency:    stripe.String("usd"),
			Description: stripe.String("Credits applied"),
		}

		creditItem, err := invoiceitem.New(creditParams)
		if err != nil {
			return ChargeResult{
				Success: false,
				Error:   fmt.Errorf("failed to create credits invoice item: %w", err),
			}
		}

		log.Printf("Created credit invoice item %s (amount=%d)", creditItem.ID, creditItem.Amount)
	}

	// FINALIZE INVOICE (ALL ITEMS ARE NOW ATTACHED)
	finalInv, err := invoice.FinalizeInvoice(inv.ID, nil)
	if err != nil {
		return ChargeResult{
			Success: false,
			Error:   fmt.Errorf("failed to finalize invoice: %w", err),
		}
	}

	log.Printf("Finalized invoice %s (amount_due=%d cents)", finalInv.ID, finalInv.AmountDue)

	// PAY INVOICE (only if not already auto-paid in the case fully covered by credits)
	if !finalInv.Paid {
		paidInv, err := invoice.Pay(finalInv.ID, nil)
		if err != nil {
			return ChargeResult{
				Success: false,
				Error:   fmt.Errorf("failed to pay invoice: %w", err),
			}
		}

		finalInv = paidInv
	}

	log.Printf("Successfully charged invoice %s (paid=%v)", finalInv.ID, finalInv.Paid)

	return ChargeResult{
		Success:        true,
		StripeChargeID: finalInv.ID,
	}
}
