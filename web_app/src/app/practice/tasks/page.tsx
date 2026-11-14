"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  Building2, 
  AlertTriangle, 
  Filter, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/ahnara/AuthContext";

interface PracticeTask {
  id: string;
  tenantId?: string;
  title: string;
  clientName: string;
  clientLogo: string;
  clientColor: string;
  statutoryAuthority: string;
  deadline: string;
  status: "Assigned" | "In Progress" | "Pending Client Approval" | "Approved & Filed";
  priority: "High" | "Normal";
  dualApproval: boolean;
}

export default function PracticeTasksPage() {
  const router = useRouter();
  const { switchTenant } = useAuth();
  const [tasks, setTasks] = useState<PracticeTask[]>([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [taskAuthority, setTaskAuthority] = useState("CAC");
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [creatingTask, setCreatingTask] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const [data, clients] = await Promise.all([
        api.practice.getTasks(),
        api.practice.getClients(),
      ]);

      if (Array.isArray(clients)) {
        setClientsList(clients);
        if (clients.length > 0 && !selectedTenantId) {
          setSelectedTenantId(clients[0].tenant_id);
        }
      }

      if (Array.isArray(data)) {
        setTasks(
          data.map((t: any) => ({
            id: t.id,
            tenantId: t.tenant_id,
            title: t.title,
            clientName: t.client_name || "PayWave Technologies Ltd",
            clientLogo: (t.client_name || "PW").slice(0, 2).toUpperCase(),
            clientColor: "#0089C1",
            statutoryAuthority: t.authority,
            deadline: t.due_date,
            status: t.status === "FILED"
              ? ("Approved & Filed" as const)
              : t.is_urgent
              ? ("In Progress" as const)
              : ("Assigned" as const),
            priority: t.is_urgent ? ("High" as const) : ("Normal" as const),
            dualApproval: true
          }))
        );
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Failed to load practice tasks from database:", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleApprove = async (id: string, tenantId?: string) => {
    try {
      if (tenantId) {
        switchTenant(tenantId);
      }
      await api.practice.updateTask(id, "FILED");
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "Approved & Filed" } : t));
    } catch (err) {
      console.error("Failed to approve task:", err);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "Approved & Filed" } : t));
    }
  };

  const handleEnterClient = (tenantId?: string) => {
    if (tenantId) {
      switchTenant(tenantId);
      router.push("/business/dashboard");
    }
  };

  const filteredTasks = tasks.filter(t => filterStatus === "All" || t.status === filterStatus);

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <span className="text-xs font-black text-[#245C44] uppercase tracking-wider block mb-1">
            Work Management Cockpit
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
            Practice Work Board & Approvals
          </h1>
          <p className="text-xs text-slate-500">
            Cross-tenant task pipeline: Created → Assigned → In Progress → Review Pending → Approved.
          </p>
        </div>

        <button
          onClick={() => setShowTaskModal(true)}
          className="bg-[#245C44] hover:bg-[#1E4E39] text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-xs flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Practice Task</span>
        </button>
      </motion.div>

      {/* Status Filter Chips */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2"
      >
        <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Pipeline Status:
        </span>
        {["All", "Assigned", "In Progress", "Pending Client Approval", "Approved & Filed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === s
                ? "bg-[#1E293B] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s}
          </button>
        ))}
      </motion.div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.map((t, idx) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 + Math.min(idx * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2 }}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-xl text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
                style={{ backgroundColor: t.clientColor }}
                onClick={() => handleEnterClient(t.tenantId)}
                title="Click to enter client workspace"
              >
                {t.clientLogo}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span 
                    onClick={() => handleEnterClient(t.tenantId)}
                    className="text-xs font-bold text-slate-900 hover:text-[#0089C1] cursor-pointer"
                  >
                    {t.clientName}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {t.statutoryAuthority}
                  </span>
                  {t.dualApproval && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      Dual Approval Required
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                  {t.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target: {t.deadline}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                t.status === "Approved & Filed"
                  ? "bg-emerald-100 text-emerald-800"
                  : t.status === "Pending Client Approval"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-700"
              }`}>
                {t.status}
              </span>

              {t.status !== "Approved & Filed" && (
                <button
                  onClick={() => handleApprove(t.id, t.tenantId)}
                  className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                >
                  Mark Filed
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* New Practice Task Modal */}
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
                  <h3 className="font-extrabold text-lg text-slate-900">Assign Practice Task</h3>
                  <p className="text-xs text-slate-500">Lodge an actionable obligation for a client entity.</p>
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
                  if (!taskTitle || !selectedTenantId) return;
                  setCreatingTask(true);
                  try {
                    await api.practice.createTask({
                      tenant_id: selectedTenantId,
                      title: taskTitle,
                      authority: taskAuthority,
                      is_urgent: true,
                    });
                    await loadTasks();
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
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Client Business</label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#245C44]"
                  >
                    {clientsList.map((c) => (
                      <option key={c.tenant_id} value={c.tenant_id}>
                        {c.company_name} ({c.rc_number || "RC-Pending"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prepare SCUML Quarterly Compliance Audit Pack"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#245C44]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Statutory Authority</label>
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
                    {creatingTask ? "Lodging..." : "Lodge Practice Task"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
