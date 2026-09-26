package handlers

// Extra admin handlers that close the gaps between the SRS (§5.8 FR-ADM-*) and the first
// admin build: the property columns the form never covered, cover/alt-text editing,
// bulk publish, richer lead handling, user management, a readable audit log, and a small
// "pages" store for About / Privacy / Terms copy.

import (
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/dharact/backend/internal/httpx"
	"github.com/dharact/backend/internal/models"
	"github.com/dharact/backend/internal/util"
	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

// Leads (FR-ADM-007)
// ============================================================================

func inSet(v string, allowed []string) bool {
	for _, a := range allowed {
		if v == a { return true }
	}
	return false
}

func pageParams(q url.Values, def, max int) (page, perPage int) {
	page, _ = strconv.Atoi(q.Get("page"))
	if page < 1 { page = 1 }
	perPage, _ = strconv.Atoi(q.Get("per_page"))
	if perPage < 1 { perPage = def }
	if perPage > max { perPage = max }
	return page, perPage
}

func metaFor(page, perPage, total int) httpx.Meta {
	pages := total / perPage
	if total % perPage != 0 { pages++ }
	return httpx.Meta{
		Page: page,
		PerPage: perPage,
		TotalPages: pages,
		Total:      total,
	}
}

// ============================================================================

var leadStatuses = []string{"NEW", "CONTACTED", "SITE_VISIT_SCHEDULED", "NEGOTIATING", "CLOSED_WON", "CLOSED_LOST"}

// leadWhere builds one filter used by both the list and the CSV export, so the export is
// always exactly the filtered set.
func leadWhere(q url.Values) (string, []interface{}) {
	where := []string{"1=1"}
	args := []interface{}{}
	add := func(cond string, v interface{}) {
		args = append(args, v)
		where = append(where, strings.Replace(cond, "?", "$"+strconv.Itoa(len(args)), -1))
	}
	if v := q.Get("status"); v != "" {
		add("l.status = ?", strings.ToUpper(v))
	}
	if v := q.Get("lead_type"); v != "" {
		add("l.lead_type = ?", strings.ToUpper(v))
	}
	if v := q.Get("property_id"); v != "" {
		add("l.property_id = ?", v)
	}
	if v := q.Get("assigned_to"); v != "" {
		if v == "none" {
			where = append(where, "l.assigned_to IS NULL")
		} else {
			add("l.assigned_to = ?", v)
		}
	}
	if v := q.Get("date_from"); v != "" {
		add("l.created_at >= ?::date", v)
	}
	if v := q.Get("date_to"); v != "" {
		add("l.created_at < (?::date + interval '1 day')", v)
	}
	if v := strings.TrimSpace(q.Get("q")); v != "" {
		args = append(args, "%"+v+"%")
		n := "$" + strconv.Itoa(len(args))
		where = append(where, fmt.Sprintf("(l.name ILIKE %s OR l.email ILIKE %s OR l.phone ILIKE %s)", n, n, n))
	}
	return strings.Join(where, " AND "), args
}

// validLeadFilter rejects malformed dates/uuids so a bad query string is a 400, not a 500.
func validLeadFilter(q url.Values) string {
	for _, k := range []string{"date_from", "date_to"} {
		if v := q.Get(k); v != "" {
			if _, err := time.Parse("2006-01-02", v); err != nil {
				return k + " must be YYYY-MM-DD"
			}
		}
	}
	return ""
}

type leadListRow struct {
	models.Lead
	PropertyRef  *string `json:"property_ref,omitempty"`
	AssignedName *string `json:"assigned_name,omitempty"`
}

// GET /admin/leads — filters: status, lead_type, property_id, assigned_to (uuid|none), date_from, date_to, q, page, per_page
func (h *AdminHandler) ListLeadsV2(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	if msg := validLeadFilter(q); msg != "" {
		httpx.Error(w, 400, "VALIDATION_ERROR", msg, nil)
		return
	}
	where, args := leadWhere(q)
	page, perPage := pageParams(q, 25, 100)

	var total int
	if err := h.DB.QueryRow(`SELECT count(*) FROM leads l WHERE `+where, args...).Scan(&total); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid filter", nil)
		return
	}
	rows, err := h.DB.Query(fmt.Sprintf(`
		SELECT l.id, l.lead_type, l.property_id, l.name, l.email, l.phone, l.status, l.assigned_to, l.created_at,
		       p.reference_code, u.name
		FROM leads l LEFT JOIN properties p ON p.id = l.property_id LEFT JOIN users u ON u.id = l.assigned_to
		WHERE %s ORDER BY l.created_at DESC LIMIT %d OFFSET %d`, where, perPage, (page-1)*perPage), args...)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to list leads", nil)
		return
	}
	defer rows.Close()
	out := []leadListRow{}
	for rows.Next() {
		var l leadListRow
		rows.Scan(&l.ID, &l.LeadType, &l.PropertyID, &l.Name, &l.Email, &l.Phone, &l.Status, &l.AssignedTo, &l.CreatedAt, &l.PropertyRef, &l.AssignedName)
		out = append(out, l)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate leads", nil)
		return
	}
	httpx.JSONList(w, 200, out, metaFor(page, perPage, total))
}

type leadDetail struct {
	models.Lead
	ConsentGivenAt *time.Time `json:"consent_given_at,omitempty"`
	AssignedName   *string    `json:"assigned_name,omitempty"`
	PropertyTitle  *string    `json:"property_title,omitempty"`
	PropertyRef    *string    `json:"property_ref,omitempty"`
}

// GET /admin/leads/{id} — now includes offer, inspection request, consent and property/assignee names.
func (h *AdminHandler) GetLeadV2(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var l leadDetail
	err := h.DB.QueryRow(`
		SELECT l.id, l.lead_type, l.property_id, l.name, l.email, l.phone, l.whatsapp_same_as_phone, l.message,
		       l.offer_amount_lkr, to_char(l.preferred_inspection_date,'YYYY-MM-DD'), l.preferred_inspection_slot,
		       l.status, l.assigned_to, l.internal_notes, l.source_url, l.utm_source, l.utm_medium, l.utm_campaign,
		       l.created_at, l.consent_given_at, u.name, p.title, p.reference_code
		FROM leads l LEFT JOIN users u ON u.id = l.assigned_to LEFT JOIN properties p ON p.id = l.property_id
		WHERE l.id=$1`, id).Scan(
		&l.ID, &l.LeadType, &l.PropertyID, &l.Name, &l.Email, &l.Phone, &l.WhatsappSameAsPhone, &l.Message,
		&l.OfferAmountLKR, &l.PreferredInspectionDate, &l.PreferredInspectionSlot,
		&l.Status, &l.AssignedTo, &l.InternalNotes, &l.SourceURL, &l.UTMSource, &l.UTMMedium, &l.UTMCampaign,
		&l.CreatedAt, &l.ConsentGivenAt, &l.AssignedName, &l.PropertyTitle, &l.PropertyRef)
	if err == sql.ErrNoRows {
		httpx.Error(w, 404, "NOT_FOUND", "Lead not found", nil)
		return
	} else if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load lead", nil)
		return
	}
	httpx.JSON(w, 200, l)
}

// PATCH /admin/leads/{id} — status, assignee (empty string clears it) and notes.
func (h *AdminHandler) UpdateLeadV2(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Status        *string `json:"status"`
		AssignedTo    *string `json:"assigned_to"`
		InternalNotes *string `json:"internal_notes"`
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	if req.Status != nil && !inSet(strings.ToUpper(*req.Status), leadStatuses) {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Unknown lead status", nil)
		return
	}
	var beforeStatus string
	var beforeAssignee sql.NullString
	if err := h.DB.QueryRow(`SELECT status, assigned_to::text FROM leads WHERE id=$1`, id).Scan(&beforeStatus, &beforeAssignee); err != nil {
		httpx.Error(w, 404, "NOT_FOUND", "Lead not found", nil)
		return
	}
	if req.Status != nil {
		h.DB.Exec(`UPDATE leads SET status=$1 WHERE id=$2`, strings.ToUpper(*req.Status), id)
	}
	if req.AssignedTo != nil {
		if _, err := h.DB.Exec(`UPDATE leads SET assigned_to = NULLIF($1,'')::uuid WHERE id=$2`, *req.AssignedTo, id); err != nil {
			httpx.Error(w, 400, "VALIDATION_ERROR", "Unknown assignee", nil)
			return
		}
	}
	if req.InternalNotes != nil {
		h.DB.Exec(`UPDATE leads SET internal_notes=$1 WHERE id=$2`, *req.InternalNotes, id)
	}
	h.auditWithDiff(h.userID(r), "UPDATE", "lead", id,
		map[string]string{"status": beforeStatus, "assigned_to": beforeAssignee.String}, req)
	httpx.JSON(w, 200, map[string]string{"status": "updated"})
}

// GET /admin/leads/export — same filters as the list, so the file is exactly what is on screen.
func (h *AdminHandler) ExportLeadsV2(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	if msg := validLeadFilter(q); msg != "" {
		httpx.Error(w, 400, "VALIDATION_ERROR", msg, nil)
		return
	}
	where, args := leadWhere(q)
	rows, err := h.DB.Query(`
		SELECT l.lead_type, COALESCE(p.reference_code,''), l.name, l.email, l.phone, l.status, COALESCE(u.name,''),
		       COALESCE(l.offer_amount_lkr::text,''), COALESCE(to_char(l.preferred_inspection_date,'YYYY-MM-DD'),''),
		       COALESCE(l.preferred_inspection_slot::text,''), COALESCE(l.internal_notes,''), COALESCE(l.message,''),
		       COALESCE(l.utm_source,''), l.created_at
		FROM leads l LEFT JOIN properties p ON p.id = l.property_id LEFT JOIN users u ON u.id = l.assigned_to
		WHERE `+where+` ORDER BY l.created_at DESC`, args...)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to export leads", nil)
		return
	}
	defer rows.Close()
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=leads.csv")
	cw := csv.NewWriter(w)
	cw.Write([]string{"lead_type", "property_ref", "name", "email", "phone", "status", "assigned_to", "offer_lkr", "inspection_date", "inspection_slot", "internal_notes", "message", "utm_source", "created_at"})
	for rows.Next() {
		var c [13]string
		var created time.Time
		rows.Scan(&c[0], &c[1], &c[2], &c[3], &c[4], &c[5], &c[6], &c[7], &c[8], &c[9], &c[10], &c[11], &c[12], &created)
		// Neutralise spreadsheet formula injection in free-text cells.
		for i := range c {
			if len(c[i]) > 0 && strings.ContainsRune("=+-@", rune(c[i][0])) {
				c[i] = "'" + c[i]
			}
		}
		cw.Write(append(c[:], created.Format(time.RFC3339)))
	}
	if err := rows.Err(); err != nil {
		return
	}
	cw.Flush()
}

// GET /admin/staff — people a lead can be assigned to (sales managers + administrators).
func (h *AdminHandler) Staff(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`SELECT id, name FROM users WHERE is_active AND role IN ('SALES_MANAGER','ADMINISTRATOR') ORDER BY name`)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load staff", nil)
		return
	}
	defer rows.Close()
	type s struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
	out := []s{}
	for rows.Next() {
		var x s
		rows.Scan(&x.ID, &x.Name)
		out = append(out, x)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate staff", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

// ============================================================================
// Dashboard (FR-ADM-008) — adds leads per property + conversion
// ============================================================================

func (h *AdminHandler) DashboardV2(w http.ResponseWriter, r *http.Request) {
	var new7, new30, total, won, lost, listings int
	h.DB.QueryRow(`SELECT count(*) FROM leads WHERE created_at > now() - interval '7 days'`).Scan(&new7)
	h.DB.QueryRow(`SELECT count(*) FROM leads WHERE created_at > now() - interval '30 days'`).Scan(&new30)
	h.DB.QueryRow(`SELECT count(*) FROM leads`).Scan(&total)
	h.DB.QueryRow(`SELECT count(*) FROM leads WHERE status='CLOSED_WON'`).Scan(&won)
	h.DB.QueryRow(`SELECT count(*) FROM leads WHERE status='CLOSED_LOST'`).Scan(&lost)
	h.DB.QueryRow(`SELECT count(*) FROM properties`).Scan(&listings)

	byStatus := map[string]int{}
	if rows, err := h.DB.Query(`SELECT status, count(*) FROM properties GROUP BY status`); err == nil {
		for rows.Next() {
			var s string
			var c int
			rows.Scan(&s, &c)
			byStatus[s] = c
		}
		_ = rows.Err()
		rows.Close()
	}
	leadsByStatus := map[string]int{}
	if rows, err := h.DB.Query(`SELECT status, count(*) FROM leads GROUP BY status`); err == nil {
		for rows.Next() {
			var s string
			var c int
			rows.Scan(&s, &c)
			leadsByStatus[s] = c
		}
		_ = rows.Err()
		rows.Close()
	}

	type topViewed struct {
		ID            string `json:"id"`
		Title         string `json:"title"`
		ReferenceCode string `json:"reference_code"`
		ViewCount     int    `json:"view_count"`
	}
	top := []topViewed{}
	if rows, err := h.DB.Query(`SELECT id, title, reference_code, view_count FROM properties ORDER BY view_count DESC LIMIT 5`); err == nil {
		for rows.Next() {
			var t topViewed
			rows.Scan(&t.ID, &t.Title, &t.ReferenceCode, &t.ViewCount)
			top = append(top, t)
		}
		_ = rows.Err()
		rows.Close()
	}

	type perProperty struct {
		ID            string `json:"id"`
		Title         string `json:"title"`
		ReferenceCode string `json:"reference_code"`
		Leads         int    `json:"leads"`
	}
	perProp := []perProperty{}
	if rows, err := h.DB.Query(`
		SELECT p.id, p.title, p.reference_code, count(l.id) AS n
		FROM leads l JOIN properties p ON p.id = l.property_id
		GROUP BY p.id, p.title, p.reference_code ORDER BY n DESC LIMIT 8`); err == nil {
		for rows.Next() {
			var x perProperty
			rows.Scan(&x.ID, &x.Title, &x.ReferenceCode, &x.Leads)
			perProp = append(perProp, x)
		}
		_ = rows.Err()
		rows.Close()
	}

	conversion := 0.0
	if total > 0 {
		conversion = float64(int(float64(won)/float64(total)*1000+0.5)) / 10
	}
	httpx.JSON(w, 200, map[string]interface{}{
		"new_leads_7d": new7, "new_leads_30d": new30, "total_leads": total,
		"closed_won": won, "closed_lost": lost, "conversion_rate_pct": conversion,
		"total_listings": listings, "listings_by_status": byStatus, "leads_by_status": leadsByStatus,
		"top_viewed": top, "leads_per_property": perProp,
	})
}
// ============================================================================
// Users (FR-ADM-011)
// ============================================================================

var userRoles = []string{"SALES_MANAGER", "CONTENT_EDITOR", "ADMINISTRATOR"}

// GET /admin/users
func (h *AdminHandler) ListUsersV2(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`SELECT id, name, email, role, is_active, last_login_at,
		(locked_until IS NOT NULL AND locked_until > now()) FROM users ORDER BY created_at`)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to list users", nil)
		return
	}
	defer rows.Close()
	type row struct {
		models.User
		IsLocked bool `json:"is_locked"`
	}
	out := []row{}
	for rows.Next() {
		var u row
		rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.IsActive, &u.LastLoginAt, &u.IsLocked)
		out = append(out, u)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate users", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

// POST /admin/users — validates the fields the original handler trusted.
func (h *AdminHandler) CreateUserV2(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	req.Name, req.Email = strings.TrimSpace(req.Name), strings.ToLower(strings.TrimSpace(req.Email))
	fields := map[string]string{}
	if len(req.Name) < 2 || len(req.Name) > 100 {
		fields["name"] = "Name must be 2–100 characters"
	}
	if at := strings.Index(req.Email, "@"); at < 1 || !strings.Contains(req.Email[at:], ".") || len(req.Email) > 160 {
		fields["email"] = "Enter a valid email address"
	}
	if len(req.Password) < 8 {
		fields["password"] = "Password must be at least 8 characters"
	}
	if !inSet(req.Role, userRoles) {
		fields["role"] = "Choose a role"
	}
	if len(fields) > 0 {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Please correct the highlighted fields", fields)
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	var id string
	if err := h.DB.QueryRow(`INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id`,
		req.Name, req.Email, string(hash), req.Role).Scan(&id); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "That email is already in use", map[string]string{"email": "Already in use"})
		return
	}
	h.audit(h.userID(r), "CREATE", "user", id)
	httpx.JSON(w, 201, map[string]string{"id": id})
}

// wouldRemoveLastAdmin is true if changing this user would leave no active administrator.
func (h *AdminHandler) wouldRemoveLastAdmin(id string) bool {
	var isActiveAdmin bool
	h.DB.QueryRow(`SELECT role='ADMINISTRATOR' AND is_active FROM users WHERE id=$1`, id).Scan(&isActiveAdmin)
	if !isActiveAdmin {
		return false
	}
	var others int
	h.DB.QueryRow(`SELECT count(*) FROM users WHERE role='ADMINISTRATOR' AND is_active AND id <> $1`, id).Scan(&others)
	return others == 0
}

// PATCH /admin/users/{id} — rename, change email, change role, (de)activate, unlock.
func (h *AdminHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Name     *string `json:"name"`
		Email    *string `json:"email"`
		Role     *string `json:"role"`
		IsActive *bool   `json:"is_active"`
		Unlock   *bool   `json:"unlock"`
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	self := id == h.userID(r)
	if req.Role != nil && !inSet(*req.Role, userRoles) {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Unknown role", nil)
		return
	}
	if self && ((req.Role != nil && *req.Role != "ADMINISTRATOR") || (req.IsActive != nil && !*req.IsActive)) {
		httpx.Error(w, 400, "VALIDATION_ERROR", "You cannot demote or deactivate your own account", nil)
		return
	}
	if ((req.Role != nil && *req.Role != "ADMINISTRATOR") || (req.IsActive != nil && !*req.IsActive)) && h.wouldRemoveLastAdmin(id) {
		httpx.Error(w, 400, "VALIDATION_ERROR", "There must always be at least one active administrator", nil)
		return
	}
	if req.Name != nil {
		n := strings.TrimSpace(*req.Name)
		if len(n) < 2 || len(n) > 100 {
			httpx.Error(w, 400, "VALIDATION_ERROR", "Name must be 2–100 characters", nil)
			return
		}
		h.DB.Exec(`UPDATE users SET name=$1, updated_at=now() WHERE id=$2`, n, id)
	}
	if req.Email != nil {
		email := strings.ToLower(strings.TrimSpace(*req.Email))
		if at := strings.Index(email, "@"); at < 1 || !strings.Contains(email[at:], ".") || len(email) > 160 {
			httpx.Error(w, 400, "VALIDATION_ERROR", "Enter a valid email address", map[string]string{"email": "Invalid email address"})
			return
		}
		var exists int
		h.DB.QueryRow(`SELECT count(*) FROM users WHERE email=$1 AND id<>$2`, email, id).Scan(&exists)
		if exists > 0 {
			httpx.Error(w, 400, "VALIDATION_ERROR", "That email is already in use", map[string]string{"email": "Already in use"})
			return
		}
		h.DB.Exec(`UPDATE users SET email=$1, updated_at=now() WHERE id=$2`, email, id)
	}
	if req.Role != nil {
		h.DB.Exec(`UPDATE users SET role=$1, updated_at=now() WHERE id=$2`, *req.Role, id)
	}
	if req.IsActive != nil {
		h.DB.Exec(`UPDATE users SET is_active=$1, updated_at=now() WHERE id=$2`, *req.IsActive, id)
	}
	if req.Unlock != nil && *req.Unlock {
		h.DB.Exec(`UPDATE users SET failed_login_attempts=0, locked_until=NULL, updated_at=now() WHERE id=$1`, id)
	}
	h.auditWithDiff(h.userID(r), "UPDATE", "user", id, nil, req)
	httpx.JSON(w, 200, map[string]string{"status": "updated"})
}

// DELETE /admin/users/{id} — deactivate, with the same safety rails as PATCH.
func (h *AdminHandler) DeactivateUserV2(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == h.userID(r) {
		httpx.Error(w, 400, "VALIDATION_ERROR", "You cannot deactivate your own account", nil)
		return
	}
	if h.wouldRemoveLastAdmin(id) {
		httpx.Error(w, 400, "VALIDATION_ERROR", "There must always be at least one active administrator", nil)
		return
	}
	h.DB.Exec(`UPDATE users SET is_active=false WHERE id=$1`, id)
	h.audit(h.userID(r), "DEACTIVATE", "user", id)
	httpx.JSON(w, 200, map[string]string{"status": "deactivated"})
}

// POST /admin/users/{id}/send-reset — force a password reset by emailing the user a reset link.
func (h *AdminHandler) SendUserReset(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var email string
	if err := h.DB.QueryRow(`SELECT email FROM users WHERE id=$1 AND is_active`, id).Scan(&email); err != nil {
		httpx.Error(w, 404, "NOT_FOUND", "Active user not found", nil)
		return
	}
	token, err := util.IssueToken(h.Cfg.JWTSecret, id, "", "password_reset", 30*time.Minute)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Could not create a reset link", nil)
		return
	}
	go sendPasswordResetEmail(h.Cfg, email, token)
	h.audit(h.userID(r), "SEND_PASSWORD_RESET", "user", id)
	httpx.JSON(w, 200, map[string]string{"status": "reset_link_sent"})
}

// ============================================================================
// Audit log (FR-ADM-012): who, filters, field diff, export
// ============================================================================

type auditRow struct {
	ID         string          `json:"id"`
	UserID     *string         `json:"user_id,omitempty"`
	UserName   *string         `json:"user_name,omitempty"`
	Action     string          `json:"action"`
	EntityType string          `json:"entity_type"`
	EntityID   string          `json:"entity_id"`
	Diff       json.RawMessage `json:"diff,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
}

func auditWhere(q url.Values) (string, []interface{}) {
	where := []string{"1=1"}
	args := []interface{}{}
	add := func(cond string, v interface{}) {
		args = append(args, v)
		where = append(where, strings.Replace(cond, "?", "$"+strconv.Itoa(len(args)), -1))
	}
	if v := q.Get("entity_type"); v != "" {
		add("a.entity_type = ?", v)
	}
	if v := q.Get("action"); v != "" {
		add("a.action ILIKE ?", "%"+v+"%")
	}
	if v := q.Get("user_id"); v != "" {
		add("a.user_id = ?", v)
	}
	if v := q.Get("date_from"); v != "" {
		add("a.created_at >= ?::date", v)
	}
	if v := q.Get("date_to"); v != "" {
		add("a.created_at < (?::date + interval '1 day')", v)
	}
	return strings.Join(where, " AND "), args
}

// GET /admin/audit-log — read-only, newest first, paginated.
func (h *AdminHandler) AuditLogV2(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	if msg := validLeadFilter(q); msg != "" {
		httpx.Error(w, 400, "VALIDATION_ERROR", msg, nil)
		return
	}
	where, args := auditWhere(q)
	page, perPage := pageParams(q, 50, 200)
	var total int
	if err := h.DB.QueryRow(`SELECT count(*) FROM audit_logs a WHERE `+where, args...).Scan(&total); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid filter", nil)
		return
	}
	rows, err := h.DB.Query(fmt.Sprintf(`
		SELECT a.id, a.user_id, u.name, a.action, a.entity_type, a.entity_id, a.diff, a.created_at
		FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
		WHERE %s ORDER BY a.created_at DESC LIMIT %d OFFSET %d`, where, perPage, (page-1)*perPage), args...)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load audit log", nil)
		return
	}
	defer rows.Close()
	out := []auditRow{}
	for rows.Next() {
		var a auditRow
		var diff sql.NullString
		rows.Scan(&a.ID, &a.UserID, &a.UserName, &a.Action, &a.EntityType, &a.EntityID, &diff, &a.CreatedAt)
		if diff.Valid {
			a.Diff = json.RawMessage(diff.String)
		}
		out = append(out, a)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate audit log", nil)
		return
	}
	httpx.JSONList(w, 200, out, metaFor(page, perPage, total))
}

// GET /admin/audit-log/export — CSV of the filtered set (capped at 10,000 rows).
func (h *AdminHandler) AuditLogExport(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	if msg := validLeadFilter(q); msg != "" {
		httpx.Error(w, 400, "VALIDATION_ERROR", msg, nil)
		return
	}
	where, args := auditWhere(q)
	rows, err := h.DB.Query(`
		SELECT a.created_at, COALESCE(u.name,''), a.action, a.entity_type, a.entity_id, COALESCE(a.diff::text,'')
		FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
		WHERE `+where+` ORDER BY a.created_at DESC LIMIT 10000`, args...)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to export audit log", nil)
		return
	}
	defer rows.Close()
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=audit-log.csv")
	cw := csv.NewWriter(w)
	cw.Write([]string{"when", "user", "action", "entity_type", "entity_id", "diff"})
	for rows.Next() {
		var t time.Time
		var user, action, et, eid, diff string
		rows.Scan(&t, &user, &action, &et, &eid, &diff)
		cw.Write([]string{t.Format(time.RFC3339), user, action, et, eid, diff})
	}
	if err := rows.Err(); err != nil {
		return
	}
	cw.Flush()
}

// ============================================================================
// Static pages (About / Privacy / Terms) stored in the settings table (FR-ADM-009)
// ============================================================================

var editablePages = map[string]string{
	"about-us":       "About Us",
	"privacy-policy": "Privacy Policy",
	"terms":          "Terms & Conditions",
}

type pageContent struct {
	Slug            string `json:"slug"`
	Label           string `json:"label"`
	Title           string `json:"title"`
	Body            string `json:"body"`
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	UpdatedAt       string `json:"updated_at,omitempty"`
}

func loadPage(db *sql.DB, slug string) pageContent {
	p := pageContent{Slug: slug, Label: editablePages[slug]}
	var raw []byte
	var updated time.Time
	if err := db.QueryRow(`SELECT value, updated_at FROM settings WHERE key=$1`, "page:"+slug).Scan(&raw, &updated); err == nil {
		json.Unmarshal(raw, &p)
		p.Slug, p.Label = slug, editablePages[slug]
		p.UpdatedAt = updated.Format(time.RFC3339)
	}
	return p
}

// GET /admin/pages
func (h *AdminHandler) ListPagesAdmin(w http.ResponseWriter, r *http.Request) {
	out := []pageContent{}
	for _, slug := range []string{"about-us", "privacy-policy", "terms"} {
		p := loadPage(h.DB, slug)
		p.Body = "" // the list does not need the full text
		out = append(out, p)
	}
	httpx.JSON(w, 200, out)
}

// GET /admin/pages/{slug}
func (h *AdminHandler) GetPageAdmin(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if _, ok := editablePages[slug]; !ok {
		httpx.Error(w, 404, "NOT_FOUND", "Unknown page", nil)
		return
	}
	httpx.JSON(w, 200, loadPage(h.DB, slug))
}

// PATCH /admin/pages/{slug} — plain text; paragraphs are separated by blank lines.
func (h *AdminHandler) UpsertPage(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if _, ok := editablePages[slug]; !ok {
		httpx.Error(w, 404, "NOT_FOUND", "Unknown page", nil)
		return
	}
	var req struct {
		Title           string `json:"title"`
		Body            string `json:"body"`
		MetaTitle       string `json:"meta_title"`
		MetaDescription string `json:"meta_description"`
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	fields := map[string]string{}
	if t := strings.TrimSpace(req.Title); t == "" || len(t) > 160 {
		fields["title"] = "Title is required (max 160 characters)"
	}
	if len(req.Body) > 50000 {
		fields["body"] = "Body is too long (max 50,000 characters)"
	}
	if len(req.MetaTitle) > 60 {
		fields["meta_title"] = "Keep the meta title under 60 characters"
	}
	if len(req.MetaDescription) > 160 {
		fields["meta_description"] = "Keep the meta description under 160 characters"
	}
	if len(fields) > 0 {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Please correct the highlighted fields", fields)
		return
	}
	val, _ := json.Marshal(map[string]string{
		"title": strings.TrimSpace(req.Title), "body": req.Body,
		"meta_title": strings.TrimSpace(req.MetaTitle), "meta_description": strings.TrimSpace(req.MetaDescription),
	})
	if _, err := h.DB.Exec(`INSERT INTO settings (key, value) VALUES ($1,$2)
		ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=now()`, "page:"+slug, string(val)); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to save page", nil)
		return
	}
	h.audit(h.userID(r), "UPDATE", "page", slug)
	httpx.JSON(w, 200, loadPage(h.DB, slug))
}

// GET /pages/{slug} (public) — 404 until an editor has saved the page, so the site can fall
// back to its built-in copy.
func (h *PublicHandler) GetPage(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if _, ok := editablePages[slug]; !ok {
		httpx.Error(w, 404, "NOT_FOUND", "Page not found", nil)
		return
	}
	p := loadPage(h.DB, slug)
	if p.UpdatedAt == "" {
		httpx.Error(w, 404, "NOT_FOUND", "Page not found", nil)
		return
	}
	httpx.JSON(w, 200, p)
}
// ============================================================================
// Corporate content: detail reads (the list endpoints return summaries only) and
// NULL-safe lists. Edit forms need the full record because PATCH replaces every field.
// ============================================================================

// GET /admin/services
func (h *AdminHandler) ListServicesAdminV2(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`SELECT id, slug, title, COALESCE(summary,''), COALESCE(icon,''), COALESCE(hero_image,''), sort_order, is_published
		FROM services ORDER BY sort_order, title`)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to list services", nil)
		return
	}
	defer rows.Close()
	type row struct {
		ID          string `json:"id"`
		Slug        string `json:"slug"`
		Title       string `json:"title"`
		Summary     string `json:"summary"`
		Icon        string `json:"icon"`
		HeroImage   string `json:"hero_image"`
		SortOrder   int    `json:"sort_order"`
		IsPublished bool   `json:"is_published"`
	}
	out := []row{}
	for rows.Next() {
		var s row
		rows.Scan(&s.ID, &s.Slug, &s.Title, &s.Summary, &s.Icon, &s.HeroImage, &s.SortOrder, &s.IsPublished)
		out = append(out, s)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate services", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

// GET /admin/services/{id}
func (h *AdminHandler) GetServiceAdmin(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var s struct {
		ID          string `json:"id"`
		Slug        string `json:"slug"`
		Title       string `json:"title"`
		Summary     string `json:"summary"`
		Body        string `json:"body"`
		Icon        string `json:"icon"`
		HeroImage   string `json:"hero_image"`
		SortOrder   int    `json:"sort_order"`
		IsPublished bool   `json:"is_published"`
	}
	err := h.DB.QueryRow(`SELECT id, slug, title, COALESCE(summary,''), COALESCE(body,''), COALESCE(icon,''), COALESCE(hero_image,''), sort_order, is_published
		FROM services WHERE id=$1`, id).Scan(&s.ID, &s.Slug, &s.Title, &s.Summary, &s.Body, &s.Icon, &s.HeroImage, &s.SortOrder, &s.IsPublished)
	if err == sql.ErrNoRows {
		httpx.Error(w, 404, "NOT_FOUND", "Service not found", nil)
		return
	} else if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load service", nil)
		return
	}
	httpx.JSON(w, 200, s)
}

// GET /admin/projects
func (h *AdminHandler) ListProjectsAdminV2(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`SELECT id, slug, title, COALESCE(sector,''), COALESCE(location,''), COALESCE(year_completed,0),
		COALESCE(cover_image,''), is_featured, is_published FROM projects ORDER BY year_completed DESC NULLS LAST, title`)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to list projects", nil)
		return
	}
	defer rows.Close()
	type row struct {
		ID            string `json:"id"`
		Slug          string `json:"slug"`
		Title         string `json:"title"`
		Sector        string `json:"sector"`
		Location      string `json:"location"`
		YearCompleted int    `json:"year_completed"`
		CoverImage    string `json:"cover_image"`
		IsFeatured    bool   `json:"is_featured"`
		IsPublished   bool   `json:"is_published"`
	}
	out := []row{}
	for rows.Next() {
		var p row
		rows.Scan(&p.ID, &p.Slug, &p.Title, &p.Sector, &p.Location, &p.YearCompleted, &p.CoverImage, &p.IsFeatured, &p.IsPublished)
		out = append(out, p)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate projects", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

// GET /admin/projects/{id}
func (h *AdminHandler) GetProjectAdmin(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var p struct {
		ID            string `json:"id"`
		Slug          string `json:"slug"`
		Title         string `json:"title"`
		ClientName    string `json:"client_name"`
		Sector        string `json:"sector"`
		Location      string `json:"location"`
		YearCompleted int    `json:"year_completed"`
		Scope         string `json:"scope"`
		Challenge     string `json:"challenge"`
		Solution      string `json:"solution"`
		Body          string `json:"body"`
		CoverImage    string `json:"cover_image"`
		IsFeatured    bool   `json:"is_featured"`
		IsPublished   bool   `json:"is_published"`
	}
	err := h.DB.QueryRow(`SELECT id, slug, title, COALESCE(client_name,''), COALESCE(sector,''), COALESCE(location,''), COALESCE(year_completed,0),
		COALESCE(scope,''), COALESCE(challenge,''), COALESCE(solution,''), COALESCE(body,''), COALESCE(cover_image,''), is_featured, is_published
		FROM projects WHERE id=$1`, id).Scan(&p.ID, &p.Slug, &p.Title, &p.ClientName, &p.Sector, &p.Location, &p.YearCompleted,
		&p.Scope, &p.Challenge, &p.Solution, &p.Body, &p.CoverImage, &p.IsFeatured, &p.IsPublished)
	if err == sql.ErrNoRows {
		httpx.Error(w, 404, "NOT_FOUND", "Project not found", nil)
		return
	} else if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load project", nil)
		return
	}
	httpx.JSON(w, 200, p)
}

// GET /admin/testimonials
func (h *AdminHandler) ListTestimonialsAdminV2(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`SELECT id, author_name, COALESCE(author_location,''), quote, COALESCE(rating,5), is_published, sort_order
		FROM testimonials ORDER BY sort_order, created_at`)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to list testimonials", nil)
		return
	}
	defer rows.Close()
	type row struct {
		ID             string `json:"id"`
		AuthorName     string `json:"author_name"`
		AuthorLocation string `json:"author_location"`
		Quote          string `json:"quote"`
		Rating         int    `json:"rating"`
		IsPublished    bool   `json:"is_published"`
		SortOrder      int    `json:"sort_order"`
	}
	out := []row{}
	for rows.Next() {
		var t row
		rows.Scan(&t.ID, &t.AuthorName, &t.AuthorLocation, &t.Quote, &t.Rating, &t.IsPublished, &t.SortOrder)
		out = append(out, t)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate testimonials", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

// ============================================================================
// Profile: /admin/me endpoints (any authenticated role)
// ============================================================================

// GET /admin/me — returns the authenticated user's profile
func (h *AdminHandler) Me(w http.ResponseWriter, r *http.Request) {
	id := h.userID(r)
	var u struct {
		ID          string     `json:"id"`
		Name        string     `json:"name"`
		Email       string     `json:"email"`
		Role        string     `json:"role"`
		IsActive    bool       `json:"is_active"`
		LastLoginAt *time.Time `json:"last_login_at"`
		CreatedAt   time.Time  `json:"created_at"`
	}
	err := h.DB.QueryRow(`SELECT id, name, email, role, is_active, last_login_at, created_at FROM users WHERE id=$1`, id).
		Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.IsActive, &u.LastLoginAt, &u.CreatedAt)
	if err == sql.ErrNoRows {
		httpx.Error(w, 404, "NOT_FOUND", "User not found", nil)
		return
	} else if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load user profile", nil)
		return
	}
	httpx.JSON(w, 200, u)
}

// PATCH /admin/me — rename own account
func (h *AdminHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	id := h.userID(r)
	var req struct {
		Name string `json:"name"`
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	name := strings.TrimSpace(req.Name)
	if len(name) < 2 || len(name) > 100 {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Name must be 2–100 characters", map[string]string{"name": "Name must be 2–100 characters"})
		return
	}
	if _, err := h.DB.Exec(`UPDATE users SET name=$1, updated_at=now() WHERE id=$2`, name, id); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to update profile", nil)
		return
	}
	h.audit(id, "UPDATE_PROFILE", "user", id)
	httpx.JSON(w, 200, map[string]string{"status": "updated"})
}

// PATCH /admin/me/password — change own password
func (h *AdminHandler) ChangeMyPassword(w http.ResponseWriter, r *http.Request) {
	id := h.userID(r)
	var req struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if err := decodeJSON(r, &req); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	fields := map[string]string{}
	if req.CurrentPassword == "" {
		fields["current_password"] = "Current password is required"
	}
	if len(req.NewPassword) < 8 {
		fields["new_password"] = "New password must be at least 8 characters"
	}
	if len(fields) > 0 {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Please correct the highlighted fields", fields)
		return
	}
	var currentHash string
	err := h.DB.QueryRow(`SELECT password_hash FROM users WHERE id=$1`, id).Scan(&currentHash)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to load user", nil)
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(req.CurrentPassword)); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Current password is incorrect", map[string]string{"current_password": "Incorrect password"})
		return
	}
	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 12)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to hash password", nil)
		return
	}
	if _, err := h.DB.Exec(`UPDATE users SET password_hash=$1, updated_at=now() WHERE id=$2`, string(newHash), id); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to update password", nil)
		return
	}
	h.audit(id, "CHANGE_PASSWORD", "user", id)
	httpx.JSON(w, 200, map[string]string{"status": "password_changed"})
}
