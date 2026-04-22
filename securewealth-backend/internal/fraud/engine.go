package fraud

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	redisclient "securewealth-backend/internal/redis"
	"securewealth-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type RiskResult struct {
	Score    int      `json:"score"`
	Level    string   `json:"level"`
	Decision string   `json:"decision"`
	Signals  []Signal `json:"signals"`
	EventID  string   `json:"event_id,omitempty"`
	Reason   string   `json:"reason,omitempty"`
}

type EvaluateInput struct {
	UserID          string
	SessionID       string
	DeviceHash      string
	IPAddress       string
	ActionType      string
	Amount          float64
	Metadata        map[string]any
	Payload         map[string]any
	IsTrustedDevice bool
}

type Engine struct {
	Redis     *redisclient.Client
	SIPRepo   *repository.SIPRepository
	AuditRepo *repository.AuditRepository
}

func NewEngine(redis *redisclient.Client, sipRepo *repository.SIPRepository, auditRepo *repository.AuditRepository) *Engine {
	return &Engine{
		Redis:     redis,
		SIPRepo:   sipRepo,
		AuditRepo: auditRepo,
	}
}

func (e *Engine) Evaluate(ctx context.Context, input EvaluateInput) (RiskResult, error) {
	signals := make([]Signal, 0, 6)
	score := 0

	if !input.IsTrustedDevice {
		signals = append(signals, Signal{
			Name:    "untrusted_device",
			Score:   ScoreUntrustedDevice,
			Message: "Action from an untrusted device",
		})
		score += ScoreUntrustedDevice
	}

	actionTSRaw := e.Redis.Get(ctx, fmt.Sprintf("action:ts:%s", input.UserID))
	if actionTSRaw != "" {
		if actionTS, err := strconv.ParseInt(actionTSRaw, 10, 64); err == nil {
			if time.Now().Unix()-actionTS < 30 {
				signals = append(signals, Signal{
					Name:    "fast_action",
					Score:   ScoreFastAction,
					Message: "High velocity action immediately after login",
				})
				score += ScoreFastAction
			}
		}
	}

	if input.Amount > 0 {
		avgInvest, err := e.averageInvestment(ctx, input.UserID)
		if err == nil && avgInvest > 0 && input.Amount > (3*avgInvest) {
			signals = append(signals, Signal{
				Name:    "amount_unusual",
				Score:   ScoreAmountUnusual,
				Message: "Amount is unusual relative to historical investment behavior",
			})
			score += ScoreAmountUnusual
		}
	}

	otpAttemptsRaw := e.Redis.Get(ctx, fmt.Sprintf("otp:attempts:%s", input.UserID))
	if otpAttemptsRaw != "" {
		if attempts, err := strconv.Atoi(otpAttemptsRaw); err == nil && attempts > 2 {
			signals = append(signals, Signal{
				Name:    "otp_retries",
				Score:   ScoreOTPRetries,
				Message: "Multiple OTP verification failures detected",
			})
			score += ScoreOTPRetries
		}
	}

	if firstTime, ok := input.Metadata["is_first_time_fund"].(bool); ok && firstTime {
		signals = append(signals, Signal{
			Name:    "new_fund_type",
			Score:   ScoreNewFundType,
			Message: "First-time fund interaction",
		})
		score += ScoreNewFundType
	}

	if cancelCount := toInt(input.Metadata["cancel_count"]); cancelCount >= 3 {
		signals = append(signals, Signal{
			Name:    "cancel_retry",
			Score:   ScoreCancelRetry,
			Message: "Repeated cancel attempts detected",
		})
		score += ScoreCancelRetry
	}

	level, decision := classify(score)
	result := RiskResult{
		Score:    score,
		Level:    level,
		Decision: decision,
		Signals:  signals,
		Reason:   primaryReason(signals, decision),
	}

	if input.Payload == nil {
		input.Payload = map[string]any{}
	}
	if _, ok := input.Payload["amount"]; !ok && input.Amount > 0 {
		input.Payload["amount"] = input.Amount
	}
	if len(input.Metadata) > 0 {
		input.Payload["metadata"] = input.Metadata
	}

	if _, err := e.AuditRepo.CreateWealthAction(
		ctx,
		input.UserID,
		input.ActionType,
		input.Payload,
		score,
		level,
		decision,
		input.DeviceHash,
		input.IPAddress,
	); err != nil {
		return RiskResult{}, err
	}

	eventID, err := e.AuditRepo.CreateRiskEvent(
		ctx,
		input.UserID,
		input.ActionType,
		score,
		signals,
		decision,
	)
	if err != nil {
		return RiskResult{}, err
	}
	result.EventID = eventID

	cacheKey := fmt.Sprintf("fraud:cache:%s:%s", input.UserID, input.SessionID)
	_ = e.Redis.SetJSON(ctx, cacheKey, result, 30*time.Minute)

	return result, nil
}

func (e *Engine) averageInvestment(ctx context.Context, userID string) (float64, error) {
	cacheKey := fmt.Sprintf("avg:invest:%s", userID)
	cached := strings.TrimSpace(e.Redis.Get(ctx, cacheKey))
	if cached != "" {
		v, err := strconv.ParseFloat(cached, 64)
		if err == nil {
			return v, nil
		}
	}

	avg, err := e.SIPRepo.AvgInvestmentLast6Months(ctx, userID)
	if err != nil {
		return 0, err
	}
	e.Redis.Set(ctx, cacheKey, strconv.FormatFloat(avg, 'f', 2, 64), time.Hour)
	return avg, nil
}

func classify(score int) (string, string) {
	switch {
	case score <= 30:
		return "LOW", "ALLOW"
	case score <= 60:
		return "MEDIUM", "WARN"
	default:
		return "HIGH", "BLOCK"
	}
}

func primaryReason(signals []Signal, decision string) string {
	if len(signals) == 0 {
		if decision == "ALLOW" {
			return "No significant fraud signal detected"
		}
		return "Insufficient signals"
	}
	max := signals[0]
	for _, s := range signals[1:] {
		if s.Score > max.Score {
			max = s
		}
	}
	return max.Message
}

func toInt(v any) int {
	switch n := v.(type) {
	case int:
		return n
	case int32:
		return int(n)
	case int64:
		return int(n)
	case float32:
		return int(n)
	case float64:
		return int(n)
	case string:
		x, _ := strconv.Atoi(strings.TrimSpace(n))
		return x
	default:
		return 0
	}
}

type SecurityHandler struct {
	Engine    *Engine
	AuditRepo *repository.AuditRepository
}

func NewSecurityHandler(engine *Engine, auditRepo *repository.AuditRepository) *SecurityHandler {
	return &SecurityHandler{Engine: engine, AuditRepo: auditRepo}
}

func (h *SecurityHandler) EvaluateAction(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	sessionID := strings.TrimSpace(c.GetString("session_id"))
	deviceHash := strings.TrimSpace(c.GetString("device_hash"))
	trusted := c.GetBool("is_trusted_device")
	if userID == "" || sessionID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var body struct {
		ActionType string         `json:"action_type"`
		Amount     float64        `json:"amount"`
		Metadata   map[string]any `json:"metadata"`
		Payload    map[string]any `json:"payload"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	if strings.TrimSpace(body.ActionType) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "action_type is required"})
		return
	}

	result, err := h.Engine.Evaluate(c.Request.Context(), EvaluateInput{
		UserID:          userID,
		SessionID:       sessionID,
		DeviceHash:      deviceHash,
		IPAddress:       c.ClientIP(),
		ActionType:      body.ActionType,
		Amount:          body.Amount,
		Metadata:        body.Metadata,
		Payload:         body.Payload,
		IsTrustedDevice: trusted,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to evaluate action"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *SecurityHandler) GetEvents(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	page := parseInt(c.DefaultQuery("page", "1"), 1)
	limit := parseInt(c.DefaultQuery("limit", "20"), 20)
	items, total, err := h.AuditRepo.ListRiskEvents(c.Request.Context(), userID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch risk events"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

func parseInt(raw string, fallback int) int {
	v, err := strconv.Atoi(strings.TrimSpace(raw))
	if err != nil || v <= 0 {
		return fallback
	}
	return v
}

func toJSONMap(raw []byte) map[string]any {
	if len(raw) == 0 {
		return map[string]any{}
	}
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		return map[string]any{}
	}
	return m
}
