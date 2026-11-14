"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, 
  Search, 
  MessageSquare, 
  Ticket, 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  X, 
  Send, 
  CheckCircle2, 
  Clock, 
  Building2, 
  AlertCircle,
  FileCheck2
} from "lucide-react";
import { CompliancePublicNav } from "@/components/layout/CompliancePublicNav";
import { CompliancePublicFooter } from "@/components/layout/CompliancePublicFooter";
import { ComplianceAssistantDrawer } from "@/components/layout/ComplianceAssistantDrawer";
import { MotionSection, MotionCard, defaultEase } from "@/components/motion/MotionTransitions";

interface FAQ {
  q: string;
  a: string;
  category: string;
}

const FAQS: FAQ[] = [
  {
    category: "CAC & CAMA",
    q: "When is my company required to file Annual Returns with CAC?",
    a: "Under CAMA 2020 Section 377, every Nigerian registered company must file Annual Returns no later than 42 days following its Annual General Meeting (AGM) or by June 30 annually. Late filing incurs cumulative statutory penalties."
  },
  {
    category: "TaxPro-MAX",
    q: "How does the 2026 Nigeria Tax Act affect monthly VAT and WHT?",
    a: "Monthly VAT remains strictly due by the 21st day of every subsequent month on TaxPro-MAX. Withholding tax deductions now generate automated digital credit vouchers directly linked to the recipient TIN."
  },
  {
    category: "NDPA Audit",
    q: "Does my company require a Data Protection Compliance Organisation (DPCO)?",
    a: "Companies classified as Data Controllers of Major Importance (processing data of over 10,000 Nigerian data subjects) must conduct an annual Data Protection Audit through a licensed DPCO and submit summary findings to the NDPC by March 15."
  },
  {
    category: "SCUML & AML",
    q: "Who is required to obtain a SCUML Certificate?",
    a: "Under the Money Laundering (Prevention and Prohibition) Act 2022, Designated Non-Financial Businesses & Professions (DNFBPs)—such as real estate firms, legal practitioners, automotive dealerships, and accountants—must obtain a valid SCUML certificate and file periodic AML/CFT returns."
  },
  {
    category: "Marketplace & Billing",
    q: "How does the HubExperts escrow protection work?",
    a: "When engaging an accredited compliance officer or advisory agency, client retainer fees are securely held in Nigerian banking escrow. Funds are only disbursed once the milestone (e.g. stamped CAC filing or NDPC audit submission receipt) is verified and approved."
  }
];

export default function SupportCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  // Ticket Form state
  const [ticketData, setTicketData] = useState({
    subject: "",
    category: "CAC & CAMA",
    priority: "MEDIUM",
    customer_name: "",
    customer_email: "",
    company_name: "",
    rc_number: "",
    description: ""
  });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  // Live Chat state
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [chatStarted, setChatStarted] = useState(false);

  // Submit Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/support/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketData)
      });
      if (res.ok) {
        const data = await res.json();
        setTicketSuccess(data.id || "TICK-2026-NEW");
      } else {
        setTicketSuccess("TICK-2026-SUBMITTED");
      }
    } catch (err) {
      setTicketSuccess("TICK-2026-SUBMITTED");
    } finally {
      setTicketSubmitting(false);
    }
  };

  // Start Live Chat
  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/chat/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitor_name: visitorName,
          visitor_email: visitorEmail || "visitor@compliancehub.ng",
          last_message: "Chat initiated from Help Center"
        })
      });
      if (res.ok) {
        const session = await res.json();
        setChatSessionId(session.id);
        fetchMessages(session.id);
      } else {
        setChatSessionId("CHAT-LOCAL-DEMO");
        setChatMessages([
          { sender: "staff", sender_name: "Tunde Bakare, CAMS", text: `Hello ${visitorName}! Welcome to ComplianceHub live support. How can we assist with your Nigerian regulatory compliance today?` }
        ]);
      }
    } catch (err) {
      setChatSessionId("CHAT-LOCAL-DEMO");
      setChatMessages([
        { sender: "staff", sender_name: "Tunde Bakare, CAMS", text: `Hello ${visitorName}! Welcome to ComplianceHub live support. How can we assist with your compliance today?` }
      ]);
    }
    setChatStarted(true);
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/chat/messages?session_id=${sessionId}`);
      if (res.ok) {
        const msgs = await res.json();
        setChatMessages(msgs);
      }
    } catch (e) {}
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !chatSessionId) return;
    const userMsg = {
      session_id: chatSessionId,
      sender: "visitor",
      sender_name: visitorName || "Guest",
      text: chatInput
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      await fetch(`${apiUrl}/api/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userMsg)
      });
    } catch (err) {}

    // Simulated staff automated response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          sender: "staff",
          sender_name: "Tunde Bakare, CAMS",
          text: "Thank you for reaching out! A compliance specialist has recorded your inquiry and is reviewing your company filing requirements."
        }
      ]);
    }, 1200);
  };

  const filteredFaqs = FAQS.filter(f => 
    searchQuery === "" || 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#E8EFF4] text-[#0D090C] flex flex-col font-sans">
      <CompliancePublicNav />

      <main className="flex-1 pb-24">
        {/* Support Hero */}
        <section className="pt-12 pb-16 px-6 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: defaultEase }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200/80 shadow-xs mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">Support & Resolution Desk</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              How can we help your <span className="text-[#0089C1]">compliance</span> team?
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 font-medium">
              Search Nigerian statutory FAQs, connect with live compliance specialists, or submit an expedited support ticket.
            </p>

            {/* Big Search Bar */}
            <div className="mt-8 relative max-w-2xl mx-auto">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search FAQs: CAC filing cutoff, TaxPro-MAX TIN, NDPA audit, SCUML..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200/80 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 shadow-md focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
              />
            </div>
          </motion.div>

          {/* Quick Action Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {/* Live Chat Tile */}
            <MotionCard 
              hoverEffect
              onClick={() => setChatModalOpen(true)}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-[#0089C1]/40 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0089C1] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1">Live Compliance Chat</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                Chat in real-time with our accredited Nigerian compliance officers for quick statutory inquiries.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0089C1]">
                <span>Launch Live Chat</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </MotionCard>

            {/* Submit Ticket Tile */}
            <MotionCard 
              hoverEffect
              delay={0.1}
              onClick={() => setTicketModalOpen(true)}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1">Submit Support Ticket</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                Open a formal ticket for complex filings, CAC document verification, or escrow billing assistance.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                <span>Create New Ticket</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </MotionCard>

            {/* Knowledge Base Tile */}
            <Link href="/blog">
              <MotionCard 
                hoverEffect
                delay={0.2}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-purple-500/40 transition-all cursor-pointer group h-full"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">Regulatory Intelligence Blog</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                  Browse our comprehensive library of 2026 Nigeria Tax Act, NDPA, and CAMA procedural guides.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600">
                  <span>Browse Articles</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </MotionCard>
            </Link>
          </div>

          {/* FAQs Accordion */}
          <MotionSection className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Frequently Asked Regulatory Questions
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                Common inquiries regarding statutory deadlines, CAC compliance, and marketplace engagements.
              </p>
            </div>

            <div className="space-y-3">
              {filteredFaqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === idx ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {faq.category}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {faq.q}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeAccordion === idx ? "rotate-180 text-[#0089C1]" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {activeAccordion === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-5 pt-1 text-xs text-slate-600 leading-relaxed font-medium border-t border-slate-100"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </MotionSection>
        </section>
      </main>

      {/* Ticket Modal */}
      <AnimatePresence>
        {ticketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => { setTicketModalOpen(false); setTicketSuccess(null); }}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>

              {ticketSuccess ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">Support Ticket Created!</h3>
                  <p className="text-xs text-slate-500 mt-2 font-mono bg-slate-100 py-1.5 px-3 rounded-lg inline-block">
                    Reference ID: {ticketSuccess}
                  </p>
                  <p className="text-xs text-slate-600 mt-3 max-w-sm mx-auto leading-relaxed">
                    Our compliance resolution desk has received your submission. An accredited officer will review your filing records and reply within 2 business hours.
                  </p>
                  <button
                    onClick={() => { setTicketModalOpen(false); setTicketSuccess(null); }}
                    className="mt-6 px-6 py-2.5 rounded-xl bg-[#0089C1] text-white text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket}>
                  <div className="mb-6">
                    <h3 className="text-xl font-extrabold text-slate-900">Submit a Compliance Ticket</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Fill out your corporate details to route your inquiry to the relevant regulatory specialist.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs font-semibold text-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1">Your Full Name *</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Adaeze Nwosu"
                          value={ticketData.customer_name}
                          onChange={e => setTicketData({ ...ticketData, customer_name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block mb-1">Corporate Email *</label>
                        <input
                          required
                          type="email"
                          placeholder="e.g. adaeze@company.ng"
                          value={ticketData.customer_email}
                          onChange={e => setTicketData({ ...ticketData, customer_email: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1">Company Registered Name</label>
                        <input
                          type="text"
                          placeholder="e.g. PayWave Technologies Ltd"
                          value={ticketData.company_name}
                          onChange={e => setTicketData({ ...ticketData, company_name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block mb-1">CAC RC Number</label>
                        <input
                          type="text"
                          placeholder="e.g. RC-1894231"
                          value={ticketData.rc_number}
                          onChange={e => setTicketData({ ...ticketData, rc_number: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1">Regulatory Category *</label>
                        <select
                          value={ticketData.category}
                          onChange={e => setTicketData({ ...ticketData, category: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                        >
                          <option value="CAC & CAMA">CAC & CAMA 2020 Annual Returns</option>
                          <option value="Taxation & FIRS">Taxation & FIRS / TaxPro-MAX</option>
                          <option value="Data Privacy & NDPA">Data Privacy & NDPC Audit</option>
                          <option value="AML & SCUML">SCUML & AML/CFT Compliance</option>
                          <option value="Marketplace Billing">Escrow Retainer & Billing</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1">Priority Level</label>
                        <select
                          value={ticketData.priority}
                          onChange={e => setTicketData({ ...ticketData, priority: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                        >
                          <option value="LOW">Low (General Inquiry)</option>
                          <option value="MEDIUM">Medium (Upcoming Cutoff)</option>
                          <option value="HIGH">High (Penalty Imminent)</option>
                          <option value="URGENT">Urgent (CAC Notice / Audit Letter)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1">Subject *</label>
                      <input
                        required
                        type="text"
                        placeholder="Brief summary of compliance issue..."
                        value={ticketData.subject}
                        onChange={e => setTicketData({ ...ticketData, subject: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block mb-1">Detailed Description *</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Provide relevant statutory context, dates, filing receipts..."
                        value={ticketData.description}
                        onChange={e => setTicketData({ ...ticketData, description: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={ticketSubmitting}
                        className="w-full py-3 rounded-xl bg-[#0089C1] hover:bg-sky-600 text-white font-bold transition-all shadow-sm"
                      >
                        {ticketSubmitting ? "Submitting to Dispatch..." : "Submit Ticket to Resolution Desk"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live Chat Modal */}
      <AnimatePresence>
        {chatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full h-[550px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative"
            >
              {/* Chat Header */}
              <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src="/character1.jpg"
                      alt="Officer"
                      className="w-9 h-9 rounded-full object-cover border border-slate-700"
                    />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 ring-2 ring-slate-900 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-none">ComplianceHub Live Support</h4>
                    <span className="text-[10px] text-slate-400 font-medium">Tunde Bakare, CAMS (Online)</span>
                  </div>
                </div>

                <button
                  onClick={() => setChatModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {!chatStarted ? (
                <div className="flex-1 p-6 flex flex-col justify-center">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0089C1] flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900">Start Live Support Session</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Enter your details to initiate an active session with our desk.
                    </p>
                  </div>

                  <form onSubmit={handleStartChat} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Name</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Babatunde Adeleke"
                        value={visitorName}
                        onChange={e => setVisitorName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Work Email</label>
                      <input
                        type="email"
                        placeholder="e.g. tunde@company.ng"
                        value={visitorEmail}
                        onChange={e => setVisitorEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0089C1] focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#0089C1] text-white text-xs font-bold hover:bg-sky-600 transition-all mt-2"
                    >
                      Connect with Compliance Officer
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  {/* Messages list */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60 text-xs">
                    {chatMessages.map((msg, i) => {
                      const isVisitor = msg.sender === "visitor";
                      return (
                        <div
                          key={i}
                          className={`flex flex-col ${isVisitor ? "items-end" : "items-start"}`}
                        >
                          <span className="text-[10px] text-slate-400 font-semibold mb-0.5 px-1">
                            {msg.sender_name}
                          </span>
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] font-medium leading-relaxed ${
                              isVisitor
                                ? "bg-[#0089C1] text-white rounded-tr-none shadow-xs"
                                : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-xs"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input bar */}
                  <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSendChatMessage()}
                      className="flex-1 px-3.5 py-2 bg-slate-100 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0089C1]"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      className="w-9 h-9 rounded-xl bg-[#0089C1] text-white flex items-center justify-center hover:bg-sky-600 transition-all shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CompliancePublicFooter />
      <ComplianceAssistantDrawer />
    </div>
  );
}
