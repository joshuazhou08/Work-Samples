package client

import (
	"context"
	"fmt"
)

// MockClientRepo is an in-memory implementation of the client repository.
type MockClientRepo struct {
	Customers map[int64]*Customer
	Err       error
	Lookups   []int64
}

// NewMockClientRepo constructs a mock repo seeded with customers.
func NewMockClientRepo(customers map[int64]*Customer) *MockClientRepo {
	return &MockClientRepo{
		Customers: customers,
	}
}

// GetCustomerByID returns the customer for the given ID or an error.
func (m *MockClientRepo) GetCustomerByID(ctx context.Context, id int64) (*Customer, error) {
	m.Lookups = append(m.Lookups, id)

	if m.Err != nil {
		return nil, m.Err
	}

	cust, ok := m.Customers[id]
	if !ok {
		return nil, fmt.Errorf("mock: customer %d not found", id)
	}

	return cust, nil
}
