import React from "react";
import ReactDOM from "react-dom/client";
import { AppProviders } from "./app/providers";
import { startMockServer } from "./shared/mocks/browser";
import "@picocss/pico/css/pico.min.css";
import "./styles.css";

startMockServer();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders />
  </React.StrictMode>,
);
