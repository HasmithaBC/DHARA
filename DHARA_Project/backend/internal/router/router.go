package router

import (
	"database/sql"
	"net/http"
	"os"
	"time"

	"github.com/dharact/backend/internal/config"
	"github.com/dharact/backend/internal/handlers"
	"github.com/dharact/backend/internal/middleware"
	"github.com/go-chi/chi/v5"
)

const (
	roleSales = "SALES_MANAGER"
	roleEdit  = "CONTENT_EDITOR"
	roleAdmin = "ADMINISTRATOR"
)

func New(db *sql.DB, cfg *config.Config) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logging)
	r.Use(middleware.SecurityHeaders)
	r.Use(middleware.CORS(cfg.AllowedOrigins))

	// Serves files written by AdminHandler.UploadMedia. The directory lives outside the
	// web root conceptually (it's not part of the frontend build); this route is the only
	// way its contents become reachable, and it only ever serves what was written through
	// the validated upload endpoint.
	os.MkdirAll(cfg.MediaUploadDir, 0o750)
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir(cfg.MediaUploadDir))))

	pub := handlers.NewPublicHandler(db, cfg)
	auth := handlers.NewAuthHandler(db, cfg)
	adm := handlers.NewAdminHandler(db, cfg)

	leadLimiter := middleware.NewIPRateLimiter(5, 10*time.Minute)
	readLimiter := middleware.NewIPRateLimiter(120, time.Minute)

	r.Route("/api/v1", func(r chi.Router) {
		// ---------- Public, read-only (§6.1) ----------
		r.Group(func(r chi.Router) {
			r.Use(readLimiter.Middleware)
			r.Get("/properties", pub.ListProperties)
			r.Get("/properties/{slug}", pub.GetProperty)
			r.Post("/properties/{id}/view", pub.IncrementView)
			r.Get("/properties/{id}/similar", pub.SimilarProperties)
			r.Get("/locations", pub.Locations)
			r.Get("/amenities", pub.Amenities)
			r.Get("/services", pub.ListServices)
			r.Get("/services/{slug}", pub.GetService)
			r.Get("/projects", pub.ListProjects)
			r.Get("/projects/{slug}", pub.GetProject)
			r.Get("/testimonials", pub.Testimonials)
			r.Get("/settings/public", pub.PublicSettings)
			r.Get("/documents/{id}/download", pub.DownloadDocument)
			r.Get("/newsletter/confirm", pub.NewsletterConfirm)
			r.Get("/newsletter/unsubscribe", pub.NewsletterUnsubscribe)
		})

		// ---------- Public, write (rate-limited per NFR-SEC-002 / §6.3) ----------
		r.Group(func(r chi.Router) {
			r.Use(leadLimiter.Middleware)
			r.Post("/leads", pub.CreateLead)
			r.Post("/documents/{id}/request", pub.RequestDocument)
			r.Post("/newsletter/subscribe", pub.NewsletterSubscribe)
		})

		// ---------- Auth ----------
		r.Post("/auth/login", auth.Login)
		r.Post("/auth/refresh", auth.Refresh)
		r.Post("/auth/logout", auth.Logout)
		r.Post("/auth/forgot-password", auth.ForgotPassword)
		r.Post("/auth/reset-password", auth.ResetPassword)

		// ---------- Admin (JWT + RBAC, §5.9) ----------
		r.Route("/admin", func(r chi.Router) {
			r.Use(middleware.RequireAuth(cfg.JWTSecret))

			// Sales Manager + Administrator: listings & leads
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole(roleSales, roleAdmin))
				r.Get("/properties", adm.ListAllProperties)
				r.Post("/properties", adm.CreateProperty)
				r.Get("/properties/{id}", adm.GetPropertyAdmin)
				r.Patch("/properties/{id}", adm.UpdateProperty)
				r.Delete("/properties/{id}", adm.ArchiveProperty)
				r.Post("/properties/{id}/status", adm.TransitionStatus)
				r.Post("/properties/{id}/duplicate", adm.DuplicateProperty)
				r.Post("/properties/bulk", adm.BulkAction)
				r.Post("/properties/{id}/images", adm.AddImage)
				r.Post("/properties/{id}/media-upload", adm.UploadMedia)
				r.Delete("/properties/{id}/images/{imageId}", adm.DeleteImage)
				r.Patch("/properties/{id}/images/order", adm.ReorderImages)
				r.Post("/properties/{id}/documents", adm.AddDocument)
				r.Delete("/properties/{id}/documents/{docId}", adm.DeleteDocument)

				r.Get("/leads", adm.ListLeads)
				r.Get("/leads/export", adm.ExportLeads)
				r.Get("/leads/{id}", adm.GetLead)
				r.Patch("/leads/{id}", adm.UpdateLead)
				r.Post("/leads/{id}/erase", adm.EraseLead)

				r.Get("/dashboard", adm.Dashboard)
			})

			// Content Editor + Administrator: corporate content
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole(roleEdit, roleAdmin))
				r.Get("/services", adm.ListServicesAdmin)
				r.Post("/services", adm.CreateService)
				r.Patch("/services/{id}", adm.UpdateService)
				r.Delete("/services/{id}", adm.DeleteService)
				r.Get("/projects", adm.ListProjectsAdmin)
				r.Post("/projects", adm.CreateProject)
				r.Patch("/projects/{id}", adm.UpdateProject)
				r.Delete("/projects/{id}", adm.DeleteProject)
				r.Get("/testimonials", adm.ListTestimonialsAdmin)
				r.Post("/testimonials", adm.CreateTestimonial)
				r.Patch("/testimonials/{id}", adm.UpdateTestimonial)
				r.Delete("/testimonials/{id}", adm.DeleteTestimonial)
			})

			// Administrator only: settings, users, audit log
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole(roleAdmin))
				r.Get("/settings", adm.GetSettings)
				r.Patch("/settings", adm.UpdateSettings)
				r.Get("/users", adm.ListUsers)
				r.Post("/users", adm.CreateUser)
				r.Delete("/users/{id}", adm.DeactivateUser)
				r.Get("/audit-log", adm.AuditLog)
			})
		})
	})

	return r
}
