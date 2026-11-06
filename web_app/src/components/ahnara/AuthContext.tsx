"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { setAuthToken, clearAuthToken, getAuthToken } from "@/lib/api";

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
}

export const DEMO_USERS: Record<string, User> = {
  BUSINESS: {
    id: "usr-biz-01",
    name: "Adaeze Nwosu",
    email: "adaeze@paywave.ng",
    role: "BUSINESS",
    title: "Managing Director",
    company: "PayWave Technologies Ltd",
    rcNumber: "RC-1894231",
    avatar: "/character3.jpg",
    plan_tier: "Professional"
  },
  EXPERT: {
    id: "usr-exp-01",
    name: "Tunde Bakare, CAMS",
    email: "tunde@bakarecompliance.com",
    role: "EXPERT",
    title: "Senior AML & Regulatory Officer",
    company: "Bakare Compliance Consultancy",
    avatar: "/character1.jpg",
    plan_tier: "Practice Plus"
  },
  AGENCY: {
    id: "usr-agn-01",
    name: "Chiamaka Eze",
    email: "chiamaka@apexcompliance.ng",
    role: "AGENCY",
    title: "Principal Partner",
    company: "Apex Compliance Advisory Partners Ltd",
    avatar: "/character2.jpg",
    plan_tier: "Agency Growth"
  },
  STAFF: {
    id: "usr-staff-01",
    name: "Babajide Sanwo",
    email: "bsanwo@compliancehub.ng",
    role: "STAFF",
    title: "Senior Compliance Support Specialist",
    company: "ComplianceHub Support Operations",
    avatar: "/character4.jpg",
    plan_tier: "Staff Resolution Desk"
  },
  ADMIN: {
    id: "usr-admin-01",
    name: "Dr. Olumide Adeleke",
    email: "admin@compliancehub.ng",
    role: "ADMIN",
    title: "Super Administrator & Compliance Director",
    company: "ComplianceHub Technologies Nigeria Ltd",
    avatar: "/character5.jpg",
    plan_tier: "Super Administrator"
  }
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  switchRole: (role: "BUSINESS" | "EXPERT" | "AGENCY" | "STAFF" | "ADMIN") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = () => {
      if (typeof window !== "undefined") {
        const storedRole = localStorage.getItem("compliancehub_role") as "BUSINESS" | "EXPERT" | "AGENCY" | "STAFF" | "ADMIN" | null;
        if (storedRole && DEMO_USERS[storedRole]) {
          setUser(DEMO_USERS[storedRole]);
        } else {
          // Default to BUSINESS user demo for instant interactive review
          setUser(DEMO_USERS.BUSINESS);
          localStorage.setItem("compliancehub_role", "BUSINESS");
          setAuthToken("demo-token-business");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    setAuthToken(token);
    setUser(userData);
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
    }
  };

  const logout = () => {
    clearAuthToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("compliancehub_role");
    }
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole }}>
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
