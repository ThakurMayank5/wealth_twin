package middleware

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		latency := time.Since(start)

		event := map[string]any{
			"timestamp":  time.Now().UTC().Format(time.RFC3339Nano),
			"request_id": c.GetString("request_id"),
			"method":     c.Request.Method,
			"path":       c.FullPath(),
			"status":     c.Writer.Status(),
			"latency_ms": latency.Milliseconds(),
			"ip":         c.ClientIP(),
			"user_id":    c.GetString("user_id"),
		}

		raw, err := json.Marshal(event)
		if err != nil {
			log.Printf("request method=%s path=%s status=%d latency_ms=%d", c.Request.Method, c.FullPath(), c.Writer.Status(), latency.Milliseconds())
			return
		}
		log.Print(string(raw))
	}
}
