package db

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func MigrateSchema(ctx context.Context, pool *pgxpool.Pool) error {
	queries := []string{
		// Extensions
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
		`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,

		// 1. Users
		`CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			full_name VARCHAR(255) NOT NULL,
			phone VARCHAR(50),
			title VARCHAR(100),
			avatar_url TEXT,
			system_role VARCHAR(50) NOT NULL DEFAULT 'USER',
			is_email_verified BOOLEAN DEFAULT FALSE,
			mfa_enabled BOOLEAN DEFAULT FALSE,
			mfa_secret TEXT,
			created_at TIMESTAMPTZ DEFAULT NOW(),
			updated_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		// 2. Organisations
		`CREATE TABLE IF NOT EXISTS organisations (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			legal_name VARCHAR(255) NOT NULL,
			trade_name VARCHAR(255),
			rc_number VARCHAR(100),
			tin VARCHAR(100),
			org_type VARCHAR(50) NOT NULL,
			industry VARCHAR(100),
			state_of_operation VARCHAR(100),
			employee_bracket VARCHAR(50),
			created_at TIMESTAMPTZ DEFAULT NOW(),
			updated_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		// 3. Tenants (Workspaces)
		`CREATE TABLE IF NOT EXISTS tenants (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
			workspace_name VARCHAR(255) NOT NULL,
			slug VARCHAR(100) UNIQUE NOT NULL,
			plan_tier VARCHAR(50) DEFAULT 'Starter',
			compliance_score INT DEFAULT 68,
			is_active BOOLEAN DEFAULT TRUE,
			created_at TIMESTAMPTZ DEFAULT NOW(),
			updated_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		// 4. Tenant Members
		`CREATE TABLE IF NOT EXISTS tenant_members (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
			is_primary BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMPTZ DEFAULT NOW(),
			UNIQUE(tenant_id, user_id)
		);`,

		// 5. Professional Profiles (HubExperts)
		`CREATE TABLE IF NOT EXISTS professional_profiles (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			firm_name VARCHAR(255),
			qualification VARCHAR(255) NOT NULL,
			years_experience INT DEFAULT 5,
			specialisations TEXT[] NOT NULL DEFAULT '{}',
			hourly_rate_ngn NUMERIC(12, 2) DEFAULT 0,
			monthly_retainer_ngn NUMERIC(12, 2) DEFAULT 0,
			bio TEXT,
			verification_status VARCHAR(50) DEFAULT 'PENDING',
			active_clients_count INT DEFAULT 0,
			created_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		// 6. Engagements (HubAgents)
		`CREATE TABLE IF NOT EXISTS engagements (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
			professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE RESTRICT,
			agency_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
			engagement_type VARCHAR(50) NOT NULL,
			scope_summary TEXT NOT NULL,
			monthly_fee_ngn NUMERIC(12, 2) DEFAULT 0,
			start_date DATE NOT NULL,
			end_date DATE,
			status VARCHAR(50) DEFAULT 'ACTIVE',
			created_at TIMESTAMPTZ DEFAULT NOW(),
			updated_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		// 7. Engagement Permissions
		`CREATE TABLE IF NOT EXISTS engagement_permissions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
			module_code VARCHAR(50) NOT NULL,
			can_view BOOLEAN DEFAULT TRUE,
			can_upload BOOLEAN DEFAULT TRUE,
			can_approve BOOLEAN DEFAULT FALSE,
			can_export BOOLEAN DEFAULT TRUE,
			UNIQUE(engagement_id, module_code)
		);`,

		// 8. Regulatory Frameworks
		`CREATE TABLE IF NOT EXISTS regulatory_frameworks (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			authority VARCHAR(50) NOT NULL,
			statute_name VARCHAR(255) NOT NULL,
			section_reference VARCHAR(100),
			official_source_url TEXT,
			frequency VARCHAR(50) NOT NULL,
			applies_to_industries TEXT[] DEFAULT '{}',
			penalty_formula TEXT,
			created_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		// 9. Master Obligations
		`CREATE TABLE IF NOT EXISTS obligations (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			framework_id UUID REFERENCES regulatory_frameworks(id) ON DELETE SET NULL,
			title VARCHAR(255) NOT NULL,
			authority VARCHAR(50) NOT NULL,
			description TEXT NOT NULL,
			statutory_ref VARCHAR(100) NOT NULL,
			default_frequency VARCHAR(50) NOT NULL,
			required_evidence_type VARCHAR(100),
			is_statutory BOOLEAN DEFAULT TRUE
		);`,

		// 10. Tenant Calendar Obligations
		`CREATE TABLE IF NOT EXISTS tenant_obligations (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
			obligation_id UUID REFERENCES obligations(id) ON DELETE SET NULL,
			title VARCHAR(255) NOT NULL,
			authority VARCHAR(50) NOT NULL,
			due_date DATE NOT NULL,
			status VARCHAR(50) DEFAULT 'PENDING',
			estimated_penalty_ngn NUMERIC(12, 2) DEFAULT 0,
			assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
			responsible_expert_id UUID REFERENCES professional_profiles(id) ON DELETE SET NULL,
			is_urgent BOOLEAN DEFAULT FALSE,
			completed_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		// 11. Documents (Cloudinary Evidence Vault)
		`CREATE TABLE IF NOT EXISTS documents (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
			name VARCHAR(255) NOT NULL,
			category VARCHAR(50) NOT NULL,
			cloudinary_public_id TEXT NOT NULL,
			cloudinary_secure_url TEXT NOT NULL,
			file_format VARCHAR(20) NOT NULL,
			file_size_bytes BIGINT NOT NULL,
			version VARCHAR(20) DEFAULT 'v1.0',
			verification_status VARCHAR(50) DEFAULT 'UNDER_REVIEW',
			expiry_date DATE,
			is_expiring_soon BOOLEAN DEFAULT FALSE,
			uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
			verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
			verified_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ DEFAULT NOW(),
			updated_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		// 12. Document Versions
		`CREATE TABLE IF NOT EXISTS document_versions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
			version_tag VARCHAR(20) NOT NULL,
			cloudinary_public_id TEXT NOT NULL,
			cloudinary_secure_url TEXT NOT NULL,
			file_size_bytes BIGINT NOT NULL,
			uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
			change_summary TEXT,
			created_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		// 13. Employees
		`CREATE TABLE IF NOT EXISTS employees (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
			full_name VARCHAR(255) NOT NULL,
			email VARCHAR(255) NOT NULL,
			role_title VARCHAR(100) NOT NULL,
			department VARCHAR(100),
			employment_date DATE,
			pension_pfa VARCHAR(100),
			pension_rsa_pin VARCHAR(100),
			ndpa_training_completed BOOLEAN DEFAULT FALSE,
			aml_training_completed BOOLEAN DEFAULT FALSE,
			compliance_clearance_status VARCHAR(50) DEFAULT 'PENDING',
			created_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		// 14. Vendors
		`CREATE TABLE IF NOT EXISTS vendors (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
			company_name VARCHAR(255) NOT NULL,
			rc_number VARCHAR(100),
			tin VARCHAR(100),
			vendor_category VARCHAR(100) NOT NULL,
			risk_level VARCHAR(20) DEFAULT 'LOW',
			tcc_verified BOOLEAN DEFAULT FALSE,
			dpa_signed BOOLEAN DEFAULT FALSE,
			last_assessment_date DATE,
			compliance_score INT DEFAULT 70,
			created_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		// 15. AML Cases
		`CREATE TABLE IF NOT EXISTS aml_cases (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
			entity_name VARCHAR(255) NOT NULL,
			case_type VARCHAR(50) NOT NULL,
			risk_severity VARCHAR(20) NOT NULL,
			status VARCHAR(50) DEFAULT 'OPEN',
			assigned_expert_id UUID REFERENCES professional_profiles(id) ON DELETE SET NULL,
			case_notes TEXT,
			created_at TIMESTAMPTZ DEFAULT NOW(),
			updated_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		// 16. Privacy Processing Activities (RoPA)
		`CREATE TABLE IF NOT EXISTS privacy_processing_activities (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
			activity_name VARCHAR(255) NOT NULL,
			purpose TEXT NOT NULL,
			data_categories TEXT[] NOT NULL DEFAULT '{}',
			data_subjects TEXT[] NOT NULL DEFAULT '{}',
			lawful_basis VARCHAR(100) NOT NULL,
			retention_period VARCHAR(100) NOT NULL,
			cross_border_transfer BOOLEAN DEFAULT FALSE,
			dpco_audit_ready BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		// 17. Activity Logs
		`CREATE TABLE IF NOT EXISTS activity_logs (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
			user_id UUID REFERENCES users(id) ON DELETE SET NULL,
			actor_name VARCHAR(255) NOT NULL,
			actor_role VARCHAR(100) NOT NULL,
			action_type VARCHAR(100) NOT NULL,
			details TEXT NOT NULL,
			ip_address VARCHAR(100),
			created_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		// 18. Password Resets
		`CREATE TABLE IF NOT EXISTS password_resets (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			token TEXT UNIQUE NOT NULL,
			expires_at TIMESTAMPTZ NOT NULL,
			is_used BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		// Pre-existing tables
		`CREATE TABLE IF NOT EXISTS blog_posts (
			id SERIAL PRIMARY KEY,
			title TEXT NOT NULL,
			slug TEXT UNIQUE NOT NULL,
			excerpt TEXT,
			content TEXT NOT NULL,
			author_name TEXT NOT NULL,
			author_role TEXT,
			author_avatar TEXT,
			category TEXT NOT NULL,
			tags TEXT[],
			read_time TEXT,
			status TEXT DEFAULT 'PUBLISHED',
			cover_image TEXT,
			published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);`,

		`ALTER TABLE blog_posts 
			ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0,
			ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255) DEFAULT '',
			ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT '',
			ADD COLUMN IF NOT EXISTS canonical_url TEXT DEFAULT '',
			ADD COLUMN IF NOT EXISTS og_image TEXT DEFAULT '',
			ADD COLUMN IF NOT EXISTS author_bio TEXT DEFAULT '',
			ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`,

		`CREATE TABLE IF NOT EXISTS blog_categories (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) UNIQUE NOT NULL,
			slug VARCHAR(100) UNIQUE NOT NULL,
			description TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);`,

		`CREATE TABLE IF NOT EXISTS blog_tags (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) UNIQUE NOT NULL,
			slug VARCHAR(100) UNIQUE NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);`,

		`CREATE TABLE IF NOT EXISTS blog_comments (
			id SERIAL PRIMARY KEY,
			post_id INT REFERENCES blog_posts(id) ON DELETE CASCADE,
			author_name VARCHAR(100) NOT NULL,
			author_email VARCHAR(100) NOT NULL,
			content TEXT NOT NULL,
			status VARCHAR(50) DEFAULT 'APPROVED',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);`,

		`CREATE TABLE IF NOT EXISTS blog_subscribers (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			source VARCHAR(100) DEFAULT 'BLOG_FOOTER',
			status VARCHAR(50) DEFAULT 'ACTIVE',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);`,

		`CREATE TABLE IF NOT EXISTS support_tickets (
			id TEXT PRIMARY KEY,
			subject TEXT NOT NULL,
			description TEXT NOT NULL,
			customer_name TEXT NOT NULL,
			customer_email TEXT NOT NULL,
			company_name TEXT,
			rc_number TEXT,
			category TEXT NOT NULL,
			priority TEXT NOT NULL DEFAULT 'MEDIUM',
			status TEXT NOT NULL DEFAULT 'OPEN',
			assigned_to TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);`,

		`CREATE TABLE IF NOT EXISTS ticket_replies (
			id SERIAL PRIMARY KEY,
			ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
			sender_name TEXT NOT NULL,
			sender_role TEXT NOT NULL,
			message TEXT NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);`,

		`CREATE TABLE IF NOT EXISTS chat_sessions (
			id TEXT PRIMARY KEY,
			visitor_name TEXT NOT NULL,
			visitor_email TEXT NOT NULL,
			visitor_company TEXT,
			status TEXT NOT NULL DEFAULT 'ACTIVE',
			assigned_staff TEXT,
			last_message TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);`,

		`CREATE TABLE IF NOT EXISTS chat_messages (
			id SERIAL PRIMARY KEY,
			session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
			sender TEXT NOT NULL,
			sender_name TEXT NOT NULL,
			text TEXT NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);`,

		// 19. Invoices & Commercial Billing
		`CREATE TABLE IF NOT EXISTS invoices (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			invoice_number VARCHAR(100) UNIQUE NOT NULL,
			tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
			client_name VARCHAR(255) NOT NULL,
			amount_ngn NUMERIC(12, 2) NOT NULL,
			invoice_type VARCHAR(50) NOT NULL DEFAULT 'RETAINER',
			status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
			payout_ref VARCHAR(100),
			due_date DATE NOT NULL,
			paid_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ DEFAULT NOW()
		);`,

		`ALTER TABLE organisations ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';`,
		`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';`,

		`CREATE TABLE IF NOT EXISTS knowledge_articles (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			slug TEXT UNIQUE NOT NULL,
			category TEXT NOT NULL,
			excerpt TEXT NOT NULL,
			content TEXT NOT NULL,
			views INT DEFAULT 0,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);`,

		// 19. Defense-in-Depth Row-Level Security (RLS) & Policies
		`DO $$
		BEGIN
			-- documents
			ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
			ALTER TABLE documents FORCE ROW LEVEL SECURITY;
			IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'tenant_isolation_documents') THEN
				CREATE POLICY tenant_isolation_documents ON documents FOR ALL
				USING (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				)
				WITH CHECK (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				);
			END IF;

			-- tenant_obligations
			ALTER TABLE tenant_obligations ENABLE ROW LEVEL SECURITY;
			ALTER TABLE tenant_obligations FORCE ROW LEVEL SECURITY;
			IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_obligations' AND policyname = 'tenant_isolation_tenant_obligations') THEN
				CREATE POLICY tenant_isolation_tenant_obligations ON tenant_obligations FOR ALL
				USING (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				)
				WITH CHECK (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				);
			END IF;

			-- employees
			ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
			ALTER TABLE employees FORCE ROW LEVEL SECURITY;
			IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'tenant_isolation_employees') THEN
				CREATE POLICY tenant_isolation_employees ON employees FOR ALL
				USING (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				)
				WITH CHECK (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				);
			END IF;

			-- vendors
			ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
			ALTER TABLE vendors FORCE ROW LEVEL SECURITY;
			IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vendors' AND policyname = 'tenant_isolation_vendors') THEN
				CREATE POLICY tenant_isolation_vendors ON vendors FOR ALL
				USING (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				)
				WITH CHECK (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				);
			END IF;

			-- aml_cases
			ALTER TABLE aml_cases ENABLE ROW LEVEL SECURITY;
			ALTER TABLE aml_cases FORCE ROW LEVEL SECURITY;
			IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aml_cases' AND policyname = 'tenant_isolation_aml_cases') THEN
				CREATE POLICY tenant_isolation_aml_cases ON aml_cases FOR ALL
				USING (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				)
				WITH CHECK (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				);
			END IF;

			-- privacy_processing_activities
			ALTER TABLE privacy_processing_activities ENABLE ROW LEVEL SECURITY;
			ALTER TABLE privacy_processing_activities FORCE ROW LEVEL SECURITY;
			IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'privacy_processing_activities' AND policyname = 'tenant_isolation_privacy_processing_activities') THEN
				CREATE POLICY tenant_isolation_privacy_processing_activities ON privacy_processing_activities FOR ALL
				USING (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				)
				WITH CHECK (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				);
			END IF;

			-- activity_logs
			ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
			ALTER TABLE activity_logs FORCE ROW LEVEL SECURITY;
			IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'tenant_isolation_activity_logs') THEN
				CREATE POLICY tenant_isolation_activity_logs ON activity_logs FOR ALL
				USING (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				)
				WITH CHECK (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				);
			END IF;

			-- engagements
			ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
			ALTER TABLE engagements FORCE ROW LEVEL SECURITY;
			IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'engagements' AND policyname = 'tenant_isolation_engagements') THEN
				CREATE POLICY tenant_isolation_engagements ON engagements FOR ALL
				USING (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				)
				WITH CHECK (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				);
			END IF;

			-- tenant_members
			ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
			ALTER TABLE tenant_members FORCE ROW LEVEL SECURITY;
			IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_members' AND policyname = 'tenant_isolation_tenant_members') THEN
				CREATE POLICY tenant_isolation_tenant_members ON tenant_members FOR ALL
				USING (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				)
				WITH CHECK (
					current_setting('app.bypass_rls', true) = 'on' OR
					NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR
					tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
				);
			END IF;
		END $$;`,

		// 20. Application Role for RLS Enforcement
		`DO $$
		BEGIN
			IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'compliancehub_app') THEN
				CREATE ROLE compliancehub_app NOBYPASSRLS;
			END IF;
			GRANT USAGE ON SCHEMA public TO compliancehub_app;
			GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO compliancehub_app;
			GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO compliancehub_app;
			BEGIN
				EXECUTE format('GRANT compliancehub_app TO %I;', current_user);
			EXCEPTION WHEN OTHERS THEN
				-- Ignore if already granted or not permitted
			END;
		END $$;`,
	}

	for i, q := range queries {
		if _, err := pool.Exec(ctx, q); err != nil {
			return fmt.Errorf("migration error on query %d: %w", i+1, err)
		}
	}

	log.Println("✅ Multi-tenant PostgreSQL schema migrated successfully")
	return nil
}
