package repository

import (
	"context"

	"securewealth-backend/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type GoalRepository struct {
	db *pgxpool.Pool
}

func NewGoalRepository(db *pgxpool.Pool) *GoalRepository {
	return &GoalRepository{db: db}
}

func (r *GoalRepository) ListByUser(ctx context.Context, userID string) ([]models.Goal, error) {
	query := `
		SELECT id::text, user_id::text, name, goal_type,
			target_amount::float8,
			COALESCE(current_amount, 0)::float8,
			target_date,
			COALESCE(monthly_contribution, 0)::float8,
			COALESCE(status, 'ACTIVE'),
			created_at
		FROM goals
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	goals := make([]models.Goal, 0)
	for rows.Next() {
		var g models.Goal
		if err := rows.Scan(
			&g.ID,
			&g.UserID,
			&g.Name,
			&g.GoalType,
			&g.TargetAmount,
			&g.CurrentAmount,
			&g.TargetDate,
			&g.MonthlyContribution,
			&g.Status,
			&g.CreatedAt,
		); err != nil {
			return nil, err
		}
		goals = append(goals, g)
	}
	return goals, rows.Err()
}

func (r *GoalRepository) Create(ctx context.Context, goal models.Goal) (*models.Goal, error) {
	goal.ID = uuid.NewString()
	query := `
		INSERT INTO goals (
			id, user_id, name, goal_type,
			target_amount, current_amount, target_date,
			monthly_contribution, status
		) VALUES (
			$1, $2, $3, $4,
			$5, $6, $7,
			$8, COALESCE(NULLIF($9, ''), 'ACTIVE')
		)
		RETURNING created_at
	`
	if err := r.db.QueryRow(
		ctx,
		query,
		goal.ID,
		goal.UserID,
		goal.Name,
		goal.GoalType,
		goal.TargetAmount,
		goal.CurrentAmount,
		goal.TargetDate,
		goal.MonthlyContribution,
		goal.Status,
	).Scan(&goal.CreatedAt); err != nil {
		return nil, err
	}
	if goal.Status == "" {
		goal.Status = "ACTIVE"
	}
	return &goal, nil
}

func (r *GoalRepository) GetByID(ctx context.Context, userID, goalID string) (*models.Goal, error) {
	query := `
		SELECT id::text, user_id::text, name, goal_type,
			target_amount::float8,
			COALESCE(current_amount, 0)::float8,
			target_date,
			COALESCE(monthly_contribution, 0)::float8,
			COALESCE(status, 'ACTIVE'),
			created_at
		FROM goals
		WHERE user_id = $1 AND id = $2
	`
	var g models.Goal
	if err := r.db.QueryRow(ctx, query, userID, goalID).Scan(
		&g.ID,
		&g.UserID,
		&g.Name,
		&g.GoalType,
		&g.TargetAmount,
		&g.CurrentAmount,
		&g.TargetDate,
		&g.MonthlyContribution,
		&g.Status,
		&g.CreatedAt,
	); err != nil {
		return nil, err
	}
	return &g, nil
}
