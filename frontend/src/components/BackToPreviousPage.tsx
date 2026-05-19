"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const routeLabels: Array<[RegExp, string]> = [
  [/^\/player-search$/, "Spielerliste"],
  [/^\/club\/players$/, "Spielerliste"],
  [/^\/player\/clubs$/, "Clubliste"],
  [/^\/club\/applications$/, "Bewerbungsliste"],
  [/^\/player\/applications$/, "Bewerbungsliste"],
  [/^\/club\/trial-trainings$/, "Probetrainings"],
  [/^\/my-trials$/, "Probetrainings"],
  [/^\/club\/requirements$/, "Anforderungen"],
  [/^\/matches$/, "Matchliste"],
  [/^\/club\/dashboard$/, "Übersicht"],
  [/^\/player\/dashboard$/, "Übersicht"],
  [/^\/club\/profile$/, "Clubprofil"],
  [/^\/player\/profile$/, "Spielerprofil"],
];

const labelForPath = (path: string | null) => {
  if (!path) {
    return "vorherigen Seite";
  }

  return routeLabels.find(([pattern]) => pattern.test(path))?.[1] ?? "vorherigen Seite";
};

export default function BackToPreviousPage() {
  const router = useRouter();
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  useEffect(() => {
    setPreviousPath(sessionStorage.getItem("previousPath"));
  }, []);

  const label = labelForPath(previousPath);

  return (
    <button
      type="button"
      onClick={() => {
        if (previousPath) {
          router.push(previousPath);
          return;
        }

        router.back();
      }}
      className="mb-6 inline-flex items-center gap-4 text-3xl font-black text-green-600 transition hover:text-green-700"
    >
      <span aria-hidden="true" className="text-4xl leading-none">
        ←
      </span>
      Zurück zur {label}
    </button>
  );
}
