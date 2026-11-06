"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  UserCheck, 
  ShieldAlert, 
  Lock, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  ExternalLink,
  ShieldCheck,
  Eye,
  FileCheck2,
  Calendar,
  CreditCard
} from "lucide-react";

interface EngagedPro {
  id: string;
  name: string;
  avatar: string;
  specialisation: string;
  firm: string;
  authorisedModules: string[];
  dualApprovalRequired: boolean;
  engagementType: string;
  monthlyFee: number;
  renewalDate: string;
  status: "Active" | "Access Revoked" | "Pending Sign-off";
}

export default function BusinessProfessionalsPage() {
  const [professionals, setProfessionals] = useState<EngagedPro[]>([
    {
      id: "pro-01",
      name: "Tunde Bakare, CAMS",
      avatar: "/character1.jpg",
      specialisation: "AML/CFT & SCUML Practice Director",
      firm: "Bakare Compliance Consultancy",
      authorisedModules: ["HubAML", "HubAudit", "HubReport"],
      dualApprovalRequired: true,
      engagementType: "Fractional Retainer",
      monthlyFee: 250000,
      renewalDate: "15 Dec 2026",
      status: "Active"
    },
    {
      id: "pro-02",
      name: "Barr. Folashade Adeleke, CDPO",
      avatar: "/character2.jpg",
      specialisation: "Licensed DPCO Lead Auditor",
      firm: "Adeleke & Partners Legal Practitioners",
      authorisedModules: ["HubPrivacy", "HubDocs"],
      dualApprovalRequired: false,
      engagementType: "Statutory Audit Engagement",
      monthlyFee: 300000,
      renewalDate: "30 Mar 2026",
      status: "Active"
    }
  ]);

  const [revokedBanner, setRevokedBanner] = useState<string | null>(null);

  const handleRevoke = (id: string, name: string) => {
    if (confirm(`Are you sure you want to revoke access for ${name}? Active sessions and API tokens will be terminated immediately pursuant to Blueprint Part 5.1.`)) {
      setProfessionals(prev => prev.map(p => p.id === id ? { ...p, status: "Access Revoked" } : p));
      setRevokedBanner(`Access immediately revoked for ${name}. Token invalidated across all endpoints.`);
      setTimeout(() => setRevokedBanner(null), 5000);
    }
  };

  const handleToggleDualApproval = (id: string) => {
    setProfessionals(prev => prev.map(p => p.id === id ? { ...p, dualApprovalRequired: !p.dualApprovalRequired } : p));
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Banner */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0089C1] text-white">
              DELEGATION
            </span>
            <span className="text-xs font-black text-[#0089C1] uppercase tracking-wider">
              HubAgents Workspace Delegation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
            My Compliance Professionals
          </h1>
          <p className="text-xs text-slate-500">
            Granular access controls, dual-approval requirements, and instant session termination for all outside consultants.
          </p>
        </div>

        <Link href="/experts">
          <button className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-xs flex items-center gap-2 transition-all self-start md:self-auto">
            <Plus className="w-4 h-4" />
            <span>Engage New Specialist</span>
          </button>
        </Link>
      </div>

      {/* Revocation Alert Banner */}
      {revokedBanner && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-bold flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{revokedBanner}</span>
        </div>
      )}

      {/* Security Rule Card (Blueprint Part 5.1 & 5.2) */}
      <div className="bg-white/80 rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <strong className="text-slate-900">Multi-Tenant Isolation Enforced:</strong> Professionals receive delegated, time-bound access scoped strictly to authorized modules. They cannot view documents from modules they have not been explicitly assigned.
        </div>
      </div>

      {/* Professionals List */}
      <div className="space-y-4">
        {professionals.map((pro) => (
          <div
            key={pro.id}
            className={`bg-white rounded-3xl p-6 md:p-8 border shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
              pro.status === "Access Revoked" ? "opacity-60 border-red-200 bg-red-50/20" : "border-slate-200"
            }`}
          >
            {/* Left: Professional Info */}
            <div className="flex items-start gap-4">
              <img
                src={pro.avatar}
                alt={pro.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900">{pro.name}</h3>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    pro.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  }`}>
                    {pro.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-semibold">{pro.specialisation}</p>
                <p className="text-[11px] text-slate-400">{pro.firm}</p>

                {/* Authorized modules */}
                <div className="pt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Authorized:</span>
                  {pro.authorisedModules.map((m, i) => (
                    <span key={i} className="text-[10px] font-mono font-bold bg-[#E8EFF4] text-slate-800 px-2 py-0.5 rounded">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle: Engagement details */}
            <div className="grid grid-cols-2 gap-4 text-xs border-t lg:border-t-0 lg:border-l border-slate-200 lg:pl-6 pt-4 lg:pt-0">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Monthly Retainer</span>
                <span className="font-mono font-bold text-slate-900 text-sm">₦{pro.monthlyFee.toLocaleString()}/mo</span>
                <span className="text-[10px] text-slate-500 block">Renews {pro.renewalDate}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Dual Approval Rule</span>
                <button
                  onClick={() => handleToggleDualApproval(pro.id)}
                  disabled={pro.status === "Access Revoked"}
                  className={`mt-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    pro.dualApprovalRequired
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {pro.dualApprovalRequired ? "Enforced (MD Must Sign)" : "Standard Delegation"}
                </button>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 pt-2 lg:pt-0">
              {pro.status === "Active" ? (
                <button
                  onClick={() => handleRevoke(pro.id, pro.name)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revoke Access</span>
                </button>
              ) : (
                <button
                  onClick={() => setProfessionals(prev => prev.map(p => p.id === pro.id ? { ...p, status: "Active" } : p))}
                  className="bg-[#0089C1] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
                >
                  Reinstate Access
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
