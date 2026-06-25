import React from "react";
import { Button } from "@/components/ui/button";
import { PeriodType, type Period } from "@/model/Period";

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
    <div className="bg-slate-900/20 border border-dashed border-slate-700 p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex flex-col gap-1.5 border-b border-slate-800 pb-3">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nom du cycle</label>
        <input
          type="text"
          value={localCycleName}
          onChange={(e) => onChangeName(e.target.value)}
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
        {periods.map((p, idx) => {
          const displayMinutes = p.time ? Math.round(p.time / 60) : 0;

          return (
            <div
              key={p.id ?? idx}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={(e) => onDragOver(e, idx)}
              onDragEnd={onDragEnd}
              className={`flex items-center gap-3 bg-slate-800/60 border p-2.5 rounded-xl transition ${
                draggedIndex === idx ? "opacity-40 border-amber-500" : "border-slate-700/40"
              }`}
            >
              <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 px-1 text-base select-none">☰</div>

              <span className="text-[11px] font-mono text-slate-500 bg-slate-950/40 px-1.5 py-0.5 rounded">#{idx + 1}</span>

              <select
                value={p.typePeriode}
                onChange={(e) => onChangeType(idx, Number(e.target.value) as PeriodType)}
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
                  onChange={(e) => onChangeTime(idx, parseInt(e.target.value) || 0)}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded-lg px-2 py-1 w-16 text-center focus:outline-none focus:border-amber-500/50"
                />
                <span className="text-xs text-slate-400 mr-2">min</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(idx)}
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
          onClick={onAdd}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold px-4 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <span className="text-sm font-extrabold">+</span> Ajouter une période
        </Button>
      </div>
    </div>
  );
}

export default PeriodEditor;
