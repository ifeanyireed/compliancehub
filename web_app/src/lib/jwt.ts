/**
 * ComplianceHub.ng Universal Web-Crypto JWT Engine
 * Fully compatible with Next.js Edge Middleware, Node API Routes, Browser Client,
 * and the Go Backend (golang-jwt/jwt/v5) using standard HS256 HMAC-SHA256 signatures.
 */

export interface JWTPayload {
  user_id: string;
  email: string;
  full_name: string;
  system_role: "ADMIN" | "STAFF" | "USER";
  role?: "BUSINESS" | "EXPERT" | "AGENCY" | "STAFF" | "ADMIN";
  tenant_id?: string;
  title?: string;
  company?: string;
  avatar?: string;
  plan_tier?: string;
  iss?: string;
  iat?: number;
  exp?: number;
  jti?: string;
  [key: string]: any;
}

export const DEFAULT_JWT_SECRET = "compliancehub_jwt_secret_nigeria_regtech_2026";
export const TOKEN_COOKIE_NAME = "compliancehub_token";
export const DEFAULT_TTL_SECONDS = 72 * 3600; // 72 hours (3 days)

function getSecret(customSecret?: string): string {
  if (customSecret) return customSecret;
  if (typeof process !== "undefined" && process.env?.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  return DEFAULT_JWT_SECRET;
}

// Base64URL string helpers
export function base64UrlEncode(str: string): string {
  if (typeof btoa === "function") {
    const binString = Array.from(new TextEncoder().encode(str), (byte) =>
      String.fromCharCode(byte)
    ).join("");
    return btoa(binString)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  return Buffer.from(str, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  if (typeof atob === "function") {
    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

function base64UrlToUint8Array(str: string): Uint8Array<ArrayBuffer> {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getCryptoKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages
  );
}

/**
 * Sign a JWT token using HMAC-SHA256 (HS256)
 */
export async function signJWT(
  payload: JWTPayload,
  secret?: string,
  expiresInSeconds: number = DEFAULT_TTL_SECONDS
): Promise<string> {
  const activeSecret = getSecret(secret);
  const key = await getCryptoKey(activeSecret, ["sign"]);
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const fullPayload: JWTPayload = {
    iss: "compliancehub.ng",
    iat: now,
    exp: now + expiresInSeconds,
    jti: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `jwt_${now}_${Math.random().toString(36).substring(2, 9)}`,
    ...payload,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);

  const signature = await crypto.subtle.sign("HMAC", key, data);
  const encodedSignature = bufferToBase64Url(signature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Verify a JWT token signature, issuer, and expiration timestamp
 */
export async function verifyJWT(
  token: string,
  secret?: string
): Promise<JWTPayload | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    const activeSecret = getSecret(secret);
    const key = await getCryptoKey(activeSecret, ["verify"]);
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signatureBytes = base64UrlToUint8Array(signatureB64);

    const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, data);
    if (!isValid) {
      return null;
    }

    const payloadJson = base64UrlDecode(payloadB64);
    const payload: JWTPayload = JSON.parse(payloadJson);

    // Verify expiration
    if (payload.exp && typeof payload.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      if (now >= payload.exp) {
        return null; // Expired
      }
    }

    // Verify issuer if set
    if (payload.iss && payload.iss !== "compliancehub.ng") {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Quick synchronous decode without cryptographic signature validation
 * (Useful on client-side to inspect claims or check expiration)
 */
export function decodeJWT(token: string): JWTPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;

  try {
    const payloadJson = base64UrlDecode(parts[1]);
    return JSON.parse(payloadJson) as JWTPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Checks whether a token has expired or is invalid
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return now >= payload.exp;
}

/**
 * Demo user preset definition
 */
export const DEMO_JWT_USERS = {
  BUSINESS: {
    user_id: "33333333-3333-3333-3333-333333333301",
    email: "adaeze@paywave.ng",
    full_name: "Adaeze Nwosu",
    system_role: "USER" as const,
    role: "BUSINESS" as const,
    title: "Managing Director",
    company: "PayWave Technologies Ltd",
    avatar: "/character3.jpg",
    tenant_id: "55555555-5555-5555-5555-555555555501",
    plan_tier: "Professional",
  },
  EXPERT: {
    user_id: "33333333-3333-3333-3333-333333333302",
    email: "tunde@bakarecompliance.com",
    full_name: "Tunde Bakare, CAMS",
    system_role: "USER" as const,
    role: "EXPERT" as const,
    title: "Senior AML & Regulatory Officer",
    company: "Bakare Compliance Consultancy",
    avatar: "/character1.jpg",
    tenant_id: "55555555-5555-5555-5555-555555555503",
    plan_tier: "Practice Plus",
  },
  AGENCY: {
    user_id: "33333333-3333-3333-3333-333333333303",
    email: "chiamaka@apexcompliance.ng",
    full_name: "Chiamaka Eze",
    system_role: "USER" as const,
    role: "AGENCY" as const,
    title: "Principal Partner",
    company: "Apex Compliance Advisory Partners Ltd",
    avatar: "/character2.jpg",
    tenant_id: "55555555-5555-5555-5555-555555555502",
    plan_tier: "Agency Growth",
  },
  STAFF: {
    user_id: "33333333-3333-3333-3333-333333333304",
    email: "bsanwo@compliancehub.ng",
    full_name: "Babajide Sanwo",
    system_role: "STAFF" as const,
    role: "STAFF" as const,
    title: "Senior Compliance Support Specialist",
    company: "ComplianceHub Support Operations",
    avatar: "/character4.jpg",
    tenant_id: "55555555-5555-5555-5555-555555555501",
    plan_tier: "Staff Resolution Desk",
  },
  ADMIN: {
    user_id: "33333333-3333-3333-3333-333333333305",
    email: "admin@compliancehub.ng",
    full_name: "Dr. Olumide Adeleke",
    system_role: "ADMIN" as const,
    role: "ADMIN" as const,
    title: "Super Administrator & Compliance Director",
    company: "ComplianceHub Technologies Nigeria Ltd",
    avatar: "/character5.jpg",
    tenant_id: "55555555-5555-5555-5555-555555555501",
    plan_tier: "Super Administrator",
  },
};

/**
 * Creates a cryptographically signed JWT for demo persona sessions
 */
export async function createDemoJWT(
  role: "BUSINESS" | "EXPERT" | "AGENCY" | "STAFF" | "ADMIN",
  secret?: string
): Promise<string> {
  const profile = DEMO_JWT_USERS[role];
  return signJWT(
    {
      user_id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      system_role: profile.system_role,
      role: profile.role,
      tenant_id: profile.tenant_id,
      title: profile.title,
      company: profile.company,
      avatar: profile.avatar,
      plan_tier: profile.plan_tier,
    },
    secret
  );
}
