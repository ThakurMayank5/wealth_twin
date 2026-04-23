package main

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/http"

	"golang.org/x/net/http2"
	"honnef.co/go/tools/config"

	"github.com/ThakurMayank5/TwinVest/backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

func main() {
	42070
	port := 42070

	cert := "cert.pem"
	key := "key.pem"

	tlsconfig := &tls.Config{
		MinVersion: tls.VersionTLS12,
	}

	router := gin.Default()

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// creating a custom server with TLS configuration

	server := &http.Server{
		Addr:      fmt.Sprintf(":%d", port),
		TLSConfig: tlsconfig,

		Handler: router,
	}

	// Enable HTTP/2
	http2.ConfigureServer(server, &http2.Server{})

	fmt.Printf("Starting server at Port %d\n", port)

	err := server.ListenAndServeTLS(cert, key)

	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}

}

func setupRouter(h *handlers.Handler, cfg *config.Config) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.RequestID())
	r.Use(middleware.Logger())
	r.Use(middleware.RateLimit(h.Redis, 100)) // 100 req/min per IP

	// Public routes — no auth required
	public := r.Group("/api/v1/auth")
	{
		public.POST("/login", h.Auth.Login)
		public.POST("/refresh", h.Auth.Refresh)
		// OTP send is public because the user may not have a token yet (first OTP before login)
	}

	// Protected routes — JWT required
	protected := r.Group("/api/v1")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	protected.Use(middleware.BlocklistCheck(h.Redis))
	{
		protected.POST("/auth/logout", h.Auth.Logout)
		protected.POST("/auth/otp/send", h.Auth.SendOTP)
		protected.POST("/auth/otp/verify", h.Auth.VerifyOTP)

		protected.GET("/user/profile", h.User.GetProfile)
		protected.PUT("/user/risk-profile", h.User.UpdateRiskProfile)

		protected.GET("/wealth/dashboard", h.Wealth.GetDashboard)
		protected.GET("/wealth/net-worth", h.Wealth.GetNetWorth)

		protected.GET("/transactions", h.Transaction.List)
		protected.GET("/transactions/summary", h.Transaction.Summary)

		protected.GET("/goals", h.Goal.List)
		protected.POST("/goals", h.Goal.Create)
		protected.GET("/goals/:id/projection", h.Goal.GetProjection)

		// Fraud-gated wealth actions
		fraudGated := protected.Group("/")
		fraudGated.Use(middleware.FraudGate(h.FraudEngine))
		{
			fraudGated.POST("/sips", h.SIP.Create)
			fraudGated.PUT("/sips/:id", h.SIP.Update)
			fraudGated.DELETE("/sips/:id", h.SIP.Delete)
			fraudGated.POST("/sips/confirm", h.SIP.Confirm)
			fraudGated.POST("/wealth/assets", h.Wealth.AddAsset)
		}

		protected.POST("/security/evaluate-action", h.Security.EvaluateAction)
		protected.GET("/security/events", h.Security.GetEvents)

		protected.GET("/ai/recommendations", h.AI.GetRecommendations)
		protected.POST("/ai/chat", h.AI.Chat)
		protected.GET("/ai/scenario", h.AI.GetScenario)
	}

	return r
}
