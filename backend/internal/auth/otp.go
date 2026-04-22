package auth

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"math/rand"
	"net/http"
	"time"
)

func (h *Handler) SendOTP(c *gin.Context) {
	userID := GetUserID(c)
	sessionID := c.GetString("session_id")

	// Rate limit: max 3 OTP send attempts per 10 minutes
	rateLimitKey := "otp:ratelimit:" + userID
	count, _ := h.redis.Incr(c.Request.Context(), rateLimitKey)
	if count == 1 {
		h.redis.Expire(c.Request.Context(), rateLimitKey, 10*time.Minute)
	}
	if count > 3 {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "too many OTP requests", "retry_after": 600})
		return
	}

	// Generate 6-digit OTP
	otp := fmt.Sprintf("%06d", rand.Intn(1000000))

	// Store in Redis: key is scoped to session so one OTP per session
	otpKey := "otp:" + userID + ":" + sessionID
	otpData := map[string]interface{}{
		"otp":          otp,
		"attempts":     0,
		"generated_at": time.Now().Unix(),
	}
	h.redis.SetJSON(c.Request.Context(), otpKey, otpData, 5*time.Minute)

	// In production: send via SMS gateway
	// In hackathon: log it and return it in dev mode
	if h.config.IsDev {
		c.JSON(http.StatusOK, gin.H{"success": true, "dev_otp": otp, "expires_in": 300})
		return
	}
	h.sms.Send(userID, otp) // mock SMS service
	c.JSON(http.StatusOK, gin.H{"success": true, "expires_in": 300})
}

func (h *Handler) VerifyOTP(c *gin.Context) {
	userID := GetUserID(c)
	sessionID := c.GetString("session_id")

	var req struct {
		OTP string `json:"otp" binding:"required,len=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "6-digit OTP required"})
		return
	}

	otpKey := "otp:" + userID + ":" + sessionID
	var otpData map[string]interface{}
	if err := h.redis.GetJSON(c.Request.Context(), otpKey, &otpData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OTP expired or not found"})
		return
	}

	// Increment attempt count atomically
	attempts := int(otpData["attempts"].(float64)) + 1

	if attempts > 3 {
		// Too many attempts — invalidate OTP and record fraud signal
		h.redis.Del(c.Request.Context(), otpKey)
		// This counter is read by the fraud engine as a risk signal
		h.redis.Incr(c.Request.Context(), "otp:attempts:"+userID)
		h.redis.Expire(c.Request.Context(), "otp:attempts:"+userID, time.Hour)

		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":    "too_many_attempts",
			"verified": false,
		})
		return
	}

	// Update attempt count in Redis
	otpData["attempts"] = attempts
	h.redis.SetJSON(c.Request.Context(), otpKey, otpData, 5*time.Minute)

	if req.OTP != otpData["otp"].(string) {
		c.JSON(http.StatusBadRequest, gin.H{
			"verified":           false,
			"attempts_remaining": 3 - attempts,
		})
		return
	}

	// OTP verified — delete it so it can't be reused
	h.redis.Del(c.Request.Context(), otpKey)
	c.JSON(http.StatusOK, gin.H{"verified": true})
}
