package auth

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"time"

	redisclient "securewealth-backend/internal/redis"
	"securewealth-backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Handler struct {
	Users      *repository.UserRepository
	Redis      *redisclient.Client
	JWTSecret  string
	IsDev      bool
	SMSEnabled bool
}

type loginRequest struct {
	Phone             string `json:"phone"`
	Password          string `json:"password"`
	DeviceFingerprint string `json:"device_fingerprint"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type otpVerifyRequest struct {
	OTP string `json:"otp"`
}

type otpRecord struct {
	OTP         string `json:"otp"`
	Attempts    int    `json:"attempts"`
	GeneratedAt int64  `json:"generated_at"`
}

type sessionRecord struct {
	RefreshTokenHash string `json:"refresh_token_hash"`
	DeviceHash       string `json:"device_hash"`
	UserID           string `json:"user_id"`
	IssuedAt         int64  `json:"issued_at"`
	IsTrusted        bool   `json:"is_trusted_device"`
}

func NewHandler(users *repository.UserRepository, redis *redisclient.Client, jwtSecret string, isDev, smsEnabled bool) *Handler {
	return &Handler{
		Users:      users,
		Redis:      redis,
		JWTSecret:  jwtSecret,
		IsDev:      isDev,
		SMSEnabled: smsEnabled,
	}
}

func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	if strings.TrimSpace(req.Phone) == "" || strings.TrimSpace(req.Password) == "" || strings.TrimSpace(req.DeviceFingerprint) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "phone, password and device_fingerprint are required"})
		return
	}

	ctx := c.Request.Context()
	user, err := h.Users.GetByPhone(ctx, req.Phone)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := ComparePassword(user.PasswordHash, req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	isTrusted := false
	if _, err := h.Users.GetDeviceByHash(ctx, user.ID, req.DeviceFingerprint); err == nil {
		isTrusted = true
		go func() {
			bgCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			if err := h.Users.UpdateDeviceLastSeen(bgCtx, user.ID, req.DeviceFingerprint, c.GetHeader("User-Agent"), c.ClientIP()); err != nil {
				log.Printf("device last_seen async update failed user=%s device_hash_present=true error=%v", user.ID, err)
			}
		}()
	} else if errors.Is(err, pgx.ErrNoRows) {
		if err := h.Users.CreateDevice(ctx, user.ID, req.DeviceFingerprint, c.GetHeader("User-Agent"), c.ClientIP(), false); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to register device"})
			return
		}
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to verify device"})
		return
	}

	sessionID := uuid.NewString()
	accessToken, expiresIn, err := GenerateAccessToken(user.ID, sessionID, req.DeviceFingerprint, isTrusted, h.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate access token"})
		return
	}

	refreshToken, err := GenerateRefreshToken(user.ID, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate refresh token"})
		return
	}

	sessionKey := fmt.Sprintf("session:%s:%s", user.ID, sessionID)
	session := sessionRecord{
		RefreshTokenHash: SHA256Hex(refreshToken),
		DeviceHash:       req.DeviceFingerprint,
		UserID:           user.ID,
		IssuedAt:         time.Now().Unix(),
		IsTrusted:        isTrusted,
	}
	if err := h.Redis.SetJSON(ctx, sessionKey, session, RefreshTokenTTL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to persist session"})
		return
	}

	actionTSKey := fmt.Sprintf("action:ts:%s", user.ID)
	h.Redis.Set(ctx, actionTSKey, strconv.FormatInt(time.Now().Unix(), 10), time.Hour)

	c.JSON(http.StatusOK, gin.H{
		"access_token":      accessToken,
		"refresh_token":     refreshToken,
		"user_id":           user.ID,
		"expires_in":        expiresIn,
		"is_trusted_device": isTrusted,
	})
}

func (h *Handler) Refresh(c *gin.Context) {
	var req refreshRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.RefreshToken) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh_token is required"})
		return
	}

	userID, oldSessionID, err := DecodeRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	ctx := c.Request.Context()
	oldSessionKey := fmt.Sprintf("session:%s:%s", userID, oldSessionID)
	var oldSession sessionRecord
	if err := h.Redis.GetJSON(ctx, oldSessionKey, &oldSession); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "session expired"})
		return
	}

	if SHA256Hex(req.RefreshToken) != oldSession.RefreshTokenHash {
		h.Redis.Del(ctx, oldSessionKey)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	h.Redis.Del(ctx, oldSessionKey)

	newSessionID := uuid.NewString()
	newRefreshToken, err := GenerateRefreshToken(userID, newSessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to rotate session"})
		return
	}

	newSessionKey := fmt.Sprintf("session:%s:%s", userID, newSessionID)
	newSession := sessionRecord{
		RefreshTokenHash: SHA256Hex(newRefreshToken),
		DeviceHash:       oldSession.DeviceHash,
		UserID:           userID,
		IssuedAt:         time.Now().Unix(),
		IsTrusted:        oldSession.IsTrusted,
	}
	if err := h.Redis.SetJSON(ctx, newSessionKey, newSession, RefreshTokenTTL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to persist new session"})
		return
	}

	accessToken, expiresIn, err := GenerateAccessToken(userID, newSessionID, oldSession.DeviceHash, oldSession.IsTrusted, h.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate access token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": newRefreshToken,
		"expires_in":    expiresIn,
	})
}

func (h *Handler) Logout(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	sessionID := strings.TrimSpace(c.GetString("session_id"))
	if userID == "" || sessionID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	ctx := c.Request.Context()
	h.Redis.Del(ctx, fmt.Sprintf("session:%s:%s", userID, sessionID))
	h.Redis.Set(ctx, fmt.Sprintf("blocklist:%s", sessionID), "1", AccessTokenTTL)

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *Handler) SendOTP(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	sessionID := strings.TrimSpace(c.GetString("session_id"))
	if userID == "" || sessionID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	ctx := c.Request.Context()
	rateKey := fmt.Sprintf("otp:ratelimit:%s", userID)
	count := h.Redis.Incr(ctx, rateKey)
	if count == 1 {
		h.Redis.Expire(ctx, rateKey, 10*time.Minute)
	}
	if count > 3 {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
		return
	}

	otp, err := generateOTP()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate otp"})
		return
	}

	record := otpRecord{
		OTP:         otp,
		Attempts:    0,
		GeneratedAt: time.Now().Unix(),
	}
	otpKey := fmt.Sprintf("otp:%s:%s", userID, sessionID)
	if err := h.Redis.SetJSON(ctx, otpKey, record, 5*time.Minute); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to persist otp"})
		return
	}

	if h.IsDev {
		c.JSON(http.StatusOK, gin.H{"success": true, "dev_otp": otp, "expires_in": 300})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "expires_in": 300})
}

func (h *Handler) VerifyOTP(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	sessionID := strings.TrimSpace(c.GetString("session_id"))
	if userID == "" || sessionID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req otpVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.OTP) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "otp is required"})
		return
	}

	ctx := c.Request.Context()
	otpKey := fmt.Sprintf("otp:%s:%s", userID, sessionID)
	var record otpRecord
	if err := h.Redis.GetJSON(ctx, otpKey, &record); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OTP expired"})
		return
	}

	record.Attempts++
	if record.Attempts > 3 {
		h.Redis.Del(ctx, otpKey)
		attemptsKey := fmt.Sprintf("otp:attempts:%s", userID)
		count := h.Redis.Incr(ctx, attemptsKey)
		if count == 1 {
			h.Redis.Expire(ctx, attemptsKey, time.Hour)
		}
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "too_many_attempts"})
		return
	}

	if strings.TrimSpace(req.OTP) != record.OTP {
		if err := h.Redis.SetJSON(ctx, otpKey, record, 5*time.Minute); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to persist otp attempts"})
			return
		}
		remaining := 3 - record.Attempts
		if remaining < 0 {
			remaining = 0
		}
		c.JSON(http.StatusBadRequest, gin.H{"verified": false, "attempts_remaining": remaining})
		return
	}

	h.Redis.Del(ctx, otpKey)
	c.JSON(http.StatusOK, gin.H{"verified": true})
}

func generateOTP() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func marshalJSON(v any) string {
	raw, err := json.Marshal(v)
	if err != nil {
		return "{}"
	}
	return string(raw)
}

type registerRequest struct {
	Email             string `json:"email"`
	Phone             string `json:"phone"`
	FullName          string `json:"full_name"`
	Password          string `json:"password"`
	DeviceFingerprint string `json:"device_fingerprint"`
}

func (h *Handler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	if strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Phone) == "" ||
		strings.TrimSpace(req.FullName) == "" || strings.TrimSpace(req.Password) == "" ||
		strings.TrimSpace(req.DeviceFingerprint) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email, phone, full_name, password and device_fingerprint are required"})
		return
	}

	passwordHash, err := HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	ctx := c.Request.Context()
	user, err := h.Users.CreateUser(ctx, strings.TrimSpace(req.Email), strings.TrimSpace(req.Phone), strings.TrimSpace(req.FullName), passwordHash)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			c.JSON(http.StatusConflict, gin.H{"error": "user with this email or phone already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	if err := h.Users.CreateDevice(ctx, user.ID, strings.TrimSpace(req.DeviceFingerprint), c.GetHeader("User-Agent"), c.ClientIP(), true); err != nil {
		log.Printf("register device creation failed user=%s err=%v", user.ID, err)
	}

	sessionID := uuid.NewString()
	accessToken, expiresIn, err := GenerateAccessToken(user.ID, sessionID, req.DeviceFingerprint, true, h.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate access token"})
		return
	}

	refreshToken, err := GenerateRefreshToken(user.ID, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate refresh token"})
		return
	}

	sessionKey := fmt.Sprintf("session:%s:%s", user.ID, sessionID)
	session := sessionRecord{
		RefreshTokenHash: SHA256Hex(refreshToken),
		DeviceHash:       req.DeviceFingerprint,
		UserID:           user.ID,
		IssuedAt:         time.Now().Unix(),
		IsTrusted:        true,
	}
	if err := h.Redis.SetJSON(ctx, sessionKey, session, RefreshTokenTTL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to persist session"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"access_token":      accessToken,
		"refresh_token":     refreshToken,
		"user_id":           user.ID,
		"expires_in":        expiresIn,
		"is_trusted_device": true,
	})
}

