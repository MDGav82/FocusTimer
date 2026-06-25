import { useState } from "react";
import { type Task, TaskStatus } from "@/model/Task";
import { Pencil, Check, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface TasksProps {
  tasks: Task[];
  selectedTask: Task | null;
  onSelectTask: (id: Task | null) => void;
  onAddTask: (title: string, minutes: number) => void;
  onEditTask: (id: string, title: string, minutes: number) => void;
  onDeleteAll: () => void;
  onToggleComplete: (id: string) => void;
}

/** Whole minutes → MM:SS, the prominent number on each task row. */
function formatClock(minutes: number): string {
  const total = Math.max(0, Math.round(minutes ?? 0));
  return `${total.toString().padStart(2, "0")}:00`;
}

export function Tasks({
  tasks,
  selectedTask,
  onSelectTask,
  onAddTask,
  onEditTask,
  onDeleteAll,
  onToggleComplete,
}: TasksProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [titleInput, setTitleInput] = useState("");
  const [hoursInput, setHoursInput] = useState(0);
  const [minutesInput, setMinutesInput] = useState(25);

  const formatProgress = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatEstimation = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const openAddModal = () => {
    setTitleInput("");
    setHoursInput(0);
    setMinutesInput(25);
    setIsAddOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitleInput(task.title);
    setHoursInput(Math.floor((task.estimatedTime ?? 0) / 60));
    setMinutesInput((task.estimatedTime ?? 0) % 60);
  };

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;
    const totalMinutes = hoursInput * 60 + minutesInput;
    if (totalMinutes <= 0) return;
    onAddTask(titleInput, totalMinutes);
    setIsAddOpen(false);
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !titleInput.trim()) return;
    const totalMinutes = hoursInput * 60 + minutesInput;
    if (totalMinutes <= 0) return;
    onEditTask(editingTask.id, titleInput, totalMinutes);
    setEditingTask(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground">Liste des tâches</h3>
        {tasks.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteAll}
            className="text-destructive hover:bg-destructive/10 gap-1.5"
          >
            <Trash2 className="size-3.5" />
            Tout supprimer
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aucune tâche disponible. Ajoutez-en une !
          </p>
        ) : (
          tasks.map((task) => {
            const isSelected = task.id === selectedTask?.id;
            const isCompleted = task.status === TaskStatus.FINISHED;
            const progressPct =
              task.estimatedTime > 0
                ? Math.min(100, (task.timeSpent / (task.estimatedTime * 60)) * 100)
                : 0;

            return (
              <div
                key={task.id}
                onClick={() => !isCompleted && onSelectTask(isSelected ? null : task)}
                className={cn(
                  "rounded-full px-5 py-3.5 transition-all",
                  isCompleted
                    ? "bg-brand-yellow/20 cursor-default"
                    : isSelected
                    ? "bg-card ring-2 ring-brand-orange shadow-[0_8px_26px_rgb(0_0_0/0.10)] cursor-pointer"
                    : "bg-card ring-1 ring-border shadow-[0_6px_20px_rgb(0_0_0/0.06)] hover:shadow-[0_8px_24px_rgb(0_0_0/0.1)] cursor-pointer"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "font-display text-2xl font-bold tabular-nums tracking-tight shrink-0",
                      isCompleted
                        ? "text-muted-foreground"
                        : isSelected
                        ? "text-brand-orange"
                        : "text-foreground"
                    )}
                  >
                    {formatClock(task.estimatedTime)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "truncate font-medium",
                          isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                        )}
                      >
                        {task.title}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(task);
                        }}
                        aria-label="Modifier la tâche"
                        title="Modifier"
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        <Pencil className="size-4" />
                      </button>
                    </div>
                    {!isCompleted && task.timeSpent > 0 && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1 flex-1 max-w-[160px] rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-orange transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {formatProgress(task.timeSpent)} / {formatEstimation(task.estimatedTime)}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(task.id);
                    }}
                    aria-label={isCompleted ? "Marquer comme à faire" : "Marquer comme terminée"}
                    title={isCompleted ? "Annuler" : "Valider"}
                    className={cn(
                      "grid place-items-center size-9 rounded-full shrink-0 transition-all active:scale-90",
                      isCompleted
                        ? "bg-brand-orange text-white shadow-md shadow-brand-orange/30"
                        : isSelected
                        ? "border-2 border-brand-orange text-brand-orange hover:bg-brand-orange/10"
                        : "border-2 border-border text-muted-foreground hover:border-brand-orange hover:text-brand-orange"
                    )}
                  >
                    <Check className="size-5" strokeWidth={3} />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Add-task pill */}
        <button
          type="button"
          onClick={openAddModal}
          aria-label="Ajouter une tâche"
          className="w-full grid place-items-center rounded-full py-3.5 bg-card ring-1 ring-border shadow-[0_6px_20px_rgb(0_0_0/0.06)] text-muted-foreground hover:text-brand-orange hover:shadow-[0_8px_24px_rgb(0_0_0/0.1)] transition-all active:scale-[0.99]"
        >
          <Plus className="size-6" />
        </button>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Ajouter une tâche
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitAdd} className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground font-medium mb-1.5">
                Titre de la tâche
              </label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Ex: Écrire la documentation"
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground font-medium mb-1.5">
                Temps estimé
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-background border border-border rounded-xl px-3 py-1">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hoursInput}
                    onChange={(e) => setHoursInput(Number(e.target.value))}
                    className="w-full bg-transparent py-1 text-sm text-foreground focus:outline-none text-right pr-1 font-mono"
                  />
                  <span className="text-xs text-muted-foreground font-medium">h</span>
                </div>
                <div className="flex items-center bg-background border border-border rounded-xl px-3 py-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutesInput}
                    onChange={(e) => setMinutesInput(Number(e.target.value))}
                    className="w-full bg-transparent py-1 text-sm text-foreground focus:outline-none text-right pr-1 font-mono"
                  />
                  <span className="text-xs text-muted-foreground font-medium">m</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddOpen(false)}
                className="text-muted-foreground"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-brand-orange text-white hover:bg-brand-orange/90 font-bold"
              >
                Confirmer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Modifier la tâche
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground font-medium mb-1.5">
                Titre
              </label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground font-medium mb-1.5">
                Temps estimé
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-background border border-border rounded-xl px-3 py-1">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hoursInput}
                    onChange={(e) => setHoursInput(Number(e.target.value))}
                    className="w-full bg-transparent py-1 text-sm text-foreground focus:outline-none text-right pr-1 font-mono"
                  />
                  <span className="text-xs text-muted-foreground font-medium">h</span>
                </div>
                <div className="flex items-center bg-background border border-border rounded-xl px-3 py-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutesInput}
                    onChange={(e) => setMinutesInput(Number(e.target.value))}
                    className="w-full bg-transparent py-1 text-sm text-foreground focus:outline-none text-right pr-1 font-mono"
                  />
                  <span className="text-xs text-muted-foreground font-medium">m</span>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3 mt-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingTask(null)}
                className="text-muted-foreground"
              >
                Fermer
              </Button>
              <Button
                type="submit"
                className="bg-brand-orange text-white hover:bg-brand-orange/90 font-bold"
              >
                Sauvegarder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
