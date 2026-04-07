"use client";

import { useState } from "react";
import { type TeachingPlanFull, type PlanRA } from "@/domain/teaching-plan/types";
import {
  addPlanRA, updatePlanRA, deletePlanRA,
  addPlanCE, updatePlanCE, deletePlanCE,
} from "@/domain/teaching-plan/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, Edit2, Trash2, Loader2, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

interface CurriculumTabProps {
  readonly plan: TeachingPlanFull;
}

// ─── shared form textarea className ──────────────────────
const textareaClass = "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:border-zinc-800";

// ─── Add RA Button ─────────────────────────────────────────
function AddRAButton({ planId }: { readonly planId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    const form = e.currentTarget;
    const res = await addPlanRA(planId, {
      code: (form.elements.namedItem("code") as HTMLInputElement).value,
      description: (form.elements.namedItem("description") as HTMLTextAreaElement).value,
    });
    setIsPending(false);
    if (res.ok) { setOpen(false); router.refresh(); }
    else setError(res.error);
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); setError(""); }}>
      <SheetTrigger>
        <div
          id="add-ra-plan-button"
          className="flex shrink-0 items-center justify-center rounded-lg border border-border bg-background h-8 gap-1.5 px-2.5 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Añadir RA
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="bg-white dark:bg-zinc-950">
        <SheetHeader>
          <SheetTitle>Añadir RA</SheetTitle>
          <SheetDescription>Añade un Resultado de Aprendizaje a esta programación.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-6 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="ra-code">Código</Label>
            <Input id="ra-code" name="code" placeholder="RA1" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ra-description">Descripción</Label>
            <textarea id="ra-description" name="description" rows={4} required className={textareaClass} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar RA"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Edit RA Button ────────────────────────────────────────
function EditRAButton({ planId, ra }: { readonly planId: string; readonly ra: PlanRA }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    const form = e.currentTarget;
    const res = await updatePlanRA(planId, ra.id, {
      code: (form.elements.namedItem("code") as HTMLInputElement).value,
      description: (form.elements.namedItem("description") as HTMLTextAreaElement).value,
    });
    setIsPending(false);
    if (res.ok) { setOpen(false); router.refresh(); }
    else setError(res.error);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <div className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-emerald-600 hover:bg-emerald-600/10 transition-colors cursor-pointer" title="Editar RA">
          <Edit2 className="h-4 w-4" />
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="bg-white dark:bg-zinc-950">
        <SheetHeader>
          <SheetTitle>Editar RA</SheetTitle>
          <SheetDescription>Modifica este Resultado de Aprendizaje.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-6 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="edit-ra-code">Código</Label>
            <Input id="edit-ra-code" name="code" defaultValue={ra.code} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-ra-description">Descripción</Label>
            <textarea id="edit-ra-description" name="description" rows={4} defaultValue={ra.description} required className={textareaClass} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Cambios"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Delete RA Button ──────────────────────────────────────
function DeleteRAButton({ planId, raId }: { readonly planId: string; readonly raId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar este RA y todos sus criterios?")) return;
    setIsPending(true);
    const res = await deletePlanRA(planId, raId);
    if (res.ok) router.refresh();
    else { alert(res.error); setIsPending(false); }
  }

  return (
    <button onClick={handleDelete} disabled={isPending} title="Eliminar RA"
      className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-600/10 transition-colors">
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}

// ─── Add CE Button ─────────────────────────────────────────
function AddCEButton({ planId, raId }: { readonly planId: string; readonly raId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    const form = e.currentTarget;
    const res = await addPlanCE(planId, raId, {
      code: (form.elements.namedItem("code") as HTMLInputElement).value,
      description: (form.elements.namedItem("description") as HTMLTextAreaElement).value,
    });
    setIsPending(false);
    if (res.ok) { setOpen(false); router.refresh(); }
    else setError(res.error);
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); setError(""); }}>
      <SheetTrigger>
        <span className="text-[11px] text-zinc-500 hover:text-primary flex items-center gap-1 font-bold tracking-tight uppercase transition-colors cursor-pointer">
          <Plus className="h-3 w-3" /> Añadir Criterio
        </span>
      </SheetTrigger>
      <SheetContent side="right" className="bg-white dark:bg-zinc-950">
        <SheetHeader>
          <SheetTitle>Añadir Criterio</SheetTitle>
          <SheetDescription>Añade un Criterio de Evaluación a este RA.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-6 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="ce-code">Código</Label>
            <Input id="ce-code" name="code" placeholder="a" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ce-description">Descripción</Label>
            <textarea id="ce-description" name="description" rows={4} required className={textareaClass} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Criterio"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Edit CE Button ────────────────────────────────────────
function EditCEButton({ planId, ce }: { readonly planId: string; readonly ce: { id: string; code: string; description: string } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    const form = e.currentTarget;
    const res = await updatePlanCE(planId, ce.id, {
      code: (form.elements.namedItem("code") as HTMLInputElement).value,
      description: (form.elements.namedItem("description") as HTMLTextAreaElement).value,
    });
    setIsPending(false);
    if (res.ok) { setOpen(false); router.refresh(); }
    else setError(res.error);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <div className="h-6 w-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-emerald-600 hover:bg-emerald-600/10 transition-colors cursor-pointer" title="Editar CE">
          <Edit2 className="h-3 w-3" />
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="bg-white dark:bg-zinc-950">
        <SheetHeader>
          <SheetTitle>Editar Criterio</SheetTitle>
          <SheetDescription>Modifica este Criterio de Evaluación.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-6 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="edit-ce-code">Código</Label>
            <Input id="edit-ce-code" name="code" defaultValue={ce.code} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-ce-description">Descripción</Label>
            <textarea id="edit-ce-description" name="description" rows={4} defaultValue={ce.description} required className={textareaClass} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Cambios"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Delete CE Button ──────────────────────────────────────
function DeleteCEButton({ planId, ceId }: { readonly planId: string; readonly ceId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar este criterio?")) return;
    setIsPending(true);
    const res = await deletePlanCE(planId, ceId);
    if (res.ok) router.refresh();
    else { alert(res.error); setIsPending(false); }
  }

  return (
    <button onClick={handleDelete} disabled={isPending} title="Eliminar CE"
      className="h-6 w-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-600/10 transition-colors">
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
    </button>
  );
}

// ─── Main Tab ──────────────────────────────────────────────
export function CurriculumTab({ plan }: CurriculumTabProps) {
  const hasRAs = plan.ras && plan.ras.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Resultados de Aprendizaje
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Clon editable del currículo base. Los cambios solo afectan a esta programación.
          </p>
        </div>
        <AddRAButton planId={plan.id} />
      </div>

      {hasRAs ? (
        <div className="space-y-6">
          {plan.ras.map((ra) => (
            <Card key={ra.id} className="border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-none hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="bg-zinc-50 px-6 py-3 flex justify-between items-center border-b border-zinc-100 dark:bg-zinc-900/50 dark:border-zinc-800">
                <span className="text-lg font-bold font-mono text-zinc-400">RA {ra.code}</span>
                <div className="flex items-center gap-1">
                  <EditRAButton planId={plan.id} ra={ra} />
                  <DeleteRAButton planId={plan.id} raId={ra.id} />
                </div>
              </div>
              <CardContent className="pt-4 space-y-4">
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">{ra.description}</p>

                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Criterios de Evaluación
                    </h4>
                    <AddCEButton planId={plan.id} raId={ra.id} />
                  </div>

                  {ra.ces && ra.ces.length > 0 ? (
                    <div className="grid gap-2">
                      {ra.ces.map((ce) => (
                        <div key={ce.id} className="group p-3 bg-white border border-zinc-100 rounded-lg flex gap-4 dark:bg-zinc-950 dark:border-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors">
                          <div className="font-mono text-zinc-400 text-sm font-bold pt-0.5">{ce.code}</div>
                          <div className="flex-1">
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{ce.description}</p>
                          </div>
                          <div className="flex items-start gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <EditCEButton planId={plan.id} ce={ce} />
                            <DeleteCEButton planId={plan.id} ceId={ce.id} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No hay criterios definidos para este RA.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-zinc-50/50 border-dashed border-2 dark:bg-zinc-900/20 py-12 flex flex-col items-center justify-center border-zinc-200 dark:border-zinc-800">
          <BookOpen className="h-10 w-10 text-zinc-300 mb-3" />
          <p className="text-zinc-500 mb-4 font-medium text-sm">No hay RAs en esta programación.</p>
          <AddRAButton planId={plan.id} />
        </Card>
      )}
    </div>
  );
}
