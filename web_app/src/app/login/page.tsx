"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Briefcase, 
  Users2, 
  ArrowRight, 
  Lock, 
  Mail, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useAuth, DEMO_USERS } from "@/components/ahnara/AuthContext";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { switchRole, login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"BUSINESS" | "EXPERT" | "AGENCY">("BUSINESS");
  const [email, setEmail] = useState("adaeze@paywave.ng");
  const [password, setPassword] = useState("••••••••••••");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitting(true);
    setForgotStatus(null);
    try {
      const res = await api.auth.forgotPassword({ email: forgotEmail || email });
      setForgotStatus(res?.message || "Password reset instructions dispatched.");
    } catch (err: any) {
      setForgotStatus("If this email is registered, password reset instructions have been dispatched.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleRoleSelect = (role: "BUSINESS" | "EXPERT" | "AGENCY") => {
    setSelectedRole(role);
    setErrorMsg(null);
    if (role === "BUSINESS") {
      setEmail("adaeze@paywave.ng");
    } else if (role === "EXPERT") {
      setEmail("tunde@bakarecompliance.com");
    } else {
      setEmail("chiamaka@apexcompliance.ng");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const actualPassword = password === "••••••••••••" ? "password123" : password;

    try {
      const resp = await api.auth.login({ email, password: actualPassword });
      if (resp && resp.token && resp.user) {
        login(resp.token, {
          id: resp.user.id,
          name: resp.user.full_name,
          email: resp.user.email,
          role: selectedRole,
          title: resp.user.title || DEMO_USERS[selectedRole].title,
          company: resp.active_tenant?.workspace_name || DEMO_USERS[selectedRole].company,
          avatar: resp.user.avatar_url || DEMO_USERS[selectedRole].avatar,
          tenant_id: resp.active_tenant?.id || DEMO_USERS[selectedRole].tenant_id,
        });

        if (selectedRole === "BUSINESS") {
          router.push("/business/dashboard");
        } else {
          router.push("/practice/dashboard");
        }
        return;
      }
    } catch (err: any) {
      console.warn("Backend login failed or offline, using fallback:", err);
    }

    // Fallback for seamless demo testing
    switchRole(selectedRole);
    setLoading(false);
    if (selectedRole === "BUSINESS") {
      router.push("/business/dashboard");
    } else {
      router.push("/practice/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col items-center justify-center p-4 select-none">
      
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-1.5 shadow-xs flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900 text-display">
            ComplianceHub<span className="text-[#0089C1]">.ng</span>
          </span>
        </Link>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
          Everything compliance. One workspace.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-[36px] max-w-md w-full p-8 border border-slate-200/80 shadow-lg space-y-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 text-display">Sign In to Your Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose a quick demo persona or enter your enterprise credentials.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* 1-Click Interactive Persona Switcher */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Select Demo Persona:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleRoleSelect("BUSINESS")}
              className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                selectedRole === "BUSINESS"
                  ? "bg-[#0089C1] text-white border-[#0089C1] shadow-xs font-bold"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="text-[11px] leading-tight font-bold">Business Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect("EXPERT")}
              className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                selectedRole === "EXPERT"
                  ? "bg-[#245C44] text-white border-[#245C44] shadow-xs font-bold"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span className="text-[11px] leading-tight font-bold">Compliance Officer</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect("AGENCY")}
              className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                selectedRole === "AGENCY"
                  ? "bg-purple-700 text-white border-purple-700 shadow-xs font-bold"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Users2 className="w-4 h-4" />
              <span className="text-[11px] leading-tight font-bold">Agency Partner</span>
            </button>
          </div>
        </div>

        {/* Active Profile Info Banner */}
        <div className="p-3.5 rounded-2xl bg-[#E8EFF4] border border-slate-200/80 flex items-center gap-3">
          <img
            src={DEMO_USERS[selectedRole].avatar}
            alt={DEMO_USERS[selectedRole].name}
            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">{DEMO_USERS[selectedRole].name}</p>
            <p className="text-[10px] text-slate-500 truncate">{DEMO_USERS[selectedRole].company}</p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white text-slate-800 shadow-xs">
            {selectedRole}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                  setForgotStatus(null);
                }}
                className="text-[10px] font-bold text-[#0089C1] hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1E293B] hover:bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Session...</span>
              </span>
            ) : (
              <>
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-100 text-xs text-slate-500">
          Don&apos;t have an account yet?{" "}
          <Link href="/onboarding" className="font-bold text-[#0089C1] hover:underline">
            Start Free Assessment
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Reset Password</h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Enter your registered enterprise email address to receive password recovery instructions.
            </p>
            {forgotStatus ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  {forgotStatus}
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full bg-[#1E293B] text-white font-bold py-2.5 rounded-xl text-xs"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="name@company.ng"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
                />
                <button
                  type="submit"
                  disabled={forgotSubmitting}
                  className="w-full bg-[#1E293B] hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {forgotSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
