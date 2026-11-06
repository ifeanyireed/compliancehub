"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Share2, 
  Bookmark, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  UserCheck,
  Scale
} from "lucide-react";
import { CompliancePublicNav } from "@/components/layout/CompliancePublicNav";
import { CompliancePublicFooter } from "@/components/layout/CompliancePublicFooter";
import { ComplianceAssistantDrawer } from "@/components/layout/ComplianceAssistantDrawer";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string;
  author_role: string;
  author_avatar: string;
  category: string;
  tags: string[];
  read_time: string;
  status: string;
  cover_image: string;
  published_at: string;
}

const FALLBACK_POST: BlogPost = {
  id: 1,
  title: "Navigating the 2026 Nigeria Tax Act: A Corporate Guide to Withholding, CIT, and TaxPro-MAX",
  slug: "navigating-2026-nigeria-tax-act-corporate-guide",
  excerpt: "Comprehensive operational breakdown of the sweeping 2026 Nigerian tax reforms and what managing directors must change in their monthly payroll and CIT calculations.",
  content: `## 1. Overview of the 2026 Tax Legislative Framework

The Federal Government of Nigeria implemented the comprehensive Nigeria Tax Act with an effective enforcement date of January 1, 2026. This legislation consolidates corporate income tax (CIT), value-added tax (VAT), and digital service remittances into a unified administrative portal.

Corporate compliance officers and directors of Nigerian companies must adjust internal fiscal workflows to remain fully compliant with the FIRS and State Internal Revenue Services (SIRS).

---

## 2. Key Statutory Reforms & Operational Shifts

### A. Zero-Rated Threshold Adjustments
Small businesses with gross turnover below **₦50,000,000** are exempt from 30% CIT rates. However, statutory return filings remain mandatory on TaxPro-MAX. Failure to submit nil returns attracts automatic administrative late-filing fines of **₦50,000 in the first month** and **₦25,000 per subsequent month**.

### B. Automated Digital Withholding Tax Credit Notes
Historically, companies suffered delays of 6 to 18 months obtaining physical Withholding Tax (WHT) credit notes. Under the 2026 Tax Act digital regime, withholding deductions made via TaxPro-MAX generate dynamic, tamper-evident digital credit vouchers tied directly to recipient Taxpayer Identification Numbers (TINs).

### C. Unified Monthly VAT Remittance Timeline
VAT returns remain due strictly on the **21st day** of every subsequent month. The new portal automatically cross-references submitted invoices against e-invoicing data recorded by registered vendors.

---

## 3. Statutory Deadlines Summary Table

| Filing Type | Statutory Due Date | Governing Provision | Non-Compliance Risk |
|:---|:---|:---|:---|
| **Monthly VAT** | 21st of following month | Nigeria Tax Act 2026 s.14 | ₦50,000 first month + interest |
| **Corporate Income Tax (CIT)** | 6 months post-financial year | CITA s.55 / Tax Act 2026 | Daily accrual fines + freeze order |
| **PAYE Annual Return (Form H1)** | January 31 annually | PITA s.81 | Up to ₦500,000 administrative penalty |
| **Withholding Tax Remittance** | 21st of following month | FIRS Regulations 2026 | 10% penalty + commercial interest |

---

## 4. Operational Checklist for Nigerian Companies

1. **Conduct a Vendor TIN Audit**: Ensure all external service providers have verified corporate TINs linked to their CAC RC numbers.
2. **Review Employment Contracts**: Confirm gross pay structuring conforms to current consolidated relief allowance schedules.
3. **Engage an Accredited Tax Practitioner**: Complex corporate transactions require certified CITN or ICAN chartered review to avoid retrospective liabilities.`,
  author_name: "Tunde Bakare, CAMS",
  author_role: "Senior AML & Regulatory Officer",
  author_avatar: "/character1.jpg",
  category: "Taxation & FIRS",
  tags: ["Tax Act 2026", "FIRS", "TaxPro-MAX", "CIT", "Corporate Tax"],
  read_time: "5 min read",
  status: "PUBLISHED",
  cover_image: "/article_professional.jpg",
  published_at: "2026-02-01"
};

export default function SingleBlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost>(FALLBACK_POST);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPost() {
      if (!slug) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/api/blog/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.title) {
            setPost(data);
          }
        }
      } catch (err) {
        console.warn("Using fallback post for slug:", slug);
      }
    }
    loadPost();
  }, [slug]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] flex flex-col font-sans">
      <CompliancePublicNav />

      <main className="flex-1 pb-24">
        {/* Top Back bar */}
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-4">
          <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Regulatory Intelligence</span>
          </Link>
        </div>

        {/* Article Container */}
        <article className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-[#0089C1]/10 text-[#0089C1] text-xs font-bold border border-[#0089C1]/20">
                {post.category}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                {post.read_time}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                Published {post.published_at}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
              {post.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium mb-6">
              {post.excerpt}
            </p>

            {/* Author Card & Actions */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={post.author_avatar}
                  alt={post.author_name}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-300 shadow-xs"
                />
                <div>
                  <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>{post.author_name}</span>
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xs text-slate-500 font-medium">{post.author_role}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{copied ? "Link Copied!" : "Share Article"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Hero Cover Image */}
          <div className="w-full h-80 sm:h-96 rounded-3xl overflow-hidden border border-slate-200 shadow-md mb-10 relative">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Statutory Highlight Notice Box */}
          <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-6 mb-10 flex items-start gap-4 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#0089C1] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-sky-950 mb-1">
                Statutory Advisory Notice
              </h4>
              <p className="text-xs text-sky-800 leading-relaxed font-medium">
                This intelligence dispatch is curated by accredited Nigerian compliance practitioners. For bespoke corporate filing assistance or enterprise DPCO audit filing, engage an accredited specialist directly via HubExperts.
              </p>
            </div>
          </div>

          {/* Article Body Content */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm sm:text-base">
            <div className="whitespace-pre-line font-medium leading-relaxed">
              {post.content}
            </div>

            {/* Tags */}
            <div className="mt-12 pt-8 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Related Statutory Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {post.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Call to Action Card */}
          <div className="mt-12 bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                HubExperts Marketplace
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                Need bespoke counsel on this regulation?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
                Connect with vetted Nigerian compliance practitioners, licensed DPCOs, and chartered tax professionals on ComplianceHub.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Link href="/experts" className="w-full md:w-auto">
                <button className="w-full px-5 py-3 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2">
                  <span>Browse Accredited Specialists</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </article>
      </main>

      <CompliancePublicFooter />
      <ComplianceAssistantDrawer />
    </div>
  );
}
