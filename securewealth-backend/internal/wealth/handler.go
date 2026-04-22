package wealth

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"securewealth-backend/internal/fraud"
	"securewealth-backend/internal/models"
	redisclient "securewealth-backend/internal/redis"
	"securewealth-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	Users         *repository.UserRepository
	Assets        *repository.AssetRepository
	Goals         *repository.GoalRepository
	SIPs          *repository.SIPRepository
	Redis         *redisclient.Client
	ConfirmSecret string
}

func NewHandler(
	users *repository.UserRepository,
	assets *repository.AssetRepository,
	goals *repository.GoalRepository,
	sips *repository.SIPRepository,
	redis *redisclient.Client,
	confirmSecret string,
) *Handler {
	return &Handler{
		Users:         users,
		Assets:        assets,
		Goals:         goals,
		SIPs:          sips,
		Redis:         redis,
		ConfirmSecret: confirmSecret,
	}
}

func (h *Handler) GetDashboard(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	ctx := c.Request.Context()
	user, err := h.Users.GetByID(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user"})
		return
	}

	assetTotal, err := h.Assets.TotalAssetValue(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch asset summary"})
		return
	}

	goals, err := h.Goals.ListByUser(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch goals"})
		return
	}

	activeSIPs, err := h.SIPs.CountActiveByUser(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch active SIP count"})
		return
	}

	sipTotal, err := h.SIPs.SumActiveMonthly(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch sip total"})
		return
	}

	netWorth := user.AccountBalance + assetTotal
	liquid := user.AccountBalance

	savingsRate := 0.0
	if user.AvgMonthlyIncome > 0 {
		savingsRate = ((user.AvgMonthlyIncome - user.AvgMonthlySpend) / user.AvgMonthlyIncome) * 100
	}

	alerts := make([]string, 0, 2)
	if savingsRate < 10 {
		alerts = append(alerts, "Savings rate is below 10%; review monthly debit outflows")
	}
	if activeSIPs == 0 {
		alerts = append(alerts, "No active SIPs found; consider a disciplined monthly investment")
	}

	recommendations := topRecommendations(user.RiskAppetite, savingsRate)

	c.JSON(http.StatusOK, gin.H{
		"net_worth":                round2(netWorth),
		"liquid_assets":            round2(liquid),
		"monthly_savings_rate":     round2(savingsRate),
		"active_sips":              activeSIPs,
		"sip_total_monthly":        round2(sipTotal),
		"goals":                    goals,
		"alerts":                   alerts,
		"top_recommendations":      recommendations,
		"wealth_protection_status": "ENABLED",
	})
}

func (h *Handler) GetNetWorth(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	ctx := c.Request.Context()
	breakdown, err := h.Assets.NetWorthBreakdown(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch net worth breakdown"})
		return
	}

	user, err := h.Users.GetByID(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch account balance"})
		return
	}

	total := user.AccountBalance
	items := make([]models.NetWorthByType, 0, len(breakdown)+1)
	items = append(items, models.NetWorthByType{AssetType: "BANK_BALANCE", Value: round2(user.AccountBalance)})
	for _, b := range breakdown {
		total += b.Value
		items = append(items, b)
	}

	c.JSON(http.StatusOK, gin.H{
		"total_net_worth": round2(total),
		"breakdown":       items,
	})
}

func (h *Handler) AddAsset(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req struct {
		AssetType     string         `json:"asset_type"`
		Name          string         `json:"name"`
		CurrentValue  float64        `json:"current_value"`
		PurchaseValue float64        `json:"purchase_value"`
		PurchaseDate  string         `json:"purchase_date"`
		Metadata      map[string]any `json:"metadata"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	if strings.TrimSpace(req.AssetType) == "" || strings.TrimSpace(req.Name) == "" || req.CurrentValue <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "asset_type, name and current_value are required"})
		return
	}

	asset := models.Asset{
		UserID:        userID,
		AssetType:     strings.ToUpper(strings.TrimSpace(req.AssetType)),
		Name:          strings.TrimSpace(req.Name),
		CurrentValue:  req.CurrentValue,
		PurchaseValue: req.PurchaseValue,
	}
	if strings.TrimSpace(req.PurchaseDate) != "" {
		t, err := time.Parse("2006-01-02", strings.TrimSpace(req.PurchaseDate))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "purchase_date must be YYYY-MM-DD"})
			return
		}
		asset.PurchaseDate = t
	}
	if req.Metadata != nil {
		raw, err := json.Marshal(req.Metadata)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid metadata"})
			return
		}
		asset.Metadata = raw
	}

	created, err := h.Assets.Add(c.Request.Context(), asset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add asset"})
		return
	}

	response := gin.H{"asset": created}
	if riskAny, ok := c.Get("fraud_result"); ok {
		if risk, ok := riskAny.(fraud.RiskResult); ok && risk.Decision == "WARN" {
			token, err := h.storeConfirmationToken(c.Request.Context(), userID, "ASSET_ADD", req)
			if err == nil {
				response["warning"] = risk.Reason
				response["risk_score"] = risk.Score
				response["risk_level"] = risk.Level
				response["confirmation_token"] = token
			}
		}
	}

	c.JSON(http.StatusCreated, response)
}

func (h *Handler) storeConfirmationToken(ctx context.Context, userID, actionType string, payload any) (string, error) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	hash := sha256.Sum256(raw)
	mac := hmac.New(sha256.New, []byte(h.ConfirmSecret))
	mac.Write([]byte(userID + hex.EncodeToString(hash[:])))
	token := hex.EncodeToString(mac.Sum(nil))

	store := map[string]any{
		"user_id":     userID,
		"action_type": actionType,
		"payload":     json.RawMessage(raw),
	}
	if err := h.Redis.SetJSON(ctx, "confirm:"+token, store, 5*time.Minute); err != nil {
		return "", err
	}
	return token, nil
}

func topRecommendations(riskAppetite string, savingsRate float64) []string {
	risk := strings.ToUpper(strings.TrimSpace(riskAppetite))
	recs := make([]string, 0, 3)

	if savingsRate < 20 {
		recs = append(recs, "Increase auto-invest allocation by 5% for the next 3 months")
	}
	switch risk {
	case "AGGRESSIVE":
		recs = append(recs, "Bias SIP mix toward equity funds with staggered deployment")
	case "CONSERVATIVE":
		recs = append(recs, "Favor debt/hybrid SIPs and maintain a 6-month emergency reserve")
	default:
		recs = append(recs, "Maintain a balanced allocation and rebalance quarterly")
	}
	recs = append(recs, "Enable action confirmations for medium-risk changes to protect mandates")
	return recs
}

func round2(v float64) float64 {
	return float64(int(v*100+0.5)) / 100
}
