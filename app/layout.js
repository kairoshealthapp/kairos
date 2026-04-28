import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Kairos",
  description: "Clinical workflow platform with bidirectional Epic FHIR integration",
};

const themeInitScript = `(function(){try{var s=localStorage.getItem('kairos-theme');var d=s==='dark'||((s==null||s==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-canvas text-fg flex flex-col">
        <header className="sticky top-0 z-40 h-14 border-b border-line-faint bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
          <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-4 sm:px-8">
            <Link
              href="/dashboard"
              className="text-[15px] font-semibold tracking-[-0.01em] text-fg"
            >
              Kairos
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
