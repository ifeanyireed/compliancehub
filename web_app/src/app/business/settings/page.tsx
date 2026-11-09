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

  useEffect(() => {
    async function loadTenantProfile() {
      try {
        const resp = await api.tenants.getCurrent();
        if (resp && resp.tenant) {
          setCompanyName(resp.tenant.workspace_name || resp.tenant.organisation_name || "");
          setRcNumber(resp.tenant.rc_number || "");
          setTin(resp.tenant.tin || "");
          setAddress(resp.tenant.address || "");
        }
      } catch (err) {
        console.error("Failed to load tenant settings:", err);
      }
    }
    loadTenantProfile();
  }, [activeTenantId]);

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
              <p className="text-xs text-slate-500">Internal employees with access to PayWave Technologies Ltd.</p>
            </div>
            <button 
              onClick={() => alert("Invite link generated: https://compliancehub.ng/join/tenant-paywave")}
              className="bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
            >
              + Invite Team Member
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <img src="/character3.jpg" alt="Adaeze" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold text-slate-900">Adaeze Nwosu (You)</h4>
                  <p className="text-[11px] text-slate-500">adaeze@paywave.ng</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-100 text-[#0089C1]">
                Owner & Business Admin
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                  CO
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Chukwudi Obi</h4>
                  <p className="text-[11px] text-slate-500">chukwudi@paywave.ng</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                Staff Member
              </span>
            </div>
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
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Invoice #INV-2026-0042</span>
                <span className="text-[11px] text-slate-500">Paid ₦45,000 via Paystack Mastercard • 28 Jan 2026</span>
              </div>
              <button 
                onClick={() => alert("Downloading receipt PDF...")}
                className="text-[#0089C1] font-bold hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Receipt</span>
              </button>
            </div>
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
                <span className="font-bold text-slate-900 block">MacBook Pro — Safari (Lagos, Nigeria)</span>
                <span className="text-[10px] text-slate-500 font-mono">Current Session • IP: 102.89.44.12</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold">This Device</span>
            </div>

            <button
              onClick={() => alert("Terminated 0 other sessions. Only this device is active.")}
              className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors pt-2"
            >
              Terminate All Other Active Sessions
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
