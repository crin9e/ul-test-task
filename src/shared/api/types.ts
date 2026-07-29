export type AuctionType = 'Request' | 'Up' | 'Down' | 'FixPrice' | 'Unknown';
export type AuctionStatus = 'Planning' | 'Auction' | 'DeterminateWinner' | 'WaitDeal' | 'InProgress' | 'Finished' | 'Stopped' | 'Canceled' | 'Unknown';
export type TradingStatus = 'NotParticipating' | 'Leading' | 'Losing' | 'OnPending' | 'Confirmed' | 'ChoosingWinner' | 'Winner' | 'Accepted' | 'Unknown';
export type BidMeasurementType = 'PerRoute' | 'PerKm' | 'Unknown';
export type PaymentDelayType = 'CalendarDays' | 'WorkDays' | 'Unknown' | null;

export interface AuctionListMeta {
  current_page?: number;
  from?: number;
  last_page?: number;
  per_page?: number;
  to?: number;
  total?: number;
}

export interface AuctionListItem {
  id: number;
  title?: string;
  cargo_num?: string;
  auc_type?: AuctionType;
  trading?: {
    status?: AuctionStatus;
    status_mobile?: TradingStatus;
    start_time?: string;
    stop_time?: string;
    can_set_bet?: boolean;
    is_bidder?: boolean;
    price?: {
      current?: number | null;
      min?: number | null;
      max?: number | null;
      step?: number | null;
      price_per_km?: number;
    };
    your?: {
      bet?: boolean;
      last_bet?: number | null;
      win?: boolean;
    };
  };
  cargo?: {
    price?: string;
    currency?: number | null;
    body_type?: string;
    truck_count?: number;
    loading_types?: Record<string, boolean>;
    docs?: Record<string, boolean>;
    car?: Record<string, unknown> | null;
  };
  routes?: Array<{ location?: { city_name?: string } }>;
  organizer?: { organization_name?: string };
  hide_bets_history?: boolean;
}

export interface AuctionListResponseBase {
  data: AuctionListItem[];
  meta: AuctionListMeta;
}

export interface AuctionShowTradingPrice {
  start: number | null;
  start_no_vat: number | null;
  current: number | null;
  current_no_vat: number | null;
  available: number | null;
  available_no_vat: number | null;
  min: number | null;
  min_no_vat: number | null;
  max: number | null;
  max_no_vat: number | null;
  step: number | null;
  step_no_vat: number | null;
  price_per_km: number;
}

export interface AuctionShowTradingYour {
  bet: boolean;
  last_bet: number | null;
  last_bet_with_vat: number | null;
  win: boolean;
}

export interface AuctionShowTradingSettings {
  prolong_after_bet: number | null;
  winner_confirm: number | null;
  winner_counter_mode: number | null;
  transmission_time_in: number | null;
  coefficient: number | null;
}

export interface AuctionShowTrading {
  status: AuctionStatus;
  status_mobile: TradingStatus;
  start_time: string;
  stop_time: string;
  bid_measurement_type: BidMeasurementType;
  can_set_bet: boolean;
  allow_counter_bets: boolean;
  hide_bets_history: boolean;
  hide_places: boolean;
  no_view_cargo_price: boolean;
  hide_points_address_and_contacts: boolean;
  is_bidder: boolean;
  is_favorite: boolean;
  is_last_bet_with_vat: boolean | null;
  red_bet_with_vat: boolean;
  red_bet_no_vat: boolean;
  send_deal_before_load: boolean;
  chat_id: string | null;
  price: AuctionShowTradingPrice;
  your: AuctionShowTradingYour;
  settings: AuctionShowTradingSettings;
}

export interface AuctionShowResponse {
  main: {
    id: number;
    cargo_num: string;
    cargo_date: string;
    order_uid: string;
    auc_type: AuctionType;
    created_at: string;
  };
  organizer: {
    subscriber_id: number;
    subscriber_code: string;
    infobase_code: string;
    organization_name: string;
    organization_inn: string;
    organization_kpp: string;
    organization_id: number;
  };
  contacts: Array<{
    name: string | null;
    phone: string | null;
    work_phone: string | null;
    uid: string | null;
    email: string | null;
  }>;
  cargo: {
    price: string;
    currency: number | null;
    is_international: boolean;
    distance: number | null;
    truck_count: number;
    body_type: string;
    temp_from: number | null;
    temp_to: number | null;
    conics: number | null;
    belts: number | null;
    adr: number | null;
    coupling: boolean | null;
    air_pass: boolean | null;
    low_loader: boolean | null;
    additional_load: boolean | null;
    containered: boolean;
    container_type: string | null;
    container_size: string | null;
    loading_types: Record<string, boolean>;
    docs: Record<string, boolean>;
    car: Record<string, unknown> | null;
  };
  trading: AuctionShowTrading;
  payment: {
    condition: string | null;
    condition_predefined: string | null;
    form: string;
    delay: number | null;
    delay_type: PaymentDelayType;
    currency_code: string;
    prepay: string | null;
  };
  assembly: Record<string, unknown>;
  routes: Array<Record<string, unknown>>;
  admitted_organizations: Array<Record<string, unknown>>;
  hide_bets_history: boolean;
}

export interface BetItem {
  id: number;
  created_at: string;
  auction_id: number;
  subscriber_id: number;
  contact_name: string;
  contact_phone: string;
  price_with_vat: number;
  price_no_vat: number;
  organization_id: number;
  organization_inn: string;
  organization_name: string;
  transporter_comment: string | null;
  is_rejected: boolean;
  is_counter: boolean;
  place: number | null;
  is_win: boolean;
  run_number: number;
  cancel_reason: string;
  price_info: {
    price_with_vat: number | null;
    price_no_vat: number | null;
    payment_type: string | null;
    vat_rate: string | null;
  };
}

export interface BetListResponse {
  bets: BetItem[];
}

export interface SetBetRequest {
  price: number;
}

export interface ProblemDetail {
  code: string;
  title: string;
  message: string;
  trace_id?: string | null;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string | null;
}

export interface ValidationProblem extends ProblemDetail {
  errors: ValidationError[];
}

export interface AuctionListRequest {
  page?: number;
  per_page?: number;
  is_oldest?: boolean | null;
  sort?: Record<string, 'asc' | 'desc'> | null;
  status?: TradingStatus[];
  mobile_statuses?: number[];
  statuses?: number[];
  cargo_num?: string;
  weight_from?: number;
  weight_to?: number;
  volume_from?: number;
  volume_to?: number;
  body_types?: string[];
  form_type?: string | null;
  is_international_shipment?: boolean;
  load_city?: string;
  load_gc_id?: number;
  load_range?: number;
  unload_city?: string;
  unload_gc_id?: number;
  unload_range?: number;
  load_date_from?: string;
  load_date_to?: string;
  unload_date_from?: string;
  unload_date_to?: string;
  create_date_from?: string;
  create_date_to?: string;
  start_time_from?: string;
  start_time_to?: string;
  stop_time_from?: string;
  stop_time_to?: string;
  is_available?: boolean;
  is_favorite?: boolean;
  is_bidder?: boolean;
  customer?: string;
  customer_ids?: number[];
  contractor?: string | null;
  auction_ids?: number[];
  replace_external_pads?: boolean | null;
  current_price_from?: number | null;
  current_price_to?: number | null;
  price_per_km_from?: number | null;
  price_per_km_to?: number | null;
  auc_type?: AuctionType[];
}
