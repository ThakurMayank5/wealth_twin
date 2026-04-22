package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"securewealth-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ListTransactionsParams struct {
	Page     int
	Limit    int
	Category string
	FromDate *time.Time
	ToDate   *time.Time
	Type     string
}

type TransactionRepository struct {
	db *pgxpool.Pool
}

func NewTransactionRepository(db *pgxpool.Pool) *TransactionRepository {
	return &TransactionRepository{db: db}
}

func (r *TransactionRepository) List(ctx context.Context, userID string, params ListTransactionsParams) ([]models.Transaction, int, error) {
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.Limit <= 0 || params.Limit > 100 {
		params.Limit = 20
	}

	filters := []string{"user_id = $1"}
	args := []any{userID}
	argPos := 2

	if params.Category != "" {
		filters = append(filters, fmt.Sprintf("category = $%d", argPos))
		args = append(args, params.Category)
		argPos++
	}
	if params.Type != "" {
		filters = append(filters, fmt.Sprintf("type = $%d", argPos))
		args = append(args, strings.ToUpper(params.Type))
		argPos++
	}
	if params.FromDate != nil {
		filters = append(filters, fmt.Sprintf("timestamp >= $%d", argPos))
		args = append(args, *params.FromDate)
		argPos++
	}
	if params.ToDate != nil {
		filters = append(filters, fmt.Sprintf("timestamp <= $%d", argPos))
		args = append(args, *params.ToDate)
		argPos++
	}

	whereClause := strings.Join(filters, " AND ")

	countQuery := "SELECT COUNT(1) FROM transactions WHERE " + whereClause
	var total int
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (params.Page - 1) * params.Limit
	listQuery := fmt.Sprintf(`
		SELECT id::text, user_id::text,
			amount::float8,
			type,
			COALESCE(category, ''),
			COALESCE(merchant, ''),
			COALESCE(description, ''),
			timestamp,
			COALESCE(running_balance, 0)::float8,
			COALESCE(source, 'CORE_BANKING')
		FROM transactions
		WHERE %s
		ORDER BY timestamp DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, params.Limit, offset)
	rows, err := r.db.Query(ctx, listQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	txs := make([]models.Transaction, 0, params.Limit)
	for rows.Next() {
		var tx models.Transaction
		if err := rows.Scan(
			&tx.ID,
			&tx.UserID,
			&tx.Amount,
			&tx.Type,
			&tx.Category,
			&tx.Merchant,
			&tx.Description,
			&tx.Timestamp,
			&tx.RunningBalance,
			&tx.Source,
		); err != nil {
			return nil, 0, err
		}
		txs = append(txs, tx)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return txs, total, nil
}

func (r *TransactionRepository) CurrentMonthSpend(ctx context.Context, userID string) (float64, error) {
	query := `
		SELECT COALESCE(SUM(amount), 0)::float8
		FROM transactions
		WHERE user_id = $1
			AND type = 'DEBIT'
			AND date_trunc('month', timestamp) = date_trunc('month', NOW())
	`
	var value float64
	err := r.db.QueryRow(ctx, query, userID).Scan(&value)
	return value, err
}

func (r *TransactionRepository) SummaryByCategoryCurrentMonth(ctx context.Context, userID string) ([]models.CategoryAmount, error) {
	query := `
		SELECT COALESCE(category, 'OTHER') AS category,
			COALESCE(SUM(amount), 0)::float8 AS amount
		FROM transactions
		WHERE user_id = $1
			AND type = 'DEBIT'
			AND date_trunc('month', timestamp) = date_trunc('month', NOW())
		GROUP BY COALESCE(category, 'OTHER')
		ORDER BY amount DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]models.CategoryAmount, 0)
	for rows.Next() {
		var item models.CategoryAmount
		if err := rows.Scan(&item.Category, &item.Amount); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func (r *TransactionRepository) MonthlyTrend(ctx context.Context, userID string, months int) ([]models.MonthlyAmount, error) {
	if months <= 0 {
		months = 6
	}
	query := `
		SELECT to_char(date_trunc('month', timestamp), 'YYYY-MM') AS month,
			COALESCE(SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END), 0)::float8 AS amount
		FROM transactions
		WHERE user_id = $1
			AND timestamp >= date_trunc('month', NOW()) - ($2::int * interval '1 month')
		GROUP BY date_trunc('month', timestamp)
		ORDER BY date_trunc('month', timestamp)
	`
	rows, err := r.db.Query(ctx, query, userID, months)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]models.MonthlyAmount, 0, months)
	for rows.Next() {
		var item models.MonthlyAmount
		if err := rows.Scan(&item.Month, &item.Amount); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func (r *TransactionRepository) SpendingPatterns(ctx context.Context, userID string) (map[string]any, error) {
	topMerchantsQuery := `
		SELECT COALESCE(merchant, 'UNKNOWN') AS merchant,
			COALESCE(SUM(amount), 0)::float8 AS amount
		FROM transactions
		WHERE user_id = $1
			AND type = 'DEBIT'
			AND timestamp >= NOW() - interval '90 days'
		GROUP BY COALESCE(merchant, 'UNKNOWN')
		ORDER BY amount DESC
		LIMIT 3
	`
	rows, err := r.db.Query(ctx, topMerchantsQuery, userID)
	if err != nil {
		return nil, err
	}

	topMerchants := make([]map[string]any, 0, 3)
	for rows.Next() {
		var merchant string
		var amount float64
		if err := rows.Scan(&merchant, &amount); err != nil {
			rows.Close()
			return nil, err
		}
		topMerchants = append(topMerchants, map[string]any{"merchant": merchant, "amount": amount})
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return nil, err
	}
	rows.Close()

	weekendQuery := `
		SELECT
			COALESCE(SUM(CASE WHEN EXTRACT(ISODOW FROM timestamp) IN (6,7) THEN amount ELSE 0 END), 0)::float8,
			COALESCE(SUM(amount), 0)::float8
		FROM transactions
		WHERE user_id = $1
			AND type = 'DEBIT'
			AND timestamp >= NOW() - interval '90 days'
	`
	var weekend float64
	var total float64
	if err := r.db.QueryRow(ctx, weekendQuery, userID).Scan(&weekend, &total); err != nil {
		return nil, err
	}

	ratio := 0.0
	if total > 0 {
		ratio = weekend / total
	}

	return map[string]any{
		"top_merchants":       topMerchants,
		"weekend_spend_ratio": ratio,
	}, nil
}

func (r *TransactionRepository) Recent(ctx context.Context, userID string, limit int) ([]models.Transaction, error) {
	if limit <= 0 || limit > 50 {
		limit = 10
	}
	query := `
		SELECT id::text, user_id::text,
			amount::float8,
			type,
			COALESCE(category, ''),
			COALESCE(merchant, ''),
			COALESCE(description, ''),
			timestamp,
			COALESCE(running_balance, 0)::float8,
			COALESCE(source, 'CORE_BANKING')
		FROM transactions
		WHERE user_id = $1
		ORDER BY timestamp DESC
		LIMIT $2
	`
	rows, err := r.db.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]models.Transaction, 0, limit)
	for rows.Next() {
		var tx models.Transaction
		if err := rows.Scan(
			&tx.ID,
			&tx.UserID,
			&tx.Amount,
			&tx.Type,
			&tx.Category,
			&tx.Merchant,
			&tx.Description,
			&tx.Timestamp,
			&tx.RunningBalance,
			&tx.Source,
		); err != nil {
			return nil, err
		}
		result = append(result, tx)
	}
	return result, rows.Err()
}
