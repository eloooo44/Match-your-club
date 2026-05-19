"use client";

import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="
        rounded-xl
        border
        border-green-100
        bg-[var(--card)]
        px-4
        py-2
        text-sm
        shadow-sm
        transition
        hover:scale-105
      "
    >
      {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
