package db

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func SeedInitialData(ctx context.Context, pool *pgxpool.Pool) error {
	// Check if already seeded
	var userCount int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&userCount); err != nil {
		return err
	}

	if userCount > 0 {
		return nil // Already seeded
	}

	log.Println("🌱 Seeding realistic Nigerian compliance regulatory framework and demo accounts...")

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
	);`
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
	);`
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
	);`
	if _, err := pool.Exec(ctx, usersSQL, pwStr); err != nil {
		log.Printf("⚠️ Users seed warning: %v", err)
	}

	// 4. Organisations
	orgsSQL := `
	INSERT INTO organisations (id, legal_name, trade_name, rc_number, tin, org_type, industry, state_of_operation, employee_bracket)
	VALUES
	(
		'44444444-4444-4444-4444-444444444401',
		'PayWave Technologies Ltd',
		'PayWave Africa',
		'RC-1894231',
		'24910291-0001',
		'BUSINESS',
		'FinTech & Digital Payments',
		'Lagos',
		'11-50'
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
		'11-50'
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
		'1-10'
	);`
	if _, err := pool.Exec(ctx, orgsSQL); err != nil {
		log.Printf("⚠️ Organisations seed warning: %v", err)
	}

	// 5. Tenants
	tenantsSQL := `
	INSERT INTO tenants (id, organisation_id, workspace_name, slug, plan_tier, compliance_score, is_active)
	VALUES
	(
		'55555555-5555-5555-5555-555555555501',
		'44444444-4444-4444-4444-444444444401',
		'PayWave Technologies Ltd',
		'paywave-technologies',
		'Professional',
		84,
		true
	),
	(
		'55555555-5555-5555-5555-555555555502',
		'44444444-4444-4444-4444-444444444402',
		'Apex Compliance Agency Workspace',
		'apex-compliance',
		'Agency Growth',
		96,
		true
	),
	(
		'55555555-5555-5555-5555-555555555503',
		'44444444-4444-4444-4444-444444444403',
		'Bakare GRC Practice Workspace',
		'bakare-grc',
		'Practice Plus',
		92,
		true
	);`
	if _, err := pool.Exec(ctx, tenantsSQL); err != nil {
		log.Printf("⚠️ Tenants seed warning: %v", err)
	}

	// 6. Tenant Members
	membersSQL := `
	INSERT INTO tenant_members (tenant_id, user_id, role, is_primary)
	VALUES
	('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333301', 'OWNER', true),
	('55555555-5555-5555-5555-555555555502', '33333333-3333-3333-3333-333333333303', 'OWNER', true),
	('55555555-5555-5555-5555-555555555503', '33333333-3333-3333-3333-333333333302', 'OWNER', true);`
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
	);`
	if _, err := pool.Exec(ctx, profilesSQL); err != nil {
		log.Printf("⚠️ Professional profiles seed warning: %v", err)
	}

	// 8. Engagements (Tunde Bakare managing PayWave Technologies)
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
	);

	INSERT INTO engagement_permissions (engagement_id, module_code, can_view, can_upload, can_approve, can_export)
	VALUES
	('77777777-7777-7777-7777-777777777701', 'hubcalendar', true, true, false, true),
	('77777777-7777-7777-7777-777777777701', 'hubdocs', true, true, false, true),
	('77777777-7777-7777-7777-777777777701', 'hubaml', true, true, true, true),
	('77777777-7777-7777-7777-777777777701', 'hubprivacy', true, false, false, false);`
	if _, err := pool.Exec(ctx, engagementsSQL); err != nil {
		log.Printf("⚠️ Engagements seed warning: %v", err)
	}

	// 9. Tenant Obligations for PayWave
	tenantObligationsSQL := `
	INSERT INTO tenant_obligations (tenant_id, obligation_id, title, authority, due_date, status, estimated_penalty_ngn, is_urgent)
	VALUES
	(
		'55555555-5555-5555-5555-555555555501',
		'22222222-2222-2222-2222-222222222202',
		'Monthly TaxPro-MAX VAT Remittance (January 2026)',
		'FIRS / NRS',
		'2026-02-21',
		'PENDING',
		50000,
		true
	),
	(
		'55555555-5555-5555-5555-555555555501',
		'22222222-2222-2222-2222-222222222203',
		'NDPC Statutory Data Protection Audit Submission',
		'NDPC',
		'2026-03-15',
		'PENDING',
		2500000,
		true
	),
	(
		'55555555-5555-5555-5555-555555555501',
		'22222222-2222-2222-2222-222222222201',
		'CAC Annual Returns Filing (Form CAC 19)',
		'CAC',
		'2026-06-30',
		'PENDING',
		25000,
		false
	),
	(
		'55555555-5555-5555-5555-555555555501',
		'22222222-2222-2222-2222-222222222205',
		'Monthly Contributory Pension Remittance',
		'PENCOM',
		'2026-02-14',
		'FILED',
		0,
		false
	);`
	if _, err := pool.Exec(ctx, tenantObligationsSQL); err != nil {
		log.Printf("⚠️ Tenant obligations seed warning: %v", err)
	}

	// 10. Sample Documents (Cloudinary Evidence Vault)
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
	);`
	if _, err := pool.Exec(ctx, docsSQL); err != nil {
		log.Printf("⚠️ Documents seed warning: %v", err)
	}

	// 11. Employees for PayWave
	employeesSQL := `
	INSERT INTO employees (tenant_id, full_name, email, role_title, department, employment_date, pension_pfa, pension_rsa_pin, ndpa_training_completed, aml_training_completed, compliance_clearance_status)
	VALUES
	(
		'55555555-5555-5555-5555-555555555501',
		'Emeka Okafor',
		'emeka@paywave.ng',
		'Head of Core Engineering',
		'Technology',
		'2023-03-01',
		'Stanbic IBTC Pension Managers',
		'PEN1008291029',
		true,
		true,
		'VERIFIED'
	),
	(
		'55555555-5555-5555-5555-555555555501',
		'Folake Daniels',
		'folake@paywave.ng',
		'Senior Operations & Settlement Lead',
		'Settlements',
		'2024-01-15',
		'ARM Pension Managers',
		'PEN2009182736',
		true,
		true,
		'VERIFIED'
	),
	(
		'55555555-5555-5555-5555-555555555501',
		'Ibrahim Musa',
		'ibrahim@paywave.ng',
		'Junior Frontend Developer',
		'Engineering',
		'2026-01-10',
		'Leadway Pensure PFA',
		'PEN4001928374',
		false,
		false,
		'PENDING'
	);`
	if _, err := pool.Exec(ctx, employeesSQL); err != nil {
		log.Printf("⚠️ Employees seed warning: %v", err)
	}

	// 12. Vendors for PayWave
	vendorsSQL := `
	INSERT INTO vendors (tenant_id, company_name, rc_number, tin, vendor_category, risk_level, tcc_verified, dpa_signed, compliance_score)
	VALUES
	(
		'55555555-5555-5555-5555-555555555501',
		'Kobo Logistics Nigeria Ltd',
		'RC-1429910',
		'19029102-0001',
		'Logistics & Courier Delivery',
		'LOW',
		true,
		true,
		95
	),
	(
		'55555555-5555-5555-5555-555555555501',
		'MainOne Cloud Infrastructure Ltd',
		'RC-9283741',
		'20192837-0001',
		'Cloud Hosting & Datacenter',
		'LOW',
		true,
		true,
		98
	),
	(
		'55555555-5555-5555-5555-555555555501',
		'Ikeja Facilities Management Partners',
		'BN-492019',
		'11029384-0001',
		'Facilities & Janitorial',
		'MEDIUM',
		false,
		false,
		60
	);`
	if _, err := pool.Exec(ctx, vendorsSQL); err != nil {
		log.Printf("⚠️ Vendors seed warning: %v", err)
	}

	// 13. AML Cases & RoPA for PayWave
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
	);`
	if _, err := pool.Exec(ctx, amlSQL); err != nil {
		log.Printf("⚠️ AML / Privacy seed warning: %v", err)
	}

	log.Println("✅ Complete Nigerian regulatory intelligence, multi-tenant workspaces, and demo records seeded successfully!")
	return nil
}
