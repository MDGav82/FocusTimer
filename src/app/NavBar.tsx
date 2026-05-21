import { Link } from "react-router-dom";

export default function NavBar() {
    return (
        <nav>
            <Link to="/">Focustimer</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/settings">Paramètres</Link>
        </nav>
    )
}