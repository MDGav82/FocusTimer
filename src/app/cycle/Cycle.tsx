import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Cycle as CycleModel } from "@/model/Cycle";
import { PeriodType, type Period } from "@/model/Period";

export type CycleWithPeriods = CycleModel & { periods: Period[] };

interface CycleProps {
  cycles: CycleWithPeriods[];
  currentCycle: CycleWithPeriods | undefined;
  currentPeriodIndex: number;
  onDeleteCycle?: (id: string) => void;
  onUpdateCycle?: (id: string, updatedPeriods: Period[], newName?: string) => void;
  onDuplicateCycle?: (id: string) => void;
  onCreateCycle?: () => void;
  onSelectCycle?: (id: string) => void;
  onSelectPeriodIndex?: (index: number) => void; // Nouvelle prop ajoutée ici
}

const PERIOD_LABELS: Record<PeriodType, string> = {
  [PeriodType.WORK]: "Travail",
  [PeriodType.REST]: "Pause",
};

export function Cycle({
  cycles,
  currentCycle,
  currentPeriodIndex,
  onDeleteCycle,
  onUpdateCycle,
  onDuplicateCycle,
  onCreateCycle,
  onSelectCycle,
  onSelectPeriodIndex // Récupération de la prop
}: CycleProps) {
  const currentCycleName = currentCycle?.name ?? "Aucun cycle actif";
  const periods = currentCycle?.periods ?? [];

  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [localPeriods, setLocalPeriods] = useState<Period[]>([]);
  const [localCycleName, setLocalCycleName] = useState<string>("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleStartEdit = (cycle: CycleWithPeriods) => {
    if (editingCycleId === cycle.id) {
      setEditingCycleId(null);
      setLocalPeriods([]);
      setLocalCycleName("");
    } else {
      setEditingCycleId(cycle.id);
      setLocalPeriods(cycle.periods ? [...cycle.periods] : []);
      setLocalCycleName(cycle.name ?? "");
    }
  };

  const handleUpdateCycleName = (newName: string) => {
    setLocalCycleName(newName);
    if (onUpdateCycle && editingCycleId !== null) {
      onUpdateCycle(editingCycleId, localPeriods, newName);
    }
  };

  const handleUpdatePeriodType = (idx: number, type: PeriodType) => {
    const updated = localPeriods.map((p: Period, i: number): Period => (i === idx ? { ...p, typePeriode: type } : p));
    setLocalPeriods(updated);
    if (onUpdateCycle && editingCycleId !== null) {
      onUpdateCycle(editingCycleId, updated, localCycleName);
    }
  };

  const handleUpdatePeriodTime = (idx: number, minutes: number) => {
    const updated = localPeriods.map((p: Period, i: number): Period => (i === idx ? { ...p, time: Math.max(0, minutes) * 60 } : p));
    setLocalPeriods(updated);
    if (onUpdateCycle && editingCycleId !== null) {
      onUpdateCycle(editingCycleId, updated, localCycleName);
    }
  };

  const handleDeletePeriod = (idx: number) => {
    const updated = localPeriods.filter((_, i) => i !== idx);
    setLocalPeriods(updated);
    if (onUpdateCycle && editingCycleId !== null) {
      onUpdateCycle(editingCycleId, updated, localCycleName);
    }
  };

  const handleAddPeriod = () => {
    if (editingCycleId === null) return;
    const newPeriod: Period = {
      id: crypto.randomUUID(),
      index: localPeriods.length,
      typePeriode: PeriodType.WORK,
      time: 25 * 60,
      cycle_id: editingCycleId,
      updatedAt: Date.now(),
      _syncStatus: 'synced',
    };
    const updated = [...localPeriods, newPeriod];
    setLocalPeriods(updated);
    if (onUpdateCycle) {
      onUpdateCycle(editingCycleId, updated, localCycleName);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...localPeriods];
    const draggedItem = updated[draggedIndex];
    if (draggedItem === undefined) return;

    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setLocalPeriods(updated);
    if (onUpdateCycle && editingCycleId !== null) {
      onUpdateCycle(editingCycleId, updated, localCycleName);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="bg-slate-800/40 border border-amber-500/20 p-5 rounded-2xl shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
            Cycle Actif
          </span>
          <h3 className="text-lg font-bold text-slate-100 mt-1">{currentCycleName}</h3>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition shadow-md shadow-amber-500/10 active:scale-95">
              Sélectionner un cycle
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-xl md:max-w-2xl lg:max-w-3xl">
            <DialogHeader className="flex flex-row items-center justify-between border-b border-slate-700/50 pb-4 pr-6">
              <div className="space-y-1">
                <DialogTitle className="text-base font-bold text-slate-100">Vos cycles</DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Choisissez le cycle de travail que vous souhaitez utiliser.
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateCycle?.()}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20 font-semibold transition active:scale-95"
              >
                Ajouter un cycle
              </Button>
            </DialogHeader>

            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {cycles && cycles.length > 0 ? (
                cycles.map((cycle) => {
                  const isActive = cycle.id === currentCycle?.id;
                  const isEditing = editingCycleId === cycle.id;

                  return (
                    <div key={cycle.id} className="flex flex-col gap-2">
                      <div
                        onClick={() => !isEditing && onSelectCycle?.(cycle.id)}
                        className={`bg-slate-900/40 border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                          isEditing
                            ? "border-amber-500/40 bg-slate-900/60"
                            : isActive
                            ? "border-amber-500/60 bg-slate-900/30 ring-1 ring-amber-500/20"
                            : "border-slate-700/50 hover:border-slate-600 cursor-pointer"
                        }`}
                      >
                        <div className="flex-1 space-y-5 self-stretch flex flex-col justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-200 align-top">{cycle.name}</h4>
                            {isActive && (
                              <span className="text-[9px] font-bold tracking-wider uppercase text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse">
                                Actif
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                            {cycle.periods?.map((p, idx) => {
                              const isWork = p.typePeriode === PeriodType.WORK;
                              const displayName = PERIOD_LABELS[p.typePeriode] ?? "Période";
                              const displayMinutes = p.time ? Math.round(p.time / 60) : 0;

                              return (
                                <div key={p.id ?? idx} className="flex items-center gap-2">
                                  <span
                                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium bg-slate-800/80 transition-all ${
                                      isWork ? "text-rose-400/90 border-rose-500/20" : "text-cyan-400/90 border-cyan-500/20"
                                    }`}
                                  >
                                    {displayName} : {displayMinutes}m
                                  </span>
                                  {idx < (cycle.periods?.length ?? 0) - 1 && (
                                    <span className="text-slate-600 text-[10px]">➔</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div
                          className="flex flex-col gap-2 w-full sm:w-36 shrink-0 sm:self-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDuplicateCycle?.(cycle.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 text-xs h-8 w-full transition active:scale-95"
                          >
                            Dupliquer le cycle
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEdit(cycle)}
                            className={`text-xs h-8 w-full transition ${
                              isEditing
                                ? "bg-amber-500 text-slate-950 border-amber-500 font-bold hover:bg-amber-400"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                            }`}
                          >
                            {isEditing ? "Fermer l'édition" : "Modifier le cycle"}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteCycle?.(cycle.id)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30 text-xs h-8 font-medium w-full justify-center shadow-sm"
                          >
                            Supprimer le cycle
                          </Button>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="bg-slate-900/20 border border-dashed border-slate-700 p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="flex flex-col gap-1.5 border-b border-slate-800 pb-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Nom du cycle
                            </label>
                            <input
                              type="text"
                              value={localCycleName}
                              onChange={(e) => handleUpdateCycleName(e.target.value)}
                              placeholder="Ex: Travail Intense, Routine douce..."
                              className="bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded-lg px-3 py-2 w-full focus:outline-none focus:border-amber-500/60 transition-all font-medium"
                            />
                          </div>

                          <div className="flex justify-between items-center pb-1">
                            <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider">
                              Configuration des périodes (Glisser-Déposer ☰ pour réordonner)
                            </span>
                          </div>

                          <div className="space-y-2">
                            {localPeriods.map((p, idx) => {
                              const displayMinutes = p.time ? Math.round(p.time / 60) : 0;

                              return (
                                <div
                                  key={p.id ?? idx}
                                  draggable
                                  onDragStart={() => handleDragStart(idx)}
                                  onDragOver={(e) => handleDragOver(e, idx)}
                                  onDragEnd={handleDragEnd}
                                  className={`flex items-center gap-3 bg-slate-800/60 border p-2.5 rounded-xl transition ${
                                    draggedIndex === idx ? "opacity-40 border-amber-500" : "border-slate-700/40"
                                  }`}
                                >
                                  <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 px-1 text-base select-none">
                                    ☰
                                  </div>

                                  <span className="text-[11px] font-mono text-slate-500 bg-slate-950/40 px-1.5 py-0.5 rounded">
                                    #{idx + 1}
                                  </span>

                                  <select
                                    value={p.typePeriode}
                                    onChange={(e) => handleUpdatePeriodType(idx, Number(e.target.value) as PeriodType)}
                                    className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500/50"
                                  >
                                    <option value={PeriodType.WORK}>Travail</option>
                                    <option value={PeriodType.REST}>Pause</option>
                                  </select>

                                  <div className="flex items-center gap-1.5 ml-auto">
                                    <input
                                      type="number"
                                      min="1"
                                      max="1440"
                                      value={displayMinutes}
                                      onChange={(e) => handleUpdatePeriodTime(idx, parseInt(e.target.value) || 0)}
                                      className="bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded-lg px-2 py-1 w-16 text-center focus:outline-none focus:border-amber-500/50"
                                    />
                                    <span className="text-xs text-slate-400 mr-2">min</span>
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePeriod(idx)}
                                    className="h-7 w-7 p-0 text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                    title="Supprimer la période"
                                  >
                                    ✕
                                  </Button>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex justify-center pt-1">
                            <Button
                              type="button"
                              onClick={handleAddPeriod}
                              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold px-4 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
                            >
                              <span className="text-sm font-extrabold">+</span> Ajouter une période
                            </Button>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-700 rounded-2xl bg-slate-900/20 my-2">
                  <div className="text-3xl mb-2">⏱️</div>
                  <h4 className="text-sm font-bold text-slate-300">Aucun cycle disponible</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4">
                    Vous avez supprimé tous vos profils de timers. Créez-en un nouveau pour recommencer.
                  </p>
                  <Button
                    onClick={() => onCreateCycle?.()}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition shadow-md shadow-amber-500/5"
                  >
                    + Créer un cycle de base
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/30 space-y-3">
        <span className="text-xs text-slate-400 font-semibold block">Timeline du cycle :</span>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {periods.length > 0 ? (
            periods.map((p, idx) => {
              const isCurrent = idx === currentPeriodIndex;
              const isWork = p.typePeriode === PeriodType.WORK;

              // Base de style interactif commun : curseur pointer, transition et effet au survol
              let badgeColor = "bg-slate-800 text-slate-400 border-slate-700 cursor-pointer hover:bg-slate-700/60 hover:text-slate-300 hover:scale-105 active:scale-95";

              if (isCurrent) {
                badgeColor = isWork
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/50 font-bold scale-105 cursor-default"
                  : "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 font-bold scale-105 cursor-default";
              }

              const displayName = PERIOD_LABELS[p.typePeriode] ?? "Période";
              const displayMinutes = p.time ? Math.round(p.time / 60) : 0;

              return (
                <div key={p.id ?? idx} className="flex items-center gap-2">
                  <span
                    onClick={() => !isCurrent && onSelectPeriodIndex?.(idx)} // Déclenche le changement si ce n'est pas le timer actif
                    className={`px-2.5 py-1 rounded-lg border transition-all duration-200 select-none ${badgeColor}`}
                  >
                    {displayName} ({displayMinutes}m)
                  </span>
                  {idx < periods.length - 1 && <span className="text-slate-600">➔</span>}
                </div>
              );
            })
          ) : (
            <span className="text-xs italic text-slate-500">Aucune période à afficher pour le moment</span>
          )}
        </div>
      </div>
    </div>
  );
}