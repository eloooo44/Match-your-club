import Link from "next/link";

const problems = [
  {
    title: "Informelle Netzwerke",
    text: "Im Amateurfußball läuft Spielersuche oft über persönliche Kontakte. Dadurch bleiben Spieler außerhalb bestehender Netzwerke leichter unsichtbar.",
  },
  {
    title: "Geringe Vergleichbarkeit",
    text: "Profile, Social-Media-Auftritte oder Empfehlungen liefern selten dieselbe Datenstruktur. Vereine können Kandidaten dadurch nur schwer objektiv vergleichen.",
  },
  {
    title: "Subjektive Entscheidungen",
    text: "Ohne ergänzende Bewertungen bleibt vieles Bauchgefühl. Genau hier helfen Probetrainings, Fremdbewertungen und transparente Kriterien.",
  },
];

const solutions = [
  ["Strukturierte Spielerprofile", "Positionen, Attribute, Fähigkeiten, Karriere und Videos werden einheitlich sichtbar."],
  ["Anforderungsprofile für Clubs", "Vereine definieren pro gesuchter Position, welche Werte und Fähigkeiten zählen."],
  ["Nachvollziehbares Matching", "Der Score kombiniert mehrere Kriterien und zeigt, warum ein Spieler gut oder weniger gut passt."],
  ["Mehrstufiges Bewertungssystem", "Selbstbewertung und Fremdbewertung bleiben getrennt, damit Einschätzungen transparent bleiben."],
  ["Probetraining als Prozess", "Einladungen, Termine und Bewertungen bilden einen realistischen Ablauf für Amateurvereine ab."],
  ["ÖFB-Bezug", "Öffentliche Vereins- und Karrieredaten können als zusätzliche Orientierung eingebunden werden."],
];

const researchSteps = [
  "Problem im Rekrutierungsprozess analysieren",
  "Anforderungen aus Literatur und Praxis ableiten",
  "Web-App als Prototyp konzipieren",
  "Matching, Bewertungen und Probetrainings praktisch umsetzen",
];

export default function GoalPage() {
  return (
    <main className="min-h-screen bg-[#f5f8f6] text-neutral-950">
      <section className="relative overflow-hidden bg-neutral-950">
        <img
          src="https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=1800&q=85"
          alt="Amateurfußball auf einem Trainingsplatz"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-24 text-white">
          <img
            src="/MYC.png"
            alt="Match Your Club"
            className="mb-6 h-24 w-auto rounded-2xl bg-white/90 object-contain p-3 shadow-2xl shadow-black/25 sm:h-28"
          />

          <p className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-green-200 backdrop-blur">
            Unser Ziel
          </p>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight sm:text-6xl">
            Eine Spielerbörse, die Amateurfußball transparenter macht.
          </h1>
          <p className="mt-6 max-w-3xl text-xl font-semibold leading-8 text-white/80">
            Match Your Club ist im Rahmen einer Bachelorarbeit als Prototyp
            entstanden. Ziel ist es, Spieler und Vereine strukturierter,
            vergleichbarer und nachvollziehbarer zusammenzubringen.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-green-700">
            Das Problem
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight">
            Rekrutierung im Amateurfußball ist oft zu wenig sichtbar.
          </h2>
          <p className="mt-5 text-lg leading-8 text-neutral-600">
            Die Bachelorarbeit beschreibt den Amateurfußball als Umfeld, in dem
            Spielersuche häufig durch persönliche Netzwerke, begrenzte
            Transparenz und ineffiziente Informationsflüsse geprägt ist. Die
            Web-App setzt genau an dieser Lücke an.
          </p>
        </div>

        <div className="grid gap-4">
          {problems.map((problem) => (
            <article
              key={problem.title}
              className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-2xl font-black">{problem.title}</h3>
              <p className="mt-3 leading-7 text-neutral-600">{problem.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-green-700">
              Die Lösung
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight">
              Features als Antwort auf konkrete Forschungsanforderungen.
            </h2>
            <p className="mt-5 text-lg leading-8 text-neutral-600">
              Die App bildet die wichtigsten Schritte der Spielervermittlung
              digital ab: Profil, Suche, Matching, Kontaktaufnahme,
              Probetraining und Bewertung.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {solutions.map(([title, text]) => (
              <article
                key={title}
                className="rounded-3xl border border-neutral-200 bg-[#f8faf9] p-6"
              >
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-neutral-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div className="rounded-[2rem] bg-neutral-950 p-7 text-white">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-green-300">
            Bachelorarbeit
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight">
            Design Science Research als Rahmen.
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/72">
            Der Prototyp ist nicht nur eine App-Idee, sondern ein Artefakt, mit
            dem geprüft wird, wie digitale Spielervermittlung im Amateurfußball
            praktisch umgesetzt werden kann.
          </p>
        </div>

        <div className="grid gap-3">
          {researchSteps.map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-green-500 text-lg font-black text-white">
                {index + 1}
              </span>
              <p className="text-lg font-black text-neutral-800">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-[2rem] border border-green-100 bg-white p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-black">
                Vom Forschungsproblem zur nutzbaren Web-App.
              </h2>
              <p className="mt-3 max-w-3xl leading-7 text-neutral-600">
                Der Mehrwert entsteht dort, wo die App nicht nur Daten sammelt,
                sondern sie vergleichbar macht: für Spieler, die sichtbarer
                werden wollen, und für Vereine, die fundierter entscheiden
                möchten.
              </p>
            </div>
            <Link
              href="/features"
              className="rounded-2xl bg-green-500 px-7 py-4 text-center font-black text-white transition hover:bg-green-400"
            >
              Features ansehen
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
