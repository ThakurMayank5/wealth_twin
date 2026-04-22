package models

import (
	"encoding/json"
	"time"
)

type User struct {
	ID               string    `json:"id"`
	Email            string    `json:"email"`
	Phone            string    `json:"phone"`
	FullName         string    `json:"full_name"`
	PasswordHash     string    `json:"-"`
	KYCStatus        string    `json:"kyc_status"`
	RiskAppetite     string    `json:"risk_appetite"`
	AvgMonthlyIncome float64   `json:"avg_monthly_income"`
	AvgMonthlySpend  float64   `json:"avg_monthly_spend"`
	AccountBalance   float64   `json:"account_balance"`
	ConsentGiven     bool      `json:"consent_given"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type Device struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	DeviceHash string    `json:"device_hash"`
	UserAgent  string    `json:"user_agent"`
	IPAddress  string    `json:"ip_address"`
	IsTrusted  bool      `json:"is_trusted"`
	FirstSeen  time.Time `json:"first_seen_at"`
	LastSeen   time.Time `json:"last_seen_at"`
}

type Transaction struct {
	ID             string    `json:"id"`
	UserID         string    `json:"user_id"`
	Amount         float64   `json:"amount"`
	Type           string    `json:"type"`
	Category       string    `json:"category"`
	Merchant       string    `json:"merchant"`
	Description    string    `json:"description"`
	Timestamp      time.Time `json:"timestamp"`
	RunningBalance float64   `json:"running_balance"`
	Source         string    `json:"source"`
}

type Goal struct {
	ID                  string    `json:"id"`
	UserID              string    `json:"user_id"`
	Name                string    `json:"name"`
	GoalType            string    `json:"goal_type"`
	TargetAmount        float64   `json:"target_amount"`
	CurrentAmount       float64   `json:"current_amount"`
	TargetDate          time.Time `json:"target_date"`
	MonthlyContribution float64   `json:"monthly_contribution"`
	Status              string    `json:"status"`
	CreatedAt           time.Time `json:"created_at"`
}

type SIPMandate struct {
	ID              string    `json:"id"`
	UserID          string    `json:"user_id"`
	FundID          string    `json:"fund_id"`
	FundName        string    `json:"fund_name"`
	Amount          float64   `json:"amount"`
	Frequency       string    `json:"frequency"`
	Status          string    `json:"status"`
	StartDate       time.Time `json:"start_date"`
	NextDueDate     time.Time `json:"next_due_date"`
	IsFirstTimeFund bool      `json:"is_first_time_fund"`
	CreatedAt       time.Time `json:"created_at"`
}

type Asset struct {
	ID            string          `json:"id"`
	UserID        string          `json:"user_id"`
	AssetType     string          `json:"asset_type"`
	Name          string          `json:"name"`
	CurrentValue  float64         `json:"current_value"`
	PurchaseValue float64         `json:"purchase_value"`
	PurchaseDate  time.Time       `json:"purchase_date"`
	Metadata      json.RawMessage `json:"metadata"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
}

type WealthAction struct {
	ID            string          `json:"id"`
	UserID        string          `json:"user_id"`
	ActionType    string          `json:"action_type"`
	ActionPayload json.RawMessage `json:"action_payload"`
	RiskScore     int             `json:"risk_score"`
	RiskLevel     string          `json:"risk_level"`
	Decision      string          `json:"decision"`
	DeviceHash    string          `json:"device_hash"`
	IPAddress     string          `json:"ip_address"`
	CreatedAt     time.Time       `json:"created_at"`
}

type RiskEvent struct {
	ID         string          `json:"id"`
	UserID     string          `json:"user_id"`
	ActionType string          `json:"action_type"`
	RiskScore  int             `json:"risk_score"`
	Signals    json.RawMessage `json:"signals"`
	Decision   string          `json:"decision"`
	Resolved   bool            `json:"resolved"`
	CreatedAt  time.Time       `json:"created_at"`
}

type CategoryAmount struct {
	Category string  `json:"category"`
	Amount   float64 `json:"amount"`
}

type MonthlyAmount struct {
	Month  string  `json:"month"`
	Amount float64 `json:"amount"`
}

type NetWorthByType struct {
	AssetType string  `json:"asset_type"`
	Value     float64 `json:"value"`
}
