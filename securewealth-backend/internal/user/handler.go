package user

import (
	"net/http"
	"strings"

	"securewealth-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	Users *repository.UserRepository
}

func NewHandler(users *repository.UserRepository) *Handler {
	return &Handler{Users: users}
}

func (h *Handler) GetProfile(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	profile, err := h.Users.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"profile": profile})
}

func (h *Handler) UpdateRiskProfile(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req struct {
		RiskAppetite    string  `json:"risk_appetite"`
		MonthlyIncome   float64 `json:"monthly_income"`
		MonthlyExpenses float64 `json:"monthly_expenses"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	risk := strings.ToUpper(strings.TrimSpace(req.RiskAppetite))
	if risk == "" {
		risk = "MODERATE"
	}

	if err := h.Users.UpdateRiskProfile(c.Request.Context(), userID, risk, req.MonthlyIncome, req.MonthlyExpenses); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update risk profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}
