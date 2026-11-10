"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Calendar
} from "lucide-react";
import { useAuth } from "@/components/ahnara/AuthContext";
import { api } from "@/lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, switchRole, switchTenant } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1: Business profile
  const [businessName, setBusinessName] = useState("PayWave Technologies Ltd");
  const [rcNumber, setRcNumber] = useState("RC-1894231");
  const [industry, setIndustry] = useState("FinTech & Digital Payments");
  const [state, setState] = useState("Lagos");
  const [employeeCount, setEmployeeCount] = useState("35");

  // Step 2: Classification Questions
  const [collectsPersonalData, setCollectsPersonalData] = useState(true);
  const [processesPayments, setProcessesPayments] = useState(true);
  const [isDnfbp, setIsDnfbp] = useState(false);
  const [engagesVendors, setEngagesVendors] = useState(true);
  const [operatesBranches, setOperatesBranches] = useState(false);

  // Step 4: Engagement preference
  const [servicePreference, setServicePreference] = useState<"self" | "expert" | "agency">("expert");

  const [provisioning, setProvisioning] = useState(false);

  const handleFinishOnboarding = async () => {
    setProvisioning(true);
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
        contact_email: user?.email,
        contact_name: user?.name,
      });

      if (result && result.tenant_id) {
        switchTenant(result.tenant_id);
      }
    } catch (err) {
      console.warn("Onboarding API error, continuing:", err);
    } finally {
      switchRole("BUSINESS");
      router.push("/business/dashboard");
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
        <div className="bg-white rounded-[36px] max-w-2xl w-full p-6 sm:p-10 border border-slate-200/90 shadow-xl space-y-8">
          
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Registered Company Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
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
                      <option value="Lagos">Lagos State</option>
                      <option value="Abuja">FCT Abuja</option>
                      <option value="Rivers">Rivers (Port Harcourt)</option>
                      <option value="Kano">Kano State</option>
                      <option value="Oyo">Oyo (Ibadan)</option>
                      <option value="Delta">Delta State</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Industry Sector</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                    >
                      <option value="FinTech & Digital Payments">FinTech & Digital Payments</option>
                      <option value="Supply Chain & Logistics">Supply Chain & Logistics</option>
                      <option value="Healthcare & HMO">Healthcare & HMO</option>
                      <option value="Retail & Consumer Goods (DNFBP)">Retail & Consumer Goods (DNFBP)</option>
                      <option value="Agro-Processing & Commodity Export">Agro-Processing & Commodity Export</option>
                      <option value="Legal & Professional Services">Legal & Professional Services</option>
                      <option value="Real Estate & Construction">Real Estate & Construction</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Employee Headcount</label>
                    <select
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                    >
                      <option value="1-10">1 – 10 Employees</option>
                      <option value="11-50">11 – 50 Employees</option>
                      <option value="51-200">51 – 200 Employees</option>
                      <option value="200+">200+ Employees (Large Corporate)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-7 py-3 rounded-2xl text-xs shadow-xs flex items-center gap-2"
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        collectsPersonalData ? "bg-[#0089C1] text-white" : "bg-white text-slate-700 border"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollectsPersonalData(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        !collectsPersonalData ? "bg-[#0089C1] text-white" : "bg-white text-slate-700 border"
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        processesPayments ? "bg-[#0089C1] text-white" : "bg-white text-slate-700 border"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setProcessesPayments(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        !processesPayments ? "bg-[#0089C1] text-white" : "bg-white text-slate-700 border"
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        isDnfbp ? "bg-[#0089C1] text-white" : "bg-white text-slate-700 border"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDnfbp(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        !isDnfbp ? "bg-[#0089C1] text-white" : "bg-white text-slate-700 border"
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        engagesVendors ? "bg-[#0089C1] text-white" : "bg-white text-slate-700 border"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setEngagesVendors(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        !engagesVendors ? "bg-[#0089C1] text-white" : "bg-white text-slate-700 border"
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
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-7 py-3 rounded-2xl text-xs shadow-xs flex items-center gap-2"
                >
                  <span>Generate Obligations Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AUTOMATED COMPLIANCE ASSESSMENT (Blueprint Part 1.1 Question 1-5) */}
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
                  Based on your classification, our engine matched <strong>6 primary statutory obligations</strong> across 4 Nigerian authorities.
                </p>
              </div>

              {/* Preliminary Readiness Score Banner */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-base font-mono">
                    78%
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-amber-950">
                      Preliminary Internal Readiness Indicator
                    </h4>
                    <p className="text-[11px] text-amber-800">
                      3 urgent obligations require documentation or professional verification.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold bg-amber-200 text-amber-900 px-2 py-1 rounded">
                  Moderate Risk
                </span>
              </div>

              {/* Matched Obligations List */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">CAC Annual Return Filing (CAMA 2020)</span>
                    <span className="text-[11px] text-slate-500">Corporate Affairs Commission • Due June 30</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    In Progress
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Nigeria Tax Act 2025/2026 CIT & VAT Remittance</span>
                    <span className="text-[11px] text-slate-500">NRS / FIRS TaxPro-MAX • Transition Framework</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                    Urgent (18d)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">NDPA 2023 Statutory Privacy Audit Return</span>
                    <span className="text-[11px] text-slate-500">Nigeria Data Protection Commission • Due March 15</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Audit Due
                  </span>
                </div>

                {isDnfbp && (
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">SCUML AML/CFT Annual Return</span>
                      <span className="text-[11px] text-slate-500">Special Control Unit Against Money Laundering</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      DNFBP Mandate
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-7 py-3 rounded-2xl text-xs shadow-xs flex items-center gap-2"
                >
                  <span>Select Operating Model</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SELECT SERVICE / OPERATING MODEL (Blueprint Part 3.2 Step 4) */}
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
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                    servicePreference === "expert"
                      ? "bg-sky-50/50 border-[#0089C1] shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center ${
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
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                    servicePreference === "self"
                      ? "bg-sky-50/50 border-[#0089C1] shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center ${
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
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                    servicePreference === "agency"
                      ? "bg-sky-50/50 border-[#0089C1] shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center ${
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

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  disabled={provisioning}
                  className="bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-8 py-3 rounded-2xl text-xs shadow-md flex items-center gap-2"
                >
                  {provisioning ? (
                    <span>Provisioning Isolated Workspace...</span>
                  ) : (
                    <>
                      <span>Enter Workspace Cockpit</span>
                      <Sparkles className="w-4 h-4 text-[#0089C1]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
