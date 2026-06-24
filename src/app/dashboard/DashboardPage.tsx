import { useEffect, useMemo, useState } from "react";
import { type Task, TaskStatus } from "@/model/Task";
import { UserRepository, TaskRepository } from "@/storage/repositories";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ReferenceLine } from "recharts";
import { CheckCircle2, Clock, Hourglass, PiggyBank } from "lucide-react";

const POMODORO_DURATION = 25 * 60;

type PeriodMode = "jour" | "semaine" | "mois";

/** estimatedTime is stored in minutes, timeSpent in seconds — see Task model. */
function estimatedSeconds(t: Task): number {
    return (t.estimatedTime ?? 0) * 60;
}

/** The date a task is attached to for period filtering. */
function taskDate(t: Task): Date {
    return t.startDate ?? t.creationDate;
}

type EstimationStatus = "respecté" | "surestimé" | "sous-estimé" | "non démarré";

function getEstimationStatus(estSec: number, spentSec: number): EstimationStatus {
    if (spentSec === 0) return "non démarré";
    if (estSec === 0) return "respecté";
    const ratio = spentSec / estSec;
    if (ratio < 0.8) return "surestimé";
    if (ratio > 1.2) return "sous-estimé";
    return "respecté";
}

const STATUS_COLOR: Record<EstimationStatus, string> = {
    "respecté": "text-emerald-400",
    "surestimé": "text-amber-400",
    "sous-estimé": "text-rose-400",
    "non démarré": "text-slate-500",
};

const STATUS_BAR_COLOR: Record<EstimationStatus, string> = {
    "respecté": "#10b981",
    "surestimé": "#f59e0b",
    "sous-estimé": "#f43f5e",
    "non démarré": "#475569",
};

const PIE_PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#a855f7", "#84cc16"];

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}`;
    return `${m}m`;
}

function formatHours(seconds: number): string {
    return `${(seconds / 3600).toFixed(1)}h`;
}

/** [start, end[ for the period containing `anchor` given the mode. */
function rangeFor(mode: PeriodMode, anchor: Date): [Date, Date] {
    const start = new Date(anchor);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);

    if (mode === "jour") {
        end.setDate(end.getDate() + 1);
    } else if (mode === "semaine") {
        const day = (start.getDay() + 6) % 7; // Monday = 0
        start.setDate(start.getDate() - day);
        end.setTime(start.getTime());
        end.setDate(end.getDate() + 7);
    } else {
        start.setDate(1);
        end.setTime(start.getTime());
        end.setMonth(end.getMonth() + 1);
    }
    return [start, end];
}

function toInputValue(d: Date): string {
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

export default function DashboardPage() {
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [mode, setMode] = useState<PeriodMode>("semaine");
    const [anchor, setAnchor] = useState<Date>(() => new Date());

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                // Read-only page: never create a user here (that's the landing page's job).
                const user = await UserRepository.getLastSessionUser();
                if (!user) {
                    if (!cancelled) {
                        setAllTasks([]);
                        setError("noSession");
                    }
                    return;
                }
                const tasks = await TaskRepository.getTasksForUser(user.id);
                if (!cancelled) {
                    setAllTasks(tasks);
                    setError(null);
                }
            } catch (e) {
                console.error("Dashboard load failed", e);
                if (!cancelled) setError(e instanceof Error ? e.message : String(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const [rangeStart, rangeEnd] = useMemo(() => rangeFor(mode, anchor), [mode, anchor]);

    const tasks = useMemo(
        () =>
            allTasks.filter((t) => {
                const d = taskDate(t);
                return d >= rangeStart && d < rangeEnd;
            }),
        [allTasks, rangeStart, rangeEnd]
    );

    const stats = useMemo(() => {
        const finished = tasks.filter((t) => t.status === TaskStatus.FINISHED);
        const totalSpent = tasks.reduce((acc, t) => acc + t.timeSpent, 0);
        const totalEstimated = tasks.reduce((acc, t) => acc + estimatedSeconds(t), 0);
        const spents = tasks.map((t) => t.timeSpent).filter((s) => s > 0);

        return {
            finished,
            successRate: tasks.length > 0 ? Math.round((finished.length / tasks.length) * 100) : 0,
            totalSpent,
            totalEstimated,
            saved: Math.max(0, totalEstimated - totalSpent),
            pomodoros: Math.floor(totalSpent / POMODORO_DURATION),
            avg: spents.length > 0 ? Math.round(spents.reduce((a, b) => a + b, 0) / spents.length) : 0,
            max: spents.length > 0 ? Math.max(...spents) : 0,
            min: spents.length > 0 ? Math.min(...spents) : 0,
        };
    }, [tasks]);

    // --- Completion donut ---
    const donutConfig: ChartConfig = {
        finished: { label: "Complétées", color: "#10b981" },
        pending: { label: "Restantes", color: "#334155" },
    };
    const donutData = [
        { name: "Complétées", value: stats.finished.length, fill: "var(--color-finished)" },
        { name: "Restantes", value: tasks.length - stats.finished.length, fill: "var(--color-pending)" },
    ];

    // --- Time-per-task pie ---
    const pieConfig: ChartConfig = { value: { label: "Temps" } };
    const pieData = tasks
        .filter((t) => t.timeSpent > 0)
        .map((t, i) => ({
            name: t.title,
            value: t.timeSpent,
            fill: PIE_PALETTE[i % PIE_PALETTE.length],
        }));

    // --- Estimation-difference bar chart (réel − estimé, en minutes) ---
    const barConfig: ChartConfig = { diff: { label: "Écart (min)" } };
    const barData = tasks
        .filter((t) => t.timeSpent > 0)
        .map((t) => {
            const status = getEstimationStatus(estimatedSeconds(t), t.timeSpent);
            return {
                name: t.title.length > 12 ? t.title.slice(0, 12) + "…" : t.title,
                diff: Math.round((t.timeSpent - estimatedSeconds(t)) / 60),
                fill: STATUS_BAR_COLOR[status],
            };
        });

    const rangeLabel = `${rangeStart.toLocaleDateString("fr-FR")} → ${new Date(
        rangeEnd.getTime() - 1
    ).toLocaleDateString("fr-FR")}`;

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6 py-6">
            {/* Header + period filter */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-100">Dashboard</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Complétion · <span className="text-slate-300">{rangeLabel}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-slate-700/50 overflow-hidden">
                        {(["jour", "semaine", "mois"] as PeriodMode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                                    mode === m
                                        ? "bg-cyan-500/20 text-cyan-300"
                                        : "text-slate-400 hover:bg-slate-800/60"
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                    <input
                        type="date"
                        value={toInputValue(anchor)}
                        onChange={(e) => e.target.value && setAnchor(new Date(e.target.value))}
                        className="bg-slate-900 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                    />
                </div>
            </div>

            {loading ? (
                <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-10 text-center text-sm text-slate-400">
                    Chargement…
                </div>
            ) : error === "noSession" ? (
                <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-10 text-center text-sm text-slate-400">
                    Aucune session locale trouvée. Ouvre d'abord la page d'accueil pour démarrer une session,
                    puis reviens ici.
                </div>
            ) : error ? (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-6 text-center text-sm text-rose-300">
                    Impossible de charger les tâches.
                    <span className="block mt-1 text-xs text-rose-400/70 font-mono">{error}</span>
                </div>
            ) : tasks.length === 0 ? (
                <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-10 text-center text-sm text-slate-400">
                    Aucune tâche sur cette période.
                </div>
            ) : (
                <>
                    {/* Block 1 — completion + headline KPIs */}
                    <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-6">
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            <div className="flex flex-col items-center gap-1 min-w-[168px]">
                                <span className="text-xs text-slate-400 mb-1">Tâches complétées</span>
                                <div className="relative">
                                    <ChartContainer config={donutConfig} className="h-[150px] w-[150px]">
                                        <PieChart>
                                            <Pie
                                                data={donutData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={46}
                                                outerRadius={66}
                                                dataKey="value"
                                                strokeWidth={0}
                                            >
                                                {donutData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                        </PieChart>
                                    </ChartContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className="text-2xl font-bold text-slate-100">
                                            {stats.successRate}%
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500">
                                    {stats.finished.length} / {tasks.length} tâches finies
                                </span>
                            </div>

                            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                                <KpiCard
                                    icon={<Clock className="size-3.5 text-violet-400" />}
                                    label="Travail au total"
                                    value={formatHours(stats.totalSpent)}
                                    hint={`${stats.pomodoros} pomodoros`}
                                />
                                <KpiCard
                                    icon={<Hourglass className="size-3.5 text-indigo-400" />}
                                    label="Travail estimé"
                                    value={formatHours(stats.totalEstimated)}
                                    hint="somme des estimations"
                                />
                                <KpiCard
                                    icon={<PiggyBank className="size-3.5 text-emerald-400" />}
                                    label="Temps économisé"
                                    value={formatHours(stats.saved)}
                                    hint="estimé − réel"
                                />
                                <KpiCard
                                    icon={<CheckCircle2 className="size-3.5 text-cyan-400" />}
                                    label="Tâches finies"
                                    value={String(stats.finished.length)}
                                    hint={`sur ${tasks.length} au total`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Block 2 — time per task + per-task stats */}
                    <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-6 space-y-5">
                        <h2 className="text-base font-medium text-slate-200">Temps passé par tâche</h2>
                        <div className="flex flex-col sm:flex-row gap-6 items-center">
                            {pieData.length > 0 ? (
                                <ChartContainer config={pieConfig} className="h-[180px] w-[180px]">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" strokeWidth={0}>
                                            {pieData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    </PieChart>
                                </ChartContainer>
                            ) : (
                                <div className="h-[180px] w-[180px] flex items-center justify-center text-xs text-slate-500">
                                    Pas encore de temps enregistré
                                </div>
                            )}

                            <div className="flex-1 grid grid-cols-1 gap-2 w-full">
                                <StatRow label="Temps moyen d'une tâche" value={formatDuration(stats.avg)} />
                                <StatRow label="Temps maximum sur une tâche" value={formatDuration(stats.max)} />
                                <StatRow label="Temps minimum sur une tâche" value={formatDuration(stats.min)} />
                            </div>
                        </div>
                    </div>

                    {/* Block 3 — estimation difference */}
                    <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-medium text-slate-200">Écart d'estimation</h2>
                            <div className="flex items-center gap-4 text-xs">
                                <span className="text-amber-400">▲ surestimé</span>
                                <span className="text-rose-400">▼ sous-estimé</span>
                            </div>
                        </div>

                        {barData.length > 0 ? (
                            <ChartContainer config={barConfig} className="h-[220px] w-full">
                                <BarChart data={barData} barCategoryGap="30%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} unit=" min" />
                                    <ReferenceLine y={0} stroke="#f43f5e" strokeWidth={1.5} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="diff" radius={[4, 4, 0, 0]}>
                                        {barData.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        ) : (
                            <p className="text-xs text-slate-500 text-center py-6">
                                Aucune tâche démarrée sur cette période.
                            </p>
                        )}

                        <div className="space-y-2">
                            {tasks.map((t) => {
                                const status = getEstimationStatus(estimatedSeconds(t), t.timeSpent);
                                const diffMin =
                                    t.timeSpent > 0 ? Math.round((t.timeSpent - estimatedSeconds(t)) / 60) : null;
                                return (
                                    <div
                                        key={t.id}
                                        className="rounded-lg border border-slate-700/40 bg-slate-800/40 px-4 py-2.5 flex items-center justify-between gap-4"
                                    >
                                        <div className="min-w-0">
                                            <span className="text-sm text-slate-200 truncate block">{t.title}</span>
                                            <span className="text-xs text-slate-500">
                                                {t.estimatedTime} min estimé · {formatDuration(t.timeSpent)} réel
                                            </span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`text-xs font-medium ${STATUS_COLOR[status]}`}>{status}</span>
                                            {diffMin !== null && (
                                                <div
                                                    className={`text-xs font-medium ${
                                                        diffMin > 0 ? "text-rose-400" : diffMin < 0 ? "text-amber-400" : "text-emerald-400"
                                                    }`}
                                                >
                                                    {diffMin > 0 ? `+${diffMin}` : diffMin} min
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function KpiCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
    return (
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
                {icon}
                <span className="text-xs text-slate-400">{label}</span>
            </div>
            <span className="text-2xl font-bold text-slate-100">{value}</span>
            <span className="text-xs text-slate-500">{hint}</span>
        </div>
    );
}

function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-lg bg-slate-800/40 border border-slate-700/40 px-4 py-2.5">
            <span className="text-sm text-slate-400">{label}</span>
            <span className="text-sm font-semibold text-slate-100 font-mono">{value}</span>
        </div>
    );
}
