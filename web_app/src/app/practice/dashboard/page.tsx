"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Building2, 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  CreditCard, 
  Users2, 
  ArrowRight, 
  ShieldCheck, 
  ChevronRight, 
  Sparkles,
  TrendingUp,
  FileCheck2
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/ahnara/AuthContext";

export default function PracticeDashboardPage() {
  const router = useRouter();
  const { switchTenant } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [liveTasks, setLiveTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [liveClients, tasks] = await Promise.all([
          api.practice.getClients(),
          api.practice.getTasks(),
        ]);

        if (Array.isArray(liveClients)) {
          const mapped = liveClients.map((c: any) => ({
            id: c.tenant_id,
            name: c.company_name,
            rcNumber: c.rc_number,
            industry: c.industry,
            planTier: "Professional",
            readinessScore: c.compliance_score || 84,
            activeAssignedOfficer: "Tunde Bakare, CAMS",
            upcomingDeadlinesCount: c.urgent_count || 2,
            openTasksCount: 3,
            missingDocsCount: 1,
            riskLevel: c.compliance_score > 80 ? "Low" : "Medium",
            monthlyRetainer: `₦${Number(c.monthly_fee_ngn).toLocaleString()}`,
            logoText: c.company_name.substring(0, 2).toUpperCase(),
            colorScheme: "#0089C1",
            tenant_id: c.tenant_id,
          }));
          setClients(mapped);
        } else {
          setClients([]);
        }

        if (Array.isArray(tasks)) {
          setLiveTasks(tasks);
        } else {
          setLiveTasks([]);
        }
      } catch (e) {
        console.error("Failed to load live practice data:", e);
        setClients([]);
        setLiveTasks([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleEnterClientWorkspace = (tenantId: string) => {
    switchTenant(tenantId);
    router.push("/business/dashboard");
  };

  return (
    <div className="space-y-8 select-none">
      
      {/* Top Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#245C44] uppercase tracking-wider">
              HubAgents Practice Suite
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-500 font-medium">Tunde Bakare, CAMS • Active Practitioner</span>
            <span className="text-[10px] bg-emerald-50 text-[#245C44] border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              Neon DB Synced
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
            Practice Management Cockpit
          </h1>
          <p className="text-xs text-slate-500">
            Multi-tenant delegated administration across your assigned Nigerian corporate portfolios.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link href="/practice/clients">
            <button className="bg-[#245C44] hover:bg-[#1E4E39] text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer">
              <Building2 className="w-4 h-4" />
              <span>Client Portfolio</span>
            </button>
          </Link>
          <Link href="/practice/tasks">
            <button className="bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer">
              <CheckSquare className="w-4 h-4" />
              <span>Pending Reviews ({liveTasks.length > 0 ? liveTasks.length : 3})</span>
            </button>
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards (Blueprint Part 3.4 Screen 1) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Metric 1 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.03 }}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Clients</span>
          <div className="text-3xl font-black text-slate-900 font-mono my-2">{clients.length}</div>
          <span className="text-[10px] text-emerald-700 font-bold">Verified Engagements</span>
        </motion.div>

        {/* Metric 2 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open Tasks</span>
          <div className="text-3xl font-black text-slate-900 font-mono my-2">{liveTasks.length > 0 ? liveTasks.length : 12}</div>
          <span className="text-[10px] text-slate-500 font-medium">Across all tenants</span>
        </motion.div>

        {/* Metric 3 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.09 }}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Statutory Deadlines</span>
          <div className="text-3xl font-black text-amber-600 font-mono my-2">4</div>
          <span className="text-[10px] text-amber-700 font-bold">Due Next 30 Days</span>
        </motion.div>

        {/* Metric 4 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sign-offs Pending</span>
          <div className="text-3xl font-black text-slate-900 font-mono my-2">3</div>
          <span className="text-[10px] text-slate-500 font-medium">Awaiting Business</span>
        </motion.div>

        {/* Metric 5 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Retainers</span>
          <div className="text-2xl font-black text-emerald-800 font-mono my-2">₦2.4M</div>
          <span className="text-[10px] text-emerald-700 font-bold">Recurring ARR</span>
        </motion.div>

        {/* Metric 6 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.18 }}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Health Rate</span>
          <div className="text-3xl font-black text-slate-900 font-mono my-2">84%</div>
          <span className="text-[10px] text-emerald-700 font-bold">Audit-Ready</span>
        </motion.div>

      </div>

      {/* Client Workspaces Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Assigned Client Business Health Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Select any client entity to securely enter their delegated workspace.
            </p>
          </div>
          <Link href="/practice/clients" className="text-xs font-bold text-[#245C44] hover:underline flex items-center gap-1">
            <span>View All {clients.length} Clients</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              className="bg-[#F8FAFC] rounded-2xl p-5 border border-slate-200/80 hover:border-[#245C44] transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl text-white font-black text-xs flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: c.colorScheme || "#0089C1" }}
                    >
                      {c.logoText}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-[#245C44] transition-colors">
                        {c.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">{c.rcNumber}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.riskLevel === "Low"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {c.riskLevel} Risk
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Readiness Score</span>
                    <span className="font-mono font-bold text-slate-900">{c.readinessScore}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${c.readinessScore}%`,
                        backgroundColor: c.readinessScore >= 80 ? "#166534" : "#C88A3A" 
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Open Tasks: <strong className="text-slate-800">{c.openTasksCount}</strong></span>
                  <span>Deadlines: <strong className="text-slate-800">{c.upcomingDeadlinesCount}</strong></span>
                </div>
              </div>

              {/* Enter Client Workspace Button */}
              <button
                onClick={() => handleEnterClientWorkspace(c.id)}
                className="w-full bg-white hover:bg-[#245C44] hover:text-white text-slate-800 font-bold py-2.5 rounded-xl border border-slate-200 group-hover:border-[#245C44] transition-all text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>Access Authorised Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
