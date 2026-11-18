"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  Loader2,
  Sparkles,
  Clock,
  ArrowUpRight,
  FolderArchive
} from "lucide-react";
import { useAuth } from "@/components/ahnara/AuthContext";
import { api } from "@/lib/api";
import UpgradeQuotaModal from "@/components/subscription/UpgradeQuotaModal";

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
  const [subscription, setSubscription] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [sessionsCleared, setSessionsCleared] = useState(false);

  // Quota Upgrade Modal State
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [quotaType, setQuotaType] = useState<"DOCUMENT" | "SEAT" | "TRIAL_EXPIRED" | "FEATURE">("SEAT");

  async function loadTenantProfile() {
    try {
      const [resp, memResp, invResp, subResp] = await Promise.all([
        api.tenants.getCurrent(),
        api.tenantMembers.list(),
        api.invoices.list(),
        api.subscriptions.getUsage(),
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
      if (subResp && subResp.success) {
        setSubscription(subResp);
      }
    } catch (err) {
      console.error("Failed to load tenant settings:", err);
    }
  }

  useEffect(() => {
    loadTenantProfile();
  }, [activeTenantId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    if (subscription?.seats?.isBlocked) {
      setShowInviteModal(false);
      setQuotaType("SEAT");
      setQuotaModalOpen(true);
      return;
    }

    setInviting(true);
    try {
      await api.tenantMembers.invite({
        full_name: inviteName,
        email: inviteEmail,
        role: inviteRole,
      });
      const [updated, subUpdated] = await Promise.all([
        api.tenantMembers.list(),
        api.subscriptions.getUsage(),
      ]);
      if (Array.isArray(updated)) setMembers(updated);
      if (subUpdated && subUpdated.success) setSubscription(subUpdated);
      setShowInviteModal(false);
      setInviteName("");
      setInviteEmail("");
    } catch (err: any) {
      console.error("Invite failed:", err);
      if (err?.code === "SEAT_QUOTA_EXCEEDED" || err?.status === 402) {
        setShowInviteModal(false);
        setQuotaType("SEAT");
        setQuotaModalOpen(true);
      }
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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "entity" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            Entity Profile
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "members" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            Users & Roles
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "billing" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            Subscription & Invoices
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "security" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
            }`}
          >
            MFA & Sessions
          </button>
        </div>
      </motion.div>

      {savedBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Settings successfully updated across tenant workspace!</span>
        </div>
      )}

      {/* TAB 1: ENTITY PROFILE */}
      {activeTab === "entity" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6"
        >
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
              className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
            >
              Save Entity Profile
            </button>
          </form>
        </motion.div>
      )}

      {/* TAB 2: USERS & ROLES */}
      {activeTab === "members" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6"
        >
          {/* Seat Quota Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0089C1]" />
                <span className="text-xs font-bold text-slate-900">
                  Team Member Seats Allocation
                </span>
                {subscription?.seats?.isBlocked && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    Quota Full (Hard-Blocked)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Using {subscription?.seats?.used ?? members.length} of {subscription?.seats?.limit === Infinity ? "Unlimited" : (subscription?.seats?.limit ?? 5)} seats allowed on {subscription?.limits?.name || "your"} plan.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-32 sm:w-44 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    subscription?.seats?.percentage >= 100
                      ? "bg-red-500"
                      : subscription?.seats?.percentage >= 80
                      ? "bg-amber-500"
                      : "bg-[#0089C1]"
                  }`}
                  style={{ width: `${Math.min(subscription?.seats?.percentage || (members.length * 20), 100)}%` }}
                />
              </div>
              {subscription?.seats?.isBlocked ? (
                <button
                  onClick={() => {
                    setQuotaType("SEAT");
                    setQuotaModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade Seats
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Tenant Workspace Users</h3>
              <p className="text-xs text-slate-500">Internal authorized employees for {companyName || "your organization"}.</p>
            </div>
            <button 
              onClick={() => {
                if (subscription?.seats?.isBlocked) {
                  setQuotaType("SEAT");
                  setQuotaModalOpen(true);
                  return;
                }
                setShowInviteModal(true);
              }}
              className={`font-bold px-4 py-2 rounded-xl text-xs shadow-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                subscription?.seats?.isBlocked
                  ? "bg-slate-200 text-slate-500 hover:bg-slate-300"
                  : "bg-[#1E293B] hover:bg-slate-800 text-white"
              }`}
            >
              {subscription?.seats?.isBlocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Seats Locked (Upgrade)</span>
                </>
              ) : (
                <span>+ Invite Team Member</span>
              )}
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
        </motion.div>
      )}

      {/* TAB 3: BILLING */}
      {activeTab === "billing" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6"
        >
          {/* Plan Overview Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-linear-to-br from-sky-50/80 via-white to-slate-50 border border-sky-200 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black text-[#0089C1] tracking-wider px-2.5 py-0.5 rounded-full bg-sky-100">
                  {subscription?.isTrial ? "Trial Mode" : "Active Subscription"}
                </span>
                {subscription?.isTrial && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    {subscription?.trialDaysLeft ?? 14} days left in trial
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-900 text-display">
                {subscription?.limits?.name || subscription?.plan_tier || "Professional Plan"}
              </h3>
              <p className="text-xs text-slate-600 max-w-md">
                {subscription?.isTrial
                  ? `Enjoying full Professional compliance privileges until ${subscription?.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "end of trial"}. Lock in your workspace with Paystack.`
                  : "Secured with Paystack recurring subscription. Billed monthly with automated tax receipts."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => {
                  setQuotaType("FEATURE");
                  setQuotaModalOpen(true);
                }}
                className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{subscription?.isTrial ? "Subscribe via Paystack" : "Upgrade / Change Plan"}</span>
              </button>
              <Link href="/pricing" className="text-center">
                <button className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">
                  View All Tiers
                </button>
              </Link>
            </div>
          </div>

          {/* Quotas & Capacity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document Vault Quota */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-[#0089C1]" />
                  <span className="font-bold text-slate-900">HubDocs Vault Storage</span>
                </div>
                <span className="font-mono font-bold text-slate-700">
                  {subscription?.documents?.used ?? 0} / {subscription?.documents?.limit === Infinity ? "Unlimited" : (subscription?.documents?.limit ?? 50)} docs
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    (subscription?.documents?.percentage ?? 0) >= 100 
                      ? "bg-red-500" 
                      : (subscription?.documents?.percentage ?? 0) >= 80 
                      ? "bg-amber-500" 
                      : "bg-[#0089C1]"
                  }`}
                  style={{ width: `${Math.min(subscription?.documents?.percentage || 0, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{subscription?.documents?.percentage || 0}% quota consumed</span>
                {subscription?.documents?.isBlocked ? (
                  <span className="text-red-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Hard-Blocked
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold">Available</span>
                )}
              </div>
            </div>

            {/* Team Seats Quota */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0089C1]" />
                  <span className="font-bold text-slate-900">Team Member Seats</span>
                </div>
                <span className="font-mono font-bold text-slate-700">
                  {subscription?.seats?.used ?? members.length} / {subscription?.seats?.limit === Infinity ? "Unlimited" : (subscription?.seats?.limit ?? 5)} seats
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    (subscription?.seats?.percentage ?? 0) >= 100 
                      ? "bg-red-500" 
                      : (subscription?.seats?.percentage ?? 0) >= 80 
                      ? "bg-amber-500" 
                      : "bg-[#0089C1]"
                  }`}
                  style={{ width: `${Math.min(subscription?.seats?.percentage || (members.length * 20), 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{subscription?.seats?.percentage || (members.length * 20)}% seats allocated</span>
                {subscription?.seats?.isBlocked ? (
                  <span className="text-red-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Hard-Blocked
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold">Available</span>
                )}
              </div>
            </div>
          </div>

          {/* Feature Matrix for Current Plan */}
          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Regulatory Coverage & Module Capabilities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {[
                { name: "CAC Annual Returns Sync", enabled: true },
                { name: "FIRS / NRS Tax Deadlines", enabled: true },
                { name: "HubDocs Cloudinary Vault", enabled: true },
                { name: "SCUML AML/CFT Reporting", enabled: subscription?.plan_tier !== "FREE" && subscription?.plan_tier !== "STARTER" },
                { name: "NDPC Data Protection Audit", enabled: subscription?.plan_tier !== "FREE" && subscription?.plan_tier !== "STARTER" },
                { name: "Direct Practice Auditor Signoff", enabled: subscription?.plan_tier === "PROFESSIONAL" || subscription?.plan_tier === "TRIAL" || subscription?.plan_tier === "ENTERPRISE" },
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                  {feat.enabled ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className={`font-bold ${feat.enabled ? "text-slate-800" : "text-slate-400 line-through"}`}>
                    {feat.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Past Invoices & Receipts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Past Invoices & Receipts</h4>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Paystack Settled
              </span>
            </div>
            {invoices.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 space-y-1">
                <CreditCard className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="font-bold text-slate-700">No external invoices recorded yet.</p>
                <p className="text-[11px]">Your 14-day free trial on the Professional tier is currently active at zero cost.</p>
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
        </motion.div>
      )}

      {/* TAB 4: SECURITY */}
      {activeTab === "security" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6"
        >
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
        </motion.div>
      )}

      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-5 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Invite Workspace Team Member</h3>
                  <p className="text-xs text-slate-500">Provide user credentials to grant internal access.</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold hover:bg-slate-200 cursor-pointer"
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
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-5 py-2 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {inviting ? "Inviting..." : "Send Invitation"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Quota Modal */}
      <UpgradeQuotaModal
        isOpen={quotaModalOpen}
        onClose={() => setQuotaModalOpen(false)}
        quotaType={quotaType}
        currentUsage={quotaType === "DOCUMENT" ? subscription?.documents?.used : subscription?.seats?.used}
        limit={quotaType === "DOCUMENT" ? subscription?.documents?.limit : subscription?.seats?.limit}
        currentPlan={subscription?.limits?.name || subscription?.plan_tier}
        onUpgradeSuccess={loadTenantProfile}
      />

    </div>
  );
}
