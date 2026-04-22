package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	redisclient "securewealth-backend/internal/redis"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	goredis "github.com/redis/go-redis/v9"
)

func RateLimit(redis *redisclient.Client, maxPerMinute int64) gin.HandlerFunc {
	if maxPerMinute <= 0 {
		maxPerMinute = 100
	}

	return func(c *gin.Context) {
		ctx := c.Request.Context()
		ip := c.ClientIP()
		key := fmt.Sprintf("ratelimit:%s", ip)

		nowMs := time.Now().UnixMilli()
		windowStart := nowMs - 60000

		pipe := redis.Raw().TxPipeline()
		pipe.ZRemRangeByScore(ctx, key, "-inf", strconv.FormatInt(windowStart, 10))
		pipe.ZAdd(ctx, key, goredis.Z{Score: float64(nowMs), Member: strconv.FormatInt(nowMs, 10) + ":" + uuid.NewString()})
		countCmd := pipe.ZCard(ctx, key)
		pipe.Expire(ctx, key, time.Minute)
		if _, err := pipe.Exec(ctx); err != nil {
			c.Next()
			return
		}

		if countCmd.Val() > maxPerMinute {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
			return
		}
		c.Next()
	}
}
