"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Building2, 
  Briefcase, 
  Users2, 
  ArrowRight, 
  Lock, 
  Mail, 
  User, 
  Sparkles,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { useAuth } from "@/components/ahnara/AuthContext";
import { api } from "@/lib/api";
import { defaultEase } from "@/components/motion/MotionTransitions";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") || "BUSINESS") as "BUSINESS" | "EXPERT" | "AGENCY";
  
  const { switchRole, login } = useAuth();
  const [role, setRole] = useState<"BUSINESS" | "EXPERT" | "AGENCY">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "BUSINESS") {
      switchRole(role);
      router.push("/onboarding");
      return;
    }

    setLoading(true);
    try {
      const companyName = role === "EXPERT" 
        ? `${name} Compliance Consultancy` 
        : `${name} & Associates Compliance Partners`;

      const resp = await api.auth.register({
        email,
        password,
        full_name: name,
        role,
        company_name: companyName,
        rc_number: "RC-REG-PENDING",
        industry: "Professional Compliance Advisory",
        state: "Lagos",
        employee_count: "1-10"
      });

      if (resp && resp.token && resp.user) {
        login(resp.token, {
          id: resp.user.id,
          name: resp.user.full_name,
          email: resp.user.email,
          role,
          title: role === "EXPERT" ? "Senior Compliance Specialist" : "Managing Partner",
          company: companyName,
          avatar: "/character1.jpg",
          tenant_id: resp.active_tenant?.id
        });
        router.push("/practice/dashboard");
        return;
      }
    } catch (err) {
      console.warn("Backend registration fallback:", err);
    }

    switchRole(role);
    setLoading(false);
    router.push("/practice/dashboard");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: defaultEase }}
      className="bg-white rounded-[36px] max-w-lg w-full p-8 border border-slate-200/80 shadow-xl space-y-6 select-none"
    >
      <div>
        <h1 className="text-xl font-black text-slate-900 text-display">Choose Account Type</h1>
        <p className="text-xs text-slate-500 mt-1">
          Select how you will participate in the ComplianceHub ecosystem.
        </p>
      </div>

      {/* 3 Account Types */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => setRole("BUSINESS")}
          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
            role === "BUSINESS"
              ? "bg-[#0089C1] text-white border-[#0089C1] shadow-xs"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[11px] font-bold leading-tight">Business (HubBusiness)</span>
        </button>

        <button
          type="button"
          onClick={() => setRole("EXPERT")}
          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
            role === "EXPERT"
              ? "bg-[#245C44] text-white border-[#245C44] shadow-xs"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[11px] font-bold leading-tight">Practitioner (HubAgents)</span>
        </button>

        <button
          type="button"
          onClick={() => setRole("AGENCY")}
          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
            role === "AGENCY"
              ? "bg-purple-700 text-white border-purple-700 shadow-xs"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Users2 className="w-5 h-5" />
          <span className="text-[11px] font-bold leading-tight">Agency (HubAgency)</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Full Legal Name</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="e.g. Adaeze Nwosu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Work Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="e.g. adaeze@company.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
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
              <span>Creating Environment...</span>
            </span>
          ) : (
            <>
              <span>Create Account & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-2 text-center border-t border-slate-100 text-xs text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-[#0089C1] hover:underline">
          Sign In
        </Link>
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: defaultEase }}
        className="text-center mb-6"
      >
        <Link href="/" className="inline-flex items-center gap-2.5 mb-2 group">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-1.5 shadow-xs flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900 text-display">
            ComplianceHub<span className="text-[#0089C1]">.ng</span>
          </span>
        </Link>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
          Create Your Compliance Environment
        </p>
      </motion.div>

      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading registration form...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
