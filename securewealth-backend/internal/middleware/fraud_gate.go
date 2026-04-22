package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"securewealth-backend/internal/fraud"

	"github.com/gin-gonic/gin"
)

func FraudGate(engine *fraud.Engine) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := strings.TrimSpace(c.GetString("user_id"))
		sessionID := strings.TrimSpace(c.GetString("session_id"))
		if userID == "" || sessionID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		payload := map[string]any{}
		if c.Request.Body != nil {
			rawBody, _ := io.ReadAll(c.Request.Body)
			if len(rawBody) > 0 {
				_ = json.Unmarshal(rawBody, &payload)
			}
			c.Request.Body = io.NopCloser(bytes.NewBuffer(rawBody))
		}

		actionType := actionTypeFromRequest(c.Request.Method, c.FullPath())
		metadata := extractMetadata(payload)
		amount := extractAmount(payload)

		result, err := engine.Evaluate(c.Request.Context(), fraud.EvaluateInput{
			UserID:          userID,
			SessionID:       sessionID,
			DeviceHash:      strings.TrimSpace(c.GetString("device_hash")),
			IPAddress:       c.ClientIP(),
			ActionType:      actionType,
			Amount:          amount,
			Metadata:        metadata,
			Payload:         payload,
			IsTrustedDevice: c.GetBool("is_trusted_device"),
		})
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "fraud evaluation failed"})
			return
		}

		switch result.Decision {
		case "BLOCK":
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"status":     "BLOCKED",
				"risk_score": result.Score,
				"risk_level": result.Level,
				"reason":     result.Reason,
				"event_id":   result.EventID,
			})
			return
		case "WARN":
			c.Set("fraud_result", result)
		default:
			c.Set("fraud_result", result)
		}

		c.Next()
	}
}

func actionTypeFromRequest(method, path string) string {
	method = strings.ToUpper(strings.TrimSpace(method))
	p := strings.TrimSpace(path)

	switch {
	case method == http.MethodPost && strings.HasSuffix(p, "/sips"):
		return "SIP_CREATE"
	case method == http.MethodPut && strings.Contains(p, "/sips/"):
		return "SIP_UPDATE"
	case method == http.MethodDelete && strings.Contains(p, "/sips/"):
		return "SIP_CANCEL"
	case method == http.MethodPost && strings.HasSuffix(p, "/sips/confirm"):
		return "SIP_CONFIRM"
	case method == http.MethodPost && strings.HasSuffix(p, "/wealth/assets"):
		return "ASSET_ADD"
	default:
		return method + "_" + strings.ReplaceAll(strings.Trim(p, "/"), "/", "_")
	}
}

func extractAmount(payload map[string]any) float64 {
	if v, ok := payload["amount"]; ok {
		return toFloat(v)
	}
	if v, ok := payload["current_value"]; ok {
		return toFloat(v)
	}
	return 0
}

func extractMetadata(payload map[string]any) map[string]any {
	metadata := map[string]any{}
	if rawMeta, ok := payload["metadata"].(map[string]any); ok {
		for k, v := range rawMeta {
			metadata[k] = v
		}
	}
	if v, ok := payload["is_first_time_fund"]; ok {
		metadata["is_first_time_fund"] = v
	}
	if v, ok := payload["cancel_count"]; ok {
		metadata["cancel_count"] = v
	}
	return metadata
}

func toFloat(v any) float64 {
	switch n := v.(type) {
	case float64:
		return n
	case float32:
		return float64(n)
	case int:
		return float64(n)
	case int32:
		return float64(n)
	case int64:
		return float64(n)
	case json.Number:
		f, _ := n.Float64()
		return f
	case string:
		var f float64
		_, _ = fmt.Sscanf(strings.TrimSpace(n), "%f", &f)
		return f
	default:
		return 0
	}
}
