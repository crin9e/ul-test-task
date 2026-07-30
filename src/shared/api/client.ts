import { AuctionListRequest, AuctionListResponseBase, AuctionShowResponse, BetListResponse, ProblemDetail, SetBetRequest, ValidationProblem } from './types';

const API_BASE_URL = '/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: ProblemDetail | ValidationProblem,
  ) {
    super(problem.message);
    this.name = 'ApiError';
  }
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  return url.pathname + url.search;
}

function isProblemResponse(value: unknown): value is ProblemDetail | ValidationProblem {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.code === 'string' && typeof candidate.title === 'string' && typeof candidate.message === 'string';
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return {} as T;
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json') && !contentType.includes('application/problem+json')) {
    return {} as T;
  }
  return (await response.json()) as T;
}

async function request<T>(path: string, init?: RequestInit, params?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = await parseJson<unknown>(response);

  if (!response.ok) {
    if (isProblemResponse(payload)) {
      throw new ApiError(response.status, payload);
    }
    throw new ApiError(response.status, {
      code: 'unexpected_error',
      title: 'Unexpected error',
      message: 'Unexpected response format.',
    });
  }

  return payload as T;
}

export async function listAuctions(
  payload: AuctionListRequest,
  signal?: AbortSignal,
): Promise<AuctionListResponseBase> {
  return request<AuctionListResponseBase>('/auctions/list', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  });
}

export async function getAuction(
  auctionUuid: string,
  signal?: AbortSignal,
): Promise<AuctionShowResponse> {
  return request<AuctionShowResponse>(
    `/auctions/${encodeURIComponent(auctionUuid)}`,
    { signal },
  );
}

export async function getAuctionBets(
  auctionUuid: string,
  all = false,
  signal?: AbortSignal,
): Promise<BetListResponse> {
  return request<BetListResponse>(
    `/auctions/${encodeURIComponent(auctionUuid)}/bets`,
    { signal },
    { all },
  );
}

export async function setBid(auctionUuid: string, payload: SetBetRequest): Promise<unknown> {
  return request<unknown>(`/auctions/${encodeURIComponent(auctionUuid)}/bets`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.problem.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Не удалось выполнить запрос.';
}
