import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/ahnara/ThemeProvider";
import { AuthProvider } from "@/components/ahnara/AuthContext";

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
  openGraph: {
    title: "ComplianceHub.ng — Everything Compliance. One Workspace.",
    description: "Nigeria's integrated compliance management, professional services marketplace, and compliance practice management ecosystem across CAC, FIRS, NDPC, and SCUML.",
    url: "https://compliancehub.ng",
    siteName: "ComplianceHub Nigeria",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ComplianceHub.ng — Everything Compliance. One Workspace.",
    description: "Nigeria's integrated compliance management, professional services marketplace, and compliance practice management ecosystem.",
    creator: "@compliancehubng",
    site: "@compliancehubng",
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
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
