package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid claims"})
			return
		}

		// Inside AuthMiddleware, after extracting sessionID:
		if h.redis.Exists(c.Request.Context(), "blocklist:"+sessionID) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "session invalidated"})
			return
		}

		// Inject into context — handlers read from here, never re-parse the token
		c.Set("user_id", claims["sub"].(string))
		c.Set("session_id", claims["session_id"].(string))
		c.Set("device_hash", claims["device_hash"].(string))
		c.Set("is_trusted_device", claims["is_trusted_device"].(bool))

		c.Next()
	}
}

// Helper functions
func GetUserID(c *gin.Context) string {
	return c.GetString("user_id")
}
func IsTrustedDevice(c *gin.Context) bool {
	trusted, _ := c.Get("is_trusted_device")
	return trusted.(bool)
}
