"use client";

import React, { useState, use } from "react";
import Link from "next/link";
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
import { MOCK_CLIENT_WORKSPACES } from "@/lib/compliance-data";

export default function DelegatedClientWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const client = MOCK_CLIENT_WORKSPACES.find(c => c.id === unwrappedParams.id) || MOCK_CLIENT_WORKSPACES[0];
  const [activeModuleTab, setActiveModuleTab] = useState(client.activeModules[0] || "HubAML");
  const [signOffRequested, setSignOffRequested] = useState(false);

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Delegated Workspace Indicator Banner (Blueprint Part 5.1 & 3.4 Screen 3) */}
      <div className="bg-[#245C44] text-white rounded-3xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
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
          <button className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all self-start md:self-auto">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Practice Portfolio</span>
          </button>
        </Link>
      </div>

      {/* Client Overview Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
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
      </div>

      {/* Authorised Module Selector Tabs (RBAC / ABAC Enforcement) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Authorized Modules:
        </span>
        {client.activeModules.map((mod) => (
          <button
            key={mod}
            onClick={() => setActiveModuleTab(mod)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeModuleTab === mod
                ? "bg-[#1E293B] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {mod}
          </button>
        ))}
      </div>

      {/* Module Operational Cockpit */}
      <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
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
            onClick={() => {
              const taskTitle = prompt("Enter the title of the compliance task to lodge for this client:");
              if (taskTitle) {
                alert(`Task "${taskTitle}" lodged in ${client.name}'s workspace.`);
              }
            }}
            className="bg-[#245C44] hover:bg-[#1E4E39] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
          >
            + Create Client Task
          </button>
        </div>

        {/* Task Items inside Delegated Module */}
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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
                className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs whitespace-nowrap self-start sm:self-auto"
              >
                Request Client Sign-off
              </button>
            ) : (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                ✓ Transmitted for Client Sign-off
              </span>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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

            <button
              onClick={() => alert("Verification timestamp logged in client immutable ledger.")}
              className="bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-50 shadow-xs whitespace-nowrap self-start sm:self-auto"
            >
              Verify Evidence
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Every action in this session is signed with cryptographic hash and logged in {client.name}&apos;s immutable audit register.</span>
        </div>
      </div>

    </div>
  );
}
