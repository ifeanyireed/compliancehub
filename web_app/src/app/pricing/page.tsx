"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Sparkles, Building2, Briefcase, ArrowRight, ShieldCheck } from "lucide-react";
import { CompliancePublicNav } from "@/components/layout/CompliancePublicNav";
import { CompliancePublicFooter } from "@/components/layout/CompliancePublicFooter";
import { ComplianceAssistantDrawer } from "@/components/layout/ComplianceAssistantDrawer";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");
  const [userTrack, setUserTrack] = useState<"business" | "professional">("business");

  const discountMultiplier = billingCycle === "annually" ? 0.8 : 1.0;

  const businessPlans = [
    {
      name: "Free",
      tagline: "For microbusinesses testing the waters",
      monthlyPrice: 0,
      features: [
        "1 Business Workspace",
        "Basic statutory deadline reminders",
        "Up to 10 stored documents",
        "1 Business Administrator",
        "Standard email support"
      ],
      cta: "Start Free",
      highlight: false
    },
    {
      name: "Starter",
      tagline: "For registered Nigerian SMEs",
      monthlyPrice: 7500,
      features: [
        "1 Business Workspace",
        "Automated HubCalendar with SMS/WhatsApp alerts",
        "HubDocs vault (up to 100 documents)",
        "CAC & Tax clearance expiry tracking",
        "2 Administrator seats",
        "Standard compliance checklist"
      ],
      cta: "Choose Starter",
      highlight: false
    },
    {
      name: "Business",
      tagline: "For fast-growing companies & multi-employee teams",
      monthlyPrice: 20000,
      features: [
        "Everything in Starter",
        "Delegated Compliance Officer Access (HubAgents)",
        "HubPeople: Staff compliance & NDPA training",
        "HubVendors: Vendor onboarding & DPA collection",
        "One-click compliance evidence package generator",
        "5 Team Member seats"
      ],
      cta: "Choose Business",
      highlight: true
    },
    {
      name: "Professional",
      tagline: "For regulated entities, FinTechs & DNFBPs",
      monthlyPrice: 45000,
      features: [
        "Everything in Business",
        "HubAML: SCUML reporting & PEP/Sanctions screening",
        "HubPrivacy: NDPA 2023 RoPA & DSAR workflow",
        "HubAudit: Structured internal gap assessments",
        "Dual-approval sign-off workflow",
        "Dedicated onboarding support"
      ],
      cta: "Choose Professional",
      highlight: false
    }
  ];

  const professionalPlans = [
    {
      name: "Free Practice",
      tagline: "For new compliance consultants starting out",
      monthlyPrice: 0,
      features: [
        "Manage up to 2 active business clients",
        "Basic practice task board",
        "Marketplace profile listing",
        "Standard proposal submission"
      ],
      cta: "Register Practice Free",
      highlight: false
    },
    {
      name: "Independent",
      tagline: "For solo compliance consultants & DPOs",
      monthlyPrice: 10000,
      features: [
        "Manage up to 10 active business clients",
        "Multi-client portfolio health dashboard",
        "Verified Expert marketplace badge",
        "Standard client engagement contracts",
        "Automated deadline notifications across all clients"
      ],
      cta: "Choose Independent",
      highlight: false
    },
    {
      name: "Practice",
      tagline: "For established practitioners managing multiple firms",
      monthlyPrice: 25000,
      features: [
        "Manage up to 30 active business clients",
        "Integrated retainer billing via Paystack",
        "Multi-module delegated client management",
        "Client approval workflows & evidence sign-offs",
        "Priority marketplace ranking"
      ],
      cta: "Choose Practice",
      highlight: true
    },
    {
      name: "Agency Growth",
      tagline: "For compliance consulting firms & licensed DPCOs",
      monthlyPrice: 100000,
      features: [
        "Manage up to 75 active business clients",
        "Up to 10 staff seats (Senior Officers, Auditors)",
        "Client-to-officer allocation matrix",
        "Staff utilisation & agency performance analytics",
        "White-label branded client reports"
      ],
      cta: "Choose Agency",
      highlight: false
    }
  ];

  const activePlans = userTrack === "business" ? businessPlans : professionalPlans;

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col">
      <CompliancePublicNav />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 my-8 space-y-12">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-black text-[#0089C1] uppercase tracking-wider bg-sky-100/60 text-[#0089C1] px-3 py-1 rounded-full border border-sky-200">
            Subscription Pricing
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight text-display leading-tight">
            Predictable Pricing Tailored to the Nigerian Market
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Zero hidden surcharges. All plans billed in Nigerian Naira (₦) with instant Paystack billing.
          </p>

          {/* Persona Track Switcher (Business vs Practice) */}
          <div className="pt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setUserTrack("business")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                userTrack === "business"
                  ? "bg-[#1E293B] text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>For Nigerian Businesses (HubBusiness)</span>
            </button>
            <button
              onClick={() => setUserTrack("professional")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                userTrack === "professional"
                  ? "bg-[#245C44] text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>For Compliance Professionals & Agencies (HubAgents)</span>
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-3 bg-white p-1.5 rounded-full border border-slate-200 shadow-xs mt-3">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                billingCycle === "monthly" ? "bg-[#0089C1] text-white" : "text-slate-600"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annually")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === "annually" ? "bg-[#0089C1] text-white" : "text-slate-600"
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activePlans.map((plan) => {
            const price = Math.round(plan.monthlyPrice * discountMultiplier);
            return (
              <div
                key={plan.name}
                className={`bg-white rounded-[32px] p-6 md:p-8 flex flex-col justify-between transition-all relative ${
                  plan.highlight
                    ? "border-2 border-[#0089C1] shadow-lg"
                    : "border border-slate-200 shadow-xs"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0089C1] text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                    Recommended
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mb-4">{plan.tagline}</p>

                  <div className="mb-6">
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      ₦{price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 font-normal"> / month</span>
                    {billingCycle === "annually" && plan.monthlyPrice > 0 && (
                      <span className="block text-[10px] text-emerald-700 font-bold mt-1">
                        Billed annually (₦{(price * 12).toLocaleString()}/yr)
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-[#0089C1]" : "text-emerald-600"}`} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href={userTrack === "business" ? "/onboarding" : "/register?role=EXPERT"}>
                  <button
                    className={`w-full py-3 rounded-2xl font-bold text-xs transition-all shadow-xs ${
                      plan.highlight
                        ? "bg-[#0089C1] hover:bg-sky-600 text-white"
                        : "bg-[#1E293B] hover:bg-slate-800 text-white"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Enterprise Notice */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-lg font-black text-slate-900 text-display">
              Need custom enterprise deployment, custom APIs or multi-subsidiary governance?
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl">
              ComplianceHub Enterprise supports holding companies with 10+ subsidiaries, custom Single Sign-On (SSO), on-premise audit exports, and dedicated regulatory counsel.
            </p>
          </div>
          <Link href="/solutions">
            <button className="bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-2xl text-xs whitespace-nowrap shadow-xs">
              Talk to Enterprise Solutions
            </button>
          </Link>
        </div>

      </main>

      <CompliancePublicFooter />
      <ComplianceAssistantDrawer />
    </div>
  );
}
