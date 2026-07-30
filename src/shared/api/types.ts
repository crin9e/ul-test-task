import type { components } from './generated-types';

export type AuctionType = components['schemas']['AuctionType'];
export type AuctionStatus = components['schemas']['AuctionStatus'];
export type TradingStatus = components['schemas']['TradingStatus'];
export type BidMeasurementType = components['schemas']['BidMeasurementType'];
export type PaymentDelayType = components['schemas']['PaymentDelayType'];

export type AuctionListMeta = components['schemas']['AuctionListMeta'];
export type AuctionListItem = components['schemas']['AuctionListItem'];
export type AuctionListResponseBase = components['schemas']['AuctionListResponseBase'];
export type AuctionShowTradingPrice = components['schemas']['AuctionShowTradingPrice'];
export type AuctionShowTradingYour = components['schemas']['AuctionShowTradingYour'];
export type AuctionShowTradingSettings = components['schemas']['AuctionShowTradingSettings'];
export type AuctionShowTrading = components['schemas']['AuctionShowTrading'];
export type AuctionShowResponse = components['schemas']['AuctionShowResponse'];
export type BetItem = components['schemas']['BetItem'];
export type BetListResponse = components['schemas']['BetListResponse'];
export type SetBetRequest = components['schemas']['SetBetRequest'];
export type AuctionListRequest = components['schemas']['AuctionListRequest'];

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
