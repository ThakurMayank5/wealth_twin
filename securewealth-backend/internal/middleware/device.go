package middleware

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type DeviceUpdater interface {
	UpdateDeviceLastSeen(ctx context.Context, userID, deviceHash, userAgent, ip string) error
}

func DeviceLastSeen(updater DeviceUpdater) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		userID := strings.TrimSpace(c.GetString("user_id"))
		deviceHash := strings.TrimSpace(c.GetString("device_hash"))
		if userID == "" || deviceHash == "" {
			return
		}

		go func(userID, deviceHash, userAgent, ip string) {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			if err := updater.UpdateDeviceLastSeen(ctx, userID, deviceHash, userAgent, ip); err != nil {
				log.Printf("device touch failed user=%s device_hash_present=true err=%v", userID, err)
			}
		}(userID, deviceHash, c.GetHeader("User-Agent"), c.ClientIP())
	}
}
