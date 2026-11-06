"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Headphones, 
  MessageSquare, 
  Ticket, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  UserCheck
} from "lucide-react";

export default function StaffDashboardPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const [tickRes, chatRes] = await Promise.all([
          fetch(`${apiUrl}/api/support/tickets`),
          fetch(`${apiUrl}/api/chat/sessions`)
        ]);
        if (tickRes.ok) setTickets(await tickRes.json());
        if (chatRes.ok) setSessions(await chatRes.json());
      } catch (e) {
        console.warn("Using fallback staff records", e);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Support Resolution Shift • Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Compliance Support Cockpit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Assisting Nigerian corporate clients with CAC filing validations, TaxPro-MAX sync, and statutory deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/staff/chat">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition-all">
              <MessageSquare className="w-4 h-4" />
              <span>Open Live Chat ({sessions.length})</span>
            </button>
          </Link>
          <Link href="/staff/tickets">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all">
              <Ticket className="w-4 h-4" />
              <span>Tickets Queue</span>
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Pending Tickets</span>
            <Ticket className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {tickets.filter(t => t.status !== "RESOLVED").length}
          </div>
          <div className="mt-1 text-[11px] font-bold text-slate-400">
            Assigned to your queue
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Active Live Chats</span>
            <MessageSquare className="w-4 h-4 text-[#0089C1]" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {sessions.length}
          </div>
          <div className="mt-1 text-[11px] font-bold text-emerald-600">
            Real-time visitors online
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Avg Response Speed</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            3.2 min
          </div>
          <div className="mt-1 text-[11px] font-bold text-emerald-600">
            Within 5 min target
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Customer CSAT</span>
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            98.7%
          </div>
          <div className="mt-1 text-[11px] font-bold text-purple-600">
            Excellent rating
          </div>
        </div>
      </div>

      {/* Main Dual Pane: Active Live Chats & Urgent Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Chat Sessions Queue */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Active Live Chat Sessions
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Direct client inquiries requiring response
                </p>
              </div>
              <Link href="/staff/chat">
                <span className="text-[11px] font-bold text-[#0089C1] hover:underline">
                  Open Console
                </span>
              </Link>
            </div>

            <div className="space-y-3">
              {sessions.map(s => (
                <Link key={s.id} href="/staff/chat">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-900">{s.visitor_name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{s.id}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-semibold mb-2">
                      {s.visitor_company || s.visitor_email}
                    </p>

                    <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/60 font-medium line-clamp-1 italic">
                      "{s.last_message || "Active conversation"}"
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link href="/staff/chat">
              <button className="w-full py-2.5 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white text-xs font-bold transition-colors">
                Launch Real-time Chat Responder
              </button>
            </Link>
          </div>
        </div>

        {/* Priority Tickets Queue */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Assigned Support Tickets
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Statutory inquiries submitted by client accounts
                </p>
              </div>
              <Link href="/staff/tickets">
                <span className="text-[11px] font-bold text-[#0089C1] hover:underline">
                  View All Tickets
                </span>
              </Link>
            </div>

            <div className="space-y-3">
              {tickets.slice(0, 3).map(t => (
                <Link key={t.id} href="/staff/tickets">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">{t.subject}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.priority === "URGENT" ? "bg-rose-100 text-rose-700" :
                        t.priority === "HIGH" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {t.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2 font-medium">
                      <span>{t.customer_name}</span>
                      <span>•</span>
                      <span className="text-[#0089C1] font-semibold">{t.category}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Ref: <strong className="text-slate-600 font-mono">{t.id}</strong></span>
                      <span className="text-[#0089C1] font-bold group-hover:underline flex items-center gap-1">
                        Respond
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link href="/staff/tickets">
              <button className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors">
                Open Ticket Resolution Workspace
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
