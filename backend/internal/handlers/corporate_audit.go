package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"compliancehub-backend/internal/db"
	"compliancehub-backend/internal/middleware"
	"compliancehub-backend/internal/models"
	"compliancehub-backend/internal/services"

	"golang.org/x/crypto/bcrypt"
)

// CorporateAuditEvaluationRequest represents the input from the 5-step audit wizard
type CorporateAuditEvaluationRequest struct {
	// Step 1: Identity & Entity Profile
	CompanyName         string `json:"company_name"`
	RCNumber            string `json:"rc_number"`
	EntityType          string `json:"entity_type"` // LTD, PLC, BN, IT, LLP
	IncorporationYear   int    `json:"incorporation_year"`
	StateOfOperation    string `json:"state_of_operation"`
	IndustrySector      string `json:"industry_sector"`
	IndustrySubcategory string `json:"industry_subcategory"`

	// Step 2: Financial & Operational Scale
	EmployeeBracket     string `json:"employee_bracket"` // 1-4, 5-14, 15-49, 50-249, 250+
	TurnoverBracket     string `json:"turnover_bracket"` // <25m, 25m-100m, 100m-1b, >1b
	OperatesBranches    bool   `json:"operates_branches"`
	HasForeignOwnership bool   `json:"has_foreign_ownership"`

	// Step 3: Regulatory Triggers & Data Exposure
	CollectsPersonalData  bool   `json:"collects_personal_data"`
	EstimatedDataSubjects string `json:"estimated_data_subjects"` // <1k, 1k-10k, 10k-100k, 100k+
	ProcessesPayments     bool   `json:"processes_payments"`
	IsDNFBP               bool   `json:"is_dnfbp"`
	ActiveVendorCount     int    `json:"active_vendor_count"`

	// Step 4: Self-Audit Compliance Posture
	CACStatus     string `json:"cac_status"`     // up_to_date, overdue_1yr, overdue_2_3yr, never_filed, uncertain
	TaxStatus     string `json:"tax_status"`     // active_cleared, irregular, not_registered, pending_audit
	PensionStatus string `json:"pension_status"` // active_pfa, pending_remittance, not_enrolled
	PrivacyStatus string `json:"privacy_status"` // dpco_filed, internal_only, no_framework
	SCUMLStatus   string `json:"scuml_status"`   // certified, pending, not_registered, not_applicable

	// Step 5: Executive Delivery Contact
	ContactName       string `json:"contact_name"`
	ContactEmail      string `json:"contact_email"`
	ContactPhone      string `json:"contact_phone"`
	ContactTitle      string `json:"contact_title"`
	ServicePreference string `json:"service_preference"` // self, expert, hybrid
}

type PillarScore struct {
	PillarName     string  `json:"pillar_name"`
	Authority      string  `json:"authority"`
	Score          int     `json:"score"`     // 0 - 100
	Status         string  `json:"status"`    // COMPLIANT, WARNING, CRITICAL, EXEMPT
	PenaltyNGN     float64 `json:"penalty_ngn"`
	StatutoryRef   string  `json:"statutory_ref"`
	SummaryNotice  string  `json:"summary_notice"`
}

type AuditInfraction struct {
	Authority    string  `json:"authority"`
	Title        string  `json:"title"`
	StatutoryRef string  `json:"statutory_ref"`
	Severity     string  `json:"severity"` // CRITICAL, HIGH, MEDIUM, LOW
	PenaltyNGN   float64 `json:"penalty_ngn"`
	Description  string  `json:"description"`
	Remedy       string  `json:"remedy"`
}

type RoadmapItem struct {
	Phase        string `json:"phase"` // 30-Day, 60-Day, 90-Day
	Authority    string `json:"authority"`
	Title        string `json:"title"`
	Action       string `json:"action"`
	StatutoryRef string `json:"statutory_ref"`
	Impact       string `json:"impact"`
}

type CorporateAuditResult struct {
	ID                   string                 `json:"id"`
	ReportToken          string                 `json:"report_token"`
	CompanyName          string                 `json:"company_name"`
	RCNumber             string                 `json:"rc_number"`
	ComplianceScore      int                    `json:"compliance_score"`
	RiskLevel            string                 `json:"risk_level"`
	TotalPenaltyExposure float64                `json:"total_penalty_exposure"`
	Pillars              map[string]PillarScore `json:"pillars"`
	Infractions          []AuditInfraction      `json:"infractions"`
	Roadmap              []RoadmapItem          `json:"roadmap"`
	ContactName          string                 `json:"contact_name"`
	ContactEmail         string                 `json:"contact_email"`
	ReportURL            string                 `json:"report_url"`
	ClaimURL             string                 `json:"claim_url"`
	CreatedAt            time.Time              `json:"created_at"`
}

func generateToken(prefix string) string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return fmt.Sprintf("%s-%s", prefix, hex.EncodeToString(b))
}

// EvaluateCorporateAudit handles the calculation and persistence of a corporate audit
func EvaluateCorporateAudit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CorporateAuditEvaluationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid audit submission payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.CompanyName) == "" {
		http.Error(w, "Company name is required", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.ContactEmail) == "" {
		http.Error(w, "Corporate contact email is required", http.StatusBadRequest)
		return
	}

	// 1. Regulatory Pillar Calculations
	pillars := make(map[string]PillarScore)
	var infractions []AuditInfraction
	var roadmap []RoadmapItem
	var totalPenalty float64

	// -------------------------------------------------------------
	// Pillar 1: Corporate Affairs Commission (CAC - CAMA 2020)
	// -------------------------------------------------------------
	cacScore := 20
	var cacPenalty float64
	cacStatus := "COMPLIANT"
	cacNotice := "Annual returns and statutory filings are up to date under CAMA 2020."

	switch req.CACStatus {
	case "overdue_1yr":
		cacScore = 10
		cacPenalty = 75000
		cacStatus = "WARNING"
		cacNotice = "CAMA 2020 s.377: Form CAC 19 Annual Return overdue for past financial year."
		infractions = append(infractions, AuditInfraction{
			Authority:    "CAC",
			Title:        "Overdue Annual Returns Filing (Form CAC 19)",
			StatutoryRef: "CAMA 2020 s.377 & s.378",
			Severity:     "HIGH",
			PenaltyNGN:   75000,
			Description:  "Failure to submit audited financial statements and annual return within 42 days of the AGM.",
			Remedy:       "File pending Form CAC 19 along with audited accounts to restore good standing and prevent status downgrade.",
		})
		roadmap = append(roadmap, RoadmapItem{
			Phase:        "30-Day",
			Authority:    "CAC",
			Title:        "File Past Year Annual Return (Form CAC 19)",
			Action:       "Prepare and upload audited balance sheet or small-company financial statements on the CAC CRP portal.",
			StatutoryRef: "CAMA 2020 s.377",
			Impact:       "Eliminates daily default penalty accumulation and maintains active corporate status.",
		})

	case "overdue_2_3yr":
		cacScore = 4
		cacPenalty = 225000
		cacStatus = "CRITICAL"
		cacNotice = "Multi-year annual return default. Imminent risk of company classification as 'INACTIVE' on the CAC public register."
		infractions = append(infractions, AuditInfraction{
			Authority:    "CAC",
			Title:        "Multi-Year CAMA 2020 Filing Default & Inactive Status Risk",
			StatutoryRef: "CAMA 2020 s.377 & s.692",
			Severity:     "CRITICAL",
			PenaltyNGN:   225000,
			Description:  "The CAC is actively striking off entities with >2 years of consecutive unfiled annual returns from the register of companies.",
			Remedy:       "Perform emergency regularization: submit back-year filings, updated PSC registers, and pay accumulated late surcharges.",
		})
		roadmap = append(roadmap, RoadmapItem{
			Phase:        "30-Day",
			Authority:    "CAC",
			Title:        "Emergency CAC Post-Incorporation Regularization",
			Action:       "Engage an accredited CAC agent to file back-year returns and update the Register of Persons with Significant Control (PSC).",
			StatutoryRef: "CAMA 2020 s.119 & s.377",
			Impact:       "Averts imminent corporate de-registration and commercial banking restrictions.",
		})

	case "never_filed":
		cacScore = 0
		cacPenalty = 350000
		cacStatus = "CRITICAL"
		cacNotice = "Entity has accumulated total statutory filing default since incorporation date."
		infractions = append(infractions, AuditInfraction{
			Authority:    "CAC",
			Title:        "Total Annual Return Default Since Incorporation",
			StatutoryRef: "CAMA 2020 s.377, s.692",
			Severity:     "CRITICAL",
			PenaltyNGN:   350000,
			Description:  "No post-incorporation statutory compliance evidence found. Commercial banks will freeze corporate accounts during periodic KYC refreshes.",
			Remedy:       "Immediate full historical filing package must be drafted and submitted through an accredited corporate secretary.",
		})
		roadmap = append(roadmap, RoadmapItem{
			Phase:        "30-Day",
			Authority:    "CAC",
			Title:        "Historical CAC Backlog Filing Package",
			Action:       "Commission full corporate secretarial audit to file all outstanding returns from incorporation year.",
			StatutoryRef: "CAMA 2020 s.377",
			Impact:       "Clears company record for public procurement, bank facilities, and institutional equity investments.",
		})

	case "uncertain":
		cacScore = 12
		cacPenalty = 50000
		cacStatus = "WARNING"
		cacNotice = "Corporate status unconfirmed on CAC Company Registration Portal (CRP)."
		roadmap = append(roadmap, RoadmapItem{
			Phase:        "30-Day",
			Authority:    "CAC",
			Title:        "Conduct CAC Status Search & Extract Certified True Copies",
			Action:       "Run an official status report on the CRP portal to verify active standing and extract registered PSCs.",
			StatutoryRef: "CAMA 2020 s.119",
			Impact:       "Establishes precise baseline of official corporate status and outstanding liabilities.",
		})
	}

	totalPenalty += cacPenalty
	pillars["cac"] = PillarScore{
		PillarName:    "Corporate Affairs (CAC)",
		Authority:     "CAC",
		Score:         cacScore * 5, // normalize to 100
		Status:        cacStatus,
		PenaltyNGN:    cacPenalty,
		StatutoryRef:  "Companies and Allied Matters Act (CAMA 2020)",
		SummaryNotice: cacNotice,
	}

	// -------------------------------------------------------------
	// Pillar 2: Tax & Fiscal Remittances (FIRS / NRS 2026 Transition)
	// -------------------------------------------------------------
	taxScore := 20
	var taxPenalty float64
	taxStatus := "COMPLIANT"
	taxNotice := "TaxPro-MAX TIN active, monthly VAT/WHT returns and Company Income Tax up to date."

	switch req.TaxStatus {
	case "irregular":
		taxScore = 8
		taxPenalty = 450000
		taxStatus = "CRITICAL"
		taxNotice = "Irregular VAT or Withholding Tax filings under TaxPro-MAX and 2026 Tax Act rules."
		infractions = append(infractions, AuditInfraction{
			Authority:    "FIRS / State IRS",
			Title:        "Default in Monthly TaxPro-MAX VAT / WHT Filings",
			StatutoryRef: "VATA s.15 & Nigeria Tax Act 2025/2026",
			Severity:     "CRITICAL",
			PenaltyNGN:   450000,
			Description:  "Monthly VAT default incurs ₦50,000 for the first month and ₦25,000 for each subsequent month of non-remittance, plus 10% penalty and statutory interest.",
			Remedy:       "Submit reconciliation schedules on TaxPro-MAX and remit unremitted WHT deductions to obtain modern Withholding Tax Credit Notes.",
		})
		roadmap = append(roadmap, RoadmapItem{
			Phase:        "30-Day",
			Authority:    "FIRS / NRS",
			Title:        "TaxPro-MAX Monthly VAT & WHT Reconciliation",
			Action:       "Reconcile sales/invoices on TaxPro-MAX and remit outstanding VAT before the 21st statutory monthly cutoff.",
			StatutoryRef: "VATA s.15 & CITA s.55",
			Impact:       "Halts automatic accumulation of statutory interest and avoids automated TaxPro-MAX system lockouts.",
		})

	case "not_registered":
		taxScore = 0
		taxPenalty = 1500000
		taxStatus = "CRITICAL"
		taxNotice = "Entity is operating without an active TaxPro-MAX registration or Corporate Tax Clearance."
		infractions = append(infractions, AuditInfraction{
			Authority:    "FIRS / NRS",
			Title:        "Unregistered Corporate Tax Entity (Missing TaxPro-MAX Login)",
			StatutoryRef: "CITA s.55 & FIRS Establishment Act",
			Severity:     "CRITICAL",
			PenaltyNGN:   1500000,
			Description:  "Operating a registered company in Nigeria without TaxPro-MAX registration subjects directors to administrative audits and retroactive back-tax assessments.",
			Remedy:       "Complete TaxPro-MAX corporate registration, link primary director NIN, and validate JTB Tax Identification Number.",
		})
		roadmap = append(roadmap, RoadmapItem{
			Phase:        "30-Day",
			Authority:    "FIRS / NRS",
			Title:        "TaxPro-MAX Corporate Onboarding & TIN Validation",
			Action:       "Visit nearest FIRS Medium/Small Tax Office (MTO/STO) or onboard via TaxPro-MAX with Certificate of Incorporation.",
			StatutoryRef: "CITA s.55",
			Impact:       "Enables lawful invoicing, government contract bidding, and prevents corporate bank account restriction.",
		})

	case "pending_audit":
		taxScore = 5
		taxPenalty = 2500000
		taxStatus = "CRITICAL"
		taxNotice = "Company is facing an active FIRS/State IRS tax audit or jeopardy assessment notice."
		infractions = append(infractions, AuditInfraction{
			Authority:    "FIRS / SIRS",
			Title:        "Active Tax Regulatory Audit & Disputed Assessment",
			StatutoryRef: "FIRS Establishment Act s.26 & PITA s.58",
			Severity:     "HIGH",
			PenaltyNGN:   2500000,
			Description:  "Pending notice of tax assessment will crystallize into an enforceable debt within 30 days unless formally objected to with supporting evidence.",
			Remedy:       "Retain an accredited ICAN/CITN tax practitioner to draft a formal Notice of Objection and prepare audit defense working papers.",
		})
		roadmap = append(roadmap, RoadmapItem{
			Phase:        "30-Day",
			Authority:    "FIRS / SIRS",
			Title:        "Lodge Formal Notice of Objection to Tax Assessment",
			Action:       "Submit documented objection within statutory 30-day window with evidence of prior remittances and audited financials.",
			StatutoryRef: "FIRS Act s.26",
			Impact:       "Stays enforcement action and prevents final and conclusive assessment status.",
		})
	}

	totalPenalty += taxPenalty
	pillars["tax"] = PillarScore{
		PillarName:    "Tax & Fiscal Remittances (FIRS / State IRS)",
		Authority:     "FIRS / NRS",
		Score:         taxScore * 5,
		Status:        taxStatus,
		PenaltyNGN:    taxPenalty,
		StatutoryRef:  "Companies Income Tax Act & Nigeria Tax Act 2025/2026",
		SummaryNotice: taxNotice,
	}

	// -------------------------------------------------------------
	// Pillar 3: Data Protection & Privacy (NDPC - NDPA 2023)
	// -------------------------------------------------------------
	privacyScore := 20
	var privacyPenalty float64
	privacyStatus := "COMPLIANT"
	privacyNotice := "Data protection compliance framework maintained under NDPA 2023."

	isDCMI := req.CollectsPersonalData && (req.EstimatedDataSubjects == "10k-100k" || req.EstimatedDataSubjects == "100k+" || req.ProcessesPayments)

	if req.CollectsPersonalData {
		switch req.PrivacyStatus {
		case "no_framework":
			if isDCMI {
				privacyScore = 0
				privacyPenalty = 5000000
				privacyStatus = "CRITICAL"
				privacyNotice = "Critical Default: Qualified as Data Controller of Major Importance (DCMI) without mandatory RoPA, DPO, or DPCO audit return."
				infractions = append(infractions, AuditInfraction{
					Authority:    "NDPC",
					Title:        "Unregistered DCMI & Failure to File Statutory Annual DPCO Audit Return",
					StatutoryRef: "NDPA 2023 s.32, s.44 & s.48",
					Severity:     "CRITICAL",
					PenaltyNGN:   5000000,
					Description:  "Section 48 of the NDPA 2023 imposes statutory fines up to ₦10,000,000 or 2% of annual gross turnover (whichever is higher) on major controllers failing to file annual audit returns by March 15.",
					Remedy:       "Designate a Data Protection Officer (DPO), establish a Record of Processing Activities (RoPA), and retain a licensed DPCO to file the statutory audit.",
				})
				roadmap = append(roadmap, RoadmapItem{
					Phase:        "30-Day",
					Authority:    "NDPC",
					Title:        "Designate DPO & Formalize Record of Processing Activities (RoPA)",
					Action:       "Map all consumer data flows, storage locations, lawful bases, and cross-border transfers into a formal RoPA register.",
					StatutoryRef: "NDPA 2023 s.32 & s.44",
					Impact:       "Satisfies fundamental legal prerequisites for NDPC compliance.",
				})
				roadmap = append(roadmap, RoadmapItem{
					Phase:        "60-Day",
					Authority:    "NDPC",
					Title:        "Commission Annual Statutory Audit via Licensed DPCO",
					Action:       "Retain an accredited Data Protection Compliance Organisation (DPCO) on HubExperts to conduct external audit and file with NDPC.",
					StatutoryRef: "NDPA 2023 s.48",
					Impact:       "Protects entity from multi-million Naira enforcement penalties and public regulatory sanctions.",
				})
			} else {
				privacyScore = 6
				privacyPenalty = 750000
				privacyStatus = "WARNING"
				privacyNotice = "Personal data processed without published Privacy Notice, consent protocols, or data retention schedules."
				infractions = append(infractions, AuditInfraction{
					Authority:    "NDPC",
					Title:        "Absence of Mandatory Privacy Policy & Consent Notices",
					StatutoryRef: "NDPA 2023 s.27 & s.34",
					Severity:     "HIGH",
					PenaltyNGN:   750000,
					Description:  "Collecting user or employee personal information without clear privacy disclosures violates data subject rights under the NDPA 2023.",
					Remedy:       "Publish a comprehensive Nigerian privacy policy and implement Data Subject Access Request (DSAR) intake workflows.",
				})
			}

		case "internal_only":
			if isDCMI {
				privacyScore = 10
				privacyPenalty = 2500000
				privacyStatus = "WARNING"
				privacyNotice = "Internal data privacy guidelines exist, but statutory external DPCO annual audit return has not been submitted to the NDPC."
				infractions = append(infractions, AuditInfraction{
					Authority:    "NDPC",
					Title:        "Unfiled Statutory Annual DPCO Audit Return (DCMI Requirement)",
					StatutoryRef: "NDPA 2023 s.48",
					Severity:     "HIGH",
					PenaltyNGN:   2500000,
					Description:  "Internal privacy policies are insufficient for Data Controllers of Major Importance; statutory law mandates an external audit verified by a licensed DPCO.",
					Remedy:       "Submit evidence pack to a licensed DPCO for formal sign-off and filing before the statutory annual cutoff.",
				})
				roadmap = append(roadmap, RoadmapItem{
					Phase:        "60-Day",
					Authority:    "NDPC",
					Title:        "Execute DPCO Audit Filing for NDPC Register of Data Controllers",
					Action:       "Submit internal privacy logs to an accredited DPCO to complete the official NDPC annual audit filing.",
					StatutoryRef: "NDPA 2023 s.48",
					Impact:       "Obtains official NDPC compliance certification and listing on the National Register of Compliant Controllers.",
				})
			} else {
				privacyScore = 16
				privacyNotice = "Basic data privacy protocols in place for standard data controller."
			}

		case "dpco_filed":
			privacyScore = 20
			privacyNotice = "Full statutory compliance: Certified DPCO audit return filed with the Nigeria Data Protection Commission."
		}
	} else {
		privacyScore = 20
		privacyStatus = "EXEMPT"
		privacyNotice = "Business indicates no collection or automated processing of third-party personal data."
	}

	totalPenalty += privacyPenalty
	pillars["ndpc"] = PillarScore{
		PillarName:    "Data Protection & Privacy (NDPC)",
		Authority:     "NDPC",
		Score:         privacyScore * 5,
		Status:        privacyStatus,
		PenaltyNGN:    privacyPenalty,
		StatutoryRef:  "Nigeria Data Protection Act (NDPA 2023)",
		SummaryNotice: privacyNotice,
	}

	// -------------------------------------------------------------
	// Pillar 4: Anti-Money Laundering & CFT (SCUML / NFIU / EFCC)
	// -------------------------------------------------------------
	scumlScore := 20
	var scumlPenalty float64
	scumlStatus := "COMPLIANT"
	scumlNotice := "Anti-Money Laundering compliance maintained under MLA 2022."

	if req.IsDNFBP {
		switch req.SCUMLStatus {
		case "not_registered":
			scumlScore = 0
			scumlPenalty = 5000000
			scumlStatus = "CRITICAL"
			scumlNotice = "Critical Default: Designated Non-Financial Business or Profession (DNFBP) operating without mandatory SCUML Registration."
			infractions = append(infractions, AuditInfraction{
				Authority:    "SCUML / NFIU",
				Title:        "Unregistered DNFBP Under Money Laundering Act 2022",
				StatutoryRef: "MLA 2022 s.6, s.11 & s.17",
				Severity:     "CRITICAL",
				PenaltyNGN:   5000000,
				Description:  "Operating a designated business (consulting, legal, accounting, real estate, automotive, hospitality) without SCUML registration triggers immediate bank account restrictions (Post-No-Debit) and fines up to ₦25,000,000.",
				Remedy:       "Submit SCUML registration dossier, appoint a dedicated Anti-Money Laundering Compliance Officer (AMLCO), and adopt a written AML/CFT manual.",
			})
			roadmap = append(roadmap, RoadmapItem{
				Phase:        "30-Day",
				Authority:    "SCUML",
				Title:        "Apply for Official SCUML Registration Certificate",
				Action:       "Assemble CAC documentation, Tax Clearance Certificate, and professional certifications to submit via the SCUML portal.",
				StatutoryRef: "MLA 2022 s.6",
				Impact:       "Protects corporate bank accounts from NFIU Post-No-Debit orders.",
			})
			roadmap = append(roadmap, RoadmapItem{
				Phase:        "60-Day",
				Authority:    "SCUML / NFIU",
				Title:        "Adopt Board-Approved AML/CFT/CPF Policy & PEP Screening",
				Action:       "Deploy customer due diligence (CDD) procedures and establish Cash Transaction Reporting (CTR) triggers for transactions > $1,000.",
				StatutoryRef: "MLA 2022 s.11",
				Impact:       "Institutionalizes anti-money laundering controls and insulates directors from regulatory liability.",
			})

		case "pending":
			scumlScore = 10
			scumlPenalty = 250000
			scumlStatus = "WARNING"
			scumlNotice = "SCUML application pending review; operational AML policies must be formally adopted."

		case "certified":
			scumlScore = 20
			scumlNotice = "Valid SCUML registration certificate held with active AML/CFT compliance records."
		}
	} else {
		scumlScore = 20
		scumlStatus = "EXEMPT"
		scumlNotice = "Entity operations do not fall under statutory DNFBP classifications under the Money Laundering Act 2022."
	}

	totalPenalty += scumlPenalty
	pillars["scuml"] = PillarScore{
		PillarName:    "Anti-Money Laundering & CFT (SCUML / NFIU)",
		Authority:     "SCUML",
		Score:         scumlScore * 5,
		Status:        scumlStatus,
		PenaltyNGN:    scumlPenalty,
		StatutoryRef:  "Money Laundering (Prevention and Prohibition) Act 2022",
		SummaryNotice: scumlNotice,
	}

	// -------------------------------------------------------------
	// Pillar 5: Labor, Pension & Social Security (PENCOM, ITF, NSITF, NHIA)
	// -------------------------------------------------------------
	laborScore := 20
	var laborPenalty float64
	laborStatus := "COMPLIANT"
	laborNotice := "Employee pensions, ITF, and statutory workplace insurance up to date."

	isMicro := req.EmployeeBracket == "1-4"
	if !isMicro {
		switch req.PensionStatus {
		case "not_enrolled":
			laborScore = 2
			laborPenalty = 1800000
			laborStatus = "CRITICAL"
			laborNotice = "Failure to establish mandatory Contributory Pension Scheme (CPS), 1% ITF payroll levy, and NSITF workplace compensation."
			infractions = append(infractions, AuditInfraction{
				Authority:    "PENCOM / ITF / NSITF",
				Title:        "Unenrolled Contributory Pension Scheme & Unremitted Payroll Levies",
				StatutoryRef: "Pension Reform Act 2014 s.11 & ITF Act Cap I9",
				Severity:     "CRITICAL",
				PenaltyNGN:   1800000,
				Description:  "Employers with 5+ staff must remit 10% employer + 8% employee pension monthly (incurring a 2% monthly surcharge on default), plus 1% annual payroll contribution to the Industrial Training Fund.",
				Remedy:       "Register corporate code with licensed PFAs, calculate back contributions, and secure annual PENCOM and ITF Certificates of Clearance.",
			})
			roadmap = append(roadmap, RoadmapItem{
				Phase:        "30-Day",
				Authority:    "PENCOM",
				Title:        "Set Up Contributory Pension Scheme with Licensed PFAs",
				Action:       "Collect RSA PINs from all eligible employees and execute employer contribution agreements with accredited Pension Fund Administrators.",
				StatutoryRef: "PRA 2014 s.11",
				Impact:       "Stops the 2% compound monthly surcharge on unpaid pension obligations.",
			})
			roadmap = append(roadmap, RoadmapItem{
				Phase:        "60-Day",
				Authority:    "ITF & NSITF",
				Title:        "Register for ITF 1% Payroll Levy & NSITF Employees' Compensation",
				Action:       "Submit annual payroll schedules to the Industrial Training Fund and register for 1% monthly NSITF safety cover.",
				StatutoryRef: "ITF Act Cap I9 & ECA 2010",
				Impact:       "Qualifies company for Public Procurement Act (BPP) clearance certificates.",
			})

		case "pending_remittance":
			laborScore = 9
			laborPenalty = 650000
			laborStatus = "WARNING"
			laborNotice = "PFA accounts set up, but monthly remittances or annual clearance certificates are currently in arrears."
			infractions = append(infractions, AuditInfraction{
				Authority:    "PENCOM",
				Title:        "Arrears in Monthly Pension Remittances (2% Statutory Surcharge)",
				StatutoryRef: "PRA 2014 s.11(6)",
				Severity:     "HIGH",
				PenaltyNGN:   650000,
				Description:  "PRA 2014 section 11(6) imposes an automatic statutory penalty of not less than 2% for every month the contribution remains unremitted.",
				Remedy:       "Remit all arrears into employee RSAs and obtain an official PENCOM compliance certificate.",
			})
			roadmap = append(roadmap, RoadmapItem{
				Phase:        "30-Day",
				Authority:    "PENCOM",
				Title:        "Clear Outstanding Pension Remittance Backlog",
				Action:       "Process outstanding employer-employee contributions via commercial bank payment portals into licensed PFC accounts.",
				StatutoryRef: "PRA 2014 s.11",
				Impact:       "Regularizes employee payroll files and ensures eligibility for institutional contracts.",
			})

		case "active_pfa":
			laborScore = 20
			laborNotice = "Full statutory compliance: Contributory Pension Scheme active with licensed PFAs."
		}

		// NHIA check for 15+ staff
		if req.EmployeeBracket == "15-49" || req.EmployeeBracket == "50-249" || req.EmployeeBracket == "250+" {
			roadmap = append(roadmap, RoadmapItem{
				Phase:        "90-Day",
				Authority:    "NHIA",
				Title:        "Mandatory Corporate Health Insurance Scheme Review",
				Action:       "Verify enrollment of all staff under a certified HMO pursuant to the National Health Insurance Authority Act 2022.",
				StatutoryRef: "NHIA Act 2022 s.13",
				Impact:       "Guarantees statutory healthcare coverage compliance for mid-sized workforce.",
			})
		}
	} else {
		laborScore = 20
		laborStatus = "EXEMPT"
		laborNotice = "Micro-enterprise (1-4 staff) exempt from mandatory Contributory Pension Scheme and 1% ITF levy under current Nigerian statutes."
	}

	totalPenalty += laborPenalty
	pillars["labor"] = PillarScore{
		PillarName:    "Labor, Pension & Social Security (PENCOM/ITF/NSITF)",
		Authority:     "PENCOM / ITF",
		Score:         laborScore * 5,
		Status:        laborStatus,
		PenaltyNGN:    laborPenalty,
		StatutoryRef:  "Pension Reform Act 2014 & Industrial Training Fund Act",
		SummaryNotice: laborNotice,
	}

	// -------------------------------------------------------------
	// Pillar 6: Sectoral Licensing & Corporate Governance
	// -------------------------------------------------------------
	governanceScore := 20
	var governancePenalty float64
	governanceStatus := "COMPLIANT"
	governanceNotice := "Corporate structure complies with Nigerian Code of Corporate Governance (NCCG) guidelines."

	if req.EmployeeBracket == "50-249" || req.EmployeeBracket == "250+" {
		governanceScore = 15
		governanceNotice = "Large enterprise: Requires formal Board Audit Committee and annual NCCG 2018 corporate governance reporting."
		roadmap = append(roadmap, RoadmapItem{
			Phase:        "90-Day",
			Authority:    "FRCN / CAC",
			Title:        "Annual NCCG 2018 Governance Compliance Return",
			Action:       "File Nigerian Code of Corporate Governance compliance assessment (Form NCCG 1) with the Financial Reporting Council.",
			StatutoryRef: "NCCG 2018 & FRCN Act",
			Impact:       "Enhances corporate governance rating for capital market and institutional banking.",
		})
	}

	if req.ProcessesPayments {
		governanceNotice += " Subject to Central Bank of Nigeria (CBN) regulatory guidelines."
	}

	totalPenalty += governancePenalty
	pillars["governance"] = PillarScore{
		PillarName:    "Sectoral Licensing & Governance (NCCG / Regulators)",
		Authority:     "FRCN / Sectoral",
		Score:         governanceScore * 5,
		Status:        governanceStatus,
		PenaltyNGN:    governancePenalty,
		StatutoryRef:  "Nigerian Code of Corporate Governance 2018",
		SummaryNotice: governanceNotice,
	}

	// -------------------------------------------------------------
	// Overall Compliance Health Score (Weighted out of 100)
	// -------------------------------------------------------------
	weightedScore := cacScore + taxScore + privacyScore + scumlScore + laborScore
	if weightedScore > 100 {
		weightedScore = 100
	}
	if weightedScore < 10 {
		weightedScore = 10
	}

	riskLevel := "MODERATE HEALTH"
	if weightedScore < 50 {
		riskLevel = "CRITICAL REGULATORY EXPOSURE"
	} else if weightedScore < 75 {
		riskLevel = "SUBSTANTIAL COMPLIANCE DEFICIT"
	} else if weightedScore >= 90 {
		riskLevel = "STATUTORY EXCELLENCE"
	}

	// Generate report token and unique URLs
	reportToken := generateToken("audit")
	reportURL := fmt.Sprintf("https://compliancehub.ng/corporate-audit/report/%s", reportToken)
	claimURL := fmt.Sprintf("https://compliancehub.ng/corporate-audit/report/%s?claim=1", reportToken)

	// Persist into PostgreSQL
	ctx := r.Context()
	pillarJSON, _ := json.Marshal(pillars)
	infractionsJSON, _ := json.Marshal(infractions)
	roadmapJSON, _ := json.Marshal(roadmap)

	var auditID string
	err := db.Pool.QueryRow(ctx, `
		INSERT INTO corporate_audits (
			report_token, company_name, rc_number, entity_type, incorporation_year,
			state_of_operation, industry_sector, industry_subcategory, employee_bracket,
			turnover_bracket, operates_branches, has_foreign_ownership,
			collects_personal_data, estimated_data_subjects, processes_payments, is_dnfbp,
			active_vendor_count, cac_status, tax_status, pension_status, privacy_status,
			scuml_status, compliance_score, risk_level, total_penalty_exposure_ngn,
			pillar_breakdown, infractions, recommendations,
			contact_name, contact_email, contact_phone, contact_title, service_preference,
			ip_address, user_agent
		) VALUES (
			$1, $2, $3, $4, $5,
			$6, $7, $8, $9,
			$10, $11, $12,
			$13, $14, $15, $16,
			$17, $18, $19, $20, $21,
			$22, $23, $24, $25,
			$26, $27, $28,
			$29, $30, $31, $32, $33,
			$34, $35
		) RETURNING id
	`,
		reportToken, req.CompanyName, req.RCNumber, req.EntityType, req.IncorporationYear,
		req.StateOfOperation, req.IndustrySector, req.IndustrySubcategory, req.EmployeeBracket,
		req.TurnoverBracket, req.OperatesBranches, req.HasForeignOwnership,
		req.CollectsPersonalData, req.EstimatedDataSubjects, req.ProcessesPayments, req.IsDNFBP,
		req.ActiveVendorCount, req.CACStatus, req.TaxStatus, req.PensionStatus, req.PrivacyStatus,
		req.SCUMLStatus, weightedScore, riskLevel, totalPenalty,
		pillarJSON, infractionsJSON, roadmapJSON,
		req.ContactName, req.ContactEmail, req.ContactPhone, req.ContactTitle, req.ServicePreference,
		r.RemoteAddr, r.UserAgent(),
	).Scan(&auditID)

	if err != nil {
		http.Error(w, "Failed to persist corporate audit report: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Dispatch transactional email report via Brevo
	if services.MailService != nil && req.ContactEmail != "" {
		var topInfractionTitles []string
		for i, inf := range infractions {
			if i >= 3 {
				break
			}
			topInfractionTitles = append(topInfractionTitles, fmt.Sprintf("%s: %s (Penalty: ₦%.0f)", inf.Authority, inf.Title, inf.PenaltyNGN))
		}
		if len(topInfractionTitles) == 0 {
			topInfractionTitles = append(topInfractionTitles, "All major statutory filings and registries appear nominally up to date.")
		}

		_ = services.MailService.SendCorporateAuditReportEmail(
			req.ContactEmail,
			req.ContactName,
			req.CompanyName,
			reportURL,
			claimURL,
			riskLevel,
			weightedScore,
			totalPenalty,
			topInfractionTitles,
		)
	}

	// Return response
	result := CorporateAuditResult{
		ID:                   auditID,
		ReportToken:          reportToken,
		CompanyName:          req.CompanyName,
		RCNumber:             req.RCNumber,
		ComplianceScore:      weightedScore,
		RiskLevel:            riskLevel,
		TotalPenaltyExposure: totalPenalty,
		Pillars:              pillars,
		Infractions:          infractions,
		Roadmap:              roadmap,
		ContactName:          req.ContactName,
		ContactEmail:         req.ContactEmail,
		ReportURL:            reportURL,
		ClaimURL:             claimURL,
		CreatedAt:            time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(result)
}

// GetCorporateAuditReport retrieves a generated audit report by its secure token
func GetCorporateAuditReport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract token from URL path: /api/v1/corporate-audit/report/{token}
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) == 0 {
		http.Error(w, "Missing report token", http.StatusBadRequest)
		return
	}
	token := parts[len(parts)-1]
	if token == "" || token == "report" {
		http.Error(w, "Report token is required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	var auditID, companyName, rcNumber, riskLevel, contactName, contactEmail string
	var complianceScore int
	var totalPenalty float64
	var pillarJSON, infractionsJSON, roadmapJSON []byte
	var createdAt time.Time

	err := db.Pool.QueryRow(ctx, `
		SELECT id, company_name, rc_number, compliance_score, risk_level,
		       total_penalty_exposure_ngn, pillar_breakdown, infractions, recommendations,
		       contact_name, contact_email, created_at
		FROM corporate_audits
		WHERE report_token = $1
	`, token).Scan(
		&auditID, &companyName, &rcNumber, &complianceScore, &riskLevel,
		&totalPenalty, &pillarJSON, &infractionsJSON, &roadmapJSON,
		&contactName, &contactEmail, &createdAt,
	)

	if err != nil {
		http.Error(w, "Corporate audit report not found", http.StatusNotFound)
		return
	}

	var pillars map[string]PillarScore
	var infractions []AuditInfraction
	var roadmap []RoadmapItem

	_ = json.Unmarshal(pillarJSON, &pillars)
	_ = json.Unmarshal(infractionsJSON, &infractions)
	_ = json.Unmarshal(roadmapJSON, &roadmap)

	reportURL := fmt.Sprintf("https://compliancehub.ng/corporate-audit/report/%s", token)
	claimURL := fmt.Sprintf("https://compliancehub.ng/corporate-audit/report/%s?claim=1", token)

	result := CorporateAuditResult{
		ID:                   auditID,
		ReportToken:          token,
		CompanyName:          companyName,
		RCNumber:             rcNumber,
		ComplianceScore:      complianceScore,
		RiskLevel:            riskLevel,
		TotalPenaltyExposure: totalPenalty,
		Pillars:              pillars,
		Infractions:          infractions,
		Roadmap:              roadmap,
		ContactName:          contactName,
		ContactEmail:         contactEmail,
		ReportURL:            reportURL,
		ClaimURL:             claimURL,
		CreatedAt:            createdAt,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

// ClaimCorporateAuditRequest provides credentials to convert an audit into a registered HubBusiness tenant
type ClaimCorporateAuditRequest struct {
	ReportToken string `json:"report_token"`
	Password    string `json:"password"`
	FullName    string `json:"full_name"`
	Email       string `json:"email"`
}

// ClaimCorporateAudit provisions a full HubBusiness workspace from a corporate audit
func ClaimCorporateAudit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ClaimCorporateAuditRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid claim payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.ReportToken == "" || req.Password == "" {
		http.Error(w, "Report token and account password are required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	// 1. Fetch audit details
	var auditID, companyName, rcNumber, state, industry, employeeBracket, email, contactName string
	var score int
	var tenantIDExisting *string
	var infractionsJSON []byte

	err := db.Pool.QueryRow(ctx, `
		SELECT id, company_name, rc_number, state_of_operation, industry_sector,
		       employee_bracket, contact_email, contact_name, compliance_score,
		       tenant_id, infractions
		FROM corporate_audits
		WHERE report_token = $1
	`, req.ReportToken).Scan(
		&auditID, &companyName, &rcNumber, &state, &industry,
		&employeeBracket, &email, &contactName, &score,
		&tenantIDExisting, &infractionsJSON,
	)

	if err != nil {
		http.Error(w, "Audit record not found", http.StatusNotFound)
		return
	}

	if req.Email != "" {
		email = strings.ToLower(strings.TrimSpace(req.Email))
	} else {
		email = strings.ToLower(strings.TrimSpace(email))
	}
	if req.FullName != "" {
		contactName = strings.TrimSpace(req.FullName)
	}

	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		http.Error(w, "Database transaction error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	// 2. Find or Create User
	var userID string
	var existingHash string
	err = tx.QueryRow(ctx, "SELECT id, password_hash FROM users WHERE email = $1", email).Scan(&userID, &existingHash)
	if err != nil {
		// User does not exist, create new user with hashed password
		hashedPw, hashErr := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if hashErr != nil {
			http.Error(w, "Failed to hash password", http.StatusInternalServerError)
			return
		}

		err = tx.QueryRow(ctx, `
			INSERT INTO users (email, password_hash, full_name, system_role, is_email_verified)
			VALUES ($1, $2, $3, 'USER', true)
			RETURNING id
		`, email, string(hashedPw), contactName).Scan(&userID)
		if err != nil {
			http.Error(w, "Failed to create user account: "+err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		// User already exists, verify password
		if bcrypt.CompareHashAndPassword([]byte(existingHash), []byte(req.Password)) != nil {
			http.Error(w, "An account with this email already exists. Incorrect password.", http.StatusUnauthorized)
			return
		}
	}

	// 3. Create Organisation
	var orgID string
	err = tx.QueryRow(ctx, `
		INSERT INTO organisations (legal_name, rc_number, org_type, industry, state_of_operation, employee_bracket)
		VALUES ($1, $2, 'BUSINESS', $3, $4, $5)
		RETURNING id
	`, companyName, rcNumber, industry, state, employeeBracket).Scan(&orgID)
	if err != nil {
		http.Error(w, "Failed to create organisation: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 4. Create Tenant Workspace
	baseSlug := strings.ToLower(strings.ReplaceAll(companyName, " ", "-"))
	baseSlug = strings.ReplaceAll(baseSlug, ".", "")
	slug := fmt.Sprintf("%s-%d", baseSlug, time.Now().Unix()%10000)

	var tenantID string
	err = tx.QueryRow(ctx, `
		INSERT INTO tenants (organisation_id, workspace_name, slug, plan_tier, compliance_score)
		VALUES ($1, $2, $3, 'Business', $4)
		RETURNING id
	`, orgID, companyName, slug, score).Scan(&tenantID)
	if err != nil {
		http.Error(w, "Failed to create workspace: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 5. Link user as OWNER
	_, err = tx.Exec(ctx, `
		INSERT INTO tenant_members (tenant_id, user_id, role, is_primary)
		VALUES ($1, $2, 'OWNER', true)
		ON CONFLICT (tenant_id, user_id) DO NOTHING
	`, tenantID, userID)
	if err != nil {
		http.Error(w, "Failed to assign workspace ownership: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 6. Seed tenant_obligations from the audit infractions
	var infractions []AuditInfraction
	_ = json.Unmarshal(infractionsJSON, &infractions)

	for i, inf := range infractions {
		dueDate := time.Now().AddDate(0, 0, 14*(i+1)).Format("2006-01-02")
		_, _ = tx.Exec(ctx, `
			INSERT INTO tenant_obligations (tenant_id, title, authority, due_date, status, estimated_penalty_ngn, is_urgent)
			VALUES ($1, $2, $3, $4, 'PENDING', $5, true)
		`, tenantID, inf.Title, inf.Authority, dueDate, inf.PenaltyNGN)
	}

	// Default baseline tax obligation
	_, _ = tx.Exec(ctx, `
		INSERT INTO tenant_obligations (tenant_id, title, authority, due_date, status, estimated_penalty_ngn, is_urgent)
		VALUES ($1, 'TaxPro-MAX Monthly VAT & WHT Transition Return', 'FIRS / NRS', $2, 'PENDING', 50000, true)
		ON CONFLICT DO NOTHING
	`, tenantID, time.Now().AddDate(0, 0, 21).Format("2006-01-02"))

	// 7. Update corporate_audits with tenant_id and claimed_at
	_, _ = tx.Exec(ctx, `
		UPDATE corporate_audits
		SET tenant_id = $1, claimed_at = NOW(), updated_at = NOW()
		WHERE id = $2
	`, tenantID, auditID)

	if err := tx.Commit(ctx); err != nil {
		http.Error(w, "Failed to commit workspace provisioning: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 8. Generate JWT Token
	userObj := models.User{
		ID:         userID,
		Email:      email,
		FullName:   contactName,
		SystemRole: "USER",
	}

	token, _ := middleware.GenerateToken(userObj, tenantID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success":        true,
		"token":          token,
		"tenant_id":      tenantID,
		"workspace_slug": slug,
		"company_name":   companyName,
		"user": map[string]interface{}{
			"id":        userID,
			"email":     email,
			"full_name": contactName,
			"role":      "BUSINESS",
		},
		"message": "HubBusiness workspace provisioned successfully with seeded statutory obligations.",
	})
}
