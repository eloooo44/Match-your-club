"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/src/services/api";

interface Trial {
  id: number;
  clubName: string;
  date: string;
  status: string;
}

export default function PlayerTrialsPage() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Bitte erneut einloggen.");
      setLoading(false);
      return;
    }
    apiFetch("/players/trials", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => setTrials(data as Trial[]))
      .catch((err) =>
        setError(
          (err as Error).message || "Fehler beim Laden der Probetrainings.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-12 text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-[var(--primary)]">
          Probetrainings
        </h1>
        <p className="mt-4 text-[var(--muted)]">
          Hier findest du alle deine Probetrainings und Einladungen.
        </p>
        {error && (
          <div className="mt-6 rounded-xl bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}
        {loading ? (
          <div className="mt-6">Lädt...</div>
        ) : trials.length === 0 ? (
          <div className="mt-6 text-neutral-500">
            Keine Probetrainings gefunden.
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {trials.map((trial) => (
              <li
                key={trial.id}
                className="rounded-2xl border border-green-100 bg-white p-6 shadow"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-lg font-bold text-green-800">
                      {trial.clubName}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {new Date(trial.date).toLocaleString("de-AT")}
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <span className="rounded-xl bg-green-50 px-4 py-2 text-sm font-black text-green-700">
                      {trial.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
