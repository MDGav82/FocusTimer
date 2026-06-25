import { NavLink } from "react-router-dom";
import { User, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

const LINKS = [
    { to: "/", label: "Focus timer", end: true },
    { to: "/dashboard", label: "Dashboard", end: false },
    { to: "/settings", label: "Paramètres", end: false },
] as const;

export default function NavBar() {
    const { isDark, toggleTheme } = useTheme();

    const linkStyles = ({ isActive }: { isActive: boolean }) =>
        cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200",
            isActive
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
        );

    return (
        <header className="w-full flex justify-center px-4 py-4 sticky top-0 z-50">
            <nav className="flex items-center gap-1 bg-card/90 backdrop-blur-md px-2 py-1.5 rounded-full ring-1 ring-border shadow-[0_8px_30px_rgb(0_0_0/0.08)]">
                {LINKS.map((link) => (
                    <NavLink key={link.to} to={link.to} end={link.end} className={linkStyles}>
                        {link.label}
                    </NavLink>
                ))}

                <NavLink to="/authentification" className={linkStyles}>
                    <span className="inline-flex items-center gap-1.5">
                        <User className="size-4" />
                        Compte
                    </span>
                </NavLink>

                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
                    title={isDark ? "Mode clair" : "Mode sombre"}
                    className="ml-1 grid size-9 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                    {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </button>
            </nav>
        </header>
    );
}
