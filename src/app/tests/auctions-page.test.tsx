import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { router } from "../router";

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("AuctionsPage", () => {
  it("renders the page title", async () => {
    window.history.pushState({}, "", "/auctions");
    renderPage();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /грузовые аукционы/i,
      }),
    ).toBeInTheDocument();
  });

  it("applies filters to the URL and resets the page", async () => {
    window.history.pushState({}, "", "/auctions?page=3&perPage=5");
    renderPage();

    const filters = await screen.findByRole("complementary", {
      name: "Фильтры аукционов",
    });
    fireEvent.change(within(filters).getByLabelText("Номер заявки"), {
      target: { value: "AUC-004" },
    });
    fireEvent.click(within(filters).getByLabelText("Победитель"));
    fireEvent.click(within(filters).getByLabelText("Принят"));
    fireEvent.click(within(filters).getByRole("button", { name: "Применить" }));

    await waitFor(() => {
      const parameters = new URLSearchParams(window.location.search);
      expect(parameters.get("page")).toBe("1");
      expect(parameters.get("cargoNum")).toBe("AUC-004");
      expect(parameters.get("perPage")).toBe("5");
      expect(parameters.get("status")).toBe("Winner,Accepted");
      expect(window.location.search).toContain("status=Winner,Accepted");
    });

    expect(
      await screen.findByRole("heading", { level: 2, name: "AUC-004" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "AUC-001" }),
    ).not.toBeInTheDocument();
  });

  it("preserves search state during pagination", async () => {
    window.history.pushState({}, "", "/auctions?perPage=5&sort=start_time_asc");
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Вперёд" }));

    await waitFor(() => {
      const parameters = new URLSearchParams(window.location.search);
      expect(parameters.get("page")).toBe("2");
      expect(parameters.get("perPage")).toBe("5");
      expect(parameters.get("sort")).toBe("start_time_asc");
    });
  });

  it("shows a distinct unauthorized state", async () => {
    window.history.pushState({}, "", "/auctions?cargoNum=scenario-401");
    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Тестовая сессия недействительна",
      }),
    ).toBeInTheDocument();
  });
});
