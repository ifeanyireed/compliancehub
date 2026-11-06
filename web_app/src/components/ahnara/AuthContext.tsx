"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { setAuthToken, clearAuthToken, setActiveTenantID, getActiveTenantID } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "BUSINESS" | "EXPERT" | "AGENCY" | "STAFF" | "ADMIN";
  title?: string;
  company?: string;
  rcNumber?: string;
  avatar?: string;
  plan_tier?: string;
  tenant_id?: string;
}

export const DEMO_USERS: Record<string, User> = {
  BUSINESS: {
    id: "33333333-3333-3333-3333-333333333301",
    name: "Adaeze Nwosu",
    email: "adaeze@paywave.ng",
    role: "BUSINESS",
    title: "Managing Director",
    company: "PayWave Technologies Ltd",
    rcNumber: "RC-1894231",
    avatar: "/character3.jpg",
    plan_tier: "Professional",
    tenant_id: "55555555-5555-5555-5555-555555555501",
  },
  EXPERT: {
    id: "33333333-3333-3333-3333-333333333302",
    name: "Tunde Bakare, CAMS",
    email: "tunde@bakarecompliance.com",
    role: "EXPERT",
    title: "Senior AML & Regulatory Officer",
    company: "Bakare Compliance Consultancy",
    avatar: "/character1.jpg",
    plan_tier: "Practice Plus",
    tenant_id: "55555555-5555-5555-5555-555555555503",
  },
  AGENCY: {
    id: "33333333-3333-3333-3333-333333333303",
    name: "Chiamaka Eze",
    email: "chiamaka@apexcompliance.ng",
    role: "AGENCY",
    title: "Principal Partner",
    company: "Apex Compliance Advisory Partners Ltd",
    avatar: "/character2.jpg",
    plan_tier: "Agency Growth",
    tenant_id: "55555555-5555-5555-5555-555555555502",
  },
  STAFF: {
    id: "33333333-3333-3333-3333-333333333304",
    name: "Babajide Sanwo",
    email: "bsanwo@compliancehub.ng",
    role: "STAFF",
    title: "Senior Compliance Support Specialist",
    company: "ComplianceHub Support Operations",
    avatar: "/character4.jpg",
    plan_tier: "Staff Resolution Desk",
    tenant_id: "55555555-5555-5555-5555-555555555501",
  },
  ADMIN: {
    id: "33333333-3333-3333-3333-333333333305",
    name: "Dr. Olumide Adeleke",
    email: "admin@compliancehub.ng",
    role: "ADMIN",
    title: "Super Administrator & Compliance Director",
    company: "ComplianceHub Technologies Nigeria Ltd",
    avatar: "/character5.jpg",
    plan_tier: "Super Administrator",
    tenant_id: "55555555-5555-5555-5555-555555555501",
  },
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeTenantId: string;
  login: (token: string, user: User) => void;
  logout: () => void;
  switchRole: (role: "BUSINESS" | "EXPERT" | "AGENCY" | "STAFF" | "ADMIN") => void;
  switchTenant: (tenantId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTenantId, setActiveTenantIdState] = useState<string>("55555555-5555-5555-5555-555555555501");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = () => {
      if (typeof window !== "undefined") {
        const storedRole = localStorage.getItem("compliancehub_role") as "BUSINESS" | "EXPERT" | "AGENCY" | "STAFF" | "ADMIN" | null;
        const storedTenant = getActiveTenantID();
        if (storedTenant) {
          setActiveTenantIdState(storedTenant);
        }

        if (storedRole && DEMO_USERS[storedRole]) {
          setUser(DEMO_USERS[storedRole]);
        } else {
          setUser(DEMO_USERS.BUSINESS);
          localStorage.setItem("compliancehub_role", "BUSINESS");
          setAuthToken("demo-token-business");
          setActiveTenantID("55555555-5555-5555-5555-555555555501");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    setAuthToken(token);
    setUser(userData);
    if (userData.tenant_id) {
      setActiveTenantID(userData.tenant_id);
      setActiveTenantIdState(userData.tenant_id);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("compliancehub_role", userData.role);
    }
  };

  const switchRole = (role: "BUSINESS" | "EXPERT" | "AGENCY" | "STAFF" | "ADMIN") => {
    const newUser = DEMO_USERS[role];
    setUser(newUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("compliancehub_role", role);
      setAuthToken(`demo-token-${role.toLowerCase()}`);
      if (newUser.tenant_id) {
        setActiveTenantID(newUser.tenant_id);
        setActiveTenantIdState(newUser.tenant_id);
      }
    }
  };

  const switchTenant = (tenantId: string) => {
    setActiveTenantID(tenantId);
    setActiveTenantIdState(tenantId);
  };

  const logout = () => {
    clearAuthToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("compliancehub_role");
      localStorage.removeItem("compliancehub_tenant_id");
    }
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, activeTenantId, login, logout, switchRole, switchTenant }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
