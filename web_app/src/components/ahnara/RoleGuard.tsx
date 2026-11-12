"use client";

import { useAuth } from "@/components/ahnara/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { AhnaraLoader } from "@/components/ahnara/AhnaraLoader";

export function RoleGuard({ 
  children, 
  allowedRoles,
  fallbackRoute = "/login"
}: { 
  children: React.ReactNode; 
  allowedRoles: string[];
  fallbackRoute?: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        const redirectParam = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
        router.push(`${fallbackRoute}${redirectParam}`);
      } else {
        const userRoleUpper = (user.role || "").toUpperCase();
        const allowedRolesUpper = allowedRoles.map(r => r.toUpperCase());
        
        if (!allowedRolesUpper.includes(userRoleUpper)) {
          // Route mismatched roles to their designated home cockpit
          if (userRoleUpper === "BUSINESS") {
            router.push("/business/dashboard/");
          } else if (userRoleUpper === "EXPERT" || userRoleUpper === "AGENCY") {
            router.push("/practice/dashboard/");
          } else if (userRoleUpper === "STAFF") {
            router.push("/staff/dashboard/");
          } else if (userRoleUpper === "ADMIN") {
            router.push("/admin/dashboard/");
          } else {
            router.push(fallbackRoute);
          }
        }
      }
    }
  }, [user, loading, allowedRoles, router, fallbackRoute, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8EFF4] flex items-center justify-center">
        <AhnaraLoader fullScreen size="lg" label="Verifying Permissions..." />
      </div>
    );
  }

  const userRoleUpper = (user?.role || "").toUpperCase();
  const allowedRolesUpper = allowedRoles.map(r => r.toUpperCase());

  if (!user || !allowedRolesUpper.includes(userRoleUpper)) {
    return (
      <div className="min-h-screen bg-[#E8EFF4] flex items-center justify-center">
        <AhnaraLoader fullScreen size="lg" label="Directing to Your Workspace..." />
      </div>
    );
  }

  return <>{children}</>;
}
