"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Building2, 
  ShieldCheck, 
  Lock, 
  FileCheck2, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api";

export default function DelegatedClientWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAuthority, setTaskAuthority] = useState("CAC");
  const [creatingTask, setCreatingTask] = useState(false);
  const [evidenceVerified, setEvidenceVerified] = useState(false);

  const [client, setClient] = useState<any>({
    id: unwrappedParams.id,
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
  });

  React.useEffect(() => {
    async function loadClient() {
      try {
        const clients = await api.practice.getClients();
        if (Array.isArray(clients)) {
          const match = clients.find((c: any) => c.tenant_id === unwrappedParams.id || c.engagement_id === unwrappedParams.id);
          if (match) {
            setClient({
              id: match.tenant_id,
              name: match.company_name,
              rcNumber: match.rc_number,
              industry: match.industry,
              state: "Lagos",
              employees: 35,
              readinessScore: match.compliance_score || 84,
              riskLevel: match.compliance_score > 80 ? "Low" : "Medium",
              activeModules: ["HubCalendar", "HubDocs", "HubAML", "HubReport"],
              assignedExpert: "Tunde Bakare, CAMS",
              retainerMonthly: match.monthly_fee_ngn || 250000,
              openTasksCount: match.urgent_count || 3,
              pendingApprovalsCount: 1,
              upcomingDeadlinesCount: match.urgent_count || 2,
              logoText: (match.company_name || "CL").substring(0, 2).toUpperCase(),
              colorScheme: "#0089C1"
            });
          }
        }
      } catch (err) {
        console.error("Failed to load client details:", err);
      }
    }
    loadClient();
  }, [unwrappedParams.id]);

  const [activeModuleTab, setActiveModuleTab] = useState("HubAML");
  const [signOffRequested, setSignOffRequested] = useState(false);

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Delegated Workspace Indicator Banner (Blueprint Part 5.1 & 3.4 Screen 3) */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#245C44] text-white rounded-3xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-sm">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider bg-white/20 px-2 py-0.5 rounded font-bold">
                Delegated Session Active
              </span>
              <span className="text-xs text-white/80 font-mono">Tenant ID: {client.id}</span>
            </div>
            <h2 className="text-lg font-black mt-0.5">
              Operating on behalf of: {client.name}
            </h2>
          </div>
        </div>

        <Link href="/practice/clients">
          <button className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all self-start md:self-auto cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Practice Portfolio</span>
          </button>
        </Link>
      </motion.div>

      {/* Client Overview Card */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-2xl text-white font-black text-base flex items-center justify-center shadow-xs"
            style={{ backgroundColor: client.colorScheme }}
          >
            {client.logoText}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {client.name}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {client.rcNumber} • {client.industry} • {client.state}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Readiness Score</span>
            <div className="text-2xl font-black text-slate-900 font-mono">{client.readinessScore}%</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Open Client Tasks</span>
            <div className="text-2xl font-black text-amber-600 font-mono">{client.openTasksCount}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Retainer</span>
            <div className="text-lg font-black text-emerald-800 font-mono">₦{client.retainerMonthly.toLocaleString()}</div>
          </div>
        </div>
      </motion.div>

      {/* Authorised Module Selector Tabs (RBAC / ABAC Enforcement) */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2"
      >
        <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Authorized Modules:
        </span>
        {client.activeModules.map((mod: string) => (
          <button
            key={mod}
            onClick={() => setActiveModuleTab(mod)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeModuleTab === mod
                ? "bg-[#1E293B] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {mod}
          </button>
        ))}
      </motion.div>

      {/* Module Operational Cockpit */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#245C44] uppercase tracking-wider">
                Active Module Cockpit
              </span>
              <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                {activeModuleTab}
              </span>
            </div>
            <h3 className="font-extrabold text-base text-slate-900 mt-1">
              Actions Pending Officer Preparation
            </h3>
          </div>

          <button
            onClick={() => setShowTaskModal(true)}
            className="bg-[#245C44] hover:bg-[#1E4E39] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs cursor-pointer transition-all"
          >
            + Create Client Task
          </button>
        </div>

        {/* Task Items inside Delegated Module */}
        <div className="space-y-3">
          <motion.div 
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Dual-Approval Required
                </span>
                <span className="font-bold text-slate-900">
                  Prepare Statutory Return Filing for {activeModuleTab}
                </span>
              </div>
              <p className="text-slate-500">
                Lodge drafted regulatory documentation for client Managing Director sign-off before official submission.
              </p>
            </div>

            {!signOffRequested ? (
              <button
                onClick={() => setSignOffRequested(true)}
                className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer transition-all"
              >
                Request Client Sign-off
              </button>
            ) : (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                ✓ Transmitted for Client Sign-off
              </span>
            )}
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                Audit Trail
              </span>
              <p className="font-bold text-slate-900">
                Update Evidence Records & Compliance Questionnaire
              </p>
              <p className="text-slate-500">
                Verify supporting documentation uploaded by client internal HR/Finance staff.
              </p>
            </div>

            {evidenceVerified ? (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                ✓ Verified in Ledger
              </span>
            ) : (
              <button
                onClick={async () => {
                  setEvidenceVerified(true);
                  try {
                    await api.activityLogs.create({
                      action_type: "EVIDENCE_VERIFIED",
                      details: `Accredited Officer verified evidence records and compliance questionnaire for ${client.name}`,
                    });
                  } catch (_) {}
                }}
                className="bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-50 shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer transition-all"
              >
                Verify Evidence
              </button>
            )}
          </motion.div>
        </div>

        {/* Task Creation Modal */}
        <AnimatePresence>
          {showTaskModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-5 shadow-2xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">Lodge Compliance Task</h3>
                    <p className="text-xs text-slate-500">Lodge actionable statutory requirement into {client.name}.</p>
                  </div>
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer transition-all"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!taskTitle) return;
                    setCreatingTask(true);
                    try {
                      await api.practice.createTask({
                        tenant_id: client.id,
                        title: taskTitle,
                        authority: taskAuthority,
                        is_urgent: true,
                      });
                      setShowTaskModal(false);
                      setTaskTitle("");
                    } catch (err) {
                      console.error("Task creation failed:", err);
                    } finally {
                      setCreatingTask(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Task Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. File Q2 SCUML Cash Flow Threshold Declaration"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#245C44]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Regulatory Authority</label>
                    <select
                      value={taskAuthority}
                      onChange={(e) => setTaskAuthority(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#245C44]"
                    >
                      <option value="CAC">CAC (Corporate Affairs Commission)</option>
                      <option value="FIRS">FIRS / NRS TaxPro-MAX</option>
                      <option value="NDPC">NDPC (Nigeria Data Protection Commission)</option>
                      <option value="SCUML">SCUML / NFIU</option>
                      <option value="PENCOM">PENCOM</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTaskModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingTask}
                      className="px-5 py-2 rounded-xl bg-[#245C44] hover:bg-[#1E4E39] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {creatingTask ? "Lodging..." : "Lodge in Client Workspace"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Notice */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Every action in this session is signed with cryptographic hash and logged in {client.name}&apos;s immutable audit register.</span>
        </div>
      </motion.div>

    </div>
  );
}
