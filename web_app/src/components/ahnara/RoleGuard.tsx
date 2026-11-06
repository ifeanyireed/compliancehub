"use client";

import { useAuth } from "@/components/ahnara/AuthContext";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(fallbackRoute);
      } else {
        const userRoleUpper = (user.role || "").toUpperCase();
        const allowedRolesUpper = allowedRoles.map(r => r.toUpperCase());
        
        if (!allowedRolesUpper.includes(userRoleUpper)) {
          if (userRoleUpper === "BUSINESS") {
            router.push("/business/dashboard");
          } else if (userRoleUpper === "EXPERT" || userRoleUpper === "AGENCY") {
            router.push("/practice/dashboard");
          } else {
            router.push("/login");
          }
        }
      }
    }
  }, [user, loading, allowedRoles, router, fallbackRoute]);

  if (loading) return <AhnaraLoader fullScreen size="lg" />;

  const userRoleUpper = (user?.role || "").toUpperCase();
  const allowedRolesUpper = allowedRoles.map(r => r.toUpperCase());

  if (!user || !allowedRolesUpper.includes(userRoleUpper)) {
    return null;
  }

  return <>{children}</>;
}
