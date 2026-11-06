import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/ahnara/ThemeProvider";
import { AuthProvider } from "@/components/ahnara/AuthContext";
import { FloatingPersonaSwitcher } from "@/components/layout/FloatingPersonaSwitcher";

const dropa = localFont({
  src: "../fonts/Dropa-Regular.woff2",
  variable: "--font-dropa",
  display: "block",
});

export const metadata: Metadata = {
  title: "ComplianceHub.ng — Everything Compliance. One Workspace.",
  description: "Nigeria's integrated compliance management, professional services marketplace, and compliance practice management ecosystem.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dropa.variable} suppressHydrationWarning>
      <body 
        className={`${dropa.className} antialiased bg-[#E8EFF4] text-[#0D090C]`} 
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
            <FloatingPersonaSwitcher />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
