package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/dharact/backend/internal/config"
	"github.com/dharact/backend/internal/httpx"
	"github.com/dharact/backend/internal/util"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	DB  *sql.DB
	Cfg *config.Config
}

func NewAuthHandler(db *sql.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{DB: db, Cfg: cfg}
}

const (
	maxFailedAttempts = 5
	lockoutWindow     = 15 * time.Minute
	lockoutDuration   = 30 * time.Minute
)

// POST /api/v1/auth/login — FR-ADM-001: bcrypt/argon2, session timeout, lockout after 5 attempts/15min.
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}

	var (
		id, hash, role  string
		isActive        bool
		failedAttempts  int
		lockedUntil     sql.NullTime
	)
	err := h.DB.QueryRow(`SELECT id, password_hash, role, is_active, failed_login_attempts, locked_until
		FROM users WHERE email = $1`, req.Email).Scan(&id, &hash, &role, &isActive, &failedAttempts, &lockedUntil)

	generic := func() {
		httpx.Error(w, 401, "UNAUTHENTICATED", "Invalid email or password", nil)
	}

	if err == sql.ErrNoRows {
		generic()
		return
	} else if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Login failed", nil)
		return
	}
	if !isActive {
		generic()
		return
	}
	if lockedUntil.Valid && time.Now().Before(lockedUntil.Time) {
		httpx.Error(w, 423, "ACCOUNT_LOCKED", "Account temporarily locked, try again later", nil)
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
		failedAttempts++
		if failedAttempts >= maxFailedAttempts {
			h.DB.Exec(`UPDATE users SET failed_login_attempts=0, locked_until=$2 WHERE id=$1`, id, time.Now().Add(lockoutDuration))
		} else {
			h.DB.Exec(`UPDATE users SET failed_login_attempts=$2 WHERE id=$1`, id, failedAttempts)
		}
		generic()
		return
	}

	h.DB.Exec(`UPDATE users SET failed_login_attempts=0, locked_until=NULL, last_login_at=now() WHERE id=$1`, id)

	access, _ := util.IssueToken(h.Cfg.JWTSecret, id, role, "access", time.Duration(h.Cfg.JWTAccessTTLMin)*time.Minute)
	refresh, _ := util.IssueToken(h.Cfg.JWTSecret, id, role, "refresh", time.Duration(h.Cfg.JWTRefreshTTLHrs)*time.Hour)

	httpx.JSON(w, 200, map[string]interface{}{
		"access_token":  access,
		"refresh_token": refresh,
		"user":          map[string]string{"id": id, "role": role, "email": req.Email},
	})
}

// POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	claims, err := util.ParseToken(h.Cfg.JWTSecret, req.RefreshToken)
	if err != nil || claims.Type != "refresh" {
		httpx.Error(w, 401, "UNAUTHENTICATED", "Invalid refresh token", nil)
		return
	}
	access, _ := util.IssueToken(h.Cfg.JWTSecret, claims.UserID, claims.Role, "access", time.Duration(h.Cfg.JWTAccessTTLMin)*time.Minute)
	newRefresh, _ := util.IssueToken(h.Cfg.JWTSecret, claims.UserID, claims.Role, "refresh", time.Duration(h.Cfg.JWTRefreshTTLHrs)*time.Hour)
	httpx.JSON(w, 200, map[string]string{"access_token": access, "refresh_token": newRefresh})
}

// POST /api/v1/auth/logout — stateless JWT: client discards tokens. A denylist table
// could be added here if immediate server-side revocation becomes a requirement.
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	httpx.JSON(w, 200, map[string]string{"status": "logged_out"})
}

// POST /api/v1/auth/forgot-password — issues a short-lived reset token and (in production)
// emails it via the mailer. Always returns 200 regardless of whether the email exists,
// to avoid leaking which addresses have accounts.
func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	var userID string
	err := h.DB.QueryRow(`SELECT id FROM users WHERE email=$1 AND is_active`, req.Email).Scan(&userID)
	if err == nil {
		resetToken, _ := util.IssueToken(h.Cfg.JWTSecret, userID, "", "password_reset", 30*time.Minute)
		go sendPasswordResetEmail(h.Cfg, req.Email, resetToken)
	}
	httpx.JSON(w, 200, map[string]string{"status": "if_account_exists_email_sent"})
}

// POST /api/v1/auth/reset-password
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}
	if err := decodeJSON(r, &req); err != nil || len(req.NewPassword) < 8 {
		httpx.Error(w, 400, "VALIDATION_ERROR", "A token and an 8+ character password are required", nil)
		return
	}
	claims, err := util.ParseToken(h.Cfg.JWTSecret, req.Token)
	if err != nil || claims.Type != "password_reset" {
		httpx.Error(w, 400, "VALIDATION_ERROR", "This reset link is invalid or has expired", nil)
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 12)
	if _, err := h.DB.Exec(`UPDATE users SET password_hash=$1, failed_login_attempts=0, locked_until=NULL WHERE id=$2`, string(hash), claims.UserID); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to reset password", nil)
		return
	}
	httpx.JSON(w, 200, map[string]string{"status": "password_updated"})
}
