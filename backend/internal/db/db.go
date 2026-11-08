package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

// WithTenantTx executes a database operation inside a transaction scoped to a specific tenant ID.
// This sets the PostgreSQL session variable 'app.current_tenant_id' locally for the duration of the
// transaction, activating Row Level Security (RLS) enforcement at the database engine level.
// When the transaction commits or rolls back, the local setting is automatically discarded,
// preventing session bleeding across the connection pool.
func WithTenantTx(ctx context.Context, tenantID string, fn func(tx pgx.Tx) error) error {
	if Pool == nil {
		return fmt.Errorf("database pool is not initialized")
	}

	tx, err := Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tenant transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	if tenantID != "" {
		// Switch to non-bypass application role for strict RLS enforcement if available
		var hasRole bool
		_ = tx.QueryRow(ctx, "SELECT pg_has_role(current_user, 'compliancehub_app', 'MEMBER')").Scan(&hasRole)
		if hasRole {
			if _, err := tx.Exec(ctx, "SET LOCAL ROLE compliancehub_app"); err != nil {
				log.Printf("⚠️ Note: SET LOCAL ROLE compliancehub_app: %v", err)
			}
		}

		if _, err := tx.Exec(ctx, "SELECT set_config('app.current_tenant_id', $1, true)", tenantID); err != nil {
			return fmt.Errorf("failed to set local tenant context: %w", err)
		}
	}

	if err := fn(tx); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// WithBypassRLSTx executes a transaction with 'app.bypass_rls = on' for super-admin or system routines.
func WithBypassRLSTx(ctx context.Context, fn func(tx pgx.Tx) error) error {
	if Pool == nil {
		return fmt.Errorf("database pool is not initialized")
	}

	tx, err := Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin bypass-RLS transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, "SELECT set_config('app.bypass_rls', 'on', true)"); err != nil {
		return fmt.Errorf("failed to enable RLS bypass: %w", err)
	}

	if err := fn(tx); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func InitDB(databaseURL string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database config: %w", err)
	}

	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = 30 * time.Minute
	config.MaxConnIdleTime = 5 * time.Minute

	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Neon Postgres: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping Neon Postgres: %w", err)
	}

	Pool = pool
	log.Println("✅ Successfully connected to Neon Lakebase Postgres pool")

	// 1. Run full relational multi-tenant schema migration
	if err := MigrateSchema(ctx, pool); err != nil {
		log.Printf("⚠️ Warning during MigrateSchema: %v", err)
	}

	// 2. Seed regulatory frameworks, master obligations, and demo workspaces
	if err := SeedInitialData(ctx, pool); err != nil {
		log.Printf("⚠️ Warning during SeedInitialData: %v", err)
	}

	// 3. Seed blog, support, tickets, kb if empty
	if err := SeedSupportAndBlog(ctx, pool); err != nil {
		log.Printf("⚠️ Warning during SeedSupportAndBlog: %v", err)
	}

	return pool, nil
}

func SeedSupportAndBlog(ctx context.Context, pool *pgxpool.Pool) error {
	// Seed Blog Posts if empty
	var blogCount int
	pool.QueryRow(ctx, "SELECT COUNT(*) FROM blog_posts").Scan(&blogCount)
	if blogCount == 0 {
		seedBlogSQL := `
		INSERT INTO blog_posts (title, slug, excerpt, content, author_name, author_role, author_avatar, category, tags, read_time, status, cover_image, view_count, meta_title, meta_description)
		VALUES
		(
			'Navigating the 2026 Nigeria Tax Act: A Corporate Guide to Withholding, CIT, and TaxPro-MAX',
			'navigating-2026-nigeria-tax-act-corporate-guide',
			'Comprehensive operational breakdown of the sweeping 2026 Nigerian tax reforms and what managing directors must change in their monthly payroll and CIT calculations.',
			'# Navigating the 2026 Nigeria Tax Act\n\nThe Federal Government of Nigeria implemented the comprehensive Nigeria Tax Act with an effective enforcement date of January 1, 2026. This legislation consolidates corporate income tax (CIT), value-added tax (VAT), and digital service remittances into a unified administrative portal.\n\n### Key Statutory Changes\n\n1. **Zero-Rated Threshold Adjustments**: Small businesses with gross turnover below ₦50M are exempted from CIT, but mandatory digital return filings remain statutory under penalty of CAC de-listing.\n2. **TaxPro-MAX Real-Time Withholding**: Withholding tax certificates are now dynamically auto-credited to recipient Taxpayer Identification Numbers (TINs).\n3. **Monthly VAT Filing Deadline**: Returns remain strictly due on the 21st of every subsequent month via the digital single window.\n\n### Recommended Next Steps for Companies\n\nEnsure your financial statements are audited by an ICAN or CITN certified chartered accountant before the 6-month post-financial year cutoff.',
			'Tunde Bakare, CAMS',
			'Senior AML & Regulatory Officer',
			'/character1.jpg',
			'Taxation & FIRS',
			ARRAY['Tax Act 2026', 'FIRS', 'TaxPro-MAX', 'CIT'],
			'5 min read',
			'PUBLISHED',
			'/article_professional.jpg',
			0,
			'2026 Nigeria Tax Act: Corporate Guide to Withholding, CIT & TaxPro-MAX',
			'Operational guide for Nigerian managing directors and compliance officers navigating withholding tax and TaxPro-MAX 2026 reforms.'
		),
		(
			'The March 15 Statutory NDPC Filing Cutoff: Audit Preparation Checklist',
			'march-15-statutory-ndpc-filing-cutoff-audit-preparation',
			'Everything data controllers and compliance officers need to verify before submitting their annual compliance returns to the Nigeria Data Protection Commission.',
			'# Preparing for Your Annual NDPC Filing\n\nUnder the Nigeria Data Protection Act 2023, data controllers and processors of major importance must submit their annual data protection compliance audit return by March 15.\n\n### The 4 Pillars of a Verifiable Filing\n\n- **Record of Processing Activities (RoPA)**: An exhaustive inventory of all personal data categories stored.\n- **Data Protection Officer (DPO) Designation**: Officially lodged with the commission.\n- **Accredited DPCO Audit**: Only audits filed by licensed Data Protection Compliance Organisations are statutorily recognized.\n- **Staff Privacy Training Evidence**: Records showing active training of front-line staff on data privacy rights.',
			'Chiamaka Eze',
			'Principal Partner, Apex Advisory',
			'/character2.jpg',
			'Data Privacy & NDPA',
			ARRAY['NDPA 2023', 'NDPC', 'DPCO', 'RoPA'],
			'7 min read',
			'PUBLISHED',
			'/article_business.jpg',
			0,
			'March 15 Statutory NDPC Filing Cutoff: Audit Preparation Checklist',
			'Detailed checklist for data controllers submitting annual compliance returns to the Nigeria Data Protection Commission.'
		),
		(
			'SCUML Anti-Money Laundering Framework: Step-by-Step for DNFBPs in 2026',
			'scuml-anti-money-laundering-framework-dnfbps-2026',
			'Designated Non-Financial Businesses & Professions face heightened inspection scrutiny. Here is how to structure your internal AML/CFT controls.',
			'# Mastering SCUML AML/CFT Compliance\n\nThe Special Control Unit Against Money Laundering (SCUML) under the EFCC has instituted enhanced digital oversight over law firms, real estate developers, car dealerships, and accounting consultancies.\n\n### Immediate Requirements\n\n1. Appoint a designated Compliance Officer.\n2. Screen clients against international PEP and Sanctions registries.\n3. File mandatory Currency Transaction Reports (CTR) for transactions exceeding ₦5M for individuals or ₦10M for corporate bodies within 7 days.',
			'Tunde Bakare, CAMS',
			'Senior AML & Regulatory Officer',
			'/character1.jpg',
			'AML & SCUML',
			ARRAY['SCUML', 'AML', 'NFIU', 'PEP Screening'],
			'6 min read',
			'PUBLISHED',
			'/article_agency.jpg',
			0,
			'SCUML AML/CFT Compliance Framework for Nigerian DNFBPs (2026)',
			'Step-by-step guidance on EFCC SCUML registration, PEP screening, and CTR filing for Nigerian designated non-financial businesses.'
		);`
		pool.Exec(ctx, seedBlogSQL)
	}

	// Seed Blog Categories if empty
	var catCount int
	pool.QueryRow(ctx, "SELECT COUNT(*) FROM blog_categories").Scan(&catCount)
	if catCount == 0 {
		seedCatSQL := `
		INSERT INTO blog_categories (name, slug, description)
		VALUES
		('Taxation & FIRS', 'taxation-firs', 'Corporate income tax, withholding tax, TaxPro-MAX and 2026 Nigeria Tax Act regulations'),
		('Data Privacy & NDPA', 'data-privacy-ndpa', 'NDPA 2023 compliance, annual DPCO audits, RoPA and data subject rights'),
		('Corporate & CAC', 'corporate-cac', 'CAMA 2020 annual returns, PSC filings, share capital allotments and corporate governance'),
		('AML & SCUML', 'aml-scuml', 'EFCC SCUML registration, PEP screening, CTR/STR filing requirements for DNFBPs'),
		('Labour & Pension', 'labour-pension', 'PenCom remittances, NSITF, ITF statutory training levies and Nigerian Labour Law'),
		('Immigration & Expatriate', 'immigration-expatriate', 'Expatriate quota allocations, CERPAC, business permits and regulatory approvals')
		ON CONFLICT (name) DO NOTHING;`
		pool.Exec(ctx, seedCatSQL)
	}

	// Seed Blog Tags if empty
	var tagCount int
	pool.QueryRow(ctx, "SELECT COUNT(*) FROM blog_tags").Scan(&tagCount)
	if tagCount == 0 {
		seedTagSQL := `
		INSERT INTO blog_tags (name, slug)
		VALUES
		('Tax Act 2026', 'tax-act-2026'),
		('FIRS', 'firs'),
		('TaxPro-MAX', 'taxpro-max'),
		('CIT', 'cit'),
		('NDPA 2023', 'ndpa-2023'),
		('NDPC', 'ndpc'),
		('DPCO', 'dpco'),
		('RoPA', 'ropa'),
		('CAC', 'cac'),
		('CAMA 2020', 'cama-2020'),
		('Annual Returns', 'annual-returns'),
		('SCUML', 'scuml'),
		('AML/CFT', 'aml-cft'),
		('NFIU', 'nfiu'),
		('PenCom', 'pencom'),
		('PRA 2014', 'pra-2014')
		ON CONFLICT (name) DO NOTHING;`
		pool.Exec(ctx, seedTagSQL)
	}

	// Seed Support Tickets if empty
	var ticketCount int
	pool.QueryRow(ctx, "SELECT COUNT(*) FROM support_tickets").Scan(&ticketCount)
	if ticketCount == 0 {
		seedTicketsSQL := `
		INSERT INTO support_tickets (id, subject, description, customer_name, customer_email, company_name, rc_number, category, priority, status, assigned_to)
		VALUES
		(
			'TICK-2026-081',
			'Assistance with 2026 Withholding Tax Re-computation on TaxPro-MAX',
			'Our accounting software requires configuration advice for the updated withholding tax deductions under the 2026 Nigeria Tax Act regulations.',
			'Adaeze Nwosu',
			'adaeze@paywave.ng',
			'PayWave Technologies Ltd',
			'RC-1894231',
			'Taxation & FIRS',
			'HIGH',
			'IN_PROGRESS',
			'Tunde Bakare, CAMS'
		),
		(
			'TICK-2026-082',
			'CAC Annual Returns filing receipt pending generation',
			'Submitted our audited accounts 3 days ago. Looking to confirm when the stamped CAC certificate and active status update will reflect on the portal.',
			'Babajide Sanwo',
			'bsanwo@koboexpress.ng',
			'Kobo Logistics Ltd',
			'RC-1429910',
			'CAC & CAMA',
			'MEDIUM',
			'OPEN',
			'Support Lead'
		),
		(
			'TICK-2026-083',
			'DPCO Engagement for March 15 NDPC Statutory Audit',
			'We need to connect with an accredited DPCO to initiate our internal privacy impact assessment before the statutory cutoff.',
			'Fatima Al-Hassan',
			'fatima@zenithfin.ng',
			'Zenith Micro-Fintech Ltd',
			'RC-1992011',
			'Data Privacy & NDPA',
			'URGENT',
			'IN_PROGRESS',
			'Chiamaka Eze'
		);

		INSERT INTO ticket_replies (ticket_id, sender_name, sender_role, message)
		VALUES
		('TICK-2026-081', 'Adaeze Nwosu', 'CUSTOMER', 'Hello team, we are generating our January contractor disbursements and want to ensure our 5% withholding rate conforms to the digital TaxPro-MAX single window.'),
		('TICK-2026-081', 'Tunde Bakare, CAMS', 'STAFF', 'Hello Adaeze, under the 2026 Tax Act guidelines, tech services retain the 5% statutory withholding. Make sure the TIN is validated in the preview drawer before batch submit.'),
		('TICK-2026-082', 'Babajide Sanwo', 'CUSTOMER', 'Can you please review the attached filing submission? Thank you.'),
		('TICK-2026-083', 'Fatima Al-Hassan', 'CUSTOMER', 'Urgent compliance inquiry: our board meeting is on Friday and we need DPCO sign-off.');`
		pool.Exec(ctx, seedTicketsSQL)
	}

	// Seed Chat Sessions if empty
	var chatCount int
	pool.QueryRow(ctx, "SELECT COUNT(*) FROM chat_sessions").Scan(&chatCount)
	if chatCount == 0 {
		seedChatSQL := `
		INSERT INTO chat_sessions (id, visitor_name, visitor_email, visitor_company, status, assigned_staff, last_message)
		VALUES
		(
			'CHAT-7102',
			'Kenechukwu Obi',
			'kene@lagoshaulage.com',
			'Lagos Haulage Partners',
			'ACTIVE',
			'Chiamaka Eze',
			'Does our logistics business require a SCUML AML license?'
		),
		(
			'CHAT-7103',
			'Zainab Bello',
			'zbello@horizontech.ng',
			'Horizon Cloud Solutions',
			'ACTIVE',
			'Tunde Bakare',
			'How do we link our CAC portal with ComplianceHub automated calendar?'
		);

		INSERT INTO chat_messages (session_id, sender, sender_name, text)
		VALUES
		('CHAT-7102', 'visitor', 'Kenechukwu Obi', 'Hello! We run a road cargo and vehicle leasing company in Ikeja.'),
		('CHAT-7102', 'staff', 'Chiamaka Eze', 'Welcome Kenechukwu! Automotive dealers and leasing entities fall directly under DNFBPs under Section 30 of the Money Laundering Act.'),
		('CHAT-7102', 'visitor', 'Kenechukwu Obi', 'Does our logistics business require a SCUML AML license?'),
		('CHAT-7103', 'visitor', 'Zainab Bello', 'Hi there, we love the platform.'),
		('CHAT-7103', 'staff', 'Tunde Bakare', 'Glad to hear Zainab! You can enter your RC-Number in Settings -> CAC Connect to auto-sync your CAMA filings.'),
		('CHAT-7103', 'visitor', 'Zainab Bello', 'How do we link our CAC portal with ComplianceHub automated calendar?');`
		pool.Exec(ctx, seedChatSQL)
	}

	// Seed Knowledge Base if empty
	var kbCount int
	pool.QueryRow(ctx, "SELECT COUNT(*) FROM knowledge_articles").Scan(&kbCount)
	if kbCount == 0 {
		seedKBSQL := `
		INSERT INTO knowledge_articles (id, title, slug, category, excerpt, content, views)
		VALUES
		(
			'KB-01',
			'How to File CAC CAMA 2020 Annual Returns via ComplianceHub',
			'how-to-file-cac-annual-returns',
			'CAC & CAMA',
			'Step-by-step instructions for preparing audited financials, director resolutions, and executing automatic CAC filings.',
			'Full procedural guide for uploading statements of affairs, verifying shareholder shareholdings, and obtaining formal CAC filing certificates.',
			1240
		),
		(
			'KB-02',
			'Understanding 2026 Corporate Tax Filing Deadlines on TaxPro-MAX',
			'2026-tax-filing-deadlines-taxpro-max',
			'Taxation & FIRS',
			'Schedule of statutory deadlines for monthly VAT (21st), CIT (6 months post FYE), and PAYE remittances.',
			'Comprehensive schedule and statutory penalty calculator for late submissions on TaxPro-MAX.',
			890
		),
		(
			'KB-03',
			'Registering for SCUML Certificate: Documentation and NFIU Requirements',
			'scuml-certificate-registration-guide',
			'AML & SCUML',
			'Detailed checklist for DNFBPs: CAC incorporation status, tax clearance certificates, bank references, and AML compliance officer designation.',
			'Mandatory document checklist for law firms, estate agencies, car dealers, and consultants registering with the Special Control Unit Against Money Laundering.',
			1560
		),
		(
			'KB-04',
			'NDPA Compliance: Conducting Annual Data Protection Audits',
			'ndpa-annual-data-protection-audits',
			'Data Privacy',
			'Complete walkthrough of the statutory NDPC audit requirement for Nigerian companies processing citizen personal data.',
			'Detailed explanation of licensed DPCO filing processes, statutory summary templates, and March 15 submission guidelines.',
			740
		);`
		pool.Exec(ctx, seedKBSQL)
	}

	return nil
}
