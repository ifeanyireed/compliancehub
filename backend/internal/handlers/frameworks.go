package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"compliancehub-backend/internal/cache"
	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/models"
)

type FrameworkWithObligations struct {
	models.RegulatoryFramework
	Obligations []models.Obligation `json:"obligations"`
}

// ListRegulatoryFrameworks returns all master frameworks and statutory obligations (cached in Redis 24h)
func ListRegulatoryFrameworks(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	cacheKey := fmt.Sprintf("chub:%s:shared:global:frameworks:all", cache.GetEnvNamespace())

	// Check Redis cache first (fail-open)
	if cache.DefaultClient != nil {
		var cached []FrameworkWithObligations
		if err := cache.DefaultClient.GetJSON(ctx, cacheKey, &cached); err == nil && len(cached) > 0 {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			json.NewEncoder(w).Encode(cached)
			return
		}
	}

	// Fetch from Neon Lakebase PostgreSQL
	rows, err := db.Pool.Query(ctx, `
		SELECT id, authority, statute_name, COALESCE(section_reference, ''), 
		       COALESCE(official_source_url, ''), frequency, 
		       COALESCE(applies_to_industries, ARRAY[]::text[]), 
		       COALESCE(penalty_formula, ''), created_at
		FROM regulatory_frameworks
		ORDER BY authority ASC
	`)
	if err != nil {
		http.Error(w, "Failed to query frameworks: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var frameworks []FrameworkWithObligations
	frameworkMap := make(map[string]int)

	for rows.Next() {
		var f FrameworkWithObligations
		if err := rows.Scan(
			&f.ID, &f.Authority, &f.StatuteName, &f.SectionReference,
			&f.OfficialSourceURL, &f.Frequency, &f.AppliesToIndustries,
			&f.PenaltyFormula, &f.CreatedAt,
		); err == nil {
			f.Obligations = []models.Obligation{}
			frameworkMap[f.ID] = len(frameworks)
			frameworks = append(frameworks, f)
		}
	}

	// Fetch obligations associated with frameworks
	obRows, oErr := db.Pool.Query(ctx, `
		SELECT id, COALESCE(framework_id::text, ''), title, authority, description,
		       statutory_ref, default_frequency, COALESCE(required_evidence_type, ''), is_statutory
		FROM obligations
		ORDER BY authority ASC, title ASC
	`)
	if oErr == nil {
		defer obRows.Close()
		for obRows.Next() {
			var o models.Obligation
			if err := obRows.Scan(
				&o.ID, &o.FrameworkID, &o.Title, &o.Authority, &o.Description,
				&o.StatutoryRef, &o.DefaultFrequency, &o.RequiredEvidenceType, &o.IsStatutory,
			); err == nil {
				if idx, ok := frameworkMap[o.FrameworkID]; ok {
					frameworks[idx].Obligations = append(frameworks[idx].Obligations, o)
				}
			}
		}
	}

	if frameworks == nil {
		frameworks = []FrameworkWithObligations{}
	}

	// Cache in Redis with 24-hour TTL
	if cache.DefaultClient != nil && len(frameworks) > 0 {
		_ = cache.DefaultClient.SetJSON(ctx, cacheKey, frameworks, 24*time.Hour)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	json.NewEncoder(w).Encode(frameworks)
}

// InvalidateRegulatoryFrameworks clears the master frameworks catalog cache
func InvalidateRegulatoryFrameworks(w http.ResponseWriter, r *http.Request) {
	if cache.DefaultClient != nil {
		cacheKey := fmt.Sprintf("chub:%s:shared:global:frameworks:all", cache.GetEnvNamespace())
		_ = cache.DefaultClient.DeleteKey(r.Context(), cacheKey)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Regulatory frameworks cache cleared",
	})
}
