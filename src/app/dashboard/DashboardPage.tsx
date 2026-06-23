import { type Task, TaskStatus } from "@/model/Task";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { CheckCircle2, Clock, Zap } from "lucide-react";

function makeMockTask(id: string, title: string, estimatedTime: number, timeSpent: number, status: TaskStatus): Task {
    const now = new Date();
    return {
        id, title, description: "", estimatedTime, creationDate: now, startDate: now, timeSpent, endDate: now, status,
        user_id: "mock-user", updatedAt: now.getTime(), _syncStatus: "synced",
    };
}

const MOCK_TASKS: Task[] = [
    makeMockTask("mock-1", "Conception UI",   90,  5700, TaskStatus.FINISHED),
    makeMockTask("mock-2", "Intégration API", 120, 6900, TaskStatus.FINISHED),
    makeMockTask("mock-3", "Tests unitaires", 60,  2100, TaskStatus.FINISHED),
    makeMockTask("mock-4", "Documentation",   45,  0,    TaskStatus.PENDING),
    makeMockTask("mock-5", "Refactoring",     30,  2520, TaskStatus.PENDING),
];

const POMODORO_DURATION = 25 * 60;

type EstimationStatus = "respecté" | "surestimé" | "sous-estimé" | "non démarré";

function getEstimationStatus(estimatedMin: number, timeSpentSec: number): EstimationStatus {
    if (timeSpentSec === 0) return "non démarré";
    const ratio = timeSpentSec / (estimatedMin * 60);
    if (ratio < 0.8) return "surestimé";
    if (ratio > 1.2) return "sous-estimé";
    return "respecté";
}

const STATUS_COLOR: Record<EstimationStatus, string> = {
    "respecté":    "text-emerald-400",
    "surestimé":   "text-amber-400",
    "sous-estimé": "text-rose-400",
    "non démarré": "text-slate-500",
};

const STATUS_BG: Record<EstimationStatus, string> = {
    "respecté":    "bg-emerald-500/10 border-emerald-500/30",
    "surestimé":   "bg-amber-500/10 border-amber-500/30",
    "sous-estimé": "bg-rose-500/10 border-rose-500/30",
    "non démarré": "bg-slate-800/40 border-slate-700/40",
};

const STATUS_BAR_COLOR: Record<EstimationStatus, string> = {
    "respecté":    "#10b981",
    "surestimé":   "#f59e0b",
    "sous-estimé": "#f43f5e",
    "non démarré": "#475569",
};

export default function DashboardPage() {
    const tasks = MOCK_TASKS;

    const finishedTasks = tasks.filter(t => t.status === TaskStatus.FINISHED);
    const successRate = tasks.length > 0
        ? Math.round((finishedTasks.length / tasks.length) * 100)
        : 0;

    const totalTimeSpent = tasks.reduce((acc, t) => acc + t.timeSpent, 0);
    const pomodorosCount = Math.floor(totalTimeSpent / POMODORO_DURATION);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    // --- Pie chart ---
    const pieConfig: ChartConfig = {
        finished: { label: "Finies",    color: "#10b981" },
        pending:  { label: "En attente", color: "#334155" },
    };
    const pieData = [
        { name: "Finies",             value: finishedTasks.length,               fill: "var(--color-finished)" },
        { name: "En cours / attente", value: tasks.length - finishedTasks.length, fill: "var(--color-pending)"  },
    ];

    // --- Bar chart ---
    const barConfig: ChartConfig = {
        "estimé": { label: "Estimé (min)", color: "#6366f1" },
        "réel":   { label: "Réel (min)",   color: "#10b981" },
    };
    const barData = tasks.map(t => ({
        name:     t.title.length > 12 ? t.title.slice(0, 12) + "…" : t.title,
        "estimé": t.estimatedTime,
        "réel":   Math.round(t.timeSpent / 60),
    }));

    // --- History table ---
    const historyRows = tasks.map(t => ({
        id:               t.id,
        title:            t.title,
        estimatedMin:     t.estimatedTime,
        realMin:          Math.round(t.timeSpent / 60),
        diffMin:          t.timeSpent > 0 ? Math.round(t.timeSpent / 60) - t.estimatedTime : null,
        percentage:       totalTimeSpent > 0 ? Math.round((t.timeSpent / totalTimeSpent) * 100) : 0,
        estimationStatus: getEstimationStatus(t.estimatedTime, t.timeSpent),
    }));

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6 py-6">
            <h1 className="text-2xl font-semibold text-slate-100">Dashboard</h1>

            {/* Block 1 — KPIs (success rate, pomodoros, focus time) */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start">

                    {/* Pie — success rate */}
                    <div className="flex flex-col items-center gap-1 min-w-[168px]">
                        <span className="text-xs text-slate-400 mb-1">Taux de réussite</span>
                        <div className="relative">
                            <ChartContainer config={pieConfig} className="h-[150px] w-[150px]">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={46}
                                        outerRadius={66}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {pieData.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                </PieChart>
                            </ChartContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold text-slate-100">{successRate}%</span>
                            </div>
                        </div>
                        <span className="text-xs text-slate-500">{finishedTasks.length} / {tasks.length} tâches finies</span>
                    </div>

                    {/* Stat cards */}
                    <div className="flex-1 grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-4 flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="size-3.5 text-emerald-400" />
                                <span className="text-xs text-slate-400">Tâches finies</span>
                            </div>
                            <span className="text-3xl font-bold text-slate-100">{finishedTasks.length}</span>
                            <span className="text-xs text-slate-500">sur {tasks.length} au total</span>
                        </div>

                        <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-4 flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                                <Zap className="size-3.5 text-cyan-400" />
                                <span className="text-xs text-slate-400">Pomodoros</span>
                            </div>
                            <span className="text-3xl font-bold text-slate-100">{pomodorosCount}</span>
                            <span className="text-xs text-slate-500">sessions de 25 min</span>
                        </div>

                        <div className="col-span-2 rounded-lg bg-slate-800/60 border border-slate-700/40 p-4 flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                                <Clock className="size-3.5 text-violet-400" />
                                <span className="text-xs text-slate-400">Temps total de focus</span>
                            </div>
                            <span className="text-3xl font-bold text-slate-100">{formatDuration(totalTimeSpent)}</span>
                            <span className="text-xs text-slate-500">temps de travail effectif</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Block 2 — Task history */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-6 space-y-5">
                <h2 className="text-base font-medium text-slate-200">Historique des tâches</h2>

                {/* Bar chart: estimated vs actual */}
                <ChartContainer config={barConfig} className="h-[220px] w-full">
                    <BarChart data={barData} barGap={4} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            unit=" min"
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="estimé" fill="var(--color-estimé)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="réel"   fill="var(--color-réel)"   radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>

                {/* Task rows */}
                <div className="space-y-2">
                    {historyRows.map(row => (
                        <div
                            key={row.id}
                            className={`rounded-lg border px-4 py-3 flex items-center gap-4 ${STATUS_BG[row.estimationStatus]}`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm text-slate-200 truncate">{row.title}</span>
                                    <span className={`text-xs font-medium ml-2 shrink-0 ${STATUS_COLOR[row.estimationStatus]}`}>
                                        {row.estimationStatus}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${row.percentage}%`,
                                                backgroundColor: STATUS_BAR_COLOR[row.estimationStatus],
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500 shrink-0">{row.percentage}% du total</span>
                                </div>
                            </div>

                            <div className="text-right shrink-0 hidden sm:block">
                                <div className="text-xs text-slate-400">{row.estimatedMin} min estimé</div>
                                {row.realMin > 0 && (
                                    <div className="text-xs text-slate-500">{row.realMin} min réel</div>
                                )}
                                {row.diffMin !== null && (
                                    <div className={`text-xs font-medium ${row.diffMin > 0 ? "text-rose-400" : row.diffMin < 0 ? "text-amber-400" : "text-emerald-400"}`}>
                                        {row.diffMin > 0 ? `+${row.diffMin}` : row.diffMin} min
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}