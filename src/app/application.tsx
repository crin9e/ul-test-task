import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { appQueryClient } from "./query-client";
import { router } from "./router";

export function Application() {
  return (
    <QueryClientProvider client={appQueryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
