"use client";

import Link from "next/link";
import { useAuth } from "@/src/hooks/useAuth";

const steps = [
  {
    title: "Profil erstellen",
    text: "Spieler importieren ÖFB-Daten, ergänzen Attribute, Positionen und Verfügbarkeit.",
  },
  {
    title: "Matching berechnen",
    text: "Clubs und Spieler werden über Positionen, Fähigkeiten, Standort und Anforderungen verglichen.",
  },
  {
    title: "Probetraining starten",
    text: "Passende Kontakte führen direkt zu Bewerbungen, Einladungen und Probetraining-Terminen.",
  },
];

const benefits = [
  "Verifizierte Spielerprofile mit ÖFB-Link",
  "Club-Suche mit individuellem Matching-Wert",
  "Übersichten für Bewerbungen, Probetrainings und Interaktionen",
  "Karriere, Attribute und Bewertungen an einem Ort",
];

const featureLinks = [
  {
    title: "Struktur statt Bauchgefühl",
    text: "Spielerprofile, Anforderungen und Bewertungen werden standardisiert erfasst und dadurch vergleichbar.",
    href: "/features",
  },
  {
    title: "Aus der Bachelorarbeit heraus entwickelt",
    text: "Die App adressiert informelle Netzwerke, geringe Transparenz und subjektive Entscheidungen im Amateurfußball.",
    href: "/unser-ziel",
  },
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  const searchHref = user?.role === "club" ? "/player-search" : "/player/clubs";
  const searchLabel = user?.role === "club" ? "Spielersuche" : "Vereinssuche";
  const primaryAction = isAuthenticated
    ? { href: "/matches", label: "Zu deinen Matches" }
    : { href: "/login", label: "Jetzt einloggen" };
  const secondaryAction = isAuthenticated
    ? { href: searchHref, label: searchLabel }
    : { href: "/register", label: "Registrieren" };

  return (
    <main className="min-h-screen bg-[#f5f8f6] text-neutral-950">
      <section className="relative min-h-[calc(100vh-73px)] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1800&q=85"
          alt="Fußballspieler auf dem Spielfeld"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-neutral-950/62" />

        <div className="relative mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl flex-col justify-center px-6 py-16">
          <div className="max-w-3xl">
            <img
              src="/MYC.png"
              alt="Match Your Club"
              className="mb-6 h-24 w-auto rounded-2xl bg-white/90 object-contain p-3 shadow-2xl shadow-black/25 sm:h-28"
            />

            <p className="mb-5 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-green-200 backdrop-blur">
              Fußball-Matching für Spieler und Clubs
            </p>

            <h1 className="text-5xl font-black leading-tight text-white sm:text-6xl lg:text-7xl">
              Match Your Club
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-8 text-white/86">
              Die Plattform verbindet Fußballspieler mit passenden Vereinen:
              mit verifizierten Profilen, intelligentem Matching, Club-Suche,
              Bewerbungen und Probetraining-Terminen.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {!loading && (
                <>
                  <Link
                    href={primaryAction.href}
                    className="rounded-2xl bg-green-500 px-7 py-4 text-center text-base font-black text-white shadow-xl shadow-green-950/25 transition hover:bg-green-400"
                  >
                    {primaryAction.label}
                  </Link>
                  <Link
                    href={secondaryAction.href}
                    className="rounded-2xl border border-white/30 bg-white/10 px-7 py-4 text-center text-base font-black text-white backdrop-blur transition hover:bg-white/18"
                  >
                    {secondaryAction.label}
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              ["86+", "Top-Talent Bewertung"],
              ["3", "Positionen pro Profil"],
              ["Live", "ÖFB-Datenimport"],
            ].map(([value, label]) => (
              <div key={label} className="border-l border-white/30 pl-5">
                <p className="text-4xl font-black text-white">{value}</p>
                <p className="mt-1 text-sm font-bold text-white/72">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-green-100 bg-white py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 md:grid-cols-2">
          {featureLinks.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-3xl border border-neutral-200 bg-[#f8faf9] p-6 transition hover:-translate-y-1 hover:border-green-200 hover:shadow-xl hover:shadow-green-950/10"
            >
              <h2 className="text-2xl font-black text-neutral-950">
                {item.title}
              </h2>
              <p className="mt-3 leading-7 text-neutral-600">{item.text}</p>
              <p className="mt-5 font-black text-green-700 group-hover:text-green-600">
                Mehr erfahren
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-green-700">
            Was ist Match Your Club?
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
            Eine digitale Schnittstelle zwischen Talent und Verein.
          </h2>
          <p className="mt-5 text-lg leading-8 text-neutral-600">
            Spieler präsentieren sich mit Profil, Attributen, Karriereverlauf,
            Highlight-Video und Bewertungen. Clubs finden passende Spieler oder
            werden selbst über Matching-Werte für Spieler sichtbar.
          </p>

          <div className="mt-8 grid gap-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                <span className="grid size-8 place-items-center rounded-full bg-green-100 font-black text-green-700">
                  ✓
                </span>
                <p className="font-bold text-neutral-800">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-green-100 bg-white p-5 shadow-2xl shadow-green-950/10">
          <div className="rounded-[1.5rem] bg-neutral-950 p-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-green-300">Club-Match</p>
                <h3 className="mt-1 text-3xl font-black">DSG O&apos;Jessas</h3>
              </div>
              <span className="rounded-2xl bg-green-500 px-4 py-2 text-2xl font-black">
                92%
              </span>
            </div>

            <div className="mt-7 grid gap-4">
              {[
                ["Position", "ZDM, LV, LF"],
                ["Standort", "Wien"],
                ["Status", "Auf Vereinssuche"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white/8 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-white/50">
                    {label}
                  </p>
                  <p className="mt-1 text-xl font-black">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-2xl bg-white p-4 text-neutral-950">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-black">Spielerattribute</p>
                <p className="font-black text-green-600">84 Ø</p>
              </div>
              {[
                ["Tempo", 88],
                ["Pässe", 81],
                ["Physis", 86],
              ].map(([label, value]) => (
                <div key={label} className="mb-3 last:mb-0">
                  <div className="mb-1 flex justify-between text-sm font-bold">
                    <span>{label}</span>
                    <span>{value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-green-700">
              Ablauf
            </p>
            <h2 className="mt-4 text-4xl font-black">
              Von der Registrierung zum Probetraining.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-3xl border border-neutral-200 bg-[#f8faf9] p-6">
                <span className="grid size-12 place-items-center rounded-2xl bg-green-500 text-xl font-black text-white">
                  {index + 1}
                </span>
                <h3 className="mt-6 text-2xl font-black">{step.title}</h3>
                <p className="mt-3 leading-7 text-neutral-600">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-green-700">
              Alleinstellungsmerkmale
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight">
              Nicht nur suchen, sondern erklären, warum es passt.
            </h2>
            <p className="mt-5 text-lg leading-8 text-neutral-600">
              Match Your Club verbindet die klassische Spielerbörse mit
              nachvollziehbarer Entscheidungsunterstützung. Der Match-Wert
              basiert auf Position, Attributen, Fähigkeiten und den konkreten
              Anforderungen eines Vereins.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Selbst- und Fremdbewertung", "Eigene Angaben bleiben sichtbar, externe Bewertungen verändern das Fremdrating."],
              ["Positionslogik", "Spieler können auch für ähnliche Rollen erkannt werden, wenn ihre Attribute passen."],
              ["Probetraining", "Einladungen, Termine und Bewertungen sind direkt im Prozess verbunden."],
              ["ÖFB-Daten", "Karriere- und Vereinsdaten können als zusätzliche Grundlage eingebunden werden."],
            ].map(([title, text]) => (
              <article
                key={title}
                className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-neutral-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[2rem] bg-neutral-950 px-6 py-10 text-center text-white sm:px-10">
          <h2 className="text-4xl font-black">Bereit für dein nächstes Match?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
            {isAuthenticated
              ? "Öffne deine Matches oder suche direkt nach passenden Spielern und Vereinen."
              : "Erstelle ein Spielerprofil oder registriere deinen Club und finde passende Kontakte schneller und strukturierter."}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {!loading && (
              <>
                <Link
                  href={primaryAction.href}
                  className="rounded-2xl bg-green-500 px-7 py-4 font-black text-white transition hover:bg-green-400"
                >
                  {primaryAction.label}
                </Link>
                <Link
                  href={secondaryAction.href}
                  className="rounded-2xl border border-white/20 px-7 py-4 font-black text-white transition hover:bg-white/10"
                >
                  {secondaryAction.label}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
