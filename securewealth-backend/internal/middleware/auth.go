package middleware

import (
	"net/http"
	"strings"

	redisclient "securewealth-backend/internal/redis"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(jwtSecret string, redis *redisclient.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
		if !strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}

		tokenString := strings.TrimSpace(authHeader[7:])
		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
			if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(jwtSecret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}

		userID := toStringClaim(claims["sub"])
		sessionID := toStringClaim(claims["session_id"])
		deviceHash := toStringClaim(claims["device_hash"])
		isTrusted := toBoolClaim(claims["is_trusted_device"])

		if userID == "" || sessionID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token payload"})
			return
		}

		if redis.Exists(c.Request.Context(), "blocklist:"+sessionID) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "session invalidated"})
			return
		}

		c.Set("user_id", userID)
		c.Set("session_id", sessionID)
		c.Set("device_hash", deviceHash)
		c.Set("is_trusted_device", isTrusted)
		c.Next()
	}
}

func toStringClaim(v any) string {
	switch x := v.(type) {
	case string:
		return strings.TrimSpace(x)
	default:
		return ""
	}
}

func toBoolClaim(v any) bool {
	switch x := v.(type) {
	case bool:
		return x
	case string:
		x = strings.TrimSpace(strings.ToLower(x))
		return x == "1" || x == "true" || x == "yes"
	case float64:
		return x != 0
	default:
		return false
	}
}
