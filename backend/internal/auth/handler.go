package auth

import (
	"encoding/base64"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Phone             string `json:"phone" binding:"required"`
	Password          string `json:"password" binding:"required,min=8"`
	DeviceFingerprint string `json:"device_fingerprint" binding:"required"`
}

type LoginResponse struct {
	AccessToken     string `json:"access_token"`
	RefreshToken    string `json:"refresh_token"`
	UserID          string `json:"user_id"`
	ExpiresIn       int    `json:"expires_in"` // seconds — 900 for 15 min
	IsTrustedDevice bool   `json:"is_trusted_device"`
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Look up user by phone
	user, err := h.repo.GetUserByPhone(c.Request.Context(), req.Phone)
	if err != nil {
		// Always return the same error for wrong phone OR wrong password
		// to prevent user enumeration attacks
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// 2. Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// 3. Device trust check
	isTrusted, err := h.repo.CheckDeviceTrust(c.Request.Context(), user.ID, req.DeviceFingerprint)
	if err != nil {
		// Device not found — register it as untrusted
		h.repo.RegisterDevice(c.Request.Context(), user.ID, req.DeviceFingerprint, c.ClientIP(), c.Request.UserAgent())
		isTrusted = false
	} else {
		// Update last_seen_at
		go h.repo.UpdateDeviceLastSeen(c.Request.Context(), user.ID, req.DeviceFingerprint)
	}

	// 4. Generate session ID (links access + refresh tokens together)
	sessionID := uuid.New().String()

	// 5. Build JWT claims
	claims := jwt.MapClaims{
		"sub":               user.ID,
		"session_id":        sessionID,
		"device_hash":       req.DeviceFingerprint,
		"is_trusted_device": isTrusted,
		"iat":               time.Now().Unix(),
		"exp":               time.Now().Add(15 * time.Minute).Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessTokenStr, err := accessToken.SignedString([]byte(h.config.JWTSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
		return
	}

	// 6. Generate refresh token (opaque random string, not a JWT)
	refreshToken := uuid.New().String() + uuid.New().String() // 72 chars of entropy

	// 7. Store refresh token in Redis
	// Key: session:{userId}:{sessionId}
	// Value: JSON with refreshToken hash, deviceHash, issuedAt
	sessionKey := "session:" + user.ID + ":" + sessionID
	sessionData := map[string]interface{}{
		"refresh_token_hash": hashString(refreshToken), // store hash, not raw token
		"device_hash":        req.DeviceFingerprint,
		"user_id":            user.ID,
		"issued_at":          time.Now().Unix(),
	}
	if err := h.redis.SetJSON(c.Request.Context(), sessionKey, sessionData, 7*24*time.Hour); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "session creation failed"})
		return
	}

	// 8. Store login timestamp for fast-action fraud detection
	// This is what the fraud engine reads to detect login→action < 30 seconds
	h.redis.Set(c.Request.Context(), "action:ts:"+user.ID, time.Now().Unix(), time.Hour)

	c.JSON(http.StatusOK, LoginResponse{
		AccessToken:     accessTokenStr,
		RefreshToken:    refreshToken, // raw token sent to client, hash stored in Redis
		UserID:          user.ID,
		ExpiresIn:       900,
		IsTrustedDevice: isTrusted,
	})
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

func (h *Handler) Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh_token required"})
		return
	}

	// We need to find the session. The session key is session:{userId}:{sessionId}.
	// But we only have the raw refresh token, not userId or sessionId.
	// Solution: scan Redis for keys matching "session:*" where refresh_token_hash matches.
	// For production: store a reverse index  refresh_token_hash → session_key in Redis.
	// For hackathon: include userId + sessionId encoded in the refresh token itself.

	// Hackathon approach — encode userId:sessionId:randomBytes into the refresh token:
	// Format: base64(userId + ":" + sessionId) + "." + randomBytes
	// Decode the prefix to get the session key without a scan.

	parts := strings.SplitN(req.RefreshToken, ".", 2)
	if len(parts) != 2 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	decoded, err := base64.StdEncoding.DecodeString(parts[0])
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	idParts := strings.SplitN(string(decoded), ":", 2)
	if len(idParts) != 2 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}
	userID, sessionID := idParts[0], idParts[1]

	// Look up session in Redis
	sessionKey := "session:" + userID + ":" + sessionID
	var sessionData map[string]interface{}
	if err := h.redis.GetJSON(c.Request.Context(), sessionKey, &sessionData); err != nil {
		// Session not found — expired or already used
		c.JSON(http.StatusUnauthorized, gin.H{"error": "session expired"})
		return
	}

	// Verify the refresh token hash
	storedHash, _ := sessionData["refresh_token_hash"].(string)
	if hashString(req.RefreshToken) != storedHash {
		// Token mismatch — possible replay attack
		// Delete the session entirely as a security measure
		h.redis.Del(c.Request.Context(), sessionKey)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	// Fetch user from DB to put fresh data in the new JWT
	user, err := h.repo.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	// === ROTATION: delete old session, create new one ===
	h.redis.Del(c.Request.Context(), sessionKey)

	newSessionID := uuid.New().String()
	newRefreshToken := buildRefreshToken(userID, newSessionID) // encode userId:sessionId.random

	newSessionData := map[string]interface{}{
		"refresh_token_hash": hashString(newRefreshToken),
		"device_hash":        sessionData["device_hash"],
		"user_id":            userID,
		"issued_at":          time.Now().Unix(),
	}
	newSessionKey := "session:" + userID + ":" + newSessionID
	h.redis.SetJSON(c.Request.Context(), newSessionKey, newSessionData, 7*24*time.Hour)

	// Issue new access token
	isTrusted, _ := sessionData["is_trusted_device"].(bool)
	claims := jwt.MapClaims{
		"sub":               userID,
		"session_id":        newSessionID,
		"device_hash":       sessionData["device_hash"],
		"is_trusted_device": isTrusted,
		"iat":               time.Now().Unix(),
		"exp":               time.Now().Add(15 * time.Minute).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte(h.config.JWTSecret))

	c.JSON(http.StatusOK, gin.H{
		"access_token":  tokenStr,
		"refresh_token": newRefreshToken, // new rotated token
		"expires_in":    900,
	})
}
