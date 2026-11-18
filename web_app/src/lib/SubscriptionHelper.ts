/**
 * ComplianceHub.ng - Centralized Subscription & Quota Engine
 *
 * STANDING ARCHITECTURAL DIRECTIVE:
 * Subscription limits are centrally managed in SubscriptionHelper.ts and enforced/displayed
 * via SubscriptionService and middleware, overriding any potentially outdated database values for consistency.
 */

export type BusinessPlanTier = "FREE" | "STARTER" | "BUSINESS" | "PROFESSIONAL" | "ENTERPRISE" | "TRIAL";
export type PracticePlanTier = "FREE_PRACTICE" | "INDEPENDENT" | "PRACTICE" | "AGENCY_GROWTH";
export type PlanTier = BusinessPlanTier | PracticePlanTier;

export type ComplianceModule = 
  | "documents"
  | "calendar"
  | "people"
  | "vendors"
  | "aml"
  | "privacy"
  | "audit"
  | "dual_approval"
  | "api_access";

export interface PlanLimits {
  name: string;
  code: PlanTier;
  tagline: string;
  monthlyPriceNgn: number;
  annualPriceNgn: number; // Discounted (e.g. 20% off)
  documentLimit: number; // Max stored documents in HubDocs vault
  seatLimit: number; // Max team admin & member seats
  clientLimit?: number; // For practice tiers: max active client workspaces
  allowedModules: ComplianceModule[];
  features: string[];
  isPopular?: boolean;
}

export const BUSINESS_PLANS: Record<BusinessPlanTier, PlanLimits> = {
  FREE: {
    name: "Free",
    code: "FREE",
    tagline: "For microbusinesses testing statutory waters",
    monthlyPriceNgn: 0,
    annualPriceNgn: 0,
    documentLimit: 10,
    seatLimit: 1,
    allowedModules: ["calendar", "documents"],
    features: [
      "1 Business Workspace",
      "Basic statutory deadline reminders",
      "Up to 10 stored documents",
      "1 Business Administrator seat",
      "Standard email support"
    ],
    isPopular: false,
  },
  STARTER: {
    name: "Starter",
    code: "STARTER",
    tagline: "For registered Nigerian SMEs & growing startups",
    monthlyPriceNgn: 7500,
    annualPriceNgn: 72000, // ₦6,000/mo
    documentLimit: 100,
    seatLimit: 2,
    allowedModules: ["calendar", "documents"],
    features: [
      "1 Business Workspace",
      "Automated HubCalendar with SMS & WhatsApp alerts",
      "HubDocs evidence vault (up to 100 documents)",
      "CAC & Tax clearance expiry tracking",
      "2 Administrator seats",
      "Standard statutory compliance checklist"
    ],
    isPopular: false,
  },
  BUSINESS: {
    name: "Business",
    code: "BUSINESS",
    tagline: "For multi-employee teams & venture-backed companies",
    monthlyPriceNgn: 20000,
    annualPriceNgn: 192000, // ₦16,000/mo
    documentLimit: 500,
    seatLimit: 5,
    allowedModules: ["calendar", "documents", "people", "vendors"],
    features: [
      "Everything in Starter",
      "Delegated Compliance Officer Access (HubAgents)",
      "HubPeople: Staff compliance & NDPA training tracking",
      "HubVendors: Vendor onboarding & DPA collection",
      "One-click compliance evidence package generator",
      "5 Team Member seats"
    ],
    isPopular: true,
  },
  PROFESSIONAL: {
    name: "Professional",
    code: "PROFESSIONAL",
    tagline: "For regulated entities, FinTechs, and licensed DNFBPs",
    monthlyPriceNgn: 45000,
    annualPriceNgn: 432000, // ₦36,000/mo
    documentLimit: 10000, // Effectively Unlimited
    seatLimit: 15,
    allowedModules: [
      "calendar",
      "documents",
      "people",
      "vendors",
      "aml",
      "privacy",
      "audit",
      "dual_approval"
    ],
    features: [
      "Everything in Business",
      "HubAML: SCUML reporting & PEP/Sanctions screening",
      "HubPrivacy: NDPA 2023 RoPA & DSAR workflow",
      "HubAudit: Structured internal gap assessments",
      "Dual-approval sign-off workflow",
      "15 Team Member seats",
      "Priority regulatory counsel & onboarding"
    ],
    isPopular: false,
  },
  TRIAL: {
    name: "14-Day Free Trial",
    code: "TRIAL",
    tagline: "Full access to Professional features for 14 days",
    monthlyPriceNgn: 0,
    annualPriceNgn: 0,
    documentLimit: 10000,
    seatLimit: 15,
    allowedModules: [
      "calendar",
      "documents",
      "people",
      "vendors",
      "aml",
      "privacy",
      "audit",
      "dual_approval"
    ],
    features: [
      "All Professional Plan Features Included",
      "Zero upfront credit card commitment",
      "HubAML, HubPrivacy & HubAudit fully unlocked",
      "14 days of unrestricted access"
    ],
    isPopular: false,
  },
  ENTERPRISE: {
    name: "Enterprise",
    code: "ENTERPRISE",
    tagline: "For conglomerates, holding companies & multinational groups",
    monthlyPriceNgn: 150000,
    annualPriceNgn: 1440000,
    documentLimit: 100000,
    seatLimit: 100,
    allowedModules: [
      "calendar",
      "documents",
      "people",
      "vendors",
      "aml",
      "privacy",
      "audit",
      "dual_approval",
      "api_access"
    ],
    features: [
      "Custom multi-subsidiary governance hierarchy",
      "Dedicated account manager & regulatory legal counsel",
      "Unlimited stored documents & automated audit packaging",
      "Custom SSO / SAML authentication",
      "Direct REST API & Webhook integration"
    ],
    isPopular: false,
  }
};

export const PRACTICE_PLANS: Record<PracticePlanTier, PlanLimits> = {
  FREE_PRACTICE: {
    name: "Free Practice",
    code: "FREE_PRACTICE",
    tagline: "For new compliance consultants starting out",
    monthlyPriceNgn: 0,
    annualPriceNgn: 0,
    documentLimit: 50,
    seatLimit: 1,
    clientLimit: 2,
    allowedModules: ["calendar", "documents"],
    features: [
      "Manage up to 2 active business clients",
      "Basic practice task board",
      "Marketplace profile listing",
      "Standard proposal submission"
    ],
    isPopular: false,
  },
  INDEPENDENT: {
    name: "Independent",
    code: "INDEPENDENT",
    tagline: "For solo compliance consultants & DPOs",
    monthlyPriceNgn: 10000,
    annualPriceNgn: 96000,
    documentLimit: 250,
    seatLimit: 1,
    clientLimit: 10,
    allowedModules: ["calendar", "documents", "privacy", "aml"],
    features: [
      "Manage up to 10 active business clients",
      "Multi-client portfolio health dashboard",
      "Verified Expert marketplace badge",
      "Standard client engagement contracts",
      "Automated deadline notifications across all clients"
    ],
    isPopular: false,
  },
  PRACTICE: {
    name: "Practice",
    code: "PRACTICE",
    tagline: "For established practitioners managing multiple firms",
    monthlyPriceNgn: 25000,
    annualPriceNgn: 240000,
    documentLimit: 1000,
    seatLimit: 3,
    clientLimit: 30,
    allowedModules: ["calendar", "documents", "privacy", "aml", "audit", "dual_approval"],
    features: [
      "Manage up to 30 active business clients",
      "Integrated retainer billing via Paystack",
      "Multi-module delegated client management",
      "Client approval workflows & evidence sign-offs",
      "Priority marketplace ranking"
    ],
    isPopular: true,
  },
  AGENCY_GROWTH: {
    name: "Agency Growth",
    code: "AGENCY_GROWTH",
    tagline: "For compliance consulting firms & licensed DPCOs",
    monthlyPriceNgn: 100000,
    annualPriceNgn: 960000,
    documentLimit: 5000,
    seatLimit: 10,
    clientLimit: 75,
    allowedModules: [
      "calendar",
      "documents",
      "people",
      "vendors",
      "aml",
      "privacy",
      "audit",
      "dual_approval",
      "api_access"
    ],
    features: [
      "Manage up to 75 active business clients",
      "Up to 10 staff seats (Senior Officers, Auditors)",
      "Client-to-officer allocation matrix",
      "Staff utilisation & agency performance analytics",
      "White-label branded client reports"
    ],
    isPopular: false,
  }
};

/**
 * Normalizes any plan tier string (from DB, JWT, or input) into an authoritative PlanTier enum
 */
export function normalizePlanTier(rawTier?: string | null): PlanTier {
  if (!rawTier) return "TRIAL";
  const clean = rawTier.trim().toUpperCase().replace(/[\s-]+/g, "_");

  if (clean === "FREE" || clean === "BASIC") return "FREE";
  if (clean === "STARTER" || clean === "STANDARD") return "STARTER";
  if (clean === "BUSINESS" || clean === "GROWTH") return "BUSINESS";
  if (clean === "PROFESSIONAL" || clean === "PRO") return "PROFESSIONAL";
  if (clean === "ENTERPRISE" || clean === "CUSTOM") return "ENTERPRISE";
  if (clean === "TRIAL" || clean === "FREE_TRIAL" || clean === "14_DAY_TRIAL") return "TRIAL";

  // Practice Tiers
  if (clean === "FREE_PRACTICE") return "FREE_PRACTICE";
  if (clean === "INDEPENDENT" || clean === "SOLO") return "INDEPENDENT";
  if (clean === "PRACTICE") return "PRACTICE";
  if (clean === "AGENCY" || clean === "AGENCY_GROWTH") return "AGENCY_GROWTH";

  return "STARTER";
}

/**
 * Returns authoritative limits for any tier, overriding any stale DB values
 */
export function getTierLimits(rawTier?: string | null): PlanLimits {
  const tier = normalizePlanTier(rawTier);
  if (tier in BUSINESS_PLANS) {
    return BUSINESS_PLANS[tier as BusinessPlanTier];
  }
  if (tier in PRACTICE_PLANS) {
    return PRACTICE_PLANS[tier as PracticePlanTier];
  }
  return BUSINESS_PLANS.STARTER;
}

/**
 * Evaluates whether a document upload is permitted or if hardblock applies
 */
export function canUploadDocument(
  currentDocCount: number,
  rawTier?: string | null
): { allowed: boolean; limit: number; current: number; remaining: number } {
  const limits = getTierLimits(rawTier);
  const remaining = Math.max(0, limits.documentLimit - currentDocCount);
  const allowed = currentDocCount < limits.documentLimit;
  return {
    allowed,
    limit: limits.documentLimit,
    current: currentDocCount,
    remaining,
  };
}

/**
 * Evaluates whether a new team member invite is permitted or if hardblock applies
 */
export function canInviteMember(
  currentMemberCount: number,
  rawTier?: string | null
): { allowed: boolean; limit: number; current: number; remaining: number } {
  const limits = getTierLimits(rawTier);
  const remaining = Math.max(0, limits.seatLimit - currentMemberCount);
  const allowed = currentMemberCount < limits.seatLimit;
  return {
    allowed,
    limit: limits.seatLimit,
    current: currentMemberCount,
    remaining,
  };
}

/**
 * Checks module feature access for a given tier
 */
export function hasModuleAccess(moduleName: ComplianceModule, rawTier?: string | null): boolean {
  const limits = getTierLimits(rawTier);
  return limits.allowedModules.includes(moduleName);
}

/**
 * Evaluates whether a trial is currently active based on timestamp
 */
export function isTrialActive(trialEndsAt?: string | Date | null): boolean {
  if (!trialEndsAt) return false;
  const endDate = new Date(trialEndsAt).getTime();
  if (isNaN(endDate)) return false;
  return Date.now() < endDate;
}

/**
 * Computes remaining days in a trial period
 */
export function getDaysRemainingInTrial(trialEndsAt?: string | Date | null): number {
  if (!trialEndsAt) return 0;
  const endDate = new Date(trialEndsAt).getTime();
  if (isNaN(endDate)) return 0;
  const diffMs = endDate - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export interface DiagnosticInput {
  businessName?: string;
  industry?: string;
  employeeCount?: string;
  collectsPersonalData: boolean;
  processesPayments: boolean;
  isDnfbp: boolean;
  engagesVendors: boolean;
  operatesBranches: boolean;
}

export interface DiagnosticResult {
  score: number;
  riskLevel: "Low Risk" | "Moderate Risk" | "High Exposure Risk";
  urgentCount: number;
  matchedObligations: Array<{
    id: string;
    title: string;
    authority: string;
    deadlineNotice: string;
    status: string;
    statusColor: string;
    penaltyNgn: number;
  }>;
}

/**
 * Dynamically scores regulatory readiness based on onboarding diagnostic answers
 */
export function calculateDynamicReadiness(input: DiagnosticInput): DiagnosticResult {
  let score = 92;
  const obligations: DiagnosticResult["matchedObligations"] = [];
  let urgent = 0;

  // Base CAMA Obligation for every registered entity
  obligations.push({
    id: "cama_annual",
    title: "CAMA 2020 Annual Returns Preparation & Filing (Form CAC 19)",
    authority: "Corporate Affairs Commission (CAC)",
    deadlineNotice: "Statutory deadline: Due June 30 annually",
    status: "In Progress",
    statusColor: "amber",
    penaltyNgn: 25000,
  });

  // Base Tax Obligation
  obligations.push({
    id: "tax_vat_cit",
    title: "Nigeria Tax Act 2025/2026 CIT & Monthly VAT Remittance",
    authority: "Federal Inland Revenue Service (NRS / FIRS)",
    deadlineNotice: "Due by 21st of every month on TaxPro-MAX",
    status: "Urgent (18d)",
    statusColor: "red",
    penaltyNgn: 50000,
  });
  urgent += 1;

  // Data Protection Obligation (NDPA 2023)
  if (input.collectsPersonalData) {
    score -= 14;
    obligations.push({
      id: "ndpa_audit",
      title: "NDPA 2023 Statutory Privacy Audit Return & RoPA Registration",
      authority: "Nigeria Data Protection Commission (NDPC)",
      deadlineNotice: "Annual Audit Window Closes March 15",
      status: "Audit Mandated",
      statusColor: "amber",
      penaltyNgn: 1000000,
    });
    urgent += 1;
  }

  // Payments / CBN
  if (input.processesPayments) {
    score -= 16;
    obligations.push({
      id: "cbn_pssp",
      title: "CBN FinTech & Electronic Payment Security Assessment (Tier 1-3 KYC)",
      authority: "Central Bank of Nigeria (CBN)",
      deadlineNotice: "Continuous Operational Mandate & Quarterly Audit",
      status: "High Priority",
      statusColor: "red",
      penaltyNgn: 2500000,
    });
    urgent += 1;
  }

  // DNFBP / SCUML
  if (input.isDnfbp) {
    score -= 14;
    obligations.push({
      id: "scuml_aml",
      title: "SCUML AML/CFT Compliance Certification & Currency Transaction Reports",
      authority: "Special Control Unit Against Money Laundering (SCUML / EFCC)",
      deadlineNotice: "Statutory 7-day Currency Transaction Report (CTR) Filing",
      status: "DNFBP Mandate",
      statusColor: "purple",
      penaltyNgn: 500000,
    });
    urgent += 1;
  }

  // Vendor Engagements
  if (input.engagesVendors) {
    score -= 6;
    obligations.push({
      id: "vendor_dpa",
      title: "Third-Party Vendor Due Diligence & Data Processing Agreements (DPA)",
      authority: "NDPC / FIRS (WHT Deduction)",
      deadlineNotice: "Required prior to contract execution & monthly 10% WHT",
      status: "Pending Verification",
      statusColor: "amber",
      penaltyNgn: 100000,
    });
  }

  // Branch Operations
  if (input.operatesBranches) {
    score -= 4;
    obligations.push({
      id: "state_paye",
      title: "Multi-State Internal Revenue Service (SIRS) PAYE & Business Premises",
      authority: "State Internal Revenue Services (LIRS/FCT-IRS)",
      deadlineNotice: "Due 10th of every month across all operating states",
      status: "Monthly Return",
      statusColor: "blue",
      penaltyNgn: 50000,
    });
  }

  // Normalize score between 42 and 94
  const finalScore = Math.max(42, Math.min(94, score));
  let riskLevel: DiagnosticResult["riskLevel"] = "Moderate Risk";
  if (finalScore >= 80) riskLevel = "Low Risk";
  else if (finalScore < 60) riskLevel = "High Exposure Risk";

  return {
    score: finalScore,
    riskLevel,
    urgentCount: urgent,
    matchedObligations: obligations,
  };
}
