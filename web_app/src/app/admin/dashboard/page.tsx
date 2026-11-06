"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  FileCheck2, 
  Receipt, 
  Headphones, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  FileText,
  Plus
} from "lucide-react";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState({
    total_companies: 1420,
    active_practitioners: 385,
    filings_completed: 8912,
    pending_filings: 142,
    monthly_revenue_ngn: 24850000,
    open_support_tickets: 3,
    active_chat_sessions: 2,
    compliance_health_rate: 98.4
  });

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/api/admin/metrics`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.warn("Using fallback admin metrics", err);
      }
    }
    fetchMetrics();
  }, []);

  const recentFilings = [
    {
      company: "PayWave Technologies Ltd",
      rc: "RC-1894231",
      filing: "CAMA 2020 Annual Returns",
      authority: "CAC",
      status: "COMPLETED",
      officer: "Tunde Bakare, CAMS",
      time: "25 mins ago"
    },
    {
      company: "Kobo Logistics Nigeria Ltd",
      rc: "RC-1429910",
      filing: "Monthly VAT Remittance",
      authority: "FIRS TaxPro-MAX",
      status: "COMPLETED",
      officer: "Chiamaka Eze",
      time: "1 hour ago"
    },
    {
      company: "Zenith Micro-Fintech Ltd",
      rc: "RC-1992011",
      filing: "NDPA 2023 Statutory Audit",
      authority: "NDPC",
      status: "IN_REVIEW",
      officer: "Apex Advisory Partners",
      time: "3 hours ago"
    },
    {
      company: "Horizon Cloud Solutions Ltd",
      rc: "RC-1678120",
      filing: "SCUML DNFBP Annual AML Report",
      authority: "SCUML / NFIU",
      status: "COMPLETED",
      officer: "Tunde Bakare, CAMS",
      time: "5 hours ago"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Super Admin Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Nigeria Statutory Compliance Health
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Cross-tenant regulatory monitoring across Corporate Affairs Commission (CAC), FIRS, NDPC, and SCUML.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/blog">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition-all">
              <Plus className="w-4 h-4" />
              <span>Publish Blog Post</span>
            </button>
          </Link>
          <Link href="/admin/support">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all">
              <Headphones className="w-4 h-4" />
              <span>Support Desk</span>
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Companies */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Corporate Tenants</span>
            <Building2 className="w-4 h-4 text-[#0089C1]" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.total_companies.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.2% MoM growth</span>
          </div>
        </div>

        {/* Filings Completed */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Completed Filings</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.filings_completed.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-slate-500">
            <span>{metrics.pending_filings} awaiting CAC seal</span>
          </div>
        </div>

        {/* Monthly Retainer Volume */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Monthly Retainers</span>
            <Receipt className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₦{(metrics.monthly_revenue_ngn / 1000000).toFixed(2)}M
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Escrow protected</span>
          </div>
        </div>

        {/* Open Inquiries & Chat */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Active Support Sessions</span>
            <MessageSquare className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.open_support_tickets} Tickets • {metrics.active_chat_sessions} Chats
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>98.4% SLA Compliance</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Filings Feed & Operational Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Filings Feed */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Live Statutory Filing Submissions
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Real-time submissions processed by accredited compliance officers
              </p>
            </div>
            <span className="text-[11px] font-bold text-[#0089C1] hover:underline cursor-pointer">
              View All Filings
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {recentFilings.map((f, i) => (
              <div key={i} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {f.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{f.company}</span>
                      <span className="text-[10px] font-mono text-slate-400">{f.rc}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {f.filing} • <span className="text-slate-700 font-semibold">{f.authority}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    f.status === "COMPLETED" 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {f.status}
                  </span>
                  <div className="text-[10px] text-slate-400 font-medium mt-1">
                    {f.time} • {f.officer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Regulatory Authority Breakdown */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">
              Filing Breakdown by Authority
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Distribution of obligations automated across Nigeria
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Corporate Affairs Commission (CAC)</span>
                  <span>42%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="w-[42%] h-full bg-[#0089C1]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Federal Inland Revenue (FIRS)</span>
                  <span>34%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="w-[34%] h-full bg-emerald-500" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Data Protection Commission (NDPC)</span>
                  <span>14%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="w-[14%] h-full bg-purple-500" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>SCUML / NFIU AML Returns</span>
                  <span>10%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="w-[10%] h-full bg-amber-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link href="/admin/users">
              <button className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors text-center">
                Review Registered Companies Directory
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
