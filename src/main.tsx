import React from "react";
import ReactDOM from "react-dom/client";
import { AppProviders } from "./app/providers";
import "@picocss/pico/css/pico.min.css";
import "./styles.css";

async function startApplication() {
  if (import.meta.env.VITE_ENABLE_MSW !== "false") {
    const { startMockServer } = await import("./shared/mocks/browser");
    await startMockServer();
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <AppProviders />
    </React.StrictMode>,
  );
}

void startApplication();
