import { Outlet } from "react-router-dom";
import { LandingPage } from "./app/landing/LandingPage";
import NavBar from "./app/NavBar";
import "./index.css";

/**
 * Layout component fot the app, 
 * with a NavBar and an Outlet for the rendered pages
 */
export function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 antialiased font-sans">
      <NavBar/>
      <Outlet/>
    </div>
  );
}

export default App;