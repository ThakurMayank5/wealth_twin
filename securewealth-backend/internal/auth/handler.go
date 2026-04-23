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

	"securewealth-backend/internal/models"
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

const (
	devBypassOTPCode  = "123456"
	devDummyPhone     = "+919876543210"
	devDummyPhoneBare = "9876543210"
	devDummyPassword  = "demo1234"
	devDummyEmail     = "demo.user@twinvest.local"
	devDummyFullName  = "TwinVest Demo User"
)

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
		log.Printf("[AUTH][LOGIN] invalid request body ip=%s error=%v", c.ClientIP(), err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	phone := strings.TrimSpace(req.Phone)
	password := strings.TrimSpace(req.Password)
	deviceHash := strings.TrimSpace(req.DeviceFingerprint)
	isDevDummy := h.IsDev && isDevDummyCredentials(phone, password)

	log.Printf("[AUTH][LOGIN] attempt phone=%s device=%s ip=%s dev_dummy=%t", maskPhone(phone), shortFingerprint(deviceHash), c.ClientIP(), isDevDummy)

	if phone == "" || password == "" || deviceHash == "" {
		log.Printf("[AUTH][LOGIN] validation failed phone_present=%t password_present=%t device_present=%t ip=%s", phone != "", password != "", deviceHash != "", c.ClientIP())
		c.JSON(http.StatusBadRequest, gin.H{"error": "phone, password and device_fingerprint are required"})
		return
	}

	ctx := c.Request.Context()
	user, err := h.Users.GetByPhone(ctx, phone)
	if err != nil {
		if isDevDummy {
			log.Printf("[AUTH][LOGIN] dev dummy fallback provisioning phone=%s", maskPhone(phone))
			user, err = h.ensureDevDummyUser(ctx)
			if err != nil {
				log.Printf("[AUTH][LOGIN] dev dummy provisioning failed phone=%s error=%v", maskPhone(phone), err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to prepare dummy user"})
				return
			}
		} else {
			log.Printf("[AUTH][LOGIN] user lookup failed phone=%s error=%v", maskPhone(phone), err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
	}

	if !isDevDummy {
		if err := ComparePassword(user.PasswordHash, req.Password); err != nil {
			log.Printf("[AUTH][LOGIN] password mismatch phone=%s user_id=%s", maskPhone(phone), user.ID)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
	} else {
		log.Printf("[AUTH][LOGIN] dev dummy password bypass enabled phone=%s user_id=%s", maskPhone(phone), user.ID)
	}

	isTrusted := false
	if _, err := h.Users.GetDeviceByHash(ctx, user.ID, deviceHash); err == nil {
		isTrusted = true
		log.Printf("[AUTH][LOGIN] trusted device reused user_id=%s device=%s", user.ID, shortFingerprint(deviceHash))
		go func() {
			bgCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			if err := h.Users.UpdateDeviceLastSeen(bgCtx, user.ID, deviceHash, c.GetHeader("User-Agent"), c.ClientIP()); err != nil {
				log.Printf("device last_seen async update failed user=%s device_hash_present=true error=%v", user.ID, err)
			}
		}()
	} else if errors.Is(err, pgx.ErrNoRows) {
		if err := h.Users.CreateDevice(ctx, user.ID, deviceHash, c.GetHeader("User-Agent"), c.ClientIP(), false); err != nil {
			log.Printf("[AUTH][LOGIN] device registration failed user_id=%s device=%s error=%v", user.ID, shortFingerprint(deviceHash), err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to register device"})
			return
		}
		log.Printf("[AUTH][LOGIN] new untrusted device registered user_id=%s device=%s", user.ID, shortFingerprint(deviceHash))
	} else {
		log.Printf("[AUTH][LOGIN] device verification failed user_id=%s device=%s error=%v", user.ID, shortFingerprint(deviceHash), err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to verify device"})
		return
	}

	sessionID := uuid.NewString()
	accessToken, expiresIn, err := GenerateAccessToken(user.ID, sessionID, deviceHash, isTrusted, h.JWTSecret)
	if err != nil {
		log.Printf("[AUTH][LOGIN] access token generation failed user_id=%s error=%v", user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate access token"})
		return
	}

	refreshToken, err := GenerateRefreshToken(user.ID, sessionID)
	if err != nil {
		log.Printf("[AUTH][LOGIN] refresh token generation failed user_id=%s error=%v", user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate refresh token"})
		return
	}

	sessionKey := fmt.Sprintf("session:%s:%s", user.ID, sessionID)
	session := sessionRecord{
		RefreshTokenHash: SHA256Hex(refreshToken),
		DeviceHash:       deviceHash,
		UserID:           user.ID,
		IssuedAt:         time.Now().Unix(),
		IsTrusted:        isTrusted,
	}
	if err := h.Redis.SetJSON(ctx, sessionKey, session, RefreshTokenTTL); err != nil {
		log.Printf("[AUTH][LOGIN] redis session persist failed user_id=%s session_id=%s error=%v", user.ID, sessionID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to persist session"})
		return
	}

	actionTSKey := fmt.Sprintf("action:ts:%s", user.ID)
	h.Redis.Set(ctx, actionTSKey, strconv.FormatInt(time.Now().Unix(), 10), time.Hour)

	log.Printf("[AUTH][LOGIN] success user_id=%s trusted_device=%t session_id=%s", user.ID, isTrusted, sessionID)

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

	if h.IsDev {
		log.Printf("[AUTH][OTP_SEND] dev bypass user_id=%s session_id=%s otp=%s", userID, sessionID, devBypassOTPCode)
		c.JSON(http.StatusOK, gin.H{"success": true, "dev_otp": devBypassOTPCode, "expires_in": 300})
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

	otp := strings.TrimSpace(req.OTP)
	if h.IsDev && otp == devBypassOTPCode {
		log.Printf("[AUTH][OTP_VERIFY] dev bypass success user_id=%s session_id=%s", userID, sessionID)
		c.JSON(http.StatusOK, gin.H{"verified": true, "dev_bypass": true})
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

	if otp != record.OTP {
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
		log.Printf("[AUTH][REGISTER] invalid request body ip=%s error=%v", c.ClientIP(), err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	email := strings.TrimSpace(req.Email)
	phone := strings.TrimSpace(req.Phone)
	fullName := strings.TrimSpace(req.FullName)
	password := strings.TrimSpace(req.Password)
	deviceHash := strings.TrimSpace(req.DeviceFingerprint)

	log.Printf("[AUTH][REGISTER] attempt phone=%s email=%s device=%s ip=%s", maskPhone(phone), email, shortFingerprint(deviceHash), c.ClientIP())

	if email == "" || phone == "" || fullName == "" || password == "" || deviceHash == "" {
		log.Printf("[AUTH][REGISTER] validation failed phone=%s email_present=%t name_present=%t password_present=%t device_present=%t", maskPhone(phone), email != "", fullName != "", password != "", deviceHash != "")
		c.JSON(http.StatusBadRequest, gin.H{"error": "email, phone, full_name, password and device_fingerprint are required"})
		return
	}

	passwordHash, err := HashPassword(password)
	if err != nil {
		log.Printf("[AUTH][REGISTER] password hash failed phone=%s error=%v", maskPhone(phone), err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	ctx := c.Request.Context()
	user, err := h.Users.CreateUser(ctx, email, phone, fullName, passwordHash)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			log.Printf("[AUTH][REGISTER] duplicate conflict phone=%s email=%s", maskPhone(phone), email)
			c.JSON(http.StatusConflict, gin.H{"error": "user with this email or phone already exists"})
			return
		}
		log.Printf("[AUTH][REGISTER] create user failed phone=%s email=%s error=%v", maskPhone(phone), email, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	if err := h.Users.CreateDevice(ctx, user.ID, deviceHash, c.GetHeader("User-Agent"), c.ClientIP(), true); err != nil {
		log.Printf("register device creation failed user=%s err=%v", user.ID, err)
	}

	sessionID := uuid.NewString()
	accessToken, expiresIn, err := GenerateAccessToken(user.ID, sessionID, deviceHash, true, h.JWTSecret)
	if err != nil {
		log.Printf("[AUTH][REGISTER] access token generation failed user_id=%s error=%v", user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate access token"})
		return
	}

	refreshToken, err := GenerateRefreshToken(user.ID, sessionID)
	if err != nil {
		log.Printf("[AUTH][REGISTER] refresh token generation failed user_id=%s error=%v", user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate refresh token"})
		return
	}

	sessionKey := fmt.Sprintf("session:%s:%s", user.ID, sessionID)
	session := sessionRecord{
		RefreshTokenHash: SHA256Hex(refreshToken),
		DeviceHash:       deviceHash,
		UserID:           user.ID,
		IssuedAt:         time.Now().Unix(),
		IsTrusted:        true,
	}
	if err := h.Redis.SetJSON(ctx, sessionKey, session, RefreshTokenTTL); err != nil {
		log.Printf("[AUTH][REGISTER] redis session persist failed user_id=%s session_id=%s error=%v", user.ID, sessionID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to persist session"})
		return
	}

	log.Printf("[AUTH][REGISTER] success user_id=%s phone=%s", user.ID, maskPhone(phone))

	c.JSON(http.StatusCreated, gin.H{
		"access_token":      accessToken,
		"refresh_token":     refreshToken,
		"user_id":           user.ID,
		"expires_in":        expiresIn,
		"is_trusted_device": true,
	})
}

func (h *Handler) ensureDevDummyUser(ctx context.Context) (*models.User, error) {
	user, err := h.Users.GetByPhone(ctx, devDummyPhone)
	if err == nil {
		return user, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	passwordHash, err := HashPassword(devDummyPassword)
	if err != nil {
		return nil, err
	}

	user, err = h.Users.CreateUser(ctx, devDummyEmail, devDummyPhone, devDummyFullName, passwordHash)
	if err != nil {
		msg := strings.ToLower(err.Error())
		if strings.Contains(msg, "duplicate") || strings.Contains(msg, "unique") {
			return h.Users.GetByPhone(ctx, devDummyPhone)
		}
		return nil, err
	}

	log.Printf("[AUTH][LOGIN] dev dummy user created user_id=%s phone=%s password=%s", user.ID, devDummyPhone, devDummyPassword)
	return user, nil
}

func isDevDummyCredentials(phone, password string) bool {
	normalizedPhone := normalizePhone(phone)
	trimmedPassword := strings.TrimSpace(password)
	return (normalizedPhone == normalizePhone(devDummyPhone) || normalizedPhone == devDummyPhoneBare) && trimmedPassword == devDummyPassword
}

func normalizePhone(phone string) string {
	var b strings.Builder
	b.Grow(len(phone))
	for _, ch := range phone {
		if ch >= '0' && ch <= '9' {
			b.WriteRune(ch)
		}
	}
	return b.String()
}

func maskPhone(phone string) string {
	normalized := normalizePhone(phone)
	if len(normalized) <= 4 {
		return normalized
	}
	return strings.Repeat("*", len(normalized)-4) + normalized[len(normalized)-4:]
}

func shortFingerprint(fingerprint string) string {
	value := strings.TrimSpace(fingerprint)
	if len(value) <= 8 {
		return value
	}
	return value[:8] + "..."
}
