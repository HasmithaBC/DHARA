package config

import (
	"bufio"
	"os"
	"strconv"
	"strings"
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

// loadDotEnv reads KEY=VALUE pairs from a local .env file (if present) into the process
// environment without overriding variables that are already set, so that
// `cp .env.example .env && go run ./cmd/server` behaves as the README describes.
func loadDotEnv(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		line = strings.TrimPrefix(line, "export ")
		i := strings.Index(line, "=")
		if i <= 0 {
			continue
		}
		key := strings.TrimSpace(line[:i])
		val := strings.TrimSpace(line[i+1:])
		if len(val) >= 2 && ((val[0] == '"' && val[len(val)-1] == '"') || (val[0] == '\'' && val[len(val)-1] == '\'')) {
			val = val[1 : len(val)-1]
		}
		if _, exists := os.LookupEnv(key); !exists {
			os.Setenv(key, val)
		}
	}
}

func Load() *Config {
	loadDotEnv(".env")
	return &Config{
		Port:             getEnv("PORT", "8080"),
		DatabaseURL:      getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/dhara?sslmode=disable"),
		JWTSecret:        getEnv("JWT_SECRET", "dev-secret-change-me"),
		JWTAccessTTLMin:  getEnvInt("JWT_ACCESS_TTL_MIN", 60),
		JWTRefreshTTLHrs: getEnvInt("JWT_REFRESH_TTL_HRS", 168),
		AllowedOrigins:   getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"),
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
