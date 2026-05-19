"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardLayout from "@/src/components/DashboardLayout";
import { mediaUrl } from "@/src/lib/media";

type PlayerProfile = {
  id: number;
};

type ClubProfile = {
  id: number;
  clubName: string;
  league?: string | null;
  location?: string | null;
  logoPath?: string | null;
};

type Application = {
  id: number;
  status: string;
  message?: string | null;
  club: ClubProfile;
};

import { API_BASE } from "@/src/lib/apiBase";

const statusLabels: Record<string, string> = {
  PENDING: "Offen",
  ACCEPTED: "Angenommen",
  REJECTED: "Abgelehnt",
};

const statusClasses: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  ACCEPTED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export default function PlayerApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/login");
          return;
        }

        const profileResponse = await fetch(`${API_BASE}/api/players/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!profileResponse.ok) {
          throw new Error("Spielerprofil konnte nicht geladen werden.");
        }

        const profile = (await profileResponse.json()) as PlayerProfile;

        const applicationsResponse = await fetch(
          `${API_BASE}/api/applications/player/${profile.id}`,
        );

        if (!applicationsResponse.ok) {
          throw new Error("Bewerbungen konnten nicht geladen werden.");
        }

        setApplications(
          (await applicationsResponse.json()) as Application[],
        );
      } catch (loadError) {
        setError((loadError as Error).message);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [router]);

  return (
    <DashboardLayout title="Meine Bewerbungen">
      {error && (
        <p className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      {loading && (
        <div className="rounded-3xl bg-white p-8 font-bold text-neutral-500">
          Lädt...
        </div>
      )}

      {!loading && applications.length === 0 && (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-10">
          <h2 className="text-2xl font-black text-neutral-950">
            Noch keine Bewerbungen
          </h2>
          <p className="mt-3 text-sm font-semibold text-neutral-500">
            Wenn du dich bei einem Club bewirbst, siehst du hier den Status.
          </p>
        </div>
      )}

      <section className="grid gap-5">
        {applications.map((application) => {
          const club = application.club;
          const logoUrl = mediaUrl(club.logoPath, API_BASE);

          return (
            <article
              key={application.id}
              className="rounded-3xl border border-green-100 bg-white p-6 text-neutral-950 shadow-[0_10px_30px_rgba(34,197,94,0.08)]"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-green-50 text-lg font-black text-green-700">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={club.clubName}
                        className="size-full object-cover"
                      />
                    ) : (
                      club.clubName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/player/clubs/${club.id}`}
                      className="break-words text-2xl font-black hover:text-green-700"
                    >
                      {club.clubName}
                    </Link>
                    <p className="mt-2 text-sm font-bold text-neutral-500">
                      {[club.league, club.location].filter(Boolean).join(" · ")}
                    </p>
                    {application.message && (
                      <p className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm font-semibold leading-6 text-neutral-700">
                        {application.message}
                      </p>
                    )}
                  </div>
                </div>

                <span
                  className={`w-fit rounded-full border px-4 py-2 text-sm font-black ${
                    statusClasses[application.status] ||
                    "border-neutral-200 bg-neutral-50 text-neutral-600"
                  }`}
                >
                  {statusLabels[application.status] || application.status}
                </span>
              </div>
            </article>
          );
        })}
      </section>
    </DashboardLayout>
  );
}
