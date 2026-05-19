"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/club/dashboard", label: "Übersicht" },
  { href: "/club/applications", label: "Bewerbungen" },
  { href: "/player-search", label: "Spieler scouten" },
  { href: "/club/requirements", label: "Anforderungen" },
  { href: "/club/trial-trainings", label: "Probetrainings" },
  { href: "/club/profile", label: "Clubprofil" },
];

export default function ClubNav() {
  const pathname = usePathname();

  return (
    <div className="mb-8 flex h-[68px] gap-2 overflow-x-auto rounded-2xl bg-white p-3 shadow-sm">
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
                : "text-neutral-600 hover:bg-neutral-50"
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
