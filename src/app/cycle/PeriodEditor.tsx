import React from "react";
import { Button } from "@/components/ui/button";
import { PeriodType, type Period } from "@/model/Period";
import { GripVertical, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PeriodEditorProps {
  localCycleName: string;
  periods: Period[];
  draggedIndex: number | null;
  onChangeName: (name: string) => void;
  onChangeType: (index: number, type: PeriodType) => void;
  onChangeTime: (index: number, minutes: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

export function PeriodEditor({
  localCycleName,
  periods,
  draggedIndex,
  onChangeName,
  onChangeType,
  onChangeTime,
  onDelete,
  onAdd,
  onDragStart,
  onDragOver,
  onDragEnd,
}: PeriodEditorProps) {
  return (
    <div className="bg-secondary/40 border border-dashed border-border p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex flex-col gap-1.5 border-b border-border pb-3">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nom du cycle</label>
        <input
          type="text"
          value={localCycleName}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Ex: Travail Intense, Routine douce..."
          className="bg-background border border-border text-xs text-foreground rounded-lg px-3 py-2 w-full focus:outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20 transition-all font-medium"
        />
      </div>

      <div className="flex justify-between items-center pb-1">
        <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider">
          Configuration des périodes (glisser-déposer pour réordonner)
        </span>
      </div>

      <div className="space-y-2">
        {periods.map((p, idx) => {
          const displayMinutes = p.time ? Math.round(p.time / 60) : 0;

          return (
            <div
              key={p.id ?? idx}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={(e) => onDragOver(e, idx)}
              onDragEnd={onDragEnd}
              className={cn(
                "flex items-center gap-3 bg-card border p-2.5 rounded-xl transition",
                draggedIndex === idx ? "opacity-40 border-brand-orange" : "border-border"
              )}
            >
              <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground select-none">
                <GripVertical className="size-4" />
              </div>

              <span className="text-[11px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">#{idx + 1}</span>

              <select
                value={p.typePeriode}
                onChange={(e) => onChangeType(idx, Number(e.target.value) as PeriodType)}
                className="bg-background border border-border text-xs text-foreground rounded-lg px-2 py-1 focus:outline-none focus:border-brand-yellow"
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
                  onChange={(e) => onChangeTime(idx, parseInt(e.target.value) || 0)}
                  className="bg-background border border-border text-xs text-foreground rounded-lg px-2 py-1 w-16 text-center focus:outline-none focus:border-brand-yellow"
                />
                <span className="text-xs text-muted-foreground mr-2">min</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(idx)}
                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 rounded-lg transition"
                title="Supprimer la période"
              >
                <X className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center pt-1">
        <Button
          type="button"
          onClick={onAdd}
          className="bg-brand-yellow text-brand-indigo hover:bg-brand-yellow/90 text-xs font-bold gap-1.5 active:scale-95"
        >
          <Plus className="size-3.5" /> Ajouter une période
        </Button>
      </div>
    </div>
  );
}

export default PeriodEditor;
