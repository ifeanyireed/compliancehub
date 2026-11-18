"use client";

import React, { useState } from "react";
import { AhnaraButton } from "@/components/ahnara/AhnaraButton";
import { Lock, Loader2 } from "lucide-react";

interface PaystackButtonProps {
  config: {
    publicKey: string;
    email: string;
    amount: number;
    currency?: string;
    reference: string;
    metadata?: any;
    [key: string]: any;
  };
  onSuccess: (reference: any) => void;
  onClose: () => void;
  text: string;
  className?: string;
  disabled?: boolean;
}

function loadPaystackScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).PaystackPop) {
      resolve(true);
      return;
    }
    const existing = document.getElementById("paystack-inline-script");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.id = "paystack-inline-script";
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaystackButton({
  config,
  onSuccess,
  onClose,
  text,
  className,
  disabled,
}: PaystackButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    if (disabled || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const loaded = await loadPaystackScript();
      if (!loaded || typeof window === "undefined" || !(window as any).PaystackPop) {
        setIsSubmitting(false);
        alert("Payment gateway failed to initialize. Please check your internet connection.");
        return;
      }

      const handler = (window as any).PaystackPop.setup({
        key: config.publicKey,
        email: config.email,
        amount: config.amount,
        currency: config.currency || "NGN",
        ref: config.reference,
        metadata: config.metadata,
        callback: (response: any) => {
          setIsSubmitting(false);
          onSuccess(response);
        },
        onClose: () => {
          setIsSubmitting(false);
          onClose();
        },
      });

      handler.openIframe();
    } catch (err) {
      console.error("Paystack popup error:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <AhnaraButton
      size="lg"
      className={className}
      leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Lock className="w-4 h-4" />}
      disabled={disabled || isSubmitting}
      isLoading={isSubmitting}
      onClick={handleClick}
    >
      {isSubmitting ? "Connecting Paystack..." : text}
    </AhnaraButton>
  );
}
