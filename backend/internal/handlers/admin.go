package handlers

import (
	"context"
	"encoding/json"
	"fmt"
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
	var totalTenants int
	var activeExperts int
	var pendingFilings int
	var completedFilings int
	var monthlyRevenue float64
	var avgHealth float64

	_ = db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM support_tickets WHERE status != 'RESOLVED'").Scan(&openTickets)
	_ = db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM chat_sessions WHERE status = 'ACTIVE'").Scan(&activeChats)
	_ = db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM tenants").Scan(&totalTenants)
	_ = db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM professional_profiles WHERE verification_status = 'VERIFIED'").Scan(&activeExperts)
	_ = db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM tenant_obligations WHERE status = 'PENDING'").Scan(&pendingFilings)
	_ = db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM tenant_obligations WHERE status = 'FILED'").Scan(&completedFilings)
	_ = db.Pool.QueryRow(ctx, "SELECT COALESCE(SUM(amount_ngn), 0) FROM invoices WHERE status IN ('SETTLED', 'DISBURSED')").Scan(&monthlyRevenue)
	_ = db.Pool.QueryRow(ctx, "SELECT COALESCE(AVG(compliance_score), 85.0) FROM tenants").Scan(&avgHealth)

	metrics := models.AdminMetrics{
		TotalCompanies:       totalTenants,
		ActivePractitioners:  activeExperts,
		FilingsCompleted:     completedFilings,
		PendingFilings:       pendingFilings,
		MonthlyRevenueNGN:    monthlyRevenue,
		OpenSupportTickets:   openTickets,
		ActiveChatSessions:   activeChats,
		ComplianceHealthRate: avgHealth,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

type AdminFilingItem struct {
	ID        string `json:"id"`
	Company   string `json:"company"`
	RC        string `json:"rc"`
	Filing    string `json:"filing"`
	Authority string `json:"authority"`
	Status    string `json:"status"`
	Officer   string `json:"officer"`
	Time      string `json:"time"`
}

func ListAdminFilings(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := `
		SELECT tob.id,
		       COALESCE(o.legal_name, t.workspace_name) as company_name,
		       COALESCE(o.rc_number, 'RC-PENDING') as rc_number,
		       tob.title as filing_title,
		       tob.authority,
		       tob.status,
		       COALESCE(u.full_name, 'Tunde Bakare, CAMS') as officer_name,
		       TO_CHAR(tob.updated_at, 'YYYY-MM-DD HH24:MI') as updated_time
		FROM tenant_obligations tob
		JOIN tenants t ON tob.tenant_id = t.id
		LEFT JOIN organisations o ON t.organisation_id = o.id
		LEFT JOIN users u ON tob.assigned_to = u.id
		ORDER BY tob.updated_at DESC
		LIMIT 20
	`

	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		http.Error(w, "Failed to query admin filings: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var filings []AdminFilingItem
	for rows.Next() {
		var f AdminFilingItem
		if err := rows.Scan(
			&f.ID, &f.Company, &f.RC, &f.Filing, &f.Authority, &f.Status, &f.Officer, &f.Time,
		); err == nil {
			filings = append(filings, f)
		}
	}

	if filings == nil {
		filings = []AdminFilingItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(filings)
}

func ListAdminUsers(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	rows, err := db.Pool.Query(ctx, `
		SELECT u.id, u.full_name, u.email, u.system_role,
		       COALESCE(o.legal_name, 'ComplianceHub Platform') as company,
		       COALESCE(o.rc_number, 'N/A') as rc_number,
		       COALESCE(o.org_type, u.system_role) as display_role,
		       COALESCE(t.plan_tier, 'Standard') as plan,
		       COALESCE(t.compliance_score, 95) as score,
		       TO_CHAR(u.created_at, 'YYYY-MM-DD') as created_at
		FROM users u
		LEFT JOIN tenant_members tm ON u.id = tm.user_id AND tm.is_primary = true
		LEFT JOIN tenants t ON tm.tenant_id = t.id
		LEFT JOIN organisations o ON t.organisation_id = o.id
		ORDER BY u.created_at DESC
		LIMIT 50
	`)

	var users []map[string]interface{}
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var id, name, email, sysRole, company, rc, displayRole, plan, createdAt string
			var score int
			if err := rows.Scan(&id, &name, &email, &sysRole, &company, &rc, &displayRole, &plan, &score, &createdAt); err == nil {
				roleLabel := displayRole
				if sysRole == "ADMIN" {
					roleLabel = "ADMIN"
				} else if sysRole == "STAFF" {
					roleLabel = "STAFF"
				}

				users = append(users, map[string]interface{}{
					"id":         id,
					"name":       name,
					"email":      email,
					"company":    company,
					"rc_number":  rc,
					"role":       roleLabel,
					"plan":       plan,
					"health":     fmt.Sprintf("%d%% Compliant", score),
					"created_at": createdAt,
					"status":     "Active",
				})
			}
		}
	}

	if users == nil {
		users = []map[string]interface{}{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func ListAdminInvoices(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	rows, err := db.Pool.Query(ctx, `
		SELECT id, invoice_number, client_name, amount_ngn, invoice_type, status,
		       COALESCE(payout_ref, 'PSTK_TR_PENDING'), TO_CHAR(due_date, 'YYYY-MM-DD'),
		       TO_CHAR(created_at, 'YYYY-MM-DD')
		FROM invoices
		ORDER BY created_at DESC
		LIMIT 50
	`)

	var invoices []map[string]interface{}
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var id, invNum, client, invType, status, payoutRef, dueDate, createdAt string
			var amount float64
			if err := rows.Scan(&id, &invNum, &client, &amount, &invType, &status, &payoutRef, &dueDate, &createdAt); err == nil {
				invoices = append(invoices, map[string]interface{}{
					"id":          invNum,
					"client":      client,
					"service":     invType + " Compliance Retainer",
					"amount_ngn":  amount,
					"fee_revenue": amount * 0.10,
					"expert":      "Bakare Compliance Consultancy",
					"status":      status,
					"date":        createdAt,
				})
			}
		}
	}

	if invoices == nil {
		invoices = []map[string]interface{}{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invoices)
}
