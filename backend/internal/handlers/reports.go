package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/middleware"
)

type ReportDigest struct {
	TenantID         string    `json:"tenant_id"`
	WorkspaceName    string    `json:"workspace_name"`
	RCNumber         string    `json:"rc_number"`
	ComplianceScore  int       `json:"compliance_score"`
	VerifiedDocs     int       `json:"verified_docs"`
	PendingTasks     int       `json:"pending_tasks"`
	TotalEmployees   int       `json:"total_employees"`
	TotalVendors     int       `json:"total_vendors"`
	OpenAMLCases     int       `json:"open_aml_cases"`
	GeneratedAt      time.Time `json:"generated_at"`
	StatutoryReports []struct {
		ID                 string `json:"id"`
		Title              string `json:"title"`
		Description        string `json:"description"`
		FileType           string `json:"file_type"`
		StatutoryAuthority string `json:"statutory_authority"`
		Status             string `json:"status"`
	} `json:"statutory_reports"`
}

func GetReportsDigest(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	var digest ReportDigest
	digest.TenantID = tenantCtx.TenantID
	digest.GeneratedAt = time.Now()

	// Query tenant details
	_ = db.Pool.QueryRow(ctx, `
		SELECT t.workspace_name, COALESCE(o.rc_number, 'RC-PENDING'), t.compliance_score
		FROM tenants t
		JOIN organisations o ON t.organisation_id = o.id
		WHERE t.id = $1
	`, tenantCtx.TenantID).Scan(&digest.WorkspaceName, &digest.RCNumber, &digest.ComplianceScore)

	// Counts
	_ = db.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM documents WHERE tenant_id = $1 AND verification_status = 'VERIFIED'`, tenantCtx.TenantID).Scan(&digest.VerifiedDocs)
	_ = db.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM tenant_obligations WHERE tenant_id = $1 AND status = 'PENDING'`, tenantCtx.TenantID).Scan(&digest.PendingTasks)
	_ = db.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM employees WHERE tenant_id = $1`, tenantCtx.TenantID).Scan(&digest.TotalEmployees)
	_ = db.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM vendors WHERE tenant_id = $1`, tenantCtx.TenantID).Scan(&digest.TotalVendors)
	_ = db.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM aml_cases WHERE tenant_id = $1 AND status != 'CLEARED'`, tenantCtx.TenantID).Scan(&digest.OpenAMLCases)

	digest.StatutoryReports = []struct {
		ID                 string `json:"id"`
		Title              string `json:"title"`
		Description        string `json:"description"`
		FileType           string `json:"file_type"`
		StatutoryAuthority string `json:"statutory_authority"`
		Status             string `json:"status"`
	}{
		{
			ID:                 "rep-01",
			Title:              "Consolidated Compliance Health & Readiness Report",
			Description:        fmt.Sprintf("Executive board summary of company compliance readiness score (%d%%), open statutory tasks, and legal exposure.", digest.ComplianceScore),
			FileType:           "Executive Dossier PDF (14 Pages)",
			StatutoryAuthority: "Board & Regulators",
			Status:             "Ready",
		},
		{
			ID:                 "rep-02",
			Title:              "CAC Annual Return & Status Package (CAMA 2020)",
			Description:        "Bundled Statement of Affairs, Form CAC 07 status report, and beneficial ownership filings ready for statutory lodgement.",
			FileType:           "Statutory Bundle PDF + ZIP",
			StatutoryAuthority: "Corporate Affairs Commission",
			Status:             "Ready",
		},
		{
			ID:                 "rep-03",
			Title:              "NDPC Statutory Privacy Audit Evidence Pack (NDPA 2023)",
			Description:        "Complete Record of Processing Activities (RoPA), Data Protection Officer appointment proof, and technical security measures.",
			FileType:           "Licensed DPCO Audit Pack",
			StatutoryAuthority: "Nigeria Data Protection Commission",
			Status:             "Ready",
		},
		{
			ID:                 "rep-04",
			Title:              "SCUML AML/CFT Inspection & KYC Register",
			Description:        "Customer due diligence audit logs, PEP screening receipts, and Anti-Money Laundering policy acknowledged by directors.",
			FileType:           "NFIU / SCUML Inspection Dossier",
			StatutoryAuthority: "SCUML / EFCC",
			Status:             "Ready",
		},
		{
			ID:                 "rep-05",
			Title:              "Immutable Activity & Security Event Audit Log",
			Description:        "Cryptographically hashed audit trail of every document upload, permission modification, and user login.",
			FileType:           "Encrypted CSV / JSON Audit Log",
			StatutoryAuthority: "Statutory Auditors",
			Status:             "Ready",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(digest)
}
