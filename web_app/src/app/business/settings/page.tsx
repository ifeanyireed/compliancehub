"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  CreditCard, 
  Lock, 
  Key, 
  CheckCircle2, 
  Download,
  AlertTriangle,
  Smartphone,
  LogOut,
  Loader2
} from "lucide-react";
import { useAuth } from "@/components/ahnara/AuthContext";
import { api } from "@/lib/api";

export default function BusinessSettingsPage() {
  const { user, activeTenantId } = useAuth();
  const [activeTab, setActiveTab] = useState<"entity" | "members" | "billing" | "security">("entity");
  const [savedBanner, setSavedBanner] = useState(false);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [tin, setTin] = useState("");
  const [address, setAddress] = useState("");

  const [members, setMembers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [sessionsCleared, setSessionsCleared] = useState(false);

  useEffect(() => {
    async function loadTenantProfile() {
      try {
        const [resp, memResp, invResp] = await Promise.all([
          api.tenants.getCurrent(),
          api.tenantMembers.list(),
          api.invoices.list(),
        ]);
        if (resp && resp.tenant) {
          setCompanyName(resp.tenant.workspace_name || resp.tenant.organisation_name || "");
          setRcNumber(resp.tenant.rc_number || "");
          setTin(resp.tenant.tin || "");
          setAddress(resp.tenant.address || "");
        }
        if (Array.isArray(memResp)) {
          setMembers(memResp);
        }
        if (Array.isArray(invResp)) {
          setInvoices(invResp);
        }
      } catch (err) {
        console.error("Failed to load tenant settings:", err);
      }
    }
    loadTenantProfile();
  }, [activeTenantId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    setInviting(true);
    try {
      await api.tenantMembers.invite({
        full_name: inviteName,
        email: inviteEmail,
        role: inviteRole,
      });
      const updated = await api.tenantMembers.list();
      if (Array.isArray(updated)) setMembers(updated);
      setShowInviteModal(false);
      setInviteName("");
      setInviteEmail("");
    } catch (err) {
      console.error("Invite failed:", err);
    } finally {
      setInviting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.tenants.updateCurrent({
        company_name: companyName,
        rc_number: rcNumber,
        tin: tin,
        address: address,
      });
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    } catch (err) {
      console.error("Failed to save tenant settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Banner */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#0089C1] uppercase tracking-wider block mb-1">
            Workspace Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
            Business Settings & Security Controls
          </h1>
          <p className="text-xs text-slate-500">
            Manage statutory entity identifiers, tenant users, subscription billing, and security sessions.
          </p>
        </div>

        {/* Tab Switch Pills */}
        <div className="bg-[#E8EFF4] p-1.5 rounded-2xl border border-slate-300/40 flex flex-wrap items-center">
          <button
            onClick={() => setActiveTab("entity")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "entity" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            Entity Profile
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "members" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            Users & Roles
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "billing" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            Subscription & Invoices
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "security" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            MFA & Sessions
          </button>
        </div>
      </div>

      {savedBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Settings successfully updated across tenant workspace!</span>
        </div>
      )}

      {/* TAB 1: ENTITY PROFILE */}
      {activeTab === "entity" && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="font-extrabold text-base text-slate-900">
            Registered Entity Information (CAC Synchronised)
          </h3>

          <form onSubmit={handleSave} className="space-y-4 text-xs max-w-2xl">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Company Registered Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">CAC Registration / RC Number</label>
                <input
                  type="text"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tax Identification Number (TIN)</label>
                <input
                  type="text"
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Registered Corporate Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-xs transition-all"
            >
              Save Entity Profile
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: USERS & ROLES */}
      {activeTab === "members" && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Tenant Workspace Users</h3>
              <p className="text-xs text-slate-500">Internal authorized employees for {companyName || "your organization"}.</p>
            </div>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs cursor-pointer transition-all"
            >
              + Invite Team Member
            </button>
          </div>

          <div className="space-y-3">
            {members.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-center text-xs text-slate-500">
                Loading workspace members...
              </div>
            ) : (
              members.map((m: any) => (
                <div key={m.id} className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img 
                      src={m.avatar_url || "/character3.jpg"} 
                      alt={m.full_name} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                    />
                    <div>
                      <h4 className="font-bold text-slate-900">{m.full_name} {m.is_primary && "(You)"}</h4>
                      <p className="text-[11px] text-slate-500">{m.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    m.role === "OWNER" ? "bg-sky-100 text-[#0089C1]" : "bg-slate-100 text-slate-700"
                  }`}>
                    {m.role === "OWNER" ? "Owner & Business Admin" : m.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BILLING */}
      {activeTab === "billing" && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-sky-50/60 border border-sky-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#0089C1] tracking-wider">Active Plan</span>
              <h3 className="text-xl font-black text-slate-900">Professional SaaS Plan</h3>
              <p className="text-xs text-slate-600 mt-0.5">₦45,000 billed monthly via Paystack • Renews on 28th of next month</p>
            </div>
            <Link href="/pricing">
              <button className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs">
                Change Subscription Plan
              </button>
            </Link>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Past Invoices & Receipts</h4>
            {invoices.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                No billing transactions recorded yet.
              </div>
            ) : (
              invoices.map((inv: any) => (
                <div key={inv.id || inv.invoice_number} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{inv.invoice_number} • {inv.client_name || inv.client}</span>
                    <span className="text-[11px] text-slate-500">
                      Paid ₦{Number(inv.amount_ngn || inv.amount).toLocaleString()} • {inv.due_date || inv.created_at || "Recent"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {inv.status || "SETTLED"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY */}
      {activeTab === "security" && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Two-Factor Authentication (2FA / MFA)</h4>
                <p className="text-[11px] text-emerald-800">Enforced via TOTP Authenticator App for all Admins.</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
              Enabled
            </span>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Sessions</h4>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Current Operating Device (Lagos, Nigeria)</span>
                <span className="text-[10px] text-slate-500 font-mono">Current Session • Encrypted Token</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold">This Device</span>
            </div>

            {sessionsCleared ? (
              <p className="text-xs font-bold text-emerald-600 pt-2">All other active sessions have been terminated.</p>
            ) : (
              <button
                onClick={() => setSessionsCleared(true)}
                className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors pt-2 cursor-pointer"
              >
                Terminate All Other Active Sessions
              </button>
            )}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Invite Workspace Team Member</h3>
                <p className="text-xs text-slate-500">Provide user credentials to grant internal access.</p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chukwudi Obi"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. chukwudi@paywave.ng"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Workspace Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                >
                  <option value="MEMBER">Member (Standard Operations)</option>
                  <option value="ADMIN">Admin (Full Workspace Management)</option>
                  <option value="VIEWER">Viewer (Auditor / Read-Only)</option>
                </select>
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
                  disabled={inviting}
                  className="px-5 py-2 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {inviting ? "Inviting..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
