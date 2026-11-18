"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Building2 
} from "lucide-react";
import { useAuth } from "@/components/ahnara/AuthContext";
import { api } from "@/lib/api";
import { BUSINESS_PLANS, BusinessPlanTier, getTierLimits } from "@/lib/SubscriptionHelper";
import PaystackButton from "@/components/ahnara/PaystackButton";

interface UpgradeQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotaType: "DOCUMENT" | "SEAT" | "TRIAL_EXPIRED" | "FEATURE";
  currentUsage?: number;
  limit?: number;
  currentPlan?: string;
  moduleName?: string;
  onUpgradeSuccess?: () => void;
}

export default function UpgradeQuotaModal({
  isOpen,
  onClose,
  quotaType,
  currentUsage = 0,
  limit = 0,
  currentPlan = "Starter",
  moduleName = "",
  onUpgradeSuccess,
}: UpgradeQuotaModalProps) {
  const { user, activeTenantId } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");
  const [selectedPlanCode, setSelectedPlanCode] = useState<BusinessPlanTier>("BUSINESS");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  if (!isOpen) return null;

  const targetPlan = BUSINESS_PLANS[selectedPlanCode] || BUSINESS_PLANS.BUSINESS;
  const priceNgn = billingCycle === "annually" ? targetPlan.annualPriceNgn : targetPlan.monthlyPriceNgn;
  const paystackKey =
    process.env.NEXT_PUBLIC_PAYSTACK_KEY ||
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
    "pk_live_29e6ae6c232946453f9b3689ff70cd27dcac16bf";

  const paystackConfig = {
    reference: `sub_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    email: user?.email || "billing@compliancehub.ng",
    amount: priceNgn * 100, // Paystack requires amount in Kobo
    publicKey: paystackKey,
    metadata: {
      tenant_id: activeTenantId,
      plan_tier: targetPlan.name,
      billing_cycle: billingCycle,
      user_id: user?.id,
    },
  };

  const handlePaystackSuccess = async (reference: any) => {
    setIsUpgrading(true);
    try {
      await api.subscriptions.verifyPayment({
        reference: reference.reference || reference.trans || `ref_${Date.now()}`,
        plan_tier: targetPlan.name,
        billing_cycle: billingCycle,
      });
      setSuccessBanner(true);
      setTimeout(() => {
        setSuccessBanner(false);
        if (onUpgradeSuccess) onUpgradeSuccess();
        onClose();
      }, 1800);
    } catch (err) {
      console.error("Failed to verify upgrade:", err);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Success Banner */}
          {successBanner ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 text-display">
                Subscription Successfully Upgraded!
              </h3>
              <p className="text-xs text-slate-600">
                Your workspace has been upgraded to the <strong>{targetPlan.name}</strong> plan. Quota limits have been expanded immediately.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Header Badge & Title */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                      Plan Quota Exceeded • Hard-Block Enforced
                    </span>
                    <h3 className="text-xl font-black text-slate-900 text-display">
                      {quotaType === "DOCUMENT" && "Evidence Vault Limit Reached"}
                      {quotaType === "SEAT" && "Workspace Seat Limit Reached"}
                      {quotaType === "TRIAL_EXPIRED" && "14-Day Free Trial Concluded"}
                      {quotaType === "FEATURE" && `${moduleName || "Specialist"} Module Restricted`}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {quotaType === "DOCUMENT" && (
                    <>You have stored <strong>{currentUsage} of {limit} documents</strong> permitted on your <strong>{currentPlan}</strong> plan. Upgrade your plan to archive additional statutory filings, tax clearances, and audit evidence.</>
                  )}
                  {quotaType === "SEAT" && (
                    <>You have reached the maximum of <strong>{limit} team members</strong> on your <strong>{currentPlan}</strong> plan. Upgrade to invite additional compliance officers, internal auditors, or directors.</>
                  )}
                  {quotaType === "TRIAL_EXPIRED" && (
                    <>Your 14-day Professional free trial has concluded. Activate a paid plan to keep your evidence vault active and prevent service interruption.</>
                  )}
                  {quotaType === "FEATURE" && (
                    <>The <strong>{moduleName}</strong> module requires an upgraded subscription tier (Business or Professional). Unlock this specialist workflow with instant activation.</>
                  )}
                </p>
              </div>

              {/* Tier Selection Pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700">Select Upgraded Plan Tier</label>
                  
                  {/* Billing cycle toggle */}
                  <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-full text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setBillingCycle("monthly")}
                      className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                        billingCycle === "monthly" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle("annually")}
                      className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                        billingCycle === "annually" ? "bg-[#0089C1] text-white shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Annual (-20%)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {(["BUSINESS", "PROFESSIONAL"] as BusinessPlanTier[]).map((code) => {
                    const plan = BUSINESS_PLANS[code];
                    const price = billingCycle === "annually" ? plan.annualPriceNgn : plan.monthlyPriceNgn;
                    const isSelected = selectedPlanCode === code;
                    return (
                      <div
                        key={code}
                        onClick={() => setSelectedPlanCode(code)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-sky-50/70 border-[#0089C1] shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-xs text-slate-900">{plan.name}</span>
                          {plan.isPopular && (
                            <span className="text-[9px] bg-sky-100 text-[#0089C1] font-bold px-1.5 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="text-base font-black text-slate-900 font-mono">
                          ₦{price.toLocaleString()}
                          <span className="text-[10px] text-slate-500 font-normal">
                            {billingCycle === "annually" ? "/yr" : "/mo"}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          {plan.documentLimit >= 10000 ? "Unlimited" : plan.documentLimit} docs • {plan.seatLimit} seats
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* What You Unlock In Target Plan */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Included in {targetPlan.name} Plan:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {targetPlan.features.slice(0, 4).map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[11px]">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Paystack Checkout Button */}
              <div className="space-y-2">
                <PaystackButton
                  config={paystackConfig}
                  onSuccess={handlePaystackSuccess}
                  onClose={() => {}}
                  text={`Pay ₦${priceNgn.toLocaleString()} via Paystack & Upgrade`}
                  className="w-full bg-[#0089C1] hover:bg-sky-600 text-white font-bold py-3.5 rounded-2xl text-xs shadow-md cursor-pointer justify-center"
                  disabled={isUpgrading}
                />
                <p className="text-[10px] text-center text-slate-400">
                  Instant activation • Billed in Nigerian Naira (₦) via Paystack • Cancel anytime
                </p>
              </div>

            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
