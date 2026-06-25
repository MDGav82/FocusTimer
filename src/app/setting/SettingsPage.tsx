import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronRight, Trash2, Moon } from "lucide-react";
import type { Parameters } from "@/model/Parameters";
import { UserRepository } from "@/storage/repositories";
import { useTheme } from "@/hooks/useTheme";

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
    const { isDark, toggleTheme } = useTheme();
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
            <h1 className="text-2xl font-semibold text-foreground">Paramètres</h1>

            <div className="rounded-xl bg-card border border-border shadow-sm p-6 space-y-4">
                {/* Appearance */}
                <div className="rounded-lg bg-secondary/40 border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-foreground flex items-center gap-2">
                            <Moon className="size-4 text-muted-foreground" />
                            Mode sombre
                        </span>
                        <Switch checked={isDark} onCheckedChange={toggleTheme} />
                    </div>
                </div>

                {/* Account section */}
                {isAuthenticated && (
                    <div className="rounded-lg bg-secondary/40 border border-border overflow-hidden divide-y divide-border">
                        {ACCOUNT_ROWS.map(({ label }) => (
                            <button
                                key={label}
                                className="w-full flex items-center justify-between px-4 py-3 text-sm text-foreground hover:bg-secondary/80 transition-colors"
                            >
                                <span>{label}</span>
                                <ChevronRight className="size-4 text-muted-foreground" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Preferences section */}
                <div className="rounded-lg bg-secondary/40 border border-border overflow-hidden divide-y divide-border">
                    {TOGGLE_ROWS.map(({ label, key }) => (
                        <div key={key} className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm text-foreground">{label}</span>
                            <Switch
                                checked={params[key]}
                                onCheckedChange={() => toggle(key)}
                            />
                        </div>
                    ))}

                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-destructive">Suppression des données</span>
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
