"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  FileCheck2,
  Sparkles,
  Loader2
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/ahnara/AuthContext";

export default function PracticeClientsPage() {
  const router = useRouter();
  const { switchTenant } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedRisk, setSelectedRisk] = useState("All");
  const [loading, setLoading] = useState(true);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newRcNumber, setNewRcNumber] = useState("");
  const [newIndustry, setNewIndustry] = useState("FinTech");
  const [newMonthlyFee, setNewMonthlyFee] = useState("250000");
  const [creatingClient, setCreatingClient] = useState(false);

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const data = await api.practice.getClients();
      if (Array.isArray(data)) {
        setClients(
          data.map((c: any) => ({
            id: c.tenant_id,
            name: c.company_name,
            rcNumber: c.rc_number || "RC-Pending",
            industry: c.industry || "General Industry",
            state: "Lagos",
            employees: 24,
            readinessScore: c.compliance_score || 80,
            riskLevel: c.compliance_score < 70 ? ("High" as const) : c.compliance_score < 85 ? ("Medium" as const) : ("Low" as const),
            activeModules: ["HubCalendar", "HubDocs", "HubAML", "HubReport"],
            assignedExpert: "Tunde Bakare, CAMS",
            retainerMonthly: c.monthly_fee_ngn || 250000,
            openTasksCount: c.urgent_count || 1,
            pendingApprovalsCount: 1,
            upcomingDeadlinesCount: c.urgent_count || 2,
            colorScheme: "#0089C1",
            logoText: (c.company_name || "CL").slice(0, 2).toUpperCase()
          }))
        );
      } else {
        setClients([]);
      }
    } catch (err) {
      console.error("Failed to load client workspaces from database:", err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;
    setCreatingClient(true);
    try {
      await api.practice.createClient({
        legal_name: newClientName,
        rc_number: newRcNumber,
        industry: newIndustry,
        monthly_fee: parseFloat(newMonthlyFee) || 250000,
      });
      await loadWorkspaces();
      setShowInviteModal(false);
      setNewClientName("");
      setNewRcNumber("");
    } catch (err) {
      console.error("Failed creating client:", err);
    } finally {
      setCreatingClient(false);
    }
  };

  const handleEnterWorkspace = (tenantId: string) => {
    switchTenant(tenantId);
    router.push("/business/dashboard");
  };

  const filtered = clients.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.rcNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = selectedRisk === "All" || c.riskLevel === selectedRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Banner */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#245C44] uppercase tracking-wider block mb-1">
            HubAgents Cockpit
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
            Client Business Portfolio
          </h1>
          <p className="text-xs text-slate-500">
            Secure multi-tenant boundaries. Select any client entity to operate within their authorised modules.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-[#245C44] hover:bg-[#1E4E39] text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-xs flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Invite New Client Business</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 mr-1">Risk Filter:</span>
          {["All", "Low", "Medium", "High"].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRisk(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRisk === r
                  ? "bg-[#1E293B] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search client name, RC number, or sector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#245C44]/30"
          />
        </div>
      </div>

      {/* Client Portfolio Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-[#245C44] transition-all flex flex-col justify-between space-y-6 group"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl text-white font-black text-sm flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: c.colorScheme }}
                  >
                    {c.logoText}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#245C44] transition-colors leading-snug">
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">{c.rcNumber} • {c.state}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  c.riskLevel === "Low"
                    ? "bg-emerald-100 text-emerald-800"
                    : c.riskLevel === "Medium"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {c.riskLevel} Risk
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Readiness Score</span>
                  <span className="font-mono font-bold text-slate-900">{c.readinessScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${c.readinessScore}%`,
                      backgroundColor: c.readinessScore >= 80 ? "#166534" : c.readinessScore >= 70 ? "#C88A3A" : "#EF4444" 
                    }}
                  />
                </div>
              </div>

              {/* Authorised Modules */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Authorised Delegated Modules:
                </span>
                <div className="flex flex-wrap gap-1">
                  {c.activeModules.map((m: string, i: number) => (
                    <span key={i} className="text-[10px] font-mono font-bold bg-[#E8EFF4] text-slate-800 px-2 py-0.5 rounded">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Monthly Retainer</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  ₦{c.retainerMonthly.toLocaleString()}<span className="text-xs font-normal text-slate-500">/mo</span>
                </span>
              </div>

              <button
                onClick={() => handleEnterWorkspace(c.id)}
                className="bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Client Business Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Onboard Corporate Client</h3>
                <p className="text-xs text-slate-500">Configure new client workspace and establish practice retainer.</p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Company Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Logistics Nigeria Ltd"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#245C44]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">CAC Registration (RC Number)</label>
                <input
                  type="text"
                  placeholder="e.g. RC-1849201"
                  value={newRcNumber}
                  onChange={(e) => setNewRcNumber(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#245C44]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Industry Sector</label>
                <select
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#245C44]"
                >
                  <option value="FinTech">FinTech & Payments</option>
                  <option value="Logistics">Logistics & Supply Chain</option>
                  <option value="Healthcare">Healthcare & HealthTech</option>
                  <option value="Retail">Retail & E-Commerce</option>
                  <option value="Agribusiness">Agribusiness & Export</option>
                  <option value="Manufacturing">Manufacturing</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Agreed Monthly Retainer (₦ NGN)</label>
                <input
                  type="number"
                  required
                  value={newMonthlyFee}
                  onChange={(e) => setNewMonthlyFee(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#245C44]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingClient}
                  className="px-5 py-2 rounded-xl bg-[#245C44] hover:bg-[#1E4E39] text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {creatingClient ? "Creating..." : "Establish Client Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
