package repository

import (
	"context"
	"time"

	"securewealth-backend/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SIPRepository struct {
	db *pgxpool.Pool
}

func NewSIPRepository(db *pgxpool.Pool) *SIPRepository {
	return &SIPRepository{db: db}
}

func (r *SIPRepository) Create(ctx context.Context, mandate models.SIPMandate) (*models.SIPMandate, error) {
	mandate.ID = uuid.NewString()
	if mandate.Frequency == "" {
		mandate.Frequency = "MONTHLY"
	}
	if mandate.Status == "" {
		mandate.Status = "ACTIVE"
	}
	query := `
		INSERT INTO sip_mandates (
			id, user_id, fund_id, fund_name,
			amount, frequency, status, start_date,
			next_due_date, is_first_time_fund
		)
		VALUES (
			$1, $2, $3, $4,
			$5, $6, $7, $8,
			$9, $10
		)
		RETURNING created_at
	`
	if err := r.db.QueryRow(
		ctx,
		query,
		mandate.ID,
		mandate.UserID,
		mandate.FundID,
		mandate.FundName,
		mandate.Amount,
		mandate.Frequency,
		mandate.Status,
		mandate.StartDate,
		nullableTime(mandate.NextDueDate),
		mandate.IsFirstTimeFund,
	).Scan(&mandate.CreatedAt); err != nil {
		return nil, err
	}
	return &mandate, nil
}

func (r *SIPRepository) Update(ctx context.Context, userID, sipID string, amount float64, frequency string, nextDueDate *time.Time) error {
	query := `
		UPDATE sip_mandates
		SET amount = $1,
			frequency = COALESCE(NULLIF($2, ''), frequency),
			next_due_date = COALESCE($3, next_due_date)
		WHERE id = $4 AND user_id = $5 AND status != 'CANCELLED'
	`
	ct, err := r.db.Exec(ctx, query, amount, frequency, nextDueDate, sipID, userID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *SIPRepository) Cancel(ctx context.Context, userID, sipID string) error {
	query := `
		UPDATE sip_mandates
		SET status = 'CANCELLED',
			next_due_date = NULL
		WHERE id = $1 AND user_id = $2
	`
	ct, err := r.db.Exec(ctx, query, sipID, userID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *SIPRepository) GetByID(ctx context.Context, userID, sipID string) (*models.SIPMandate, error) {
	query := `
		SELECT id::text, user_id::text, fund_id, fund_name,
			amount::float8,
			COALESCE(frequency, 'MONTHLY'),
			COALESCE(status, 'ACTIVE'),
			start_date,
			COALESCE(next_due_date, start_date),
			COALESCE(is_first_time_fund, false),
			created_at
		FROM sip_mandates
		WHERE id = $1 AND user_id = $2
	`
	var m models.SIPMandate
	err := r.db.QueryRow(ctx, query, sipID, userID).Scan(
		&m.ID,
		&m.UserID,
		&m.FundID,
		&m.FundName,
		&m.Amount,
		&m.Frequency,
		&m.Status,
		&m.StartDate,
		&m.NextDueDate,
		&m.IsFirstTimeFund,
		&m.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *SIPRepository) CountActiveByUser(ctx context.Context, userID string) (int, error) {
	query := `SELECT COUNT(1) FROM sip_mandates WHERE user_id = $1 AND status = 'ACTIVE'`
	var count int
	err := r.db.QueryRow(ctx, query, userID).Scan(&count)
	return count, err
}

func (r *SIPRepository) SumActiveMonthly(ctx context.Context, userID string) (float64, error) {
	query := `
		SELECT COALESCE(SUM(amount), 0)::float8
		FROM sip_mandates
		WHERE user_id = $1 AND status = 'ACTIVE'
	`
	var total float64
	err := r.db.QueryRow(ctx, query, userID).Scan(&total)
	return total, err
}

func (r *SIPRepository) AvgInvestmentLast6Months(ctx context.Context, userID string) (float64, error) {
	query := `
		SELECT COALESCE(AVG(amount), 0)::float8
		FROM sip_mandates
		WHERE user_id = $1
			AND created_at >= NOW() - interval '6 months'
	`
	var avg float64
	err := r.db.QueryRow(ctx, query, userID).Scan(&avg)
	return avg, err
}

func nullableTime(t time.Time) *time.Time {
	if t.IsZero() {
		return nil
	}
	return &t
}
