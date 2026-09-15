package middleware

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/dharact/backend/internal/util"
	"golang.org/x/time/rate"
)

type ctxKey string

const (
	CtxUserID ctxKey = "userID"
	CtxRole   ctxKey = "role"
)

// RequireAuth validates the bearer JWT and injects user id / role into context.
// Used on every /admin/* route (FR-ADM-002: RBAC enforced at API level, not just UI).
func RequireAuth(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authz := r.Header.Get("Authorization")
			if !strings.HasPrefix(authz, "Bearer ") {
				writeError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Missing bearer token", nil)
				return
			}
			token := strings.TrimPrefix(authz, "Bearer ")
			claims, err := util.ParseToken(secret, token)
			if err != nil || claims.Type != "access" {
				writeError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Invalid or expired token", nil)
				return
			}
			ctx := context.WithValue(r.Context(), CtxUserID, claims.UserID)
			ctx = context.WithValue(ctx, CtxRole, claims.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole enforces the permission matrix in §5.9. Pass one or more roles
// permitted to call the wrapped handler.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := map[string]bool{}
	for _, r := range roles {
		allowed[r] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, _ := r.Context().Value(CtxRole).(string)
			if !allowed[role] {
				writeError(w, http.StatusForbidden, "FORBIDDEN", "You do not have permission to perform this action", nil)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// CORS applies a permissive-but-scoped CORS policy for the public frontend origin.
func CORS(allowedOrigin string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type,Authorization")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// SecurityHeaders implements NFR-SEC-005.
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; img-src * data:; frame-src https://www.google.com")
		next.ServeHTTP(w, r)
	})
}

func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

// --- Simple per-IP rate limiter (NFR-SEC-002 / §6.3: POST /leads 5 per 10 min per IP) ---

type IPRateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*rate.Limiter
	r        rate.Limit
	b        int
}

func NewIPRateLimiter(perWindow int, window time.Duration) *IPRateLimiter {
	return &IPRateLimiter{
		visitors: make(map[string]*rate.Limiter),
		r:        rate.Every(window / time.Duration(perWindow)),
		b:        perWindow,
	}
}

func (l *IPRateLimiter) getLimiter(ip string) *rate.Limiter {
	l.mu.Lock()
	defer l.mu.Unlock()
	lim, ok := l.visitors[ip]
	if !ok {
		lim = rate.NewLimiter(l.r, l.b)
		l.visitors[ip] = lim
	}
	return lim
}

func (l *IPRateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := clientIP(r)
		if !l.getLimiter(ip).Allow() {
			writeError(w, http.StatusTooManyRequests, "RATE_LIMITED", "Too many requests, please try again shortly", nil)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.Split(xff, ",")[0])
	}
	return r.RemoteAddr
}

// writeError matches the error envelope in §6.3.
func writeError(w http.ResponseWriter, status int, code, message string, fields map[string]string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"error": map[string]interface{}{
			"code":    code,
			"message": message,
			"fields":  fields,
		},
	})
}
