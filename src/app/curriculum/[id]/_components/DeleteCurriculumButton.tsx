"use client";

import { useState } from "react";
import { deleteTemplate } from "@/domain/curriculum/actions";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteCurriculumButtonProps {
  readonly templateId: string;
}

export function DeleteCurriculumButton({ templateId }: DeleteCurriculumButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("¿Seguro que quieres eliminar este currículo? Esta acción no se puede deshacer y fallará si hay programaciones vinculadas directamente.")) return;
    setIsPending(true);
    const res = await deleteTemplate(templateId);
    if (res.ok) {
      router.push("/curriculum");
    } else {
      alert(res.error);
      setIsPending(false);
    }
  }

  return (
    <Button 
      variant="destructive" 
      size="sm" 
      onClick={handleDelete}
      disabled={isPending}
      className="opacity-70 hover:opacity-100 h-9"
      title="Eliminar Currículo"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}
