import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import type {Cycle as CycleModel} from "@/model/Cycle";
import {type Period, PeriodType} from "@/model/Period";
import {PeriodRepository} from "@/storage/repositories";
import { PeriodEditor } from "@/app/cycle/PeriodEditor";
import { Timer as TimerIcon, Pause, Plus, Copy, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CycleProps {
  cycles: CycleModel[];
  currentCycle: CycleModel | null;
  /** Periods of the active cycle, in order — drives the inline timeline. */
  activePeriods: Period[];
  currentPeriodIndex: number;
  onDeleteCycle?: (id: string) => void;
  onUpdateCycle?: (id: string, updatedPeriods: Period[], newName?: string) => void;
  onDuplicateCycle?: (id: string) => void;
  onCreateCycle?: () => void;
  onSelectCycle?: (id: string) => void;
  onSelectPeriodIndex?: (index: number) => void;
}

const PERIOD_LABELS: Record<PeriodType, string> = {
  [PeriodType.WORK]: "Travail",
  [PeriodType.REST]: "Pause",
};

/** Whole seconds → MM:SS, matching the big timer display. */
function formatClock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds ?? 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** A single pill in the cycle timeline (work = stopwatch, break = pause). */
function PeriodChip({
  period,
  active,
  onClick,
}: {
  period: Period;
  active: boolean;
  onClick: () => void;
}) {
  const isWork = period.typePeriode === PeriodType.WORK;
  const Icon = isWork ? TimerIcon : Pause;
  return (
    <button
      type="button"
      onClick={onClick}
      title={PERIOD_LABELS[period.typePeriode]}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-lg font-semibold font-display tracking-tight transition-all active:scale-95",
        active
          ? isWork
            ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/30"
            : "bg-brand-blue text-white shadow-lg shadow-brand-blue/30"
          : "bg-card text-foreground ring-1 ring-border shadow-[0_6px_20px_rgb(0_0_0/0.06)] hover:shadow-[0_8px_26px_rgb(0_0_0/0.12)]"
      )}
    >
      <Icon className="size-5" {...(!isWork ? { fill: "currentColor" } : {})} />
      {formatClock(period.time)}
    </button>
  );
}

export function Cycle({
  cycles,
  currentCycle,
  activePeriods,
  currentPeriodIndex,
  onDeleteCycle,
  onUpdateCycle,
  onDuplicateCycle,
  onCreateCycle,
  onSelectCycle,
  onSelectPeriodIndex,
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
    <div className="space-y-5">
      {/* Cycle name + "Changer le cycle" (opens the selection dialog) */}
      <div className="flex items-center justify-end gap-3">
        <span className="text-lg font-semibold text-foreground">{currentCycleName}</span>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-brand-yellow text-brand-indigo hover:bg-brand-yellow/90 rounded-full px-4 h-9 text-sm font-semibold shadow-sm active:scale-95">
              Changer le cycle
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-card text-card-foreground border-border max-w-xl md:max-w-2xl lg:max-w-3xl">
            <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4 pr-6">
              <div className="space-y-1">
                <DialogTitle className="text-base font-bold text-foreground">Vos cycles</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Choisissez le cycle de travail que vous souhaitez utiliser.
                </DialogDescription>
              </div>
              <Button
                size="sm"
                onClick={() => onCreateCycle?.()}
                className="bg-brand-yellow text-brand-indigo hover:bg-brand-yellow/90 font-semibold gap-1.5 active:scale-95"
              >
                <Plus className="size-3.5" /> Ajouter un cycle
              </Button>
            </DialogHeader>

            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {cycles && cycles.length > 0 ? (
                cycles.map((cycle) => {
                  const isActive = cycle.id === currentCycle?.id;
                  const isEditing = editingCycleId === cycle.id;

                  return (
                    <div key={cycle.id} className="flex flex-col gap-2">
                      <div
                        onClick={() => !isEditing && onSelectCycle?.(cycle.id)}
                        className={cn(
                          "border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition",
                          isEditing
                            ? "border-brand-yellow/60 bg-brand-yellow/5"
                            : isActive
                            ? "border-brand-orange/50 bg-brand-orange/5 ring-1 ring-brand-orange/20"
                            : "border-border bg-secondary/40 hover:border-muted-foreground/40 cursor-pointer"
                        )}
                      >
                        <div className="flex-1 space-y-3 self-stretch flex flex-col justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground">{cycle.name}</h4>
                            {isActive && (
                              <span className="text-[9px] font-bold tracking-wider uppercase text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded border border-brand-orange/20">
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
                                    className={cn(
                                      "px-2.5 py-1 rounded-lg border text-[11px] font-medium",
                                      isWork
                                        ? "text-brand-orange border-brand-orange/30 bg-brand-orange/5"
                                        : "text-brand-blue border-brand-blue/30 bg-brand-blue/5"
                                    )}
                                  >
                                    {displayName} : {displayMinutes}m
                                  </span>
                                  {idx < arr.length - 1 && (
                                    <span className="text-muted-foreground text-[10px]">➔</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div
                          className="flex flex-col gap-2 w-full sm:w-40 shrink-0 sm:self-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDuplicateCycle?.(cycle.id)}
                            className="text-xs h-8 w-full gap-1.5 active:scale-95"
                          >
                            <Copy className="size-3.5" /> Dupliquer
                          </Button>

                          <Button
                            variant={isEditing ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleStartEdit(cycle)}
                            className={cn(
                              "text-xs h-8 w-full gap-1.5 active:scale-95",
                              isEditing && "bg-brand-yellow text-brand-indigo hover:bg-brand-yellow/90 font-semibold"
                            )}
                          >
                            <Pencil className="size-3.5" />
                            {isEditing ? "Fermer" : "Modifier"}
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDeleteCycle?.(cycle.id)}
                            className="text-xs h-8 w-full gap-1.5 active:scale-95"
                          >
                            <Trash2 className="size-3.5" /> Supprimer
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
                <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-2xl bg-secondary/40 my-2">
                  <TimerIcon className="size-8 text-brand-orange mb-2" />
                  <h4 className="text-sm font-bold text-foreground">Aucun cycle disponible</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-4">
                    Vous avez supprimé tous vos profils de timers. Créez-en un nouveau pour recommencer.
                  </p>
                  <Button
                    onClick={() => onCreateCycle?.()}
                    className="bg-brand-yellow text-brand-indigo hover:bg-brand-yellow/90 text-xs font-bold gap-1.5 active:scale-95"
                  >
                    <Plus className="size-3.5" /> Créer un cycle de base
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inline timeline of the active cycle's periods */}
      {activePeriods.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {activePeriods.map((period, idx) => (
            <PeriodChip
              key={period.id ?? idx}
              period={period}
              active={idx === currentPeriodIndex}
              onClick={() => onSelectPeriodIndex?.(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
