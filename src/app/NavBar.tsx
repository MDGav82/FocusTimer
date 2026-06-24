import { NavLink } from "react-router-dom";

export default function NavBar() {
    const linkStyles = ({ isActive }: { isActive: boolean }) => 
        `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive 
                ? "bg-[#1e293b] text-[#38bdf8] shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-[#1e293b]/50"
        }`;

    return (
        <header className="w-full flex justify-center items-center py-4 px-6 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-50">
            <nav className="flex items-center gap-4 bg-[#111827] px-4 py-1.5 rounded-xl border border-slate-800 shadow-lg">
                <NavLink to="/" className={linkStyles}>
                    Focustimer
                </NavLink>
                <NavLink to="/dashboard" className={linkStyles}>
                    Dashboard
                </NavLink>
                <NavLink to="/settings" className={linkStyles}>
                    Paramètres
                </NavLink>
                <NavLink to="/authentification" className={linkStyles}>
                    Créer un compte
                </NavLink>
            </nav>
        </header>
    );
}