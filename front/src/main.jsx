import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App.jsx";
import "./styles/globals.css";
import "leaflet/dist/leaflet.css";
import "./lib/leafletIcons";

// Fix mobile viewport height (handles Safari URL bar collapse)
const fixVh = () =>
  document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
fixVh();
window.addEventListener("resize", fixVh);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
