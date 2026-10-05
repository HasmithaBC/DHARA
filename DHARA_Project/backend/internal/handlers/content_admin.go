package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/dharact/backend/internal/httpx"
	"github.com/dharact/backend/internal/util"
	"github.com/go-chi/chi/v5"
)

// ---------- Services ----------

// GET /api/v1/admin/services — all services including unpublished drafts (FR-ADM-009).
func (h *AdminHandler) ListServicesAdmin(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`SELECT id, slug, title, COALESCE(summary,''), COALESCE(body,''), COALESCE(icon,''), COALESCE(hero_image,''), sort_order, is_published FROM services ORDER BY sort_order, title`)
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
		Body        string `json:"body"`
		Icon        string `json:"icon"`
		HeroImage   string `json:"hero_image"`
		SortOrder   int    `json:"sort_order"`
		IsPublished bool   `json:"is_published"`
	}
	out := []row{}
	for rows.Next() {
		var s row
		rows.Scan(&s.ID, &s.Slug, &s.Title, &s.Summary, &s.Body, &s.Icon, &s.HeroImage, &s.SortOrder, &s.IsPublished)
		out = append(out, s)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate services", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

type serviceInput struct {
	Title       string `json:"title"`
	Slug        string `json:"slug"`
	Summary     string `json:"summary"`
	Body        string `json:"body"`
	Icon        string `json:"icon"`
	HeroImage   string `json:"hero_image"`
	SortOrder   int    `json:"sort_order"`
	IsPublished bool   `json:"is_published"`
}

func (h *AdminHandler) CreateService(w http.ResponseWriter, r *http.Request) {
	var in serviceInput
	if err := decodeJSON(r, &in); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	if strings.TrimSpace(in.Title) == "" {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Service title is required", nil)
		return
	}
	slug := in.Slug
	if slug == "" {
		slug = util.Slugify(in.Title)
	}
	var id string
	err := h.DB.QueryRow(`INSERT INTO services (slug, title, summary, body, icon, hero_image, sort_order, is_published)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
		slug, in.Title, in.Summary, in.Body, in.Icon, in.HeroImage, in.SortOrder, in.IsPublished).Scan(&id)
	if err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Failed to create service (slug may already exist)", nil)
		return
	}
	h.audit(h.userID(r), "CREATE", "service", id)
	httpx.JSON(w, 201, map[string]string{"id": id, "slug": slug})
}

func (h *AdminHandler) UpdateService(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in serviceInput
	if err := decodeJSON(r, &in); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	if strings.TrimSpace(in.Title) == "" {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Service title is required", nil)
		return
	}
	_, err := h.DB.Exec(`UPDATE services SET title=$1, summary=$2, body=$3, icon=$4, hero_image=$5,
		sort_order=$6, is_published=$7, slug=COALESCE(NULLIF($9,''), slug), updated_at=now() WHERE id=$8`,
		in.Title, in.Summary, in.Body, in.Icon, in.HeroImage, in.SortOrder, in.IsPublished, id, util.Slugify(in.Slug))
	if err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Failed to update service (slug may already exist)", nil)
		return
	}
	h.audit(h.userID(r), "UPDATE", "service", id)
	httpx.JSON(w, 200, map[string]string{"status": "updated"})
}

func (h *AdminHandler) DeleteService(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	res, err := h.DB.Exec(`DELETE FROM services WHERE id=$1`, id)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to delete service", nil)
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		httpx.Error(w, 404, "NOT_FOUND", "Service not found", nil)
		return
	}
	h.audit(h.userID(r), "DELETE", "service", id)
	httpx.JSON(w, 200, map[string]string{"status": "deleted"})
}

// ---------- Projects ----------

// GET /api/v1/admin/projects — all projects including unpublished drafts.
func (h *AdminHandler) ListProjectsAdmin(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`SELECT id, slug, title, COALESCE(sector,''), COALESCE(location,''), COALESCE(year_completed,0), cover_image, gallery, is_featured, is_published FROM projects ORDER BY year_completed DESC`)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to list projects", nil)
		return
	}
	defer rows.Close()
	type row struct {
		ID            string          `json:"id"`
		Slug          string          `json:"slug"`
		Title         string          `json:"title"`
		Sector        string          `json:"sector"`
		Location      string          `json:"location"`
		YearCompleted int             `json:"year_completed"`
		CoverImage    string          `json:"cover_image"`
		Gallery       json.RawMessage `json:"gallery"`
		IsFeatured    bool            `json:"is_featured"`
		IsPublished   bool            `json:"is_published"`
	}
	out := []row{}
	for rows.Next() {
		var p row
		var galleryRaw []byte
		rows.Scan(&p.ID, &p.Slug, &p.Title, &p.Sector, &p.Location, &p.YearCompleted, &p.CoverImage, &galleryRaw, &p.IsFeatured, &p.IsPublished)
		if len(galleryRaw) > 0 {
			p.Gallery = galleryRaw
		} else {
			p.Gallery = json.RawMessage("[]")
		}
		out = append(out, p)
	}
	if err := rows.Err(); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to iterate projects", nil)
		return
	}
	httpx.JSON(w, 200, out)
}

type projectInput struct {
	Title         string          `json:"title"`
	Slug          string          `json:"slug"`
	ClientName    string          `json:"client_name"`
	Sector        string          `json:"sector"`
	Location      string          `json:"location"`
	YearCompleted int             `json:"year_completed"`
	Scope         string          `json:"scope"`
	Challenge     string          `json:"challenge"`
	Solution      string          `json:"solution"`
	Body          string          `json:"body"`
	CoverImage    string          `json:"cover_image"`
	Gallery       json.RawMessage `json:"gallery"`
	IsFeatured    bool            `json:"is_featured"`
	IsPublished   bool            `json:"is_published"`
}

func (h *AdminHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	var in projectInput
	if err := decodeJSON(r, &in); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	if strings.TrimSpace(in.Title) == "" {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Project title is required", nil)
		return
	}
	slug := in.Slug
	if slug == "" {
		slug = util.Slugify(in.Title)
	}
	galleryJSON := "[]"
	if len(in.Gallery) > 0 && json.Valid(in.Gallery) {
		galleryJSON = string(in.Gallery)
	}
	var id string
	err := h.DB.QueryRow(`INSERT INTO projects (slug, title, client_name, sector, location, year_completed,
		scope, challenge, solution, body, cover_image, gallery, is_featured, is_published)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
		slug, in.Title, in.ClientName, in.Sector, in.Location, in.YearCompleted,
		in.Scope, in.Challenge, in.Solution, in.Body, in.CoverImage, galleryJSON, in.IsFeatured, in.IsPublished).Scan(&id)
	if err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Failed to create project (slug may already exist)", nil)
		return
	}
	h.audit(h.userID(r), "CREATE", "project", id)
	httpx.JSON(w, 201, map[string]string{"id": id, "slug": slug})
}

func (h *AdminHandler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in projectInput
	if err := decodeJSON(r, &in); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	if strings.TrimSpace(in.Title) == "" {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Project title is required", nil)
		return
	}
	galleryJSON := "[]"
	if len(in.Gallery) > 0 && json.Valid(in.Gallery) {
		galleryJSON = string(in.Gallery)
	}
	_, err := h.DB.Exec(`UPDATE projects SET title=$1, client_name=$2, sector=$3, location=$4, year_completed=$5,
		scope=$6, challenge=$7, solution=$8, body=$9, cover_image=$10, gallery=$11, is_featured=$12, is_published=$13,
		slug=COALESCE(NULLIF($15,''), slug), updated_at=now()
		WHERE id=$14`,
		in.Title, in.ClientName, in.Sector, in.Location, in.YearCompleted,
		in.Scope, in.Challenge, in.Solution, in.Body, in.CoverImage, galleryJSON, in.IsFeatured, in.IsPublished, id, util.Slugify(in.Slug))
	if err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Failed to update project (slug may already exist)", nil)
		return
	}
	h.audit(h.userID(r), "UPDATE", "project", id)
	httpx.JSON(w, 200, map[string]string{"status": "updated"})
}

func (h *AdminHandler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	res, err := h.DB.Exec(`DELETE FROM projects WHERE id=$1`, id)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to delete project", nil)
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		httpx.Error(w, 404, "NOT_FOUND", "Project not found", nil)
		return
	}
	h.audit(h.userID(r), "DELETE", "project", id)
	httpx.JSON(w, 200, map[string]string{"status": "deleted"})
}

// ---------- Testimonials ----------

// GET /api/v1/admin/testimonials — all testimonials including unpublished drafts.
func (h *AdminHandler) ListTestimonialsAdmin(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`SELECT id, author_name, COALESCE(author_location,''), quote, COALESCE(rating,5), is_published, sort_order FROM testimonials ORDER BY sort_order, created_at DESC`)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to list testimonials", nil)
		return
	}
	defer rows.Close()
	type row struct {
		ID, AuthorName, AuthorLocation, Quote string
		Rating, SortOrder                     int
		IsPublished                           bool
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

type testimonialInput struct {
	AuthorName     string `json:"author_name"`
	AuthorLocation string `json:"author_location"`
	Quote          string `json:"quote"`
	Rating         int    `json:"rating"`
	IsPublished    bool   `json:"is_published"`
	SortOrder      int    `json:"sort_order"`
}

func (h *AdminHandler) CreateTestimonial(w http.ResponseWriter, r *http.Request) {
	var in testimonialInput
	if err := decodeJSON(r, &in); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	if strings.TrimSpace(in.AuthorName) == "" || strings.TrimSpace(in.Quote) == "" {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Author name and quote are required", nil)
		return
	}
	if in.Rating < 1 || in.Rating > 5 {
		in.Rating = 5
	}
	var id string
	if err := h.DB.QueryRow(`INSERT INTO testimonials (author_name, author_location, quote, rating, is_published, sort_order)
		VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
		in.AuthorName, in.AuthorLocation, in.Quote, in.Rating, in.IsPublished, in.SortOrder).Scan(&id); err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to create testimonial", nil)
		return
	}
	h.audit(h.userID(r), "CREATE", "testimonial", id)
	httpx.JSON(w, 201, map[string]string{"id": id})
}

func (h *AdminHandler) UpdateTestimonial(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in testimonialInput
	if err := decodeJSON(r, &in); err != nil {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Invalid request body", nil)
		return
	}
	if strings.TrimSpace(in.AuthorName) == "" || strings.TrimSpace(in.Quote) == "" {
		httpx.Error(w, 400, "VALIDATION_ERROR", "Author name and quote are required", nil)
		return
	}
	if in.Rating < 1 || in.Rating > 5 {
		in.Rating = 5
	}
	_, err := h.DB.Exec(`UPDATE testimonials SET author_name=$1, author_location=$2, quote=$3, rating=$4,
		is_published=$5, sort_order=$6 WHERE id=$7`,
		in.AuthorName, in.AuthorLocation, in.Quote, in.Rating, in.IsPublished, in.SortOrder, id)
	if err != nil {
		httpx.Error(w, 500, "SERVER_ERROR", "Failed to update testimonial", nil)
		return
	}
	h.audit(h.userID(r), "UPDATE", "testimonial", id)
	httpx.JSON(w, 200, map[string]string{"status": "updated"})
}

func (h *AdminHandler) DeleteTestimonial(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.DB.Exec(`DELETE FROM testimonials WHERE id=$1`, id)
	h.audit(h.userID(r), "DELETE", "testimonial", id)
	httpx.JSON(w, 200, map[string]string{"status": "deleted"})
}
