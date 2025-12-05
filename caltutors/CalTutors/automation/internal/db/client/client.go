package client

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/joshuazhou08/CalTutors-Automation/internal/db" // ← update to your module path
)

// Customer represents a CalTutors user with billing capability.
type Customer struct {
	ID               int64
	StripeCustomerID string
	Email            string
	FullName         string
	HasValidPayment  bool
	BalanceCents     int64
	Timezone         string
}

// Repository defines the minimal interface for loading customers.
type Repository interface {
	GetCustomerByID(ctx context.Context, id int64) (*Customer, error)
}

// ClientRepo is a simple repository for loading customer data.
type ClientRepo struct{}

// Constructor
func NewClientRepo() *ClientRepo {
	return &ClientRepo{}
}

// GetCustomerByID loads the customer by their CalTutors internal ID.
func (r *ClientRepo) GetCustomerByID(ctx context.Context, id int64) (*Customer, error) {
	const query = `
        SELECT 
            id,
            stripe_customer_id,
            email,
            first_name || ' ' || last_name AS full_name,
            billing_status = 'valid' AS has_valid_payment,
            COALESCE((balance * 100)::bigint, 0) AS balance_cents,
            COALESCE(timezone, 'America/Los_Angeles') AS timezone
        FROM accounts_user
        WHERE id = $1
        LIMIT 1;
    `

	row := db.DB.QueryRow(ctx, query, id)

	var c Customer
	err := row.Scan(
		&c.ID,
		&c.StripeCustomerID,
		&c.Email,
		&c.FullName,
		&c.HasValidPayment,
		&c.BalanceCents,
		&c.Timezone,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("customer %d not found", id)
		}
		return nil, fmt.Errorf("GetCustomerByID scan error: %w", err)
	}

	return &c, nil
}
