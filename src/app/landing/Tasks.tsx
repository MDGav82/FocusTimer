interface Task {
  id: number;
  title: string;
  status: string;
  estimated: number;
  actual: number;
}

interface TachesProps {
  tasks: Task[];
}

export function Taches({ tasks }: TachesProps) {
  return (
    <div className="bg-slate-800/40 border border-emerald-500/20 p-5 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          Liste des tâches
        </h3>
        <div className="flex gap-2">
          <button className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold px-3 py-1.5 rounded-xl transition">
            + Ajouter
          </button>
          <button className="text-rose-400/70 hover:text-rose-400 text-xs font-medium px-2 py-1.5 transition">
            Supprimer tout
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className="flex justify-between items-center p-4 bg-slate-900/40 rounded-xl border border-slate-700/40 hover:border-slate-600/60 transition group"
          >
            <div className="space-y-1">
              <h4 className="font-medium text-slate-200 text-sm group-hover:text-white transition">
                {task.title}
              </h4>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  task.status === "In Progress" ? "bg-amber-500/10 text-amber-400" : "bg-slate-700 text-slate-400"
                }`}>
                  {task.status}
                </span>
                <span>Progression : <strong className="text-slate-300">{task.actual}h</strong> / {task.estimated}h</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition">
                Détails
              </button>
              <button className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg shadow-md transition">
                Valider
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}