"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Lock, 
  Mail, 
  Loader2
} from "lucide-react";
import { useAuth, DEMO_USERS, SUPER_ADMIN_USER } from "@/components/ahnara/AuthContext";
import { createSuperAdminJWT } from "@/lib/jwt";
import { api } from "@/lib/api";
import { defaultEase } from "@/components/motion/MotionTransitions";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect");
  const { switchRole, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const resolveRoleFromAccount = (
    accountEmail: string,
    respUser?: { system_role?: string; role?: string }
  ): "BUSINESS" | "EXPERT" | "AGENCY" | "STAFF" | "ADMIN" => {
    const normalizedEmail = accountEmail.trim().toLowerCase();
    const sysRole = (respUser?.system_role || "").toUpperCase();
    const explicitRole = (respUser?.role || "").toUpperCase();

    if (
      sysRole === "ADMIN" ||
      explicitRole === "ADMIN" ||
      normalizedEmail === "superadmin@compliancehub.ng" ||
      normalizedEmail === "admin@compliancehub.ng"
    ) {
      return "ADMIN";
    }
    if (
      sysRole === "STAFF" ||
      explicitRole === "STAFF" ||
      normalizedEmail === "bsanwo@compliancehub.ng"
    ) {
      return "STAFF";
    }
    if (explicitRole === "EXPERT" || normalizedEmail === "tunde@bakarecompliance.com") {
      return "EXPERT";
    }
    if (explicitRole === "AGENCY" || normalizedEmail === "chiamaka@apexcompliance.ng") {
      return "AGENCY";
    }
    return "BUSINESS";
  };

  const navigateToDestination = (role: string) => {
    if (redirectUrl) {
      router.push(redirectUrl);
      return;
    }
    if (role === "BUSINESS") {
      router.push("/business/dashboard/");
    } else if (role === "ADMIN") {
      router.push("/admin/dashboard/");
    } else if (role === "STAFF") {
      router.push("/staff/dashboard/");
    } else {
      router.push("/practice/dashboard/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const resp = await api.auth.login({ email: normalizedEmail, password });
      if (resp && resp.token && resp.user) {
        const effectiveRole = resolveRoleFromAccount(resp.user.email || normalizedEmail, resp.user);
        const fallbackProfile =
          normalizedEmail === SUPER_ADMIN_USER.email
            ? SUPER_ADMIN_USER
            : DEMO_USERS[effectiveRole];

        login(resp.token, {
          id: resp.user.id,
          name: resp.user.full_name,
          email: resp.user.email,
          role: effectiveRole,
          title: resp.user.title || fallbackProfile.title,
          company: resp.active_tenant?.workspace_name || fallbackProfile.company,
          avatar: resp.user.avatar_url || fallbackProfile.avatar,
          plan_tier: resp.active_tenant?.plan_tier || fallbackProfile.plan_tier,
          tenant_id: resp.active_tenant?.id || fallbackProfile.tenant_id,
        });

        navigateToDestination(effectiveRole);
        return;
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 400) {
        setErrorMsg(err.message || "Invalid email or password");
        setLoading(false);
        return;
      }
      console.warn("Backend login failed or offline, using fallback:", err);
    }

    // Offline fallback only when API is unreachable and credentials match a seeded account
    if (password === "password123") {
      if (normalizedEmail === SUPER_ADMIN_USER.email) {
        const jwtToken = await createSuperAdminJWT();
        login(jwtToken, SUPER_ADMIN_USER);
        setLoading(false);
        navigateToDestination("ADMIN");
        return;
      }

      const knownDemoEmails: Record<string, "BUSINESS" | "EXPERT" | "AGENCY" | "STAFF" | "ADMIN"> = {
        "adaeze@paywave.ng": "BUSINESS",
        "tunde@bakarecompliance.com": "EXPERT",
        "chiamaka@apexcompliance.ng": "AGENCY",
        "bsanwo@compliancehub.ng": "STAFF",
        "admin@compliancehub.ng": "ADMIN",
      };

      if (knownDemoEmails[normalizedEmail]) {
        const fallbackRole = knownDemoEmails[normalizedEmail];
        await switchRole(fallbackRole);
        setLoading(false);
        navigateToDestination(fallbackRole);
        return;
      }
    }

    setErrorMsg("Invalid email or password");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col items-center justify-center p-4 select-none">
      
      {/* Brand Header */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: defaultEase }}
        className="text-center mb-8"
      >
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
      </motion.div>

      {/* Main Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: defaultEase }}
        className="bg-white rounded-[36px] max-w-md w-full p-8 border border-slate-200/80 shadow-lg space-y-6"
      >
        <div>
          <h1 className="text-xl font-black text-slate-900 text-display">Sign In to Your Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter your enterprise credentials to access your workspace.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@company.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
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
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
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
      </motion.div>

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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#E8EFF4] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#0089C1]" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
