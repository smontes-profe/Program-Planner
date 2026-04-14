import { getEvaluationContext, computeStudentGrades, listPublishedPlans } from "@/domain/evaluation/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MoveLeft, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EvalTabs } from "./_components/EvalTabs";

interface EvalDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EvalDetailPage({ params }: EvalDetailPageProps) {
  const { id } = await params;
  const result = await getEvaluationContext(id);

  if (!result.ok || !result.data) return notFound();

  const context = result.data;
  const gradesResult = await computeStudentGrades(id);
  const publishedPlansResult = await listPublishedPlans();

  const statusLabels = {
    draft: "Borrador",
    active: "Activo",
    closed: "Cerrado",
  };
  const statusVariants = {
    draft: "neutral" as const,
    active: "success" as const,
    closed: "neutral" as const,
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col gap-6">
        {/* Top bar */}
        <div className="flex justify-between items-start">
          <Link
            href="/evaluations"
            className="flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            <MoveLeft className="mr-2 h-4 w-4" />
            Evaluaciones
          </Link>
          <Badge variant={statusVariants[context.status]}>{statusLabels[context.status]}</Badge>
        </div>

        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {context.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-500 text-sm font-medium mt-2">
            <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {context.academic_year}
            </span>
            {context.plans.length > 0 && (
              <>
                <span>•</span>
                <span className="text-xs text-zinc-400">
                  {context.plans.length} módulo{context.plans.length > 1 ? "s" : ""}: {context.plans.map(p => p.module_code).join(", ")}
                </span>
              </>
            )}
            <span>•</span>
            <span className="text-xs text-zinc-400">
              {context.students.length} alumno{context.students.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Tab content */}
        <EvalTabs
          context={context}
          gradesResult={gradesResult.ok ? gradesResult.data : null}
          availablePlans={publishedPlansResult.ok ? publishedPlansResult.data : []}
        />
      </div>
    </div>
  );
}
