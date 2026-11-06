export interface ComplianceModule {
  id: string;
  name: string;
  code: string;
  tagline: string;
  description: string;
  category: "Core" | "Specialist" | "Records" | "Automation";
  icon: string;
  features: string[];
  statutoryRefs: string[];
}

export const COMPLIANCE_MODULES: ComplianceModule[] = [
  {
    id: "hubcalendar",
    name: "HubCalendar",
    code: "MOD-01",
    tagline: "Statutory Deadlines & Regulatory Scheduling",
    description: "Automatically synchronises Nigerian federal and state compliance obligations into one master calendar with automated countdowns, penalty calculation, and responsible person assignments.",
    category: "Core",
    icon: "IconCalendarTime",
    features: ["Automated CAC, FIRS, NDPC, and SCUML deadlines", "Statutory late-filing penalty estimates", "Custom internal deadlines and approval milestones", "Google & Outlook calendar two-way synchronisation"],
    statutoryRefs: ["CAMA 2020 s.377", "Nigeria Tax Act 2025/2026", "NDPA 2023 s.48"]
  },
  {
    id: "hubdocs",
    name: "HubDocs",
    code: "MOD-02",
    tagline: "Evidence Vault & Expiry Management",
    description: "Secure, tamper-evident document storage with automated expiry notifications, version tracking, and instant export for regulatory inspections.",
    category: "Records",
    icon: "IconFolders",
    features: ["Categorised folders (Corporate, Tax, HR, AML, Permits)", "Automated 90/60/30-day expiry notifications", "Watermarking & audit-ready evidence packaging", "Document verification workflows"],
    statutoryRefs: ["Evidence Act 2011", "NDPA 2023 Record Retention Standards"]
  },
  {
    id: "hubpeople",
    name: "HubPeople",
    code: "MOD-03",
    tagline: "Workforce Certifications & Employee Compliance",
    description: "Track employee compliance prerequisites, professional licensing renewals, mandatory regulatory training, and employee background checks.",
    category: "Records",
    icon: "IconUsers",
    features: ["Employee certification renewal tracking", "Mandatory NDPA privacy awareness records", "Anti-bribery & AML policy sign-offs", "Employee offboarding compliance checklist"],
    statutoryRefs: ["Labour Act Cap L1", "PENCOM Act 2014", "ITF Act s.6"]
  },
  {
    id: "hubvendors",
    name: "HubVendors",
    code: "MOD-04",
    tagline: "Vendor Onboarding & Supply Chain Compliance",
    description: "Comprehensive third-party risk management. Collect vendor tax clearance, CAC status, signed DPAs, and assign compliance tier ratings.",
    category: "Records",
    icon: "IconBuildingStore",
    features: ["Automated vendor compliance questionnaire", "Signed Data Processing Agreement (DPA) tracker", "Vendor Tax Clearance Certificate (TCC) verification", "Dynamic vendor risk scoring"],
    statutoryRefs: ["NDPA 2023 s.39 (Data Processors)", "FIRS Vendor WHT Compliance"]
  },
  {
    id: "hubaudit",
    name: "HubAudit",
    code: "MOD-05",
    tagline: "Internal Assessments & Audit Readiness",
    description: "Conduct structured internal compliance audits against Nigerian statutory frameworks. Log gaps, assign remediation owners, and generate board reports.",
    category: "Specialist",
    icon: "IconClipboardCheck",
    features: ["Standardised audit checklists for Nigerian sectors", "Findings classification (Critical, High, Medium, Low)", "Remediation tracking with corrective action plans", "Immutable audit evidence trail"],
    statutoryRefs: ["CAMA 2020 Audit Provisions", "CBN Risk-Based Supervision"]
  },
  {
    id: "hubaml",
    name: "HubAML",
    code: "MOD-06",
    tagline: "SCUML, AML/CFT & Sanctions Management",
    description: "Complete workflow suite for Designated Non-Financial Businesses & Professions (DNFBPs) and financial institutions to comply with SCUML & NFIU directives.",
    category: "Specialist",
    icon: "IconShieldLock",
    features: ["SCUML certificate renewal tracking", "Automated PEP & sanctions screening simulation", "Suspicious Transaction & Currency Transaction log", "Annual SCUML compliance return generator"],
    statutoryRefs: ["Money Laundering (Prevention & Prohibition) Act 2022", "SCUML Regulations 2023"]
  },
  {
    id: "hubprivacy",
    name: "HubPrivacy",
    code: "MOD-07",
    tagline: "NDPA 2023 & NDPC Regulatory Compliance",
    description: "End-to-end data protection management aligned with the Nigeria Data Protection Act 2023 and NDPC Guidance Notes. Maintain RoPA, manage DSARs, and prepare DPCO audits.",
    category: "Specialist",
    icon: "IconLockCheck",
    features: ["Record of Processing Activities (RoPA) builder", "Data Subject Access Request (DSAR) ticketing", "Data Protection Impact Assessment (DPIA) workflow", "DPCO Annual Audit filing package export"],
    statutoryRefs: ["Nigeria Data Protection Act 2023 (NDPA)", "NDPC GAID Framework"]
  },
  {
    id: "hubacademy",
    name: "HubAcademy",
    code: "MOD-08",
    tagline: "Regulatory Training & Staff Certifications",
    description: "Bite-sized, interactive compliance training courses tailored to Nigerian regulations with verifiable certificates of completion for audit evidence.",
    category: "Specialist",
    icon: "IconSchool",
    features: ["NDPA 2023 Employee Awareness module", "AML/CFT red flag training for front-office staff", "2026 Nigeria Tax Act changes orientation", "Verifiable digital training certificates"],
    statutoryRefs: ["ITF Training Mandates", "NDPA Accountability Principle"]
  },
  {
    id: "hubdue",
    name: "HubDue",
    code: "MOD-09",
    tagline: "Third-Party Due Diligence & Background Checks",
    description: "Automate corporate and counterparty verification checks against Nigerian official registers, sanction watchlists, and regulatory enforcement databases.",
    category: "Specialist",
    icon: "IconSearch",
    features: ["CAC entity registration status lookup", "Directors & beneficial ownership cross-checks", "Regulatory penalty and sanction registry screening", "Due diligence summary dossier export"],
    statutoryRefs: ["CAMA 2020 Beneficial Ownership", "NFIU Guidelines"]
  },
  {
    id: "hubnotify",
    name: "HubNotify",
    code: "MOD-10",
    tagline: "Multi-Channel SMS, WhatsApp & Email Alerts",
    description: "Zero-miss proactive alerting via Nigeria's preferred messaging channels ensuring no statutory deadline passes unnoticed.",
    category: "Automation",
    icon: "IconBellRinging",
    features: ["WhatsApp automated deadline reminders", "SMS escalation for 72-hour critical cutoffs", "Digest emails for executive leadership", "Configurable alert notification matrices"],
    statutoryRefs: ["Statutory Notice & Escalation Best Practices"]
  },
  {
    id: "hubreport",
    name: "HubReport",
    code: "MOD-11",
    tagline: "Board Reports & Regulatory Evidence Packages",
    description: "Produce comprehensive, executive-ready compliance health summaries and official submission packages for regulators and external auditors with a single click.",
    category: "Automation",
    icon: "IconReportAnalytics",
    features: ["One-click statutory inspection bundle generator", "Board-level compliance posture presentation", "Time-stamped audit logs with cryptographic hashes", "Custom PDF dossier exports with company letterhead"],
    statutoryRefs: ["Corporate Governance Code 2018", "Statutory Audit Requirements"]
  },
  {
    id: "hubalerts",
    name: "HubAlerts",
    code: "MOD-12",
    tagline: "Regulatory Intelligence & Emergency Bulletins",
    description: "Real-time updates on gazetted Nigerian legislation, circulars from CBN, FIRS/NRS, NDPC, and CAC, with automated applicability checks for your industry.",
    category: "Automation",
    icon: "IconAlertTriangle",
    features: ["Live Nigerian gazette & circular feed", "Impact assessment AI assistant", "Automated task creation for new regulatory mandates", "Legal expert annotation & commentary"],
    statutoryRefs: ["Official Gazettes of the Federal Republic of Nigeria"]
  }
];

export interface ClientWorkspace {
  id: string;
  name: string;
  rcNumber: string;
  industry: string;
  state: string;
  employees: number;
  readinessScore: number;
  riskLevel: "Low" | "Medium" | "High";
  activeModules: string[];
  assignedExpert: string;
  retainerMonthly: number;
  openTasksCount: number;
  pendingApprovalsCount: number;
  upcomingDeadlinesCount: number;
  logoText: string;
  colorScheme: string;
}

export const MOCK_CLIENT_WORKSPACES: ClientWorkspace[] = [
  {
    id: "client-paywave",
    name: "PayWave Technologies Ltd",
    rcNumber: "RC-1894231",
    industry: "Fintech & Digital Payments",
    state: "Lagos",
    employees: 42,
    readinessScore: 84,
    riskLevel: "Medium",
    activeModules: ["HubCalendar", "HubDocs", "HubAML", "HubPrivacy", "HubAudit", "HubReport"],
    assignedExpert: "Tunde Bakare, CAMS",
    retainerMonthly: 250000,
    openTasksCount: 5,
    pendingApprovalsCount: 2,
    upcomingDeadlinesCount: 3,
    logoText: "PW",
    colorScheme: "#0089C1"
  },
  {
    id: "client-primehaul",
    name: "Prime Haulage & Logistics Ltd",
    rcNumber: "RC-1423891",
    industry: "Supply Chain & Logistics",
    state: "Rivers (Port Harcourt)",
    employees: 118,
    readinessScore: 68,
    riskLevel: "High",
    activeModules: ["HubCalendar", "HubDocs", "HubPeople", "HubVendors", "HubNotify"],
    assignedExpert: "Tunde Bakare, CAMS",
    retainerMonthly: 180000,
    openTasksCount: 9,
    pendingApprovalsCount: 4,
    upcomingDeadlinesCount: 4,
    logoText: "PH",
    colorScheme: "#FF904C"
  },
  {
    id: "client-swifthmo",
    name: "Swift Health HMO Ltd",
    rcNumber: "RC-1928340",
    industry: "Healthcare & HMO",
    state: "FCT Abuja",
    employees: 65,
    readinessScore: 92,
    riskLevel: "Low",
    activeModules: ["HubCalendar", "HubDocs", "HubPrivacy", "HubPeople", "HubAudit", "HubReport"],
    assignedExpert: "Barr. Folashade Adeleke",
    retainerMonthly: 300000,
    openTasksCount: 2,
    pendingApprovalsCount: 1,
    upcomingDeadlinesCount: 2,
    logoText: "SH",
    colorScheme: "#166534"
  },
  {
    id: "client-zenithretail",
    name: "Zenith Retail Chains Ltd",
    rcNumber: "RC-1102938",
    industry: "Consumer Goods & DNFBP",
    state: "Lagos",
    employees: 230,
    readinessScore: 74,
    riskLevel: "Medium",
    activeModules: ["HubCalendar", "HubDocs", "HubAML", "HubVendors", "HubAcademy"],
    assignedExpert: "Tunde Bakare, CAMS",
    retainerMonthly: 220000,
    openTasksCount: 7,
    pendingApprovalsCount: 3,
    upcomingDeadlinesCount: 3,
    logoText: "ZR",
    colorScheme: "#C88A3A"
  },
  {
    id: "client-nexagri",
    name: "Nexa Agro Export Processing Ltd",
    rcNumber: "RC-1654320",
    industry: "Agro-Processing & Commodity Export",
    state: "Kano",
    employees: 52,
    readinessScore: 61,
    riskLevel: "High",
    activeModules: ["HubCalendar", "HubDocs", "HubDue", "HubAudit"],
    assignedExpert: "Amina Danjuma",
    retainerMonthly: 150000,
    openTasksCount: 8,
    pendingApprovalsCount: 2,
    upcomingDeadlinesCount: 5,
    logoText: "NA",
    colorScheme: "#245C44"
  }
];

export interface ComplianceObligation {
  id: string;
  title: string;
  authority: "CAC" | "FIRS / NRS" | "NDPC" | "SCUML" | "PENCOM" | "ITF" | "NSITF";
  category: "Statutory Filing" | "Tax Remittance" | "Audit Return" | "Anti-Money Laundering" | "Workforce Protection";
  deadline: string;
  daysRemaining: number;
  status: "Pending" | "In Progress" | "Under Review" | "Complied";
  penaltyDescription: string;
  applicableLaw: string;
  assignedTo: string;
  requiredEvidence: string;
  isUrgent: boolean;
}

export const MOCK_OBLIGATIONS: ComplianceObligation[] = [
  {
    id: "obl-01",
    title: "CAC Annual Return Filing (2025 Financial Year)",
    authority: "CAC",
    category: "Statutory Filing",
    deadline: "30 June 2026",
    daysRemaining: 18,
    status: "In Progress",
    penaltyDescription: "Daily accrual penalty of ₦1,000 + risk of business classification as Inactive on CAC public portal.",
    applicableLaw: "Companies and Allied Matters Act 2020 s.377",
    assignedTo: "Tunde Bakare, CAMS",
    requiredEvidence: "Audited Statement of Affairs & CAC Form CAC 07",
    isUrgent: true
  },
  {
    id: "obl-02",
    title: "Companies Income Tax (CIT) Annual Return — Transition to 2025/2026 Framework",
    authority: "FIRS / NRS",
    category: "Tax Remittance",
    deadline: "30 June 2026",
    daysRemaining: 18,
    status: "Under Review",
    penaltyDescription: "₦50,000 in first month and ₦25,000 for each subsequent month of default plus 10% interest.",
    applicableLaw: "Nigeria Tax Act 2025 / 2026 Transition Guidelines",
    assignedTo: "Emeka Okonkwo, FCA",
    requiredEvidence: "Audited Financial Statements, Tax Computation Sheets & Withholding Tax Receipts",
    isUrgent: true
  },
  {
    id: "obl-03",
    title: "NDPA 2023 Statutory Privacy Compliance Return & Audit Filing",
    authority: "NDPC",
    category: "Audit Return",
    deadline: "15 March 2026",
    daysRemaining: 32,
    status: "Pending",
    penaltyDescription: "Up to ₦10,000,000 or 2% of annual gross revenue for Data Controllers of Major Importance.",
    applicableLaw: "Nigeria Data Protection Act 2023 s.48 & NDPC GAID",
    assignedTo: "Barr. Folashade Adeleke",
    requiredEvidence: "Verified DPCO Compliance Audit Report & Record of Processing Activities (RoPA)",
    isUrgent: false
  },
  {
    id: "obl-04",
    title: "SCUML Annual AML/CFT Statutory Return & Staff Training Evidence",
    authority: "SCUML",
    category: "Anti-Money Laundering",
    deadline: "31 March 2026",
    daysRemaining: 45,
    status: "In Progress",
    penaltyDescription: "Suspension of bank accounts, administrative fines up to ₦5,000,000 and revocation of SCUML clearance.",
    applicableLaw: "Money Laundering (Prevention and Prohibition) Act 2022 s.6",
    assignedTo: "Tunde Bakare, CAMS",
    requiredEvidence: "KYC Register, Anti-Money Laundering Policy signed by MD & Staff Attendance Logs",
    isUrgent: false
  },
  {
    id: "obl-05",
    title: "PENCOM Monthly Pension Contribution Remittance (Current Month)",
    authority: "PENCOM",
    category: "Workforce Protection",
    deadline: "07 Every Month",
    daysRemaining: 6,
    status: "Complied",
    penaltyDescription: "2% monthly compound interest on outstanding pension contributions.",
    applicableLaw: "Pension Reform Act 2014 s.11",
    assignedTo: "Internal Finance / HR",
    requiredEvidence: "Pension Fund Administrator (PFA) Schedules & Bank Proof of Payment",
    isUrgent: false
  },
  {
    id: "obl-06",
    title: "Monthly Value Added Tax (VAT) Remittance",
    authority: "FIRS / NRS",
    category: "Tax Remittance",
    deadline: "21 Every Month",
    daysRemaining: 12,
    status: "In Progress",
    penaltyDescription: "₦50,000 for non-filing + 5% statutory penalty on unpaid tax.",
    applicableLaw: "Value Added Tax Act as amended by Tax Act 2025",
    assignedTo: "Emeka Okonkwo, FCA",
    requiredEvidence: "TaxPro-MAX E-Filing Acknowledgment Slip",
    isUrgent: true
  }
];

export interface ComplianceExpert {
  id: string;
  name: string;
  title: string;
  avatar: string;
  location: string;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  hourlyRate: number;
  retainerRate: number;
  specialisations: string[];
  certifications: string[];
  verifiedBy: string;
  isAvailable: boolean;
  activeClientsCount: number;
  bio: string;
}

export const MOCK_EXPERTS: ComplianceExpert[] = [
  {
    id: "exp-01",
    name: "Tunde Bakare, CAMS",
    title: "Senior AML/CFT & Regulatory Practice Director",
    avatar: "/character1.jpg",
    location: "Victoria Island, Lagos",
    experienceYears: 12,
    rating: 4.96,
    reviewsCount: 38,
    hourlyRate: 35000,
    retainerRate: 250000,
    specialisations: ["AML/CFT & SCUML", "Fintech Licensing", "CBN Risk Supervision", "Sanctions Screening"],
    certifications: ["Certified Anti-Money Laundering Specialist (CAMS)", "Chartered Institute of Bankers (CIBN)"],
    verifiedBy: "ComplianceHub Verification Directorate",
    isAvailable: true,
    activeClientsCount: 4,
    bio: "Ex-head of regulatory compliance at a Tier-1 Nigerian payment switch. Specialises in navigating SCUML, CBN guidelines, and constructing resilient fraud/AML operations for scale."
  },
  {
    id: "exp-02",
    name: "Barr. Folashade Adeleke, CDPO",
    title: "Licensed DPCO Partner & Data Governance Counsel",
    avatar: "/character2.jpg",
    location: "Maitama, Abuja",
    experienceYears: 10,
    rating: 4.98,
    reviewsCount: 52,
    hourlyRate: 40000,
    retainerRate: 300000,
    specialisations: ["NDPA 2023 Implementation", "NDPC Statutory Audits", "Cross-Border Data Transfers", "Data Subject Requests"],
    certifications: ["Licensed DPCO Lead Auditor (NDPC)", "Certified Data Privacy Solutions Engineer (CDPSE)", "Nigerian Bar Association"],
    verifiedBy: "NDPC Licensed DPCO Register & ComplianceHub",
    isAvailable: true,
    activeClientsCount: 6,
    bio: "Advising Nigeria's largest e-commerce and health-tech operators on statutory privacy accountability under the NDPA 2023. Over 100+ successful NDPC compliance audit returns filed."
  },
  {
    id: "exp-03",
    name: "Emeka Okonkwo, FCA, FCTI",
    title: "Chartered Tax Practitioner & Corporate Governance Fellow",
    avatar: "/character3.jpg",
    location: "Ikeja, Lagos",
    experienceYears: 16,
    rating: 4.92,
    reviewsCount: 44,
    hourlyRate: 45000,
    retainerRate: 280000,
    specialisations: ["Nigeria Tax Act 2025/2026 Transition", "FIRS TaxPro-MAX Audits", "Transfer Pricing", "Tax Clearance (TCC)"],
    certifications: ["Fellow, Institute of Chartered Accountants of Nigeria (ICAN)", "Fellow, Chartered Institute of Taxation of Nigeria (CITN)"],
    verifiedBy: "CITN & ICAN Verified Practitioner",
    isAvailable: true,
    activeClientsCount: 5,
    bio: "Leading expert on the 2026 Nigerian tax modernisation transition. Handles corporate restructuring, withholding tax rectifications, and statutory year-end audit closures."
  },
  {
    id: "exp-04",
    name: "Amina Danjuma",
    title: "Corporate Secretarial & CAC Post-Incorporation Lead",
    avatar: "/character4.jpg",
    location: "Central Business District, Abuja",
    experienceYears: 8,
    rating: 4.88,
    reviewsCount: 29,
    hourlyRate: 28000,
    retainerRate: 180000,
    specialisations: ["CAC Annual Returns", "Beneficial Ownership Registrations", "Board Governance", "Capital Alterations"],
    certifications: ["Institute of Chartered Secretaries and Administrators (ICSAN)", "LL.B, B.L"],
    verifiedBy: "CAC Accredited Agent Directory",
    isAvailable: true,
    activeClientsCount: 3,
    bio: "Accredited CAC practitioner ensuring frictionless annual filings, changes in directorships, share capital adjustments, and total statutory compliance under CAMA 2020."
  }
];
