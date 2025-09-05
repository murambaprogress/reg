import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";

const container = document.getElementById("root");
const root = createRoot(container);

// Temporary global hook so ErrorBoundary can surface stack/info to the dev console/terminal
root.render(<App />);
