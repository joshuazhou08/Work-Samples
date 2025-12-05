package billing

import (
	"context"
	"time"

	"github.com/shopspring/decimal"
)

// Session represents a tutoring session plus its billing rates.
type Session struct {
	ID          int64
	ClientID    int64
	StudentID   int64
	TutorID     int64
	TutorName   string
	StartTime   time.Time
	DurationMin int
	StudentRate decimal.Decimal
	TutorRate   decimal.Decimal
}

// Repository defines all DB operations needed for billing.
type Repository interface {
	// GetUnchargedSessions returns sessions grouped by client_id.
	GetUnchargedSessions(ctx context.Context) (map[int64][]Session, error)
}
