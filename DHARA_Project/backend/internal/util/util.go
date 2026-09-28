package util

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
)

var slugInvalid = regexp.MustCompile(`[^a-z0-9]+`)

// Slugify implements the slug validation rule in §10: lowercase, alphanumeric + hyphens.
func Slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = slugInvalid.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if len(s) > 180 {
		s = s[:180]
	}
	return s
}

var digitsOnly = regexp.MustCompile(`[^0-9]`)

// NormalizePhone accepts 0771234567, +94771234567, 94771234567 and returns E.164 (+94...),
// per §10 "Lead phone" validation rule and C06 design constraint.
func NormalizePhone(raw string) (string, error) {
	d := digitsOnly.ReplaceAllString(raw, "")
	switch {
	case len(d) == 10 && strings.HasPrefix(d, "0"):
		return "+94" + d[1:], nil
	case len(d) == 11 && strings.HasPrefix(d, "94"):
		return "+" + d, nil
	case len(d) == 9:
		return "+94" + d, nil
	case strings.HasPrefix(raw, "+") && len(d) >= 9:
		return "+" + d, nil
	}
	return "", fmt.Errorf("invalid Sri Lankan phone number: %s", raw)
}

// Unit conversion constants — Appendix C.
const (
	PerchToSqFt  = 272.25
	PerchToSqM   = 25.293
	RoodInPerch  = 40
	AcreInPerch  = 160
	AcreToSqFt   = 43560
	AcreToSqM    = 4046.86
	SqMToSqFt    = 10.7639
)

// LandExtentDisplay formats a perch value the way FR-PRP-005 requires, e.g.
// "20 Perches (0.125 Acres · 505.9 m² · 5,445 sq ft)", adding A-R-P notation
// when the extent is 40 perches or more (Appendix C display rule).
func LandExtentDisplay(perches float64) string {
	acres := perches / AcreInPerch
	sqm := perches * PerchToSqM
	sqft := perches * PerchToSqFt

	base := fmt.Sprintf("%s Perches (%.3f Acres · %.1f m² · %s sq ft)",
		trimFloat(perches), acres, sqm, commaInt(sqft))

	if perches >= RoodInPerch {
		wholeAcres := int(perches) / AcreInPerch
		remainder := perches - float64(wholeAcres*AcreInPerch)
		roods := int(remainder) / RoodInPerch
		remPerches := remainder - float64(roods*RoodInPerch)
		arp := fmt.Sprintf(" — %dA-%dR-%sP", wholeAcres, roods, trimFloat(remPerches))
		base = fmt.Sprintf("%s Perches (%s Acres · %.1f m² · %s sq ft)%s",
			trimFloat(perches), trimFloat(acres), sqm, commaInt(sqft), arp)
	}
	return base
}

func trimFloat(f float64) string {
	s := strconv.FormatFloat(f, 'f', 2, 64)
	s = strings.TrimRight(s, "0")
	s = strings.TrimRight(s, ".")
	return s
}

func commaInt(f float64) string {
	n := int64(f)
	s := strconv.FormatInt(n, 10)
	neg := false
	if strings.HasPrefix(s, "-") {
		neg = true
		s = s[1:]
	}
	var out []byte
	for i, c := range []byte(s) {
		if i != 0 && (len(s)-i)%3 == 0 {
			out = append(out, ',')
		}
		out = append(out, c)
	}
	if neg {
		return "-" + string(out)
	}
	return string(out)
}

// FormatPriceLKR renders "LKR 12,500,000" style strings per FR-LST-006.
func FormatPriceLKR(amount float64) string {
	return "LKR " + commaInt(amount)
}

// NextReferenceCode implements Appendix D: DHR-{C}-{NNNN}, with -R suffix for rentals.
func NextReferenceCode(category string, seq int, isRent bool) string {
	code := map[string]string{"LAND": "L", "HOUSE": "H", "COMMERCIAL": "C"}[category]
	ref := fmt.Sprintf("DHR-%s-%04d", code, seq)
	if isRent {
		ref += "-R"
	}
	return ref
}

// SignDownloadURL produces an HMAC-signed, time-limited token for gated document
// downloads (FR-PRP-007: signed link valid <= 15 minutes).
func SignDownloadURL(secret, documentID string, ttl time.Duration) (token string, expiresAt int64) {
	expiresAt = time.Now().Add(ttl).Unix()
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(fmt.Sprintf("%s:%d", documentID, expiresAt)))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return fmt.Sprintf("%d.%s", expiresAt, sig), expiresAt
}

func VerifyDownloadToken(secret, documentID, token string) bool {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return false
	}
	expiresAt, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil || time.Now().Unix() > expiresAt {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(fmt.Sprintf("%s:%d", documentID, expiresAt)))
	expected := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(parts[1]))
}
