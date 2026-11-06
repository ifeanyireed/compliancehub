package models

import "time"

// ==========================================
// Group A: Identity, Users & Multi-Tenant
// ==========================================

type User struct {
	ID              string    `json:"id"`
	Email           string    `json:"email"`
	FullName        string    `json:"full_name"`
	Phone           string    `json:"phone,omitempty"`
	Title           string    `json:"title,omitempty"`
	AvatarURL       string    `json:"avatar_url,omitempty"`
	SystemRole      string    `json:"system_role"` // USER, STAFF, ADMIN
	IsEmailVerified bool      `json:"is_email_verified"`
	MFAEnabled      bool      `json:"mfa_enabled"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type UserCredentials struct {
	UserID       string `json:"user_id"`
	PasswordHash string `json:"-"`
}

type Organisation struct {
	ID                string    `json:"id"`
	LegalName         string    `json:"legal_name"`
	TradeName         string    `json:"trade_name,omitempty"`
	RCNumber          string    `json:"rc_number,omitempty"`
	TIN               string    `json:"tin,omitempty"`
	OrgType           string    `json:"org_type"` // BUSINESS, AGENCY, PRACTICE
	Industry          string    `json:"industry,omitempty"`
	StateOfOperation  string    `json:"state_of_operation,omitempty"`
	EmployeeBracket   string    `json:"employee_bracket,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type Tenant struct {
	ID               string    `json:"id"`
	OrganisationID   string    `json:"organisation_id"`
	WorkspaceName    string    `json:"workspace_name"`
	Slug             string    `json:"slug"`
	PlanTier         string    `json:"plan_tier"` // Starter, Business, Professional, Enterprise
	ComplianceScore  int       `json:"compliance_score"`
	IsActive         bool      `json:"is_active"`
	OrganisationName string    `json:"organisation_name,omitempty"`
	RCNumber         string    `json:"rc_number,omitempty"`
	Industry         string    `json:"industry,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type TenantMember struct {
	ID        string    `json:"id"`
	TenantID  string    `json:"tenant_id"`
	UserID    string    `json:"user_id"`
	Role      string    `json:"role"` // OWNER, ADMIN, COMPLIANCE_LEAD, MEMBER, VIEWER
	IsPrimary bool      `json:"is_primary"`
	CreatedAt time.Time `json:"created_at"`
	User      *User     `json:"user,omitempty"`
}

// Auth payload models
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Email            string `json:"email"`
	Password         string `json:"password"`
	FullName         string `json:"full_name"`
	CompanyName      string `json:"company_name"`
	RCNumber         string `json:"rc_number,omitempty"`
	Industry         string `json:"industry,omitempty"`
	Role             string `json:"role,omitempty"` // BUSINESS, EXPERT, AGENCY
	StateOfOperation string `json:"state_of_operation,omitempty"`
	EmployeeCount    string `json:"employee_count,omitempty"`
}

type AuthResponse struct {
	Token        string          `json:"token"`
	User         User            `json:"user"`
	ActiveTenant Tenant          `json:"active_tenant"`
	Tenants      []TenantSummary `json:"tenants"`
}

type TenantSummary struct {
	TenantID      string `json:"tenant_id"`
	WorkspaceName string `json:"workspace_name"`
	Role          string `json:"role"`
	PlanTier      string `json:"plan_tier"`
	Score         int    `json:"compliance_score"`
}

// ==========================================
// Group B: Professional Profiles & Practice
// ==========================================

type ProfessionalProfile struct {
	ID                  string    `json:"id"`
	UserID              string    `json:"user_id"`
	FirmName            string    `json:"firm_name,omitempty"`
	Qualification       string    `json:"qualification"` // CAMS, FCA, BL, CITN, CDPO
	YearsExperience     int       `json:"years_experience"`
	Specialisations     []string  `json:"specialisations"`
	HourlyRateNGN       float64   `json:"hourly_rate_ngn,omitempty"`
	MonthlyRetainerNGN  float64   `json:"monthly_retainer_ngn,omitempty"`
	Bio                 string    `json:"bio,omitempty"`
	VerificationStatus  string    `json:"verification_status"` // PENDING, VERIFIED, REJECTED
	ActiveClientsCount  int       `json:"active_clients_count"`
	FullName            string    `json:"full_name,omitempty"`
	Email               string    `json:"email,omitempty"`
	AvatarURL           string    `json:"avatar_url,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
}

type Engagement struct {
	ID               string                 `json:"id"`
	TenantID         string                 `json:"tenant_id"`
	ProfessionalID   string                 `json:"professional_id"`
	AgencyID         *string                `json:"agency_id,omitempty"`
	EngagementType   string                 `json:"engagement_type"` // FRACTIONAL_OFFICER, PROJECT_AUDIT, RETAINER
	ScopeSummary     string                 `json:"scope_summary"`
	MonthlyFeeNGN    float64                `json:"monthly_fee_ngn"`
	StartDate        string                 `json:"start_date"`
	EndDate          *string                `json:"end_date,omitempty"`
	Status           string                 `json:"status"` // PENDING, ACTIVE, SUSPENDED, TERMINATED
	CreatedAt        time.Time              `json:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at"`
	Professional     *ProfessionalProfile   `json:"professional,omitempty"`
	TenantName       string                 `json:"tenant_name,omitempty"`
	Permissions      []EngagementPermission `json:"permissions,omitempty"`
}

type EngagementPermission struct {
	ID           string `json:"id"`
	EngagementID string `json:"engagement_id"`
	ModuleCode   string `json:"module_code"` // hubcalendar, hubdocs, hubaml, hubprivacy, etc.
	CanView      bool   `json:"can_view"`
	CanUpload    bool   `json:"can_upload"`
	CanApprove   bool   `json:"can_approve"`
	CanExport    bool   `json:"can_export"`
}

// ==========================================
// Group C: Regulatory Engine & Calendar
// ==========================================

type RegulatoryFramework struct {
	ID                 string    `json:"id"`
	Authority          string    `json:"authority"` // CAC, FIRS/NRS, NDPC, SCUML, PENCOM, ITF, NSITF
	StatuteName        string    `json:"statute_name"`
	SectionReference   string    `json:"section_reference,omitempty"`
	OfficialSourceURL  string    `json:"official_source_url,omitempty"`
	Frequency          string    `json:"frequency"` // MONTHLY, ANNUAL, EVENT_DRIVEN
	AppliesToIndustries []string `json:"applies_to_industries,omitempty"`
	PenaltyFormula     string    `json:"penalty_formula,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
}

type Obligation struct {
	ID                   string `json:"id"`
	FrameworkID          string `json:"framework_id,omitempty"`
	Title                string `json:"title"`
	Authority            string `json:"authority"`
	Description          string `json:"description"`
	StatutoryRef         string `json:"statutory_ref"`
	DefaultFrequency     string `json:"default_frequency"`
	RequiredEvidenceType string `json:"required_evidence_type,omitempty"`
	IsStatutory          bool   `json:"is_statutory"`
}

type TenantObligation struct {
	ID                  string     `json:"id"`
	TenantID            string     `json:"tenant_id"`
	ObligationID        *string    `json:"obligation_id,omitempty"`
	Title               string     `json:"title"`
	Authority           string     `json:"authority"`
	DueDate             string     `json:"due_date"`
	Status              string     `json:"status"` // PENDING, FILED, VERIFIED, OVERDUE
	EstimatedPenaltyNGN float64    `json:"estimated_penalty_ngn"`
	AssignedTo          *string    `json:"assigned_to,omitempty"`
	ResponsibleExpertID *string    `json:"responsible_expert_id,omitempty"`
	IsUrgent            bool       `json:"is_urgent"`
	CompletedAt         *time.Time `json:"completed_at,omitempty"`
	CreatedAt           time.Time  `json:"created_at"`
}

// ==========================================
// Group D: Tamper-Evident Documents (Cloudinary)
// ==========================================

type Document struct {
	ID                  string     `json:"id"`
	TenantID            string     `json:"tenant_id"`
	Name                string     `json:"name"`
	Category            string     `json:"category"` // Corporate, Tax, Employee, Vendor, AML_KYC, Licences
	CloudinaryPublicID  string     `json:"cloudinary_public_id"`
	CloudinarySecureURL string     `json:"cloudinary_secure_url"`
	FileFormat          string     `json:"file_format"`
	FileSizeBytes       int64      `json:"file_size_bytes"`
	Version             string     `json:"version"`
	VerificationStatus  string     `json:"verification_status"` // VERIFIED, UNDER_REVIEW, EXPIRED, REJECTED
	ExpiryDate          *string    `json:"expiry_date,omitempty"`
	IsExpiringSoon      bool       `json:"is_expiring_soon"`
	UploadedBy          string     `json:"uploaded_by"`
	UploadedByName      string     `json:"uploaded_by_name,omitempty"`
	VerifiedBy          *string    `json:"verified_by,omitempty"`
	VerifiedAt          *time.Time `json:"verified_at,omitempty"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

type DocumentVersion struct {
	ID                  string    `json:"id"`
	DocumentID          string    `json:"document_id"`
	VersionTag          string    `json:"version_tag"`
	CloudinaryPublicID  string    `json:"cloudinary_public_id"`
	CloudinarySecureURL string    `json:"cloudinary_secure_url"`
	FileSizeBytes       int64     `json:"file_size_bytes"`
	UploadedBy          string    `json:"uploaded_by"`
	ChangeSummary       string    `json:"change_summary,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
}

type CloudinarySignatureRequest struct {
	FileName string `json:"file_name"`
	Category string `json:"category"`
	TenantID string `json:"tenant_id,omitempty"`
}

type CloudinarySignatureResponse struct {
	Signature string `json:"signature"`
	Timestamp int64  `json:"timestamp"`
	ApiKey    string `json:"api_key"`
	CloudName string `json:"cloud_name"`
	Folder    string `json:"folder"`
	PublicID  string `json:"public_id"`
}

// ==========================================
// Group E: Workforce & Vendors
// ==========================================

type Employee struct {
	ID                        string     `json:"id"`
	TenantID                  string     `json:"tenant_id"`
	FullName                  string     `json:"full_name"`
	Email                     string     `json:"email"`
	RoleTitle                 string     `json:"role_title"`
	Department                string     `json:"department,omitempty"`
	EmploymentDate            *string    `json:"employment_date,omitempty"`
	PensionPFA                string     `json:"pension_pfa,omitempty"`
	PensionRSAPIN             string     `json:"pension_rsa_pin,omitempty"`
	NDPATrainingCompleted     bool       `json:"ndpa_training_completed"`
	AMLTrainingCompleted      bool       `json:"aml_training_completed"`
	ComplianceClearanceStatus string     `json:"compliance_clearance_status"` // VERIFIED, PENDING, EXPIRED
	CreatedAt                 time.Time  `json:"created_at"`
}

type Vendor struct {
	ID                 string     `json:"id"`
	TenantID           string     `json:"tenant_id"`
	CompanyName        string     `json:"company_name"`
	RCNumber           string     `json:"rc_number,omitempty"`
	TIN                string     `json:"tin,omitempty"`
	VendorCategory     string     `json:"vendor_category"`
	RiskLevel          string     `json:"risk_level"` // LOW, MEDIUM, HIGH, CRITICAL
	TCCVerified        bool       `json:"tcc_verified"`
	DPASigned          bool       `json:"dpa_signed"`
	LastAssessmentDate *string    `json:"last_assessment_date,omitempty"`
	ComplianceScore    int        `json:"compliance_score"`
	CreatedAt          time.Time  `json:"created_at"`
}

// ==========================================
// Group F: Specialist Modules (AML & Privacy)
// ==========================================

type AMLCase struct {
	ID               string    `json:"id"`
	TenantID         string    `json:"tenant_id"`
	EntityName       string    `json:"entity_name"`
	CaseType         string    `json:"case_type"` // PEP_SCREENING, SANCTION_MATCH, STR_INVESTIGATION
	RiskSeverity     string    `json:"risk_severity"` // LOW, MEDIUM, HIGH, PROHIBITED
	Status           string    `json:"status"` // OPEN, IN_REVIEW, CLEARED, ESCALATED_SCUML
	AssignedExpertID *string   `json:"assigned_expert_id,omitempty"`
	CaseNotes        string    `json:"case_notes,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type PrivacyProcessingActivity struct {
	ID                  string    `json:"id"`
	TenantID            string    `json:"tenant_id"`
	ActivityName        string    `json:"activity_name"`
	Purpose             string    `json:"purpose"`
	DataCategories      []string  `json:"data_categories"`
	DataSubjects        []string  `json:"data_subjects"`
	LawfulBasis         string    `json:"lawful_basis"` // CONSENT, CONTRACT, LEGAL_OBLIGATION, LEGITIMATE_INTEREST
	RetentionPeriod     string    `json:"retention_period"`
	CrossBorderTransfer bool      `json:"cross_border_transfer"`
	DPCOAuditReady      bool      `json:"dpco_audit_ready"`
	CreatedAt           time.Time `json:"created_at"`
}

// ==========================================
// Group G: Activity Logs & Audit Trails
// ==========================================

type ActivityLog struct {
	ID         string    `json:"id"`
	TenantID   *string   `json:"tenant_id,omitempty"`
	UserID     *string   `json:"user_id,omitempty"`
	ActorName  string    `json:"actor_name"`
	ActorRole  string    `json:"actor_role"`
	ActionType string    `json:"action_type"`
	Details    string    `json:"details"`
	IPAddress  string    `json:"ip_address,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

// ==========================================
// Pre-existing Models (Preserved for compatibility)
// ==========================================

type BlogPost struct {
	ID           int       `json:"id"`
	Title        string    `json:"title"`
	Slug         string    `json:"slug"`
	Excerpt      string    `json:"excerpt"`
	Content      string    `json:"content"`
	AuthorName   string    `json:"author_name"`
	AuthorRole   string    `json:"author_role"`
	AuthorAvatar string    `json:"author_avatar"`
	Category     string    `json:"category"`
	Tags         []string  `json:"tags"`
	ReadTime     string    `json:"read_time"`
	Status       string    `json:"status"` // PUBLISHED, DRAFT
	CoverImage   string    `json:"cover_image"`
	PublishedAt  time.Time `json:"published_at"`
	CreatedAt    time.Time `json:"created_at"`
}

type SupportTicket struct {
	ID            string        `json:"id"`
	Subject       string        `json:"subject"`
	Description   string        `json:"description"`
	CustomerName  string        `json:"customer_name"`
	CustomerEmail string        `json:"customer_email"`
	CompanyName   string        `json:"company_name"`
	RCNumber      string        `json:"rc_number"`
	Category      string        `json:"category"`
	Priority      string        `json:"priority"` // LOW, MEDIUM, HIGH, URGENT
	Status        string        `json:"status"`   // OPEN, IN_PROGRESS, WAITING, RESOLVED
	AssignedTo    string        `json:"assigned_to"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
	Replies       []TicketReply `json:"replies,omitempty"`
}

type TicketReply struct {
	ID         int       `json:"id"`
	TicketID   string    `json:"ticket_id"`
	SenderName string    `json:"sender_name"`
	SenderRole string    `json:"sender_role"` // CUSTOMER, STAFF, ADMIN
	Message    string    `json:"message"`
	CreatedAt  time.Time `json:"created_at"`
}

type ChatSession struct {
	ID             string        `json:"id"`
	VisitorName    string        `json:"visitor_name"`
	UserName       string        `json:"user_name,omitempty"`
	VisitorEmail   string        `json:"visitor_email"`
	UserEmail      string        `json:"user_email,omitempty"`
	VisitorCompany string        `json:"visitor_company"`
	UserCompany    string        `json:"company_name,omitempty"`
	Status         string        `json:"status"` // ACTIVE, CLOSED
	AssignedStaff  string        `json:"assigned_staff"`
	LastMessage    string        `json:"last_message"`
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
	Messages       []ChatMessage `json:"messages,omitempty"`
}

type ChatMessage struct {
	ID         int       `json:"id"`
	SessionID  string    `json:"session_id"`
	Sender     string    `json:"sender"` // visitor, staff
	SenderName string    `json:"sender_name"`
	Text       string    `json:"text"`
	Message    string    `json:"message,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

type AdminMetrics struct {
	TotalCompanies       int     `json:"total_companies"`
	ActivePractitioners  int     `json:"active_practitioners"`
	FilingsCompleted     int     `json:"filings_completed"`
	PendingFilings       int     `json:"pending_filings"`
	MonthlyRevenueNGN    float64 `json:"monthly_revenue_ngn"`
	OpenSupportTickets   int     `json:"open_support_tickets"`
	ActiveChatSessions   int     `json:"active_chat_sessions"`
	ComplianceHealthRate float64 `json:"compliance_health_rate"`
}

type KnowledgeArticle struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Slug      string    `json:"slug"`
	Category  string    `json:"category"`
	Excerpt   string    `json:"excerpt"`
	Content   string    `json:"content"`
	Views     int       `json:"views"`
	UpdatedAt time.Time `json:"updated_at"`
}
