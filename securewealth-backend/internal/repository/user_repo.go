package repository

import (
	"context"

	"securewealth-backend/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetByPhone(ctx context.Context, phone string) (*models.User, error) {
	query := `
		SELECT id::text, email, phone, full_name, password_hash,
			COALESCE(kyc_status, 'PENDING'),
			COALESCE(risk_appetite, 'MODERATE'),
			COALESCE(avg_monthly_income, 0)::float8,
			COALESCE(avg_monthly_spend, 0)::float8,
			COALESCE(account_balance, 0)::float8,
			COALESCE(consent_given, false),
			created_at, updated_at
		FROM users
		WHERE phone = $1
	`

	var user models.User
	err := r.db.QueryRow(ctx, query, phone).Scan(
		&user.ID,
		&user.Email,
		&user.Phone,
		&user.FullName,
		&user.PasswordHash,
		&user.KYCStatus,
		&user.RiskAppetite,
		&user.AvgMonthlyIncome,
		&user.AvgMonthlySpend,
		&user.AccountBalance,
		&user.ConsentGiven,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetByID(ctx context.Context, userID string) (*models.User, error) {
	query := `
		SELECT id::text, email, phone, full_name, password_hash,
			COALESCE(kyc_status, 'PENDING'),
			COALESCE(risk_appetite, 'MODERATE'),
			COALESCE(avg_monthly_income, 0)::float8,
			COALESCE(avg_monthly_spend, 0)::float8,
			COALESCE(account_balance, 0)::float8,
			COALESCE(consent_given, false),
			created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var user models.User
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&user.ID,
		&user.Email,
		&user.Phone,
		&user.FullName,
		&user.PasswordHash,
		&user.KYCStatus,
		&user.RiskAppetite,
		&user.AvgMonthlyIncome,
		&user.AvgMonthlySpend,
		&user.AccountBalance,
		&user.ConsentGiven,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) UpdateRiskProfile(ctx context.Context, userID, riskAppetite string, monthlyIncome, monthlyExpenses float64) error {
	query := `
		UPDATE users
		SET risk_appetite = $1,
			avg_monthly_income = $2,
			avg_monthly_spend = $3,
			updated_at = NOW()
		WHERE id = $4
	`
	_, err := r.db.Exec(ctx, query, riskAppetite, monthlyIncome, monthlyExpenses, userID)
	return err
}

func (r *UserRepository) GetDeviceByHash(ctx context.Context, userID, deviceHash string) (*models.Device, error) {
	query := `
		SELECT id::text, user_id::text, device_hash,
			COALESCE(user_agent, ''),
			COALESCE(ip_address::text, ''),
			COALESCE(is_trusted, false),
			first_seen_at, last_seen_at
		FROM devices
		WHERE user_id = $1 AND device_hash = $2
	`

	var d models.Device
	err := r.db.QueryRow(ctx, query, userID, deviceHash).Scan(
		&d.ID,
		&d.UserID,
		&d.DeviceHash,
		&d.UserAgent,
		&d.IPAddress,
		&d.IsTrusted,
		&d.FirstSeen,
		&d.LastSeen,
	)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *UserRepository) CreateDevice(ctx context.Context, userID, deviceHash, userAgent, ip string, isTrusted bool) error {
	query := `
		INSERT INTO devices (id, user_id, device_hash, user_agent, ip_address, is_trusted)
		VALUES ($1, $2, $3, $4, NULLIF($5, '')::inet, $6)
	`
	_, err := r.db.Exec(ctx, query, uuid.NewString(), userID, deviceHash, userAgent, ip, isTrusted)
	return err
}

func (r *UserRepository) UpdateDeviceLastSeen(ctx context.Context, userID, deviceHash, userAgent, ip string) error {
	query := `
		UPDATE devices
		SET last_seen_at = NOW(),
			user_agent = COALESCE(NULLIF($3, ''), user_agent),
			ip_address = COALESCE(NULLIF($4, '')::inet, ip_address),
			is_trusted = true
		WHERE user_id = $1 AND device_hash = $2
	`
	_, err := r.db.Exec(ctx, query, userID, deviceHash, userAgent, ip)
	return err
}

func (r *UserRepository) IsKnownTrustedDevice(ctx context.Context, userID, deviceHash string) (bool, error) {
	d, err := r.GetDeviceByHash(ctx, userID, deviceHash)
	if err == nil {
		return d.IsTrusted, nil
	}
	if err == pgx.ErrNoRows {
		return false, nil
	}
	return false, err
}

func (r *UserRepository) CreateUser(ctx context.Context, email, phone, fullName, passwordHash string) (*models.User, error) {
	id := uuid.NewString()
	query := `
		INSERT INTO users (id, email, phone, full_name, password_hash, kyc_status, risk_appetite, consent_given)
		VALUES ($1, $2, $3, $4, $5, 'PENDING', 'MODERATE', true)
		RETURNING created_at, updated_at
	`
	var user models.User
	user.ID = id
	user.Email = email
	user.Phone = phone
	user.FullName = fullName
	user.PasswordHash = passwordHash
	user.KYCStatus = "PENDING"
	user.RiskAppetite = "MODERATE"
	user.ConsentGiven = true

	err := r.db.QueryRow(ctx, query, id, email, phone, fullName, passwordHash).Scan(&user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}
