package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/models"
)

func GetAdminMetrics(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var openTickets int
	var activeChats int
	var blogPosts int

	db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM support_tickets WHERE status != 'RESOLVED'").Scan(&openTickets)
	db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM chat_sessions WHERE status = 'ACTIVE'").Scan(&activeChats)
	db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM blog_posts").Scan(&blogPosts)

	metrics := models.AdminMetrics{
		TotalCompanies:       1420,
		ActivePractitioners:  385,
		FilingsCompleted:     8912,
		PendingFilings:       142,
		MonthlyRevenueNGN:    24850000.00, // ₦24.85M monthly compliance volume
		OpenSupportTickets:   openTickets,
		ActiveChatSessions:   activeChats,
		ComplianceHealthRate: 98.4,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

func ListAdminUsers(w http.ResponseWriter, r *http.Request) {
	users := []map[string]interface{}{
		{
			"id":         "usr-biz-01",
			"name":       "Adaeze Nwosu",
			"email":      "adaeze@paywave.ng",
			"company":    "PayWave Technologies Ltd",
			"rc_number":  "RC-1894231",
			"role":       "BUSINESS",
			"plan":       "Professional (₦75,000/mo)",
			"health":     "96% Compliant",
			"created_at": "2025-08-12",
			"status":     "Active",
		},
		{
			"id":         "usr-exp-01",
			"name":       "Tunde Bakare, CAMS",
			"email":      "tunde@bakarecompliance.com",
			"company":    "Bakare Compliance Consultancy",
			"rc_number":  "BN-2894120",
			"role":       "EXPERT",
			"plan":       "Practice Plus (₦120,000/mo)",
			"health":     "100% Verified Accredited",
			"created_at": "2025-06-01",
			"status":     "Active",
		},
		{
			"id":         "usr-agn-01",
			"name":       "Chiamaka Eze",
			"email":      "chiamaka@apexcompliance.ng",
			"company":    "Apex Compliance Advisory Partners Ltd",
			"rc_number":  "RC-1678239",
			"role":       "AGENCY",
			"plan":       "Agency Enterprise (₦250,000/mo)",
			"health":     "99% Verified Partner",
			"created_at": "2025-04-18",
			"status":     "Active",
		},
		{
			"id":         "usr-staff-01",
			"name":       "Babajide Sanwo",
			"email":      "bsanwo@compliancehub.ng",
			"company":    "ComplianceHub Operations",
			"role":       "STAFF",
			"plan":       "Support Specialist",
			"health":     "Tier 2 Resolution Desk",
			"created_at": "2025-02-10",
			"status":     "Active",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func ListAdminInvoices(w http.ResponseWriter, r *http.Request) {
	invoices := []map[string]interface{}{
		{
			"id":          "INV-2026-9041",
			"client":      "PayWave Technologies Ltd",
			"service":     "Annual CAC Return & TaxPro-MAX Filing",
			"amount_ngn":  250000,
			"fee_revenue": 25000,
			"expert":      "Bakare Compliance Consultancy",
			"status":      "PAID",
			"date":        "2026-02-01",
		},
		{
			"id":          "INV-2026-9042",
			"client":      "Horizon Cloud Solutions Ltd",
			"service":     "NDPA Statutory Data Protection Audit",
			"amount_ngn":  650000,
			"fee_revenue": 65000,
			"expert":      "Apex Compliance Advisory Partners Ltd",
			"status":      "PAID",
			"date":        "2026-02-01",
		},
		{
			"id":          "INV-2026-9043",
			"client":      "Kobo Logistics Nigeria Ltd",
			"service":     "SCUML DNFBP Anti-Money Laundering Review",
			"amount_ngn":  350000,
			"fee_revenue": 35000,
			"expert":      "Bakare Compliance Consultancy",
			"status":      "ESCROW_HELD",
			"date":        "2026-01-29",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invoices)
}
