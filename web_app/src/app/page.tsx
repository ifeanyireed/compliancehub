"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  FolderArchive, 
  Users, 
  Building2, 
  Briefcase,
  ShieldAlert, 
  Scale, 
  Lock, 
  GraduationCap, 
  Search, 
  Bell, 
  FileCheck2, 
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { CompliancePublicNav } from "@/components/layout/CompliancePublicNav";
import { CompliancePublicFooter } from "@/components/layout/CompliancePublicFooter";
import { ComplianceAssistantDrawer } from "@/components/layout/ComplianceAssistantDrawer";
import { COMPLIANCE_MODULES } from "@/lib/compliance-data";
import { api } from "@/lib/api";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"All" | "Core" | "Specialist" | "Records" | "Automation">("All");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [experts, setExperts] = useState<any[]>([]);

  React.useEffect(() => {
    api.practice.getExperts().then((res: any) => {
      if (Array.isArray(res)) {
        setExperts(res.slice(0, 4));
      }
    }).catch(() => {});
  }, []);

  const filteredModules = activeTab === "All" 
    ? COMPLIANCE_MODULES 
    : COMPLIANCE_MODULES.filter(m => m.category === activeTab);

  const faqs = [
    {
      q: "Does completing tasks on ComplianceHub guarantee statutory compliance?",
      a: "ComplianceHub provides structured workflow automation, evidence collection, and deadline tracking. While the platform drastically lowers risk of non-compliance, statutory legal determinations and statutory audit filings must be executed or reviewed by accredited professionals (licensed DPCOs, accredited tax consultants, or certified compliance officers) whom you can engage directly on the platform."
    },
    {
      q: "How does ComplianceHub handle the new Nigeria Tax Act 2025/2026?",
      a: "Our regulatory intelligence team maintains versioned obligation rules reflecting the newly commenced 2026 tax framework. The platform automatically maps your corporate structure, calculates withholding tax and CIT deadlines on TaxPro-MAX, and provides pre-formatted schedules for your tax auditor."
    },
    {
      q: "Can my external compliance officer or consulting firm access my workspace?",
      a: "Yes. Through HubAgents, you can grant delegated access to external compliance consultants or firms. You specify exact module permissions (e.g. access to HubAML and HubPrivacy only), and you can revoke access instantly at any second with a single click."
    },
    {
      q: "What is the difference between HubBusiness and HubAgents?",
      a: "HubBusiness is for companies managing their own single-company compliance obligations and internal evidence. HubAgents is a multi-tenant practice management platform for compliance consultants and agencies who manage 5, 20, or 100 client businesses simultaneously."
    }
  ];

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col overflow-x-hidden">
      {/* Public Navbar */}
      <CompliancePublicNav />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 mb-12 mt-3 space-y-12">
        
        {/* HERO CARD - Verbatim AntifakeNG rounded-[48px] with layered glass & subtle borders */}
        <section className="w-full bg-[#E9F2F5] rounded-[48px] pt-12 pb-16 px-6 md:px-12 flex flex-col items-center text-center relative overflow-hidden border border-slate-200/50 shadow-sm">
          
          {/* Subtle Ambient Background Glows */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0089C1]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#245C44]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Pill Announcement */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-slate-300/40 shadow-xs mb-6 relative z-10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800">
              Nigeria&apos;s Integrated Compliance Management & Workforce Platform
            </span>
          </div>

          {/* Master Headline from Blueprint */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight text-display mb-4 leading-[1.08] max-w-4xl text-center relative z-10">
            Real compliance shouldn&apos;t mean endless regulatory anxiety.
          </h1>

          {/* Subheading */}
          <p className="text-slate-600 font-medium text-base md:text-xl mb-8 max-w-3xl text-center leading-relaxed relative z-10">
            <strong>Everything compliance. One workspace.</strong> Connect your company&apos;s statutory obligations, verified compliance professionals, and audit-ready evidence across CAC, FIRS, NDPC, and SCUML.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 mb-10 relative z-10">
            <Link href="/onboarding">
              <button className="bg-[#0089C1] hover:bg-sky-600 text-white transition-all font-bold px-7 py-3.5 rounded-full text-base shadow-md hover:shadow-lg flex items-center gap-2.5">
                <Sparkles className="w-4 h-4" />
                <span>Start Free Compliance Assessment</span>
              </button>
            </Link>

            <Link href="/experts">
              <button className="bg-[#1E293B] hover:bg-slate-800 text-white transition-all font-bold px-7 py-3.5 rounded-full text-base shadow-md flex items-center gap-2">
                <span>Find a Compliance Expert</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          {/* Interactive Feature Stats Strip */}
          <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/80 text-left shadow-xs">
              <div className="text-2xl font-black text-slate-900 font-mono">12 Modules</div>
              <div className="text-xs font-bold text-slate-500 mt-0.5">End-to-End Coverage</div>
            </div>
            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/80 text-left shadow-xs">
              <div className="text-2xl font-black text-emerald-700 font-mono">2026 Ready</div>
              <div className="text-xs font-bold text-slate-500 mt-0.5">Tax Modernisation Act</div>
            </div>
            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/80 text-left shadow-xs">
              <div className="text-2xl font-black text-[#0089C1] font-mono">100% Isolated</div>
              <div className="text-xs font-bold text-slate-500 mt-0.5">Tenant Data Ownership</div>
            </div>
            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/80 text-left shadow-xs">
              <div className="text-2xl font-black text-purple-700 font-mono">HubAgents</div>
              <div className="text-xs font-bold text-slate-500 mt-0.5">Practice Management</div>
            </div>
          </div>
        </section>

        {/* REGULATORY BODIES TICKER STRIP */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-xs">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">
            Active Statutory Alignment with Nigeria&apos;s Key Regulatory Authorities
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
            <div className="p-3 rounded-2xl bg-[#E8EFF4]/50 border border-slate-200/60">
              <div className="font-extrabold text-sm text-slate-900">CAC</div>
              <div className="text-[10px] text-slate-500 font-medium">CAMA 2020 Returns</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#E8EFF4]/50 border border-slate-200/60">
              <div className="font-extrabold text-sm text-slate-900">NRS / FIRS</div>
              <div className="text-[10px] text-slate-500 font-medium">2026 Tax Act & CIT</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#E8EFF4]/50 border border-slate-200/60">
              <div className="font-extrabold text-sm text-slate-900">NDPC</div>
              <div className="text-[10px] text-slate-500 font-medium">NDPA 2023 Statutory Audits</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#E8EFF4]/50 border border-slate-200/60">
              <div className="font-extrabold text-sm text-slate-900">SCUML / EFCC</div>
              <div className="text-[10px] text-slate-500 font-medium">AML/CFT for DNFBPs</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#E8EFF4]/50 border border-slate-200/60">
              <div className="font-extrabold text-sm text-slate-900">PENCOM</div>
              <div className="text-[10px] text-slate-500 font-medium">PRA 2014 Remittances</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#E8EFF4]/50 border border-slate-200/60">
              <div className="font-extrabold text-sm text-slate-900">ITF & NSITF</div>
              <div className="text-[10px] text-slate-500 font-medium">Workforce Statutory Returns</div>
            </div>
          </div>
        </section>

        {/* THE FOUR INTERCONNECTED PRODUCTS (Blueprint Part 1.2) */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-display">
              Four Interconnected Product Environments
            </h2>
            <p className="text-sm text-slate-600">
              One unified platform architecture powering businesses, independent compliance officers, consulting agencies, and enterprise conglomerates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* HubBusiness Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-[#0089C1] transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0089C1] flex items-center justify-center font-bold mb-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 mb-1">HubBusiness</h3>
                <span className="text-[11px] font-bold uppercase text-[#0089C1] tracking-wider block mb-3">For Nigerian Businesses</span>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Manage company compliance, monitor statutory deadlines, upload tamper-evident evidence, and calculate real-time readiness scores.
                </p>
              </div>
              <Link href="/business/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0089C1] group-hover:underline">
                <span>Enter Business Workspace</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* HubExperts Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-emerald-600 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 mb-1">HubExperts</h3>
                <span className="text-[11px] font-bold uppercase text-emerald-700 tracking-wider block mb-3">Professional Marketplace</span>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Discover verified compliance specialists, licensed DPCOs, and tax practitioners for fractional retainers or project-based reviews.
                </p>
              </div>
              <Link href="/experts" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 group-hover:underline">
                <span>Explore Verified Experts</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* HubAgents Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-[#245C44] transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#245C44] flex items-center justify-center font-bold mb-4">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 mb-1">HubAgents</h3>
                <span className="text-[11px] font-bold uppercase text-[#245C44] tracking-wider block mb-3">Practice Management</span>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Empower compliance officers and agencies to manage 10, 50, or 100 client businesses from one cockpit with delegated access and automated retainer billing.
                </p>
              </div>
              <Link href="/practice/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#245C44] group-hover:underline">
                <span>Open Practice Suite</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* HubEnterprise Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-purple-600 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold mb-4">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 mb-1">HubEnterprise</h3>
                <span className="text-[11px] font-bold uppercase text-purple-700 tracking-wider block mb-3">For Conglomerates</span>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Multi-subsidiary governance, multi-branch tracking, enterprise approval hierarchies, and group-wide regulatory risk consolidation.
                </p>
              </div>
              <Link href="/solutions" className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 group-hover:underline">
                <span>Enterprise Architecture</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* THE 12 COMPLIANCE MODULES SHOWCASE (Blueprint Part 2.1) */}
        <section className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-200/80 shadow-xs space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <span className="text-xs font-black text-[#0089C1] uppercase tracking-wider block mb-1">
                Modular Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-display">
                The Twelve Compliance Modules
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mt-1">
                Activated based on your industry, size, and regulatory classification. Adopt individually or deploy as an integrated compliance operating system.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#DDEEF3] p-1.5 rounded-2xl border border-slate-300/30">
              {(["All", "Core", "Records", "Specialist", "Automation"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab
                      ? "bg-[#1E293B] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/20"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((m) => (
              <div 
                key={m.id}
                className="rounded-2xl p-6 bg-[#F8FAFC] border border-slate-200/70 hover:border-[#0089C1]/50 hover:bg-white transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700">
                      {m.code}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0089C1]">
                      {m.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 mb-1">{m.name}</h3>
                  <p className="text-xs font-semibold text-slate-700 mb-2">{m.tagline}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{m.description}</p>

                  <div className="space-y-1.5 mb-4">
                    {m.features.slice(0, 2).map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono text-[10px]">{m.statutoryRefs[0]}</span>
                  <Link href={`/modules#${m.id}`} className="font-bold text-[#0089C1] hover:underline flex items-center gap-1">
                    <span>Specs</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* VERIFIED EXPERTS MARKETPLACE TEASER */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-black text-emerald-700 uppercase tracking-wider block mb-1">
                HubExperts Network
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-display">
                Engage Verified Nigerian Compliance Specialists
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mt-1">
                From fractional AML officers to licensed Data Protection Compliance Organisations (DPCOs) and tax practitioners.
              </p>
            </div>

            <Link href="/experts">
              <button className="bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-bold px-5 py-2.5 rounded-full text-xs shadow-xs flex items-center gap-2">
                <span>View All 150+ Verified Experts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {experts.map((exp) => (
              <div 
                key={exp.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <img 
                      src={exp.avatar_url || exp.avatar || "/character1.jpg"} 
                      alt={exp.full_name || exp.name} 
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">{exp.full_name || exp.name}</h4>
                      <p className="text-[11px] text-slate-500">{exp.firm_name || exp.location || "Lagos, Nigeria"}</p>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 line-clamp-2 mb-3">
                    {exp.qualification || exp.title}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {(exp.specialisations || []).slice(0, 2).map((s: string, i: number) => (
                      <span key={i} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">From</span>
                    <span className="text-xs font-black text-slate-900 font-mono">
                      ₦{((exp.monthly_retainer_ngn || exp.monthlyRetainerNGN || exp.retainerRate || 250000)).toLocaleString()}<span className="text-[10px] font-normal text-slate-500">/mo</span>
                    </span>
                  </div>
                  <Link href={`/experts/${exp.id}`}>
                    <button className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs">
                      Consult
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING PLANS PREVIEW */}
        <section className="bg-[#E9F2F5] rounded-[40px] p-8 md:p-12 border border-slate-200/60 shadow-xs space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-black text-[#0089C1] uppercase tracking-wider">
              Transparent Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-display">
              Plans Scaled for Growing Nigerian Companies
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Start free with basic statutory tracking or upgrade for multi-module automation and dedicated compliance officer access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Free Tier */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Starter</span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Free</h3>
                <div className="text-2xl font-black font-mono text-slate-900 mb-4">₦0<span className="text-xs text-slate-400 font-normal">/mo</span></div>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  For micro-businesses looking to catalog CAC details and basic reminders.
                </p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 1 Business Workspace</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Basic HubCalendar</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Up to 10 Documents</li>
                </ul>
              </div>
              <Link href="/onboarding" className="mt-6">
                <button className="w-full py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-800 hover:bg-slate-50 transition-all">
                  Get Started Free
                </button>
              </Link>
            </div>

            {/* Starter Tier */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Small Business</span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Starter</h3>
                <div className="text-2xl font-black font-mono text-slate-900 mb-4">₦7,500<span className="text-xs text-slate-400 font-normal">/mo</span></div>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  For growing registered SMEs requiring automated statutory deadline SMS/WhatsApp alerts.
                </p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> HubCalendar & WhatsApp Alerts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> HubDocs Document Vault (50 docs)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> CAC & Tax Expiry Tracking</li>
                </ul>
              </div>
              <Link href="/onboarding" className="mt-6">
                <button className="w-full py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-800 hover:bg-slate-50 transition-all">
                  Choose Starter
                </button>
              </Link>
            </div>

            {/* Business Tier (Popular) */}
            <div className="bg-white rounded-3xl p-6 border-2 border-[#0089C1] relative flex flex-col justify-between shadow-md">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0089C1] text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                Most Popular
              </span>
              <div>
                <span className="text-xs font-bold uppercase text-[#0089C1] block mb-1">Growing SMEs</span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Business</h3>
                <div className="text-2xl font-black font-mono text-slate-900 mb-4">₦20,000<span className="text-xs text-slate-400 font-normal">/mo</span></div>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Full multi-module platform with external compliance officer access and vendor tracking.
                </p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#0089C1]" /> Everything in Starter</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#0089C1]" /> Delegated Expert Access (HubAgents)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#0089C1]" /> HubPeople & HubVendors (Unlimited)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#0089C1]" /> One-Click Compliance Reports</li>
                </ul>
              </div>
              <Link href="/onboarding" className="mt-6">
                <button className="w-full py-2.5 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs shadow-xs transition-all">
                  Select Business
                </button>
              </Link>
            </div>

            {/* Professional Tier */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Regulated Entities</span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Professional</h3>
                <div className="text-2xl font-black font-mono text-slate-900 mb-4">₦45,000<span className="text-xs text-slate-400 font-normal">/mo</span></div>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  For FinTechs, DNFBPs, and healthcare providers needing advanced AML and NDPA workflows.
                </p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> HubAML & SCUML Reporting</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> HubPrivacy NDPA RoPA & DSAR</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Internal Audit Gap Assessments</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Dual-Approval Workflows</li>
                </ul>
              </div>
              <Link href="/onboarding" className="mt-6">
                <button className="w-full py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-800 hover:bg-slate-50 transition-all">
                  Contact Sales / Upgrade
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-display">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Straight answers on data ownership, regulatory scope, and practice management.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div 
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between font-bold text-sm text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>{f.q}</span>
                  <span className={`text-slate-400 font-bold text-lg transition-transform ${activeFaq === i ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM FINAL CALL TO ACTION CARD */}
        <section className="w-full bg-[#1E293B] rounded-[48px] p-8 md:p-14 text-white text-center relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#0089C1]/20 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-3xl sm:text-4xl font-black text-display mb-4 max-w-2xl mx-auto leading-tight">
            Stop risking regulatory penalties. Take control of your compliance today.
          </h2>

          <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
            Generate your company&apos;s statutory compliance diagnostic in 3 minutes. Zero credit card required to start.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/onboarding">
              <button className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-8 py-3.5 rounded-full text-sm shadow-md transition-all flex items-center gap-2">
                <span>Run Free Compliance Diagnostic</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/practice/dashboard">
              <button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-8 py-3.5 rounded-full text-sm transition-all">
                I am a Compliance Officer / Agency
              </button>
            </Link>
          </div>
        </section>

      </main>

      {/* Public Footer */}
      <CompliancePublicFooter />

      {/* Floating AI Regulatory Assistant Drawer */}
      <ComplianceAssistantDrawer />
    </div>
  );
}
