"use client";

import { useEffect, useState } from "react";

import ClubNav from "@/src/components/ClubNav";
import { apiFetch } from "@/services/api";

type AttributeKey =
  | "tempo"
  | "shooting"
  | "passing"
  | "dribbling"
  | "defending"
  | "physical";

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
  requiredSkills?: string[];
  highlightedSkills?: string[];
  description?: string | null;
};

type RequirementForm = {
  position: string;
  minValues: Record<AttributeKey, number>;
  weights: Record<AttributeKey, 1 | 2 | 3>;
  requiredSkills: string[];
  highlightedSkills: string[];
  description: string;
};

const positionOptions = [
  "GK",
  "IV",
  "LV",
  "RV",
  "ZDM",
  "ZM",
  "ZOM",
  "ST",
  "LF",
  "RF",
];

const attributeLabels: Array<{ key: AttributeKey; label: string }> = [
  { key: "tempo", label: "Tempo" },
  { key: "shooting", label: "Schießen" },
  { key: "passing", label: "Passen" },
  { key: "dribbling", label: "Dribbling" },
  { key: "defending", label: "Verteidigung" },
  { key: "physical", label: "Physis" },
];

const goalkeeperSkillOptions = [
  "Reflexe",
  "Strafraumbeherrschung",
  "Eins-gegen-Eins",
  "Abstöße",
  "Spieleröffnung",
  "Kommunikation",
  "Stellungsspiel",
  "Fangsicherheit",
  "Reaktionsschnelligkeit",
  "Elfmeter-Killer",
  "Mitspielender Tormann",
];

const fieldPlayerSkillOptions = [
  "Zweikampfstärke",
  "Kopfballspiel",
  "Spielaufbau",
  "Passgenauigkeit",
  "Spielübersicht",
  "Tempo",
  "Dribbling",
  "Ausdauer",
  "Physis",
  "Defensivarbeit",
  "Pressing",
  "Flankenspiel",
  "Ballkontrolle",
  "Abschluss",
];

const getVisibleSkillOptions = (position: string) =>
  position === "GK"
    ? goalkeeperSkillOptions
    : fieldPlayerSkillOptions;

const sanitizeFormForPosition = (form: RequirementForm) => {
  const visibleSkills = getVisibleSkillOptions(form.position);
  const requiredSkills = form.requiredSkills.filter((skill) =>
    visibleSkills.includes(skill),
  );

  return {
    ...form,
    requiredSkills,
    highlightedSkills: form.highlightedSkills.filter((skill) =>
      requiredSkills.includes(skill),
    ),
  };
};

const emptyForm: RequirementForm = {
  position: "",
  minValues: {
    tempo: 50,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defending: 50,
    physical: 50,
  },
  weights: {
    tempo: 1,
    shooting: 1,
    passing: 1,
    dribbling: 1,
    defending: 1,
    physical: 1,
  },
  requiredSkills: [],
  highlightedSkills: [],
  description: "",
};

const toForm = (requirement: ClubRequirement): RequirementForm => ({
  position: requirement.position,
  minValues: {
    tempo: requirement.minTempo,
    shooting: requirement.minShooting,
    passing: requirement.minPassing,
    dribbling: requirement.minDribbling,
    defending: requirement.minDefending,
    physical: requirement.minPhysical,
  },
  weights: {
    tempo: (Math.round(requirement.tempoWeight) as 1 | 2 | 3) || 1,
    shooting: (Math.round(requirement.shootingWeight) as 1 | 2 | 3) || 1,
    passing: (Math.round(requirement.passingWeight) as 1 | 2 | 3) || 1,
    dribbling: (Math.round(requirement.dribblingWeight) as 1 | 2 | 3) || 1,
    defending: (Math.round(requirement.defendingWeight) as 1 | 2 | 3) || 1,
    physical: (Math.round(requirement.physicalWeight) as 1 | 2 | 3) || 1,
  },
  requiredSkills: requirement.requiredSkills ?? [],
  highlightedSkills: requirement.highlightedSkills ?? [],
  description: requirement.description ?? "",
});

const toPayload = (form: RequirementForm) => {
  const sanitizedForm = sanitizeFormForPosition(form);

  return {
    position: sanitizedForm.position,
    minTempo: sanitizedForm.minValues.tempo,
    minShooting: sanitizedForm.minValues.shooting,
    minPassing: sanitizedForm.minValues.passing,
    minDribbling: sanitizedForm.minValues.dribbling,
    minDefending: sanitizedForm.minValues.defending,
    minPhysical: sanitizedForm.minValues.physical,
    tempoWeight: sanitizedForm.weights.tempo,
    shootingWeight: sanitizedForm.weights.shooting,
    passingWeight: sanitizedForm.weights.passing,
    dribblingWeight: sanitizedForm.weights.dribbling,
    defendingWeight: sanitizedForm.weights.defending,
    physicalWeight: sanitizedForm.weights.physical,
    requiredSkills: sanitizedForm.requiredSkills,
    highlightedSkills: sanitizedForm.highlightedSkills,
    description: sanitizedForm.description.trim() || undefined,
  };
};

export default function ClubRequirementsPage() {
  const [requirements, setRequirements] = useState<ClubRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createForm, setCreateForm] = useState<RequirementForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<RequirementForm>(emptyForm);

  const loadRequirements = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Bitte erneut einloggen.");
      setLoading(false);
      return;
    }

    try {
      const data = (await apiFetch("/club-requirements", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })) as ClubRequirement[];

      setRequirements(data);
    } catch (err) {
      setError(
        (err as Error).message || "Anforderungen konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, []);

  const updateFormMinValue = (
    form: RequirementForm,
    key: AttributeKey,
    value: number,
  ) => ({
    ...form,
    minValues: {
      ...form.minValues,
      [key]: value,
    },
  });

  const updateFormWeight = (
    form: RequirementForm,
    key: AttributeKey,
    value: 1 | 2 | 3,
  ) => ({
    ...form,
    weights: {
      ...form.weights,
      [key]: value,
    },
  });

  const toggleFormSkill = (
    form: RequirementForm,
    type: "requiredSkills" | "highlightedSkills",
    skill: string,
  ): RequirementForm => {
    const selected = form[type].includes(skill);
    const nextSkills = selected
      ? form[type].filter((selectedSkill) => selectedSkill !== skill)
      : [...form[type], skill];

    return {
      ...form,
      [type]: nextSkills,
    };
  };

  const createRequirement = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!createForm.position) {
      setError("Bitte eine Position wählen.");
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/club-requirements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(toPayload(createForm)),
      });

      setCreateForm(emptyForm);
      setSuccess("Anforderung erstellt.");
      await loadRequirements();
    } catch (err) {
      setError(
        (err as Error).message || "Anforderung konnte nicht erstellt werden.",
      );
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (requirement: ClubRequirement) => {
    setEditingId(requirement.id);
    setEditForm(toForm(requirement));
    setError("");
    setSuccess("");
  };

  const saveEdit = async () => {
    if (!editingId) {
      return;
    }

    setSaving(true);
    try {
      await apiFetch(`/club-requirements/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(toPayload(editForm)),
      });

      setEditingId(null);
      setSuccess("Anforderung aktualisiert.");
      await loadRequirements();
    } catch (err) {
      setError(
        (err as Error).message ||
          "Anforderung konnte nicht aktualisiert werden.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteRequirement = async (id: number) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/club-requirements/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setSuccess("Anforderung gelöscht.");
      await loadRequirements();
    } catch (err) {
      setError(
        (err as Error).message || "Anforderung konnte nicht gelöscht werden.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6faf7] px-6 py-10 text-black sm:px-8">
      <div className="mx-auto max-w-7xl">
        <ClubNav />
        <div className="mb-8 rounded-3xl bg-white p-8 shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
            Club-Anforderungen
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Suchprofil verwalten
          </h1>
          <p className="mt-3 text-sm font-semibold text-neutral-600">
            Definiere pro Position Mindestattribute und Gewichtungen.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-700">
            {success}
          </div>
        )}

        <section className="rounded-3xl bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-black">Neue Anforderung</h2>

          <form onSubmit={createRequirement} className="mt-5 space-y-5">
            <label className="block max-w-sm">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                Position
              </span>
              <select
                value={createForm.position}
                onChange={(event) =>
                  setCreateForm((current) =>
                    sanitizeFormForPosition({
                      ...current,
                      position: event.target.value,
                    }),
                  )
                }
                className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
              >
                <option value="">Position wählen</option>
                {positionOptions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </label>

            {createForm.position === "GK" ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900">
                Bei Tormann-Anforderungen zählen nur Tormann-Fähigkeiten und
                markierte Wunschstärken.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {attributeLabels.map(({ key, label }) => (
                  <div
                    key={`create-${key}`}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <p className="text-sm font-black text-neutral-800">
                      {label}
                    </p>
                    <div className="mt-3">
                      <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                        <span>Minimum</span>
                        <span>{createForm.minValues[key]}/99</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={99}
                        value={createForm.minValues[key]}
                        onChange={(event) =>
                          setCreateForm((current) =>
                            updateFormMinValue(
                              current,
                              key,
                              Number(event.target.value),
                            ),
                          )
                        }
                        className="w-full accent-green-500"
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {(
                        [
                          [1, "Niedrig"],
                          [2, "Mittel"],
                          [3, "Hoch"],
                        ] as const
                      ).map(([weight, weightLabel]) => (
                        <button
                          key={`create-${key}-${weight}`}
                          type="button"
                          onClick={() =>
                            setCreateForm((current) =>
                              updateFormWeight(current, key, weight),
                            )
                          }
                          className={`rounded-lg border px-2 py-2 text-xs font-black transition ${
                            createForm.weights[key] === weight
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-neutral-200 bg-white text-neutral-700 hover:border-green-300 hover:bg-green-50"
                          }`}
                        >
                          {weightLabel}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-black text-neutral-800">
                Gesuchte Hauptfähigkeiten
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {getVisibleSkillOptions(createForm.position).map((skill) => {
                  const selected = createForm.requiredSkills.includes(skill);
                  const highlighted =
                    createForm.highlightedSkills.includes(skill);

                  return (
                    <div
                      key={`create-skill-${skill}`}
                      className="flex overflow-hidden rounded-full border border-neutral-200 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setCreateForm((current) =>
                            toggleFormSkill(current, "requiredSkills", skill),
                          )
                        }
                        className={`px-4 py-2 text-sm font-black transition ${
                          selected
                            ? "bg-green-500 text-white"
                            : "text-neutral-700 hover:bg-green-50 hover:text-green-700"
                        }`}
                      >
                        {skill}
                      </button>
                      {selected && (
                        <button
                          type="button"
                          onClick={() =>
                            setCreateForm((current) =>
                              toggleFormSkill(
                                current,
                                "highlightedSkills",
                                skill,
                              ),
                            )
                          }
                          className={`border-l px-3 py-2 text-sm font-black transition ${
                            highlighted
                              ? "border-green-400 bg-neutral-950 text-white"
                              : "border-green-400 bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                          title="Besonders wichtig markieren"
                        >
                          ★
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                Beschreibung (optional)
              </span>
              <textarea
                rows={3}
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/15"
                placeholder="z. B. Schneller Flügelspieler für Umschaltmomente"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="h-12 rounded-xl bg-green-600 px-6 text-sm font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {saving ? "Speichert..." : "Anforderung hinzufügen"}
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-black">Deine Anforderungen</h2>

          {loading ? (
            <p className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm font-semibold text-neutral-600">
              Lade Anforderungen...
            </p>
          ) : requirements.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm font-semibold text-neutral-600">
              Noch keine Anforderungen vorhanden.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {requirements.map((requirement) => {
                const isEditing = editingId === requirement.id;
                const form = isEditing ? editForm : toForm(requirement);

                return (
                  <article
                    key={requirement.id}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-lg font-black">
                        Position: {form.position}
                      </p>
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={saving}
                              className="rounded-lg bg-green-600 px-3 py-2 text-xs font-black text-white transition hover:bg-green-700"
                            >
                              Speichern
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-black text-neutral-700 transition hover:bg-neutral-100"
                            >
                              Abbrechen
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(requirement)}
                              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-black text-neutral-700 transition hover:bg-neutral-100"
                            >
                              Bearbeiten
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteRequirement(requirement.id)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
                            >
                              Löschen
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <label className="mt-4 block max-w-sm">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                          Position
                        </span>
                        <select
                          value={editForm.position}
                          onChange={(event) =>
                            setEditForm((current) =>
                              sanitizeFormForPosition({
                                ...current,
                                position: event.target.value,
                              }),
                            )
                          }
                          className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-500/15"
                        >
                          {positionOptions.map((position) => (
                            <option key={position} value={position}>
                              {position}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {form.position === "GK" ? (
                      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900">
                        Tormann-Anforderungen werden nur über
                        Tormann-Fähigkeiten bewertet.
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {attributeLabels.map(({ key, label }) => (
                          <div
                            key={`existing-${requirement.id}-${key}`}
                            className="rounded-xl border border-neutral-200 bg-white p-4"
                          >
                            <p className="text-sm font-black text-neutral-800">
                              {label}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-neutral-600">
                              Minimum: {form.minValues[key]}/99
                            </p>
                            <p className="text-sm font-semibold text-neutral-600">
                              Gewichtung: {form.weights[key]}
                            </p>

                            {isEditing && (
                              <>
                                <input
                                  type="range"
                                  min={0}
                                  max={99}
                                  value={editForm.minValues[key]}
                                  onChange={(event) =>
                                    setEditForm((current) =>
                                      updateFormMinValue(
                                        current,
                                        key,
                                        Number(event.target.value),
                                      ),
                                    )
                                  }
                                  className="mt-2 w-full accent-green-500"
                                />
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                  {(
                                    [
                                      [1, "Niedrig"],
                                      [2, "Mittel"],
                                      [3, "Hoch"],
                                    ] as const
                                  ).map(([weight, weightLabel]) => (
                                    <button
                                      key={`edit-${requirement.id}-${key}-${weight}`}
                                      type="button"
                                      onClick={() =>
                                        setEditForm((current) =>
                                          updateFormWeight(current, key, weight),
                                        )
                                      }
                                      className={`rounded-lg border px-2 py-2 text-xs font-black transition ${
                                        editForm.weights[key] === weight
                                          ? "border-green-500 bg-green-500 text-white"
                                          : "border-neutral-200 bg-white text-neutral-700 hover:border-green-300 hover:bg-green-50"
                                      }`}
                                    >
                                      {weightLabel}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
                      <p className="text-sm font-black text-neutral-800">
                        Gesuchte Hauptfähigkeiten
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {getVisibleSkillOptions(form.position).map((skill) => {
                          const selected = form.requiredSkills.includes(skill);
                          const highlighted =
                            form.highlightedSkills.includes(skill);

                          if (!isEditing && !selected) {
                            return null;
                          }

                          return (
                            <div
                              key={`existing-skill-${requirement.id}-${skill}`}
                              className="flex overflow-hidden rounded-full border border-neutral-200 bg-neutral-50"
                            >
                              <button
                                type="button"
                                disabled={!isEditing}
                                onClick={() =>
                                  setEditForm((current) =>
                                    toggleFormSkill(
                                      current,
                                      "requiredSkills",
                                      skill,
                                    ),
                                  )
                                }
                                className={`px-4 py-2 text-sm font-black transition ${
                                  selected
                                    ? "bg-green-500 text-white"
                                    : "text-neutral-700 hover:bg-green-50 hover:text-green-700"
                                } disabled:cursor-default`}
                              >
                                {skill}
                              </button>
                              {selected && (
                                <button
                                  type="button"
                                  disabled={!isEditing}
                                  onClick={() =>
                                    setEditForm((current) =>
                                      toggleFormSkill(
                                        current,
                                        "highlightedSkills",
                                        skill,
                                      ),
                                    )
                                  }
                                  className={`border-l px-3 py-2 text-sm font-black transition ${
                                    highlighted
                                      ? "border-green-400 bg-neutral-950 text-white"
                                      : "border-green-400 bg-green-100 text-green-800 hover:bg-green-200"
                                  } disabled:cursor-default`}
                                  title="Besonders wichtig markieren"
                                >
                                  ★
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {!isEditing && form.requiredSkills.length === 0 && (
                        <p className="mt-2 text-sm font-semibold text-neutral-500">
                          Keine Hauptfähigkeiten hinterlegt.
                        </p>
                      )}
                    </div>

                    {isEditing ? (
                      <label className="mt-4 block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                          Beschreibung
                        </span>
                        <textarea
                          rows={2}
                          value={editForm.description}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-500/15"
                        />
                      </label>
                    ) : requirement.description ? (
                      <p className="mt-4 text-sm font-semibold text-neutral-600">
                        {requirement.description}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
