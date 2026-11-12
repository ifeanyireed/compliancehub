"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/ahnara/AuthContext";
import { AhnaraLoader } from "@/components/ahnara/AhnaraLoader";

/**
 * Universal User-Type-Aware Dashboard Router
 * Intelligently redirects the authenticated user to their role-specific cockpit:
 * - BUSINESS -> /business/dashboard/
 * - EXPERT / AGENCY -> /practice/dashboard/
 * - STAFF -> /staff/dashboard/
 * - ADMIN -> /admin/dashboard/
 * - Unauthenticated -> /login?redirect=/dashboard/
 */
export default function UniversalDashboardRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/");
        return;
      }

      const role = (user.role || "").toUpperCase();
      switch (role) {
        case "ADMIN":
          router.push("/admin/dashboard/");
          break;
        case "STAFF":
          router.push("/staff/dashboard/");
          break;
        case "EXPERT":
        case "AGENCY":
          router.push("/practice/dashboard/");
          break;
        case "BUSINESS":
        default:
          router.push("/business/dashboard/");
          break;
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#E8EFF4] flex items-center justify-center">
      <AhnaraLoader fullScreen size="lg" label="Directing to your workspace dashboard..." />
    </div>
  );
}
