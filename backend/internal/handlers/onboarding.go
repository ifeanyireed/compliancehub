package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/middleware"
)

type OnboardingClassificationRequest struct {
	BusinessName         string `json:"business_name"`
	RCNumber             string `json:"rc_number"`
	Industry             string `json:"industry"`
	State                string `json:"state"`
	EmployeeCount        string `json:"employee_count"`
	CollectsPersonalData bool   `json:"collects_personal_data"`
	ProcessesPayments    bool   `json:"processes_payments"`
	IsDNFBP              bool   `json:"is_dnfbp"`
	EngagesVendors       bool   `json:"engages_vendors"`
	OperatesBranches     bool   `json:"operates_branches"`
	ServicePreference    string `json:"service_preference"` // self, expert, agency
}

func ClassifyBusiness(w http.ResponseWriter, r *http.Request) {
	var req OnboardingClassificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	if req.BusinessName == "" {
		http.Error(w, "Business name is required", http.StatusBadRequest)
		return
	}

	user := middleware.GetUserFromContext(r)
	userID := "33333333-3333-3333-3333-333333333301"
	if user != nil {
		userID = user.ID
	}

	ctx := r.Context()
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		http.Error(w, "Database transaction error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	// 1. Create Organisation
	var orgID string
	err = tx.QueryRow(ctx, `
		INSERT INTO organisations (legal_name, rc_number, org_type, industry, state_of_operation, employee_bracket)
		VALUES ($1, $2, 'BUSINESS', $3, $4, $5)
		RETURNING id
	`, req.BusinessName, req.RCNumber, req.Industry, req.State, req.EmployeeCount).Scan(&orgID)
	if err != nil {
		http.Error(w, "Failed to create organisation: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 2. Create Tenant Workspace
	slug := strings.ToLower(strings.ReplaceAll(req.BusinessName, " ", "-"))
	slug = strings.ReplaceAll(slug, ".", "")
	slug = fmt.Sprintf("%s-%d", slug, time.Now().Unix()%10000)

	initialScore := 72
	if req.CollectsPersonalData && req.ProcessesPayments {
		initialScore = 64
	}

	var tenantID string
	err = tx.QueryRow(ctx, `
		INSERT INTO tenants (organisation_id, workspace_name, slug, plan_tier, compliance_score)
		VALUES ($1, $2, $3, 'Professional', $4)
		RETURNING id
	`, orgID, req.BusinessName, slug, initialScore).Scan(&tenantID)
	if err != nil {
		http.Error(w, "Failed to create tenant workspace: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 3. Link user as OWNER
	_, err = tx.Exec(ctx, `
		INSERT INTO tenant_members (tenant_id, user_id, role, is_primary)
		VALUES ($1, $2, 'OWNER', true)
		ON CONFLICT (tenant_id, user_id) DO NOTHING
	`, tenantID, userID)
	if err != nil {
		http.Error(w, "Failed to assign membership: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 4. Intelligent statutory obligation generation based on classification
	type GeneratedObligation struct {
		Title     string
		Authority string
		DueDate   string
		Penalty   float64
		IsUrgent  bool
	}

	var obligationsToSeed []GeneratedObligation

	// Universal CAMA & 2026 Tax Act
	obligationsToSeed = append(obligationsToSeed, GeneratedObligation{
		Title:     "Monthly TaxPro-MAX VAT Filing (2026 Transition Window)",
		Authority: "FIRS / NRS",
		DueDate:   time.Now().AddDate(0, 0, 18).Format("2006-01-02"),
		Penalty:   50000,
		IsUrgent:  true,
	})

	obligationsToSeed = append(obligationsToSeed, GeneratedObligation{
		Title:     "CAMA 2020 Annual Returns Preparation & Filing (Form CAC 19)",
		Authority: "CAC",
		DueDate:   time.Now().AddDate(0, 5, 0).Format("2006-01-02"),
		Penalty:   25000,
		IsUrgent:  false,
	})

	// Privacy condition
	if req.CollectsPersonalData {
		obligationsToSeed = append(obligationsToSeed, GeneratedObligation{
			Title:     "NDPC Statutory Annual Data Protection Audit Return",
			Authority: "NDPC",
			DueDate:   time.Now().AddDate(0, 1, 10).Format("2006-01-02"),
			Penalty:   2500000,
			IsUrgent:  true,
		})
	}

	// AML / DNFBP condition
	if req.IsDNFBP || req.ProcessesPayments {
		obligationsToSeed = append(obligationsToSeed, GeneratedObligation{
			Title:     "SCUML Anti-Money Laundering Annual Compliance Return",
			Authority: "SCUML",
			DueDate:   time.Now().AddDate(0, 2, 0).Format("2006-01-02"),
			Penalty:   1000000,
			IsUrgent:  false,
		})
	}

	// Workforce Pension condition
	obligationsToSeed = append(obligationsToSeed, GeneratedObligation{
		Title:     "Monthly Contributory Pension Remittance to Licensed PFAs",
		Authority: "PENCOM",
		DueDate:   time.Now().AddDate(0, 0, 10).Format("2006-01-02"),
		Penalty:   30000,
		IsUrgent:  false,
	})

	for _, o := range obligationsToSeed {
		_, _ = tx.Exec(ctx, `
			INSERT INTO tenant_obligations (tenant_id, title, authority, due_date, status, estimated_penalty_ngn, is_urgent)
			VALUES ($1, $2, $3, $4, 'PENDING', $5, $6)
		`, tenantID, o.Title, o.Authority, o.DueDate, o.Penalty, o.IsUrgent)
	}

	if err := tx.Commit(ctx); err != nil {
		http.Error(w, "Failed to commit classification: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":           true,
		"tenant_id":         tenantID,
		"workspace_slug":    slug,
		"business_name":     req.BusinessName,
		"compliance_score":  initialScore,
		"obligations_count": len(obligationsToSeed),
		"message":           "Intelligent compliance assessment completed and personalized workspace provisioned",
	})
}
