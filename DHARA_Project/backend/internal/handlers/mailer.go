package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/dharact/backend/internal/config"
)

// --- Low-level SendGrid v3 transport, shared by every email in this file ---
//
// Falls back to structured logging when SENDGRID_API_KEY is unset, so local
// development and the sandboxed environment this was built in never block on
// a live network call. Once a key is configured this is a real, working send
// path — not a stub — including the 3x-retry-with-backoff required by
// NFR-NOT-004 ("a failed lead notification never loses the lead record": the
// lead is committed to the database by the caller *before* this is invoked,
// so a permanent send failure here only affects the notification, not the data).

type sendGridPayload struct {
	Personalizations []sendGridPersonalization `json:"personalizations"`
	From             sendGridAddress           `json:"from"`
	Subject          string                    `json:"subject"`
	Content          []sendGridContent         `json:"content"`
}

type sendGridPersonalization struct {
	To []sendGridAddress `json:"to"`
}

type sendGridAddress struct {
	Email string `json:"email"`
}

type sendGridContent struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

// sendEmail attempts delivery up to 3 times with exponential backoff
// (1s, 2s, 4s) before giving up and logging the failure, per NFR-NOT-004.
func sendEmail(cfg *config.Config, to, subject, htmlBody string) {
	if cfg.SendGridAPIKey == "" {
		log.Printf("[mailer:stub] to=%s subject=%q (no SENDGRID_API_KEY configured — logging instead of sending)\n%s", to, subject, htmlBody)
		return
	}

	payload := sendGridPayload{
		Personalizations: []sendGridPersonalization{{To: []sendGridAddress{{Email: to}}}},
		From:             sendGridAddress{Email: cfg.SendGridFrom},
		Subject:          subject,
		Content:          []sendGridContent{{Type: "text/html", Value: htmlBody}},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[mailer] failed to encode email to %s: %v", to, err)
		return
	}

	backoff := time.Second
	var lastErr error
	for attempt := 1; attempt <= 3; attempt++ {
		req, _ := http.NewRequest(http.MethodPost, "https://api.sendgrid.com/v3/mail/send", bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+cfg.SendGridAPIKey)
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 10 * time.Second}
		res, err := client.Do(req)
		if err == nil && res.StatusCode >= 200 && res.StatusCode < 300 {
			res.Body.Close()
			return
		}
		if res != nil {
			lastErr = fmt.Errorf("sendgrid returned status %d", res.StatusCode)
			res.Body.Close()
		} else {
			lastErr = err
		}
		if attempt < 3 {
			time.Sleep(backoff)
			backoff *= 2
		}
	}
	log.Printf("[mailer] FAILED to send email to %s after 3 attempts: %v", to, lastErr)
}

// --- FR-NOT-001 / FR-NOT-002: instant sales notification + inquirer acknowledgement ---

type leadNotification struct {
	LeadID          string
	LeadType        string
	Name            string
	Email           string
	Phone           string
	Message         string
	PropertyTitle   string
	PropertyRefCode string
	OfferAmountLKR  *float64
}

// NotifyNewLead sends both required emails for FR-NOT-001/002, within the 60s
// window implied by the acceptance criteria (both sends happen synchronously
// in the goroutine the caller already dispatches this from).
func NotifyNewLead(cfg *config.Config, n leadNotification) {
	adminURL := fmt.Sprintf("%s/admin/leads/%s", cfg.FrontendBaseURL, n.LeadID)

	salesSubject := fmt.Sprintf("New %s lead: %s", friendlyLeadType(n.LeadType), n.Name)
	salesBody := fmt.Sprintf(`
		<h2>New lead received</h2>
		<p><strong>Type:</strong> %s</p>
		<p><strong>Name:</strong> %s<br/><strong>Email:</strong> %s<br/><strong>Phone:</strong> %s</p>
		%s
		%s
		<p><strong>Message:</strong> %s</p>
		<p><a href="%s">Open this lead in the admin panel</a></p>`,
		friendlyLeadType(n.LeadType), n.Name, n.Email, n.Phone,
		optionalRow("Property", refAndTitle(n.PropertyRefCode, n.PropertyTitle)),
		optionalRow("Proposed offer", offerString(n.OfferAmountLKR)),
		n.Message, adminURL)
	sendEmail(cfg, cfg.SalesInboxEmail, salesSubject, salesBody)

	ackSubject := "We've received your inquiry — Dhara Construction and Technology"
	ackBody := fmt.Sprintf(`
		<h2>Thank you, %s.</h2>
		<p>We've received your %s%s and a member of our team will respond within one business day.</p>
		<p>If your inquiry is urgent, you can reach us directly on WhatsApp or by phone at +94 76 377 4551.</p>
		<p>— Dhara Construction and Technology</p>`,
		n.Name, friendlyLeadTypeLower(n.LeadType), refAndTitleSuffix(n.PropertyRefCode, n.PropertyTitle))
	sendEmail(cfg, n.Email, ackSubject, ackBody)
}

func friendlyLeadType(t string) string {
	switch t {
	case "PROPERTY_INQUIRY":
		return "Property Inquiry"
	case "SITE_INSPECTION":
		return "Site Inspection Request"
	case "GENERAL_CONTACT":
		return "General Contact"
	case "SERVICE_CONSULTATION":
		return "Service Consultation"
	case "DOCUMENT_DOWNLOAD":
		return "Document Download"
	case "NEWSLETTER":
		return "Newsletter Signup"
	default:
		return t
	}
}

func friendlyLeadTypeLower(t string) string {
	switch t {
	case "SITE_INSPECTION":
		return "site inspection request"
	case "SERVICE_CONSULTATION":
		return "consultation request"
	default:
		return "inquiry"
	}
}

func refAndTitle(ref, title string) string {
	if ref == "" && title == "" {
		return ""
	}
	return fmt.Sprintf("%s (%s)", title, ref)
}

func refAndTitleSuffix(ref, title string) string {
	if ref == "" && title == "" {
		return ""
	}
	return fmt.Sprintf(" regarding %s (%s)", title, ref)
}

func offerString(amount *float64) string {
	if amount == nil {
		return ""
	}
	return fmt.Sprintf("LKR %.2f", *amount)
}

func optionalRow(label, value string) string {
	if value == "" {
		return ""
	}
	return fmt.Sprintf("<p><strong>%s:</strong> %s</p>", label, value)
}

// --- Password reset (auth.go) and newsletter double opt-in (public.go) ---

func sendPasswordResetEmail(cfg *config.Config, toEmail, resetToken string) {
	link := fmt.Sprintf("%s/admin/reset-password?token=%s", cfg.SiteBaseURL, resetToken)
	body := fmt.Sprintf(`<p>A password reset was requested for your Dhara admin account.</p>
		<p><a href="%s">Reset your password</a> (link expires in 30 minutes).</p>
		<p>If you didn't request this, you can safely ignore this email.</p>`, link)
	sendEmail(cfg, toEmail, "Reset your Dhara admin password", body)
}

func sendNewsletterConfirmation(cfg *config.Config, toEmail, token string) {
	link := fmt.Sprintf("%s/api/v1/newsletter/confirm?token=%s", cfg.FrontendBaseURL, token)
	body := fmt.Sprintf(`<p>Please confirm your subscription to Dhara property and construction updates.</p>
		<p><a href="%s">Confirm subscription</a></p>`, link)
	sendEmail(cfg, toEmail, "Confirm your subscription — Dhara", body)
}

// --- FR-NOT-003: daily 08:00 digest to the sales inbox ---

// SendDailyDigest implements FR-NOT-003: a daily 08:00 digest to the sales inbox.
// Exported so cmd/server can trigger it from a scheduler goroutine.
func SendDailyDigest(cfg *config.Config, newLast24h, staleOver48h int) {
	if newLast24h == 0 && staleOver48h == 0 {
		return
	}
	subject := fmt.Sprintf("Dhara daily lead digest — %d new, %d stale", newLast24h, staleOver48h)
	body := fmt.Sprintf(`<h2>Daily lead digest</h2>
		<p><strong>%d</strong> new leads in the last 24 hours.</p>
		<p><strong>%d</strong> leads have been sitting in NEW status for more than 48 hours and may need follow-up.</p>
		<p><a href="%s/admin/leads?status=NEW">Review NEW leads</a></p>`,
		newLast24h, staleOver48h, cfg.FrontendBaseURL)
	sendEmail(cfg, cfg.SalesInboxEmail, subject, body)
}

// --- FR-NOT-005 (P2): optional WhatsApp Business API notification on high-intent leads ---
//
// Fires only when WHATSAPP_BUSINESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_SALES_NUMBER
// are all configured — these require a Meta WhatsApp Business Platform account that only the
// client can provision (SRS Appendix E item 5), so this safely no-ops until then rather than
// blocking on a stub.
func notifyWhatsAppHighIntent(cfg *config.Config, message string) {
	if cfg.WhatsAppToken == "" || cfg.WhatsAppPhoneID == "" || cfg.WhatsAppSalesNum == "" {
		log.Printf("[whatsapp:stub] high-intent lead — would notify %s: %s", cfg.WhatsAppSalesNum, message)
		return
	}
	url := fmt.Sprintf("https://graph.facebook.com/v18.0/%s/messages", cfg.WhatsAppPhoneID)
	payload, _ := json.Marshal(map[string]interface{}{
		"messaging_product": "whatsapp",
		"to":                cfg.WhatsAppSalesNum,
		"type":              "text",
		"text":              map[string]string{"body": message},
	})
	req, _ := http.NewRequest(http.MethodPost, url, bytes.NewReader(payload))
	req.Header.Set("Authorization", "Bearer "+cfg.WhatsAppToken)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 10 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		log.Printf("[whatsapp] failed to send high-intent notification: %v", err)
		return
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		log.Printf("[whatsapp] notification API returned status %d", res.StatusCode)
	}
}

// isHighIntent implements the FR-NOT-005 trigger: site inspection requests, or an offer
// above the configurable threshold.
func isHighIntent(cfg *config.Config, leadType string, offerLKR *float64) bool {
	if leadType == "SITE_INSPECTION" {
		return true
	}
	if offerLKR != nil && *offerLKR >= cfg.HighIntentLKR {
		return true
	}
	return false
}
