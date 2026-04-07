"use client";

import { useState, useTransition } from "react";
import { type TeachingPlanFull, type PlanRA } from "@/domain/teaching-plan/types";
import { updatePlanRAConfig } from "@/domain/teaching-plan/actions";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeightsTabProps {
  readonly plan: TeachingPlanFull;
}

type Trimester = "t1" | "t2" | "t3";
const TRIMESTERS: { key: Trimester; label: string }[] = [
  { key: "t1", label: "T1" },
  { key: "t2", label: "T2" },
  { key: "t3", label: "T3" },
];

// ─── Computed Trimester Weights ──────────────────────────────────────────────
function computeTrimesterWeight(ras: PlanRA[], raId: string, trimester: Trimester): number | null {
  const activeKey = `active_${trimester}` as keyof PlanRA;
  const ra = ras.find((r) => r.id === raId);
  if (!ra || !ra[activeKey]) return null;

  const activeRAs = ras.filter((r) => r[activeKey]);
  const totalGlobal = activeRAs.reduce((sum, r) => sum + (Number(r.weight_global) || 0), 0);
  if (totalGlobal === 0) return null;

  return (Number(ra.weight_global) / totalGlobal) * 100;
}

// ─── Global Weight Input ─────────────────────────────────────────────────────
interface GlobalWeightInputProps {
  readonly planId: string;
  readonly ra: PlanRA;
}

function GlobalWeightInput({ planId, ra }: GlobalWeightInputProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [localValue, setLocalValue] = useState(String(Number(ra.weight_global) || 0));

  function handleBlur() {
    const num = Number.parseFloat(localValue);
    if (Number.isNaN(num) || num === Number(ra.weight_global)) return;
    const clamped = Math.min(100, Math.max(0, num));
    setLocalValue(String(clamped));

    startTransition(async () => {
      await updatePlanRAConfig(planId, ra.id, {
        weight_global: clamped,
        active_t1: ra.active_t1,
        active_t2: ra.active_t2,
        active_t3: ra.active_t3,
      });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      <input
        type="number"
        min={0}
        max={100}
        step={0.5}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className={cn(
          "w-20 rounded-md border px-2 py-1.5 text-right text-sm font-mono",
          "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900",
          "focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-shadow"
        )}
      />
      <span className="text-zinc-400 text-xs">%</span>
    </div>
  );
}

// ─── Trimester Cell ──────────────────────────────────────────────────────────
interface TrimesterCellProps {
  readonly planId: string;
  readonly ra: PlanRA;
  readonly trimester: Trimester;
  readonly computedWeight: number | null;
}

function TrimesterCell({ planId, ra, trimester, computedWeight }: TrimesterCellProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const activeKey = `active_${trimester}` as "active_t1" | "active_t2" | "active_t3";
  const isActive = ra[activeKey];

  function handleChange(checked: boolean) {
    startTransition(async () => {
      await updatePlanRAConfig(planId, ra.id, {
        weight_global: Number(ra.weight_global) || 0,
        active_t1: trimester === "t1" ? checked : ra.active_t1,
        active_t2: trimester === "t2" ? checked : ra.active_t2,
        active_t3: trimester === "t3" ? checked : ra.active_t3,
      });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <label className="flex items-center gap-1.5 cursor-pointer group">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => handleChange(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-emerald-600 accent-emerald-600 cursor-pointer"
        />
      </label>
      {isActive && computedWeight !== null ? (
        <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
          {computedWeight.toFixed(1)}%
        </span>
      ) : (
        <span className="text-xs text-zinc-300 dark:text-zinc-600">—</span>
      )}
    </div>
  );
}

// ─── Column status indicator ─────────────────────────────────────────────────
function GlobalTotal({ total }: { readonly total: number }) {
  const isOk = Math.abs(total - 100) < 0.1;
  const isEmpty = total === 0;

  let colorClass = "text-zinc-400";
  if (isOk) colorClass = "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400";
  else if (!isEmpty) colorClass = "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400";

  return (
    <div className={cn("flex items-center gap-1.5 justify-end text-sm font-bold px-2 py-1 rounded-md", colorClass)}>
      {isOk && <CheckCircle2 className="h-3.5 w-3.5" />}
      {!isOk && !isEmpty && <AlertTriangle className="h-3.5 w-3.5" />}
      {total.toFixed(1)}%
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function WeightsTab({ plan }: WeightsTabProps) {
  const ras = plan.ras ?? [];

  if (ras.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-400 text-sm">
        <p>Primero añade RAs en la pestaña <strong>Currículo</strong> para poder asignar pesos.</p>
      </div>
    );
  }

  const totalGlobal = ras.reduce((sum, ra) => sum + (Number(ra.weight_global) || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Resumen de Pesos</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Asigna el peso global de cada RA (debe sumar <strong>100%</strong>) y marca en qué trimestres se imparte.
          El porcentaje por trimestre se calcula automáticamente.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400 w-full">
                Resultado de Aprendizaje
              </th>
              <th className="text-right px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap min-w-[120px]">
                Global
              </th>
              {TRIMESTERS.map((t) => (
                <th
                  key={t.key}
                  className="text-center px-6 py-3 font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap min-w-[90px]"
                >
                  {t.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {ras.map((ra) => (
              <tr key={ra.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono font-bold text-zinc-400 text-xs shrink-0">RA {ra.code}</span>
                    <span className="text-zinc-700 dark:text-zinc-300 text-xs leading-snug line-clamp-2">
                      {ra.description}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <GlobalWeightInput planId={plan.id} ra={ra} />
                </td>
                {TRIMESTERS.map((t) => (
                  <td key={t.key} className="px-4 py-3 text-center">
                    <TrimesterCell
                      planId={plan.id}
                      ra={ra}
                      trimester={t.key}
                      computedWeight={computeTrimesterWeight(ras, ra.id, t.key)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/60">
              <td className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                Total Global
              </td>
              <td className="px-4 py-3 text-right">
                <GlobalTotal total={totalGlobal} />
              </td>
              {TRIMESTERS.map((t) => {
                const activeKey = `active_${t.key}` as keyof PlanRA;
                const activeCount = ras.filter((ra) => ra[activeKey]).length;
                return (
                  <td key={t.key} className="px-4 py-3 text-center">
                    <span className={cn(
                      "text-xs font-medium",
                      activeCount > 0 ? "text-zinc-500" : "text-zinc-300 dark:text-zinc-600"
                    )}>
                      {activeCount > 0 ? `${activeCount} RA${activeCount > 1 ? "s" : ""}` : "—"}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-zinc-400 italic">
        💡 Marca los trimestres en los que se imparte cada RA. El porcentaje por trimestre indica cuánto
        peso tiene ese RA <em>dentro de ese trimestre</em>, calculado proporcionalmente respecto a los
        otros RAs activos en él.
      </p>
    </div>
  );
}
