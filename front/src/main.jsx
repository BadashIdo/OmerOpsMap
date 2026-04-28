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

// StrictMode is intentionally NOT used: react-leaflet's MapContainer crashes
// under React 19's dev-mode double-invoke ("Map container is already initialized")
// because Leaflet stamps `_leaflet_id` on the DOM element and refuses to re-init.
// StrictMode is a dev-only no-op in production, so removing it has no runtime impact.
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
