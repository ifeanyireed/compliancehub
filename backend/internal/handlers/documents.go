package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/middleware"
	"compliancehub-backend/internal/models"
	"compliancehub-backend/internal/services"
)

func GenerateUploadSignature(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	if !tenantCtx.CanUploadEvidence("hubdocs") {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Forbidden: You do not have permission to upload evidence in this workspace",
		})
		return
	}

	var req models.CloudinarySignatureRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	if services.CldService == nil {
		_, err := services.InitCloudinary()
		if err != nil {
			http.Error(w, "Cloudinary configuration error: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	cleanFileName := strings.ReplaceAll(req.FileName, " ", "_")
	publicID := fmt.Sprintf("%s_%d", cleanFileName, time.Now().Unix())
	folder := fmt.Sprintf("compliancehub/tenants/%s", tenantCtx.TenantID)

	signature, timestamp, apiKey, cloudName := services.CldService.GenerateUploadSignature(folder, publicID)

	resp := models.CloudinarySignatureResponse{
		Signature: signature,
		Timestamp: timestamp,
		ApiKey:    apiKey,
		CloudName: cloudName,
		Folder:    folder,
		PublicID:  publicID,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func ListDocuments(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	category := r.URL.Query().Get("category")

	query := `
		SELECT d.id, d.tenant_id, d.name, d.category, d.cloudinary_public_id, d.cloudinary_secure_url,
		       d.file_format, d.file_size_bytes, d.version, d.verification_status,
		       TO_CHAR(d.expiry_date, 'YYYY-MM-DD'), d.is_expiring_soon, d.uploaded_by,
		       COALESCE(u.full_name, 'Workspace Admin') as uploaded_by_name,
		       d.verified_by, d.verified_at, d.created_at, d.updated_at
		FROM documents d
		LEFT JOIN users u ON d.uploaded_by = u.id
		WHERE d.tenant_id = $1
	`
	args := []interface{}{tenantCtx.TenantID}

	if category != "" && category != "All" {
		query += " AND d.category = $2"
		args = append(args, category)
	}

	query += " ORDER BY d.created_at DESC"

	rows, err := db.Pool.Query(r.Context(), query, args...)
	if err != nil {
		http.Error(w, "Failed to query documents: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var docs []models.Document
	for rows.Next() {
		var doc models.Document
		var expiryDate *string
		var verifiedBy *string
		var verifiedAt *time.Time

		if err := rows.Scan(
			&doc.ID, &doc.TenantID, &doc.Name, &doc.Category, &doc.CloudinaryPublicID, &doc.CloudinarySecureURL,
			&doc.FileFormat, &doc.FileSizeBytes, &doc.Version, &doc.VerificationStatus,
			&expiryDate, &doc.IsExpiringSoon, &doc.UploadedBy, &doc.UploadedByName,
			&verifiedBy, &verifiedAt, &doc.CreatedAt, &doc.UpdatedAt,
		); err == nil {
			doc.ExpiryDate = expiryDate
			doc.VerifiedBy = verifiedBy
			doc.VerifiedAt = verifiedAt
			docs = append(docs, doc)
		}
	}

	if docs == nil {
		docs = []models.Document{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(docs)
}

func RegisterDocument(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	user := middleware.GetUserFromContext(r)
	userID := "33333333-3333-3333-3333-333333333301" // fallback to business admin if demo
	actorName := "System Admin"
	if user != nil {
		userID = user.ID
		actorName = user.FullName
	}

	var req struct {
		Name                string `json:"name"`
		Category            string `json:"category"`
		CloudinaryPublicID  string `json:"cloudinary_public_id"`
		CloudinarySecureURL string `json:"cloudinary_secure_url"`
		FileFormat          string `json:"file_format"`
		FileSizeBytes       int64  `json:"file_size_bytes"`
		ExpiryDate          string `json:"expiry_date,omitempty"`
		Version             string `json:"version,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.CloudinarySecureURL == "" {
		http.Error(w, "Document name and Cloudinary URL are required", http.StatusBadRequest)
		return
	}

	if req.Version == "" {
		req.Version = "v1.0"
	}
	if req.FileFormat == "" {
		req.FileFormat = "pdf"
	}

	var docID string
	var err error
	if req.ExpiryDate != "" {
		err = db.Pool.QueryRow(r.Context(), `
			INSERT INTO documents (
				tenant_id, name, category, cloudinary_public_id, cloudinary_secure_url,
				file_format, file_size_bytes, version, verification_status, expiry_date, uploaded_by
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'VERIFIED', $9, $10)
			RETURNING id
		`, tenantCtx.TenantID, req.Name, req.Category, req.CloudinaryPublicID, req.CloudinarySecureURL,
			req.FileFormat, req.FileSizeBytes, req.Version, req.ExpiryDate, userID).Scan(&docID)
	} else {
		err = db.Pool.QueryRow(r.Context(), `
			INSERT INTO documents (
				tenant_id, name, category, cloudinary_public_id, cloudinary_secure_url,
				file_format, file_size_bytes, version, verification_status, uploaded_by
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'VERIFIED', $9)
			RETURNING id
		`, tenantCtx.TenantID, req.Name, req.Category, req.CloudinaryPublicID, req.CloudinarySecureURL,
			req.FileFormat, req.FileSizeBytes, req.Version, userID).Scan(&docID)
	}

	if err != nil {
		http.Error(w, "Failed to persist document metadata: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Log activity
	_, _ = db.Pool.Exec(r.Context(), `
		INSERT INTO activity_logs (tenant_id, user_id, actor_name, actor_role, action_type, details)
		VALUES ($1, $2, $3, 'OPERATOR', 'UPLOAD_DOCUMENT', $4)
	`, tenantCtx.TenantID, userID, actorName, "Uploaded regulatory evidence: "+req.Name)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      docID,
		"message": "Document registered and secured in Cloudinary evidence vault",
	})
}

func DeleteDocument(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	if tenantCtx == nil {
		http.Error(w, "Tenant not resolved", http.StatusBadRequest)
		return
	}

	if !tenantCtx.CanDeleteResource() {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Forbidden: Only workspace owners and administrators can permanently delete regulatory evidence",
		})
		return
	}

	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	docID := parts[3]

	_, err := db.Pool.Exec(r.Context(), `
		DELETE FROM documents WHERE id = $1 AND tenant_id = $2
	`, docID, tenantCtx.TenantID)

	if err != nil {
		http.Error(w, "Delete failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Audit trail logging
	user := middleware.GetUserFromContext(r)
	actorName := "Operator"
	var actorID *string
	if user != nil {
		actorName = user.FullName
		actorID = &user.ID
	}
	_, _ = db.Pool.Exec(r.Context(), `
		INSERT INTO activity_logs (tenant_id, user_id, actor_name, actor_role, action_type, details)
		VALUES ($1, $2, $3, $4, 'DELETE_DOCUMENT', $5)
	`, tenantCtx.TenantID, actorID, actorName, tenantCtx.Role, fmt.Sprintf("Permanently deleted regulatory evidence document: %s", docID))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}
