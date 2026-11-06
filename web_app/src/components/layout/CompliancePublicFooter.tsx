"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Mail, MapPin, Phone, ExternalLink, ArrowUpRight } from "lucide-react";

export function CompliancePublicFooter() {
  return (
    <footer className="w-full bg-[#DCE8DF]/40 border-t border-slate-300/40 text-slate-700 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-300/30">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 p-1.5 shadow-xs flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 text-display">
                ComplianceHub<span className="text-[#0089C1]">.ng</span>
              </span>
            </Link>

            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              Nigeria&apos;s integrated compliance management, professional services marketplace, and compliance practice management ecosystem. Everything compliance. One workspace.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                CAMA 2020 Aligned
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0089C1]" />
                NDPA 2023 & NDPC Audit Ready
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                SCUML AML/CFT Standard
              </span>
            </div>
          </div>

          {/* Solutions Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Products
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/business/dashboard" className="text-slate-600 hover:text-slate-950 transition-colors">
                  HubBusiness
                </Link>
              </li>
              <li>
                <Link href="/experts" className="text-slate-600 hover:text-slate-950 transition-colors">
                  HubExperts Marketplace
                </Link>
              </li>
              <li>
                <Link href="/practice/dashboard" className="text-slate-600 hover:text-slate-950 transition-colors">
                  HubAgents Practice Suite
                </Link>
              </li>
              <li>
                <Link href="/modules" className="text-slate-600 hover:text-slate-950 transition-colors">
                  The 12 Compliance Modules
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-slate-600 hover:text-slate-950 transition-colors font-semibold text-[#0089C1]">
                  Regulatory Blog
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-slate-600 hover:text-slate-950 transition-colors font-semibold text-emerald-700">
                  Support & Live Chat
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Pricing & Subscriptions
                </Link>
              </li>
            </ul>
          </div>

          {/* Regulatory Intelligence Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Regulatory Coverage
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-center justify-between">
                <span>CAC CAMA 2020</span>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">Federal</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Nigeria Tax Act 2025/2026</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">New</span>
              </li>
              <li className="flex items-center justify-between">
                <span>NDPC Data Protection</span>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">NDPA</span>
              </li>
              <li className="flex items-center justify-between">
                <span>SCUML & NFIU AML/CFT</span>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">DNFBP</span>
              </li>
              <li className="flex items-center justify-between">
                <span>PENCOM, ITF & NSITF</span>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">Labour</span>
              </li>
            </ul>
          </div>

          {/* Contact / Offices Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Headquarters
            </h4>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Victoria Island, Lagos, Nigeria & CBD Abuja</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>regulatory@compliancehub.ng</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>+234 (0) 1 888 2667</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer Box required by Blueprint Part 5.4 & 15 */}
        <div className="mt-8 p-4 rounded-2xl bg-white/70 border border-slate-200 text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-800">Statutory Notice:</strong> ComplianceHub.ng is a software workflow platform and regulatory intelligence infrastructure. Completion of platform tasks and internal health scores does not constitute legal certification or statutory immunity. Statutory filing authority remains vested with licensed professionals (legal practitioners, licensed DPCOs, and accredited tax practitioners) and the respective regulators (CAC, FIRS, NDPC, SCUML).
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-300/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ComplianceHub Technologies Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/resources" className="hover:text-slate-800 transition-colors">Privacy Policy</Link>
            <Link href="/resources" className="hover:text-slate-800 transition-colors">Terms of Service</Link>
            <Link href="/resources" className="hover:text-slate-800 transition-colors">NDPA Data Rights</Link>
            <Link href="/resources" className="hover:text-slate-800 transition-colors">Security Posture</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
