package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"
)

func decodeJSON(r *http.Request, dst interface{}) error {
	defer r.Body.Close()
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
}

func clientIPFromRequest(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.Split(xff, ",")[0])
	}
	host := r.RemoteAddr
	if i := strings.LastIndex(host, ":"); i != -1 {
		return host[:i]
	}
	return host
}

func randomToken() string {
	b := make([]byte, 24)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// verifyTurnstile checks a Cloudflare Turnstile token server-side per NFRSEC-002.
func verifyTurnstile(secret, token, remoteIP string) bool {
	if token == "" {
		return false
	}
	form := url.Values{}
	form.Set("secret", secret)
	form.Set("response", token)
	form.Set("remoteip", remoteIP)

	client := &http.Client{Timeout: 5 * time.Second}
	res, err := client.PostForm("https://challenges.cloudflare.com/turnstile/v0/siteverify", form)
	if err != nil {
		return false
	}
	defer res.Body.Close()

	var body struct {
		Success bool `json:"success"`
	}
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		return false
	}
	return body.Success
}
