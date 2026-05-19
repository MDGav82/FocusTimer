/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot } from "react-dom/client";
import { App } from "./App";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Check to avoid multiple calls
let hasStarted = false;

function start() {
  if (hasStarted) return;
  hasStarted = true;
  const root = createRoot(document.getElementById("root")!);
  root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}/>
    </Routes>
  </BrowserRouter>);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
