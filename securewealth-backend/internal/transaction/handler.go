package transaction

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"securewealth-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	Transactions *repository.TransactionRepository
}

func NewHandler(transactions *repository.TransactionRepository) *Handler {
	return &Handler{Transactions: transactions}
}

func (h *Handler) List(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	page := parsePositiveInt(c.DefaultQuery("page", "1"), 1)
	limit := parsePositiveInt(c.DefaultQuery("limit", "20"), 20)
	fromDate, err := parseDateQuery(c.Query("from_date"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "from_date must be YYYY-MM-DD"})
		return
	}
	toDate, err := parseDateQuery(c.Query("to_date"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "to_date must be YYYY-MM-DD"})
		return
	}

	items, total, err := h.Transactions.List(c.Request.Context(), userID, repository.ListTransactionsParams{
		Page:     page,
		Limit:    limit,
		Category: strings.TrimSpace(c.Query("category")),
		Type:     strings.TrimSpace(c.Query("type")),
		FromDate: fromDate,
		ToDate:   toDate,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch transactions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

func (h *Handler) Summary(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	ctx := c.Request.Context()
	monthSpend, err := h.Transactions.CurrentMonthSpend(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch current month summary"})
		return
	}

	byCategory, err := h.Transactions.SummaryByCategoryCurrentMonth(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch category summary"})
		return
	}

	trend, err := h.Transactions.MonthlyTrend(ctx, userID, 6)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch monthly trend"})
		return
	}

	patterns, err := h.Transactions.SpendingPatterns(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch spending patterns"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"current_month": gin.H{
			"month": time.Now().Format("2006-01"),
			"spend": monthSpend,
		},
		"by_category":       byCategory,
		"monthly_trend":     trend,
		"spending_patterns": patterns,
	})
}

func parsePositiveInt(raw string, fallback int) int {
	v, err := strconv.Atoi(strings.TrimSpace(raw))
	if err != nil || v <= 0 {
		return fallback
	}
	return v
}

func parseDateQuery(raw string) (*time.Time, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return nil, nil
	}
	t, err := time.Parse("2006-01-02", value)
	if err != nil {
		return nil, err
	}
	return &t, nil
}
