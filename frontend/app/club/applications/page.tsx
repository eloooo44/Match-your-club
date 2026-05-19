"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ClubNav from "@/src/components/ClubNav";
import { apiFetch } from "@/services/api";

import { API_BASE } from "@/src/lib/apiBase";

type ClubProfile = {
  id: number;
  clubName: string;
};

type PlayerProfile = {
  id: number;
  name: string;
  position: string[] | string;
  location?: string | null;
  profileImagePath?: string | null;
  profileImageUrl?: string | null;
  overallScore?: number | null;
};

type Application = {
  id: number;
  playerId: number;
  clubId: number;
  message?: string | null;
  status: string;
  player: PlayerProfile;
};

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

const formatPositions = (positions: string[] | string) =>
  Array.isArray(positions) ? positions.join(", ") : positions;

export default function ClubApplicationsPage() {
  const router = useRouter();
  const [club, setClub] = useState<ClubProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const pendingCount = useMemo(
    () =>
      applications.filter((application) => application.status === "PENDING")
        .length,
    [applications],
  );

  const loadApplications = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Bitte melde dich als Club an.");
      }

      const clubProfile = (await apiFetch("/clubs/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })) as ClubProfile;

      setClub(clubProfile);

      const applicationData = (await apiFetch(
        `/applications/club/${clubProfile.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )) as Application[];

      setApplications(applicationData);
    } catch (loadError) {
      setError(
        (loadError as Error).message ||
          "Bewerbungen konnten nicht geladen werden.",
      );
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const updateStatus = async (applicationId: number, status: string) => {
    setUpdatingId(applicationId);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Bitte melde dich als Club an.");
      }

      const updatedApplication = (await apiFetch(
        `/applications/${applicationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      )) as Application;

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? { ...application, status: updatedApplication.status }
            : application,
        ),
      );

    } catch (updateError) {
      setError(
        (updateError as Error).message ||
          "Bewerbungsstatus konnte nicht geändert werden.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const goToTrials = (application: Application) => {
    router.push(
      `/club/trial-trainings?playerId=${application.playerId}&applicationId=${application.id}&playerName=${encodeURIComponent(
        application.player?.name ?? "",
      )}`,
    );
  };

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10 text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl">
        <ClubNav />
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-green-700">
              {club?.clubName || "Club"}
            </p>
            <h1 className="mt-2 text-5xl font-black text-[var(--primary)]">
              Bewerbungen
            </h1>
            <p className="mt-3 text-sm font-semibold text-[var(--muted)]">
              {loading
                ? "Bewerbungen werden geladen..."
                : `${applications.length} Bewerbungen · ${pendingCount} offen`}
            </p>
          </div>
          <Link
            href="/club/dashboard"
            className="rounded-2xl border border-green-200 px-5 py-3 text-sm font-black text-green-700 transition hover:bg-green-50"
          >
            Zur Übersicht
          </Link>
        </div>

        {error && (
          <p className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </p>
        )}

        {loading && (
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-sm font-bold text-neutral-500">
            Lädt...
          </div>
        )}

        {!loading && applications.length === 0 && (
          <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-10">
            <h2 className="text-2xl font-black text-neutral-950">
              Noch keine Bewerbungen
            </h2>
            <p className="mt-3 text-sm font-semibold text-neutral-500">
              Sobald sich Spieler bei deinem Club bewerben, erscheinen sie hier.
            </p>
          </div>
        )}

        <section className="grid gap-5">
          {applications.map((application) => {
            const player = application.player;
            const imageUrl = player.profileImagePath
              ? `${API_BASE}/${player.profileImagePath}`
              : player.profileImageUrl;

            return (
              <article
                key={application.id}
                className="rounded-3xl border border-green-100 bg-white p-6 text-neutral-950 shadow-[0_10px_30px_rgba(34,197,94,0.08)]"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-green-50 text-lg font-black text-green-700">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={player.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        player.name.slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/club/players/${player.id}?from=club-applications`}
                          className="break-words text-2xl font-black hover:text-green-700"
                        >
                          {player.name}
                        </Link>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${
                            statusClasses[application.status] ||
                            "border-neutral-200 bg-neutral-50 text-neutral-600"
                          }`}
                        >
                          {statusLabels[application.status] ||
                            application.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-neutral-500">
                        {[formatPositions(player.position), player.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {application.message && (
                        <p className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm font-semibold leading-6 text-neutral-700">
                          {application.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 lg:justify-end">
                    {application.status === "ACCEPTED" ? (
                      <button
                        type="button"
                        onClick={() => goToTrials(application)}
                        className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white transition hover:bg-green-500"
                      >
                        Zu den Probetrainings
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateStatus(application.id, "ACCEPTED")}
                        disabled={updatingId === application.id}
                        className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-neutral-300"
                      >
                        Annehmen
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => updateStatus(application.id, "REJECTED")}
                      disabled={
                        updatingId === application.id ||
                        application.status === "REJECTED"
                      }
                      className="rounded-2xl border border-red-200 px-5 py-3 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-300"
                    >
                      Ablehnen
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
