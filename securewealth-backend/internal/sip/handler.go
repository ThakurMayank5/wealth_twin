package sip

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"securewealth-backend/internal/fraud"
	"securewealth-backend/internal/models"
	redisclient "securewealth-backend/internal/redis"
	"securewealth-backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type Handler struct {
	SIPs          *repository.SIPRepository
	Redis         *redisclient.Client
	ConfirmSecret string
}

type createSIPRequest struct {
	FundID          string  `json:"fund_id"`
	FundName        string  `json:"fund_name"`
	Amount          float64 `json:"amount"`
	Frequency       string  `json:"frequency"`
	StartDate       string  `json:"start_date"`
	NextDueDate     string  `json:"next_due_date"`
	IsFirstTimeFund bool    `json:"is_first_time_fund"`
}

type updateSIPRequest struct {
	Amount      float64 `json:"amount"`
	Frequency   string  `json:"frequency"`
	NextDueDate string  `json:"next_due_date"`
	CancelCount int     `json:"cancel_count"`
}

type confirmRequest struct {
	ConfirmationToken string `json:"confirmation_token"`
}

type confirmEnvelope struct {
	UserID     string          `json:"user_id"`
	ActionType string          `json:"action_type"`
	Payload    json.RawMessage `json:"payload"`
}

type updateConfirmPayload struct {
	SIPID   string           `json:"sip_id"`
	Request updateSIPRequest `json:"request"`
}

type cancelConfirmPayload struct {
	SIPID       string `json:"sip_id"`
	CancelCount int    `json:"cancel_count"`
}

func NewHandler(sips *repository.SIPRepository, redis *redisclient.Client, confirmSecret string) *Handler {
	return &Handler{
		SIPs:          sips,
		Redis:         redis,
		ConfirmSecret: confirmSecret,
	}
}

func (h *Handler) Create(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req createSIPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if strings.TrimSpace(req.FundID) == "" || strings.TrimSpace(req.FundName) == "" || req.Amount <= 0 || strings.TrimSpace(req.StartDate) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "fund_id, fund_name, amount and start_date are required"})
		return
	}

	risk := fraudFromContext(c)
	if risk.Decision == "WARN" {
		token, err := h.storeConfirmation(c.Request.Context(), userID, "SIP_CREATE", req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create confirmation token"})
			return
		}
		c.JSON(http.StatusAccepted, gin.H{
			"status":             "PENDING_CONFIRMATION",
			"risk_score":         risk.Score,
			"risk_level":         risk.Level,
			"warning":            risk.Reason,
			"confirmation_token": token,
		})
		return
	}

	created, err := h.executeCreate(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create SIP"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"sip": created})
}

func (h *Handler) Update(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	sipID := strings.TrimSpace(c.Param("id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	if sipID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "sip id is required"})
		return
	}

	var req updateSIPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "amount must be greater than zero"})
		return
	}

	risk := fraudFromContext(c)
	if risk.Decision == "WARN" {
		payload := updateConfirmPayload{SIPID: sipID, Request: req}
		token, err := h.storeConfirmation(c.Request.Context(), userID, "SIP_UPDATE", payload)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create confirmation token"})
			return
		}
		c.JSON(http.StatusAccepted, gin.H{
			"status":             "PENDING_CONFIRMATION",
			"risk_score":         risk.Score,
			"risk_level":         risk.Level,
			"warning":            risk.Reason,
			"confirmation_token": token,
		})
		return
	}

	nextDueDate, err := parseOptionalDate(req.NextDueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "next_due_date must be YYYY-MM-DD"})
		return
	}

	if err := h.SIPs.Update(c.Request.Context(), userID, sipID, req.Amount, strings.ToUpper(strings.TrimSpace(req.Frequency)), nextDueDate); err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "sip not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update sip"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *Handler) Delete(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	sipID := strings.TrimSpace(c.Param("id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	if sipID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "sip id is required"})
		return
	}

	req := updateSIPRequest{}
	if c.Request.ContentLength > 0 {
		_ = c.ShouldBindJSON(&req)
	}

	risk := fraudFromContext(c)
	if risk.Decision == "WARN" {
		payload := cancelConfirmPayload{SIPID: sipID, CancelCount: req.CancelCount}
		token, err := h.storeConfirmation(c.Request.Context(), userID, "SIP_CANCEL", payload)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create confirmation token"})
			return
		}
		c.JSON(http.StatusAccepted, gin.H{
			"status":             "PENDING_CONFIRMATION",
			"risk_score":         risk.Score,
			"risk_level":         risk.Level,
			"warning":            risk.Reason,
			"confirmation_token": token,
		})
		return
	}

	if err := h.SIPs.Cancel(c.Request.Context(), userID, sipID); err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "sip not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to cancel sip"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *Handler) Confirm(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req confirmRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.ConfirmationToken) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "confirmation_token is required"})
		return
	}

	ctx := c.Request.Context()
	key := "confirm:" + strings.TrimSpace(req.ConfirmationToken)
	var env confirmEnvelope
	if err := h.Redis.GetJSON(ctx, key, &env); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid or expired confirmation token"})
		return
	}
	if env.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "token does not belong to user"})
		return
	}

	var response any
	switch env.ActionType {
	case "SIP_CREATE":
		var payload createSIPRequest
		if err := json.Unmarshal(env.Payload, &payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid confirmation payload"})
			return
		}
		created, err := h.executeCreate(ctx, userID, payload)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create sip"})
			return
		}
		response = gin.H{"sip": created}
	case "SIP_UPDATE":
		var payload updateConfirmPayload
		if err := json.Unmarshal(env.Payload, &payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid confirmation payload"})
			return
		}
		nextDueDate, err := parseOptionalDate(payload.Request.NextDueDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "next_due_date must be YYYY-MM-DD"})
			return
		}
		if err := h.SIPs.Update(ctx, userID, payload.SIPID, payload.Request.Amount, strings.ToUpper(strings.TrimSpace(payload.Request.Frequency)), nextDueDate); err != nil {
			if err == pgx.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": "sip not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update sip"})
			return
		}
		response = gin.H{"success": true}
	case "SIP_CANCEL":
		var payload cancelConfirmPayload
		if err := json.Unmarshal(env.Payload, &payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid confirmation payload"})
			return
		}
		if err := h.SIPs.Cancel(ctx, userID, payload.SIPID); err != nil {
			if err == pgx.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": "sip not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to cancel sip"})
			return
		}
		response = gin.H{"success": true}
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported confirmation action"})
		return
	}

	h.Redis.Del(ctx, key)
	c.JSON(http.StatusOK, gin.H{
		"executed":    true,
		"action_type": env.ActionType,
		"result":      response,
	})
}

func (h *Handler) executeCreate(ctx context.Context, userID string, req createSIPRequest) (*models.SIPMandate, error) {
	startDate, err := time.Parse("2006-01-02", strings.TrimSpace(req.StartDate))
	if err != nil {
		return nil, err
	}
	nextDueDate, err := parseOptionalDate(req.NextDueDate)
	if err != nil {
		return nil, err
	}

	mandate := models.SIPMandate{
		UserID:          userID,
		FundID:          strings.TrimSpace(req.FundID),
		FundName:        strings.TrimSpace(req.FundName),
		Amount:          req.Amount,
		Frequency:       strings.ToUpper(strings.TrimSpace(req.Frequency)),
		Status:          "ACTIVE",
		StartDate:       startDate,
		IsFirstTimeFund: req.IsFirstTimeFund,
	}
	if mandate.Frequency == "" {
		mandate.Frequency = "MONTHLY"
	}
	if nextDueDate != nil {
		mandate.NextDueDate = *nextDueDate
	}

	return h.SIPs.Create(ctx, mandate)
}

func parseOptionalDate(raw string) (*time.Time, error) {
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

func fraudFromContext(c *gin.Context) fraud.RiskResult {
	if v, ok := c.Get("fraud_result"); ok {
		if risk, ok := v.(fraud.RiskResult); ok {
			return risk
		}
	}
	return fraud.RiskResult{Decision: "ALLOW", Level: "LOW", Score: 0}
}

func (h *Handler) storeConfirmation(ctx context.Context, userID, actionType string, payload any) (string, error) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	hash := sha256.Sum256(raw)
	mac := hmac.New(sha256.New, []byte(h.ConfirmSecret))
	mac.Write([]byte(userID + hex.EncodeToString(hash[:])))
	token := hex.EncodeToString(mac.Sum(nil))

	env := confirmEnvelope{
		UserID:     userID,
		ActionType: actionType,
		Payload:    raw,
	}
	if err := h.Redis.SetJSON(ctx, "confirm:"+token, env, 5*time.Minute); err != nil {
		return "", err
	}
	return token, nil
}
