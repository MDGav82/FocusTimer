import { useState } from "react";
import { type Task, Status } from "@/model/Task";

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
  selectedTaskId: number | null;
  onSelectTask: (id: number | null) => void;
  onAddTask: (title: string, minutes: number) => void;
  onEditTask: (id: number, title: string, minutes: number) => void;
  onDeleteAll: () => void;
  onToggleComplete: (id: number) => void;
}

export function Tasks({
  tasks,
  selectedTaskId,
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
    if (h > 0) return `${h}h ${m}m ${s}s`;
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

  const getStatusLabel = (status: Status) => {
    if (status === Status.FINISHED) return "Completed";
    if (status === Status.PROGRESS) return "In Progress";
    return "Todo";
  };

  return (
    <div className="bg-slate-800/40 border border-emerald-500/20 p-5 rounded-2xl shadow-xl relative">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          Liste des tâches
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openAddModal}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 font-semibold"
          >
            + Ajouter
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteAll}
            className="text-rose-400/70 hover:text-rose-400 font-medium"
          >
            Supprimer tout
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">
            Aucune tâche disponible. Ajoutez-en une !
          </p>
        ) : (
          tasks.map((task) => {
            const isSelected = task.id === selectedTaskId;
            const isCompleted = task.status === Status.FINISHED;

            return (
              <div
                key={task.id}
                className={`flex justify-between items-center p-4 rounded-xl border transition duration-200 ${
                  isSelected
                    ? "bg-slate-800 border-emerald-500/60 shadow-lg shadow-emerald-500/5"
                    : isCompleted
                    ? "bg-slate-900/20 border-slate-800 opacity-60"
                    : "bg-slate-900/40 border-slate-700/40 hover:border-slate-600/60"
                }`}
              >
                <div className="space-y-1.5">
                  <h4
                    className={`font-medium text-sm transition-all ${
                      isCompleted ? "line-through text-slate-500" : "text-slate-200"
                    }`}
                  >
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isCompleted
                          ? "bg-emerald-500/10 text-emerald-400"
                          : task.status === Status.PROGRESS
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {getStatusLabel(task.status)}
                    </span>
                    <span>
                      Progression :{" "}
                      <strong className="text-slate-200 font-mono">
                        {formatProgress(task.timeSpent ?? 0)}
                      </strong>{" "}
                      / {formatEstimation(task.estimatedTime ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(task)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                  >
                    Détails
                  </Button>

                  <Button
                    variant={isSelected ? "secondary" : "default"}
                    size="sm"
                    disabled={isCompleted}
                    onClick={() => onSelectTask(isSelected ? null : task.id)}
                    className={`font-semibold ${
                      isCompleted
                        ? ""
                        : isSelected
                        ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                    }`}
                  >
                    {isSelected ? "Sélectionnée" : "Sélectionner"}
                  </Button>

                  <Button
                    variant={isCompleted ? "outline" : "default"}
                    size="sm"
                    onClick={() => onToggleComplete(task.id)}
                    className={`font-semibold ${
                      isCompleted
                        ? "bg-slate-700/50 hover:bg-slate-700 text-slate-300 border-slate-600/30"
                        : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                    }`}
                  >
                    {isCompleted ? "Annuler" : "Valider"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-100">
              Ajouter une tâche
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitAdd} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Titre de la tâche
              </label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Ex: Écrire la documentation"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Temps estimé
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-1">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hoursInput}
                    onChange={(e) => setHoursInput(Number(e.target.value))}
                    className="w-full bg-transparent py-1 text-sm text-slate-200 focus:outline-none text-right pr-1 font-mono"
                  />
                  <span className="text-xs text-slate-500 font-medium">h</span>
                </div>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutesInput}
                    onChange={(e) => setMinutesInput(Number(e.target.value))}
                    className="w-full bg-transparent py-1 text-sm text-slate-200 focus:outline-none text-right pr-1 font-mono"
                  />
                  <span className="text-xs text-slate-500 font-medium">m</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:bg-slate-700/50"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
              >
                Confirmer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
-
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-100">
              Modifier la tâche
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Titre
              </label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Temps estimé
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-1">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hoursInput}
                    onChange={(e) => setHoursInput(Number(e.target.value))}
                    className="w-full bg-transparent py-1 text-sm text-slate-200 focus:outline-none text-right pr-1 font-mono"
                  />
                  <span className="text-xs text-slate-500 font-medium">h</span>
                </div>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutesInput}
                    onChange={(e) => setMinutesInput(Number(e.target.value))}
                    className="w-full bg-transparent py-1 text-sm text-slate-200 focus:outline-none text-right pr-1 font-mono"
                  />
                  <span className="text-xs text-slate-500 font-medium">m</span>
                </div>
              </div>
            </div>

            <DialogFooter className="bg-transparent border-t border-slate-700/50 pt-3 mt-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingTask(null)}
                className="text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
              >
                Fermer
              </Button>
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/10"
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