package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/middleware"
)

type InvoiceItem struct {
	ID            string     `json:"id"`
	InvoiceNumber string     `json:"invoice_number"`
	TenantID      *string    `json:"tenant_id"`
	ClientName    string     `json:"client_name"`
	AmountNGN     float64    `json:"amount_ngn"`
	InvoiceType   string     `json:"invoice_type"`
	Status        string     `json:"status"`
	PayoutRef     *string    `json:"payout_ref"`
	DueDate       string     `json:"due_date"`
	PaidAt        *time.Time `json:"paid_at"`
	CreatedAt     time.Time  `json:"created_at"`
}

func ListInvoices(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantCtx := middleware.GetTenantContext(r)

	query := `
		SELECT id, invoice_number, tenant_id, client_name, amount_ngn,
		       invoice_type, status, payout_ref, TO_CHAR(due_date, 'YYYY-MM-DD'),
		       paid_at, created_at
		FROM invoices
	`
	args := []interface{}{}

	// If tenant resolved and not super admin, filter by tenant if tenant_id matches
	if tenantCtx != nil && tenantCtx.Role != "ADMIN" {
		query += " WHERE tenant_id = $1 OR tenant_id IS NULL"
		args = append(args, tenantCtx.TenantID)
	}

	query += " ORDER BY created_at DESC LIMIT 50"

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		http.Error(w, "Failed to query invoices: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var invoices []InvoiceItem
	for rows.Next() {
		var item InvoiceItem
		var paidAt *time.Time
		if err := rows.Scan(
			&item.ID, &item.InvoiceNumber, &item.TenantID, &item.ClientName,
			&item.AmountNGN, &item.InvoiceType, &item.Status, &item.PayoutRef,
			&item.DueDate, &paidAt, &item.CreatedAt,
		); err == nil {
			item.PaidAt = paidAt
			invoices = append(invoices, item)
		}
	}

	if invoices == nil {
		invoices = []InvoiceItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invoices)
}

func CreateInvoice(w http.ResponseWriter, r *http.Request) {
	tenantCtx := middleware.GetTenantContext(r)
	ctx := r.Context()

	var req struct {
		ClientName  string  `json:"client_name"`
		AmountNGN   float64 `json:"amount_ngn"`
		InvoiceType string  `json:"invoice_type"`
		DueDate     string  `json:"due_date"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid invoice body", http.StatusBadRequest)
		return
	}

	if req.ClientName == "" || req.AmountNGN <= 0 {
		http.Error(w, "Client name and a positive amount are required", http.StatusBadRequest)
		return
	}

	if req.InvoiceType == "" {
		req.InvoiceType = "RETAINER"
	}
	if req.DueDate == "" {
		req.DueDate = time.Now().AddDate(0, 0, 14).Format("2006-01-02")
	}

	invNum := fmt.Sprintf("INV-2026-%04d", time.Now().UnixNano()%10000)
	var tenantID *string
	if tenantCtx != nil && tenantCtx.TenantID != "" {
		tenantID = &tenantCtx.TenantID
	}

	var newID string
	err := db.Pool.QueryRow(ctx, `
		INSERT INTO invoices (invoice_number, tenant_id, client_name, amount_ngn, invoice_type, status, due_date)
		VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)
		RETURNING id
	`, invNum, tenantID, req.ClientName, req.AmountNGN, req.InvoiceType, req.DueDate).Scan(&newID)

	if err != nil {
		http.Error(w, "Failed to create invoice: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":             newID,
		"invoice_number": invNum,
		"status":         "PENDING",
		"message":        "Invoice generated successfully",
	})
}
