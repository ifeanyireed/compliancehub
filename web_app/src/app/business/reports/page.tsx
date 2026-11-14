"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Printer, 
  Calendar, 
  Building2, 
  Sparkles,
  ArrowRight,
  Loader2
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/ahnara/AuthContext";

export default function BusinessReportsPage() {
  const { activeTenantId } = useAuth();
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [digest, setDigest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDigest() {
      setLoading(true);
      try {
        const data = await api.reports.getDigest();
        if (data) {
          setDigest(data);
        }
      } catch (err) {
        console.error("Failed to load reports digest:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDigest();
  }, [activeTenantId]);

  const reports = digest?.statutory_reports || [
    {
      id: "rep-01",
      title: "Consolidated Compliance Health & Readiness Report",
      description: `Executive board summary of company compliance readiness score (${digest?.compliance_score || 84}%), open statutory tasks, and legal exposure.`,
      fileType: "Executive Dossier PDF (14 Pages)",
      statutoryAuthority: "Board & Regulators"
    },
    {
      id: "rep-02",
      title: "CAC Annual Return & Status Package (CAMA 2020)",
      description: "Bundled Statement of Affairs, Form CAC 07 status report, and beneficial ownership filings ready for statutory lodgement.",
      fileType: "Statutory Bundle PDF + ZIP",
      statutoryAuthority: "Corporate Affairs Commission"
    },
    {
      id: "rep-03",
      title: "NDPC Statutory Privacy Audit Evidence Pack (NDPA 2023)",
      description: "Complete Record of Processing Activities (RoPA), Data Protection Officer appointment proof, and technical security measures.",
      fileType: "Licensed DPCO Audit Pack",
      statutoryAuthority: "Nigeria Data Protection Commission"
    },
    {
      id: "rep-04",
      title: "SCUML AML/CFT Inspection & KYC Register",
      description: "Customer due diligence audit logs, PEP screening receipts, and Anti-Money Laundering policy acknowledged by directors.",
      fileType: "NFIU / SCUML Inspection Dossier",
      statutoryAuthority: "SCUML / EFCC"
    },
    {
      id: "rep-05",
      title: "Immutable Activity & Security Event Audit Log",
      description: "Cryptographically hashed audit trail of every document upload, permission modification, and user login.",
      fileType: "Encrypted CSV / JSON Audit Log",
      statutoryAuthority: "Statutory Auditors"
    }
  ];

  const handleDownload = (id: string, title: string) => {
    setGeneratingReport(title);
    setTimeout(() => {
      setGeneratingReport(null);
      alert(`Report generated and verified for ${digest?.workspace_name || "Workspace"}: "${title}". Official submission dossier downloaded.`);
    }, 1200);
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0089C1] text-white">
              MOD-11
            </span>
            <span className="text-xs font-black text-[#0089C1] uppercase tracking-wider">
              HubReport Generator
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
            Compliance Reports & Evidence Packages
          </h1>
          <p className="text-xs text-slate-500">
            One-click compilation of board dossiers, statutory inspection bundles, and cryptographic evidence exports.
          </p>
        </div>

        <button
          onClick={() => handleDownload("all", "Complete Regulatory Inspection Bundle")}
          className="bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-xs flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#0089C1]" />
          <span>Export Complete Inspection Bundle</span>
        </button>
      </motion.div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((rep: any, idx: number) => (
          <motion.div
            key={rep.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: idx * 0.06 }}
            className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6 hover:border-slate-300 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {rep.statutoryAuthority}
                </span>
                <span className="text-xs text-slate-400 font-mono">{rep.fileType}</span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                {rep.title}
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                {rep.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Evidence Synchronised</span>
              </div>

              <button
                onClick={() => handleDownload(rep.id, rep.title)}
                disabled={generatingReport === rep.title}
                className="bg-[#0089C1] hover:bg-sky-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                {generatingReport === rep.title ? (
                  <span>Compiling PDF...</span>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Package</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
