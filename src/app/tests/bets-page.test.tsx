import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createAppRouter } from "../router";

const uuids = {
  finished: "44444444-4444-4444-8444-444444444444",
  empty: "55555555-5555-4555-8555-555555555555",
  hidden: "66666666-6666-4666-8666-666666666666",
} as const;

function renderBets(auctionUuid: string, search = "") {
  window.history.pushState({}, "", `/auctions/${auctionUuid}/bets${search}`);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={createAppRouter()} />
    </QueryClientProvider>,
  );
}

describe("BetsPage", () => {
  it("renders bid fields, ranks, and unique participant count", async () => {
    renderBets(uuids.finished);

    expect(
      await screen.findByRole("heading", { name: "История ставок" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Участников:/)).toHaveTextContent("Участников: 2");
    expect(screen.getAllByText(/Место:/)).toHaveLength(2);
    expect(screen.getAllByText("Цена с НДС")).not.toHaveLength(0);
    expect(
      screen.queryByText(/Отклонена организатором/),
    ).not.toBeInTheDocument();
  });

  it("supports all=true and restores it from the URL", async () => {
    renderBets(uuids.finished);
    const includeHistorical = await screen.findByRole("switch");
    fireEvent.click(includeHistorical);

    expect(
      await screen.findByText("Причина отмены: Отклонена организатором"),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get("all")).toBe(
        "true",
      );
    });
  });

  it("renders empty and hidden states without exposing rows", async () => {
    const emptyView = renderBets(uuids.empty);
    expect(
      await screen.findByRole("heading", { name: "Ставок пока нет" }),
    ).toBeInTheDocument();
    emptyView.unmount();

    renderBets(uuids.hidden, "?all=true");
    expect(
      await screen.findByRole("heading", {
        name: "История ставок скрыта организатором",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByText("ООО Конкурент")).not.toBeInTheDocument();
  });
});
