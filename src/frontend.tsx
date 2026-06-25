/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import "./styles/globals.css";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./app/dashboard/DashboardPage";
import ParamsPage from "./app/setting/SettingsPage";
import { LandingPage } from "./app/landing/LandingPage";
import { AuthPage } from "./app/auth/AuthPage";
import { TimerProvider } from "./app/landing/TimerContext";

// Check to avoid multiple calls
let hasStarted = false;

/**
 * 
 * Routes : 
 * - / : LandingPage
 * - /dashboard : DashboardPage
 * - /settings : SettingsPage
 */
function start() {
  if (hasStarted) return;
  hasStarted = true;
  const root = createRoot(document.getElementById("root")!);
  root.render(
  <BrowserRouter>
    <TimerProvider>
      <Routes>
        <Route element={<App />}>
          <Route index element={<LandingPage />}/>
          <Route path="dashboard" element={<DashboardPage />}/>
          <Route path="settings" element={<ParamsPage />}/>
          <Route path="authentification" element={<AuthPage />}/>
        </Route>
      </Routes>
    </TimerProvider>
  </BrowserRouter>);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
