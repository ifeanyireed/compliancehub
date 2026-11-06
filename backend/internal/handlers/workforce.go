package handlers

import (
	"encoding/json"
	"net/http"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/middleware"
	"compliancehub-backend/internal/models"
)

func ListEmployees(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	rows, err := db.Pool.Query(r.Context(), `
		SELECT id, tenant_id, full_name, email, role_title, department,
		       TO_CHAR(employment_date, 'YYYY-MM-DD'), pension_pfa, pension_rsa_pin,
		       ndpa_training_completed, aml_training_completed, compliance_clearance_status, created_at
		FROM employees
		WHERE tenant_id = $1
		ORDER BY created_at DESC
	`, tenantCtx.TenantID)

	if err != nil {
		http.Error(w, "Failed to query employees: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var employees []models.Employee
	for rows.Next() {
		var e models.Employee
		var empDate *string
		if err := rows.Scan(
			&e.ID, &e.TenantID, &e.FullName, &e.Email, &e.RoleTitle, &e.Department,
			&empDate, &e.PensionPFA, &e.PensionRSAPIN,
			&e.NDPATrainingCompleted, &e.AMLTrainingCompleted, &e.ComplianceClearanceStatus, &e.CreatedAt,
		); err == nil {
			e.EmploymentDate = empDate
			employees = append(employees, e)
		}
	}

	if employees == nil {
		employees = []models.Employee{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(employees)
}

func CreateEmployee(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	var req models.Employee
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	if req.FullName == "" || req.Email == "" || req.RoleTitle == "" {
		http.Error(w, "Full name, email, and role title are required", http.StatusBadRequest)
		return
	}

	var newID string
	err := db.Pool.QueryRow(r.Context(), `
		INSERT INTO employees (
			tenant_id, full_name, email, role_title, department,
			pension_pfa, pension_rsa_pin, ndpa_training_completed, aml_training_completed,
			compliance_clearance_status
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'VERIFIED')
		RETURNING id
	`, tenantCtx.TenantID, req.FullName, req.Email, req.RoleTitle, req.Department,
		req.PensionPFA, req.PensionRSAPIN, req.NDPATrainingCompleted, req.AMLTrainingCompleted).Scan(&newID)

	if err != nil {
		http.Error(w, "Failed to create employee: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      newID,
		"message": "Employee compliance record established",
	})
}

func ListVendors(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	rows, err := db.Pool.Query(r.Context(), `
		SELECT id, tenant_id, company_name, rc_number, tin, vendor_category,
		       risk_level, tcc_verified, dpa_signed, TO_CHAR(last_assessment_date, 'YYYY-MM-DD'),
		       compliance_score, created_at
		FROM vendors
		WHERE tenant_id = $1
		ORDER BY compliance_score DESC
	`, tenantCtx.TenantID)

	if err != nil {
		http.Error(w, "Failed to query vendors: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var vendors []models.Vendor
	for rows.Next() {
		var v models.Vendor
		var assessDate *string
		if err := rows.Scan(
			&v.ID, &v.TenantID, &v.CompanyName, &v.RCNumber, &v.TIN, &v.VendorCategory,
			&v.RiskLevel, &v.TCCVerified, &v.DPASigned, &assessDate,
			&v.ComplianceScore, &v.CreatedAt,
		); err == nil {
			v.LastAssessmentDate = assessDate
			vendors = append(vendors, v)
		}
	}

	if vendors == nil {
		vendors = []models.Vendor{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vendors)
}

func CreateVendor(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	var req models.Vendor
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	if req.CompanyName == "" || req.VendorCategory == "" {
		http.Error(w, "Company name and category are required", http.StatusBadRequest)
		return
	}

	if req.RiskLevel == "" {
		req.RiskLevel = "LOW"
	}
	if req.ComplianceScore == 0 {
		req.ComplianceScore = 75
	}

	var newID string
	err := db.Pool.QueryRow(r.Context(), `
		INSERT INTO vendors (
			tenant_id, company_name, rc_number, tin, vendor_category,
			risk_level, tcc_verified, dpa_signed, compliance_score
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`, tenantCtx.TenantID, req.CompanyName, req.RCNumber, req.TIN, req.VendorCategory,
		req.RiskLevel, req.TCCVerified, req.DPASigned, req.ComplianceScore).Scan(&newID)

	if err != nil {
		http.Error(w, "Failed to create vendor: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      newID,
		"message": "Vendor due diligence record saved",
	})
}
