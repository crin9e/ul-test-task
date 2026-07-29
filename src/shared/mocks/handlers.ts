import { http, HttpResponse } from 'msw';

const auctionListResponse = {
  data: [
    {
      id: 1236,
      cargo_num: '00000001059',
      auc_type: 'Down',
      organizer: { organization_name: 'ЛИМ' },
      routes: [{ location: { city_name: 'Пермь' } }],
      cargo: {
        price: '300000',
        currency: 643,
        body_type: 'тентованный',
        truck_count: 1,
      },
      trading: {
        status: 'Auction',
        status_mobile: 'Leading',
        start_time: '2026-05-25T16:03:00',
        stop_time: '2026-05-25T16:18:00',
        can_set_bet: true,
        is_bidder: true,
        price: {
          current: 30000,
          min: 20000,
          max: 30000,
          step: 500,
          price_per_km: 16.39,
        },
        your: {
          bet: true,
          last_bet: 30000,
          win: false,
        },
      },
    },
  ],
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    per_page: 20,
    to: 1,
    total: 1,
  },
};

const auctionDetailResponse = {
  main: {
    id: 1236,
    cargo_num: '00000001059',
    cargo_date: '2026-05-04T14:49:09',
    order_uid: '3a05d045-0e67-4f85-b20a-de81d18bba7a',
    auc_type: 'Down',
    created_at: '2026-05-25T11:48:20',
  },
  organizer: {
    subscriber_id: 98,
    subscriber_code: '12345',
    infobase_code: 'RU_Cargo_01',
    organization_name: 'ЛИМ',
    organization_inn: '7703769184',
    organization_kpp: '770301001',
    organization_id: 340,
  },
  contacts: [],
  cargo: {
    price: '300000',
    currency: 643,
    is_international: false,
    distance: 1500,
    truck_count: 1,
    body_type: 'тентованный',
    temp_from: null,
    temp_to: null,
    conics: null,
    belts: null,
    adr: null,
    coupling: null,
    air_pass: null,
    low_loader: null,
    additional_load: null,
    containered: false,
    container_type: null,
    container_size: null,
    loading_types: { side: false, top: false, rear: false, full: false },
    docs: { tir: false, cmr: false, t1: false, med: false },
    car: null,
  },
  trading: {
    status: 'Auction',
    status_mobile: 'Leading',
    start_time: '2026-05-25T16:03:00',
    stop_time: '2026-05-25T16:18:00',
    bid_measurement_type: 'PerRoute',
    can_set_bet: true,
    allow_counter_bets: true,
    hide_bets_history: false,
    hide_places: false,
    no_view_cargo_price: false,
    hide_points_address_and_contacts: false,
    is_bidder: true,
    is_favorite: false,
    is_last_bet_with_vat: null,
    red_bet_with_vat: false,
    red_bet_no_vat: false,
    send_deal_before_load: false,
    chat_id: null,
    price: {
      start: 30000,
      start_no_vat: 25000,
      current: 30000,
      current_no_vat: 24590.16,
      available: 29000,
      available_no_vat: 24166,
      min: 20000,
      min_no_vat: 16666.67,
      max: 30000,
      max_no_vat: 25000,
      step: 500,
      step_no_vat: 416.67,
      price_per_km: 16.39,
    },
    your: {
      bet: true,
      last_bet: 30000,
      last_bet_with_vat: 30000,
      win: false,
    },
    settings: {
      prolong_after_bet: 10,
      winner_confirm: 1,
      winner_counter_mode: null,
      transmission_time_in: 24,
      coefficient: 10,
    },
  },
  payment: {
    condition: 'По оригиналам накладных (ТН, ТТН, CMR)',
    condition_predefined: 'ПоОригиналамНаладных',
    form: 'Безналичная с НДС',
    delay: 30,
    delay_type: 'CalendarDays',
    currency_code: '643',
    prepay: '0',
  },
  assembly: {},
  routes: [],
  admitted_organizations: [],
  hide_bets_history: false,
};

const betsResponse = {
  bets: [
    {
      id: 42,
      created_at: '2026-05-25T16:05:00',
      auction_id: 1236,
      subscriber_id: 13,
      contact_name: 'Иванов Иван',
      contact_phone: '+79001234567',
      price_with_vat: 30000,
      price_no_vat: 24590.16,
      organization_id: 14,
      organization_inn: '9616244307',
      organization_name: 'ООО Перевозчик',
      transporter_comment: null,
      is_rejected: false,
      is_counter: false,
      place: 1,
      is_win: false,
      run_number: 0,
      cancel_reason: '',
      price_info: {
        price_with_vat: 30000,
        price_no_vat: 24590.16,
        payment_type: 'Безналичная с НДС',
        vat_rate: '20',
      },
    },
  ],
};

export const handlers = [
  http.post('/api/v1/auctions/list', async () => HttpResponse.json(auctionListResponse)),
  http.get('/api/v1/auctions/:auctionUuid', ({ params }) => {
    if (params.auctionUuid === 'missing') {
      return HttpResponse.json(
        {
          code: 'resource_not_found',
          title: 'Не найдено',
          message: 'Аукцион не найден',
          trace_id: 'trace-404',
        },
        { status: 404 },
      );
    }
    return HttpResponse.json(auctionDetailResponse);
  }),
  http.get('/api/v1/auctions/:auctionUuid/bets', () => HttpResponse.json(betsResponse)),
  http.post('/api/v1/auctions/:auctionUuid/bets', async ({ request }) => {
    const body = (await request.json()) as { price?: number };
    if (!body.price || body.price <= 0) {
      return HttpResponse.json(
        {
          code: 'validation_failed',
          title: 'Ошибка валидации',
          message: 'Запрос содержит некорректные поля.',
          errors: [{ field: 'price', message: 'Цена должна быть больше нуля.' }],
        },
        { status: 422, headers: { 'Content-Type': 'application/problem+json' } },
      );
    }
    return HttpResponse.json({ ok: true });
  }),
];
