"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Download, 
  CheckCircle2, 
  ArrowUpRight, 
  Building2, 
  FileText, 
  Plus, 
  Sparkles, 
  TrendingUp,
  Loader2
} from "lucide-react";
import { api } from "@/lib/api";

export default function PracticeCommercialPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedSlaClient, setSelectedSlaClient] = useState<any | null>(null);

  const loadCommercialData = async () => {
    setLoading(true);
    try {
      const [clientsRes, invoicesRes] = await Promise.all([
        api.practice.getClients(),
        api.invoices.list(),
      ]);

      if (Array.isArray(clientsRes)) {
        setClients(
          clientsRes.map((c: any) => ({
            id: c.tenant_id,
            name: c.company_name,
            rcNumber: c.rc_number || "RC-Pending",
            industry: c.industry || "General Industry",
            retainerMonthly: Number(c.monthly_fee_ngn) || 250000,
            activeModules: ["HubCalendar", "HubDocs", "HubAML", "HubReport"],
            logoText: (c.company_name || "CL").slice(0, 2).toUpperCase(),
            colorScheme: "#0089C1",
          }))
        );
      } else {
        setClients([]);
      }

      if (Array.isArray(invoicesRes)) {
        setInvoices(
          invoicesRes.map((inv: any) => ({
            id: inv.invoice_number || inv.id,
            client: inv.client_name,
            amount: Number(inv.amount_ngn) || 0,
            date: inv.created_at ? new Date(inv.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Recent",
            status: inv.status === "SETTLED" ? "Settled via Paystack" : inv.status === "DISBURSED" ? "Disbursed to Bank" : "Pending Payment",
            payoutRef: inv.payout_ref || "PSTK_TR_" + (inv.id ? inv.id.substring(0, 6) : "849100"),
          }))
        );
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error("Failed to load commercial billing data from database:", err);
      setClients([]);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommercialData();
  }, []);

  const totalMonthlyRetainers = clients.reduce((acc, c) => acc + (c.retainerMonthly || 0), 0);

  const handleGenerateInvoices = async () => {
    if (clients.length === 0) {
      alert("No active client workspaces available for billing.");
      return;
    }
    setGenerating(true);
    try {
      for (const c of clients) {
        await api.invoices.create({
          client_name: c.name,
          amount_ngn: c.retainerMonthly,
          invoice_type: "RETAINER",
        });
      }
      alert(`Successfully generated monthly billing batch for ${clients.length} active client entities!`);
      await loadCommercialData();
    } catch (err) {
      console.error("Failed to generate invoices:", err);
      alert("Billing generation encountered an issue, please try again.");
    } finally {
      setGenerating(false);
    }
  };

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
          onClick={handleGenerateInvoices}
          disabled={generating}
          className="bg-[#245C44] hover:bg-[#1E4E39] disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-xs flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>{generating ? "Generating..." : "Generate Monthly Invoices"}</span>
        </button>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2"
        >
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Monthly Retainer Volume
          </span>
          <div className="text-3xl font-black text-slate-900 font-mono">
            ₦{totalMonthlyRetainers.toLocaleString()}
          </div>
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Across {clients.length} Retainer Clients
          </span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2"
        >
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Next Paystack Payout
          </span>
          <div className="text-3xl font-black text-emerald-800 font-mono">
            ₦{totalMonthlyRetainers.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 font-medium">Scheduled for 1st of next month</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2"
        >
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Average Client Yield (ARPA)
          </span>
          <div className="text-3xl font-black text-[#0089C1] font-mono">
            ₦{clients.length > 0 ? Math.round(totalMonthlyRetainers / clients.length).toLocaleString() : "0"}
          </div>
          <span className="text-xs text-slate-500 font-medium">Monthly recurring fee per client</span>
        </motion.div>
      </div>

      {/* Active Retainers Table */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900">Active Engagement Agreements</h3>
          <span className="text-xs text-slate-400 font-mono">{clients.length} Active Contracts</span>
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
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No active clients found in database.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
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
                        onClick={() => setSelectedSlaClient(c)}
                        className="text-[#245C44] hover:underline font-bold cursor-pointer"
                      >
                        View SLA
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Past Collections */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4"
      >
        <h3 className="font-extrabold text-base text-slate-900">Recent Disbursements & Invoices</h3>
        <div className="space-y-2.5">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-slate-100 rounded-2xl">
              No billing invoices found. Click &quot;Generate Monthly Invoices&quot; to issue billing.
            </div>
          ) : (
            invoices.map((inv) => (
              <motion.div 
                key={inv.id} 
                whileHover={{ y: -1 }}
                className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between text-xs"
              >
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
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* SLA Modal */}
      <AnimatePresence>
        {selectedSlaClient && (
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
              className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Master Service Agreement & SLA</h3>
                  <p className="text-xs text-slate-500">{selectedSlaClient.name} ({selectedSlaClient.rcNumber})</p>
                </div>
                <button
                  onClick={() => setSelectedSlaClient(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p><strong>Retainer Fee:</strong> ₦{selectedSlaClient.retainerMonthly.toLocaleString()}/month</p>
                <p><strong>Billing Cadence:</strong> Monthly automated recurring debit via Paystack Escrow</p>
                <p><strong>Scope of Authority:</strong> CAMA 2020 annual filings, FIRS TaxPro-MAX remittances, NDPA 2023 RoPA audit</p>
                <p><strong>Dispute Resolution:</strong> High Court of Lagos State Commercial Division Arbitration</p>
              </div>

              <button
                onClick={() => setSelectedSlaClient(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-all"
              >
                Close Agreement
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
