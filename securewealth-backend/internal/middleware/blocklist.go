package middleware

import (
	"net/http"
	"strings"

	redisclient "securewealth-backend/internal/redis"

	"github.com/gin-gonic/gin"
)

func BlocklistCheck(redis *redisclient.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID := strings.TrimSpace(c.GetString("session_id"))
		if sessionID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		if redis.Exists(c.Request.Context(), "blocklist:"+sessionID) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "session invalidated"})
			return
		}

		c.Next()
	}
}
