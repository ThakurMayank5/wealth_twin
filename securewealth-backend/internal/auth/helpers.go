package auth

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

const (
	AccessTokenTTL  = 15 * time.Minute
	RefreshTokenTTL = 7 * 24 * time.Hour
)

func GenerateAccessToken(userID, sessionID, deviceHash string, isTrustedDevice bool, secret string) (string, int64, error) {
	now := time.Now().UTC()
	exp := now.Add(AccessTokenTTL)

	claims := jwt.MapClaims{
		"sub":               userID,
		"session_id":        sessionID,
		"device_hash":       deviceHash,
		"is_trusted_device": isTrustedDevice,
		"iat":               now.Unix(),
		"exp":               exp.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", 0, err
	}
	return signed, int64(AccessTokenTTL.Seconds()), nil
}

func GenerateRefreshToken(userID, sessionID string) (string, error) {
	if strings.TrimSpace(userID) == "" || strings.TrimSpace(sessionID) == "" {
		return "", errors.New("userID and sessionID are required")
	}
	encoded := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s:%s", userID, sessionID)))
	randomPart := uuid.NewString() + uuid.NewString()
	return encoded + "." + randomPart, nil
}

func DecodeRefreshToken(refreshToken string) (string, string, error) {
	parts := strings.Split(refreshToken, ".")
	if len(parts) != 2 {
		return "", "", errors.New("invalid token format")
	}

	decoded, err := base64.StdEncoding.DecodeString(parts[0])
	if err != nil {
		return "", "", errors.New("invalid token encoding")
	}

	pair := strings.SplitN(string(decoded), ":", 2)
	if len(pair) != 2 || pair[0] == "" || pair[1] == "" {
		return "", "", errors.New("invalid token payload")
	}
	return pair[0], pair[1], nil
}

func SHA256Hex(value string) string {
	h := sha256.Sum256([]byte(value))
	return hex.EncodeToString(h[:])
}

func HashPassword(password string) (string, error) {
	raw, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(raw), nil
}

func ComparePassword(passwordHash, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password))
}
