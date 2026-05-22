import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// Importation du modèle global Cycle
import { Cycle as CycleModel } from "@/model/Cycle";
import CycleSelect from "./CycleSelect";

interface CycleProps {
  currentCycle: CycleModel;
  currentPeriodIndex: number;
}

const PERIOD_LABELS: Record<string, string> = {
  work: "Travail",
  break: "Pause",
};

export function Cycle({ currentCycle, currentPeriodIndex }: CycleProps) {
  const currentCycleName = currentCycle?.name ?? "Cycle sans nom";
  const periods = currentCycle?.periods ?? [];

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
               <DialogContent>
            <DialogHeader>
              <DialogTitle>Vos cycles</DialogTitle>
              <DialogDescription>
                Choisissez le cycle de travail que vous souhaitez utiliser.
              </DialogDescription>
            </DialogHeader>
            <CycleSelect/>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Fermer</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/30 space-y-3">
        <span className="text-xs text-slate-400 font-semibold block">Timeline du cycle :</span>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {periods.map((p, idx) => {
            const isCurrent = idx === currentPeriodIndex;
            let badgeColor = "bg-slate-800 text-slate-400 border-slate-700";
            
            // Normalisation : si la chaîne contient "break", on la considère comme une pause globale
            let currentType = String(p.typePeriode || "");
            if (currentType.includes("break")) {
              currentType = "break";
            }

            // 2. Simplification des styles de badges (Travail vs Pause)
            if (isCurrent) {
              if (currentType === "work") {
                badgeColor = "bg-rose-500/20 text-rose-400 border-rose-500/50 font-bold scale-105";
              } else {
                badgeColor = "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 font-bold scale-105";
              }
            }

            const displayName = PERIOD_LABELS[currentType] || currentType || "Période";
            const displayMinutes = p.time ? Math.round(p.time / 60) : 0;

            return (
              <div key={p.id ?? idx} className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg border transition-all duration-300 ${badgeColor}`}>
                  {displayName} ({displayMinutes}m)
                </span>
                {idx < periods.length - 1 && <span className="text-slate-600">➔</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}