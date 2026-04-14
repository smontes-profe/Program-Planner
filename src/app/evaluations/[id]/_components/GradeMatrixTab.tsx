"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type EvaluationContextFull, type InstrumentScore } from "@/domain/evaluation/types";
import type { TeachingPlanFull } from "@/domain/teaching-plan/types";
import { upsertInstrumentScore } from "@/domain/evaluation/actions";

interface GradeMatrixTabProps {
  readonly context: EvaluationContextFull;
  readonly plans: TeachingPlanFull[];
  readonly scores: InstrumentScore[];
  readonly scoreError?: string;
}

interface InstrumentColumn {
  instrumentId: string;
  instrumentName: string;
  instrumentType: string;
  planId: string;
  planTitle: string;
  unitLabel: string;
  ceEntries: {
    id: string;
    code: string;
    description: string;
    weight: number;
  }[];
  isAdvanced: boolean;
  hasUnits: boolean;
}

const scoreKey = (studentId: string, instrumentId: string, planCeId?: string | null) =>
  `${studentId}:${instrumentId}:${planCeId ?? "null"}`;

const buildScoreMap = (scores: InstrumentScore[]) => {
  const map: Record<string, string> = {};
  for (const score of scores) {
    const key = scoreKey(score.student_id, score.instrument_id, score.plan_ce_id);
    map[key] = score.score_value !== null ? score.score_value.toString() : "";
  }
  return map;
};

export function GradeMatrixTab({ context, plans, scores, scoreError }: GradeMatrixTabProps) {
  const [scoreValues, setScoreValues] = useState<Record<string, string>>(() => buildScoreMap(scores));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setScoreValues(buildScoreMap(scores));
    setErrors({});
  }, [scores]);

  const studentRows = useMemo(() => context.students.filter(s => s.active), [context.students]);

  const planGroups = useMemo(() => {
    return plans.map(plan => {
      const unitLookup = new Map<string, { code: string; trimester: string }>();
      (plan.units || []).forEach(unit => {
        unitLookup.set(unit.id, { code: unit.code, trimester: unit.trimester });
      });

      const ceLookup = new Map<string, { code: string; description: string }>();
      (plan.ras || []).forEach(ra => {
        (ra.ces || []).forEach(ce => {
          ceLookup.set(ce.id, { code: ce.code, description: ce.description });
        });
      });

      const columns: InstrumentColumn[] = (plan.instruments || []).map(instrument => {
        const unitLabels = Array.from(
          new Set(
            (instrument.unit_ids || [])
              .map(uid => unitLookup.get(uid))
              .filter(Boolean)
              .map(unit => `${unit?.code} (${unit?.trimester})`)
          )
        );

        const ceEntries = (instrument.ce_weights || [])
          .map(weight => {
            const ce = ceLookup.get(weight.plan_ce_id);
            if (!ce) return null;
            return {
              id: weight.plan_ce_id,
              code: ce.code,
              description: ce.description,
              weight: Number(weight.weight) || 0,
            };
          })
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

        const isAdvanced = ceEntries.length > 1;

        return {
          instrumentId: instrument.id,
          instrumentName: instrument.name,
          instrumentType: instrument.type,
          planId: plan.id,
          planTitle: `${plan.module_code} · ${plan.title}`,
          unitLabel: unitLabels.join(", "),
          ceEntries,
          isAdvanced,
          hasUnits: unitLabels.length > 0,
        };
      });

      return { plan, columns };
    });
  }, [plans]);

  const handleSave = useCallback(
    (key: string, studentId: string, instrumentId: string, planCeId: string | null) => {
      startTransition(() => {
        (async () => {
          const raw = scoreValues[key] ?? "";
          const normalized = raw.replace(",", ".").trim();
          let value: number | null = null;
          if (normalized !== "") {
            const parsed = Number(normalized);
            if (Number.isNaN(parsed)) {
              setErrors(prev => ({ ...prev, [key]: "Introduce un número válido" }));
              return;
            }
            if (parsed < 0 || parsed > 10) {
              setErrors(prev => ({ ...prev, [key]: "La nota debe estar entre 0 y 10" }));
              return;
            }
            value = parsed;
          }

          setErrors(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          setPendingKey(key);
          try {
            const result = await upsertInstrumentScore(context.id, {
              instrument_id: instrumentId,
              student_id: studentId,
              plan_ce_id: planCeId || null,
              score_value: value,
            });
            if (!result.ok) {
              setErrors(prev => ({ ...prev, [key]: result.error }));
              return;
            }
            setScoreValues(prev => ({
              ...prev,
              [key]: value === null ? "" : value.toString(),
            }));
          } finally {
            setPendingKey(null);
          }
        })();
      });
    },
    [context.id, scoreValues, startTransition]
  );

  const renderInstrumentCell = (instrument: InstrumentColumn, studentId: string) => {
    if (instrument.isAdvanced) {
      return (
        <div className="space-y-3">
          {instrument.ceEntries.map(ce => {
            const key = scoreKey(studentId, instrument.instrumentId, ce.id);
            const value = scoreValues[key] ?? "";
            const isSaving = pendingKey === key;
            return (
              <div key={ce.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 flex-1" title={ce.description}>
                    {ce.code} ({ce.weight.toFixed(0)}%)
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={value}
                      onChange={e => setScoreValues(prev => ({ ...prev, [key]: e.target.value }))}
                      onBlur={() => handleSave(key, studentId, instrument.instrumentId, ce.id)}
                    />
                  </div>
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />}
                </div>
                {errors[key] && (
                  <p className="text-rose-600 text-xs">{errors[key]}</p>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    const key = scoreKey(studentId, instrument.instrumentId, null);
    const value = scoreValues[key] ?? "";
    const isSaving = pendingKey === key;

    return (
      <>
        <div className="flex items-center gap-2">
          <Input
            className="min-w-[3rem]"
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={value}
            onChange={e => setScoreValues(prev => ({ ...prev, [key]: e.target.value }))}
            onBlur={() => handleSave(key, studentId, instrument.instrumentId, null)}
          />
          {isSaving && <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />}
        </div>
        {errors[key] && <p className="text-rose-600 text-xs mt-1">{errors[key]}</p>}
      </>
    );
  };

  if (studentRows.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 text-center text-zinc-500 dark:text-zinc-400">
        Añade alumnos para poder empezar a registrar notas desde la matriz.
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 text-center text-zinc-500 dark:text-zinc-400">
        Vincula una programación para que aparezcan instrumentos y poder introducir notas.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Matriz de notas</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Filas = alumnos, columnas = instrumentos (por módulo y UT). Edita la nota y se guarda automáticamente.
          </p>
        </div>
        {scoreError && (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 dark:border-rose-600 dark:bg-rose-900/40 dark:text-rose-200">
            No se pudieron cargar las notas ({scoreError})
          </div>
        )}
      </div>

      {planGroups.map(group => (
        <section key={group.plan.id}>
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {group.plan.academic_year}
              </p>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {group.plan.module_code} · {group.plan.title}
              </h3>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{group.columns.length} instrumento(s)</span>
          </div>

          {group.columns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Esta programación no tiene instrumentos definidos todavía.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
                    <th className="px-4 py-3">Alumno</th>
                    {group.columns.map(column => (
                      <th key={column.instrumentId} className="px-3 py-3">
                        <div className="text-xxs text-zinc-500 dark:text-zinc-400">
                          {column.unitLabel || "Unidad sin UT"}
                        </div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-50">{column.instrumentName}</div>
                        <div className="text-xxs text-zinc-500 dark:text-zinc-400">
                          {column.instrumentType}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {studentRows.map(student => (
                    <tr key={student.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900 dark:text-zinc-50">
                          {student.last_name ? `${student.last_name}, ` : ""}
                          {student.student_name}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{student.student_code || "—"}</div>
                      </td>
                      {group.columns.map(column => (
                        <td key={`${student.id}-${column.instrumentId}`} className="px-3 py-3 align-top">
                          {renderInstrumentCell(column, student.id)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
