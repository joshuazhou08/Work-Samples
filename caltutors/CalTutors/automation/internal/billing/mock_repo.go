package billing

import (
	"context"
	"time"
)

type MockBillingRepo struct {
	SessionsByClient map[int64][]Session
	Err              error
}

func NewMockBillingRepo(sessionsByClient map[int64][]Session, err error) *MockBillingRepo {
	return &MockBillingRepo{
		SessionsByClient: sessionsByClient,
		Err:              err,
	}
}

func (r *MockBillingRepo) GetUnchargedSessions(ctx context.Context) (map[int64][]Session, error) {
	if r.Err != nil {
		return nil, r.Err
	}

	cutoff := time.Now().AddDate(0, 0, -7)
	filtered := make(map[int64][]Session)
	for clientID, sessions := range r.SessionsByClient {
		for _, sess := range sessions {
			if sess.StartTime.Before(cutoff) {
				filtered[clientID] = append(filtered[clientID], sess)
			}
		}
	}

	return filtered, nil
}
