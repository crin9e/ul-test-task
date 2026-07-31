import React from "react";
import ReactDOM from "react-dom/client";
import { Application } from "./application";
import "@picocss/pico/css/pico.min.css";
import "./styles/global.css";

async function startApplication() {
  if (import.meta.env.VITE_ENABLE_MSW !== "false") {
    const { startMockServer } = await import("../shared/mocks");
    await startMockServer();
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Application />
    </React.StrictMode>,
  );
}

void startApplication();
