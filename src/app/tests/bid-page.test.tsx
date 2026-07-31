import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Toaster } from "sonner";
import { describe, expect, it } from "vitest";
import { mockStore } from "../../shared/mocks";
import { createAppQueryClient } from "../query-client";
import { createAppRouter } from "../router";

const uuids = {
  firstBid: "11111111-1111-4111-8111-111111111111",
  leading: "22222222-2222-4222-8222-222222222222",
  blocked: "55555555-5555-4555-8555-555555555555",
} as const;

function renderBid(auctionUuid: string) {
  window.history.pushState({}, "", `/auctions/${auctionUuid}/bid`);
  const queryClient = createAppQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={createAppRouter()} />
      <Toaster />
    </QueryClientProvider>,
  );
}

describe("BidPage", () => {
  it("renders new/change context and blocks unavailable auctions", async () => {
    const firstBidView = renderBid(uuids.firstBid);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Сделать ставку" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Доступная цена")).toBeInTheDocument();
    firstBidView.unmount();

    const changeBidView = renderBid(uuids.leading);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Изменить ставку" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Цена с НДС")).toHaveValue(70_000);
    changeBidView.unmount();

    renderBid(uuids.blocked);
    expect(
      await screen.findByRole("heading", { name: "Приём ставок закрыт" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Подтвердить ставку" }),
    ).not.toBeInTheDocument();
  });

  it("shows local step validation and server 422 on the price field", async () => {
    renderBid(uuids.firstBid);
    const priceInput = await screen.findByLabelText("Цена с НДС");
    const submit = screen.getByRole("button", {
      name: "Подтвердить ставку",
    });

    fireEvent.change(priceInput, { target: { value: "10001" } });
    fireEvent.click(submit);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Цена должна соответствовать шагу 500.",
    );

    fireEvent.change(priceInput, { target: { value: "499500" } });
    fireEvent.click(submit);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Тестовая ставка отклонена организатором.",
      );
    });
    expect(await screen.findByText("Ошибка валидации")).toBeInTheDocument();
    expect(
      screen.getByText(/HTTP 422 · trace_id: mock-validation/),
    ).toBeInTheDocument();
  });

  it("submits once, invalidates data, and returns to updated detail", async () => {
    renderBid(uuids.firstBid);
    const priceInput = await screen.findByLabelText("Цена с НДС");
    const submit = screen.getByRole("button", {
      name: "Подтвердить ставку",
    });

    fireEvent.change(priceInput, { target: { value: "82500" } });
    fireEvent.click(submit);
    await waitFor(() => expect(submit).toBeDisabled());

    expect(
      await screen.findByRole("heading", { name: "Аукцион AUC-001" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Последняя ставка").parentElement,
    ).toHaveTextContent(/82.?500,00/);
    expect(
      mockStore.auctions.find((entry) => entry.uuid === uuids.firstBid)?.detail
        .trading.your?.last_bet,
    ).toBe(82_500);
  });

  it("does not navigate after the bid page unmounts", async () => {
    const view = renderBid(uuids.firstBid);
    const priceInput = await screen.findByLabelText("Цена с НДС");

    fireEvent.change(priceInput, { target: { value: "83000" } });
    fireEvent.click(screen.getByRole("button", { name: "Подтвердить ставку" }));
    view.unmount();

    await waitFor(() => {
      expect(
        mockStore.auctions.find((entry) => entry.uuid === uuids.firstBid)
          ?.detail.trading.your?.last_bet,
      ).toBe(83_000);
    });
    expect(window.location.pathname).toBe(`/auctions/${uuids.firstBid}/bid`);
  });
});
