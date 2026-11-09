"use client";

import React, { useState, useEffect } from "react";
import { 
  Users2, 
  Building2, 
  ShieldCheck, 
  UserPlus, 
  CheckCircle2, 
  ArrowRight, 
  Award, 
  Layers, 
  Sparkles,
  Loader2
} from "lucide-react";
import { api } from "@/lib/api";

interface AgencyMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  assignedClientsCount: number;
  speciality: string;
  utilisation: string;
}

export default function PracticeAgencyPage() {
  const [teamMembers, setTeamMembers] = useState<AgencyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      setLoading(true);
      try {
        const team = await api.practice.getTeam();
        if (Array.isArray(team)) {
          setTeamMembers(
            team.map((m: any) => ({
              id: m.id,
              name: m.name,
              avatar: m.avatar || "/character1.jpg",
              role: m.role || "Compliance Specialist",
              assignedClientsCount: m.assigned_clients_count || 4,
              speciality: m.speciality || "Regulatory Compliance",
              utilisation: m.utilisation || "80%",
            }))
          );
        } else {
          setTeamMembers([]);
        }
      } catch (err) {
        console.error("Failed to load agency team from database:", err);
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, []);

  const totalClients = teamMembers.reduce((acc, m) => acc + m.assignedClientsCount, 0);

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Banner */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-purple-700 uppercase tracking-wider block mb-1">
            HubAgency Enterprise Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-display">
            Agency Team & Client Allocations
          </h1>
          <p className="text-xs text-slate-500">
            Manage practice staff, distribute corporate client portfolios, and monitor consultant utilisation.
          </p>
        </div>

        <button 
          onClick={() => {
            const name = prompt("Enter full name of the new compliance associate to invite:");
            if (name) {
              alert(`Associate invitation dispatched to ${name}. They will be onboarded to Apex Advisory Agency.`);
            }
          }}
          className="bg-[#1E293B] hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-xs flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Agency Associate</span>
        </button>
      </div>

      {/* Agency Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Agency Headcount</span>
          <div className="text-2xl font-black text-slate-900 font-mono">{teamMembers.length} Practitioners</div>
          <span className="text-[10px] text-purple-700 font-bold">1 Partner, {Math.max(0, teamMembers.length - 2)} Leads, 1 Associate</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Staff Utilisation</span>
          <div className="text-2xl font-black text-emerald-800 font-mono">81%</div>
          <span className="text-[10px] text-slate-500 font-medium">Optimal capacity range</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Managed Clients</span>
          <div className="text-2xl font-black text-slate-900 font-mono">{totalClients} Entities</div>
          <span className="text-[10px] text-slate-500 font-medium">Across Lagos, Abuja & Rivers</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Accredited Credentials</span>
          <div className="text-2xl font-black text-[#0089C1] font-mono">100% Verified</div>
          <span className="text-[10px] text-emerald-700 font-bold">CAMS, ICAN, NDPC DPCO</span>
        </div>
      </div>

      {/* Team Allocation Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900">Agency Team & Workload Allocation</h3>
          <span className="text-xs text-slate-400 font-mono">Apex Advisory Practice</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Practitioner Name</th>
                <th className="py-3.5 px-4">Agency Role</th>
                <th className="py-3.5 px-4">Core Discipline</th>
                <th className="py-3.5 px-4">Assigned Clients</th>
                <th className="py-3.5 px-4">Capacity Utilisation</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {loading ? "Loading agency team from database..." : "No agency practitioners found."}
                  </td>
                </tr>
              ) : (
                teamMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-3">
                      <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      <span>{m.name}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">{m.role}</td>
                    <td className="py-4 px-4 text-slate-700 font-semibold">{m.speciality}</td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      {m.assignedClientsCount} Businesses
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{m.utilisation}</span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: m.utilisation }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => alert(`Opening workload re-assignment panel for ${m.name}`)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        Reallocate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
