"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  Activity, 
  Briefcase, 
  Users2, 
  Scale, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles 
} from "lucide-react";
import { CompliancePublicNav } from "@/components/layout/CompliancePublicNav";
import { CompliancePublicFooter } from "@/components/layout/CompliancePublicFooter";
import { ComplianceAssistantDrawer } from "@/components/layout/ComplianceAssistantDrawer";
import { MotionSection, MotionCard, defaultEase } from "@/components/motion/MotionTransitions";

export default function SolutionsPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>("fintech");

  const industries = [
    {
      id: "fintech",
      name: "FinTech & Digital Payments",
      icon: CreditCard,
      summary: "Navigating CBN guidelines, NDPA 2023 financial data regulations, and strict NFIU/AML requirements.",
      challenges: [
        "High volume of consumer personal data requiring NDPA 2023 compliance",
        "Strict CBN KYC/AML Tier 1-3 customer due diligence mandates",
        "Frequent regulatory reporting cycles to CBN, NFIU, and NDPC"
      ],
      modules: ["HubAML", "HubPrivacy", "HubAudit", "HubReport", "HubAlerts"],
      quote: "ComplianceHub automated our NDPC statutory audit pack and gave our external AML consultant clear delegated access."
    },
    {
      id: "dnfbp",
      name: "DNFBPs & Professional Firms",
      icon: Scale,
      summary: "SCUML compliance for legal practitioners, real estate developers, jewelers, and chartered accountants.",
      challenges: [
        "SCUML annual registration and AML/CFT return filings",
        "Cash transaction reporting thresholds under MLA 2022",
        "Mandatory staff AML training certification requirements"
      ],
      modules: ["HubAML", "HubAcademy", "HubDocs", "HubCalendar"],
      quote: "Zero surprise SCUML penalty notices. Our compliance calendar flags renewals 60 days in advance."
    },
    {
      id: "logistics",
      name: "Logistics & Supply Chain",
      icon: Truck,
      summary: "Managing interstate operating permits, vendor compliance, fleet driver certifications, and local council taxes.",
      challenges: [
        "Tracking expirations across hundreds of vehicular and state permits",
        "Vendor due diligence and withholding tax compliance",
        "Workforce safety, pension remittances, and NSITF filings"
      ],
      modules: ["HubCalendar", "HubDocs", "HubVendors", "HubPeople"],
      quote: "Managing 120 haulage trucks and permits across 6 geopolitical zones with zero downtime."
    },
    {
      id: "healthcare",
      name: "Healthcare & HMOs",
      icon: Activity,
      summary: "Medical health data protection under the NDPA, NHIA regulations, and professional clinical certifications.",
      challenges: [
        "Sensitive medical records subject to high NDPC scrutiny",
        "Annual medical personnel practicing licence renewals",
        "Healthcare vendor and pharmaceutical supplier due diligence"
      ],
      modules: ["HubPrivacy", "HubPeople", "HubDue", "HubAudit"],
      quote: "Ensured our patient health management system passed statutory NDPC data protection scrutiny."
    }
  ];

  const current = industries.find(i => i.id === selectedIndustry) || industries[0];

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col">
      <CompliancePublicNav />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 my-8 space-y-12">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: defaultEase }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <span className="text-xs font-black text-[#0089C1] uppercase tracking-wider bg-sky-100/60 text-[#0089C1] px-3 py-1 rounded-full border border-sky-200">
            Tailored Industry Solutions
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight text-display leading-tight">
            Nigeria-Specific Compliance Designed for Your Exact Sector
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Every Nigerian industry has distinct regulatory overseers. ComplianceHub maps your exact statutory obligations across CAC, FIRS, NDPC, CBN, and SCUML into customized operating workflows.
          </p>
        </motion.div>

        {/* Industry Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {industries.map((ind, index) => {
            const Icon = ind.icon;
            const isSelected = selectedIndustry === ind.id;
            return (
              <motion.button
                key={ind.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                onClick={() => setSelectedIndustry(ind.id)}
                className={`p-5 rounded-3xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#1E293B] text-white border-slate-900 shadow-md"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-xs"
                }`}
              >
                <Icon className={`w-6 h-6 mb-3 ${isSelected ? "text-[#0089C1]" : "text-slate-500"}`} />
                <div>
                  <h3 className="font-bold text-sm leading-tight mb-1">{ind.name}</h3>
                  <p className={`text-[11px] ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                    Sector Solution
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Industry Deep Dive Card */}
        <MotionSection className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-200 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-[#0089C1] uppercase tracking-wider block mb-1">
                  Compliance Blueprint
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
                  {current.name}
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {current.summary}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Key Regulatory Pain Points We Solve:
                </h4>
                {current.challenges.map((c, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Recommended Core Modules:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {current.modules.map((m, i) => (
                    <span key={i} className="text-xs font-bold bg-[#E8EFF4] text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/80">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Link href="/onboarding">
                  <button className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-full text-xs shadow-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Configure {current.name} Workspace</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Testimonial & Evidence Box */}
            <div className="bg-[#F8FAFC] rounded-3xl p-8 border border-slate-200 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-500">
                  {"★".repeat(5)}
                </div>
                <blockquote className="text-base font-semibold text-slate-800 italic leading-relaxed">
                  &ldquo;{current.quote}&rdquo;
                </blockquote>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-slate-700">Verified Compliance Deployment</span>
                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Audit Passed
                </span>
              </div>
            </div>
          </div>
        </MotionSection>

        {/* Persona Solutions (Blueprint Part 1.1) */}
        <MotionSection className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-display">
              Solutions by Stakeholder Role
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Whether you are an SME founder or a Senior Compliance Partner running a 50-client agency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MotionCard hoverEffect className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <Building2 className="w-8 h-8 text-[#0089C1] mb-3" />
                <h3 className="font-bold text-lg text-slate-900 mb-2">Business Owners & Managing Directors</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Eliminate personal liability and sudden bank account freezes. Gain executive visibility over all company filings, tax statuses, and employee certifications in one clear score.
                </p>
              </div>
              <Link href="/business/dashboard" className="text-xs font-bold text-[#0089C1] flex items-center gap-1 hover:underline">
                <span>Explore Business Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </MotionCard>

            <MotionCard hoverEffect delay={0.1} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <Briefcase className="w-8 h-8 text-[#245C44] mb-3" />
                <h3 className="font-bold text-lg text-slate-900 mb-2">Independent Compliance Officers</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Grow your fractional practice. Discover high-value SME clients, manage multiple businesses seamlessly without credential sharing, and automate compliance evidence collection.
                </p>
              </div>
              <Link href="/practice/dashboard" className="text-xs font-bold text-[#245C44] flex items-center gap-1 hover:underline">
                <span>Explore HubAgents Practice Suite</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </MotionCard>

            <MotionCard hoverEffect delay={0.2} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <Users2 className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="font-bold text-lg text-slate-900 mb-2">Compliance Consulting Agencies & DPCOs</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Manage agency staff assignments across 50+ enterprise clients. Monitor staff utilisation, client renewal contracts, automated retainer invoicing, and unified audit preparation.
                </p>
              </div>
              <Link href="/practice/agency" className="text-xs font-bold text-purple-600 flex items-center gap-1 hover:underline">
                <span>Explore HubAgency Features</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </MotionCard>
          </div>
        </MotionSection>

      </main>

      <CompliancePublicFooter />
      <ComplianceAssistantDrawer />
    </div>
  );
}
