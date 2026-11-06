"use client";

import React, { useState } from "react";
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
  UserCheck
} from "lucide-react";

interface PracticeTask {
  id: string;
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
  const [tasks, setTasks] = useState<PracticeTask[]>([
    {
      id: "task-01",
      title: "Draft 2026 Nigeria Tax Act CIT Return Computation Sheet",
      clientName: "PayWave Technologies Ltd",
      clientLogo: "PW",
      clientColor: "#0089C1",
      statutoryAuthority: "FIRS / NRS",
      deadline: "30 June 2026",
      status: "In Progress",
      priority: "High",
      dualApproval: true
    },
    {
      id: "task-02",
      title: "Verify NDPA 2023 RoPA Staff Records for Annual Audit",
      clientName: "PayWave Technologies Ltd",
      clientLogo: "PW",
      clientColor: "#0089C1",
      statutoryAuthority: "NDPC",
      deadline: "15 March 2026",
      status: "Pending Client Approval",
      priority: "High",
      dualApproval: true
    },
    {
      id: "task-03",
      title: "File Overdue Port Transit Operating Permits",
      clientName: "Prime Haulage & Logistics Ltd",
      clientLogo: "PH",
      clientColor: "#FF904C",
      statutoryAuthority: "State Transport Authority",
      deadline: "20 Feb 2026",
      status: "Assigned",
      priority: "High",
      dualApproval: false
    },
    {
      id: "task-04",
      title: "Submit SCUML Q1 AML Currency Transaction Log",
      clientName: "Zenith Retail Chains Ltd",
      clientLogo: "ZR",
      clientColor: "#C88A3A",
      statutoryAuthority: "SCUML",
      deadline: "31 March 2026",
      status: "In Progress",
      priority: "Normal",
      dualApproval: false
    },
    {
      id: "task-05",
      title: "CAC Annual Return Filing (CAMA 2020 s.377)",
      clientName: "Swift Health HMO Ltd",
      clientLogo: "SH",
      clientColor: "#166534",
      statutoryAuthority: "CAC",
      deadline: "30 June 2026",
      status: "Approved & Filed",
      priority: "Normal",
      dualApproval: true
    }
  ]);

  const [filterStatus, setFilterStatus] = useState("All");

  const handleApprove = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "Approved & Filed" } : t));
  };

  const filteredTasks = tasks.filter(t => filterStatus === "All" || t.status === filterStatus);

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Banner */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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
          onClick={() => {
            const task = prompt("Enter title of task to assign across client entities:");
            if (task) {
              const newTask: PracticeTask = {
                id: `task-${Date.now()}`,
                title: task,
                clientName: "PayWave Technologies Ltd",
                clientLogo: "PW",
                clientColor: "#0089C1",
                statutoryAuthority: "CAC",
                deadline: "30 June 2026",
                status: "Assigned",
                priority: "Normal",
                dualApproval: false
              };
              setTasks([newTask, ...tasks]);
            }
          }}
          className="bg-[#245C44] hover:bg-[#1E4E39] text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-xs flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Practice Task</span>
        </button>
      </div>

      {/* Status Filter Chips */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Pipeline Status:
        </span>
        {["All", "Assigned", "In Progress", "Pending Client Approval", "Approved & Filed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === s
                ? "bg-[#1E293B] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-xl text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs"
                style={{ backgroundColor: t.clientColor }}
              >
                {t.clientLogo}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{t.clientName}</span>
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

              {t.status === "Pending Client Approval" && (
                <button
                  onClick={() => handleApprove(t.id)}
                  className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-xs transition-all"
                >
                  Record Client Sign-Off
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
