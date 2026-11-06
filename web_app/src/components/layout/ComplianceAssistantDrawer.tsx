"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles, Bot, ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export function ComplianceAssistantDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your Nigerian Regulatory Intelligence Assistant. Ask me anything about the **Nigeria Tax Act 2025/2026**, **NDPA 2023 statutory audit deadlines**, **CAC CAMA 2020 annual returns**, or **SCUML compliance**."
    }
  ]);

  const quickQuestions = [
    "What are my CAC annual return deadlines?",
    "Does my business need a SCUML certificate?",
    "What changed in the 2026 Nigeria Tax Act?",
    "When is the NDPC audit filing cutoff?"
  ];

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: query }]);
    if (!textToSend) setInput("");
    setLoading(true);

    setTimeout(() => {
      let reply = "Under Nigerian regulatory provisions, companies must maintain evidence of compliance. For specific statutory counsel, engage an accredited compliance specialist via HubExperts.";
      const lower = query.toLowerCase();

      if (lower.includes("cac") || lower.includes("annual return")) {
        reply = "Under **CAMA 2020 section 377**, every registered Nigerian company must file Annual Returns with the CAC no later than **42 days after the Annual General Meeting** (or by June 30 for preceding financial year). Late filing triggers daily statutory penalties of ₦1,000 and risks 'Inactive' status classification.";
      } else if (lower.includes("tax") || lower.includes("2026") || lower.includes("firs")) {
        reply = "Under the **Nigeria Tax Act 2025/2026 framework** effective January 1, 2026, corporate tax filing procedures have migrated to consolidated digital returns on TaxPro-MAX. CIT returns are statutory within 6 months of financial year end, with monthly VAT due on the 21st.";
      } else if (lower.includes("scuml") || lower.includes("aml") || lower.includes("money laundering")) {
        reply = "Under the **Money Laundering (Prevention and Prohibition) Act 2022**, all Designated Non-Financial Businesses & Professions (DNFBPs)—such as real estate, law firms, accounting practices, jewelers, and automotive dealers—must obtain a valid SCUML certificate and submit annual AML/CFT returns.";
      } else if (lower.includes("ndpc") || lower.includes("ndpa") || lower.includes("privacy")) {
        reply = "The **Nigeria Data Protection Act 2023 (NDPA)** mandates Data Controllers and Processors of Major Importance to conduct an annual Data Protection Audit through a licensed DPCO and submit the statutory audit summary report to the NDPC by **March 15** annually.";
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setLoading(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#1E293B] hover:bg-slate-800 text-white shadow-xl border border-slate-700/50 transition-all font-bold text-sm"
        >
          <div className="w-6 h-6 rounded-full bg-[#0089C1] flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span>Regulatory AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </motion.button>
      </div>

      {/* Slide-over Drawer / Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[540px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0089C1] flex items-center justify-center text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-display">Regulatory Assistant</h3>
                  <p className="text-[10px] text-slate-300 font-medium">Trained on Nigerian Legal Frameworks</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-[#0089C1] text-white rounded-tr-xs"
                        : "bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-xs"
                    }`}
                  >
                    <p dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-500 shadow-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0089C1] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#0089C1] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-[#0089C1] animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              {/* Quick suggestion pills if only 1 message */}
              {messages.length === 1 && (
                <div className="pt-2 space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Suggested Inquiries:</p>
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="w-full text-left text-xs p-2 rounded-xl bg-white border border-slate-200/70 hover:border-[#0089C1] text-slate-700 hover:text-[#0089C1] transition-all flex items-center justify-between shadow-xs group"
                    >
                      <span>{q}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask about CAC, FIRS, NDPC..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0089C1]/30"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-[#0089C1] hover:bg-sky-600 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
