"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Calendar,
  Lock,
  Download,
  Share2,
  ExternalLink,
  Users,
  Briefcase,
  Layers,
  Coins,
  ChevronRight,
  FileText,
  HelpCircle,
  Clock,
  Printer,
  Copy,
  Check
} from "lucide-react";
import { CompliancePublicNav } from "@/components/layout/CompliancePublicNav";
import { CompliancePublicFooter } from "@/components/layout/CompliancePublicFooter";
import { CAC_SECTORS, COMPLIANCE_HEADCOUNT_TIERS } from "@/lib/cacIndustries";
import { api, setAuthToken, setActiveTenantID } from "@/lib/api";
import { defaultEase } from "@/components/motion/MotionTransitions";

const NIGERIAN_STATES = [
  "Lagos", "FCT Abuja", "Rivers", "Kano", "Oyo", "Delta", "Ogun", "Anambra",
  "Abia", "Adamawa", "Akwa Ibom", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Katsina", "Kebbi", "Kogi", "Kwara", "Nasarawa",
  "Niger", "Ondo", "Osun", "Plateau", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

function CorporateAuditWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step Control (1: Profile, 2: Scale, 3: Triggers, 4: Posture, 5: Contact, 6: Processing, 7: Report)
  const [step, setStep] = useState(1);

  // Step 1: Corporate Profile
  const [companyName, setCompanyName] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [entityType, setEntityType] = useState("LTD");
  const [incorporationYear, setIncorporationYear] = useState(2021);
  const [stateOfOperation, setStateOfOperation] = useState("Lagos");
  const [industrySector, setIndustrySector] = useState(CAC_SECTORS[5]?.name || "Information & Communication Technology (ICT)");
  const [industrySubcategory, setIndustrySubcategory] = useState("Software Development, Cloud Solutions & Enterprise SaaS");

  // Step 2: Financial & Operational Scale
  const [employeeBracket, setEmployeeBracket] = useState("5-14");
  const [turnoverBracket, setTurnoverBracket] = useState("25m-100m");
  const [operatesBranches, setOperatesBranches] = useState(false);
  const [hasForeignOwnership, setHasForeignOwnership] = useState(false);

  // Step 3: Regulatory Triggers & Data Exposure
  const [collectsPersonalData, setCollectsPersonalData] = useState(true);
  const [estimatedDataSubjects, setEstimatedDataSubjects] = useState("10k-100k");
  const [processesPayments, setProcessesPayments] = useState(true);
  const [isDnfbp, setIsDnfbp] = useState(false);
  const [activeVendorCount, setActiveVendorCount] = useState(12);

  // Step 4: Self-Audit Posture Check
  const [cacStatus, setCacStatus] = useState("overdue_1yr");
  const [taxStatus, setTaxStatus] = useState("irregular");
  const [pensionStatus, setPensionStatus] = useState("pending_remittance");
  const [privacyStatus, setPrivacyStatus] = useState("internal_only");
  const [scumlStatus, setScumlStatus] = useState("not_registered");

  // Step 5: Executive Delivery Contact
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactTitle, setContactTitle] = useState("Managing Director / CEO");
  const [servicePreference, setServicePreference] = useState("hybrid");

  // Step 6: Processing Simulation
  const [processingIndex, setProcessingIndex] = useState(0);

  // Step 7: Audit Diagnostic Results
  const [evaluating, setEvaluating] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Claim Workspace Modal
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimPassword, setClaimPassword] = useState("");
  const [claimError, setClaimError] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-detect subcategories when sector changes
  const currentSectorObj = CAC_SECTORS.find((s) => s.name === industrySector) || CAC_SECTORS[0];

  useEffect(() => {
    if (currentSectorObj && currentSectorObj.subCategories?.length > 0) {
      setIndustrySubcategory(currentSectorObj.subCategories[0].name);
      if (currentSectorObj.subCategories[0].isDnfbp) {
        setIsDnfbp(true);
      }
    }
  }, [industrySector]);

  // Check if token in URL
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      loadReportByToken(token);
    }
  }, [searchParams]);

  const loadReportByToken = async (token: string) => {
    try {
      setEvaluating(true);
      const res = await api.corporateAudit.getReport(token);
      if (res && res.compliance_score !== undefined) {
        setAuditResult(res);
        setStep(7);
      }
    } catch (err: any) {
      console.warn("Could not load report by token:", err);
    } finally {
      setEvaluating(false);
    }
  };

  // Processing state ticker
  const PROCESSING_STEPS = [
    "Cross-referencing CAMA 2020 Statutory Register & Annual Return status (Form CAC 19)...",
    "Simulating TaxPro-MAX VAT and Withholding Tax schedules under Nigeria Tax Act 2025/2026...",
    "Evaluating NDPA 2023 DCMI criteria & mandatory DPCO statutory audit filings...",
    "Verifying PRA 2014 Contributory Pension Scheme & ITF 1% payroll threshold...",
    "Calculating cumulative statutory penalty liability in ₦ NGN...",
    "Synthesizing Corporate Compliance Health Index & 90-Day Remediation Roadmap..."
  ];

  const handleStartAuditEvaluation = async () => {
    if (!companyName.trim()) {
      setErrorMsg("Please enter your company's registered legal name.");
      setStep(1);
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes("@")) {
      setErrorMsg("Please provide a valid corporate contact email for report delivery.");
      setStep(5);
      return;
    }
    if (!contactName.trim()) {
      setErrorMsg("Please provide the auditor or executive contact name.");
      setStep(5);
      return;
    }

    setErrorMsg("");
    setStep(6);
    setEvaluating(true);

    // Processing animation ticker
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx < PROCESSING_STEPS.length) {
        setProcessingIndex(idx);
      } else {
        clearInterval(interval);
      }
    }, 600);

    try {
      const payload = {
        company_name: companyName,
        rc_number: rcNumber || "RC-Pending",
        entity_type: entityType,
        incorporation_year: Number(incorporationYear),
        state_of_operation: stateOfOperation,
        industry_sector: industrySector,
        industry_subcategory: industrySubcategory,
        employee_bracket: employeeBracket,
        turnover_bracket: turnoverBracket,
        operates_branches: operatesBranches,
        has_foreign_ownership: hasForeignOwnership,
        collects_personal_data: collectsPersonalData,
        estimated_data_subjects: estimatedDataSubjects,
        processes_payments: processesPayments,
        is_dnfbp: isDnfbp,
        active_vendor_count: Number(activeVendorCount),
        cac_status: cacStatus,
        tax_status: taxStatus,
        pension_status: pensionStatus,
        privacy_status: privacyStatus,
        scuml_status: scumlStatus,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        contact_title: contactTitle,
        service_preference: servicePreference,
      };

      const result = await api.corporateAudit.evaluate(payload);
      setTimeout(() => {
        clearInterval(interval);
        setAuditResult(result);
        setStep(7);
        setEvaluating(false);
      }, 3600);
    } catch (err: any) {
      clearInterval(interval);
      console.error("Evaluation error:", err);
      setErrorMsg(err.message || "Failed to generate corporate audit. Please try again.");
      setStep(5);
      setEvaluating(false);
    }
  };

  const handleClaimWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimPassword || claimPassword.length < 6) {
      setClaimError("Password must be at least 6 characters.");
      return;
    }

    setClaiming(true);
    setClaimError("");

    try {
      const res = await api.corporateAudit.claimWorkspace({
        report_token: auditResult.report_token,
        password: claimPassword,
        full_name: contactName,
        email: contactEmail,
      });

      if (res && res.token) {
        setAuthToken(res.token);
        if (res.tenant_id) {
          setActiveTenantID(res.tenant_id);
        }
        router.push("/business/dashboard?onboarded=audit_claimed");
      }
    } catch (err: any) {
      setClaimError(err.message || "Failed to provision workspace. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  const handleCopyLink = () => {
    if (auditResult?.report_token) {
      const url = `${window.location.origin}/corporate-audit/report/${auditResult.report_token}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const formatNGN = (num: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(num);
  };

  const getScoreColor = (score: number) => {
    if (score < 50) return "text-rose-600 bg-rose-50 border-rose-200";
    if (score < 75) return "text-amber-600 bg-amber-50 border-amber-200";
    if (score < 90) return "text-sky-600 bg-sky-50 border-sky-200";
    return "text-emerald-600 bg-emerald-50 border-emerald-200";
  };

  const getPillarBadge = (status: string) => {
    switch (status) {
      case "COMPLIANT":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Compliant</span>;
      case "WARNING":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">At Risk</span>;
      case "CRITICAL":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Critical Default</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Exempt</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <CompliancePublicNav />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Top Header */}
        {step < 6 && (
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-[#0089C1] text-xs font-extrabold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nigerian Statutory Compliance Diagnostic Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight text-display">
              Corporate Compliance Audit
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              Answer 5 quick sections to evaluate your enterprise regulatory standing across <strong>CAC (CAMA 2020)</strong>, <strong>FIRS / NRS (2026 Tax Act)</strong>, <strong>NDPC (NDPA 2023)</strong>, <strong>SCUML</strong>, and <strong>PENCOM</strong>. Receive an instant risk score, statutory penalty audit, and 90-day remediation roadmap.
            </p>

            {/* Stepper Dots */}
            <div className="flex items-center justify-center gap-2.5 mt-8">
              {[
                { n: 1, label: "Entity Profile" },
                { n: 2, label: "Scale & Operations" },
                { n: 3, label: "Regulatory Triggers" },
                { n: 4, label: "Compliance Health" },
                { n: 5, label: "Delivery Contact" }
              ].map((s) => (
                <div key={s.n} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === s.n
                        ? "bg-[#0089C1] text-white shadow-md shadow-sky-500/20 scale-105"
                        : step > s.n
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                  </div>
                  {s.n < 5 && <div className={`w-6 sm:w-10 h-0.5 ${step > s.n ? "bg-emerald-500" : "bg-slate-200"}`} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error message if any */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Corporate Profile & Entity Identity */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ ease: defaultEase, duration: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-10"
          >
            <div className="border-b border-slate-100 pb-5 mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0089C1]" />
                <span>Step 1: Corporate Profile & Entity Classification</span>
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Provide your official corporate registration identity as recorded on the Corporate Affairs Commission (CAC) CRP portal.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Company Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Frontier Technologies Limited"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0089C1] focus:border-transparent text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    RC / BN / IT Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={rcNumber}
                    onChange={(e) => setRcNumber(e.target.value)}
                    placeholder="e.g. RC-1849201"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0089C1] focus:border-transparent text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Entity Type
                  </label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0089C1] focus:border-transparent text-sm font-medium bg-white"
                  >
                    <option value="LTD">Private Limited Company (Ltd)</option>
                    <option value="PLC">Public Limited Company (PLC)</option>
                    <option value="BN">Business Name (Enterprise / Sole Proprietor)</option>
                    <option value="IT">Incorporated Trustee (NGO / Foundation / Association)</option>
                    <option value="LLP">Limited Liability Partnership (LLP)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Year of Incorporation
                  </label>
                  <input
                    type="number"
                    min="1960"
                    max="2026"
                    value={incorporationYear}
                    onChange={(e) => setIncorporationYear(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0089C1] focus:border-transparent text-sm font-medium"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Used to calculate historical CAMA annual return liabilities.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Primary State of Operation
                  </label>
                  <select
                    value={stateOfOperation}
                    onChange={(e) => setStateOfOperation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0089C1] focus:border-transparent text-sm font-medium bg-white"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  CAC Official Industry Sector
                </label>
                <select
                  value={industrySector}
                  onChange={(e) => setIndustrySector(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0089C1] focus:border-transparent text-sm font-medium bg-white"
                >
                  {CAC_SECTORS.map((sec) => (
                    <option key={sec.id} value={sec.name}>{sec.name}</option>
                  ))}
                </select>
              </div>

              {currentSectorObj?.subCategories?.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Subcategory / Specific Line of Business
                  </label>
                  <select
                    value={industrySubcategory}
                    onChange={(e) => setIndustrySubcategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0089C1] focus:border-transparent text-sm font-medium bg-white"
                  >
                    {currentSectorObj.subCategories.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name} {sub.isDnfbp ? "(SCUML DNFBP Regulated)" : ""} {sub.requiresSpecialLicense ? "(Special License Required)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!companyName.trim()) {
                    setErrorMsg("Please enter your company's registered legal name.");
                    return;
                  }
                  setErrorMsg("");
                  setStep(2);
                }}
                className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-xs transition-all"
              >
                <span>Continue to Operations & Scale</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Financial & Operational Scale */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ ease: defaultEase, duration: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-10"
          >
            <div className="border-b border-slate-100 pb-5 mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0089C1]" />
                <span>Step 2: Workforce Headcount & Financial Scale</span>
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Under Nigerian law, payroll sizes and turnover brackets trigger distinct statutory obligations (PENCOM, ITF 1%, NHIA, NCCG, and CIT exemptions).
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Operational Employee Headcount
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COMPLIANCE_HEADCOUNT_TIERS.map((tier) => (
                    <div
                      key={tier.id}
                      onClick={() => setEmployeeBracket(tier.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        employeeBracket === tier.id
                          ? "border-[#0089C1] bg-sky-50/60 ring-2 ring-sky-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{tier.employeeRange}</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          tier.category === "Micro" ? "bg-slate-100 text-slate-700" :
                          tier.category === "Small" ? "bg-blue-100 text-blue-800" :
                          tier.category === "Medium" ? "bg-indigo-100 text-indigo-800" :
                          "bg-purple-100 text-purple-800"
                        }`}>
                          {tier.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {tier.statutoryImplications}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Annual Turnover Bracket
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "<25m", label: "Under ₦25 Million", desc: "Eligible for Small Company 0% CIT rate exemption under Nigerian Tax laws." },
                    { id: "25m-100m", label: "₦25M – ₦100 Million", desc: "Standard CIT rate, mandatory monthly VAT, and 1% ITF payroll levy threshold." },
                    { id: "100m-1b", label: "₦100M – ₦1 Billion", desc: "Mid-market enterprise; mandatory audited accounts and multi-agency clearance certificates." },
                    { id: ">1b", label: "Over ₦1 Billion", desc: "Large enterprise; high-tier NDPC DCMI classification and full NCCG governance." }
                  ].map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setTurnoverBracket(t.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        turnoverBracket === t.id
                          ? "border-[#0089C1] bg-sky-50/60 ring-2 ring-sky-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span className="font-bold text-sm text-slate-900">{t.label}</span>
                      <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={operatesBranches}
                    onChange={(e) => setOperatesBranches(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#0089C1] focus:ring-sky-500"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-800">Multi-State Branch Offices</span>
                    <p className="text-xs text-slate-500 mt-0.5">Operates physical branches or stores across 2+ Nigerian states (triggers multi-state SIRS PAYE & business premises permits).</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasForeignOwnership}
                    onChange={(e) => setHasForeignOwnership(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#0089C1] focus:ring-sky-500"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-800">Foreign Participation / Ownership</span>
                    <p className="text-xs text-slate-500 mt-0.5">Has non-Nigerian shareholders or expatriate directors (triggers NIPC registration and Ministry of Interior quotas).</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-xs transition-all"
              >
                <span>Continue to Regulatory Triggers</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Regulatory Triggers & Data Exposure */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ ease: defaultEase, duration: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-10"
          >
            <div className="border-b border-slate-100 pb-5 mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0089C1]" />
                <span>Step 3: Regulatory Triggers, Data Privacy & AML</span>
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Pinpoints high-liability statutory thresholds under the Nigeria Data Protection Act (NDPA 2023) and Money Laundering Act (MLA 2022).
              </p>
            </div>

            <div className="space-y-6">
              {/* Personal Data Collection */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={collectsPersonalData}
                    onChange={(e) => setCollectsPersonalData(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#0089C1] focus:ring-sky-500"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-900">Does your business collect or process Nigerian citizens&apos; personal data?</span>
                    <p className="text-xs text-slate-500 mt-0.5">Includes customer phone numbers, emails, KYC identification, payroll files, mobile app telemetry, or e-commerce orders.</p>
                  </div>
                </label>

                {collectsPersonalData && (
                  <div className="mt-4 pl-7">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Estimated Volume of Data Subjects Handled
                    </label>
                    <select
                      value={estimatedDataSubjects}
                      onChange={(e) => setEstimatedDataSubjects(e.target.value)}
                      className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium bg-white"
                    >
                      <option value="<1k">Under 1,000 citizens (Standard Controller)</option>
                      <option value="1k-10k">1,000 – 10,000 citizens</option>
                      <option value="10k-100k">10,000 – 100,000 citizens (DCMI Threshold)</option>
                      <option value="100k+">Over 100,000 citizens (High-Risk DCMI)</option>
                    </select>
                    <p className="text-[11px] text-amber-700 mt-1 font-medium">
                      Handling 10,000+ data subjects automatically classifies the entity as a Data Controller of Major Importance (DCMI), requiring a licensed DPCO annual audit return.
                    </p>
                  </div>
                )}
              </div>

              {/* Payments & Financial Flows */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={processesPayments}
                  onChange={(e) => setProcessesPayments(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#0089C1] focus:ring-sky-500"
                />
                <div>
                  <span className="font-bold text-sm text-slate-900">Facilitates Customer Payments, Wallets, or Financial Transactions</span>
                  <p className="text-xs text-slate-500 mt-0.5">Operates fintech software, payment checkout, escrow, lending, savings, or virtual accounts (triggers CBN/NDPC heightened audit rules).</p>
                </div>
              </label>

              {/* SCUML DNFBP */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDnfbp}
                  onChange={(e) => setIsDnfbp(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#0089C1] focus:ring-sky-500"
                />
                <div>
                  <span className="font-bold text-sm text-slate-900">Designated Non-Financial Business or Profession (DNFBP)</span>
                  <p className="text-xs text-slate-500 mt-0.5">Real Estate developers/brokers, Law firms, Accounting/Audit practices, Automotive dealerships, Consulting, Hotels, Casinos, or Mining firms (mandates SCUML registration and PEP screening).</p>
                </div>
              </label>

              {/* Vendor & Supply Chain Network */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Active Third-Party Vendors & Contractors: <span className="text-[#0089C1] font-extrabold">{activeVendorCount} Vendors</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={activeVendorCount}
                  onChange={(e) => setActiveVendorCount(Number(e.target.value))}
                  className="w-full accent-[#0089C1]"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>0 Vendors</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100+ Enterprise Supply Chain</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Requires executed Data Processing Agreements (DPA) under NDPA s.39 and Withholding Tax deduction schedules.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-xs transition-all"
              >
                <span>Continue to Compliance Status Check</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Current Compliance Health Check (Self-Audit Survey) */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ ease: defaultEase, duration: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-10"
          >
            <div className="border-b border-slate-100 pb-5 mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#0089C1]" />
                <span>Step 4: Statutory Posture & Historical Filings Check</span>
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Select your honest current standing across major regulators to calculate penalty liabilities accurately.
              </p>
            </div>

            <div className="space-y-6">
              {/* CAC Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                  1. CAC Annual Returns Filing Status (Form CAC 19)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: "up_to_date", label: "Up to date (Past year filed)", status: "COMPLIANT" },
                    { id: "overdue_1yr", label: "Overdue by 1 Year", status: "WARNING" },
                    { id: "overdue_2_3yr", label: "Overdue by 2 – 3 Years (Inactive Risk)", status: "CRITICAL" },
                    { id: "never_filed", label: "Never filed since incorporation", status: "CRITICAL" },
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setCacStatus(opt.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                        cacStatus === opt.id
                          ? "border-[#0089C1] bg-sky-50 text-sky-950 ring-1 ring-sky-500"
                          : "border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax / TaxPro-MAX Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                  2. FIRS TaxPro-MAX & Monthly Remittances (VAT / WHT / CIT)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: "active_cleared", label: "Active TIN with monthly VAT/WHT cleared" },
                    { id: "irregular", label: "TIN active, but filings irregular or behind" },
                    { id: "not_registered", label: "No TaxPro-MAX login / Not registered" },
                    { id: "pending_audit", label: "Facing pending tax audit assessment notice" },
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setTaxStatus(opt.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                        taxStatus === opt.id
                          ? "border-[#0089C1] bg-sky-50 text-sky-950 ring-1 ring-sky-500"
                          : "border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Protection NDPC Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                  3. NDPC Data Protection & RoPA Standing
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "dpco_filed", label: "Annual audit filed via licensed DPCO" },
                    { id: "internal_only", label: "Internal privacy policy only (No DPCO audit)" },
                    { id: "no_framework", label: "No formal data privacy framework in place" },
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setPrivacyStatus(opt.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                        privacyStatus === opt.id
                          ? "border-[#0089C1] bg-sky-50 text-sky-950 ring-1 ring-sky-500"
                          : "border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* PENCOM / Labor Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                  4. PENCOM Contributory Pension & ITF Payroll Standing
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "active_pfa", label: "PFA enrolled & monthly remittances current" },
                    { id: "pending_remittance", label: "PFAs set up, but remittances in arrears" },
                    { id: "not_enrolled", label: "Not enrolled in Contributory Pension Scheme" },
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setPensionStatus(opt.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                        pensionStatus === opt.id
                          ? "border-[#0089C1] bg-sky-50 text-sky-950 ring-1 ring-sky-500"
                          : "border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* SCUML Status (If applicable) */}
              {isDnfbp && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                    5. SCUML Anti-Money Laundering Registration Status
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: "certified", label: "Valid SCUML Certificate held" },
                      { id: "pending", label: "Application submitted / Pending review" },
                      { id: "not_registered", label: "Not registered with SCUML / No AML manual" },
                    ].map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setScumlStatus(opt.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                          scumlStatus === opt.id
                            ? "border-[#0089C1] bg-sky-50 text-sky-950 ring-1 ring-sky-500"
                            : "border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-xs transition-all"
              >
                <span>Continue to Executive Delivery</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: Executive Delivery Contact (Option A Lead Capture) */}
        {step === 5 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ ease: defaultEase, duration: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-10"
          >
            <div className="border-b border-slate-100 pb-5 mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold uppercase mb-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Confidential Executive Diagnostic</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Step 5: Executive Recipient & Report Delivery
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Where should we dispatch your official Corporate Audit Diagnostic Memo and encrypted report link?
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Executive / Auditor Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Barrister Funke Adeleke"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0089C1] text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Corporate Work Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. adeleke@apexfrontier.ng"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0089C1] text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Executive Designation / Title
                  </label>
                  <select
                    value={contactTitle}
                    onChange={(e) => setContactTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium bg-white"
                  >
                    <option value="Managing Director / CEO">Managing Director / CEO</option>
                    <option value="Chief Financial Officer (CFO)">Chief Financial Officer (CFO)</option>
                    <option value="Company Secretary / General Counsel">Company Secretary / General Counsel</option>
                    <option value="Head of Compliance & Risk">Head of Compliance & Risk</option>
                    <option value="Director / Partner">Director / Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Direct Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. +234 803 123 4567"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Preferred Remediation Model
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "self", title: "Automated Software", desc: "Manage compliance internally using ComplianceHub's calendar & vaults." },
                    { id: "expert", title: "Accredited Specialist", desc: "Retain a verified DPCO, tax consultant, or CAC agent to resolve backlogs." },
                    { id: "hybrid", title: "Hybrid (Recommended)", desc: "Software workspace + dedicated fractional compliance officer." },
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setServicePreference(p.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        servicePreference === p.id
                          ? "border-[#0089C1] bg-sky-50 text-slate-900 ring-1 ring-sky-500"
                          : "border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className="font-bold text-xs">{p.title}</span>
                      <p className="text-[11px] text-slate-500 mt-1">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleStartAuditEvaluation}
                disabled={evaluating}
                className="bg-[#0089C1] hover:bg-sky-600 disabled:opacity-50 text-white font-extrabold px-8 py-3.5 rounded-xl text-sm flex items-center gap-2.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Run Corporate Compliance Audit</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 6: Interactive Animated Verification Screen */}
        {step === 6 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-16 text-center max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0089C1] flex items-center justify-center mx-auto mb-6 relative">
              <div className="w-full h-full rounded-2xl border-2 border-sky-400 border-t-transparent animate-spin absolute" />
              <ShieldCheck className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight text-display">
              Synthesizing Statutory Corporate Audit
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-2">
              Evaluating regulatory liabilities for <strong>{companyName || "Your Company"}</strong> across Nigerian enforcement jurisdictions.
            </p>

            <div className="mt-8 space-y-3 text-left max-w-lg mx-auto bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
              {PROCESSING_STEPS.map((msg, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm">
                  {idx < processingIndex ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : idx === processingIndex ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[#0089C1] border-t-transparent animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-slate-200 flex-shrink-0" />
                  )}
                  <span className={`${idx === processingIndex ? "font-bold text-[#0089C1]" : idx < processingIndex ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                    {msg}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 7: Audit Diagnostic Results Dashboard */}
        {step === 7 && auditResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: defaultEase, duration: 0.4 }}
            className="space-y-8"
          >
            {/* Header Banner */}
            <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-[#0089C1]/20 via-sky-500/10 to-transparent pointer-events-none rounded-full blur-3xl" />
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-[#38BDF8] text-xs font-extrabold uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Official Audit Diagnostic Memo</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white text-display tracking-tight">
                    {auditResult.company_name}
                  </h1>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">
                    Statutory reference: <strong>{auditResult.rc_number || "RC-Pending"}</strong> &bull; Generated: {new Date(auditResult.created_at || Date.now()).toLocaleDateString("en-NG", { dateStyle: "long" })}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Save PDF</span>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? "Link Copied" : "Share Permalink"}</span>
                  </button>
                  <button
                    onClick={() => setShowClaimModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#0089C1] hover:bg-sky-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Claim Free Workspace</span>
                  </button>
                </div>
              </div>

              {/* Key Metric Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-800">
                {/* Score */}
                <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Compliance Health Index</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-extrabold text-white text-display">{auditResult.compliance_score}</span>
                    <span className="text-slate-400 text-sm font-bold">/ 100</span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${getScoreColor(auditResult.compliance_score)}`}>
                      {auditResult.risk_level}
                    </span>
                  </div>
                </div>

                {/* Estimated Penalties */}
                <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-rose-400">Cumulative Penalty Liability</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2 text-display">
                    {formatNGN(auditResult.total_penalty_exposure || 0)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Potential statutory fines & late filing surcharges if audited today.
                  </p>
                </div>

                {/* Infractions count */}
                <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">Active Deficits Flagged</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2 text-display">
                    {auditResult.infractions?.length || 0} Infractions
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Priority regulatory actions required under CAMA, NDPA & Tax statutes.
                  </p>
                </div>
              </div>
            </div>

            {/* 6-Pillar Regulatory Heatmap */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#0089C1]" />
                  <span>The 6 Statutory Regulatory Pillars</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">Nigerian Federal & State Jurisdictions</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {auditResult.pillars && Object.entries(auditResult.pillars).map(([key, p]: [string, any]) => (
                  <div
                    key={key}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{p.authority}</span>
                        {getPillarBadge(p.status)}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{p.pillar_name}</h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">{p.summary_notice}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Pillar Score: <strong className="text-slate-800">{p.score}%</strong></span>
                      {p.penalty_ngn > 0 ? (
                        <span className="text-rose-600 font-extrabold">Fine: {formatNGN(p.penalty_ngn)}</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">₦0 Penalty</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Itemized Legal Infractions Breakdown */}
            {auditResult.infractions?.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                <h3 className="text-lg font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <span>Priority Regulatory Infractions & Remedies</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-6">
                  Specific legal infractions identified against Nigerian statutory codes, showing potential default liability and recommended cures.
                </p>

                <div className="space-y-4">
                  {auditResult.infractions.map((inf: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800">
                            {inf.severity} SEVERITY
                          </span>
                          <span className="text-xs font-bold text-slate-500">{inf.authority} &bull; {inf.statutory_ref}</span>
                        </div>
                        <span className="text-sm font-extrabold text-rose-600">
                          {formatNGN(inf.penalty_ngn)} Exposure
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{inf.title}</h4>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{inf.description}</p>
                      
                      <div className="mt-3 pt-3 border-t border-slate-200/60 bg-white p-3 rounded-xl border">
                        <span className="text-xs font-extrabold text-[#0089C1] uppercase tracking-wider block mb-1">
                          Recommended Remediation:
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed">{inf.remedy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prioritized 30-60-90 Day Remediation Roadmap */}
            {auditResult.roadmap?.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                <h3 className="text-lg font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#0089C1]" />
                  <span>Executive 30–60–90 Day Remediation Roadmap</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-6">
                  Structured schedule of corrective actions to cure defaults, clear bank post-no-debit risks, and prepare for institutional due diligence.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["30-Day", "60-Day", "90-Day"].map((phase) => {
                    const phaseItems = auditResult.roadmap.filter((item: any) => item.phase === phase);
                    return (
                      <div key={phase} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-sky-100 text-[#0089C1] mb-3">
                            {phase}: {phase === "30-Day" ? "Stop Penalties" : phase === "60-Day" ? "Regularize" : "Governance"}
                          </div>
                          <div className="space-y-3">
                            {phaseItems.map((item: any, i: number) => (
                              <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">{item.authority}</span>
                                <h5 className="font-bold text-xs text-slate-900 mt-0.5">{item.title}</h5>
                                <p className="text-[11px] text-slate-600 mt-1 leading-normal">{item.action}</p>
                                <span className="text-[10px] text-emerald-700 font-bold block mt-2">✓ {item.impact}</span>
                              </div>
                            ))}
                            {phaseItems.length === 0 && (
                              <p className="text-xs text-slate-400 italic">No critical actions required in this window.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ecosystem Conversion Callouts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Claim Free Workspace */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#38BDF8]">HubBusiness Workspace</span>
                  <h3 className="text-xl font-extrabold mt-1 text-display">Claim Your Automated Compliance Workspace</h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                    Auto-provisions your company workspace on ComplianceHub.ng, seeds the exact calendar deadlines discovered in this audit, and unlocks the tamper-evident HubDocs evidence vault.
                  </p>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => setShowClaimModal(true)}
                    className="w-full sm:w-auto bg-[#0089C1] hover:bg-sky-500 text-white font-extrabold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Claim & Provision Free Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card 2: Retain Specialist */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between shadow-xs">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#0089C1]">HubExperts Marketplace</span>
                  <h3 className="text-xl font-extrabold text-slate-950 mt-1 text-display">Retain an Accredited Compliance Specialist</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                    Connect with licensed Data Protection Compliance Organisations (DPCOs), accredited CAC corporate secretaries, and CITN tax consultants under escrow-protected retainers.
                  </p>
                </div>
                <div className="mt-6">
                  <Link href="/experts">
                    <button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer">
                      <span>Browse Verified Compliance Officers</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Claim Workspace Standard Password Modal */}
        {showClaimModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-8 shadow-2xl relative"
            >
              <h3 className="text-xl font-extrabold text-slate-900 text-display">
                Claim {auditResult?.company_name || "Your"} Workspace
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Set a secure password to activate your HubBusiness multi-tenant workspace with your diagnostic obligations pre-seeded.
              </p>

              {claimError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {claimError}
                </div>
              )}

              <form onSubmit={handleClaimWorkspace} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Set Workspace Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={claimPassword}
                    onChange={(e) => setClaimPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0089C1] text-xs font-medium"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claiming}
                    className="bg-[#0089C1] hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {claiming ? "Provisioning..." : "Activate & Enter Dashboard"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>

      <CompliancePublicFooter />
    </div>
  );
}

export default function CorporateAuditPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 border-4 border-[#0089C1] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-700">Loading Corporate Compliance Audit...</p>
        </div>
      }
    >
      <CorporateAuditWizardContent />
    </Suspense>
  );
}
