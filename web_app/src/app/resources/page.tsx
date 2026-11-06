"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  BookOpen, 
  Sparkles, 
  Scale, 
  CheckCircle2,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { CompliancePublicNav } from "@/components/layout/CompliancePublicNav";
import { CompliancePublicFooter } from "@/components/layout/CompliancePublicFooter";
import { ComplianceAssistantDrawer } from "@/components/layout/ComplianceAssistantDrawer";

export default function ResourcesPage() {
  const [downloadedItem, setDownloadedItem] = useState<string | null>(null);

  const guides = [
    {
      id: "guide-tax-2026",
      title: "Nigeria Tax Act 2025/2026: SME Transition & Withholding Tax Guide",
      authority: "Federal Ministry of Finance / NRS / FIRS",
      effectiveDate: "January 1, 2026",
      tag: "Statutory Guidance",
      summary: "Practical breakdown of the new Nigerian tax framework, digital TaxPro-MAX submission timelines, revised WHT exemption thresholds, and transitional provisions for registered entities.",
      fileSize: "1.4 MB PDF",
      keyDeadlines: "CIT due within 6 months of FY end; Monthly VAT due by 21st"
    },
    {
      id: "guide-ndpa-2023",
      title: "NDPA 2023 Annual Statutory Compliance Audit Filing Manual",
      authority: "Nigeria Data Protection Commission (NDPC)",
      effectiveDate: "In Force (Annual Audit Deadline: March 15)",
      tag: "Data Privacy",
      summary: "Step-by-step guidance on classifying Data Controllers of Major Importance (DCMI), drafting the Record of Processing Activities (RoPA), and preparing the DPCO audit submission.",
      fileSize: "2.1 MB PDF",
      keyDeadlines: "Statutory filing cut-off: 15 March annually"
    },
    {
      id: "guide-scuml-2022",
      title: "SCUML AML/CFT Compliance Manual & Red Flag Guide for DNFBPs",
      authority: "Special Control Unit Against Money Laundering / EFCC",
      effectiveDate: "MLA 2022 Regulations",
      tag: "AML / CFT",
      summary: "Compliance handbook for Designated Non-Financial Businesses & Professions (DNFBPs). Includes mandatory KYC register templates, PEP screening procedures, and currency transaction threshold limits.",
      fileSize: "1.8 MB PDF",
      keyDeadlines: "Annual return due March 31; CTRs due weekly"
    },
    {
      id: "guide-cama-2020",
      title: "CAMA 2020 Post-Incorporation Compliance & Beneficial Ownership Register",
      authority: "Corporate Affairs Commission (CAC)",
      effectiveDate: "CAMA 2020 s.377 & PSC Regulations",
      tag: "Corporate Governance",
      summary: "Comprehensive guide to maintaining corporate status, filing annual returns with statement of affairs, and reporting Persons with Significant Control (PSC) to avoid administrative sanctions.",
      fileSize: "980 KB PDF",
      keyDeadlines: "Within 42 days of AGM or by June 30"
    }
  ];

  const handleDownload = (title: string) => {
    setDownloadedItem(title);
    setTimeout(() => {
      setDownloadedItem(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col">
      <CompliancePublicNav />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 my-8 space-y-12">
        {/* Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-black text-amber-700 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Regulatory Intelligence
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight text-display leading-tight">
            Official Nigerian Regulatory Guidelines, Acts & Implementation Manuals
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Curated and annotated by our in-house regulatory intelligence team to help Nigerian founders and compliance practitioners navigate complex legal changes without ambiguity.
          </p>
        </div>

        {/* Download notification */}
        {downloadedItem && (
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Downloaded &ldquo;{downloadedItem}&rdquo; successfully!</span>
          </div>
        )}

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200 shadow-xs flex flex-col justify-between space-y-6 hover:border-slate-300 transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E8EFF4] text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                    {g.tag}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{g.fileSize}</span>
                </div>

                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {g.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-[#0089C1] font-semibold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Authority: {g.authority}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {g.summary}
                </p>

                <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block text-[11px]">Statutory Deadline Rule:</strong>
                    <span>{g.keyDeadlines}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Effective: {g.effectiveDate}</span>
                <button
                  onClick={() => handleDownload(g.title)}
                  className="bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Guide</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Regulatory Advisory Box */}
        <div className="bg-[#E9F2F5] rounded-[36px] p-8 md:p-10 border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 font-black text-lg">
            <Scale className="w-6 h-6 text-[#0089C1]" />
            <span>Need Custom Statutory Interpretation?</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            Our regulatory intelligence database is updated on every gazetted circular. If your business has cross-border data transfers, specialised fintech licensing (e.g. CBN PSSP, MMO, or Switching), or complex transfer-pricing requirements under the 2026 Tax Act, consult one of our accredited specialists on HubExperts.
          </p>
          <div className="pt-2">
            <Link href="/experts">
              <button className="bg-[#0089C1] hover:bg-sky-600 text-white font-bold px-6 py-2.5 rounded-full text-xs shadow-xs">
                Browse Accredited Legal & Tax Advisors
              </button>
            </Link>
          </div>
        </div>

      </main>

      <CompliancePublicFooter />
      <ComplianceAssistantDrawer />
    </div>
  );
}
