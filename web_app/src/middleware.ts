import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT, TOKEN_COOKIE_NAME } from "@/lib/jwt";

// Protected route matcher configuration
export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/business/:path*",
    "/practice/:path*",
    "/staff/:path*",
    "/admin/:path*",
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Extract JWT token from cookie or Authorization header
  let token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  // Handle unauthenticated visitors attempting to access dashboards
  if (!token) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  // Validate the JWT signature, issuer, and expiration timestamp
  const claims = await verifyJWT(token);
  if (!claims) {
    // Token is invalid, tampered with, or expired
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
    const response = NextResponse.redirect(redirectUrl);
    // Clear stale or invalid token cookie
    response.cookies.delete(TOKEN_COOKIE_NAME);
    return response;
  }

  // Role-Based Access Control (RBAC) pre-auth gating
  const userRole = (claims.role || claims.system_role || "").toUpperCase();

  // 1. Super Admin Cockpit (/admin/*) -> ADMIN only
  if (pathname.startsWith("/admin")) {
    if (userRole !== "ADMIN") {
      const fallbackUrl = getRoleDefaultUrl(userRole, request.url);
      return NextResponse.redirect(fallbackUrl);
    }
  }

  // 2. Staff Resolution Operations (/staff/*) -> STAFF or ADMIN
  if (pathname.startsWith("/staff")) {
    if (userRole !== "STAFF" && userRole !== "ADMIN") {
      const fallbackUrl = getRoleDefaultUrl(userRole, request.url);
      return NextResponse.redirect(fallbackUrl);
    }
  }

  // 3. Practice & Agency Cockpit (/practice/*) -> EXPERT, AGENCY, or ADMIN
  if (pathname.startsWith("/practice")) {
    if (!["EXPERT", "AGENCY", "ADMIN"].includes(userRole)) {
      const fallbackUrl = getRoleDefaultUrl(userRole, request.url);
      return NextResponse.redirect(fallbackUrl);
    }
  }

  // 4. HubBusiness SME Workspace (/business/*) -> BUSINESS or ADMIN
  if (pathname.startsWith("/business")) {
    if (!["BUSINESS", "ADMIN"].includes(userRole)) {
      const fallbackUrl = getRoleDefaultUrl(userRole, request.url);
      return NextResponse.redirect(fallbackUrl);
    }
  }

  // Forward request with verified claims injected into request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", claims.user_id || "");
  requestHeaders.set("x-user-email", claims.email || "");
  requestHeaders.set("x-user-role", userRole);
  if (claims.tenant_id) {
    requestHeaders.set("x-tenant-id", claims.tenant_id);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

function getRoleDefaultUrl(role: string, baseUrl: string): URL {
  switch (role) {
    case "ADMIN":
      return new URL("/admin/dashboard/", baseUrl);
    case "STAFF":
      return new URL("/staff/dashboard/", baseUrl);
    case "EXPERT":
    case "AGENCY":
      return new URL("/practice/dashboard/", baseUrl);
    case "BUSINESS":
    default:
      return new URL("/business/dashboard/", baseUrl);
  }
}
