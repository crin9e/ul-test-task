import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

const worker = setupWorker(...handlers);

export function startMockServer() {
  return worker.start({ onUnhandledRequest: "bypass" });
}
