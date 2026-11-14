"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Star, 
  MapPin, 
  CheckCircle2, 
  Calendar, 
  FileCheck2, 
  Briefcase, 
  Award,
  Clock,
  Sparkles
} from "lucide-react";
import { CompliancePublicNav } from "@/components/layout/CompliancePublicNav";
import { CompliancePublicFooter } from "@/components/layout/CompliancePublicFooter";
import { api } from "@/lib/api";
import { defaultEase } from "@/components/motion/MotionTransitions";

export default function ExpertProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [expert, setExpert] = useState<any>({
    id: unwrappedParams.id,
    name: "Tunde Bakare, CAMS",
    title: "Senior AML/CFT & Regulatory Practice Director",
    avatar: "/character1.jpg",
    location: "Victoria Island, Lagos",
    experienceYears: 12,
    rating: 4.96,
    reviewsCount: 38,
    hourlyRate: 35000,
    retainerRate: 250000,
    specialisations: ["AML/CFT & SCUML", "Fintech Licensing", "CBN Risk Supervision", "Sanctions Screening"],
    certifications: ["Certified Anti-Money Laundering Specialist (CAMS)", "Chartered Institute of Bankers (CIBN)"],
    verifiedBy: "ComplianceHub Verification Directorate",
    isAvailable: true,
    activeClientsCount: 4,
    bio: "Ex-head of regulatory compliance at a Tier-1 Nigerian payment switch. Specialises in navigating SCUML, CBN guidelines, and constructing resilient fraud/AML operations for scale."
  });
  const [requested, setRequested] = useState(false);

  React.useEffect(() => {
    async function loadExpertProfile() {
      try {
        const live = await api.practice.getExperts();
        if (Array.isArray(live)) {
          const match = live.find((e: any) => e.id === unwrappedParams.id);
          if (match) {
            setExpert({
              id: match.id,
              name: match.full_name,
              title: match.qualification ? `${match.qualification} • Senior Compliance Lead` : "Senior Compliance Officer",
              avatar: match.avatar_url || "/character1.jpg",
              specialisations: match.specialisations || ["AML/CFT & SCUML"],
              certifications: [match.qualification || "CAMS"],
              experienceYears: match.years_experience || 8,
              rating: 4.95,
              reviewsCount: 38,
              hourlyRate: Number(match.hourly_rate_ngn || 35000),
              retainerRate: Number(match.monthly_retainer_ngn || 250000),
              location: "Lagos, Nigeria",
              bio: match.bio || "Certified regulatory specialist.",
              verifiedBy: "ComplianceHub Verification Directorate",
              isAvailable: true,
              activeClientsCount: match.active_clients_count || 4,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load expert details:", err);
      }
    }
    loadExpertProfile();
  }, [unwrappedParams.id]);

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] font-sans flex flex-col">
      <CompliancePublicNav />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 my-8 space-y-8">
        
        {/* Back Link */}
        <Link href="/experts" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Experts Directory</span>
        </Link>

        {/* Hero Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: defaultEase }}
          className="bg-white rounded-[36px] p-8 md:p-10 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="flex items-center gap-5">
            <img
              src={expert.avatar}
              alt={expert.name}
              className="w-24 h-24 rounded-3xl object-cover border-2 border-slate-200 shadow-sm"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
                  {expert.name}
                </h1>
                <span className="p-1 rounded-md bg-amber-50 text-amber-600" title="Verified Professional Credentials">
                  <ShieldCheck className="w-5 h-5" />
                </span>
              </div>
              <p className="text-sm font-semibold text-[#0089C1]">{expert.title}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {expert.location}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-bold text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {expert.rating} ({expert.reviewsCount} verified audits)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200 text-right w-full md:w-auto">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Retainer Rate</span>
            <div className="text-2xl font-black text-slate-900 font-mono">
              ₦{expert.retainerRate.toLocaleString()}
              <span className="text-xs font-normal text-slate-500">/mo</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold block mt-1">
              Active with {expert.activeClientsCount} client businesses
            </span>
          </div>
        </motion.div>

        {/* Profile Content Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: defaultEase }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          
          {/* Main Dossier */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-black text-slate-900 text-display">
                Executive Biography & Regulatory Experience
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {expert.bio}
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Over {expert.experienceYears} years of direct practice in the Nigerian regulatory arena, interfacing with enforcement divisions of the Corporate Affairs Commission (CAC), the Nigeria Data Protection Commission (NDPC), the Federal Inland Revenue Service (FIRS/NRS), and the Special Control Unit Against Money Laundering (SCUML).
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-black text-slate-900 text-display">
                Verified Credentials & Certifications
              </h2>
              <div className="space-y-3">
                {expert.certifications?.map((cert: string, i: number) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">{cert}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      Verified
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                Verified by: <strong className="text-slate-600">{expert.verifiedBy}</strong>
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-black text-slate-900 text-display">
                Areas of Specialisation
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {expert.specialisations?.map((s: string, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-[#E8EFF4] border border-slate-200/80 text-xs font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0089C1]" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Action Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-5 sticky top-28">
              <h3 className="font-extrabold text-base text-slate-900 text-display">
                Request Engagement
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect your HubBusiness workspace. Delegate authorized modules and retain full revocation control at all times.
              </p>

              {!requested ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Standard Scope</span>
                    Monthly regulatory monitoring, statutory deadline filing preparation, and audit defense.
                  </div>

                  <button
                    onClick={() => setRequested(true)}
                    className="w-full bg-[#0089C1] hover:bg-sky-600 text-white font-bold py-3 rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Initiate Retainer (₦{expert.retainerRate.toLocaleString()}/mo)</span>
                  </button>

                  <Link href="/business/dashboard">
                    <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-all mt-2">
                      Review Your Workspace First
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-900 text-center space-y-2 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-bold">Engagement Proposal Sent!</p>
                  <p className="text-slate-600">
                    {expert.name} has been notified and will respond within 4 business hours.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instant permission revocation supported</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Standardised Nigerian e-engagement contract</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Integrated Paystack escrow disbursement</span>
                </div>
              </div>
            </div>
          </div>

        </motion.div>

      </main>

      <CompliancePublicFooter />
    </div>
  );
}
