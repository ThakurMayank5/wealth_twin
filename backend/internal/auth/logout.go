package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) Logout(c *gin.Context) {
	userID := GetUserID(c)
	sessionID := c.GetString("session_id")

	// Delete the Redis session — this immediately invalidates the refresh token
	sessionKey := "session:" + userID + ":" + sessionID
	h.redis.Del(c.Request.Context(), sessionKey)

	// The access token will remain technically valid until its 15-min expiry,
	// but since it's short-lived and the client discards it, this is acceptable.
	// For stricter invalidation, maintain a Redis blocklist of session_ids:
	h.redis.Set(c.Request.Context(), "blocklist:"+sessionID, "1", 15*time.Minute)

	c.JSON(http.StatusOK, gin.H{"success": true})
}
