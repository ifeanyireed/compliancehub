package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/models"
)

var nonAlphanumericRegex = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(text string) string {
	clean := strings.ToLower(strings.TrimSpace(text))
	clean = nonAlphanumericRegex.ReplaceAllString(clean, "-")
	clean = strings.Trim(clean, "-")
	if clean == "" {
		return fmt.Sprintf("post-%d", time.Now().Unix())
	}
	return clean
}

func calculateReadTime(content string) string {
	words := len(strings.Fields(content))
	mins := words / 200
	if mins < 1 {
		mins = 1
	}
	return fmt.Sprintf("%d min read", mins)
}

// ListBlogPosts returns blog posts with filtering, search, and pagination
func ListBlogPosts(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()

	category := r.URL.Query().Get("category")
	status := r.URL.Query().Get("status")
	search := strings.TrimSpace(r.URL.Query().Get("search"))
	tag := strings.TrimSpace(r.URL.Query().Get("tag"))

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	query := `
		SELECT id, title, slug, excerpt, content, 
		       author_name, author_role, author_avatar, COALESCE(author_bio, '') as author_bio,
		       category, tags, read_time, status, cover_image,
		       COALESCE(view_count, 0) as view_count,
		       COALESCE(meta_title, '') as meta_title,
		       COALESCE(meta_description, '') as meta_description,
		       COALESCE(canonical_url, '') as canonical_url,
		       COALESCE(og_image, '') as og_image,
		       published_at, created_at, COALESCE(updated_at, created_at) as updated_at
		FROM blog_posts 
		WHERE 1=1
	`
	var args []interface{}
	argIdx := 1

	if category != "" && category != "All" && category != "ALL" {
		query += fmt.Sprintf(" AND (category = $%d OR LOWER(category) = LOWER($%d))", argIdx, argIdx)
		args = append(args, category)
		argIdx++
	}

	if status != "" && status != "ALL" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	} else if !strings.Contains(r.URL.Path, "/admin/") && !strings.Contains(r.URL.Path, "/staff/") {
		// Public queries only show published posts by default
		query += " AND status = 'PUBLISHED'"
	}

	if search != "" {
		query += fmt.Sprintf(" AND (title ILIKE $%d OR excerpt ILIKE $%d OR content ILIKE $%d OR author_name ILIKE $%d)", argIdx, argIdx, argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}

	if tag != "" {
		query += fmt.Sprintf(" AND $%d = ANY(tags)", argIdx)
		args = append(args, tag)
		argIdx++
	}

	query += fmt.Sprintf(" ORDER BY COALESCE(published_at, created_at) DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to query blog posts: " + err.Error()})
		return
	}
	defer rows.Close()

	var posts []models.BlogPost
	for rows.Next() {
		var p models.BlogPost
		if err := rows.Scan(
			&p.ID, &p.Title, &p.Slug, &p.Excerpt, &p.Content,
			&p.AuthorName, &p.AuthorRole, &p.AuthorAvatar, &p.AuthorBio,
			&p.Category, &p.Tags, &p.ReadTime, &p.Status, &p.CoverImage,
			&p.ViewCount, &p.MetaTitle, &p.MetaDescription, &p.CanonicalURL, &p.OgImage,
			&p.PublishedAt, &p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed scanning blog post row: " + err.Error()})
			return
		}
		posts = append(posts, p)
	}

	if posts == nil {
		posts = []models.BlogPost{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

// SinglePostResponse embeds the post, its approved comments, and related posts
type SinglePostResponse struct {
	models.BlogPost
	Comments     []models.BlogComment `json:"comments"`
	RelatedPosts []models.BlogPost    `json:"related_posts"`
}

// GetBlogPostBySlug returns a single blog post along with comments and related recommendations
func GetBlogPostBySlug(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()

	parts := strings.Split(strings.TrimSuffix(r.URL.Path, "/"), "/")
	target := parts[len(parts)-1]

	var p models.BlogPost
	query := `
		SELECT id, title, slug, excerpt, content, 
		       author_name, author_role, author_avatar, COALESCE(author_bio, '') as author_bio,
		       category, tags, read_time, status, cover_image,
		       COALESCE(view_count, 0) as view_count,
		       COALESCE(meta_title, '') as meta_title,
		       COALESCE(meta_description, '') as meta_description,
		       COALESCE(canonical_url, '') as canonical_url,
		       COALESCE(og_image, '') as og_image,
		       published_at, created_at, COALESCE(updated_at, created_at) as updated_at
		FROM blog_posts 
		WHERE slug = $1 OR LOWER(slug) = LOWER($1) OR id::text = $1
		LIMIT 1
	`

	err := db.Pool.QueryRow(ctx, query, target).Scan(
		&p.ID, &p.Title, &p.Slug, &p.Excerpt, &p.Content,
		&p.AuthorName, &p.AuthorRole, &p.AuthorAvatar, &p.AuthorBio,
		&p.Category, &p.Tags, &p.ReadTime, &p.Status, &p.CoverImage,
		&p.ViewCount, &p.MetaTitle, &p.MetaDescription, &p.CanonicalURL, &p.OgImage,
		&p.PublishedAt, &p.CreatedAt, &p.UpdatedAt,
	)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Article not found"})
		return
	}

	// Fetch approved comments for this post
	var comments []models.BlogComment
	commentRows, cErr := db.Pool.Query(ctx, `
		SELECT id, post_id, author_name, author_email, content, status, created_at
		FROM blog_comments
		WHERE post_id = $1 AND status = 'APPROVED'
		ORDER BY created_at ASC
	`, p.ID)
	if cErr == nil {
		defer commentRows.Close()
		for commentRows.Next() {
			var c models.BlogComment
			if err := commentRows.Scan(&c.ID, &c.PostID, &c.AuthorName, &c.AuthorEmail, &c.Content, &c.Status, &c.CreatedAt); err == nil {
				comments = append(comments, c)
			}
		}
	}
	if comments == nil {
		comments = []models.BlogComment{}
	}

	// Fetch related articles (same category or recent)
	var related []models.BlogPost
	relRows, rErr := db.Pool.Query(ctx, `
		SELECT id, title, slug, excerpt, content, 
		       author_name, author_role, author_avatar, COALESCE(author_bio, '') as author_bio,
		       category, tags, read_time, status, cover_image,
		       COALESCE(view_count, 0) as view_count,
		       COALESCE(meta_title, '') as meta_title,
		       COALESCE(meta_description, '') as meta_description,
		       COALESCE(canonical_url, '') as canonical_url,
		       COALESCE(og_image, '') as og_image,
		       published_at, created_at, COALESCE(updated_at, created_at) as updated_at
		FROM blog_posts
		WHERE id != $1 AND status = 'PUBLISHED'
		ORDER BY (CASE WHEN category = $2 THEN 0 ELSE 1 END), COALESCE(published_at, created_at) DESC
		LIMIT 3
	`, p.ID, p.Category)
	if rErr == nil {
		defer relRows.Close()
		for relRows.Next() {
			var rp models.BlogPost
			if err := relRows.Scan(
				&rp.ID, &rp.Title, &rp.Slug, &rp.Excerpt, &rp.Content,
				&rp.AuthorName, &rp.AuthorRole, &rp.AuthorAvatar, &rp.AuthorBio,
				&rp.Category, &rp.Tags, &rp.ReadTime, &rp.Status, &rp.CoverImage,
				&rp.ViewCount, &rp.MetaTitle, &rp.MetaDescription, &rp.CanonicalURL, &rp.OgImage,
				&rp.PublishedAt, &rp.CreatedAt, &rp.UpdatedAt,
			); err == nil {
				related = append(related, rp)
			}
		}
	}
	if related == nil {
		related = []models.BlogPost{}
	}

	resp := SinglePostResponse{
		BlogPost:     p,
		Comments:     comments,
		RelatedPosts: related,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// IncrementBlogPostView atomically increments the view counter for an article
func IncrementBlogPostView(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	trimmed := strings.TrimSuffix(r.URL.Path, "/")
	parts := strings.Split(trimmed, "/")
	// e.g. /api/blog/{slug}/view -> target is slug
	var target string
	if len(parts) >= 2 && parts[len(parts)-1] == "view" {
		target = parts[len(parts)-2]
	} else {
		target = parts[len(parts)-1]
	}
	if unescaped, err := url.PathUnescape(target); err == nil {
		target = unescaped
	}
	target = strings.TrimSpace(target)

	if target == "" || target == "blog" || target == "api" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid blog post slug or ID"})
		return
	}

	var newViewCount int64
	query := `
		UPDATE blog_posts 
		SET view_count = COALESCE(view_count, 0) + 1 
		WHERE slug = $1 OR LOWER(slug) = LOWER($1) OR id::text = $1 
		RETURNING view_count
	`
	err := db.Pool.QueryRow(ctx, query, target).Scan(&newViewCount)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Post not found to increment views: " + err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"view_count": newViewCount,
	})
}

// CreateBlogPost creates a new regulatory article with auto-slugification and read-time calculation
func CreateBlogPost(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()

	var p models.BlogPost
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON payload: " + err.Error()})
		return
	}

	if strings.TrimSpace(p.Title) == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Article title is required"})
		return
	}

	if p.Slug == "" {
		p.Slug = slugify(p.Title)
	} else {
		p.Slug = slugify(p.Slug)
	}

	if p.ReadTime == "" {
		p.ReadTime = calculateReadTime(p.Content)
	}
	if p.Status == "" {
		p.Status = "PUBLISHED"
	}
	if p.CoverImage == "" {
		p.CoverImage = "/article_professional.jpg"
	}
	if p.AuthorName == "" {
		p.AuthorName = "Dr. Olumide Adeleke"
	}
	if p.AuthorRole == "" {
		p.AuthorRole = "Super Administrator & Compliance Director"
	}
	if p.AuthorAvatar == "" {
		p.AuthorAvatar = "/character5.jpg"
	}
	if p.Category == "" {
		p.Category = "Taxation & FIRS"
	}

	query := `
		INSERT INTO blog_posts (
			title, slug, excerpt, content, 
			author_name, author_role, author_avatar, author_bio,
			category, tags, read_time, status, cover_image,
			meta_title, meta_description, canonical_url, og_image,
			view_count, published_at, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 0, NOW(), NOW(), NOW()) 
		RETURNING id, published_at, created_at, updated_at
	`

	err := db.Pool.QueryRow(ctx, query,
		p.Title, p.Slug, p.Excerpt, p.Content,
		p.AuthorName, p.AuthorRole, p.AuthorAvatar, p.AuthorBio,
		p.Category, p.Tags, p.ReadTime, p.Status, p.CoverImage,
		p.MetaTitle, p.MetaDescription, p.CanonicalURL, p.OgImage,
	).Scan(&p.ID, &p.PublishedAt, &p.CreatedAt, &p.UpdatedAt)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create blog post: " + err.Error()})
		return
	}

	// Auto-register category if not exists
	_, _ = db.Pool.Exec(ctx, `
		INSERT INTO blog_categories (name, slug) 
		VALUES ($1, $2) 
		ON CONFLICT (name) DO NOTHING
	`, p.Category, slugify(p.Category))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

// UpdateBlogPost updates an existing article
func UpdateBlogPost(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()

	parts := strings.Split(strings.TrimSuffix(r.URL.Path, "/"), "/")
	idStr := parts[len(parts)-1]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid post ID format"})
		return
	}

	var p models.BlogPost
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON: " + err.Error()})
		return
	}

	if p.Slug == "" {
		p.Slug = slugify(p.Title)
	} else {
		p.Slug = slugify(p.Slug)
	}
	if p.ReadTime == "" {
		p.ReadTime = calculateReadTime(p.Content)
	}

	query := `
		UPDATE blog_posts SET
			title = $1, slug = $2, excerpt = $3, content = $4,
			author_name = $5, author_role = $6, author_avatar = $7, author_bio = $8,
			category = $9, tags = $10, read_time = $11, status = $12, cover_image = $13,
			meta_title = $14, meta_description = $15, canonical_url = $16, og_image = $17,
			updated_at = NOW()
		WHERE id = $18
		RETURNING id, published_at, created_at, updated_at
	`

	err = db.Pool.QueryRow(ctx, query,
		p.Title, p.Slug, p.Excerpt, p.Content,
		p.AuthorName, p.AuthorRole, p.AuthorAvatar, p.AuthorBio,
		p.Category, p.Tags, p.ReadTime, p.Status, p.CoverImage,
		p.MetaTitle, p.MetaDescription, p.CanonicalURL, p.OgImage,
		id,
	).Scan(&p.ID, &p.PublishedAt, &p.CreatedAt, &p.UpdatedAt)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update blog post: " + err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

// DeleteBlogPost permanently deletes an article
func DeleteBlogPost(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	parts := strings.Split(strings.TrimSuffix(r.URL.Path, "/"), "/")
	idStr := parts[len(parts)-1]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid post ID format"})
		return
	}

	_, err = db.Pool.Exec(ctx, "DELETE FROM blog_posts WHERE id = $1", id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to delete post: " + err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// ListCategories returns all regulatory categories with article counts
func ListCategories(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := `
		SELECT c.id, c.name, c.slug, COALESCE(c.description, '') as description, 
		       COUNT(p.id) as post_count, c.created_at
		FROM blog_categories c
		LEFT JOIN blog_posts p ON LOWER(p.category) = LOWER(c.name)
		GROUP BY c.id, c.name, c.slug, c.description, c.created_at
		ORDER BY post_count DESC, c.name ASC
	`

	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		// Fallback to static list if table query fails
		categories := []models.BlogCategory{
			{ID: 1, Name: "Taxation & FIRS", Slug: "taxation-firs", Description: "Corporate tax, withholding and TaxPro-MAX"},
			{ID: 2, Name: "Data Privacy & NDPA", Slug: "data-privacy-ndpa", Description: "NDPA 2023 compliance, annual DPCO audits"},
			{ID: 3, Name: "Corporate & CAC", Slug: "corporate-cac", Description: "CAMA 2020 annual returns and PSC filings"},
			{ID: 4, Name: "AML & SCUML", Slug: "aml-scuml", Description: "EFCC SCUML registration and PEP screening"},
			{ID: 5, Name: "Labour & Pension", Slug: "labour-pension", Description: "PenCom remittances, NSITF, ITF statutory levies"},
			{ID: 6, Name: "Immigration & Expatriate", Slug: "immigration-expatriate", Description: "Expatriate quotas, CERPAC and business permits"},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(categories)
		return
	}
	defer rows.Close()

	var categories []models.BlogCategory
	for rows.Next() {
		var c models.BlogCategory
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.PostCount, &c.CreatedAt); err == nil {
			categories = append(categories, c)
		}
	}

	if categories == nil {
		categories = []models.BlogCategory{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

// CreateCategory adds a new regulatory topic
func CreateCategory(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var c models.BlogCategory
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid payload"})
		return
	}

	if c.Name == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Category name is required"})
		return
	}

	if c.Slug == "" {
		c.Slug = slugify(c.Name)
	}

	err := db.Pool.QueryRow(ctx, `
		INSERT INTO blog_categories (name, slug, description, created_at)
		VALUES ($1, $2, $3, NOW())
		RETURNING id, created_at
	`, c.Name, c.Slug, c.Description).Scan(&c.ID, &c.CreatedAt)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create category: " + err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}

// DeleteCategory deletes a category
func DeleteCategory(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	parts := strings.Split(strings.TrimSuffix(r.URL.Path, "/"), "/")
	idStr := parts[len(parts)-1]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid ID"})
		return
	}

	_, err = db.Pool.Exec(ctx, "DELETE FROM blog_categories WHERE id = $1", id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to delete category"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// ListTags returns all tags with post counts
func ListTags(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := `
		SELECT t.id, t.name, t.slug, COUNT(p.id) as post_count, t.created_at
		FROM blog_tags t
		LEFT JOIN blog_posts p ON t.name = ANY(p.tags)
		GROUP BY t.id, t.name, t.slug, t.created_at
		ORDER BY post_count DESC, t.name ASC
	`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	var tags []models.BlogTag
	for rows.Next() {
		var t models.BlogTag
		if err := rows.Scan(&t.ID, &t.Name, &t.Slug, &t.PostCount, &t.CreatedAt); err == nil {
			tags = append(tags, t)
		}
	}
	if tags == nil {
		tags = []models.BlogTag{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tags)
}

// CreateTag adds a new tag
func CreateTag(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var t models.BlogTag
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid payload"})
		return
	}

	if t.Name == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Tag name is required"})
		return
	}
	if t.Slug == "" {
		t.Slug = slugify(t.Name)
	}

	err := db.Pool.QueryRow(ctx, `
		INSERT INTO blog_tags (name, slug, created_at)
		VALUES ($1, $2, NOW())
		RETURNING id, created_at
	`, t.Name, t.Slug).Scan(&t.ID, &t.CreatedAt)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create tag: " + err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(t)
}

// DeleteTag deletes a tag
func DeleteTag(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	parts := strings.Split(strings.TrimSuffix(r.URL.Path, "/"), "/")
	idStr := parts[len(parts)-1]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid ID"})
		return
	}

	_, err = db.Pool.Exec(ctx, "DELETE FROM blog_tags WHERE id = $1", id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to delete tag"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// ListComments lists comments for admin moderation or specific post
func ListComments(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	postID := r.URL.Query().Get("post_id")
	status := r.URL.Query().Get("status")

	query := `
		SELECT c.id, c.post_id, COALESCE(p.title, 'General') as post_title,
		       c.author_name, c.author_email, c.content, c.status, c.created_at
		FROM blog_comments c
		LEFT JOIN blog_posts p ON c.post_id = p.id
		WHERE 1=1
	`
	var args []interface{}
	argIdx := 1

	if postID != "" {
		query += fmt.Sprintf(" AND c.post_id = $%d", argIdx)
		args = append(args, postID)
		argIdx++
	}
	if status != "" && status != "ALL" {
		query += fmt.Sprintf(" AND c.status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	query += " ORDER BY c.created_at DESC LIMIT 100"

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	var comments []models.BlogComment
	for rows.Next() {
		var c models.BlogComment
		if err := rows.Scan(&c.ID, &c.PostID, &c.PostTitle, &c.AuthorName, &c.AuthorEmail, &c.Content, &c.Status, &c.CreatedAt); err == nil {
			comments = append(comments, c)
		}
	}
	if comments == nil {
		comments = []models.BlogComment{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

// CreateComment adds a comment on a blog post
func CreateComment(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var c models.BlogComment
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid payload"})
		return
	}

	if c.PostID == 0 || strings.TrimSpace(c.Content) == "" || strings.TrimSpace(c.AuthorName) == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Post ID, content, and author name are required"})
		return
	}

	if c.Status == "" {
		c.Status = "APPROVED" // Approved by default for instant engagement
	}

	err := db.Pool.QueryRow(ctx, `
		INSERT INTO blog_comments (post_id, author_name, author_email, content, status, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		RETURNING id, created_at
	`, c.PostID, c.AuthorName, c.AuthorEmail, c.Content, c.Status).Scan(&c.ID, &c.CreatedAt)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create comment: " + err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}

// UpdateCommentStatus toggles comment approval status
func UpdateCommentStatus(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	parts := strings.Split(strings.TrimSuffix(r.URL.Path, "/"), "/")
	// e.g. /api/blog/comments/{id}/status or /api/blog/comments/{id}
	idStr := parts[len(parts)-1]
	if idStr == "status" && len(parts) >= 2 {
		idStr = parts[len(parts)-2]
	}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid comment ID"})
		return
	}

	var payload struct {
		Status string `json:"status"`
	}
	_ = json.NewDecoder(r.Body).Decode(&payload)
	if payload.Status == "" {
		payload.Status = "APPROVED"
	}

	_, err = db.Pool.Exec(ctx, "UPDATE blog_comments SET status = $1 WHERE id = $2", payload.Status, id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update comment status"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// DeleteComment removes a comment
func DeleteComment(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	parts := strings.Split(strings.TrimSuffix(r.URL.Path, "/"), "/")
	idStr := parts[len(parts)-1]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid comment ID"})
		return
	}

	_, err = db.Pool.Exec(ctx, "DELETE FROM blog_comments WHERE id = $1", id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to delete comment"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// ListSubscribers returns all newsletter subscribers
func ListSubscribers(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	rows, err := db.Pool.Query(ctx, "SELECT id, email, source, status, created_at FROM blog_subscribers ORDER BY created_at DESC")
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	defer rows.Close()

	var subs []models.BlogSubscriber
	for rows.Next() {
		var s models.BlogSubscriber
		if err := rows.Scan(&s.ID, &s.Email, &s.Source, &s.Status, &s.CreatedAt); err == nil {
			subs = append(subs, s)
		}
	}
	if subs == nil {
		subs = []models.BlogSubscriber{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(subs)
}

// SubscribeNewsletter registers an email for weekly regulatory intelligence
func SubscribeNewsletter(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var payload struct {
		Email  string `json:"email"`
		Source string `json:"source"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid payload"})
		return
	}

	payload.Email = strings.ToLower(strings.TrimSpace(payload.Email))
	if payload.Email == "" || !strings.Contains(payload.Email, "@") {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Valid email address is required"})
		return
	}

	if payload.Source == "" {
		payload.Source = "BLOG_EDITORIAL"
	}

	var sub models.BlogSubscriber
	err := db.Pool.QueryRow(ctx, `
		INSERT INTO blog_subscribers (email, source, status, created_at)
		VALUES ($1, $2, 'ACTIVE', NOW())
		ON CONFLICT (email) DO UPDATE SET status = 'ACTIVE'
		RETURNING id, email, source, status, created_at
	`, payload.Email, payload.Source).Scan(&sub.ID, &sub.Email, &sub.Source, &sub.Status, &sub.CreatedAt)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to subscribe: " + err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Thank you for subscribing to ComplianceHub Regulatory Intelligence!",
		"data":    sub,
	})
}

// DeleteSubscriber removes a newsletter subscriber
func DeleteSubscriber(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	parts := strings.Split(strings.TrimSuffix(r.URL.Path, "/"), "/")
	idStr := parts[len(parts)-1]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid subscriber ID"})
		return
	}

	_, err = db.Pool.Exec(ctx, "DELETE FROM blog_subscribers WHERE id = $1", id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to remove subscriber"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}
