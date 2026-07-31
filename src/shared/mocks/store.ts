import type {
  AuctionListItem,
  AuctionShowResponse,
  AuctionStatus,
  AuctionType,
  BetItem,
  BidMeasurementType,
  TradingStatus,
} from "../api";
import { cityOptions } from "../config";

export const CURRENT_USER_SUBSCRIBER_ID = 13;
export const UNAUTHORIZED_AUCTION_UUID = "00000000-0000-0000-0000-000000000401";
export const UNAVAILABLE_AUCTION_UUID = "00000000-0000-0000-0000-000000000503";

export const mockCities = cityOptions.map((city) => ({
  gc_id: city.gcId,
  name: city.name,
}));

export interface MockAuctionEntry {
  scenario: string;
  uuid: string;
  listItem: AuctionListItem;
  detail: AuctionShowResponse;
  bets: BetItem[];
}

export interface MockStoreState {
  auctions: MockAuctionEntry[];
}

type ListTradingStatus = NonNullable<
  NonNullable<AuctionListItem["trading"]>["status_mobile"]
>;

interface ScenarioDefinition {
  scenario: string;
  uuid: string;
  id: number;
  cargoNum: string;
  cargoName: string;
  auctionType: AuctionType;
  auctionStatus: AuctionStatus;
  tradingStatus: TradingStatus;
  listTradingStatus?: ListTradingStatus;
  bidMeasurementType?: BidMeasurementType;
  canSetBet?: boolean;
  hasUserBid?: boolean;
  currentPrice?: number | null;
  userBid?: number | null;
  loadCityIndex?: number;
  unloadCityIndex?: number;
  hideHistory?: boolean;
  hideContacts?: boolean;
  hideCargoPrice?: boolean;
  hidePlaces?: boolean;
  multiPointRoute?: boolean;
  nullable?: boolean;
  bets?: BetItem[];
}

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

function createBet(
  id: number,
  auctionId: number,
  subscriberId: number,
  price: number,
  overrides: Partial<BetItem> = {},
): BetItem {
  return {
    id,
    created_at: `2026-06-${String((id % 20) + 1).padStart(2, "0")}T12:00:00+03:00`,
    auction_id: auctionId,
    subscriber_id: subscriberId,
    contact_name:
      subscriberId === CURRENT_USER_SUBSCRIBER_ID
        ? "Иван Иванов"
        : "Пётр Петров",
    contact_phone:
      subscriberId === CURRENT_USER_SUBSCRIBER_ID
        ? "+79001234567"
        : "+79007654321",
    price_with_vat: price,
    price_no_vat: roundMoney(price / 1.2),
    organization_id: subscriberId + 100,
    organization_inn:
      subscriberId === CURRENT_USER_SUBSCRIBER_ID ? "7700000013" : "7700000021",
    organization_name:
      subscriberId === CURRENT_USER_SUBSCRIBER_ID
        ? "ООО Текущий перевозчик"
        : "ООО Конкурент",
    transporter_comment: null,
    is_rejected: false,
    is_counter: false,
    place: null,
    is_win: false,
    run_number: 0,
    cancel_reason: "",
    price_info: {
      price_with_vat: price,
      price_no_vat: roundMoney(price / 1.2),
      payment_type: "Безналичная с НДС",
      vat_rate: "20",
    },
    ...overrides,
  };
}

function createAuction(definition: ScenarioDefinition): MockAuctionEntry {
  const loadCity =
    mockCities[definition.loadCityIndex ?? definition.id % mockCities.length];
  const unloadCity =
    mockCities[
      definition.unloadCityIndex ?? (definition.id + 1) % mockCities.length
    ];
  const additionalLoadCity =
    mockCities[(definition.id + 2) % mockCities.length];
  const additionalUnloadCity =
    mockCities[(definition.id + 3) % mockCities.length];
  const day = String((definition.id % 20) + 1).padStart(2, "0");
  const loadDate = `2026-06-${day}T09:00:00+03:00`;
  const unloadDate = `2026-06-${day}T18:00:00+03:00`;
  const currentPrice =
    definition.currentPrice === undefined
      ? 50_000 + definition.id * 1_000
      : definition.currentPrice;
  const canSetBet = definition.canSetBet ?? false;
  const hasUserBid = definition.hasUserBid ?? false;
  const userBid = hasUserBid ? (definition.userBid ?? currentPrice) : null;
  const bidMeasurementType = definition.bidMeasurementType ?? "PerRoute";
  const hideHistory = definition.hideHistory ?? false;
  const hideContacts = definition.hideContacts ?? false;
  const hideCargoPrice = definition.hideCargoPrice ?? false;
  const nullable = definition.nullable ?? false;
  const listTradingStatus =
    definition.listTradingStatus ??
    (([
      "NotParticipating",
      "Leading",
      "Losing",
      "Winner",
      "Confirmed",
      "Unknown",
    ].includes(definition.tradingStatus)
      ? definition.tradingStatus
      : "Unknown") as ListTradingStatus);

  const listItem: AuctionListItem = {
    main: {
      id: definition.id,
      cargo_num: definition.cargoNum,
      cargo_date: loadDate,
      auc_type: definition.auctionType,
      order_uid: definition.uuid,
      created_at: `2026-05-${day}T11:00:00+03:00`,
      priority_sort: definition.id,
      is_assembly: false,
      price_per_km:
        currentPrice === null ? null : roundMoney(currentPrice / 1_000),
    },
    organizer: {
      subscriber_id: 90 + definition.id,
      organization_id: 300 + definition.id,
      organization_name: `ООО Организатор ${definition.id}`,
      organization_inn: `7700000${String(definition.id).padStart(3, "0")}`,
      organization_kpp: "770001001",
      is_hide_organization: false,
    },
    route: {
      load: {
        city: loadCity.name,
        address: hideContacts ? undefined : `Склад ${definition.id}`,
        date: loadDate,
        city_gc_id: loadCity.gc_id,
        points_count: definition.multiPointRoute ? 2 : 1,
      },
      unload: {
        city: unloadCity.name,
        address: hideContacts ? undefined : `Терминал ${definition.id}`,
        date: unloadDate,
        city_gc_id: unloadCity.gc_id,
        points_count: definition.multiPointRoute ? 2 : 1,
      },
    },
    cargo: {
      name: nullable ? "" : definition.cargoName,
      weight: nullable ? 0 : 10 + definition.id,
      volume: nullable ? 0 : 30 + definition.id,
      body_type: definition.id % 2 === 0 ? "фургон" : "тентованный",
      truck_count: definition.id % 3 === 0 ? 2 : 1,
      is_cargo: true,
      is_international: definition.id % 4 === 0,
      containered: false,
      loading_types: { side: true, top: false, rear: true, full: false },
      docs: { tir: false, cmr: definition.id % 2 === 0, t1: false, med: false },
      car: nullable
        ? null
        : {
            type: "Тягач",
            weight: 20,
            volume: 82,
            width: 2.4,
            length: 13.6,
            height: 2.7,
          },
    },
    trading: {
      status: definition.auctionStatus,
      status_mobile: listTradingStatus,
      start_time: `2026-06-${day}T10:00:00+03:00`,
      stop_time: `2026-06-${day}T16:00:00+03:00`,
      bid_measurement_type: bidMeasurementType,
      can_set_bet: canSetBet,
      allow_counter_bets: definition.id % 2 === 0,
      hide_points_address_and_contacts: hideContacts,
      is_bidder: hasUserBid,
      is_available: canSetBet,
      is_accredited: true,
      is_favorite: definition.id % 2 === 0,
      price:
        currentPrice === null
          ? null
          : {
              start: currentPrice + 5_000,
              current: currentPrice,
              current_no_vat: roundMoney(currentPrice / 1.2),
            },
      your: {
        bet: hasUserBid,
        last_bet: userBid,
      },
      red_bet_with_vat: false,
      red_bet_no_vat: false,
      is_last_bet_with_vat: undefined,
    },
    payment: {
      form: "Безналичная с НДС",
      currency_code: "643",
      consignor: nullable ? "" : `Грузоотправитель ${definition.id}`,
      consignee: nullable ? "" : `Грузополучатель ${definition.id}`,
    },
  };

  const detail: AuctionShowResponse = {
    main: {
      id: definition.id,
      cargo_num: definition.cargoNum,
      cargo_date: loadDate,
      order_uid: definition.uuid,
      auc_type: definition.auctionType,
      created_at: `2026-05-${day}T11:00:00+03:00`,
    },
    organizer: {
      subscriber_id: 90 + definition.id,
      subscriber_code: `SUB-${definition.id}`,
      infobase_code: "RU_Cargo_01",
      organization_name: `ООО Организатор ${definition.id}`,
      organization_inn: `7700000${String(definition.id).padStart(3, "0")}`,
      organization_kpp: "770001001",
      organization_id: 300 + definition.id,
    },
    contacts: hideContacts
      ? []
      : [
          {
            name: "Анна Смирнова",
            phone: "+79005550000",
            work_phone: null,
            uid: null,
            email: "auction@example.test",
          },
        ],
    cargo: {
      price: hideCargoPrice ? "" : String(300_000 + definition.id * 10_000),
      currency: nullable ? null : 643,
      is_international: definition.id % 4 === 0,
      distance: nullable ? null : 1_000,
      truck_count: definition.id % 3 === 0 ? 2 : 1,
      body_type: definition.id % 2 === 0 ? "фургон" : "тентованный",
      temp_from: nullable ? null : -5,
      temp_to: nullable ? null : 5,
      conics: null,
      belts: nullable ? null : 4,
      adr: null,
      coupling: null,
      air_pass: null,
      low_loader: null,
      additional_load: null,
      containered: false,
      container_type: null,
      container_size: null,
      loading_types: { side: true, top: false, rear: true, full: false },
      docs: { tir: false, cmr: definition.id % 2 === 0, t1: false, med: false },
      car: nullable
        ? null
        : {
            type: "Тягач",
            weight: 20,
            volume: 82,
            width: 2.4,
            length: 13.6,
            height: 2.7,
          },
    },
    trading: {
      status: definition.auctionStatus,
      status_mobile: definition.tradingStatus,
      start_time: `2026-06-${day}T10:00:00+03:00`,
      stop_time: `2026-06-${day}T16:00:00+03:00`,
      bid_measurement_type: bidMeasurementType,
      can_set_bet: canSetBet,
      allow_counter_bets: definition.id % 2 === 0,
      hide_bets_history: hideHistory,
      hide_places: definition.hidePlaces ?? false,
      no_view_cargo_price: hideCargoPrice,
      hide_points_address_and_contacts: hideContacts,
      is_bidder: hasUserBid,
      is_favorite: definition.id % 2 === 0,
      is_last_bet_with_vat: null,
      red_bet_with_vat: false,
      red_bet_no_vat: false,
      send_deal_before_load: false,
      chat_id: null,
      price: {
        start: currentPrice === null ? null : currentPrice + 5_000,
        start_no_vat:
          currentPrice === null
            ? null
            : roundMoney((currentPrice + 5_000) / 1.2),
        current: currentPrice,
        current_no_vat:
          currentPrice === null ? null : roundMoney(currentPrice / 1.2),
        available: currentPrice === null ? null : currentPrice,
        available_no_vat:
          currentPrice === null ? null : roundMoney(currentPrice / 1.2),
        min: nullable ? null : 10_000,
        min_no_vat: nullable ? null : roundMoney(10_000 / 1.2),
        max: nullable ? null : 500_000,
        max_no_vat: nullable ? null : roundMoney(500_000 / 1.2),
        step: nullable ? null : 500,
        step_no_vat: nullable ? null : roundMoney(500 / 1.2),
        price_per_km:
          currentPrice === null ? 0 : roundMoney(currentPrice / 1_000),
      },
      your: {
        bet: hasUserBid,
        last_bet: userBid,
        last_bet_with_vat: userBid,
        win: definition.tradingStatus === "Winner",
      },
      settings: {
        prolong_after_bet: nullable ? null : 10,
        winner_confirm: nullable ? null : 1,
        winner_counter_mode: null,
        transmission_time_in: nullable ? null : 24,
        coefficient: nullable ? null : 10,
      },
    },
    payment: {
      condition: nullable ? null : "По оригиналам накладных",
      condition_predefined: nullable ? null : "ПоОригиналамНакладных",
      form: "Безналичная с НДС",
      delay: nullable ? null : 30,
      delay_type: nullable ? null : "CalendarDays",
      currency_code: "643",
      prepay: nullable ? null : "0",
    },
    assembly: {
      num: nullable ? null : `СБ-${definition.id}`,
      date: nullable ? null : loadDate,
    },
    routes: [
      {
        row_num: 1,
        op_type: "Loading",
        start_date: loadDate,
        end_date: loadDate,
        comment: nullable ? null : "Погрузка",
        contractor: "",
        contractor_inn: "",
        location: {
          city_name: loadCity.name,
          city_full_name: `${loadCity.name}, Россия`,
          city_gc_id: loadCity.gc_id,
          loading_address: hideContacts ? "" : `Склад ${definition.id}`,
        },
        cargo: {
          name: definition.cargoName,
          package_name: "паллеты",
          weight: nullable ? "0.000" : "10.000",
          volume: nullable ? "0.000" : "30.000",
          length: "0",
          width: "0",
          height: "0",
          oversized: false,
          package_amount: nullable ? null : 10,
        },
        contact: hideContacts
          ? { name: "", phone: "" }
          : { name: "Анна Смирнова", phone: "+79005550000" },
      },
      {
        row_num: 2,
        op_type: "Unloading",
        start_date: unloadDate,
        end_date: unloadDate,
        comment: null,
        contractor: "",
        contractor_inn: "",
        location: {
          city_name: unloadCity.name,
          city_full_name: `${unloadCity.name}, Россия`,
          city_gc_id: unloadCity.gc_id,
          loading_address: hideContacts ? "" : `Терминал ${definition.id}`,
        },
        cargo: {
          name: definition.cargoName,
          package_name: "паллеты",
          weight: nullable ? "0.000" : "10.000",
          volume: nullable ? "0.000" : "30.000",
          length: "0",
          width: "0",
          height: "0",
          oversized: false,
          package_amount: nullable ? null : 10,
        },
        contact: hideContacts
          ? { name: "", phone: "" }
          : { name: "Игорь Волков", phone: "+79005550001" },
      },
    ],
    admitted_organizations: [],
    hide_bets_history: hideHistory,
  };

  if (definition.multiPointRoute) {
    const [firstLoad, finalUnload] = detail.routes;
    detail.routes = [
      firstLoad,
      {
        ...firstLoad,
        row_num: 2,
        comment: "Дополнительная погрузка",
        location: {
          ...firstLoad.location,
          city_name: additionalLoadCity.name,
          city_full_name: `${additionalLoadCity.name}, Россия`,
          city_gc_id: additionalLoadCity.gc_id,
          loading_address: hideContacts
            ? ""
            : `Склад консолидации ${definition.id}`,
        },
      },
      {
        ...finalUnload,
        row_num: 3,
        comment: "Частичная выгрузка",
        location: {
          ...finalUnload.location,
          city_name: additionalUnloadCity.name,
          city_full_name: `${additionalUnloadCity.name}, Россия`,
          city_gc_id: additionalUnloadCity.gc_id,
          loading_address: hideContacts
            ? ""
            : `Распределительный центр ${definition.id}`,
        },
      },
      {
        ...finalUnload,
        row_num: 4,
      },
    ];
  }

  return {
    scenario: definition.scenario,
    uuid: definition.uuid,
    listItem,
    detail,
    bets: definition.bets ?? [],
  };
}

function createSeedAuctions(): MockAuctionEntry[] {
  const definitions: ScenarioDefinition[] = [
    {
      scenario: "active-first-bid",
      uuid: "11111111-1111-4111-8111-111111111111",
      id: 1,
      cargoNum: "AUC-001",
      cargoName: "Мороженое",
      auctionType: "Request",
      auctionStatus: "Auction",
      tradingStatus: "NotParticipating",
      canSetBet: true,
      currentPrice: 82_000,
      multiPointRoute: true,
      bets: [createBet(101, 1, 21, 82_000)],
    },
    {
      scenario: "active-leading",
      uuid: "22222222-2222-4222-8222-222222222222",
      id: 2,
      cargoNum: "AUC-002",
      cargoName: "Строительные материалы",
      auctionType: "Down",
      auctionStatus: "Auction",
      tradingStatus: "Leading",
      canSetBet: true,
      hasUserBid: true,
      currentPrice: 70_000,
      userBid: 70_000,
      bets: [
        createBet(102, 2, CURRENT_USER_SUBSCRIBER_ID, 70_000, { place: 1 }),
        createBet(103, 2, 21, 72_000, { place: 2 }),
      ],
    },
    {
      scenario: "active-losing",
      uuid: "33333333-3333-4333-8333-333333333333",
      id: 3,
      cargoNum: "AUC-003",
      cargoName: "Подсолнечное масло",
      auctionType: "Up",
      auctionStatus: "Auction",
      tradingStatus: "Losing",
      canSetBet: true,
      hasUserBid: true,
      currentPrice: 95_000,
      userBid: 90_000,
      bets: [
        createBet(104, 3, 21, 95_000, { place: 1 }),
        createBet(105, 3, CURRENT_USER_SUBSCRIBER_ID, 90_000, { place: 2 }),
      ],
    },
    {
      scenario: "finished-visible-winner",
      uuid: "44444444-4444-4444-8444-444444444444",
      id: 4,
      cargoNum: "AUC-004",
      cargoName: "Бытовая техника",
      auctionType: "FixPrice",
      auctionStatus: "Finished",
      tradingStatus: "Winner",
      bidMeasurementType: "PerKm",
      hasUserBid: true,
      currentPrice: 120_000,
      userBid: 120_000,
      bets: [
        createBet(106, 4, CURRENT_USER_SUBSCRIBER_ID, 120_000, {
          place: 1,
          is_win: true,
        }),
        createBet(107, 4, 21, 125_000, { place: 2 }),
        createBet(108, 4, 22, 119_000, {
          is_rejected: true,
          place: null,
          cancel_reason: "Отклонена организатором",
        }),
      ],
    },
    {
      scenario: "planning-no-bids",
      uuid: "55555555-5555-4555-8555-555555555555",
      id: 5,
      cargoNum: "AUC-005",
      cargoName: "Бумага в рулонах",
      auctionType: "Request",
      auctionStatus: "Planning",
      tradingStatus: "Confirmed",
      currentPrice: 65_000,
    },
    {
      scenario: "hidden-history",
      uuid: "66666666-6666-4666-8666-666666666666",
      id: 6,
      cargoNum: "AUC-006",
      cargoName: "Замороженные овощи",
      auctionType: "Down",
      auctionStatus: "DeterminateWinner",
      tradingStatus: "ChoosingWinner",
      currentPrice: 61_000,
      hideHistory: true,
      bets: [createBet(109, 6, 21, 61_000, { place: 1 })],
    },
    {
      scenario: "hidden-addresses-contacts",
      uuid: "77777777-7777-4777-8777-777777777777",
      id: 7,
      cargoNum: "AUC-007",
      cargoName: "Автомобильные запчасти",
      auctionType: "Up",
      auctionStatus: "WaitDeal",
      tradingStatus: "OnPending",
      currentPrice: 88_000,
      hideContacts: true,
    },
    {
      scenario: "hidden-cargo-price",
      uuid: "88888888-8888-4888-8888-888888888888",
      id: 8,
      cargoNum: "AUC-008",
      cargoName: "Медицинское оборудование",
      auctionType: "FixPrice",
      auctionStatus: "InProgress",
      tradingStatus: "Confirmed",
      currentPrice: 130_000,
      hideCargoPrice: true,
      hidePlaces: true,
    },
    {
      scenario: "nullable-fields",
      uuid: "99999999-9999-4999-8999-999999999999",
      id: 9,
      cargoNum: "AUC-009",
      cargoName: "Пиломатериалы",
      auctionType: "Unknown",
      auctionStatus: "Stopped",
      tradingStatus: "Accepted",
      bidMeasurementType: "Unknown",
      currentPrice: null,
      nullable: true,
    },
    {
      scenario: "canceled-auction",
      uuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      id: 10,
      cargoNum: "AUC-010",
      cargoName: "Керамическая плитка",
      auctionType: "Request",
      auctionStatus: "Canceled",
      tradingStatus: "Unknown",
      currentPrice: 55_000,
    },
    {
      scenario: "unknown-runtime-safe",
      uuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      id: 11,
      cargoNum: "AUC-011",
      cargoName: "Металлопрокат",
      auctionType: "Unknown",
      auctionStatus: "Unknown",
      tradingStatus: "Unknown",
      bidMeasurementType: "Unknown",
      currentPrice: 0,
    },
  ];

  return definitions.map(createAuction);
}

export const mockStore: MockStoreState = {
  auctions: createSeedAuctions(),
};

export function resetMockStore(): void {
  mockStore.auctions = createSeedAuctions();
}
