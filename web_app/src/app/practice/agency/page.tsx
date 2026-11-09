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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Compliance Associate");
  const [speciality, setSpeciality] = useState("CAMA 2020 & NDPA 2023");
  const [submitting, setSubmitting] = useState(false);
  const [reallocatingMember, setReallocatingMember] = useState<AgencyMember | null>(null);

  const loadTeam = async () => {
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
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleAddAssociate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setSubmitting(true);
    try {
      await api.practice.addTeamMember({
        full_name: name,
        email: email,
        role: role,
        specialisation: speciality,
      });
      await loadTeam();
      setShowInviteModal(false);
      setName("");
      setEmail("");
    } catch (err) {
      console.error("Error onboarding associate:", err);
    } finally {
      setSubmitting(false);
    }
  };

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
          onClick={() => setShowInviteModal(true)}
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
                        onClick={() => setReallocatingMember(m)}
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

      {/* Invite Associate Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Onboard Agency Associate</h3>
                <p className="text-xs text-slate-500">Add an accredited compliance specialist to Apex Advisory.</p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAssociate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Barr. Nneka Umeh, CDPO"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. nneka@apexadvisory.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Agency Practice Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="Senior Associate">Senior Associate</option>
                  <option value="Lead AML/CFT Auditor">Lead AML/CFT Auditor</option>
                  <option value="DPCO Privacy Lead">DPCO Privacy Lead</option>
                  <option value="Tax Compliance Specialist">Tax Compliance Specialist</option>
                  <option value="Corporate Secretarial Lead">Corporate Secretarial Lead</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Specialisation Domain</label>
                <input
                  type="text"
                  required
                  value={speciality}
                  onChange={(e) => setSpeciality(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? "Onboarding..." : "Onboard Associate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workload Reallocation Modal */}
      {reallocatingMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-900">Workload Allocation: {reallocatingMember.name}</h3>
            <p className="text-xs text-slate-500">Currently managing {reallocatingMember.assignedClientsCount} corporate client entities at {reallocatingMember.utilisation} utilisation.</p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              Capacity allocation is synchronized across tenant workspace boundaries.
            </div>
            <button
              onClick={() => setReallocatingMember(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Close Workload View
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
