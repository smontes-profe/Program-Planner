"use client";

import { useState } from "react";
import { type EvaluationContextFull } from "@/domain/evaluation/types";
import { addStudent, deleteStudent, bulkImportStudents } from "@/domain/evaluation/actions";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, UserPlus, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface StudentsTabProps {
  readonly context: EvaluationContextFull;
}

export function StudentsTab({ context }: StudentsTabProps) {
  const [students, setStudents] = useState(context.students);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleAdd() {
    if (!newName.trim()) return;
    setIsPending(true);
    const res = await addStudent(context.id, { student_name: newName, student_email: newEmail || null });
    setIsPending(false);
    if (res.ok) {
      setStudents(prev => [...prev, res.data]);
      setNewName("");
      setNewEmail("");
      router.refresh();
    }
  }

  async function handleDelete(studentId: string) {
    setIsPending(true);
    const res = await deleteStudent(studentId);
    setIsPending(false);
    if (res.ok) {
      setStudents(prev => prev.filter(s => s.id !== studentId));
      router.refresh();
    }
  }

  async function handleBulkImport(csvText: string) {
    const lines = csvText.trim().split("\n").filter(l => l.trim());
    const students = lines.map(line => {
      const parts = line.split(",").map(p => p.trim());
      return { student_name: parts[0], student_email: parts[1] || null };
    });
    const res = await bulkImportStudents(context.id, students);
    if (res.ok) {
      setStudents(prev => [...prev, ...res.data]);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Alumnado</h2>
      </div>

      {/* Add student form */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Nombre completo"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-64"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Input
          placeholder="Email (opcional)"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="w-56"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={isPending || !newName.trim()} size="sm">
          {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
          Añadir
        </Button>
      </div>

      {/* Bulk import */}
      <BulkImportForm onImport={handleBulkImport} />

      {/* Student list */}
      {students.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 text-sm">
          <p>No hay alumnos en este contexto de evaluación.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <th className="text-left px-4 py-2.5 font-semibold text-zinc-600 dark:text-zinc-400">#</th>
                <th className="text-left px-4 py-2.5 font-semibold text-zinc-600 dark:text-zinc-400">Nombre</th>
                <th className="text-left px-4 py-2.5 font-semibold text-zinc-600 dark:text-zinc-400">Email</th>
                <th className="text-right px-4 py-2.5 font-semibold text-zinc-600 dark:text-zinc-400 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {students.map((s, i) => (
                <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                  <td className="px-4 py-2 text-zinc-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-zinc-900 dark:text-zinc-100">{s.student_name}</td>
                  <td className="px-4 py-2 text-zinc-500 text-xs">{s.student_email || "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={isPending}
                      className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                      title="Eliminar alumno"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Bulk Import Form ────────────────────────────────────────────────────────
function BulkImportForm({ onImport }: { onImport: (csv: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [csvText, setCsvText] = useState("");

  function handleImport() {
    if (csvText.trim()) {
      onImport(csvText);
      setCsvText("");
      setShowForm(false);
    }
  }

  if (!showForm) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
        <FileUp className="h-4 w-4 mr-1" />
        Importar desde CSV
      </Button>
    );
  }

  return (
    <div className="space-y-2 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
      <p className="text-xs text-zinc-500">Formato: una línea por alumno. Columnas: nombre, email (opcional).</p>
      <textarea
        rows={5}
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        placeholder={"Juan García, juan@email.com\nMaría López, maria@email.com\nPedro Sánchez"}
        className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleImport} disabled={!csvText.trim()}>
          <UserPlus className="h-4 w-4 mr-1" />
          Importar
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setCsvText(""); }}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
