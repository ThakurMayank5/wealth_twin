package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"securewealth-backend/internal/models"
	redisclient "securewealth-backend/internal/redis"
	"securewealth-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type Recommendation struct {
	Type        string  `json:"type"`
	Message     string  `json:"message"`
	Confidence  float64 `json:"confidence"`
	Explanation string  `json:"explanation"`
}

type Client struct {
	APIKey     string
	Model      string
	HTTPClient *http.Client
}

func NewClient(apiKey, model string) *Client {
	if model == "" {
		model = "google/gemma-4-26b-a4b-it:free"
	}
	return &Client{
		APIKey: strings.TrimSpace(apiKey),
		Model:  model,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type openRouterRequest struct {
	Model    string              `json:"model"`
	Messages []openRouterMessage `json:"messages"`
}

type openRouterMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openRouterResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func (c *Client) callLLM(ctx context.Context, systemPrompt, userPrompt string) (string, error) {
	if c.APIKey == "" {
		return "", fmt.Errorf("no API key configured")
	}

	reqBody := openRouterRequest{
		Model: c.Model,
		Messages: []openRouterMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
	}
	raw, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://openrouter.ai/api/v1/chat/completions", bytes.NewReader(raw))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("HTTP-Referer", "https://twinvest.app")
	req.Header.Set("X-Title", "TwinVest Wealth AI")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var result openRouterResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}
	if result.Error != nil {
		return "", fmt.Errorf("openrouter error: %s", result.Error.Message)
	}
	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no response from LLM")
	}

	return strings.TrimSpace(result.Choices[0].Message.Content), nil
}

func (c *Client) GetRecommendations(ctx context.Context, user models.User, recent []models.Transaction, goals []models.Goal) ([]Recommendation, string, error) {
	if c.APIKey == "" {
		return mockRecommendations(user, recent, goals), "mock_fallback", nil
	}

	txSummary := summarizeTransactions(recent)
	goalSummary := summarizeGoals(goals)

	systemPrompt := `You are a financial advisor AI for TwinVest, a wealth management app. 
Provide exactly 3 actionable recommendations in valid JSON array format.
Each item must have: "type" (safety|allocation|goal|saving), "message" (short actionable advice), "confidence" (0.0-1.0), "explanation" (brief why).
Return ONLY the JSON array, no markdown, no extra text.`

	userPrompt := fmt.Sprintf(`User profile:
- Risk appetite: %s
- Monthly income: ₹%.0f
- Monthly spend: ₹%.0f
- Account balance: ₹%.0f

Recent transactions: %s

Goals: %s

Give 3 personalized recommendations.`, user.RiskAppetite, user.AvgMonthlyIncome, user.AvgMonthlySpend, user.AccountBalance, txSummary, goalSummary)

	reply, err := c.callLLM(ctx, systemPrompt, userPrompt)
	if err != nil {
		return mockRecommendations(user, recent, goals), "mock_fallback", nil
	}

	// Try to parse LLM JSON
	reply = extractJSON(reply)
	var recs []Recommendation
	if err := json.Unmarshal([]byte(reply), &recs); err != nil {
		return mockRecommendations(user, recent, goals), "llm_parse_fallback", nil
	}
	if len(recs) == 0 {
		return mockRecommendations(user, recent, goals), "llm_empty_fallback", nil
	}

	return recs, "openrouter_llm", nil
}

func (c *Client) Chat(ctx context.Context, userID, message, financialContextJSON string) (string, []string, string, error) {
	message = strings.TrimSpace(message)
	if message == "" {
		return "", nil, "", nil
	}

	if c.APIKey == "" {
		reply := "I am currently running in development fallback mode. Prioritize emergency fund coverage, keep SIPs consistent, and avoid high-risk concentration this week."
		return reply, splitIntoChunks(reply), "mock_fallback", nil
	}

	systemPrompt := `You are TwinVest AI, a friendly financial advisor chatbot for an Indian wealth management app. 
You help users with investment decisions, SIP planning, goal tracking, and spending insights.
Keep responses concise (2-4 sentences), actionable, and in a warm conversational tone.
Use ₹ for currency. Base your advice on the user's financial context provided.`

	userPrompt := fmt.Sprintf("My financial context: %s\n\nMy question: %s", financialContextJSON, message)

	reply, err := c.callLLM(ctx, systemPrompt, userPrompt)
	if err != nil {
		fallback := "I'm having trouble connecting right now. In the meantime, keep your SIPs consistent and review your monthly spending patterns."
		return fallback, splitIntoChunks(fallback), "llm_error_fallback", nil
	}

	return reply, splitIntoChunks(reply), "openrouter_llm", nil
}

func extractJSON(s string) string {
	s = strings.TrimSpace(s)
	// Remove markdown code blocks if present
	if strings.HasPrefix(s, "```") {
		lines := strings.Split(s, "\n")
		filtered := make([]string, 0, len(lines))
		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if strings.HasPrefix(trimmed, "```") {
				continue
			}
			filtered = append(filtered, line)
		}
		s = strings.TrimSpace(strings.Join(filtered, "\n"))
	}
	// Find first [ and last ]
	start := strings.Index(s, "[")
	end := strings.LastIndex(s, "]")
	if start >= 0 && end > start {
		return s[start : end+1]
	}
	return s
}

func summarizeTransactions(txs []models.Transaction) string {
	if len(txs) == 0 {
		return "No recent transactions."
	}
	totalDebit := 0.0
	totalCredit := 0.0
	categories := map[string]float64{}
	for _, tx := range txs {
		if tx.Type == "DEBIT" {
			totalDebit += tx.Amount
			if tx.Category != "" {
				categories[tx.Category] += tx.Amount
			}
		} else {
			totalCredit += tx.Amount
		}
	}
	topCats := ""
	for cat, amt := range categories {
		topCats += fmt.Sprintf("%s: ₹%.0f, ", cat, amt)
	}
	return fmt.Sprintf("%d transactions. Total debit: ₹%.0f, credit: ₹%.0f. Categories: %s", len(txs), totalDebit, totalCredit, topCats)
}

func summarizeGoals(goals []models.Goal) string {
	if len(goals) == 0 {
		return "No active goals."
	}
	parts := make([]string, 0, len(goals))
	for _, g := range goals {
		parts = append(parts, fmt.Sprintf("%s (%s): ₹%.0f/₹%.0f", g.Name, g.GoalType, g.CurrentAmount, g.TargetAmount))
	}
	return strings.Join(parts, "; ")
}

func mockRecommendations(user models.User, recent []models.Transaction, goals []models.Goal) []Recommendation {
	recs := make([]Recommendation, 0, 3)
	recs = append(recs, Recommendation{
		Type:        "safety",
		Message:     "Keep at least 6 months of expenses as emergency liquidity.",
		Confidence:  0.89,
		Explanation: "Fraud-aware wealth actions are enabled; liquidity keeps plans resilient during security holds.",
	})

	if strings.EqualFold(user.RiskAppetite, "AGGRESSIVE") {
		recs = append(recs, Recommendation{
			Type:        "allocation",
			Message:     "Use staggered entries for high-volatility funds instead of single large allocations.",
			Confidence:  0.78,
			Explanation: "This reduces timing risk while preserving growth exposure.",
		})
	} else {
		recs = append(recs, Recommendation{
			Type:        "allocation",
			Message:     "Prefer balanced or hybrid SIP allocations aligned to your goal dates.",
			Confidence:  0.81,
			Explanation: "Matches medium-term goals with lower drawdown volatility.",
		})
	}

	recs = append(recs, Recommendation{
		Type:        "goal",
		Message:     "Review monthly goal contributions and increase by 5-10% when income rises.",
		Confidence:  0.75,
		Explanation: "Small periodic increases improve on-time goal completion probability.",
	})

	return recs
}

func splitIntoChunks(text string) []string {
	if strings.TrimSpace(text) == "" {
		return nil
	}
	parts := strings.Split(text, ". ")
	chunks := make([]string, 0, len(parts))
	for i, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		if i < len(parts)-1 && !strings.HasSuffix(p, ".") {
			p += "."
		}
		chunks = append(chunks, p)
	}
	if len(chunks) == 0 {
		return []string{text}
	}
	return chunks
}

type Handler struct {
	Client       *Client
	Redis        *redisclient.Client
	Users        *repository.UserRepository
	Transactions *repository.TransactionRepository
	Goals        *repository.GoalRepository
}

func NewHandler(client *Client, redis *redisclient.Client, users *repository.UserRepository, transactions *repository.TransactionRepository, goals *repository.GoalRepository) *Handler {
	return &Handler{
		Client:       client,
		Redis:        redis,
		Users:        users,
		Transactions: transactions,
		Goals:        goals,
	}
}

func (h *Handler) GetRecommendations(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	ctx := c.Request.Context()
	cacheKey := "ai:recs:" + userID
	var cached []Recommendation
	if err := h.Redis.GetJSON(ctx, cacheKey, &cached); err == nil {
		c.JSON(http.StatusOK, gin.H{"items": cached, "source": "cache"})
		return
	}

	user, err := h.Users.GetByID(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user context"})
		return
	}

	txs, err := h.Transactions.Recent(ctx, userID, 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch recent transactions"})
		return
	}

	goals, err := h.Goals.ListByUser(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch goals"})
		return
	}

	recs, source, err := h.Client.GetRecommendations(ctx, *user, txs, goals)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate recommendations"})
		return
	}

	_ = h.Redis.SetJSON(ctx, cacheKey, recs, time.Hour)
	c.JSON(http.StatusOK, gin.H{"items": recs, "source": source})
}

func (h *Handler) Chat(c *gin.Context) {
	userID := strings.TrimSpace(c.GetString("user_id"))
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req struct {
		Message string `json:"message"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Message) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message is required"})
		return
	}

	user, err := h.Users.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to build financial context"})
		return
	}

	contextPayload := map[string]any{
		"risk_appetite":     user.RiskAppetite,
		"monthly_income":    user.AvgMonthlyIncome,
		"monthly_spend":     user.AvgMonthlySpend,
		"account_balance":   user.AccountBalance,
		"consent_given":     user.ConsentGiven,
		"wealth_protection": "enabled",
	}
	rawContext, _ := json.Marshal(contextPayload)

	response, chunks, source, err := h.Client.Chat(c.Request.Context(), userID, req.Message, string(rawContext))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process chat"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"response": response,
		"chunks":   chunks,
		"source":   source,
	})
}
