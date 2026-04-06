"use client";

import { useState } from "react";
import { deleteCE } from "@/domain/curriculum/actions";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteCEButtonProps {
  readonly templateId: string;
  readonly ceId: string;
}

export function DeleteCEButton({ templateId, ceId }: DeleteCEButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Seguro que quieres eliminar este Criterio de Evaluación?")) return;
    setIsPending(true);
    await deleteCE(templateId, ceId);
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDelete}
      disabled={isPending}
      className="h-6 w-6 text-zinc-400 hover:text-destructive hover:bg-destructive/10 transition-colors"
      title="Eliminar CE"
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
    </Button>
  );
}
