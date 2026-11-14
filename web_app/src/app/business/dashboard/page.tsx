"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  Users, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  ChevronRight,
  Upload,
  UserPlus,
  Lock,
  Building2,
  FolderArchive
} from "lucide-react";
import { api } from "@/lib/api";
import { MotionCard, MotionSection } from "@/components/motion/MotionTransitions";

export default function BusinessDashboardOverview() {
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreFilter, setScoreFilter] = useState("all");
  const [tenantData, setTenantData] = useState<any>(null);
  const [urgentDeadlines, setUrgentDeadlines] = useState<any[]>([]);
  const [engagements, setEngagements] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadCockpitData() {
      try {
        const [tenantResp, obligations, engResp, logResp] = await Promise.all([
          api.tenants.getCurrent(),
          api.calendar.getObligations({ status: "Pending" }),
          api.practice.getEngagements(),
          api.activityLogs.list(),
        ]);

        if (tenantResp && tenantResp.tenant) {
          setTenantData(tenantResp);
        }

        if (Array.isArray(engResp)) {
          setEngagements(engResp);
        }

        if (Array.isArray(logResp)) {
          setActivityLogs(logResp);
        }

        if (Array.isArray(obligations)) {
          const urgents = obligations.filter((o: any) => o.is_urgent).map((o: any) => ({
            id: o.id,
            title: o.title,
            authority: (o.authority as any) || "CAC",
            applicableLaw: o.authority === "CAC" ? "CAMA 2020 s.377" : "Nigeria Tax Act 2026",
            deadline: o.due_date,
            daysRemaining: 14,
            frequency: "Annual",
            status: "Pending" as const,
            assignedTo: "Tunde Bakare, CAMS",
            penaltyDescription: o.estimated_penalty_ngn ? `₦${Number(o.estimated_penalty_ngn).toLocaleString()} statutory penalty` : "Statutory fine",
            requiredEvidence: "Digital acknowledgment receipt",
            isUrgent: true,
            category: "Statutory Filing" as const
          }));
          setUrgentDeadlines(urgents);
        }
      } catch (err) {
        console.error("Cockpit loading error:", err);
      }
    }
    loadCockpitData();
  }, []);

  return (
    <div className="space-y-8 select-none">
      
      {/* Top Welcome & Health Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0089C1] uppercase tracking-wider">
              {tenantData?.tenant?.workspace_name || "PayWave Technologies Ltd"} ({tenantData?.tenant?.rc_number || "RC-1894231"})
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-500 font-medium">{tenantData?.tenant?.industry || "FinTech • Lagos"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
            Compliance Operations Cockpit
          </h1>
          <p className="text-xs text-slate-500">
            Workspace verified under CAMA 2020 and 2026 Nigeria Tax Act guidelines • Neon DB Connected.
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/business/documents">
            <button className="bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs flex items-center gap-2 transition-all">
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Upload Evidence</span>
            </button>
          </Link>
          <Link href="/business/professionals">
            <button className="bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs flex items-center gap-2 transition-all">
              <UserPlus className="w-4 h-4" />
              <span>Manage Professionals (2 Active)</span>
            </button>
          </Link>
        </div>
      </motion.div>

      {/* Primary KPI Grid (Blueprint Part 3.2 Screen 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Readiness Score Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
          onClick={() => setShowScoreModal(true)}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs cursor-pointer hover:border-[#0089C1] transition-all flex flex-col justify-between group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-500">Readiness Score</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              Passable
            </span>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900 font-mono tracking-tight">
              {tenantData?.tenant?.compliance_score || 84}%
            </span>
            <span className="text-xs text-slate-400 font-medium">/ 100%</span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div 
                className="h-full bg-[#0089C1] rounded-full" 
                style={{ width: `${tenantData?.tenant?.compliance_score || 84}%` }} 
              />
            </div>
            <p className="text-[11px] text-slate-500 group-hover:text-[#0089C1] font-semibold flex items-center justify-between">
              <span>View score breakdown</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </motion.div>

        {/* Metric 2: Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-500">Approaching Deadlines</span>
            <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
              Action Required
            </span>
          </div>

          <div className="my-3">
            <span className="text-4xl font-black text-red-600 font-mono tracking-tight">3</span>
            <span className="text-xs text-slate-400 ml-2">within 30 days</span>
          </div>

          <p className="text-[11px] text-slate-500 font-medium">
            Next: <strong className="text-slate-800">CIT Annual Return (18 days)</strong>
          </p>
        </motion.div>

        {/* Metric 3: Missing Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-500">Missing Evidence</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
              Audit Gap
            </span>
          </div>

          <div className="my-3">
            <span className="text-4xl font-black text-amber-600 font-mono tracking-tight">2</span>
            <span className="text-xs text-slate-400 ml-2">critical records</span>
          </div>

          <p className="text-[11px] text-slate-500 font-medium">
            Missing: <strong className="text-slate-800">2025 Tax Clearance (TCC)</strong>
          </p>
        </motion.div>

        {/* Metric 4: Active Professionals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-500">Delegated Experts</span>
            <span className="text-[10px] bg-sky-100 text-[#0089C1] px-2 py-0.5 rounded-full font-bold">
              HubAgents
            </span>
          </div>

          <div className="my-3 flex items-center gap-2">
            <span className="text-4xl font-black text-slate-900 font-mono tracking-tight">2</span>
            <div className="flex -space-x-2">
              <img src="/character1.jpg" alt="Tunde" className="w-7 h-7 rounded-full border-2 border-white object-cover" />
              <img src="/character2.jpg" alt="Folashade" className="w-7 h-7 rounded-full border-2 border-white object-cover" />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 font-medium">
            Tunde Bakare (AML) & Folashade (NDPA)
          </p>
        </motion.div>

      </div>

      {/* Two Column Layout: Urgent Deadlines vs Active Experts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Upcoming Deadlines & Tasks (7 Cols) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="lg:col-span-7 space-y-6"
        >
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Critical Statutory Deadlines
                </h3>
                <p className="text-xs text-slate-500">
                  Deadlines synchronised with CAC, FIRS, and NDPC statutory calendars.
                </p>
              </div>
              <Link href="/business/calendar" className="text-xs font-bold text-[#0089C1] hover:underline flex items-center gap-1">
                <span>View Full Calendar</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {urgentDeadlines.map((obl, idx) => (
                <motion.div
                  key={obl.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                        {obl.authority}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {obl.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Law: <span className="font-medium text-slate-700">{obl.applicableLaw}</span>
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-red-600 font-bold">
                      <Clock className="w-3 h-3" />
                      <span>{obl.daysRemaining} days remaining ({obl.deadline})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                      {obl.status}
                    </span>
                    <Link href="/business/calendar">
                      <button className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs">
                        Review
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Missing Documents & Action Required */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              Required Evidence Gaps (2 Pending)
            </h3>
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Tax Clearance Certificate (TCC) 2025</h4>
                    <p className="text-[10px] text-slate-500">Required for federal and state procurement compliance.</p>
                  </div>
                </div>
                <Link href="/business/documents">
                  <button className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs">
                    Upload
                  </button>
                </Link>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Signed Staff Anti-Bribery Policy Form</h4>
                    <p className="text-[10px] text-slate-500">Mandatory under SCUML AML/CFT annual filing requirement.</p>
                  </div>
                </div>
                <Link href="/business/documents">
                  <button className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs">
                    Upload
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Delegated Professionals & Audit Log (5 Cols) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="lg:col-span-5 space-y-6"
        >
          
          {/* Active Professionals Card (Blueprint Part 3.2 Screen 4) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                Engaged Compliance Officers
              </h3>
              <Link href="/business/professionals" className="text-xs font-bold text-[#0089C1] hover:underline">
                Manage Access
              </Link>
            </div>

            <div className="space-y-3">
              {engagements.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-xs text-slate-500">No external compliance officer engaged yet.</p>
                </div>
              ) : (
                engagements.map((eng: any) => (
                  <div key={eng.id} className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={eng.avatar_url || "/character1.jpg"}
                        alt={eng.professional_name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{eng.professional_name}</h4>
                        <p className="text-[10px] text-slate-500">{eng.firm_name || eng.qualification || "Accredited Officer"}</p>
                        <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">
                          {(eng.specialisations || []).slice(0, 2).join(" • ") || "Statutory Retainer"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {eng.status || "Active"}
                    </span>
                  </div>
                ))
              )}
            </div>

            <Link href="/experts">
              <button className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Hire Another Specialist</span>
              </button>
            </Link>
          </div>

          {/* Immutable Audit Trail Log (Blueprint Part 5.3) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">
                Immutable Activity Trail
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Tenant: {tenantData?.tenant?.slug || "paywave-ng"}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {activityLogs.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center text-slate-400 text-xs">
                  No activity events logged yet.
                </div>
              ) : (
                activityLogs.slice(0, 4).map((log: any) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-800 font-semibold leading-tight">
                        <span className="font-bold text-slate-900">{log.actor_name}: </span>
                        {log.details}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {log.created_at ? new Date(log.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent"}
                        {" • "}Action: <span className="font-mono text-slate-600">{log.action_type}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </motion.div>

      </div>

      {/* Readiness Score Breakdown Modal (Blueprint Part 3.2 Screen 2 Explainability) */}
      <AnimatePresence>
        {showScoreModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    Compliance Readiness Methodology
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transparent criteria breakdown (Overall: 82% Readiness)
                  </p>
                </div>
                <button
                  onClick={() => setShowScoreModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 text-amber-900 text-[11px] leading-relaxed">
                <strong>Statutory Transparency Notice:</strong> This score represents internal administrative readiness based on completed tasks and uploaded documentation. It does not replace statutory regulatory clearance from the CAC, FIRS, or NDPC.
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-700">CAC Statutory Standing (CAMA 2020)</span>
                  <span className="font-mono font-bold text-emerald-700">95% (Compliant)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-700">Nigeria Tax Act 2025/2026 Readiness</span>
                  <span className="font-mono font-bold text-amber-700">75% (TCC Pending)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-700">NDPA 2023 Data Protection Accountability</span>
                  <span className="font-mono font-bold text-emerald-700">88% (RoPA Active)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-700">SCUML AML/CFT Due Diligence Records</span>
                  <span className="font-mono font-bold text-amber-700">70% (Staff Code Pending)</span>
                </div>
              </div>

              <button
                onClick={() => setShowScoreModal(false)}
                className="w-full bg-[#1E293B] hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs transition-colors"
              >
                Close Diagnostic
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
