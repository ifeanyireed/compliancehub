package db

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func SeedInitialData(ctx context.Context, pool *pgxpool.Pool) error {
	log.Println("🌱 Seeding realistic Nigerian compliance regulatory framework and multi-tenant workspaces...")

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	pwStr := string(hashedPassword)

	// 1. Regulatory Frameworks
	frameworksSQL := `
	INSERT INTO regulatory_frameworks (id, authority, statute_name, section_reference, official_source_url, frequency, applies_to_industries, penalty_formula)
	VALUES
	(
		'11111111-1111-1111-1111-111111111101',
		'CAC',
		'Companies and Allied Matters Act (CAMA) 2020',
		's.377',
		'https://cac.gov.ng',
		'ANNUAL',
		ARRAY['All', 'FinTech', 'Logistics', 'Retail', 'Healthcare', 'Manufacturing'],
		'₦5,000 per director per month of default + administrative strike-off warning'
	),
	(
		'11111111-1111-1111-1111-111111111102',
		'FIRS / NRS',
		'Nigeria Tax Act 2025/2026',
		's.22 & s.41',
		'https://firs.gov.ng',
		'MONTHLY',
		ARRAY['All', 'FinTech', 'Logistics', 'Retail', 'Financial Services'],
		'10% late filing surcharge + 5% statutory interest per annum'
	),
	(
		'11111111-1111-1111-1111-111111111103',
		'NDPC',
		'Nigeria Data Protection Act (NDPA) 2023',
		's.48 & GAID Framework',
		'https://ndpc.gov.ng',
		'ANNUAL',
		ARRAY['FinTech', 'Healthcare', 'E-commerce', 'Banking', 'Telecommunications'],
		'Statutory sanction up to ₦10,000,000 or 2% of annual gross turnover'
	),
	(
		'11111111-1111-1111-1111-111111111104',
		'SCUML',
		'Money Laundering (Prevention and Prohibition) Act 2022',
		's.30 & SCUML Regulations 2023',
		'https://scuml.efcc.gov.ng',
		'ANNUAL',
		ARRAY['FinTech', 'Legal', 'Real Estate', 'Consulting', 'Automotive', 'Casinos'],
		'₦1,000,000 fine per day of non-compliance and revocation of SCUML clearance certificate'
	),
	(
		'11111111-1111-1111-1111-111111111105',
		'PENCOM',
		'Pension Reform Act 2014',
		's.11',
		'https://pencom.gov.ng',
		'MONTHLY',
		ARRAY['All'],
		'Not less than 2% penalty of unremitted amount per month'
	)
	ON CONFLICT (id) DO NOTHING;`
	if _, err := pool.Exec(ctx, frameworksSQL); err != nil {
		log.Printf("⚠️ Frameworks seed warning: %v", err)
	}

	// 2. Master Obligations
	obligationsSQL := `
	INSERT INTO obligations (id, framework_id, title, authority, description, statutory_ref, default_frequency, required_evidence_type, is_statutory)
	VALUES
	(
		'22222222-2222-2222-2222-222222222201',
		'11111111-1111-1111-1111-111111111101',
		'CAC Annual Returns Filing (Form CAC 19)',
		'CAC',
		'Statutory filing of audited financial accounts and return of allotment within 42 days of AGM.',
		'CAMA 2020 s.377',
		'ANNUAL',
		'CAC Acknowledgment Receipt & Stamped Form CAC 19',
		true
	),
	(
		'22222222-2222-2222-2222-222222222202',
		'11111111-1111-1111-1111-111111111102',
		'Monthly Value Added Tax (VAT) Remittance',
		'FIRS / NRS',
		'Monthly reconciliation and digital filing on TaxPro-MAX portal by the 21st day of the subsequent month.',
		'Nigeria Tax Act 2026 s.14',
		'MONTHLY',
		'TaxPro-MAX Payment Assessment Slip & Remita RRR Receipt',
		true
	),
	(
		'22222222-2222-2222-2222-222222222203',
		'11111111-1111-1111-1111-111111111103',
		'Statutory NDPA Annual Data Protection Audit Return',
		'NDPC',
		'Mandatory filing of privacy audit report conducted by a licensed Data Protection Compliance Organisation (DPCO).',
		'NDPA 2023 s.48',
		'ANNUAL',
		'DPCO Verified Audit Summary & NDPC Filing Seal',
		true
	),
	(
		'22222222-2222-2222-2222-222222222204',
		'11111111-1111-1111-1111-111111111104',
		'Annual SCUML Anti-Money Laundering Return',
		'SCUML',
		'Annual reporting on designated non-financial operations, KYC verification logs, and staff AML training.',
		'MLPPA 2022 s.30',
		'ANNUAL',
		'SCUML Portal Confirmation & NFIU Receipt',
		true
	),
	(
		'22222222-2222-2222-2222-222222222205',
		'11111111-1111-1111-1111-111111111105',
		'Monthly Contributory Pension Remittance',
		'PENCOM',
		'Remittance of 10% employer and 8% employee pension contributions to licensed PFAs within 7 days of salary payment.',
		'PRA 2014 s.11',
		'MONTHLY',
		'PFA Schedule Confirmation & Bank Stamp',
		true
	)
	ON CONFLICT (id) DO NOTHING;`
	if _, err := pool.Exec(ctx, obligationsSQL); err != nil {
		log.Printf("⚠️ Obligations seed warning: %v", err)
	}

	// 3. Demo Users
	usersSQL := `
	INSERT INTO users (id, email, password_hash, full_name, phone, title, avatar_url, system_role, is_email_verified)
	VALUES
	(
		'33333333-3333-3333-3333-333333333301',
		'adaeze@paywave.ng',
		$1,
		'Adaeze Nwosu',
		'+234 803 111 2233',
		'Managing Director',
		'/character3.jpg',
		'USER',
		true
	),
	(
		'33333333-3333-3333-3333-333333333302',
		'tunde@bakarecompliance.com',
		$1,
		'Tunde Bakare, CAMS',
		'+234 802 444 5566',
		'Senior AML & Regulatory Officer',
		'/character1.jpg',
		'USER',
		true
	),
	(
		'33333333-3333-3333-3333-333333333303',
		'chiamaka@apexcompliance.ng',
		$1,
		'Chiamaka Eze',
		'+234 818 777 8899',
		'Principal Partner',
		'/character2.jpg',
		'USER',
		true
	),
	(
		'33333333-3333-3333-3333-333333333304',
		'bsanwo@compliancehub.ng',
		$1,
		'Babajide Sanwo',
		'+234 705 999 0011',
		'Senior Compliance Support Specialist',
		'/character4.jpg',
		'STAFF',
		true
	),
	(
		'33333333-3333-3333-3333-333333333305',
		'admin@compliancehub.ng',
		$1,
		'Dr. Olumide Adeleke',
		'+234 809 333 4455',
		'Super Administrator & Compliance Director',
		'/character5.jpg',
		'ADMIN',
		true
	),
	(
		'33333333-3333-3333-3333-333333333306',
		'folashade@adelekelegal.ng',
		$1,
		'Barr. Folashade Adeleke, CDPO',
		'+234 803 999 4422',
		'Licensed DPCO Partner',
		'/character2.jpg',
		'USER',
		true
	),
	(
		'33333333-3333-3333-3333-333333333307',
		'emeka@okonkwoaudit.ng',
		$1,
		'Emeka Okonkwo, FCA',
		'+234 805 111 7788',
		'Lead Tax & Financial Auditor',
		'/character3.jpg',
		'USER',
		true
	),
	(
		'33333333-3333-3333-3333-333333333308',
		'amina@danjumacac.ng',
		$1,
		'Amina Danjuma',
		'+234 812 333 8899',
		'Corporate Secretarial Associate',
		'/character4.jpg',
		'USER',
		true
	)
	ON CONFLICT (email) DO NOTHING;`
	if _, err := pool.Exec(ctx, usersSQL, pwStr); err != nil {
		log.Printf("⚠️ Users seed warning: %v", err)
	}

	// 4. Organisations
	orgsSQL := `
	INSERT INTO organisations (id, legal_name, trade_name, rc_number, tin, org_type, industry, state_of_operation, employee_bracket, address)
	VALUES
	(
		'44444444-4444-4444-4444-444444444401',
		'PayWave Technologies Ltd',
		'PayWave Africa',
		'RC-1894231',
		'24910291-0001',
		'BUSINESS',
		'Fintech & Digital Payments',
		'Lagos',
		'11-50',
		'Plot 12, Adeola Odeku Street, Victoria Island, Lagos'
	),
	(
		'44444444-4444-4444-4444-444444444402',
		'Apex Compliance Advisory Partners Ltd',
		'Apex Advisory',
		'RC-1402911',
		'18029910-0001',
		'AGENCY',
		'Legal & Regulatory Compliance Consulting',
		'Lagos',
		'11-50',
		'7B Admiralty Way, Lekki Phase 1, Lagos'
	),
	(
		'44444444-4444-4444-4444-444444444403',
		'Bakare Compliance Consultancy',
		'Bakare GRC Advisory',
		'BN-3920192',
		'30920191-0001',
		'PRACTICE',
		'AML / CFT & Regulatory Practice',
		'Lagos',
		'1-10',
		'24 Kofo Abayomi Street, Victoria Island, Lagos'
	),
	(
		'44444444-4444-4444-4444-444444444404',
		'Prime Haulage & Logistics Ltd',
		'Prime Haulage',
		'RC-1423891',
		'17829102-0001',
		'BUSINESS',
		'Supply Chain & Logistics',
		'Rivers (Port Harcourt)',
		'51-200',
		'Trans-Amadi Industrial Layout, Port Harcourt, Rivers State'
	),
	(
		'44444444-4444-4444-4444-444444444405',
		'Swift Health HMO Ltd',
		'Swift Health',
		'RC-1928340',
		'22019283-0001',
		'BUSINESS',
		'Healthcare & HMO',
		'FCT Abuja',
		'51-200',
		'Constitution Avenue, Central Business District, Abuja'
	),
	(
		'44444444-4444-4444-4444-444444444406',
		'Zenith Retail Chains Ltd',
		'Zenith Retail',
		'RC-1102938',
		'10928374-0001',
		'BUSINESS',
		'Consumer Goods & DNFBP',
		'Lagos',
		'201-500',
		'14 Commercial Avenue, Ikeja, Lagos'
	),
	(
		'44444444-4444-4444-4444-444444444407',
		'Nexa Agro Export Processing Ltd',
		'Nexa Agro',
		'RC-1654320',
		'31029384-0001',
		'BUSINESS',
		'Agro-Processing & Commodity Export',
		'Kano',
		'51-200',
		'Bompai Industrial Area, Kano'
	)
	ON CONFLICT (id) DO NOTHING;`
	if _, err := pool.Exec(ctx, orgsSQL); err != nil {
		log.Printf("⚠️ Organisations seed warning: %v", err)
	}

	// 5. Tenants
	tenantsSQL := `
	INSERT INTO tenants (id, organisation_id, workspace_name, slug, plan_tier, compliance_score, is_active, address)
	VALUES
	(
		'55555555-5555-5555-5555-555555555501',
		'44444444-4444-4444-4444-444444444401',
		'PayWave Technologies Ltd',
		'paywave-technologies',
		'Professional',
		84,
		true,
		'Plot 12, Adeola Odeku Street, Victoria Island, Lagos'
	),
	(
		'55555555-5555-5555-5555-555555555502',
		'44444444-4444-4444-4444-444444444402',
		'Apex Compliance Agency Workspace',
		'apex-compliance',
		'Agency Growth',
		96,
		true,
		'7B Admiralty Way, Lekki Phase 1, Lagos'
	),
	(
		'55555555-5555-5555-5555-555555555503',
		'44444444-4444-4444-4444-444444444403',
		'Bakare GRC Practice Workspace',
		'bakare-grc',
		'Practice Plus',
		92,
		true,
		'24 Kofo Abayomi Street, Victoria Island, Lagos'
	),
	(
		'55555555-5555-5555-5555-555555555504',
		'44444444-4444-4444-4444-444444444404',
		'Prime Haulage & Logistics Ltd',
		'prime-haulage',
		'Business',
		68,
		true,
		'Trans-Amadi Industrial Layout, Port Harcourt, Rivers State'
	),
	(
		'55555555-5555-5555-5555-555555555505',
		'44444444-4444-4444-4444-444444444405',
		'Swift Health HMO Ltd',
		'swift-health',
		'Enterprise',
		92,
		true,
		'Constitution Avenue, Central Business District, Abuja'
	),
	(
		'55555555-5555-5555-5555-555555555506',
		'44444444-4444-4444-4444-444444444406',
		'Zenith Retail Chains Ltd',
		'zenith-retail',
		'Enterprise',
		74,
		true,
		'14 Commercial Avenue, Ikeja, Lagos'
	),
	(
		'55555555-5555-5555-5555-555555555507',
		'44444444-4444-4444-4444-444444444407',
		'Nexa Agro Export Processing Ltd',
		'nexa-agro',
		'Business',
		61,
		true,
		'Bompai Industrial Area, Kano'
	)
	ON CONFLICT (id) DO NOTHING;`
	if _, err := pool.Exec(ctx, tenantsSQL); err != nil {
		log.Printf("⚠️ Tenants seed warning: %v", err)
	}

	// 6. Tenant Members
	membersSQL := `
	INSERT INTO tenant_members (tenant_id, user_id, role, is_primary)
	VALUES
	('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333301', 'OWNER', true),
	('55555555-5555-5555-5555-555555555502', '33333333-3333-3333-3333-333333333303', 'OWNER', true),
	('55555555-5555-5555-5555-555555555503', '33333333-3333-3333-3333-333333333302', 'OWNER', true),
	('55555555-5555-5555-5555-555555555504', '33333333-3333-3333-3333-333333333301', 'OWNER', false),
	('55555555-5555-5555-5555-555555555505', '33333333-3333-3333-3333-333333333301', 'OWNER', false),
	('55555555-5555-5555-5555-555555555506', '33333333-3333-3333-3333-333333333301', 'OWNER', false),
	('55555555-5555-5555-5555-555555555507', '33333333-3333-3333-3333-333333333301', 'OWNER', false)
	ON CONFLICT (tenant_id, user_id) DO NOTHING;`
	if _, err := pool.Exec(ctx, membersSQL); err != nil {
		log.Printf("⚠️ Tenant members seed warning: %v", err)
	}

	// 7. Professional Profiles
	profilesSQL := `
	INSERT INTO professional_profiles (id, user_id, firm_name, qualification, years_experience, specialisations, hourly_rate_ngn, monthly_retainer_ngn, bio, verification_status, active_clients_count)
	VALUES
	(
		'66666666-6666-6666-6666-666666666601',
		'33333333-3333-3333-3333-333333333302',
		'Bakare Compliance Consultancy',
		'CAMS, FCA, FCIS',
		12,
		ARRAY['AML/CFT', 'SCUML Filings', 'Fintech Licensing', 'FIRS TaxPro-MAX'],
		35000,
		250000,
		'Certified Anti-Money Laundering Specialist with 12+ years experience advising Nigerian commercial banks and tier-1 fintechs on NFIU directives and CBN risk-based frameworks.',
		'VERIFIED',
		14
	),
	(
		'66666666-6666-6666-6666-666666666602',
		'33333333-3333-3333-3333-333333333303',
		'Apex Compliance Advisory Partners Ltd',
		'BL, LL.M, CDPO',
		10,
		ARRAY['NDPA 2023', 'DPCO Audits', 'Corporate Governance', 'CAMA 2020'],
		45000,
		350000,
		'Licensed Data Protection Compliance Officer (DPCO) and Barrister with extensive experience structuring cross-border processing agreements and regulatory defence.',
		'VERIFIED',
		22
	),
	(
		'66666666-6666-6666-6666-666666666603',
		'33333333-3333-3333-3333-333333333306',
		'Adeleke & Partners Legal Practitioners',
		'BL, CDPO, LL.M',
		10,
		ARRAY['NDPA 2023 Statutory Audits', 'Privacy Impact Assessments', 'Data Subject Rights', 'Cross-Border Transfers'],
		40000,
		300000,
		'Advising Nigerias largest health-tech and eCommerce operators on statutory privacy accountability under the NDPA 2023. Over 100+ successful NDPC compliance audit returns filed.',
		'VERIFIED',
		8
	),
	(
		'66666666-6666-6666-6666-666666666604',
		'33333333-3333-3333-3333-333333333307',
		'Okonkwo & Associates Chartered Accountants',
		'FCA, FCTI',
		16,
		ARRAY['Nigeria Tax Act 2025/2026', 'FIRS TaxPro-MAX Audits', 'Transfer Pricing', 'Tax Clearance TCC'],
		45000,
		280000,
		'Leading expert on the 2026 Nigerian tax modernisation transition. Handles corporate restructuring, withholding tax rectifications, and statutory year-end audit closures.',
		'VERIFIED',
		11
	),
	(
		'66666666-6666-6666-6666-666666666605',
		'33333333-3333-3333-3333-333333333308',
		'Danjuma Corporate Services',
		'ICSAN, LL.B',
		8,
		ARRAY['CAC CAMA 2020 Annual Returns', 'Beneficial Ownership Register', 'Board Secretarial', 'Capital Alterations'],
		28000,
		180000,
		'Accredited CAC practitioner ensuring frictionless annual filings, changes in directorships, share capital adjustments, and total statutory compliance under CAMA 2020.',
		'VERIFIED',
		6
	)
	ON CONFLICT (id) DO NOTHING;`
	if _, err := pool.Exec(ctx, profilesSQL); err != nil {
		log.Printf("⚠️ Professional profiles seed warning: %v", err)
	}

	// 8. Engagements (Connecting professionals to client workspaces)
	engagementsSQL := `
	INSERT INTO engagements (id, tenant_id, professional_id, engagement_type, scope_summary, monthly_fee_ngn, start_date, status)
	VALUES
	(
		'77777777-7777-7777-7777-777777777701',
		'55555555-5555-5555-5555-555555555501',
		'66666666-6666-6666-6666-666666666601',
		'FRACTIONAL_OFFICER',
		'Fractional Chief Compliance Officer managing AML/CFT oversight, SCUML quarterly filings, and statutory monthly tax reconciliations on TaxPro-MAX.',
		250000,
		'2025-01-01',
		'ACTIVE'
	),
	(
		'77777777-7777-7777-7777-777777777702',
		'55555555-5555-5555-5555-555555555504',
		'66666666-6666-6666-6666-666666666601',
		'FRACTIONAL_OFFICER',
		'Logistics compliance, port operating transit permits, and statutory driver safety certifications.',
		180000,
		'2025-03-01',
		'ACTIVE'
	),
	(
		'77777777-7777-7777-7777-777777777703',
		'55555555-5555-5555-5555-555555555505',
		'66666666-6666-6666-6666-666666666603',
		'STATUTORY_AUDITOR',
		'Healthcare patient health records privacy audit under NDPA 2023 and NHIA statutory registration.',
		300000,
		'2025-02-15',
		'ACTIVE'
	),
	(
		'77777777-7777-7777-7777-777777777704',
		'55555555-5555-5555-5555-555555555506',
		'66666666-6666-6666-6666-666666666601',
		'FRACTIONAL_OFFICER',
		'Retail cash threshold AML reporting under SCUML and supplier vendor DPA contracts.',
		220000,
		'2025-04-01',
		'ACTIVE'
	),
	(
		'77777777-7777-7777-7777-777777777705',
		'55555555-5555-5555-5555-555555555507',
		'66666666-6666-6666-6666-666666666605',
		'STATUTORY_AUDITOR',
		'NEPC commodity export licensing and CAMA annual filing returns.',
		150000,
		'2025-05-01',
		'ACTIVE'
	)
	ON CONFLICT (id) DO NOTHING;`
	if _, err := pool.Exec(ctx, engagementsSQL); err != nil {
		log.Printf("⚠️ Engagements seed warning: %v", err)
	}

	// 9. Tenant Obligations across Workspaces
	tenantObligationsSQL := `
	INSERT INTO tenant_obligations (tenant_id, obligation_id, title, authority, due_date, status, estimated_penalty_ngn, is_urgent)
	VALUES
	-- PayWave
	('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222202', 'Monthly TaxPro-MAX VAT Remittance (Current Month)', 'FIRS / NRS', '2026-02-21', 'PENDING', 50000, true),
	('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222203', 'NDPC Statutory Data Protection Audit Submission', 'NDPC', '2026-03-15', 'PENDING', 2500000, true),
	('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222201', 'CAC Annual Returns Filing (Form CAC 19)', 'CAC', '2026-06-30', 'PENDING', 25000, false),
	('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222205', 'Monthly Contributory Pension Remittance', 'PENCOM', '2026-02-14', 'FILED', 0, false),
	-- Prime Haulage
	('55555555-5555-5555-5555-555555555504', '22222222-2222-2222-2222-222222222202', 'Monthly Interstate Haulage VAT Remittance', 'FIRS / NRS', '2026-02-21', 'PENDING', 75000, true),
	('55555555-5555-5555-5555-555555555504', '22222222-2222-2222-2222-222222222201', 'Port Transit Operating Permit Renewal', 'CAC', '2026-02-28', 'PENDING', 120000, true),
	-- Swift Health HMO
	('55555555-5555-5555-5555-555555555505', '22222222-2222-2222-2222-222222222203', 'Statutory NHIA Health Records Privacy Filing', 'NDPC', '2026-03-15', 'PENDING', 1500000, true),
	('55555555-5555-5555-5555-555555555505', '22222222-2222-2222-2222-222222222201', 'CAC Annual Returns Filing (CAMA 2020)', 'CAC', '2026-06-30', 'FILED', 0, false),
	-- Zenith Retail Chains
	('55555555-5555-5555-5555-555555555506', '22222222-2222-2222-2222-222222222204', 'SCUML Q1 Cash Transaction Reporting (CTR)', 'SCUML', '2026-03-31', 'PENDING', 500000, true),
	('55555555-5555-5555-5555-555555555506', '22222222-2222-2222-2222-222222222202', 'Retail Branch VAT Digital Consolidation', 'FIRS / NRS', '2026-02-21', 'PENDING', 100000, false);`
	
	var existingObligationCount int
	_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM tenant_obligations").Scan(&existingObligationCount)
	if existingObligationCount == 0 {
		if _, err := pool.Exec(ctx, tenantObligationsSQL); err != nil {
			log.Printf("⚠️ Tenant obligations seed warning: %v", err)
		}
	}

	// 10. Sample Documents (Cloudinary Evidence Vault)
	var existingDocsCount int
	_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM documents").Scan(&existingDocsCount)
	if existingDocsCount == 0 {
		docsSQL := `
		INSERT INTO documents (tenant_id, name, category, cloudinary_public_id, cloudinary_secure_url, file_format, file_size_bytes, version, verification_status, expiry_date, is_expiring_soon, uploaded_by)
		VALUES
		(
			'55555555-5555-5555-5555-555555555501',
			'CAC Certificate of Incorporation & Status Report (Form CAC 07)',
			'Corporate',
			'compliancehub/tenants/paywave/cac_cert_2024',
			'https://res.cloudinary.com/yugcjpau/image/upload/v1/compliancehub/samples/cac_certificate.pdf',
			'pdf',
			2481020,
			'v1.2',
			'VERIFIED',
			'2099-12-31',
			false,
			'33333333-3333-3333-3333-333333333301'
		),
		(
			'55555555-5555-5555-5555-555555555501',
			'Nigeria Tax Act 2025/2026 TaxPro-MAX Transition Filing Record',
			'Tax',
			'compliancehub/tenants/paywave/taxpromax_receipt',
			'https://res.cloudinary.com/yugcjpau/image/upload/v1/compliancehub/samples/tax_filing.pdf',
			'pdf',
			1140920,
			'v2.0',
			'VERIFIED',
			'2026-06-30',
			true,
			'33333333-3333-3333-3333-333333333301'
		),
		(
			'55555555-5555-5555-5555-555555555501',
			'SCUML Anti-Money Laundering Compliance Clearance Certificate',
			'AML / KYC',
			'compliancehub/tenants/paywave/scuml_clearance',
			'https://res.cloudinary.com/yugcjpau/image/upload/v1/compliancehub/samples/scuml_certificate.pdf',
			'pdf',
			3201940,
			'v1.0',
			'VERIFIED',
			'2026-09-30',
			false,
			'33333333-3333-3333-3333-333333333301'
		),
		(
			'55555555-5555-5555-5555-555555555504',
			'Federal Ministry of Transport Interstate Haulage License',
			'Corporate',
			'compliancehub/tenants/primehaul/haulage_license',
			'https://res.cloudinary.com/yugcjpau/image/upload/v1/compliancehub/samples/cac_certificate.pdf',
			'pdf',
			1802910,
			'v1.0',
			'VERIFIED',
			'2026-11-30',
			false,
			'33333333-3333-3333-3333-333333333301'
		),
		(
			'55555555-5555-5555-5555-555555555505',
			'National Health Insurance Authority (NHIA) Operational Accreditation',
			'Corporate',
			'compliancehub/tenants/swifthmo/nhia_accreditation',
			'https://res.cloudinary.com/yugcjpau/image/upload/v1/compliancehub/samples/cac_certificate.pdf',
			'pdf',
			2109283,
			'v3.1',
			'VERIFIED',
			'2027-01-31',
			false,
			'33333333-3333-3333-3333-333333333301'
		);`
		if _, err := pool.Exec(ctx, docsSQL); err != nil {
			log.Printf("⚠️ Documents seed warning: %v", err)
		}
	}

	// 11. Employees across Workspaces
	var existingEmpCount int
	_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM employees").Scan(&existingEmpCount)
	if existingEmpCount == 0 {
		employeesSQL := `
		INSERT INTO employees (tenant_id, full_name, email, role_title, department, employment_date, pension_pfa, pension_rsa_pin, ndpa_training_completed, aml_training_completed, compliance_clearance_status)
		VALUES
		-- PayWave
		('55555555-5555-5555-5555-555555555501', 'Emeka Okafor', 'emeka@paywave.ng', 'Head of Core Engineering', 'Technology', '2023-03-01', 'Stanbic IBTC Pension Managers', 'PEN1008291029', true, true, 'VERIFIED'),
		('55555555-5555-5555-5555-555555555501', 'Folake Daniels', 'folake@paywave.ng', 'Senior Operations & Settlement Lead', 'Settlements', '2024-01-15', 'ARM Pension Managers', 'PEN2009182736', true, true, 'VERIFIED'),
		('55555555-5555-5555-5555-555555555501', 'Ibrahim Musa', 'ibrahim@paywave.ng', 'Junior Frontend Developer', 'Engineering', '2026-01-10', 'Leadway Pensure PFA', 'PEN4001928374', false, false, 'PENDING'),
		-- Prime Haulage
		('55555555-5555-5555-5555-555555555504', 'Captain Tari Briggs', 'tari@primehaul.ng', 'Fleet Safety Director', 'Logistics Operations', '2022-08-01', 'Premium Pension Limited', 'PEN3009182731', true, true, 'VERIFIED'),
		('55555555-5555-5555-5555-555555555504', 'Ngozi Amadi', 'ngozi@primehaul.ng', 'Logistics Operations Dispatcher', 'Dispatch', '2024-05-12', 'Stanbic IBTC Pension', 'PEN5001928374', true, false, 'VERIFIED'),
		-- Swift Health HMO
		('55555555-5555-5555-5555-555555555505', 'Dr. Aliyu Mohammed', 'aliyu@swifthmo.ng', 'Chief Medical Officer', 'Clinical Governance', '2021-11-01', 'Trustfund Pensions', 'PEN8001928372', true, true, 'VERIFIED');`
		if _, err := pool.Exec(ctx, employeesSQL); err != nil {
			log.Printf("⚠️ Employees seed warning: %v", err)
		}
	}

	// 12. Vendors across Workspaces
	var existingVendorCount int
	_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM vendors").Scan(&existingVendorCount)
	if existingVendorCount == 0 {
		vendorsSQL := `
		INSERT INTO vendors (tenant_id, company_name, rc_number, tin, vendor_category, risk_level, tcc_verified, dpa_signed, compliance_score)
		VALUES
		-- PayWave
		('55555555-5555-5555-5555-555555555501', 'Kobo Logistics Nigeria Ltd', 'RC-1429910', '19029102-0001', 'Logistics & Courier Delivery', 'LOW', true, true, 95),
		('55555555-5555-5555-5555-555555555501', 'MainOne Cloud Infrastructure Ltd', 'RC-9283741', '20192837-0001', 'Cloud Hosting & Datacenter', 'LOW', true, true, 98),
		('55555555-5555-5555-5555-555555555501', 'Ikeja Facilities Management Partners', 'BN-492019', '11029384-0001', 'Facilities & Janitorial', 'MEDIUM', false, false, 60),
		-- Prime Haulage
		('55555555-5555-5555-5555-555555555504', 'TotalEnergies Lubricants Nigeria', 'RC-182910', '10029384-0001', 'Fleet Fuel & Maintenance', 'LOW', true, true, 92),
		-- Swift Health HMO
		('55555555-5555-5555-5555-555555555505', 'MedSecure Electronic Health Records Ltd', 'RC-169201', '24910291-0002', 'Healthcare Cloud Software', 'LOW', true, true, 96);`
		if _, err := pool.Exec(ctx, vendorsSQL); err != nil {
			log.Printf("⚠️ Vendors seed warning: %v", err)
		}
	}

	// 13. AML Cases & RoPA
	var existingAmlCount int
	_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM aml_cases").Scan(&existingAmlCount)
	if existingAmlCount == 0 {
		amlSQL := `
		INSERT INTO aml_cases (tenant_id, entity_name, case_type, risk_severity, status, case_notes)
		VALUES
		(
			'55555555-5555-5555-5555-555555555501',
			'Bello Trading Enterprise (Merchant Account)',
			'PEP_SCREENING',
			'MEDIUM',
			'IN_REVIEW',
			'High-velocity transaction alerts detected from sub-account. PEP screening match on beneficial owner requires Tier 3 source-of-wealth documentation.'
		),
		(
			'55555555-5555-5555-5555-555555555501',
			'Oluwaseun Adeleke',
			'SANCTION_MATCH',
			'LOW',
			'CLEARED',
			'Name match false positive against NFIU watchlist. National ID (NIN) verified clear.'
		),
		(
			'55555555-5555-5555-5555-555555555506',
			'Al-Baraka Wholesale Cash Merchant',
			'CASH_THRESHOLD',
			'HIGH',
			'OPEN',
			'Exceeded N5,000,000 statutory cash transaction limit under SCUML regulation.'
		);

		INSERT INTO privacy_processing_activities (tenant_id, activity_name, purpose, data_categories, data_subjects, lawful_basis, retention_period, cross_border_transfer, dpco_audit_ready)
		VALUES
		(
			'55555555-5555-5555-5555-555555555501',
			'Customer KYC & Biometric Verification',
			'Fulfillment of CBN & NFIU statutory CDD guidelines prior to wallet activation',
			ARRAY['Full Name', 'BVN / NIN', 'Facial Biometrics', 'Government ID', 'Address'],
			ARRAY['Retail Consumers', 'Merchant Directors'],
			'LEGAL_OBLIGATION',
			'5 years post-account closure (CAMA 2020 & MLPPA 2022)',
			false,
			true
		),
		(
			'55555555-5555-5555-5555-555555555501',
			'Employee Payroll & Tax Administration',
			'Payment of monthly salaries, PAYE tax deduction to State BIR, and pension remittance',
			ARRAY['Name', 'TIN', 'Bank Account Details', 'RSA PIN', 'Salary'],
			ARRAY['Full-time Employees', 'Contractors'],
			'CONTRACT',
			'6 years post-employment (Nigeria Tax Act 2026)',
			false,
			true
		);`
		if _, err := pool.Exec(ctx, amlSQL); err != nil {
			log.Printf("⚠️ AML / Privacy seed warning: %v", err)
		}
	}

	// 14. Invoices & Billing
	invoicesSQL := `
	INSERT INTO invoices (invoice_number, tenant_id, client_name, amount_ngn, invoice_type, status, payout_ref, due_date, paid_at)
	VALUES
	(
		'INV-2026-0001',
		'55555555-5555-5555-5555-555555555501',
		'PayWave Technologies Ltd',
		250000.00,
		'RETAINER',
		'SETTLED',
		'PSTK_TR_849102',
		'2026-02-01',
		'2026-02-01 10:15:00+01'
	),
	(
		'INV-2026-0002',
		'55555555-5555-5555-5555-555555555505',
		'Swift Health HMO Ltd',
		300000.00,
		'RETAINER',
		'SETTLED',
		'PSTK_TR_849103',
		'2026-02-01',
		'2026-02-01 11:30:00+01'
	),
	(
		'INV-2026-0003',
		'55555555-5555-5555-5555-555555555506',
		'Zenith Retail Chains Ltd',
		220000.00,
		'RETAINER',
		'SETTLED',
		'PSTK_TR_849104',
		'2026-02-01',
		'2026-02-02 09:45:00+01'
	),
	(
		'INV-2026-0004',
		'55555555-5555-5555-5555-555555555504',
		'Prime Haulage & Logistics Ltd',
		180000.00,
		'RETAINER',
		'DISBURSED',
		'PSTK_TR_849105',
		'2026-02-01',
		'2026-02-03 14:00:00+01'
	)
	ON CONFLICT (invoice_number) DO NOTHING;`
	if _, err := pool.Exec(ctx, invoicesSQL); err != nil {
		log.Printf("⚠️ Invoices seed warning: %v", err)
	}

	log.Println("✅ Complete Nigerian regulatory intelligence, multi-tenant workspaces, and demo records seeded successfully!")
	return nil
}
