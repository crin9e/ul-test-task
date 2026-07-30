import { delay, http, HttpResponse } from "msw";
import type {
  AuctionListRequest,
  AuctionListResponseBase,
  BetItem,
  ProblemDetail,
  ValidationProblem,
} from "../api/types";
import {
  CURRENT_USER_SUBSCRIBER_ID,
  mockStore,
  type MockAuctionEntry,
  UNAUTHORIZED_AUCTION_UUID,
  UNAVAILABLE_AUCTION_UUID,
} from "./store";

const MOCK_LATENCY_MS = 40;
const PROBLEM_CONTENT_TYPE = { "Content-Type": "application/problem+json" };

const auctionStatusIds = {
  Planning: 1,
  Auction: 2,
  DeterminateWinner: 3,
  WaitDeal: 4,
  InProgress: 5,
  Finished: 6,
  Stopped: 7,
} as const;

const tradingStatusIds = {
  NotParticipating: 1,
  Leading: 2,
  Losing: 3,
  Winner: 4,
  Confirmed: 5,
} as const;

function createProblemResponse(status: number, problem: ProblemDetail) {
  return HttpResponse.json(problem, {
    status,
    headers: PROBLEM_CONTENT_TYPE,
  });
}

function createValidationResponse(
  field: string,
  message: string,
  code: string,
) {
  const problem: ValidationProblem = {
    code: "validation_failed",
    title: "Ошибка валидации",
    message: "Запрос содержит некорректные поля.",
    trace_id: "mock-validation",
    errors: [{ field, message, code }],
  };

  return HttpResponse.json(problem, {
    status: 422,
    headers: PROBLEM_CONTENT_TYPE,
  });
}

function unauthorizedResponse() {
  return createProblemResponse(401, {
    code: "unauthorized",
    title: "Не авторизован",
    message: "Тестовая сессия недействительна.",
    trace_id: "mock-401",
  });
}

function notFoundResponse() {
  return createProblemResponse(404, {
    code: "resource_not_found",
    title: "Не найдено",
    message: "Аукцион не найден.",
    trace_id: "mock-404",
  });
}

function unavailableResponse() {
  return createProblemResponse(503, {
    code: "service_unavailable",
    title: "Сервис временно недоступен",
    message: "Тестовый upstream временно недоступен.",
    trace_id: "mock-503",
  });
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function includesText(
  value: string | undefined,
  query: string | undefined,
): boolean {
  if (!query) {
    return true;
  }
  return (value ?? "")
    .toLocaleLowerCase("ru-RU")
    .includes(query.toLocaleLowerCase("ru-RU"));
}

function isWithinRange(
  value: number | null | undefined,
  from: number | null | undefined,
  to: number | null | undefined,
): boolean {
  if (from === undefined && to === undefined) {
    return true;
  }
  if (value === null || value === undefined) {
    return false;
  }
  return (
    (from === null || from === undefined || value >= from) &&
    (to === null || to === undefined || value <= to)
  );
}

function isWithinDateRange(
  value: string | undefined,
  from: string | undefined,
  to: string | undefined,
): boolean {
  if (!from && !to) {
    return true;
  }
  if (!value) {
    return false;
  }
  const timestamp = Date.parse(value);
  return (
    (!from || timestamp >= Date.parse(from)) &&
    (!to || timestamp <= Date.parse(to))
  );
}

function matchesArray<T>(
  value: T | undefined,
  accepted: T[] | undefined,
): boolean {
  return !accepted?.length || (value !== undefined && accepted.includes(value));
}

function matchesListRequest(
  entry: MockAuctionEntry,
  request: AuctionListRequest,
): boolean {
  const { listItem, detail } = entry;
  const main = listItem.main;
  const organizer = listItem.organizer;
  const route = listItem.route;
  const cargo = listItem.cargo;
  const trading = listItem.trading;
  const payment = listItem.payment;
  const currentPrice = trading?.price?.current;
  const pricePerKm = main?.price_per_km;
  const detailTradingStatus = detail.trading.status_mobile;
  const auctionStatusId = detail.trading.status
    ? auctionStatusIds[detail.trading.status as keyof typeof auctionStatusIds]
    : undefined;
  const tradingStatusId = detailTradingStatus
    ? tradingStatusIds[detailTradingStatus as keyof typeof tradingStatusIds]
    : undefined;
  const customerQuery = request.customer?.toLocaleLowerCase("ru-RU");
  const customerMatches =
    !customerQuery ||
    (organizer?.organization_name ?? "")
      .toLocaleLowerCase("ru-RU")
      .includes(customerQuery) ||
    (organizer?.organization_inn ?? "").includes(customerQuery);

  return (
    matchesArray(detailTradingStatus, request.status) &&
    (!request.mobile_statuses?.length ||
      (tradingStatusId !== undefined &&
        request.mobile_statuses.includes(tradingStatusId))) &&
    (!request.statuses?.length ||
      (auctionStatusId !== undefined &&
        request.statuses.includes(auctionStatusId))) &&
    includesText(main?.cargo_num, request.cargo_num) &&
    isWithinRange(cargo?.weight, request.weight_from, request.weight_to) &&
    isWithinRange(cargo?.volume, request.volume_from, request.volume_to) &&
    (!request.body_types?.length ||
      (cargo?.body_type !== undefined &&
        request.body_types.includes(cargo.body_type))) &&
    (!request.form_type || payment?.form === request.form_type) &&
    (request.is_international_shipment === undefined ||
      cargo?.is_international === request.is_international_shipment) &&
    includesText(route?.load?.city, request.load_city) &&
    (request.load_gc_id === undefined ||
      route?.load?.city_gc_id === request.load_gc_id) &&
    includesText(route?.unload?.city, request.unload_city) &&
    (request.unload_gc_id === undefined ||
      route?.unload?.city_gc_id === request.unload_gc_id) &&
    isWithinDateRange(
      route?.load?.date,
      request.load_date_from,
      request.load_date_to,
    ) &&
    isWithinDateRange(
      route?.unload?.date,
      request.unload_date_from,
      request.unload_date_to,
    ) &&
    isWithinDateRange(
      main?.created_at,
      request.create_date_from,
      request.create_date_to,
    ) &&
    isWithinDateRange(
      trading?.start_time,
      request.start_time_from,
      request.start_time_to,
    ) &&
    isWithinDateRange(
      trading?.stop_time,
      request.stop_time_from,
      request.stop_time_to,
    ) &&
    (request.is_available === undefined ||
      trading?.is_available === request.is_available) &&
    (request.is_favorite === undefined ||
      trading?.is_favorite === request.is_favorite) &&
    (request.is_bidder === undefined ||
      trading?.is_bidder === request.is_bidder) &&
    customerMatches &&
    (!request.customer_ids?.length ||
      (organizer?.organization_id !== undefined &&
        request.customer_ids.includes(organizer.organization_id))) &&
    (!request.auction_ids?.length ||
      (main?.id !== undefined && request.auction_ids.includes(main.id))) &&
    isWithinRange(
      currentPrice,
      request.current_price_from,
      request.current_price_to,
    ) &&
    isWithinRange(
      pricePerKm,
      request.price_per_km_from,
      request.price_per_km_to,
    ) &&
    (!request.auc_type?.length ||
      (main?.auc_type !== undefined &&
        request.auc_type.includes(
          main.auc_type as Exclude<typeof main.auc_type, "Unknown">,
        )))
  );
}

type SortValue = number | string | null | undefined;

function compareValues(
  left: SortValue,
  right: SortValue,
  direction: "asc" | "desc",
): number {
  if (left === null || left === undefined) {
    return right === null || right === undefined ? 0 : 1;
  }
  if (right === null || right === undefined) {
    return -1;
  }
  const result =
    typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left).localeCompare(String(right), "ru-RU");
  return direction === "asc" ? result : -result;
}

function sortEntries(
  entries: MockAuctionEntry[],
  request: AuctionListRequest,
): MockAuctionEntry[] {
  const supportedSelectors = {
    start_time: (entry: MockAuctionEntry) => entry.listItem.trading?.start_time,
    current_price: (entry: MockAuctionEntry) =>
      entry.listItem.trading?.price?.current,
    price_per_km: (entry: MockAuctionEntry) =>
      entry.listItem.main?.price_per_km,
  } as const;

  const sortRules = Object.entries(request.sort ?? {}).filter(
    (rule): rule is [keyof typeof supportedSelectors, "asc" | "desc"] =>
      rule[0] in supportedSelectors &&
      (rule[1] === "asc" || rule[1] === "desc"),
  );

  if (!sortRules.length && request.is_oldest !== undefined) {
    sortRules.push(["start_time", request.is_oldest ? "asc" : "desc"]);
  }

  return [...entries].sort((left, right) => {
    for (const [field, direction] of sortRules) {
      const result = compareValues(
        supportedSelectors[field](left),
        supportedSelectors[field](right),
        direction,
      );
      if (result !== 0) {
        return result;
      }
    }
    return (left.listItem.main?.id ?? 0) - (right.listItem.main?.id ?? 0);
  });
}

function buildListResponse(
  entries: MockAuctionEntry[],
  request: AuctionListRequest,
): AuctionListResponseBase {
  const page = request.page ?? 1;
  const perPage = request.per_page ?? 20;
  const offset = (page - 1) * perPage;
  const pageEntries = entries.slice(offset, offset + perPage);
  const total = entries.length;

  return {
    data: pageEntries.map((entry) => entry.listItem),
    meta: {
      current_page: page,
      from: pageEntries.length ? offset + 1 : 0,
      last_page: Math.max(1, Math.ceil(total / perPage)),
      per_page: perPage,
      to: pageEntries.length ? offset + pageEntries.length : 0,
      total,
    },
  };
}

function findAuction(auctionUuid: string): MockAuctionEntry | undefined {
  return mockStore.auctions.find((entry) => entry.uuid === auctionUuid);
}

function isHistoricalBet(bet: BetItem): boolean {
  return bet.is_rejected === true || Boolean(bet.cancel_reason?.trim());
}

function getBetPrice(bet: BetItem): number {
  return bet.price_with_vat ?? 0;
}

function isAscendingAuction(entry: MockAuctionEntry): boolean {
  return entry.detail.main.auc_type !== "Up";
}

function recalculateRanking(entry: MockAuctionEntry): void {
  const activeBets = entry.bets
    .filter((bet) => !isHistoricalBet(bet))
    .sort((left, right) => {
      const difference = getBetPrice(left) - getBetPrice(right);
      return isAscendingAuction(entry) ? difference : -difference;
    });

  entry.bets.forEach((bet) => {
    if (isHistoricalBet(bet)) {
      bet.place = null;
      bet.is_win = false;
      return;
    }
    bet.place = activeBets.indexOf(bet) + 1;
    bet.is_win = false;
  });
}

function decimalScale(values: number[]): number {
  const precision = Math.min(
    8,
    Math.max(
      ...values.map((value) => (String(value).split(".")[1] ?? "").length),
    ),
  );
  return 10 ** precision;
}

function followsStep(price: number, base: number, step: number): boolean {
  const scale = decimalScale([price, base, step]);
  const priceUnits = Math.round(price * scale);
  const baseUnits = Math.round(base * scale);
  const stepUnits = Math.round(step * scale);
  return stepUnits > 0 && (priceUnits - baseUnits) % stepUnits === 0;
}

function createUserBet(entry: MockAuctionEntry, price: number): BetItem {
  const nextId =
    Math.max(
      0,
      ...mockStore.auctions.flatMap((auction) =>
        auction.bets.map((bet) => bet.id ?? 0),
      ),
    ) + 1;
  const priceNoVat = Math.round((price / 1.2) * 100) / 100;

  return {
    id: nextId,
    created_at: `2026-07-01T12:${String(nextId % 60).padStart(2, "0")}:00+03:00`,
    auction_id: entry.detail.main.id,
    subscriber_id: CURRENT_USER_SUBSCRIBER_ID,
    contact_name: "Иван Иванов",
    contact_phone: "+79001234567",
    price_with_vat: price,
    price_no_vat: priceNoVat,
    organization_id: 113,
    organization_inn: "7700000013",
    organization_name: "ООО Текущий перевозчик",
    transporter_comment: null,
    is_rejected: false,
    is_counter: false,
    place: null,
    is_win: false,
    run_number: 0,
    cancel_reason: "",
    price_info: {
      price_with_vat: price,
      price_no_vat: priceNoVat,
      payment_type: "Безналичная с НДС",
      vat_rate: "20",
    },
  };
}

function updateAuctionAfterBid(entry: MockAuctionEntry, price: number): void {
  const existingBet = entry.bets.find(
    (bet) =>
      bet.subscriber_id === CURRENT_USER_SUBSCRIBER_ID && !isHistoricalBet(bet),
  );
  const nextBet = createUserBet(entry, price);

  if (existingBet) {
    Object.assign(existingBet, nextBet, { id: existingBet.id });
  } else {
    entry.bets.push(nextBet);
  }

  recalculateRanking(entry);

  const userBet = entry.bets.find(
    (bet) =>
      bet.subscriber_id === CURRENT_USER_SUBSCRIBER_ID && !isHistoricalBet(bet),
  );
  const activeBets = entry.bets.filter((bet) => !isHistoricalBet(bet));
  const bestBet = activeBets.find((bet) => bet.place === 1);
  const currentPrice = bestBet?.price_with_vat ?? price;
  const currentPriceNoVat = Math.round((currentPrice / 1.2) * 100) / 100;
  const isLeading = userBet?.place === 1;
  const nextTradingStatus = isLeading ? "Leading" : "Losing";
  const detailPrice = entry.detail.trading.price;
  const step = detailPrice?.step;
  const minimum = detailPrice?.min;
  const maximum = detailPrice?.max;
  const availablePrice = step
    ? isAscendingAuction(entry)
      ? Math.max(minimum ?? 0, currentPrice - step)
      : Math.min(maximum ?? Number.POSITIVE_INFINITY, currentPrice + step)
    : currentPrice;

  entry.detail.trading.status_mobile = nextTradingStatus;
  entry.detail.trading.is_bidder = true;
  entry.detail.trading.your = {
    ...entry.detail.trading.your,
    bet: true,
    last_bet: price,
    last_bet_with_vat: price,
    win: false,
  };
  entry.detail.trading.price = {
    ...detailPrice,
    current: currentPrice,
    current_no_vat: currentPriceNoVat,
    available: availablePrice,
    available_no_vat: Math.round((availablePrice / 1.2) * 100) / 100,
  };

  entry.listItem.trading = {
    ...entry.listItem.trading,
    status_mobile: nextTradingStatus,
    is_bidder: true,
    price: {
      ...entry.listItem.trading?.price,
      current: currentPrice,
      current_no_vat: currentPriceNoVat,
    },
    your: {
      bet: true,
      last_bet: price,
    },
  };
  entry.listItem.main = {
    ...entry.listItem.main,
    price_per_km: entry.detail.cargo.distance
      ? Math.round((currentPriceNoVat / entry.detail.cargo.distance) * 100) /
        100
      : 0,
  };
}

async function maybeDelay(): Promise<void> {
  await delay(MOCK_LATENCY_MS);
}

export const handlers = [
  http.post("/api/v1/auctions/list", async ({ request }) => {
    await maybeDelay();
    const body = await readJsonBody(request);
    if (body !== null && !isRecord(body)) {
      return createValidationResponse(
        "body",
        "Тело запроса должно быть объектом.",
        "invalid_type",
      );
    }
    const listRequest = (body ?? {}) as AuctionListRequest;

    if (listRequest.cargo_num === "scenario-401") {
      return unauthorizedResponse();
    }
    if (listRequest.cargo_num === "scenario-503") {
      return unavailableResponse();
    }
    if (
      listRequest.page !== undefined &&
      (!Number.isInteger(listRequest.page) || listRequest.page < 1)
    ) {
      return createValidationResponse(
        "page",
        "Номер страницы должен быть положительным целым числом.",
        "min_value",
      );
    }
    if (
      listRequest.per_page !== undefined &&
      (!Number.isInteger(listRequest.per_page) ||
        listRequest.per_page < 1 ||
        listRequest.per_page > 100)
    ) {
      return createValidationResponse(
        "per_page",
        "Размер страницы должен быть от 1 до 100.",
        "range",
      );
    }

    const entries = sortEntries(
      mockStore.auctions.filter((entry) =>
        matchesListRequest(entry, listRequest),
      ),
      listRequest,
    );
    return HttpResponse.json(buildListResponse(entries, listRequest));
  }),

  http.get("/api/v1/auctions/:auctionUuid", async ({ params }) => {
    await maybeDelay();
    const auctionUuid = String(params.auctionUuid);
    if (auctionUuid === UNAUTHORIZED_AUCTION_UUID) {
      return unauthorizedResponse();
    }
    if (auctionUuid === UNAVAILABLE_AUCTION_UUID) {
      return unavailableResponse();
    }
    const entry = findAuction(auctionUuid);
    return entry ? HttpResponse.json(entry.detail) : notFoundResponse();
  }),

  http.get(
    "/api/v1/auctions/:auctionUuid/bets",
    async ({ params, request }) => {
      await maybeDelay();
      const auctionUuid = String(params.auctionUuid);
      if (auctionUuid === UNAUTHORIZED_AUCTION_UUID) {
        return unauthorizedResponse();
      }
      if (auctionUuid === UNAVAILABLE_AUCTION_UUID) {
        return unavailableResponse();
      }
      const entry = findAuction(auctionUuid);
      if (!entry) {
        return notFoundResponse();
      }
      if (
        entry.detail.trading.hide_bets_history ||
        entry.detail.hide_bets_history
      ) {
        return HttpResponse.json({ bets: [] });
      }

      const includeAll =
        new URL(request.url).searchParams.get("all") === "true";
      const bets = includeAll
        ? entry.bets
        : entry.bets.filter((bet) => !isHistoricalBet(bet));
      return HttpResponse.json({ bets });
    },
  ),

  http.post(
    "/api/v1/auctions/:auctionUuid/bets",
    async ({ params, request }) => {
      await maybeDelay();
      const auctionUuid = String(params.auctionUuid);
      if (auctionUuid === UNAUTHORIZED_AUCTION_UUID) {
        return unauthorizedResponse();
      }
      if (auctionUuid === UNAVAILABLE_AUCTION_UUID) {
        return unavailableResponse();
      }
      const entry = findAuction(auctionUuid);
      if (!entry) {
        return notFoundResponse();
      }

      const body = await readJsonBody(request);
      if (
        !isRecord(body) ||
        typeof body.price !== "number" ||
        !Number.isFinite(body.price) ||
        body.price <= 0
      ) {
        return createValidationResponse(
          "price",
          "Цена должна быть числом больше нуля.",
          "positive_number",
        );
      }
      if (!entry.detail.trading.can_set_bet) {
        return createValidationResponse(
          "price",
          "Приём ставок для этого аукциона закрыт.",
          "bidding_unavailable",
        );
      }

      const constraints = entry.detail.trading.price;
      if (
        constraints?.min !== null &&
        constraints?.min !== undefined &&
        body.price < constraints.min
      ) {
        return createValidationResponse(
          "price",
          `Цена должна быть не меньше ${constraints.min}.`,
          "min_value",
        );
      }
      if (
        constraints?.max !== null &&
        constraints?.max !== undefined &&
        body.price > constraints.max
      ) {
        return createValidationResponse(
          "price",
          `Цена должна быть не больше ${constraints.max}.`,
          "max_value",
        );
      }
      if (constraints?.step !== null && constraints?.step !== undefined) {
        const base = constraints.min ?? 0;
        if (!followsStep(body.price, base, constraints.step)) {
          return createValidationResponse(
            "price",
            `Цена должна соответствовать шагу ${constraints.step}.`,
            "step",
          );
        }
      }

      updateAuctionAfterBid(entry, body.price);
      return new HttpResponse(null, { status: 200 });
    },
  ),
];
