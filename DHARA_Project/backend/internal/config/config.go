package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port             string
	DatabaseURL      string
	JWTSecret        string
	JWTAccessTTLMin  int
	JWTRefreshTTLHrs int
	AllowedOrigins   string
	SignedURLSecret  string
	SendGridAPIKey   string
	SendGridFrom     string
	SalesInboxEmail  string
	TurnstileSecret  string
	MediaUploadDir   string
	MaxImageBytes    int64
	MaxPDFBytes      int64
	SiteBaseURL      string
	WhatsAppToken    string
	WhatsAppPhoneID  string
	WhatsAppSalesNum string
	HighIntentLKR    float64
	FrontendBaseURL  string
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvFloat(key string, fallback float64) float64 {
	if v := os.Getenv(key); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	}
	return fallback
}

func Load() *Config {
	return &Config{
		Port:             getEnv("PORT", "8080"),
		DatabaseURL:      getEnv("DATABASE_URL", "postgres://postgres:20010305@Gdhg@localhost:5432/dhara?sslmode=disable"),
		JWTSecret:        getEnv("JWT_SECRET", "dev-secret-change-me"),
		JWTAccessTTLMin:  getEnvInt("JWT_ACCESS_TTL_MIN", 60),
		JWTRefreshTTLHrs: getEnvInt("JWT_REFRESH_TTL_HRS", 168),
		AllowedOrigins:   getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
		SignedURLSecret:  getEnv("SIGNED_URL_SECRET", "dev-signed-url-secret"),
		SendGridAPIKey:   getEnv("SENDGRID_API_KEY", ""),
		SendGridFrom:     getEnv("SENDGRID_FROM_EMAIL", "no-reply@dharact.com"),
		SalesInboxEmail:  getEnv("SALES_INBOX_EMAIL", "sales@dharact.com"),
		TurnstileSecret:  getEnv("TURNSTILE_SECRET", ""),
		MediaUploadDir:   getEnv("MEDIA_UPLOAD_DIR", "./uploads"),
		MaxImageBytes:    int64(getEnvInt("MAX_IMAGE_BYTES", 10*1024*1024)),
		MaxPDFBytes:      int64(getEnvInt("MAX_PDF_BYTES", 20*1024*1024)),
		SiteBaseURL:      getEnv("SITE_BASE_URL", "https://dharact.com"),
		WhatsAppToken:    getEnv("WHATSAPP_BUSINESS_TOKEN", ""),
		WhatsAppPhoneID:  getEnv("WHATSAPP_PHONE_NUMBER_ID", ""),
		WhatsAppSalesNum: getEnv("WHATSAPP_SALES_NUMBER", ""),
		HighIntentLKR:    getEnvFloat("HIGH_INTENT_OFFER_THRESHOLD_LKR", 10000000),
		FrontendBaseURL:  getEnv("FRONTEND_BASE_URL", getEnv("SITE_BASE_URL", "https://dharact.com")),
	}
}
