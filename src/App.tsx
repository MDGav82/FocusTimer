import { Outlet } from "react-router-dom";
import NavBar from "./app/NavBar";
import "./styles/globals.css";

/**
 * Layout component fot the app, 
 * with a NavBar and an Outlet for the rendered pages
 */
export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <NavBar/>
      <main className="px-4">
        <Outlet/>
      </main>
    </div>
  );
}

export default App;