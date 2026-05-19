"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/player/dashboard", label: "Übersicht" },
  { href: "/matches", label: "Matches" },
  { href: "/player/clubs", label: "Vereine" },
  { href: "/player/applications", label: "Bewerbungen" },
  { href: "/my-trials", label: "Probetrainings" },
];

export default function PlayerNav() {
  const pathname = usePathname();

  return (
    <div className="mb-8 flex h-[68px] gap-2 overflow-x-auto rounded-2xl bg-[var(--card)] p-3 shadow-sm">
      <div className="flex min-w-max gap-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-green-100 text-green-700"
                : "text-[var(--foreground)] hover:bg-green-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      </div>
    </div>
  );
}
