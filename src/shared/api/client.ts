import {
  AuctionListRequest,
  AuctionListResponseBase,
  AuctionShowResponse,
  BetListResponse,
  ProblemDetail,
  SetBetRequest,
  ValidationProblem,
} from "./types";

const API_BASE_URL = "/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: ProblemDetail | ValidationProblem,
  ) {
    super(problem.message);
    this.name = "ApiError";
  }
}

export class ApiResponseError extends Error {
  constructor(public readonly status: number) {
    super("Некорректный формат ответа API.");
    this.name = "ApiResponseError";
  }
}

function isProblemResponse(
  value: unknown,
): value is ProblemDetail | ValidationProblem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.code === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.message === "string"
  );
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url.pathname + url.search;
}

async function parsePayload(response: Response): Promise<unknown> {
  const body = await response.text();
  if (!body) return undefined;

  const contentType = response.headers.get("content-type") ?? "";
  if (
    !contentType.includes("application/json") &&
    !contentType.includes("application/problem+json")
  ) {
    return undefined;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return undefined;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  params?: Record<string, string | number | boolean | undefined | null>,
  expectsJson = true,
): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await parsePayload(response);

  if (!response.ok) {
    if (isProblemResponse(payload)) {
      throw new ApiError(response.status, payload);
    }
    throw new ApiError(response.status, {
      code: "unexpected_error",
      title: "Unexpected error",
      message: "Unexpected response format.",
    });
  }

  if (expectsJson && (payload === undefined || payload === null)) {
    throw new ApiResponseError(response.status);
  }

  return payload as T;
}

export async function listAuctions(
  payload: AuctionListRequest,
  signal?: AbortSignal,
): Promise<AuctionListResponseBase> {
  return request<AuctionListResponseBase>("/auctions/list", {
    method: "POST",
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

export async function setBid(
  auctionUuid: string,
  payload: SetBetRequest,
): Promise<void> {
  return request<void>(
    `/auctions/${encodeURIComponent(auctionUuid)}/bets`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    undefined,
    false,
  );
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.problem.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Не удалось выполнить запрос.";
}

export interface ErrorToastContent {
  title: string;
  description: string;
}

export function getErrorToastContent(error: unknown): ErrorToastContent {
  if (error instanceof ApiError) {
    const technicalDetails = [
      `HTTP ${error.status}`,
      error.problem.trace_id ? `trace_id: ${error.problem.trace_id}` : null,
    ]
      .filter((item): item is string => item !== null)
      .join(" · ");

    return {
      title: error.problem.title,
      description: `${error.problem.message} ${technicalDetails}`,
    };
  }

  if (error instanceof ApiResponseError) {
    return {
      title: "Некорректный ответ сервера",
      description: `${error.message} HTTP ${error.status}`,
    };
  }

  return {
    title: "Не удалось выполнить запрос",
    description: getErrorMessage(error),
  };
}
