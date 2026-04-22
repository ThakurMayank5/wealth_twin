package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"securewealth-backend/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AuditRepository struct {
	db *pgxpool.Pool
}

func NewAuditRepository(db *pgxpool.Pool) *AuditRepository {
	return &AuditRepository{db: db}
}

func (r *AuditRepository) CreateWealthAction(ctx context.Context, userID, actionType string, payload any, riskScore int, riskLevel, decision, deviceHash, ipAddress string) (string, error) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	id := uuid.NewString()
	query := `
		INSERT INTO wealth_actions (
			id, user_id, action_type, action_payload,
			risk_score, risk_level, decision, device_hash, ip_address
		)
		VALUES (
			$1, $2, $3, $4,
			$5, $6, $7, $8, NULLIF($9, '')::inet
		)
	`
	_, err = r.db.Exec(ctx, query, id, userID, actionType, raw, riskScore, riskLevel, decision, deviceHash, ipAddress)
	if err != nil {
		return "", err
	}
	return id, nil
}

func (r *AuditRepository) CreateRiskEvent(ctx context.Context, userID, actionType string, riskScore int, signals any, decision string) (string, error) {
	raw, err := json.Marshal(signals)
	if err != nil {
		return "", err
	}

	id := uuid.NewString()
	query := `
		INSERT INTO risk_events (
			id, user_id, action_type, risk_score,
			signals, decision
		)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err = r.db.Exec(ctx, query, id, userID, actionType, riskScore, raw, decision)
	if err != nil {
		return "", err
	}
	return id, nil
}

func (r *AuditRepository) ListRiskEvents(ctx context.Context, userID string, page, limit int) ([]models.RiskEvent, int, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	var total int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(1) FROM risk_events WHERE user_id = $1`, userID).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	query := fmt.Sprintf(`
		SELECT id::text, user_id::text, COALESCE(action_type, ''),
			COALESCE(risk_score, 0),
			COALESCE(signals, '{}'::jsonb),
			COALESCE(decision, 'ALLOW'),
			COALESCE(resolved, false),
			created_at
		FROM risk_events
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT %d OFFSET %d
	`, limit, offset)

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := make([]models.RiskEvent, 0, limit)
	for rows.Next() {
		var event models.RiskEvent
		if err := rows.Scan(
			&event.ID,
			&event.UserID,
			&event.ActionType,
			&event.RiskScore,
			&event.Signals,
			&event.Decision,
			&event.Resolved,
			&event.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, event)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return items, total, nil
}
