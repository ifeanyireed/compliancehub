"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
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
  Printer,
  Copy,
  Check
} from "lucide-react";
import { CompliancePublicNav } from "@/components/layout/CompliancePublicNav";
import { CompliancePublicFooter } from "@/components/layout/CompliancePublicFooter";
import { api, setAuthToken, setActiveTenantID } from "@/lib/api";
import { defaultEase } from "@/components/motion/MotionTransitions";

function CorporateAuditReportContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [report, setReport] = useState<any>(null);

  // Claim Modal
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimPassword, setClaimPassword] = useState("");
  const [claimError, setClaimError] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (token) {
      loadReport(token);
    }
    if (searchParams.get("claim") === "1") {
      setShowClaimModal(true);
    }
  }, [token, searchParams]);

  const loadReport = async (reportToken: string) => {
    setLoading(true);
    try {
      const res = await api.corporateAudit.getReport(reportToken);
      if (res && res.company_name) {
        setReport(res);
      } else {
        setErrorMsg("Audit report could not be found or has expired.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load audit diagnostic report.");
    } finally {
      setLoading(false);
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
        report_token: token,
        password: claimPassword,
        full_name: report.contact_name,
        email: report.contact_email,
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
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
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
        {loading && (
          <div className="text-center py-24">
            <div className="w-12 h-12 rounded-full border-4 border-[#0089C1] border-t-transparent animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Loading Corporate Audit Diagnostic...</h3>
            <p className="text-xs text-slate-500 mt-1">Retrieving official statutory verification report</p>
          </div>
        )}

        {!loading && errorMsg && (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Audit Report Not Found</h2>
            <p className="text-xs text-slate-500 mt-2 mb-6">{errorMsg}</p>
            <Link href="/corporate-audit">
              <button className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 mx-auto cursor-pointer">
                <Sparkles className="w-4 h-4" />
                <span>Run New Corporate Audit</span>
              </button>
            </Link>
          </div>
        )}

        {!loading && report && (
          <div className="space-y-8">
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
                    {report.company_name}
                  </h1>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">
                    Statutory reference: <strong>{report.rc_number || "RC-Pending"}</strong> &bull; Generated: {new Date(report.created_at || Date.now()).toLocaleDateString("en-NG", { dateStyle: "long" })}
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
                    <span className="text-4xl font-extrabold text-white text-display">{report.compliance_score}</span>
                    <span className="text-slate-400 text-sm font-bold">/ 100</span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${getScoreColor(report.compliance_score)}`}>
                      {report.risk_level}
                    </span>
                  </div>
                </div>

                {/* Estimated Penalties */}
                <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-rose-400">Cumulative Penalty Liability</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2 text-display">
                    {formatNGN(report.total_penalty_exposure || 0)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Potential statutory fines & late filing surcharges if audited today.
                  </p>
                </div>

                {/* Infractions count */}
                <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">Active Deficits Flagged</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2 text-display">
                    {report.infractions?.length || 0} Infractions
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
                {report.pillars && Object.entries(report.pillars).map(([key, p]: [string, any]) => (
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
            {report.infractions?.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                <h3 className="text-lg font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <span>Priority Regulatory Infractions & Remedies</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-6">
                  Specific legal infractions identified against Nigerian statutory codes, showing potential default liability and recommended cures.
                </p>

                <div className="space-y-4">
                  {report.infractions.map((inf: any, idx: number) => (
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
            {report.roadmap?.length > 0 && (
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
                    const phaseItems = report.roadmap.filter((item: any) => item.phase === phase);
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
          </div>
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
                Claim {report?.company_name || "Your"} Workspace
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
                    value={report?.contact_email || ""}
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
                    value={report?.contact_name || ""}
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

export default function CorporateAuditReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 border-4 border-[#0089C1] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-700">Loading Corporate Audit Diagnostic Report...</p>
        </div>
      }
    >
      <CorporateAuditReportContent />
    </Suspense>
  );
}
