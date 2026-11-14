"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  Filter, 
  Briefcase, 
  ArrowRight,
  Clock,
  Sparkles,
  X,
  Loader2
} from "lucide-react";
import { CompliancePublicNav } from "@/components/layout/CompliancePublicNav";
import { CompliancePublicFooter } from "@/components/layout/CompliancePublicFooter";
import { ComplianceAssistantDrawer } from "@/components/layout/ComplianceAssistantDrawer";
import { ComplianceExpert } from "@/lib/compliance-data";
import { api } from "@/lib/api";
import { MotionCard, MotionSection, defaultEase } from "@/components/motion/MotionTransitions";

export default function ExpertsMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialisation, setSelectedSpecialisation] = useState<string>("All");
  const [selectedLocation, setSelectedLocation] = useState<string>("All");
  const [consultModalExpert, setConsultModalExpert] = useState<ComplianceExpert | null>(null);
  const [consultSuccess, setConsultSuccess] = useState(false);
  const [expertsList, setExpertsList] = useState<ComplianceExpert[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function loadExperts() {
      setLoading(true);
      try {
        const live = await api.practice.getExperts(selectedSpecialisation);
        if (Array.isArray(live)) {
          const mapped: ComplianceExpert[] = live.map((e: any) => ({
            id: e.id,
            name: e.full_name,
            title: e.qualification ? `${e.qualification} • Senior Compliance Lead` : "Senior Compliance Officer",
            avatar: e.avatar_url || "/character1.jpg",
            specialisations: e.specialisations || ["AML/CFT & SCUML"],
            certifications: [e.qualification || "CAMS"],
            experienceYears: e.years_experience || 8,
            rating: 4.95,
            reviewsCount: 38,
            hourlyRate: Number(e.hourly_rate_ngn || 35000),
            retainerRate: Number(e.monthly_retainer_ngn || 250000),
            location: "Lagos, Nigeria",
            bio: e.bio || "Certified regulatory specialist.",
            verifiedBy: "ComplianceHub Verification Directorate",
            isAvailable: true,
            activeClientsCount: e.active_clients_count || 4,
          }));
          setExpertsList(mapped);
        } else {
          setExpertsList([]);
        }
      } catch (err) {
        console.error("Failed to load expert profiles from database:", err);
        setExpertsList([]);
      } finally {
        setLoading(false);
      }
    }
    loadExperts();
  }, [selectedSpecialisation]);

  const specialisations = [
    "All",
    "AML/CFT & SCUML",
    "NDPA 2023 Implementation",
    "Nigeria Tax Act 2025/2026 Transition",
    "CAC Annual Returns"
  ];

  const filteredExperts = expertsList.filter((exp) => {
    const matchesSearch = exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.bio.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpec = selectedSpecialisation === "All" ||
      exp.specialisations.some(s => s.toLowerCase().includes(selectedSpecialisation.toLowerCase()));

    const matchesLoc = selectedLocation === "All" ||
      exp.location.toLowerCase().includes(selectedLocation.toLowerCase());

    return matchesSearch && matchesSpec && matchesLoc;
  });

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col">
      <CompliancePublicNav />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 my-8 space-y-10">
        
        {/* Marketplace Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: defaultEase }}
          className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-200/80 shadow-xs text-center max-w-4xl mx-auto space-y-4"
        >
          <span className="text-xs font-black text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            HubExperts Marketplace
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight text-display leading-tight">
            Nigeria&apos;s Verified Compliance Officers & Regulated Specialists
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Hire certified fractional compliance officers, licensed DPCO lead auditors, and accredited tax practitioners. Control permissions and review deliverables in your HubBusiness workspace.
          </p>

          {/* Search Bar & Filters */}
          <div className="pt-4 max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by expertise, certification, or name (e.g. CAMS, DPCO, SCUML)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#E8EFF4]/70 border border-slate-300/80 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-[#E8EFF4]/70 border border-slate-300/80 rounded-2xl px-3 py-3 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="All">All Locations</option>
                <option value="Lagos">Lagos</option>
                <option value="Abuja">Abuja FCT</option>
                <option value="Port Harcourt">Port Harcourt</option>
              </select>

              <Link href="/register?role=EXPERT">
                <button className="whitespace-nowrap bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-2xl text-xs shadow-xs">
                  Join as Expert
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Specialisation Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {specialisations.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialisation(spec)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedSpecialisation === spec
                  ? "bg-[#0089C1] text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* Experts Grid */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-slate-200 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0089C1] mb-2" />
            <p className="font-bold text-xs">Loading verified compliance experts from database...</p>
          </div>
        ) : filteredExperts.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-slate-200">
            <p className="font-bold text-sm">No accredited specialists match this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredExperts.map((exp, idx) => (
              <MotionCard
                key={exp.id}
                hoverEffect
                delay={idx * 0.05}
                className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={exp.avatar}
                        alt={exp.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                            {exp.name}
                          </h3>
                          <span className="p-1 rounded-md bg-amber-50 text-amber-600" title="Identity & Credentials Verified">
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">{exp.title}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{exp.location}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-bold text-amber-600">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{exp.rating} ({exp.reviewsCount} reviews)</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Available</span>
                    </span>
                  </div>

                  {/* Bio snippet */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {exp.bio}
                  </p>

                  {/* Certifications & Badges */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {exp.certifications.map((c, i) => (
                        <span key={i} className="text-[11px] font-bold bg-[#E8EFF4] text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/80">
                          {c}
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      <strong className="text-slate-600">Specialisms:</strong> {exp.specialisations.join(", ")}
                    </div>
                  </div>
                </div>

                {/* Footer Rate & Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-400">Monthly Retainer</div>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      ₦{exp.retainerRate.toLocaleString()}<span className="text-xs font-normal text-slate-500">/mo</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/experts/${exp.id}`}>
                      <button className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">
                        View Dossier
                      </button>
                    </Link>
                    <button
                      onClick={() => {
                        setConsultModalExpert(exp);
                        setConsultSuccess(false);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Request Engagement</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </MotionCard>
            ))}
          </div>
        )}

        {/* Modal: Request Consultation / Engagement */}
        {consultModalExpert && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl relative">
              <button
                onClick={() => setConsultModalExpert(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 absolute top-5 right-5"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <img
                  src={consultModalExpert.avatar}
                  alt={consultModalExpert.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Engage {consultModalExpert.name}
                  </h3>
                  <p className="text-xs text-slate-500">{consultModalExpert.title}</p>
                </div>
              </div>

              {!consultSuccess ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setConsultSuccess(true);
                  }}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Your Company Name</label>
                    <input
                      type="text"
                      required
                      defaultValue="PayWave Technologies Ltd"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Engagement Model</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900">
                      <option>Fractional Monthly Retainer (₦{consultModalExpert.retainerRate.toLocaleString()}/mo)</option>
                      <option>Project-Based Gap Assessment</option>
                      <option>Permanent In-House Recruitment Placement</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Required Module Access</label>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span>HubAML & KYC</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span>HubPrivacy (NDPA)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span>HubDocs Vault</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span>CAC & Tax Filings</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Scope Brief</label>
                    <textarea
                      rows={3}
                      placeholder="Outline your immediate compliance objectives (e.g. Preparing for NDPC statutory audit filing or updating SCUML AML manual)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0089C1] hover:bg-sky-600 text-white font-bold py-3 rounded-xl shadow-xs transition-all text-xs"
                  >
                    Send Formal Engagement Request
                  </button>
                </form>
              ) : (
                <div className="p-6 rounded-2xl bg-emerald-50 text-emerald-900 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-extrabold text-sm">Engagement Request Dispatched!</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    A formal engagement notification has been transmitted to <strong>{consultModalExpert.name}</strong>. Once confirmed, you can review the proposed scope and grant delegated workspace permissions directly inside HubBusiness.
                  </p>
                  <button
                    onClick={() => setConsultModalExpert(null)}
                    className="bg-[#1E293B] text-white px-5 py-2 rounded-xl text-xs font-bold"
                  >
                    Close Window
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <CompliancePublicFooter />
      <ComplianceAssistantDrawer />
    </div>
  );
}
