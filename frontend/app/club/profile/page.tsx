"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ClubNav from "@/src/components/ClubNav";
import { mediaUrl } from "@/src/lib/media";

type Club = {
  id: number;
  clubName?: string;
  name?: string;
  logoUrl?: string | null;
  logoPath?: string | null;
  verband?: string | null;
  league?: string | null;
  wettbewerb?: string | null;
  liga?: string | null;
  location?: string | null;
  phone?: string | null;
  sportsGroundName?: string | null;
  sportsGroundAddress?: string | null;
  sportsGroundZipCode?: string | null;
  sportsGroundCity?: string | null;
  oefbClubProfileUrl?: string | null;
  leagueTableData?: {
    headers?: string[];
    rows?: string[][];
    sourceUrl?: string;
    tableUrl?: string;
    crawledAt?: string;
  } | null;
  email?: string | null;
  description?: string | null;
  user?: {
    email?: string | null;
  };
  requirements?: ClubRequirement[];
};

type ClubListResponse =
  | Club[]
  | {
      clubs?: Club[];
      data?: Club[];
      items?: Club[];
      message?: string;
    };

type ClubRequirement = {
  id: number;
  position: string;
  minTempo: number;
  minShooting: number;
  minPassing: number;
  minDribbling: number;
  minDefending: number;
  minPhysical: number;
  tempoWeight: number;
  shootingWeight: number;
  passingWeight: number;
  dribblingWeight: number;
  defendingWeight: number;
  physicalWeight: number;
};

type ClubRating = {
  id: number;
  score: number;
  comment?: string | null;
  createdAt: string;
  player: {
    id: number;
    name: string;
    position: string[] | string;
    profileImagePath?: string | null;
    profileImageUrl?: string | null;
  };
  trialTraining?: {
    id: number;
    scheduledAt: string;
    feedback?: string | null;
  } | null;
};

import { API_BASE as apiBaseUrl } from "@/src/lib/apiBase";

const formatPositions = (positions: string[] | string) =>
  Array.isArray(positions) ? positions.join(", ") : positions;

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={`rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm ${className}`}
  >
    {children}
  </section>
);

export default function ClubProfilePage() {
  const router = useRouter();
  const [club, setClub] = useState<Club | null>(null);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "ratings">("profile");
  const [ratings, setRatings] = useState<ClubRating[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingsError, setRatingsError] = useState("");
  const [form, setForm] = useState({
    email: "",
    phone: "",
    sportsGroundName: "",
    sportsGroundAddress: "",
    sportsGroundZipCode: "",
    sportsGroundCity: "",
  });

  useEffect(() => {
    const loadClubProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/login");
          return;
        }

        const meResponse = await fetch(`${apiBaseUrl}/api/clubs/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const meData = (await meResponse.json().catch(() => null)) as {
          id?: number;
          message?: string;
        } | null;

        if (!meResponse.ok || !meData?.id) {
          throw new Error("Club-Daten konnten nicht geladen werden.");
        }

        const listResponse = await fetch(`${apiBaseUrl}/api/clubs`);
        const clubResponse = (await listResponse.json()) as ClubListResponse;

        if (!listResponse.ok) {
          throw new Error(
            Array.isArray(clubResponse)
              ? "Club konnte nicht geladen werden."
              : clubResponse.message || "Club konnte nicht geladen werden.",
          );
        }

        const clubs = Array.isArray(clubResponse)
          ? clubResponse
          : clubResponse.clubs || clubResponse.data || clubResponse.items || [];

        const foundClub = clubs.find((clubItem) => clubItem.id === meData.id);
        if (foundClub) {
          const hydratedClub = {
            ...foundClub,
            name: foundClub.name ?? foundClub.clubName,
            liga: foundClub.liga ?? foundClub.league,
            email: foundClub.user?.email ?? null,
          };

          setClub(hydratedClub);
          setForm({
            email: hydratedClub.email || "",
            phone: hydratedClub.phone || "",
            sportsGroundName: hydratedClub.sportsGroundName || "",
            sportsGroundAddress: hydratedClub.sportsGroundAddress || "",
            sportsGroundZipCode: hydratedClub.sportsGroundZipCode || "",
            sportsGroundCity: hydratedClub.sportsGroundCity || "",
          });
          return;
        }

        throw new Error("Club konnte nicht geladen werden.");
      } catch (err) {
        setLoadError((err as Error).message);
        setClub(null);
      }
    };

    loadClubProfile();
  }, [router]);

  useEffect(() => {
    if (!club?.id) {
      return;
    }

    const loadRatings = async () => {
      setRatingsLoading(true);
      setRatingsError("");

      try {
        const response = await fetch(`${apiBaseUrl}/api/clubs/${club.id}/ratings`);
        const data = (await response.json().catch(() => null)) as
          | ClubRating[]
          | { message?: string }
          | null;

        if (!response.ok || !Array.isArray(data)) {
          throw new Error(
            !Array.isArray(data) && data?.message
              ? data.message
              : "Bewertungen konnten nicht geladen werden.",
          );
        }

        setRatings(data);
      } catch (error) {
        setRatings([]);
        setRatingsError((error as Error).message);
      } finally {
        setRatingsLoading(false);
      }
    };

    loadRatings();
  }, [club?.id]);

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/clubs/me/contact`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = (await response.json().catch(() => null)) as {
        email?: string | null;
        phone?: string | null;
        sportsGroundName?: string | null;
        sportsGroundAddress?: string | null;
        sportsGroundZipCode?: string | null;
        sportsGroundCity?: string | null;
        location?: string | null;
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          data?.message || "Profil konnte nicht gespeichert werden.",
        );
      }

      setClub((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          email: data?.email ?? form.email,
          phone: data?.phone ?? null,
          sportsGroundName: data?.sportsGroundName ?? null,
          sportsGroundAddress: data?.sportsGroundAddress ?? null,
          sportsGroundZipCode: data?.sportsGroundZipCode ?? null,
          sportsGroundCity: data?.sportsGroundCity ?? null,
          location: data?.location ?? previous.location,
        };
      });

      setSaveSuccess("Profil wurde gespeichert.");
      setEditing(false);
    } catch (error) {
      setSaveError((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const logoUrl =
    mediaUrl(club?.logoPath, apiBaseUrl) ||
    club?.logoUrl ||
    "https://placehold.co/300x300";

  if (!club) {
    return (
      <main className="min-h-screen bg-[#f6f7f8] p-10 text-2xl">
        {loadError || "Lädt..."}
      </main>
    );
  }

  const displayName = club.name || club.clubName || "Unbekannter Club";
  const displayLocation = club.location || "Nicht angegeben";
  const displayEmail = club.email || "Nicht angegeben";
  const displayPhone = club.phone?.trim() || "";
  const hasSportsGroundInfo =
    Boolean(club.sportsGroundName?.trim()) ||
    Boolean(club.sportsGroundAddress?.trim()) ||
    Boolean(club.sportsGroundZipCode?.trim()) ||
    Boolean(club.sportsGroundCity?.trim());
  const sportsGroundCityLine =
    [club.sportsGroundZipCode?.trim(), club.sportsGroundCity?.trim()]
      .filter(Boolean)
      .join(" ") || "Nicht angegeben";
  const hasLeagueTable =
    Array.isArray(club.leagueTableData?.rows) &&
    club.leagueTableData!.rows!.length > 0;
  const leagueTableHeaders =
    club.leagueTableData?.headers && club.leagueTableData.headers.length > 0
      ? club.leagueTableData.headers
      : club.leagueTableData?.rows?.[0]?.map(
          (_, index) => `Spalte ${index + 1}`,
        ) || [];
  const leagueTableRows = club.leagueTableData?.rows || [];
  const normalizeTableText = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  const clubNameKey = normalizeTableText(displayName);
  const isOpenedClubRow = (row: string[]) => {
    if (!clubNameKey) {
      return false;
    }

    return row.some((cell) => {
      const cellKey = normalizeTableText(cell);
      return cellKey.includes(clubNameKey) || clubNameKey.includes(cellKey);
    });
  };

  return (
    <main className="min-h-screen bg-[#f6f7f8] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ClubNav />
        <Card className="mb-7">
          <div className="flex flex-col gap-7 md:flex-row md:items-center">
            <div className="relative w-fit shrink-0">
              <img
                src={logoUrl}
                alt={displayName}
                className="size-36 rounded-full border-4 border-green-500 object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="break-words text-4xl font-black sm:text-5xl">
                {displayName}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600">
                <p className="inline-flex items-center gap-2 text-base font-medium sm:text-lg">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-5 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 21s7-5.438 7-11a7 7 0 1 0-14 0c0 5.562 7 11 7 11Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  {displayLocation}
                </p>
                <p className="inline-flex items-center gap-2 text-base font-medium sm:text-lg">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-5 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                  <span className="break-all">{displayEmail}</span>
                </p>
                {displayPhone && (
                  <p className="inline-flex items-center gap-2 text-base font-medium sm:text-lg">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-5 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.89.33 1.76.62 2.6a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.48-1.28a2 2 0 0 1 2.11-.45c.84.29 1.71.5 2.6.62A2 2 0 0 1 22 16.92Z" />
                    </svg>
                    {displayPhone}
                  </p>
                )}
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => {
                    setSaveError("");
                    setSaveSuccess("");
                    setEditing(true);
                  }}
                  className="rounded-2xl bg-green-600 px-7 py-4 text-base font-black text-white shadow-lg shadow-green-950/15 transition hover:bg-green-500"
                >
                  Profil bearbeiten
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="mb-7 p-0">
          <div className="flex overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`min-w-36 border-b-2 px-7 py-5 text-base font-black ${
                activeTab === "profile"
                  ? "border-green-500 text-green-700"
                  : "border-transparent text-slate-500"
              }`}
            >
              Profil
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ratings")}
              className={`min-w-36 border-b-2 px-7 py-5 text-base font-black ${
                activeTab === "ratings"
                  ? "border-green-500 text-green-700"
                  : "border-transparent text-slate-500"
              }`}
            >
              Bewertungen
            </button>
          </div>
        </Card>

        <div className="stable-tab-panel">
          {activeTab === "profile" ? (
          <>
            <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <Card>
                <h2 className="text-2xl font-black">Vereinsinformationen</h2>
                <div className="mt-6 grid gap-4">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                    <p className="text-sm font-black text-slate-500">
                      Wettbewerb
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {club.wettbewerb || "Nicht angegeben"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
                    <p className="text-sm font-black text-slate-500">Liga</p>
                    <p className="mt-2 text-2xl font-black">
                      {club.liga || "Nicht angegeben"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-sm font-black text-slate-500">
                      Sportplatz
                    </p>
                    {hasSportsGroundInfo ? (
                      <div className="mt-2 space-y-1 text-sm font-bold text-slate-800">
                        <p>{club.sportsGroundName || "Nicht angegeben"}</p>
                        <p>{club.sportsGroundAddress || "Nicht angegeben"}</p>
                        <p>{sportsGroundCityLine}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-base font-black">
                        Nicht angegeben
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card>
                {hasLeagueTable ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-black">Ligatabelle</h2>
                  {club.oefbClubProfileUrl && (
                    <a
                      href={club.oefbClubProfileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-black uppercase tracking-[0.14em] text-green-700 hover:text-green-800"
                    >
                      Quelle OFB
                    </a>
                  )}
                </div>
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full border-collapse overflow-hidden rounded-xl border border-neutral-200">
                    <thead className="bg-neutral-100">
                      <tr>
                        {leagueTableHeaders.map((header, index) => (
                          <th
                            key={`${header}-${index}`}
                            className="border-b border-neutral-200 px-3 py-2 text-left text-xs font-black uppercase tracking-[0.08em] text-neutral-600"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leagueTableRows.map((row, rowIndex) => {
                        const highlighted = isOpenedClubRow(row);

                        return (
                        <tr
                          key={`row-${rowIndex}`}
                          className={
                            highlighted
                              ? "bg-green-100"
                              : rowIndex % 2 === 0
                                ? "bg-white"
                                : "bg-neutral-50"
                          }
                        >
                          {row.map((cell, cellIndex) => (
                            <td
                              key={`cell-${rowIndex}-${cellIndex}`}
                              className={`border-b px-3 py-2 text-sm font-semibold ${
                                highlighted
                                  ? "border-green-200 text-green-900"
                                  : "border-neutral-200 text-neutral-700"
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-black">Uber den Verein</h2>
                <p className="mt-5 text-lg leading-8 text-slate-700">
                  {club.description || "Noch keine Beschreibung hinterlegt."}
                </p>
              </>
                )}
              </Card>
            </section>

            <Card className="mt-7">
              <h2 className="mb-4 text-2xl font-black">
                Gesuchte Spielerattribute
              </h2>
              {club.requirements && club.requirements.length > 0 ? (
                <>
                  <p className="mb-3 text-sm font-semibold text-neutral-500">
                    Nach rechts scrollen, um alle gesuchten Profile zu sehen.
                  </p>
                  <div className="-mx-2 overflow-x-auto px-2 pb-2">
                    <div className="flex min-w-max gap-4">
                      {club.requirements.map((req) => (
                        <article
                          key={req.id}
                          className="w-[320px] shrink-0 rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                              Gesuchte Position
                            </p>
                            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-black text-green-700">
                              {req.position}
                            </span>
                          </div>

                          <div className="grid gap-2">
                            {[
                              ["Tempo", req.minTempo],
                              ["Schuss", req.minShooting],
                              ["Passen", req.minPassing],
                              ["Dribbling", req.minDribbling],
                              ["Defensive", req.minDefending],
                              ["Physis", req.minPhysical],
                            ].map(([label, value]) => (
                              <div
                                key={`${req.id}-${label}`}
                                className="rounded-xl border border-white bg-white px-3 py-2"
                              >
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-sm font-bold text-neutral-700">
                                    {label}
                                  </span>
                                  <span className="text-sm font-black text-green-700">
                                    {value}/99
                                  </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
                                  <div
                                    className="h-full rounded-full bg-green-500"
                                    style={{
                                      width: `${Math.min(Number(value), 99)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-neutral-500">
                  Keine Anforderungen hinterlegt.
                </p>
              )}
            </Card>
          </>
        ) : (
          <Card>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">Abgegebene Bewertungen</h2>
                <p className="mt-2 text-sm font-semibold text-neutral-500">
                  Bewertungen aus abgeschlossenen Probetrainings.
                </p>
              </div>
              <div className="w-fit rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-700">
                {ratings.length}{" "}
                {ratings.length === 1 ? "Bewertung" : "Bewertungen"}
              </div>
            </div>

            {ratingsError && (
              <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {ratingsError}
              </p>
            )}

            {ratingsLoading && (
              <div className="rounded-2xl bg-neutral-50 p-6 font-bold text-neutral-500">
                Lädt...
              </div>
            )}

            {!ratingsLoading && !ratingsError && ratings.length === 0 && (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8">
                <h3 className="text-xl font-black">Noch keine Bewertungen</h3>
                <p className="mt-2 text-sm font-semibold text-neutral-500">
                  Sobald dieser Club ein Probetraining bewertet, erscheint es
                  hier.
                </p>
              </div>
            )}

            {!ratingsLoading && ratings.length > 0 && (
              <div className="grid gap-4">
                {ratings.map((rating) => (
                  <article
                    key={rating.id}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            mediaUrl(
                              rating.player.profileImagePath ||
                                rating.player.profileImageUrl,
                              apiBaseUrl,
                            ) || "https://placehold.co/96x96"
                          }
                          alt={rating.player.name}
                          className="size-16 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-xl font-black">
                            {rating.player.name}
                          </h3>
                          <p className="mt-1 text-sm font-semibold text-neutral-500">
                            {formatPositions(rating.player.position)}
                          </p>
                          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-green-700">
                            {new Date(
                              rating.trialTraining?.scheduledAt ||
                                rating.createdAt,
                            ).toLocaleDateString("de-AT")}
                          </p>
                        </div>
                      </div>

                      <div className="w-fit rounded-2xl bg-white px-5 py-3 text-center">
                        <p className="text-3xl font-black text-green-700">
                          {rating.score}
                        </p>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                          /99
                        </p>
                      </div>
                    </div>

                    {(rating.comment || rating.trialTraining?.feedback) && (
                      <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold leading-relaxed text-neutral-700">
                        {rating.comment || rating.trialTraining?.feedback}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </Card>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm sm:p-6">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black">Profil bearbeiten</h2>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setSaveError("");
                  setSaveSuccess("");
                }}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-bold text-neutral-600 transition hover:bg-neutral-50"
              >
                Schliessen
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-bold text-slate-700">
                E-Mail
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 outline-none transition focus:border-green-500"
                />
              </label>

              <label className="text-sm font-bold text-slate-700">
                Telefonnummer
                <input
                  type="text"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      phone: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 outline-none transition focus:border-green-500"
                />
              </label>

              <label className="text-sm font-bold text-slate-700 md:col-span-2">
                Sportplatz Name
                <input
                  type="text"
                  value={form.sportsGroundName}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      sportsGroundName: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 outline-none transition focus:border-green-500"
                />
              </label>

              <label className="text-sm font-bold text-slate-700 md:col-span-2">
                Sportplatz Adresse
                <input
                  type="text"
                  value={form.sportsGroundAddress}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      sportsGroundAddress: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 outline-none transition focus:border-green-500"
                />
              </label>

              <label className="text-sm font-bold text-slate-700">
                Sportplatz PLZ
                <input
                  type="text"
                  value={form.sportsGroundZipCode}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      sportsGroundZipCode: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 outline-none transition focus:border-green-500"
                />
              </label>

              <label className="text-sm font-bold text-slate-700">
                Sportplatz Stadt
                <input
                  type="text"
                  value={form.sportsGroundCity}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      sportsGroundCity: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 outline-none transition focus:border-green-500"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="rounded-xl bg-green-600 px-5 py-3 text-sm font-black text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-neutral-400"
              >
                {saving ? "Speichern..." : "Aenderungen speichern"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setSaveError("");
                  setSaveSuccess("");
                }}
                className="rounded-xl border border-neutral-300 px-5 py-3 text-sm font-black text-neutral-700 transition hover:bg-neutral-50"
              >
                Abbrechen
              </button>

              {saveError && (
                <p className="text-sm font-bold text-red-600">{saveError}</p>
              )}

              {saveSuccess && (
                <p className="text-sm font-bold text-green-700">
                  {saveSuccess}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
