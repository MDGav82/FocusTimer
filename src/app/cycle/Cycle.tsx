import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import type {Cycle as CycleModel} from "@/model/Cycle";
import {type Period, PeriodType} from "@/model/Period";
import {PeriodRepository} from "@/storage/repositories";
import { PeriodEditor } from "@/app/cycle/PeriodEditor";

interface CycleProps {
  cycles: CycleModel[];
  currentCycle: CycleModel | null;
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
  onDeleteCycle,
  onUpdateCycle,
  onDuplicateCycle,
  onCreateCycle,
  onSelectCycle// Récupération de la prop
}: CycleProps) {
  const currentCycleName = currentCycle?.name ?? "Aucun cycle actif";

  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [localPeriods, setLocalPeriods] = useState<Period[]>([]);
  const [localCycleName, setLocalCycleName] = useState<string>("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  // Cache des périodes par cycle, car CycleModel ne contient pas les périodes
  const [periodsByCycle, setPeriodsByCycle] = useState<Record<string, Period[]>>({});

  // Charger les périodes pour tous les cycles fournis
  useEffect(() => {
    let active = true;
    (async () => {
      if (!cycles || cycles.length === 0) {
        if (active) setPeriodsByCycle({});
        return;
      }
      try {
        const entries = await Promise.all(
          cycles.map(async (c) => {
            const periods = await PeriodRepository.getPeriodsForCycle(c.id);
            return [c.id, periods] as const;
          })
        );
        if (!active) return;
        const map: Record<string, Period[]> = {};
        for (const [id, ps] of entries) map[id] = ps;
        setPeriodsByCycle(map);
      } catch {
        // en cas d'échec, ne bloque pas l'UI; l'édition chargera à la demande
      }
    })();
    return () => {
      active = false;
    };
  }, [cycles]);

  const handleStartEdit = (cycle: CycleModel) => {
    if (editingCycleId === cycle.id) {
      setEditingCycleId(null);
      setLocalPeriods([]);
      setLocalCycleName("");
    } else {
      setEditingCycleId(cycle.id);
      const cached = periodsByCycle[cycle.id];
      if (cached) {
        setLocalPeriods([...cached]);
      } else {
        // Charger à la demande si non présent dans le cache
        (async () => {
          const ps = await PeriodRepository.getPeriodsForCycle(cycle.id);
          setLocalPeriods([...ps]);
          setPeriodsByCycle((m) => ({ ...m, [cycle.id]: ps }));
        })();
      }
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

  const handleAddPeriod = async () => {
    if (editingCycleId === null) return;

    const newPeriod = await PeriodRepository.createPeriodForCycle(editingCycleId, {
      index: localPeriods.length,
      typePeriode: PeriodType.WORK,
      time: 25 * 60,
    })
    const updated = [...localPeriods, newPeriod];
    setLocalPeriods(updated);
    // tenir à jour le cache pour l'affichage de la liste/timeline
    setPeriodsByCycle((m) => ({ ...m, [editingCycleId]: updated }));
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

            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
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
                            {(periodsByCycle[cycle.id] ?? []).map((p, idx, arr) => {
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
                                  {idx < arr.length - 1 && (
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
                        <PeriodEditor
                          localCycleName={localCycleName}
                          periods={localPeriods}
                          draggedIndex={draggedIndex}
                          onChangeName={handleUpdateCycleName}
                          onChangeType={handleUpdatePeriodType}
                          onChangeTime={handleUpdatePeriodTime}
                          onDelete={handleDeletePeriod}
                          onAdd={handleAddPeriod}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDragEnd={handleDragEnd}
                        />
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
    </div>
  );
}