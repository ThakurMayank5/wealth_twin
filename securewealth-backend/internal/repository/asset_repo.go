package repository

import (
	"context"
	"encoding/json"

	"securewealth-backend/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AssetRepository struct {
	db *pgxpool.Pool
}

func NewAssetRepository(db *pgxpool.Pool) *AssetRepository {
	return &AssetRepository{db: db}
}

func (r *AssetRepository) Add(ctx context.Context, asset models.Asset) (*models.Asset, error) {
	asset.ID = uuid.NewString()
	if len(asset.Metadata) == 0 {
		asset.Metadata = json.RawMessage(`{}`)
	}

	query := `
		INSERT INTO assets (
			id, user_id, asset_type, name,
			current_value, purchase_value, purchase_date, metadata
		)
		VALUES (
			$1, $2, $3, $4,
			$5, $6, $7, $8
		)
		RETURNING created_at, updated_at
	`
	err := r.db.QueryRow(
		ctx,
		query,
		asset.ID,
		asset.UserID,
		asset.AssetType,
		asset.Name,
		asset.CurrentValue,
		asset.PurchaseValue,
		nullableTime(asset.PurchaseDate),
		asset.Metadata,
	).Scan(&asset.CreatedAt, &asset.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &asset, nil
}

func (r *AssetRepository) NetWorthBreakdown(ctx context.Context, userID string) ([]models.NetWorthByType, error) {
	query := `
		SELECT asset_type, COALESCE(SUM(current_value), 0)::float8 AS value
		FROM assets
		WHERE user_id = $1
		GROUP BY asset_type
		ORDER BY value DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]models.NetWorthByType, 0)
	for rows.Next() {
		var item models.NetWorthByType
		if err := rows.Scan(&item.AssetType, &item.Value); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func (r *AssetRepository) TotalAssetValue(ctx context.Context, userID string) (float64, error) {
	query := `SELECT COALESCE(SUM(current_value), 0)::float8 FROM assets WHERE user_id = $1`
	var total float64
	err := r.db.QueryRow(ctx, query, userID).Scan(&total)
	return total, err
}
