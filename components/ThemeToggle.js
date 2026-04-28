"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

const STORAGE_KEY = "kairos-theme";

function applyResolvedTheme(pref) {
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = pref === "system" ? (prefersDark ? "dark" : "light") : pref;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export default function ThemeToggle() {
  const [pref, setPref] = useState("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initial =
      stored === "dark" || stored === "light" || stored === "system" ? stored : "system";
    setPref(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (pref === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
    applyResolvedTheme(pref);
  }, [pref, mounted]);

  useEffect(() => {
    if (!mounted || pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyResolvedTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref, mounted]);

  function cycle() {
    setPref((p) => (p === "light" ? "dark" : p === "dark" ? "system" : "light"));
  }

  const label =
    pref === "light"
      ? "Light theme — click for dark"
      : pref === "dark"
      ? "Dark theme — click for system"
      : "System theme — click for light";

  const Icon = !mounted ? Monitor : pref === "light" ? Sun : pref === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-button text-fg-muted transition-colors duration-100 hover:bg-muted hover:text-fg"
      suppressHydrationWarning
    >
      <Icon size={16} strokeWidth={1.75} />
    </button>
  );
}
