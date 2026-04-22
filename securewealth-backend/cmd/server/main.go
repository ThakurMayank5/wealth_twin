package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"securewealth-backend/config"
	"securewealth-backend/internal/ai"
	"securewealth-backend/internal/auth"
	"securewealth-backend/internal/fraud"
	"securewealth-backend/internal/goal"
	"securewealth-backend/internal/middleware"
	redisclient "securewealth-backend/internal/redis"
	"securewealth-backend/internal/repository"
	"securewealth-backend/internal/sip"
	"securewealth-backend/internal/transaction"
	"securewealth-backend/internal/user"
	"securewealth-backend/internal/wealth"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config load failed: %v", err)
	}

	ctx := context.Background()

	dbPool, err := repository.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database init failed: %v", err)
	}
	defer dbPool.Close()

	redis, err := redisclient.New(cfg.RedisURL)
	if err != nil {
		log.Fatalf("redis init failed: %v", err)
	}

	userRepo := repository.NewUserRepository(dbPool)
	transactionRepo := repository.NewTransactionRepository(dbPool)
	goalRepo := repository.NewGoalRepository(dbPool)
	sipRepo := repository.NewSIPRepository(dbPool)
	assetRepo := repository.NewAssetRepository(dbPool)
	auditRepo := repository.NewAuditRepository(dbPool)

	authHandler := auth.NewHandler(userRepo, redis, cfg.JWTSecret, cfg.IsDev, cfg.SMSEnabled)
	userHandler := user.NewHandler(userRepo)
	transactionHandler := transaction.NewHandler(transactionRepo)
	goalHandler := goal.NewHandler(goalRepo)
	wealthHandler := wealth.NewHandler(userRepo, assetRepo, goalRepo, sipRepo, redis, cfg.JWTSecret)
	sipHandler := sip.NewHandler(sipRepo, redis, cfg.JWTSecret)

	fraudEngine := fraud.NewEngine(redis, sipRepo, auditRepo)
	securityHandler := fraud.NewSecurityHandler(fraudEngine, auditRepo)

	aiClient := ai.NewClient(cfg.OpenRouterAPIKey, cfg.OpenRouterModel)
	aiHandler := ai.NewHandler(aiClient, redis, userRepo, transactionRepo, goalRepo)

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.RequestID())
	r.Use(middleware.Logger())

	// CORS configuration
	corsOrigins := strings.Split(cfg.CORSOrigins, ",")
	for i, o := range corsOrigins {
		corsOrigins[i] = strings.TrimSpace(o)
	}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Request-ID", "X-Device-Fingerprint"},
		ExposeHeaders:    []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.Use(middleware.RateLimit(redis, 100))

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong", "port": cfg.Port})
	})

	api := r.Group("/api/v1")
	publicAuth := api.Group("/auth")
	{
		publicAuth.POST("/login", authHandler.Login)
		publicAuth.POST("/register", authHandler.Register)
		publicAuth.POST("/refresh", authHandler.Refresh)
	}

	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret, redis))
	protected.Use(middleware.BlocklistCheck(redis))
	protected.Use(middleware.DeviceLastSeen(userRepo))
	{
		protected.POST("/auth/logout", authHandler.Logout)
		protected.POST("/auth/otp/send", authHandler.SendOTP)
		protected.POST("/auth/otp/verify", authHandler.VerifyOTP)

		protected.GET("/user/profile", userHandler.GetProfile)
		protected.PUT("/user/risk-profile", userHandler.UpdateRiskProfile)

		protected.GET("/wealth/dashboard", wealthHandler.GetDashboard)
		protected.GET("/wealth/net-worth", wealthHandler.GetNetWorth)

		protected.GET("/transactions", transactionHandler.List)
		protected.GET("/transactions/summary", transactionHandler.Summary)

		protected.GET("/goals", goalHandler.List)
		protected.POST("/goals", goalHandler.Create)
		protected.GET("/goals/:id/projection", goalHandler.GetProjection)

		protected.GET("/security/events", securityHandler.GetEvents)
		protected.POST("/security/evaluate-action", securityHandler.EvaluateAction)

		protected.GET("/ai/recommendations", aiHandler.GetRecommendations)
		protected.POST("/ai/chat", aiHandler.Chat)

		fraudGated := protected.Group("/")
		fraudGated.Use(middleware.FraudGate(fraudEngine))
		{
			fraudGated.POST("/sips", sipHandler.Create)
			fraudGated.PUT("/sips/:id", sipHandler.Update)
			fraudGated.DELETE("/sips/:id", sipHandler.Delete)
			fraudGated.POST("/sips/confirm", sipHandler.Confirm)
			fraudGated.POST("/wealth/assets", wealthHandler.AddAsset)
		}
	}

	httpServer := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("SecureWealth backend listening on :%s", cfg.Port)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh
	log.Println("shutdown signal received")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Printf("server shutdown error: %v", err)
	}
	dbPool.Close()
	if err := redis.Close(); err != nil {
		log.Printf("redis close error: %v", err)
	}
	log.Println("server shutdown complete")
}
