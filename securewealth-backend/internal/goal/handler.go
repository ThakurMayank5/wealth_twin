package goal

import (
	"math"
	"net/http"
	"strings"
	"time"

	"securewealth-backend/internal/models"
	"securewealth-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	Goals *repository.GoalRepository
}

func NewHandler(goals *repository.GoalRepository) *Handler {
	return &Handler{Goals: goals}
}

func (h *Handler) List(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	goals, err := h.Goals.ListByUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch goals"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": goals})
}

func (h *Handler) Create(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req struct {
		Name                string  `json:"name"`
		GoalType            string  `json:"goal_type"`
		TargetAmount        float64 `json:"target_amount"`
		TargetDate          string  `json:"target_date"`
		MonthlyContribution float64 `json:"monthly_contribution"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.GoalType) == "" || req.TargetAmount <= 0 || strings.TrimSpace(req.TargetDate) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name, goal_type, target_amount and target_date are required"})
		return
	}

	targetDate, err := time.Parse("2006-01-02", strings.TrimSpace(req.TargetDate))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "target_date must be YYYY-MM-DD"})
		return
	}

	goal := models.Goal{
		UserID:              userID,
		Name:                strings.TrimSpace(req.Name),
		GoalType:            strings.ToUpper(strings.TrimSpace(req.GoalType)),
		TargetAmount:        req.TargetAmount,
		TargetDate:          targetDate,
		MonthlyContribution: req.MonthlyContribution,
		CurrentAmount:       0,
		Status:              "ACTIVE",
	}

	created, err := h.Goals.Create(c.Request.Context(), goal)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create goal"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"goal": created})
}

func (h *Handler) GetProjection(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	goalID := strings.TrimSpace(c.Param("id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	if goalID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "goal id is required"})
		return
	}

	goal, err := h.Goals.GetByID(c.Request.Context(), userID, goalID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "goal not found"})
		return
	}

	months := monthsBetween(time.Now(), goal.TargetDate)
	if months < 1 {
		months = 1
	}

	current := projectValue(goal.CurrentAmount, goal.MonthlyContribution, months, 0.08)
	optimistic := projectValue(goal.CurrentAmount, goal.MonthlyContribution, months, 0.12)
	pessimistic := projectValue(goal.CurrentAmount, goal.MonthlyContribution, months, 0.04)

	c.JSON(http.StatusOK, gin.H{
		"goal_id":       goal.ID,
		"target_amount": goal.TargetAmount,
		"months_left":   months,
		"scenarios": gin.H{
			"current": gin.H{
				"projected_value": current,
				"gap":             round2(goal.TargetAmount - current),
			},
			"optimistic": gin.H{
				"projected_value": optimistic,
				"gap":             round2(goal.TargetAmount - optimistic),
			},
			"pessimistic": gin.H{
				"projected_value": pessimistic,
				"gap":             round2(goal.TargetAmount - pessimistic),
			},
		},
	})
}

func projectValue(currentAmount, monthlyContribution float64, months int, annualReturn float64) float64 {
	if months <= 0 {
		return round2(currentAmount)
	}
	monthlyRate := annualReturn / 12
	if monthlyRate == 0 {
		return round2(currentAmount + (monthlyContribution * float64(months)))
	}

	fvCurrent := currentAmount * math.Pow(1+monthlyRate, float64(months))
	fvMonthly := monthlyContribution * ((math.Pow(1+monthlyRate, float64(months)) - 1) / monthlyRate)
	return round2(fvCurrent + fvMonthly)
}

func monthsBetween(from, to time.Time) int {
	from = from.UTC()
	to = to.UTC()
	if !to.After(from) {
		return 0
	}
	years := to.Year() - from.Year()
	months := int(to.Month()) - int(from.Month())
	total := years*12 + months
	if to.Day() > from.Day() {
		total++
	}
	if total < 0 {
		return 0
	}
	return total
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
