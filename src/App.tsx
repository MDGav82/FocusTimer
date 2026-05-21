import { Outlet } from "react-router-dom";
import { APITester } from "./APITester";

import logo from "./logo.svg";
import reactLogo from "./react.svg";
import NavBar from "./app/NavBar";

/**
 * Layout component fot the app, 
 * with a NavBar and an Outlet for the rendered pages
 */
export function App() {
  return (
    <div className="max-w-7xl mx-auto p-8 text-center relative z-10">
      <h1>FocusTimer</h1>
      <NavBar/>
      <Outlet/>
      <APITester />
    </div>
  );
}

export default App;
