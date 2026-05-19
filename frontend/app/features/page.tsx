import Link from "next/link";

const featureGroups = [
  {
    eyebrow: "Für Spieler",
    title: "Ein Profil, das mehr zeigt als Name und Position.",
    text: "Spieler können ihre Positionen, Attribute, Hauptfähigkeiten, Karriere, Videos und Bewertungen an einem Ort darstellen. Dadurch entsteht ein standardisiertes Profil, das für Vereine schnell vergleichbar ist.",
    items: [
      "Selbstbewertung mit festen Hauptattributen",
      "Positions- und GK-spezifische Fähigkeiten",
      "Karriere- und Vereinsverlauf mit ÖFB-Bezug",
      "Highlight-Video als sichtbares Signal in der Spielersuche",
    ],
  },
  {
    eyebrow: "Für Vereine",
    title: "Anforderungen werden konkret messbar.",
    text: "Clubs definieren nicht nur, welche Position gesucht wird, sondern auch welche Attribute, Fähigkeiten und Prioritäten pro Position wirklich wichtig sind.",
    items: [
      "Eigene Anforderungen pro gesuchter Position",
      "Gewichtung nach Muss-, Soll- und Zusatzkriterien",
      "Spielersuche mit Filtern und Match-Wert",
      "Einladung und Nachverfolgung von Probetrainings",
    ],
  },
  {
    eyebrow: "Für Entscheidungen",
    title: "Der Match-Wert wird nachvollziehbar.",
    text: "Die App zeigt, wie nahe ein Spieler an den Anforderungen eines Vereins liegt. Statt nur eine Prozentzahl zu zeigen, werden Attribute, Fähigkeiten und Positionsfit sichtbar gemacht.",
    items: [
      "Vergleich von Vereins-Mindestwert und Spielerwert",
      "Weicher Matching-Score statt starrer Checkliste",
      "Selbst- und Fremdrating getrennt dargestellt",
      "Bewertungen nach Probetrainings fließen in das Fremdrating ein",
    ],
  },
];

const highlights = [
  ["Standardisierte Profile", "Spielerleistungen werden einheitlich erfasst und dadurch vergleichbar."],
  ["MCDM-Gedanke", "Mehrere Kriterien werden kombiniert, statt Entscheidungen nur auf einzelne Werte zu reduzieren."],
  ["Probetraining-Loop", "Einladungen, Termine und Bewertungen schließen den Rekrutierungsprozess logisch ab."],
  ["Amateurfokus", "Die App ist auf Vereine mit wenig Zeit, begrenzten Ressourcen und praktischen Anforderungen ausgerichtet."],
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#f5f8f6] text-neutral-950">
      <section className="relative overflow-hidden bg-neutral-950">
        <img
          src="https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1800&q=85"
          alt="Fußballteam beim Training"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-24 text-white">
          <img
            src="/MYC.png"
            alt="Match Your Club"
            className="mb-6 h-24 w-auto rounded-2xl bg-white/90 object-contain p-3 shadow-2xl shadow-black/25 sm:h-28"
          />

          <p className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-green-200 backdrop-blur">
            Features
          </p>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight sm:text-6xl">
            Die Funktionen hinter Match Your Club.
          </h1>
          <p className="mt-6 max-w-3xl text-xl font-semibold leading-8 text-white/80">
            Die Web-App verbindet Spielerprofile, Vereinsanforderungen,
            Matching und Probetrainings zu einem durchgehenden digitalen
            Rekrutierungsprozess für den Amateurfußball.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-4">
          {highlights.map(([title, text]) => (
            <article
              key={title}
              className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-black">{title}</h2>
              <p className="mt-3 leading-7 text-neutral-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-6">
          {featureGroups.map((group, index) => (
            <article
              key={group.title}
              className="grid gap-7 rounded-[2rem] border border-neutral-200 bg-[#f8faf9] p-6 shadow-sm lg:grid-cols-[0.85fr_1.15fr] lg:items-center"
            >
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-green-700">
                  {group.eyebrow}
                </p>
                <h2 className="mt-4 text-3xl font-black leading-tight">
                  {group.title}
                </h2>
                <p className="mt-4 text-lg leading-8 text-neutral-600">
                  {group.text}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-green-100 bg-white p-4"
                  >
                    <p className="text-sm font-black text-green-700">
                      Feature {index + 1}
                    </p>
                    <p className="mt-2 font-bold leading-6 text-neutral-800">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[2rem] bg-neutral-950 px-6 py-10 text-white sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-4xl font-black">Warum ist das besonders?</h2>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-white/72">
                Die Plattform ist nicht als einfache Kontaktliste gedacht. Sie
                macht die Gründe hinter einem Match sichtbar und trennt bewusst
                zwischen Selbsteinschätzung, Vereinsanforderung und externer
                Bewertung.
              </p>
            </div>
            <Link
              href="/unser-ziel"
              className="rounded-2xl bg-green-500 px-7 py-4 text-center font-black text-white transition hover:bg-green-400"
            >
              Ziel der App ansehen
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
