import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createAppRouter } from "../app/router";

const scenarioUuids = {
  active: "11111111-1111-4111-8111-111111111111",
  hiddenHistory: "66666666-6666-4666-8666-666666666666",
  hiddenContacts: "77777777-7777-4777-8777-777777777777",
  hiddenCargoPrice: "88888888-8888-4888-8888-888888888888",
  unauthorized: "00000000-0000-0000-0000-000000000401",
  unavailable: "00000000-0000-0000-0000-000000000503",
} as const;

function renderDetail(auctionUuid: string) {
  window.history.pushState({}, "", `/auctions/${auctionUuid}`);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={createAppRouter()} />
    </QueryClientProvider>,
  );
}

describe("AuctionDetailPage", () => {
  it("renders all detail sections and actions", async () => {
    renderDetail(scenarioUuids.active);

    expect(
      await screen.findByRole("heading", { name: "Аукцион AUC-001" }),
    ).toBeInTheDocument();
    [
      "Обзор",
      "Организатор",
      "Маршрут",
      "Груз",
      "Транспорт и требования",
      "Оплата",
      "Торги",
      "Погрузка",
      "Выгрузка",
    ].forEach((heading) => {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "Сделать ставку" }),
    ).toHaveAttribute("href", `/auctions/${scenarioUuids.active}/bid`);
    expect(
      screen.getByRole("button", { name: "История ставок" }),
    ).toHaveAttribute("href", `/auctions/${scenarioUuids.active}/bets`);
  });

  it("removes protected route and contact data", async () => {
    renderDetail(scenarioUuids.hiddenContacts);

    expect(
      await screen.findByText(
        "Точные адреса и контакты маршрутных точек скрыты организатором.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Контакты скрыты организатором.")).toBeInTheDocument();
    expect(screen.queryByText(/Склад 7/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+79005550000/)).not.toBeInTheDocument();
  });

  it("hides cargo price and bid-history actions when required", async () => {
    const cargoPriceView = renderDetail(scenarioUuids.hiddenCargoPrice);
    expect(
      await screen.findByText("Стоимость груза скрыта организатором."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Стоимость груза")).not.toBeInTheDocument();
    cargoPriceView.unmount();

    renderDetail(scenarioUuids.hiddenHistory);
    expect(
      await screen.findByText("История ставок скрыта организатором."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ставк/i }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["неверный UUID", "not-a-uuid", "Аукцион не найден"],
    [
      "неизвестный UUID",
      "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      "Аукцион не найден",
    ],
    [
      "недействительная сессия",
      scenarioUuids.unauthorized,
      "Тестовая сессия недействительна",
    ],
    [
      "недоступный сервис",
      scenarioUuids.unavailable,
      "Сервис временно недоступен",
    ],
  ])("renders a distinct state for %s", async (_, auctionUuid, title) => {
    renderDetail(auctionUuid);

    expect(
      await screen.findByRole(
        "heading",
        { name: title },
        { timeout: 3_000 },
      ),
    ).toBeInTheDocument();
  });
});
