import { NavLink, Link } from "react-router-dom";

export default function NavBar() {
    return (
        <nav className="flex gap-2">
            <NavLink to="/" className={({isActive}) => isActive ? "text-blue-500" : ""}>Focustimer</NavLink>
            <NavLink to="/dashboard" className={({isActive}) => isActive ? "text-blue-500" : ""}>Dashboard</NavLink>
            <NavLink to="/settings" className={({isActive}) => isActive ? "text-blue-500" : ""}>Paramètres</NavLink>
        </nav>
    )
}