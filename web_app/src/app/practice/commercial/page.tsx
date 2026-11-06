"use client";

import React, { useState } from "react";
import { 
  CreditCard, 
  Download, 
  CheckCircle2, 
  ArrowUpRight, 
  Building2, 
  FileText, 
  Plus, 
  Sparkles,
  TrendingUp
} from "lucide-react";
import { MOCK_CLIENT_WORKSPACES } from "@/lib/compliance-data";

export default function PracticeCommercialPage() {
  const [clients] = useState(MOCK_CLIENT_WORKSPACES);

  const totalMonthlyRetainers = clients.reduce((acc, c) => acc + c.retainerMonthly, 0);

  const pastInvoices = [
    {
      id: "INV-2026-101",
      client: "PayWave Technologies Ltd",
      amount: 250000,
      date: "01 Feb 2026",
      status: "Settled via Paystack",
      payoutRef: "PSTK_TR_849102"
    },
    {
      id: "INV-2026-102",
      client: "Swift Health HMO Ltd",
      amount: 300000,
      date: "01 Feb 2026",
      status: "Settled via Paystack",
      payoutRef: "PSTK_TR_849103"
    },
    {
      id: "INV-2026-103",
      client: "Zenith Retail Chains Ltd",
      amount: 220000,
      date: "01 Feb 2026",
      status: "Settled via Paystack",
      payoutRef: "PSTK_TR_849104"
    },
    {
      id: "INV-2026-104",
      client: "Prime Haulage & Logistics Ltd",
      amount: 180000,
      date: "01 Feb 2026",
      status: "Disbursed to Bank",
      payoutRef: "PSTK_TR_849105"
    }
  ];

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Banner */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#245C44] uppercase tracking-wider block mb-1">
            Commercial & Billing Cockpit
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
            Practice Engagements & Fee Collections
          </h1>
          <p className="text-xs text-slate-500">
            Automated monthly client retainers, scope of work agreements, and Paystack direct merchant payouts.
          </p>
        </div>

        <button 
          onClick={() => alert("Generated new retainer billing batch for all active client entities.")}
          className="bg-[#245C44] hover:bg-[#1E4E39] text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-xs flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Monthly Invoices</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Monthly Retainer Volume
          </span>
          <div className="text-3xl font-black text-slate-900 font-mono">
            ₦{totalMonthlyRetainers.toLocaleString()}
          </div>
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Across 5 Retainer Clients
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Next Paystack Payout
          </span>
          <div className="text-3xl font-black text-emerald-800 font-mono">
            ₦{totalMonthlyRetainers.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 font-medium">Scheduled for 1st of next month</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Average Client Yield (ARPA)
          </span>
          <div className="text-3xl font-black text-[#0089C1] font-mono">
            ₦{Math.round(totalMonthlyRetainers / clients.length).toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 font-medium">Monthly recurring fee per client</span>
        </div>
      </div>

      {/* Active Retainers Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900">Active Engagement Agreements</h3>
          <span className="text-xs text-slate-400 font-mono">5 Active Contracts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Client Business</th>
                <th className="py-3.5 px-4">Retainer Scope</th>
                <th className="py-3.5 px-4">Fee / Month</th>
                <th className="py-3.5 px-4">Billing Schedule</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-6 text-right">Contract Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center"
                      style={{ backgroundColor: c.colorScheme }}
                    >
                      {c.logoText}
                    </div>
                    <div>
                      <span>{c.name}</span>
                      <span className="block text-[10px] text-slate-400 font-mono font-normal">{c.rcNumber}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600">
                    <span className="font-medium">Fractional Compliance Director</span>
                    <span className="block text-[10px] text-slate-400">{c.activeModules.slice(0, 3).join(", ")}</span>
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-slate-900">
                    ₦{c.retainerMonthly.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-slate-600">Monthly Auto-Debited</td>
                  <td className="py-4 px-4 text-emerald-700 font-bold">Paystack Escrow</td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => alert(`Downloading verified legal agreement for ${c.name}`)}
                      className="text-[#245C44] hover:underline font-bold"
                    >
                      View SLA
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Past Collections */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-slate-900">Recent Disbursements & Invoices</h3>
        <div className="space-y-2.5">
          {pastInvoices.map((inv) => (
            <div key={inv.id} className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">{inv.id} • {inv.client}</span>
                <span className="text-[10px] text-slate-500 font-mono">Date: {inv.date} • Ref: {inv.payoutRef}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-900">₦{inv.amount.toLocaleString()}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
