"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/src/lib/apiBase";
import { mediaUrl } from "@/src/lib/media";

type Club = {
  id: number;
  clubName: string;
  verband: string;
  wettbewerb: string;
  league: string;
  location: string;
  description?: string;
  logoPath?: string;
};

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/clubs`)
      .then((res) => res.json())
      .then((data) => setClubs(data));
  }, []);

  return (
    <main className="min-h-screen bg-[#f6faf7] px-8 py-10 text-black dark:bg-[#f6faf7] dark:text-black">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-10 text-5xl font-bold">Explore Clubs</h1>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {clubs.map((club) => (
            <Link
              href={`/club/${club.id}`}
              key={club.id}
              className="rounded-3xl border border-green-100 bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl dark:border-green-100 dark:bg-white"
            >
              <div className="mb-5 flex items-center gap-4">
                {club.logoPath && (
                  <img
                    src={mediaUrl(club.logoPath) || ""}
                    alt={club.clubName}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                )}

                <div>
                  <h2 className="text-2xl font-bold">{club.clubName}</h2>

                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {[club.wettbewerb, club.league]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>

              <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
                📍 {club.location}
              </p>

              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                {club.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
