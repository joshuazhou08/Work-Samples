package charges

import "errors"

var ErrNotFound = errors.New("mock: charge not found")

type MockChargeRepo struct {
	CreatedCharges map[int64]string
	Err            error
	ReceivedInputs []ChargeInput
}

func NewMockChargeRepo() *MockChargeRepo {
	return &MockChargeRepo{
		CreatedCharges: make(map[int64]string),
	}
}

func (m *MockChargeRepo) WithError(err error) *MockChargeRepo {
	m.Err = err
	return m
}

func (m *MockChargeRepo) WithCharge(clientID int64, chargeID string) *MockChargeRepo {
	m.CreatedCharges[clientID] = chargeID
	return m
}

func (m *MockChargeRepo) CreateCharge(
	clientID int64,
	amountCents int64,
	currency string,
	description string,
) (string, error) {

	if m.Err != nil {
		return "", m.Err
	}

	chargeID, ok := m.CreatedCharges[clientID]
	if !ok {
		return "", ErrNotFound
	}

	return chargeID, nil
}

func (m *MockChargeRepo) Charge(input ChargeInput) ChargeResult {
	m.ReceivedInputs = append(m.ReceivedInputs, input)

	if m.Err != nil {
		return ChargeResult{
			Success: false,
			Error:   m.Err,
		}
	}

	chargeID, ok := m.CreatedCharges[input.ClientID]
	if !ok {
		return ChargeResult{
			Success: false,
			Error:   ErrNotFound,
		}
	}

	return ChargeResult{
		Success:        true,
		StripeChargeID: chargeID,
	}
}
