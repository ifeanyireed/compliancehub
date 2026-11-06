"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, 
  X, 
  Sparkles
} from "lucide-react";
import { useAuth } from "@/components/ahnara/AuthContext";

export function CompliancePublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="w-full sticky top-0 z-50 transition-all duration-200">
      <div 
        className={`w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between transition-all duration-300 ${
          scrolled 
            ? "bg-[#E8EFF4]/95 backdrop-blur-md shadow-sm border-b border-slate-300/30 rounded-b-2xl" 
            : "bg-[#E8EFF4]/80 backdrop-blur-xs"
        }`}
      >
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center p-1.5 transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="ComplianceHub Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 text-display leading-none">
                ComplianceHub<span className="text-[#0089C1]">.ng</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mt-1">
                Everything Compliance
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Mid Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600">
          <Link 
            href="/solutions" 
            className={`transition-colors hover:text-slate-950 ${pathname === "/solutions" ? "text-slate-950 font-bold" : ""}`}
          >
            Solutions
          </Link>
          <Link 
            href="/modules" 
            className={`transition-colors hover:text-slate-950 ${pathname === "/modules" ? "text-slate-950 font-bold" : ""}`}
          >
            12 Modules
          </Link>
          <Link 
            href="/experts" 
            className={`transition-colors hover:text-slate-950 ${pathname === "/experts" ? "text-slate-950 font-bold" : ""}`}
          >
            Find an Expert
          </Link>
          <Link 
            href="/resources" 
            className={`transition-colors hover:text-slate-950 ${pathname === "/resources" ? "text-slate-950 font-bold" : ""}`}
          >
            Regulatory Intel
          </Link>
          <Link 
            href="/blog" 
            className={`transition-colors hover:text-slate-950 ${pathname?.startsWith("/blog") ? "text-slate-950 font-bold" : ""}`}
          >
            Blog
          </Link>
          <Link 
            href="/support" 
            className={`transition-colors hover:text-slate-950 ${pathname?.startsWith("/support") ? "text-slate-950 font-bold" : ""}`}
          >
            Support
          </Link>
          <Link 
            href="/pricing" 
            className={`transition-colors hover:text-slate-950 ${pathname === "/pricing" ? "text-slate-950 font-bold" : ""}`}
          >
            Pricing
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/onboarding">
            <button className="bg-[#0089C1] hover:bg-sky-600 text-white transition-all font-bold px-5 py-2.5 rounded-full text-sm shadow-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Free Diagnostic</span>
            </button>
          </Link>

          {user ? (
            <Link href={
              user.role === "BUSINESS" ? "/business/dashboard" :
              user.role === "ADMIN" ? "/admin/dashboard" :
              user.role === "STAFF" ? "/staff/dashboard" :
              "/practice/dashboard"
            }>
              <button className="bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold px-5 py-2.5 rounded-full text-sm shadow-sm">
                Dashboard
              </button>
            </Link>
          ) : (
            <Link href="/login">
              <button className="bg-[#1E293B] text-white hover:bg-slate-800 transition-all font-bold px-5 py-2.5 rounded-full text-sm shadow-sm">
                Sign In
              </button>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-700 hover:text-slate-950 focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden w-full bg-[#E8EFF4] border-b border-slate-300/40 px-6 py-6 flex flex-col gap-4 text-sm font-semibold text-slate-700 shadow-xl"
          >
            <Link href="/solutions" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-950 py-1">
              Solutions
            </Link>
            <Link href="/modules" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-950 py-1">
              12 Compliance Modules
            </Link>
            <Link href="/experts" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-950 py-1">
              Find an Expert
            </Link>
            <Link href="/resources" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-950 py-1">
              Regulatory Intelligence
            </Link>
            <Link href="/blog" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-950 py-1">
              Blog & Regulatory News
            </Link>
            <Link href="/support" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-950 py-1">
              Support Center & Live Chat
            </Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-950 py-1">
              Pricing Plans
            </Link>

            <div className="pt-4 border-t border-slate-300/30 flex flex-col gap-3">
              <Link href="/onboarding" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-[#0089C1] hover:bg-sky-600 text-white font-bold py-3 rounded-full text-sm shadow-sm text-center">
                  Start Free Compliance Assessment
                </button>
              </Link>
              <Link 
                href={user?.role === "BUSINESS" ? "/business/dashboard" : "/practice/dashboard"} 
                onClick={() => setMobileMenuOpen(false)}
              >
                <button className="w-full bg-[#1E293B] text-white hover:bg-slate-800 font-bold py-3 rounded-full text-sm shadow-sm text-center">
                  Open Workspace Dashboard
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
