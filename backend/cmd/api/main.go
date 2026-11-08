package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/handlers"
	"compliancehub-backend/internal/middleware"
	"compliancehub-backend/internal/services"

	"github.com/joho/godotenv"
)

// withCORS adds CORS headers and handles preflight OPTIONS requests
func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Tenant-ID, X-Demo-Role")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func main() {
	// Load .env files
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatalf("DATABASE_URL environment variable is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🔌 Initializing Neon Database connection...")
	pool, err := db.InitDB(databaseURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to Neon PostgreSQL: %v", err)
	}
	defer pool.Close()

	log.Printf("☁️ Initializing Cloudinary Evidence Vault Service...")
	if _, err := services.InitCloudinary(); err != nil {
		log.Printf("⚠️ Warning: Cloudinary initialization notice: %v", err)
	} else {
		log.Printf("✅ Cloudinary evidence vault initialized with cloud 'yugcjpau'")
	}

	mux := http.NewServeMux()

	// Health endpoint
	mux.HandleFunc("/api/health", withCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":   "ok",
			"database": "Neon Lakebase Postgres (connected)",
			"service":  "ComplianceHub.ng Core API",
			"storage":  "Cloudinary Evidence Vault (configured)",
			"region":   "aws-us-east-2",
		})
	}))

	// ==========================================
	// Auth & Multi-Tenant Routes
	// ==========================================
	mux.HandleFunc("/api/v1/auth/register", withCORS(middleware.RateLimitAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.Register(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/v1/auth/login", withCORS(middleware.RateLimitAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.Login(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/v1/auth/forgot-password", withCORS(middleware.RateLimitAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.ForgotPassword(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/v1/auth/reset-password", withCORS(middleware.RateLimitAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.ResetPassword(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/v1/auth/me", withCORS(middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GetMe(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/v1/tenants/current", withCORS(middleware.RequireTenant(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GetCurrentTenant(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	// ==========================================
	// Onboarding & Classification
	// ==========================================
	mux.HandleFunc("/api/v1/onboarding/classify", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.ClassifyBusiness(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	// ==========================================
	// HubCalendar: Statutory Deadlines & Reminders
	// ==========================================
	mux.HandleFunc("/api/v1/calendar/obligations", withCORS(middleware.RequireTenant(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.ListTenantObligations(w, r)
		case http.MethodPost:
			handlers.CreateCustomObligation(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/v1/calendar/obligations/", withCORS(middleware.RequireTenant(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/complete") && r.Method == http.MethodPost {
			handlers.CompleteObligation(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})))

	// ==========================================
	// HubDocs: Cloudinary Evidence Vault
	// ==========================================
	mux.HandleFunc("/api/v1/documents/upload-signature", withCORS(middleware.RequireTenant(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.GenerateUploadSignature(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/v1/documents", withCORS(middleware.RequireTenant(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.ListDocuments(w, r)
		case http.MethodPost:
			handlers.RegisterDocument(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/v1/documents/", withCORS(middleware.RequireTenant(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			handlers.DeleteDocument(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	// ==========================================
	// HubExperts & HubAgents: Practice Suite
	// ==========================================
	mux.HandleFunc("/api/v1/professionals", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.ListPractitioners(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/v1/practice/clients", withCORS(middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.ListClientWorkspaces(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/v1/practice/tasks", withCORS(middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.ListPracticeTasks(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/v1/engagements", withCORS(middleware.RequireTenant(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.ListTenantEngagements(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/v1/engagements/", withCORS(middleware.RequireTenant(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/revoke") && r.Method == http.MethodPost {
			handlers.RevokeEngagement(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})))

	// ==========================================
	// HubPeople & HubVendors: Workforce
	// ==========================================
	mux.HandleFunc("/api/v1/people/employees", withCORS(middleware.RequireTenant(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.ListEmployees(w, r)
		case http.MethodPost:
			handlers.CreateEmployee(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/v1/vendors", withCORS(middleware.RequireTenant(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.ListVendors(w, r)
		case http.MethodPost:
			handlers.CreateVendor(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	// ==========================================
	// Specialist: HubAML & HubPrivacy
	// ==========================================
	mux.HandleFunc("/api/v1/aml/cases", withCORS(middleware.RequireTenant(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.ListAMLCases(w, r)
		case http.MethodPost:
			handlers.CreateAMLCase(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/v1/privacy/ropa", withCORS(middleware.RequireTenant(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.ListPrivacyActivities(w, r)
		case http.MethodPost:
			handlers.CreatePrivacyActivity(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	// ==========================================
	// Regulatory Intelligence Blog & CMS Routes
	// ==========================================
	mux.HandleFunc("/api/blog/categories/", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			middleware.RequireSystemRole("ADMIN", "STAFF")(handlers.DeleteCategory)(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/blog/categories", withCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.ListCategories(w, r)
		case http.MethodPost:
			middleware.RequireSystemRole("ADMIN", "STAFF")(handlers.CreateCategory)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/blog/tags/", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			middleware.RequireSystemRole("ADMIN", "STAFF")(handlers.DeleteTag)(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/blog/tags", withCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.ListTags(w, r)
		case http.MethodPost:
			middleware.RequireSystemRole("ADMIN", "STAFF")(handlers.CreateTag)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/blog/comments/", withCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPatch, http.MethodPut:
			middleware.RequireSystemRole("ADMIN", "STAFF")(handlers.UpdateCommentStatus)(w, r)
		case http.MethodDelete:
			middleware.RequireSystemRole("ADMIN", "STAFF")(handlers.DeleteComment)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/blog/comments", withCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.ListComments(w, r)
		case http.MethodPost:
			handlers.CreateComment(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/blog/subscribe", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.SubscribeNewsletter(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/blog/subscribers/", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			middleware.RequireSystemRole("ADMIN", "STAFF")(handlers.DeleteSubscriber)(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/blog/subscribers", withCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			middleware.RequireSystemRole("ADMIN", "STAFF")(handlers.ListSubscribers)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/blog/", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/view") {
			if r.Method == http.MethodPost {
				handlers.IncrementBlogPostView(w, r)
				return
			}
		}

		switch r.Method {
		case http.MethodGet:
			handlers.GetBlogPostBySlug(w, r)
		case http.MethodPut, http.MethodPatch:
			middleware.RequireSystemRole("ADMIN", "STAFF")(handlers.UpdateBlogPost)(w, r)
		case http.MethodDelete:
			middleware.RequireSystemRole("ADMIN", "STAFF")(handlers.DeleteBlogPost)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/blog", withCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.ListBlogPosts(w, r)
		case http.MethodPost:
			middleware.RequireSystemRole("ADMIN", "STAFF")(handlers.CreateBlogPost)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/support/kb", withCORS(handlers.ListKnowledgeArticles))

	mux.HandleFunc("/api/support/tickets/", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/reply") {
			middleware.RequireAuth(handlers.ReplyTicket)(w, r)
			return
		}
		switch r.Method {
		case http.MethodGet:
			middleware.RequireAuth(handlers.GetTicket)(w, r)
		case http.MethodPatch, http.MethodPut:
			middleware.RequireSystemRole("STAFF", "ADMIN")(handlers.UpdateTicketStatus)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/support/tickets", withCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			middleware.RequireAuth(handlers.ListTickets)(w, r)
		case http.MethodPost:
			handlers.CreateTicket(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/chat/sessions", withCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			middleware.RequireSystemRole("STAFF", "ADMIN")(handlers.ListChatSessions)(w, r)
		case http.MethodPost:
			handlers.CreateChatSession(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	mux.HandleFunc("/api/chat/messages", withCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetChatMessages(w, r)
		case http.MethodPost:
			handlers.SendMessage(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	// Admin Cockpit: strictly requires platform ADMIN system role
	mux.HandleFunc("/api/admin/metrics", withCORS(middleware.RequireSystemRole("ADMIN")(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GetAdminMetrics(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/admin/users", withCORS(middleware.RequireSystemRole("ADMIN")(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.ListAdminUsers(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.HandleFunc("/api/admin/invoices", withCORS(middleware.RequireSystemRole("ADMIN")(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.ListAdminInvoices(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	addr := fmt.Sprintf(":%s", port)
	log.Printf("🚀 ComplianceHub Go API server listening on http://localhost%s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
