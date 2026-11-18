"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  Briefcase, 
  AlertTriangle,
  Lock,
  Calendar,
  User as UserIcon,
  Mail,
  KeyRound,
  Phone
} from "lucide-react";
import { useAuth } from "@/components/ahnara/AuthContext";
import { api } from "@/lib/api";
import { CAC_SECTORS, COMPLIANCE_HEADCOUNT_TIERS } from "@/lib/cacIndustries";
import { defaultEase } from "@/components/motion/MotionTransitions";
import { calculateDynamicReadiness } from "@/lib/SubscriptionHelper";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, switchRole, switchTenant, login } = useAuth();
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1: Business profile (Starts clean with placeholder prompts)
  const [businessName, setBusinessName] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [industry, setIndustry] = useState("Payment Solutions Service Provider (PSSP) & Payment Gateway");
  const [state, setState] = useState("Lagos");
  const [employeeCount, setEmployeeCount] = useState("5-14");

  const NIGERIAN_STATES = [
    "Lagos", "FCT Abuja", "Rivers", "Kano", "Oyo", "Delta", "Ogun", "Anambra", 
    "Abia", "Adamawa", "Akwa Ibom", "Bauchi", "Bayelsa", "Benue", "Borno", 
    "Cross River", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", 
    "Jigawa", "Kaduna", "Katsina", "Kebbi", "Kogi", "Kwara", "Nasarawa", 
    "Niger", "Ondo", "Osun", "Plateau", "Sokoto", "Taraba", "Yobe", "Zamfara"
  ];

  // Step 2: Classification Questions
  const [collectsPersonalData, setCollectsPersonalData] = useState(true);
  const [processesPayments, setProcessesPayments] = useState(true);
  const [isDnfbp, setIsDnfbp] = useState(false);
  const [engagesVendors, setEngagesVendors] = useState(true);
  const [operatesBranches, setOperatesBranches] = useState(false);

  // Step 4: Engagement preference & Account Setup
  const [servicePreference, setServicePreference] = useState<"self" | "expert" | "agency">("expert");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [provisioning, setProvisioning] = useState(false);

  // Dynamic Assessment Calculation based on Diagnostic Engine
  const dynamicAssessment = calculateDynamicReadiness({
    businessName,
    industry,
    employeeCount,
    collectsPersonalData,
    processesPayments,
    isDnfbp,
    engagesVendors,
    operatesBranches,
  });

  const handleStep1Continue = () => {
    if (!businessName.trim()) {
      setErrorMsg("Please provide your registered company name to proceed.");
      return;
    }
    setErrorMsg("");
    setStep(2);
  };

  const handleFinishOnboarding = async () => {
    // Validate credentials if not already signed in
    if (!user) {
      if (!contactEmail.trim() || !contactName.trim() || !password) {
        setErrorMsg("Please provide your Full Name, Work Email, and Password to set up your workspace.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        return;
      }
    }

    setProvisioning(true);
    setErrorMsg("");

    try {
      const result = await api.onboarding.classify({
        business_name: businessName,
        rc_number: rcNumber,
        industry,
        state,
        employee_count: employeeCount,
        collects_personal_data: collectsPersonalData,
        processes_payments: processesPayments,
        is_dnfbp: isDnfbp,
        engages_vendors: engagesVendors,
        operates_branches: operatesBranches,
        service_preference: servicePreference,
        contact_email: user?.email || contactEmail,
        contact_name: user?.name || contactName,
        password: password || undefined,
        phone: phone || undefined,
      });

      if (result && result.token && result.user) {
        // Authenticate new session with signed JWT token
        login(result.token, {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name || result.user.full_name || contactName,
          role: "BUSINESS",
          title: "Managing Director",
          company: businessName,
          rcNumber: rcNumber,
          tenant_id: result.tenant_id,
          plan_tier: "Trial",
        });
      } else if (result && result.tenant_id) {
        switchTenant(result.tenant_id);
        switchRole("BUSINESS");
      }

      router.push("/business/dashboard/");
    } catch (err: any) {
      console.warn("Onboarding API error:", err);
      setErrorMsg(err?.message || "Failed to provision workspace. Please check your network and try again.");
      setProvisioning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col">
      {/* Top Simple Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-300/30 bg-white/70 backdrop-blur-xs">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 p-1.5 shadow-xs flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 text-display">
            ComplianceHub<span className="text-[#0089C1]">.ng</span>
          </span>
        </Link>

        {/* Step Indicator Pills */}
        <div className="hidden sm:flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                step === s
                  ? "bg-[#0089C1] text-white shadow-xs"
                  : step > s
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <span>Step {s}</span>
              {step > s && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
            </div>
          ))}
        </div>

        <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-slate-900">
          Already registered? Sign In
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: defaultEase }}
          className="bg-white rounded-[36px] max-w-2xl w-full p-6 sm:p-10 border border-slate-200/90 shadow-xl space-y-8"
        >
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}
          
          {/* STEP 1: BUSINESS PROFILE */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black text-[#0089C1] uppercase tracking-wider block mb-1">
                  Step 1 of 4 • Entity Setup
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
                  Create Your Business Profile
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Provide your registered Nigerian entity details. We use this to retrieve and link your official statutory obligations.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      if (errorMsg) setErrorMsg("");
                    }}
                    placeholder="e.g. PayWave Technologies Ltd or Konga Logistics Ltd"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CAC Registration / RC Number</label>
                    <input
                      type="text"
                      value={rcNumber}
                      onChange={(e) => setRcNumber(e.target.value)}
                      placeholder="e.g. RC-1894231"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary State of Operation</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                    >
                      {NIGERIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s} State</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* CAC Nature of Business / Primary Industry Sector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Primary Industry Sector (CAC Nature of Business)
                    </label>
                    <span className="text-[10px] text-[#0089C1] font-bold uppercase tracking-wider">
                      CAC NISIC Framework (21 Sectors)
                    </span>
                  </div>
                  <select
                    value={industry}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setIndustry(selectedVal);
                      for (const sec of CAC_SECTORS) {
                        const matchedSub = sec.subCategories.find(s => s.name === selectedVal);
                        if (matchedSub?.isDnfbp) {
                          setIsDnfbp(true);
                        }
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30 font-medium"
                  >
                    {CAC_SECTORS.map((sector) => (
                      <optgroup key={sector.id} label={`${sector.code}: ${sector.name}`}>
                        {sector.subCategories.map((sub) => (
                          <option key={sub.id} value={sub.name}>
                            {sub.name} {sub.regulatoryBody ? `• (${sub.regulatoryBody})` : ""}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Compliance Headcount Bracket */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Workforce Headcount (FIRS / ITF / NSITF Threshold)
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Determines statutory training contribution mandates
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {COMPLIANCE_HEADCOUNT_TIERS.map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setEmployeeCount(tier.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          employeeCount === tier.id
                            ? "bg-sky-50 border-[#0089C1] text-[#0089C1] font-bold shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <span className="text-xs block font-bold">{tier.id}</span>
                        <span className="text-[9px] text-slate-500 block truncate">{tier.category}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleStep1Continue}
                  className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-7 py-3 rounded-2xl text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>Continue to Classification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: REGULATORY CLASSIFICATION DIAGNOSTIC */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black text-[#0089C1] uppercase tracking-wider block mb-1">
                  Step 2 of 4 • Diagnostic Engine
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
                  Regulatory Classification Questions
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  These answers determine your exposure under the NDPA 2023, Money Laundering Act 2022, and Nigeria Tax Act 2025/2026.
                </p>
              </div>

              <div className="space-y-3">
                {/* Question 1: Data Protection */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      Do you collect, store, or process personal data of Nigerian citizens?
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Triggers NDPA 2023 RoPA requirements and NDPC statutory audit filings.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCollectsPersonalData(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        collectsPersonalData ? "bg-[#0089C1] text-white shadow-xs" : "bg-white text-slate-700 border"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollectsPersonalData(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !collectsPersonalData ? "bg-[#0089C1] text-white shadow-xs" : "bg-white text-slate-700 border"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Question 2: Payments / Financial Services */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      Do you process payments or hold customer funds?
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Triggers CBN regulatory guidelines and Tier 1-3 KYC obligations.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProcessesPayments(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        processesPayments ? "bg-[#0089C1] text-white shadow-xs" : "bg-white text-slate-700 border"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setProcessesPayments(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !processesPayments ? "bg-[#0089C1] text-white shadow-xs" : "bg-white text-slate-700 border"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Question 3: DNFBP */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      Are you a Designated Non-Financial Business & Profession (DNFBP)?
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Law firms, accounting practices, real estate dealers, car dealers, luxury retailers.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDnfbp(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isDnfbp ? "bg-[#0089C1] text-white shadow-xs" : "bg-white text-slate-700 border"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDnfbp(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !isDnfbp ? "bg-[#0089C1] text-white shadow-xs" : "bg-white text-slate-700 border"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Question 4: Third-party vendors */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      Do you engage external third-party suppliers or contractors?
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Requires Data Processing Agreements (DPA) and Withholding Tax deductions.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEngagesVendors(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        engagesVendors ? "bg-[#0089C1] text-white shadow-xs" : "bg-white text-slate-700 border"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setEngagesVendors(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !engagesVendors ? "bg-[#0089C1] text-white shadow-xs" : "bg-white text-slate-700 border"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Question 5: Multi-state Branches */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      Do you operate physical offices or branches across multiple states?
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Requires multi-state Internal Revenue Service (SIRS) PAYE remittances.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOperatesBranches(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        operatesBranches ? "bg-[#0089C1] text-white shadow-xs" : "bg-white text-slate-700 border"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setOperatesBranches(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !operatesBranches ? "bg-[#0089C1] text-white shadow-xs" : "bg-white text-slate-700 border"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-7 py-3 rounded-2xl text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>Generate Obligations Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AUTOMATED COMPLIANCE ASSESSMENT (Dynamic Real-Time Diagnostic Engine) */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black text-emerald-700 uppercase tracking-wider block mb-1">
                  Step 3 of 4 • Diagnostic Results
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
                  Your Statutory Compliance Profile
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Based on your classification, our engine matched <strong>{dynamicAssessment.matchedObligations.length} primary statutory obligations</strong> across Nigerian regulatory authorities.
                </p>
              </div>

              {/* Dynamic Readiness Score Banner */}
              <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                dynamicAssessment.riskLevel === "Low Risk"
                  ? "bg-emerald-50 border-emerald-200"
                  : dynamicAssessment.riskLevel === "Moderate Risk"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-rose-50 border-rose-200"
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg font-mono text-white shadow-xs ${
                    dynamicAssessment.riskLevel === "Low Risk"
                      ? "bg-emerald-600"
                      : dynamicAssessment.riskLevel === "Moderate Risk"
                      ? "bg-amber-500"
                      : "bg-rose-600"
                  }`}>
                    {dynamicAssessment.score}%
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">
                      Preliminary Statutory Readiness Indicator
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {dynamicAssessment.urgentCount} urgent statutory obligations require active documentation or accredited sign-off.
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full ${
                  dynamicAssessment.riskLevel === "Low Risk"
                    ? "bg-emerald-200 text-emerald-900"
                    : dynamicAssessment.riskLevel === "Moderate Risk"
                    ? "bg-amber-200 text-amber-900"
                    : "bg-rose-200 text-rose-900"
                }`}>
                  {dynamicAssessment.riskLevel}
                </span>
              </div>

              {/* Dynamically Matched Obligations List */}
              <div className="space-y-2.5">
                {dynamicAssessment.matchedObligations.map((ob) => (
                  <div key={ob.id} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{ob.title}</span>
                      <span className="text-[11px] text-slate-500">{ob.authority} • {ob.deadlineNotice}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      ob.statusColor === "red"
                        ? "bg-red-100 text-red-800"
                        : ob.statusColor === "purple"
                        ? "bg-purple-100 text-purple-800"
                        : ob.statusColor === "amber"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-sky-100 text-[#0089C1]"
                    }`}>
                      {ob.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-7 py-3 rounded-2xl text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>Select Operating Model</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SELECT SERVICE / OPERATING MODEL & CREDENTIAL PROVISIONING */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black text-[#0089C1] uppercase tracking-wider block mb-1">
                  Step 4 of 4 • Workspace Operating Model
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
                  How Would You Like to Manage Compliance?
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  You own all company data. Select whether your internal team manages it independently or with delegated specialist support.
                </p>
              </div>

              <div className="space-y-3">
                {/* Option 1: Engage Verified Compliance Officer */}
                <div
                  onClick={() => setServicePreference("expert")}
                  className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                    servicePreference === "expert"
                      ? "bg-sky-50/50 border-[#0089C1] shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    servicePreference === "expert" ? "border-[#0089C1] bg-[#0089C1] text-white" : "border-slate-300"
                  }`}>
                    {servicePreference === "expert" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">
                        Engage a Verified Fractional Compliance Officer
                      </h4>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Connect an accredited professional (like Tunde Bakare, CAMS) to prepare your filings, handle NDPC audits, and conduct AML reviews under revocable delegated permissions.
                    </p>
                  </div>
                </div>

                {/* Option 2: Manage Independently */}
                <div
                  onClick={() => setServicePreference("self")}
                  className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                    servicePreference === "self"
                      ? "bg-sky-50/50 border-[#0089C1] shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    servicePreference === "self" ? "border-[#0089C1] bg-[#0089C1] text-white" : "border-slate-300"
                  }`}>
                    {servicePreference === "self" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Manage Compliance Independently (In-House Team)
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Use HubCalendar, HubDocs, and automated notification alerts to run statutory compliance internally without outside consultants.
                    </p>
                  </div>
                </div>

                {/* Option 3: Engage Consulting Agency */}
                <div
                  onClick={() => setServicePreference("agency")}
                  className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                    servicePreference === "agency"
                      ? "bg-sky-50/50 border-[#0089C1] shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    servicePreference === "agency" ? "border-[#0089C1] bg-[#0089C1] text-white" : "border-slate-300"
                  }`}>
                    {servicePreference === "agency" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Engage a Full-Service Compliance Consulting Agency
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Deploy an institutional compliance advisory firm (like Apex Advisory Partners) with multi-officer coverage and corporate governance oversight.
                    </p>
                  </div>
                </div>
              </div>

              {/* 14-Day Free Trial Spotlight */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-sky-50/70 to-indigo-50 border border-sky-200 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#0089C1] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-xs text-slate-900 uppercase tracking-wide">
                      14-Day Full Professional Trial Included
                    </h4>
                    <span className="text-[10px] bg-sky-200 text-[#0089C1] font-extrabold px-2 py-0.5 rounded-full">
                      ₦45,000 Free Value
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Your workspace is provisioned with 14 days of unrestricted access to HubAML, NDPA 2023 RoPA, HubDocs, and TaxPro-MAX automated preparation. No credit card required upfront.
                  </p>
                </div>
              </div>

              {/* Account Credentials (Shown if not authenticated) */}
              {!user ? (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Create Administrator Credentials</h4>
                    <p className="text-[11px] text-slate-500">
                      You will use these credentials to sign in and securely govern {businessName || "your workspace"}.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => {
                            setContactName(e.target.value);
                            if (errorMsg) setErrorMsg("");
                          }}
                          placeholder="e.g. Babatunde Fashola"
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Work Email <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => {
                            setContactEmail(e.target.value);
                            if (errorMsg) setErrorMsg("");
                          }}
                          placeholder="e.g. md@company.ng"
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errorMsg) setErrorMsg("");
                          }}
                          placeholder="•••••••••••• (min 6 characters)"
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +234 803 123 4567"
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Workspace Administrator</span>
                    <span className="font-bold text-slate-900">{user.name} ({user.email})</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Signed In
                  </span>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  disabled={provisioning}
                  className="bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-8 py-3 rounded-2xl text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  {provisioning ? (
                    <span>Provisioning Workspace & Trial...</span>
                  ) : (
                    <>
                      <span>Activate Free Trial & Enter Cockpit</span>
                      <Sparkles className="w-4 h-4 text-[#0089C1]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </main>
    </div>
  );
}
