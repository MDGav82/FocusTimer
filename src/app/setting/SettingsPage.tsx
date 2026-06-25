import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronRight, Trash2 } from "lucide-react";
import type { Parameters } from "@/model/Parameters";
import { UserRepository } from "@/storage/repositories";

type ParamsState = Pick<Parameters, "autoStartWork" | "autoStartRest" | "autoRestartCycle" | "notificationsOn">;

type AccountRow = { label: string };
type ToggleRow = { label: string; key: keyof ParamsState };

const ACCOUNT_ROWS: AccountRow[] = [
    { label: "Informations du compte" },
    { label: "Modifier mail" },
    { label: "Modifier mot de passe" },
];

const TOGGLE_ROWS: ToggleRow[] = [
    { label: "Notifications",                              key: "notificationsOn"    },
    { label: "Lancement automatique des chrono travail",  key: "autoStartWork"      },
    { label: "Lancement automatique des chrono pause",    key: "autoStartRest"      },
    { label: "Redémarrage automatique du cycle",          key: "autoRestartCycle"   },
];

export default function SettingsPage() {
    const [params, setParams] = useState<ParamsState>({
        notificationsOn:   true,
        autoStartWork:     false,
        autoStartRest:     false,
        autoRestartCycle:  false,
    });
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const meta = await UserRepository.getLastSessionMeta();
            const user = meta ? await UserRepository.getById(meta.lastUserId) : undefined;
            if (!cancelled) setIsAuthenticated(user?.email !== undefined);
        })().catch((e) => console.error("Failed to load current user", e));

        return () => { cancelled = true; };
    }, []);

    const toggle = (key: keyof typeof params) =>
        setParams(prev => ({ ...prev, [key]: !prev[key] }));

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6 py-6">
            <h1 className="text-2xl font-semibold text-slate-100">Paramètres</h1>

            <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-6 space-y-4">
                <h2 className="text-base font-medium text-slate-200">Paramètres</h2>

                {/* Account section */}
                {isAuthenticated && (
                    <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 overflow-hidden divide-y divide-slate-700/30">
                        {ACCOUNT_ROWS.map(({ label }) => (
                            <button
                                key={label}
                                className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/20 transition-colors"
                            >
                                <span>{label}</span>
                                <ChevronRight className="size-4 text-slate-500" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Preferences section */}
                <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 overflow-hidden divide-y divide-slate-700/30">
                    {TOGGLE_ROWS.map(({ label, key }) => (
                        <div key={key} className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm text-slate-300">{label}</span>
                            <Switch
                                checked={params[key]}
                                onCheckedChange={() => toggle(key)}
                            />
                        </div>
                    ))}

                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-rose-400">Suppression des données</span>
                        <Button variant="destructive" size="sm" className="gap-1.5">
                            <Trash2 className="size-3.5" />
                            Supprimer
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
