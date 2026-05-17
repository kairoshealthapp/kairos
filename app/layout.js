// Phase 3.2-fix5 — adapted from firekraker-monorepo/kairos/app/layout.js.
// Differences vs source:
//   • Title/description tuned for this repo build.
//   • AppChrome no longer wraps a Nav (the nav lives inside /rn now).
//
// Otherwise font setup (Fraunces + JetBrains_Mono via next/font/google,
// GeistSans via the geist npm package) and viewport theme color match source.

import "./globals.css";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import AppChrome from "@/components/AppChrome";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata = {
  title: "Kairos — Clinical Workstation",
  description: "Clinical decision intelligence for the care team. Demonstration data. No PHI.",
};

// Explicit graphite theme-color stops iOS Safari (and Android Chrome) from
// auto-tinting the mobile status bar amber based on the prominent
// kairos-cta-pulse button + amber-on-graphite favicon.
export const viewport = {
  themeColor: "#0B0E13",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrains.variable} ${GeistSans.variable}`}
    >
      <body className="min-h-screen bg-graphite text-bone antialiased">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
