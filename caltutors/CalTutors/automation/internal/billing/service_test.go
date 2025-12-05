package billing

import (
	"errors"
	"testing"
	"time"

	"github.com/joshuazhou08/CalTutors-Automation/internal/charges"
	"github.com/joshuazhou08/CalTutors-Automation/internal/db/client"
	"github.com/shopspring/decimal"
)

func TestProcessUnchargedSessions_ReturnsBillingError(t *testing.T) {
	expectedErr := errors.New("billing repo failed")

	billingRepo := NewMockBillingRepo(nil, expectedErr)
	chargeRepo := charges.NewMockChargeRepo()
	mockClient := client.NewMockClientRepo(nil)
	service := NewService(chargeRepo, billingRepo, mockClient)

	err := service.ProcessUnchargedSessions()
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected error %v, got %v", expectedErr, err)
	}
}

func TestProcessUnchargedSessions_SkipsClientWithoutValidPayment(t *testing.T) {
	clientID := int64(99)

	billingRepo := NewMockBillingRepo(map[int64][]Session{
		clientID: {
			{
				ID:          1,
				ClientID:    clientID,
				DurationMin: 60,
				StudentRate: decimal.NewFromInt(120),
				TutorRate:   decimal.NewFromInt(80),
			},
		},
	}, nil)
	chargeRepo := charges.NewMockChargeRepo()
	mockClient := client.NewMockClientRepo(map[int64]*client.Customer{
		clientID: {
			ID:               clientID,
			StripeCustomerID: "cus_invalid",
			HasValidPayment:  false,
		},
	})
	service := NewService(chargeRepo, billingRepo, mockClient)

	if err := service.ProcessUnchargedSessions(); err != nil {
		t.Fatalf("ProcessUnchargedSessions returned error: %v", err)
	}

	if len(chargeRepo.ReceivedInputs) != 0 {
		t.Fatalf("expected no charge attempts for client without valid payment, got %d", len(chargeRepo.ReceivedInputs))
	}
}

func TestProcessUnchargedSessions_CreatesChargeWithAggregatedAmount(t *testing.T) {
	clientID := int64(10)
	sessions := []Session{
		{
			ID:          1,
			ClientID:    clientID,
			DurationMin: 60,
			StudentRate: decimal.NewFromInt(120),
			TutorRate:   decimal.NewFromInt(80),
		},
		{
			ID:          2,
			ClientID:    clientID,
			DurationMin: 30,
			StudentRate: decimal.NewFromInt(90),
			TutorRate:   decimal.NewFromInt(70),
		},
	}

	billingRepo := NewMockBillingRepo(map[int64][]Session{
		clientID: sessions,
	}, nil)
	chargeRepo := charges.NewMockChargeRepo().WithCharge(clientID, "ch_test")
	mockClient := client.NewMockClientRepo(map[int64]*client.Customer{
		clientID: {
			ID:               clientID,
			StripeCustomerID: "cus_abc",
			HasValidPayment:  true,
		},
	})
	service := NewService(chargeRepo, billingRepo, mockClient)

	if err := service.ProcessUnchargedSessions(); err != nil {
		t.Fatalf("ProcessUnchargedSessions returned error: %v", err)
	}

	if len(chargeRepo.ReceivedInputs) != 1 {
		t.Fatalf("expected 1 charge call, got %d", len(chargeRepo.ReceivedInputs))
	}

	input := chargeRepo.ReceivedInputs[0]

	if input.ClientID != clientID {
		t.Fatalf("expected client ID %d, got %d", clientID, input.ClientID)
	}

	if input.StripeCustomerID != "cus_abc" {
		t.Fatalf("expected Stripe customer ID cus_abc, got %s", input.StripeCustomerID)
	}

	// 120/hr * 60 min + 90/hr * 30 min = 165 dollars -> 16500 cents
	var expectedAmount int64 = 16500
	if input.AmountCents != expectedAmount {
		t.Fatalf("expected amount %d cents, got %d", expectedAmount, input.AmountCents)
	}

	if len(input.Sessions) != 2 || input.Sessions[0].ID != 1 || input.Sessions[1].ID != 2 {
		t.Fatalf("unexpected sessions: %v", input.Sessions)
	}

	if !input.Sessions[0].StudentRate.Equal(decimal.NewFromInt(120)) || !input.Sessions[1].StudentRate.Equal(decimal.NewFromInt(90)) {
		t.Fatalf("unexpected student rates: %v", input.Sessions)
	}

	if !input.Sessions[0].TutorRate.Equal(decimal.NewFromInt(80)) || !input.Sessions[1].TutorRate.Equal(decimal.NewFromInt(70)) {
		t.Fatalf("unexpected tutor rates: %v", input.Sessions)
	}
}

func TestProcessUnchargedSessions_ContinuesAfterChargeFailure(t *testing.T) {
	clientWithCharge := int64(1)
	clientWithoutCharge := int64(2)

	billingRepo := NewMockBillingRepo(map[int64][]Session{
		clientWithCharge: {
			{
				ID:          11,
				ClientID:    clientWithCharge,
				DurationMin: 45,
				StudentRate: decimal.NewFromInt(100),
				TutorRate:   decimal.NewFromInt(75),
			},
		},
		clientWithoutCharge: {
			{
				ID:          21,
				ClientID:    clientWithoutCharge,
				DurationMin: 45,
				StudentRate: decimal.NewFromInt(100),
				TutorRate:   decimal.NewFromInt(75),
			},
		},
	}, nil)

	// Only clientWithCharge will succeed; clientWithoutCharge triggers a mock failure.
	chargeRepo := charges.NewMockChargeRepo().WithCharge(clientWithCharge, "ch_ok")
	mockClient := client.NewMockClientRepo(map[int64]*client.Customer{
		clientWithCharge: {
			ID:               clientWithCharge,
			StripeCustomerID: "cus_ok",
			HasValidPayment:  true,
		},
		clientWithoutCharge: {
			ID:               clientWithoutCharge,
			StripeCustomerID: "cus_fail",
			HasValidPayment:  true,
		},
	})
	service := NewService(chargeRepo, billingRepo, mockClient)

	if err := service.ProcessUnchargedSessions(); err != nil {
		t.Fatalf("ProcessUnchargedSessions returned error: %v", err)
	}

	if len(chargeRepo.ReceivedInputs) != 2 {
		t.Fatalf("expected 2 charge attempts, got %d", len(chargeRepo.ReceivedInputs))
	}

	seenClients := make(map[int64]bool)
	for _, input := range chargeRepo.ReceivedInputs {
		seenClients[input.ClientID] = true
	}

	if !seenClients[clientWithCharge] || !seenClients[clientWithoutCharge] {
		t.Fatalf("expected charges attempted for clients %v, got %v", []int64{clientWithCharge, clientWithoutCharge}, seenClients)
	}
}

func TestProcessUnchargedSessions_SkipsSessionsNewerThanAWeek(t *testing.T) {
	clientID := int64(77)
	now := time.Now()

	oldSession := Session{
		ID:          1,
		ClientID:    clientID,
		StartTime:   now.AddDate(0, 0, -8),
		DurationMin: 60,
		StudentRate: decimal.NewFromInt(100),
		TutorRate:   decimal.NewFromInt(70),
	}
	recentSession := Session{
		ID:          2,
		ClientID:    clientID,
		StartTime:   now.AddDate(0, 0, -2),
		DurationMin: 60,
		StudentRate: decimal.NewFromInt(100),
		TutorRate:   decimal.NewFromInt(70),
	}

	billingRepo := NewMockBillingRepo(map[int64][]Session{
		clientID: {oldSession, recentSession},
	}, nil)
	chargeRepo := charges.NewMockChargeRepo().WithCharge(clientID, "ch_old")
	mockClient := client.NewMockClientRepo(map[int64]*client.Customer{
		clientID: {
			ID:               clientID,
			StripeCustomerID: "cus_ok",
			HasValidPayment:  true,
		},
	})
	service := NewService(chargeRepo, billingRepo, mockClient)

	if err := service.ProcessUnchargedSessions(); err != nil {
		t.Fatalf("ProcessUnchargedSessions returned error: %v", err)
	}

	if len(chargeRepo.ReceivedInputs) != 1 {
		t.Fatalf("expected 1 charge attempt, got %d", len(chargeRepo.ReceivedInputs))
	}

	input := chargeRepo.ReceivedInputs[0]
	if len(input.Sessions) != 1 || input.Sessions[0].ID != oldSession.ID {
		t.Fatalf("expected only old session to be charged, got sessions %v", input.Sessions)
	}

	if input.AmountCents != 10000 {
		t.Fatalf("expected amount 10000 cents for old session only, got %d", input.AmountCents)
	}
}
