package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

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
		INSERT INTO blog_posts (title, slug, excerpt, content, author_name, author_role, author_avatar, category, tags, read_time, status, cover_image)
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
			'/article_professional.jpg'
		),
		(
			'The March 15 Statutory NDPC Filing Cutoff: Audit Preparation Checklist',
			'march-15-statutory-ndpc-filing-cutoff-audit-preparation',
			'Everything data controllers and compliance officers need to verify before submitting their annual compliance returns to the Nigeria Data Protection Commission.',
			'# Preparing for Your Annual NDPC Filing\n\nUnder the Nigeria Data Protection Act 2023, data controllers and processors of major importance must submit their annual data protection compliance audit return by March 15.\n\n### The 4 Pillars of a Verifiable Filing\n\n- **Record of Processing Activities (RoPA)**: An exhaustive inventory of all personal data categories stored.\n- **Data Protection Officer (DPO) Designation**: Officially lodged with the commission.\n- **Accredited DPCO Audit**: Only audits filed by licensed Data Protection Compliance Organisations are statutorily recognized.\n- **Staff Privacy Training Evidence**: Records showing active training of front-line staff on data privacy rights.',
			'Chiamaka Eze',
			'Principal Partner, Apex Advisory',
			'/character2.jpg',
			'Data Privacy',
			ARRAY['NDPA 2023', 'NDPC', 'DPCO', 'RoPA'],
			'7 min read',
			'PUBLISHED',
			'/article_business.jpg'
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
			'/article_agency.jpg'
		);`
		pool.Exec(ctx, seedBlogSQL)
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
