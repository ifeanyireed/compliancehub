"use client";

import React, { useState, useEffect } from "react";
import { 
  Receipt, 
  Search, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Download, 
  TrendingUp,
  ArrowUpRight
} from "lucide-react";

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/api/admin/invoices`);
        if (res.ok) setInvoices(await res.json());
      } catch (e) {
        console.warn("Using fallback invoices", e);
      }
    }
    loadInvoices();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Billing, Invoices & Escrow Settlements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Monitor client retainer invoices, 10% platform take rates, and accredited expert escrow releases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-xs font-bold border border-purple-200/70">
            Monthly Platform Fees: ₦2,485,000
          </span>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Invoice ID & Date</th>
                <th className="py-3.5 px-6">Client Company</th>
                <th className="py-3.5 px-6">Statutory Service</th>
                <th className="py-3.5 px-6">Accredited Expert</th>
                <th className="py-3.5 px-6">Amount (NGN)</th>
                <th className="py-3.5 px-6">Escrow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="font-mono font-bold text-slate-900 block">{inv.id}</span>
                    <span className="text-[10px] text-slate-400">{inv.date}</span>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap font-bold text-slate-900">
                    {inv.client}
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap text-slate-600">
                    {inv.service}
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap text-slate-700 font-semibold">
                    {inv.expert}
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="font-bold text-slate-900 block">₦{inv.amount_ngn.toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">+₦{inv.fee_revenue.toLocaleString()} fee</span>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.status === "PAID"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
