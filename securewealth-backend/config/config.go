package config

import (
	"errors"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds runtime configuration loaded from env vars.
type Config struct {
	Port              string
	DatabaseURL       string
	RedisURL          string
	JWTSecret         string
	AIServiceAddress  string
	IsDev             bool
	SMSEnabled        bool
	OpenRouterAPIKey  string
	OpenRouterModel   string
	CORSOrigins       string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Port:              getEnv("PORT", "42069"),
		DatabaseURL:       strings.TrimSpace(os.Getenv("DATABASE_URL")),
		RedisURL:          strings.TrimSpace(os.Getenv("REDIS_URL")),
		JWTSecret:         strings.TrimSpace(os.Getenv("JWT_SECRET")),
		AIServiceAddress:  getEnv("AI_SERVICE_ADDRESS", "localhost:50051"),
		IsDev:             strings.EqualFold(getEnv("APP_ENV", "development"), "development"),
		SMSEnabled:        parseBool(getEnv("SMS_ENABLED", "false")),
		OpenRouterAPIKey:  strings.TrimSpace(os.Getenv("OPENROUTER_API_KEY")),
		OpenRouterModel:   getEnv("OPENROUTER_MODEL", "google/gemma-4-26b-a4b-it:free"),
		CORSOrigins:       getEnv("CORS_ORIGINS", "*"),
	}

	if cfg.DatabaseURL == "" {
		return nil, errors.New("DATABASE_URL is required")
	}
	if cfg.RedisURL == "" {
		return nil, errors.New("REDIS_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, errors.New("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func parseBool(value string) bool {
	b, err := strconv.ParseBool(strings.TrimSpace(value))
	if err != nil {
		return false
	}
	return b
}
