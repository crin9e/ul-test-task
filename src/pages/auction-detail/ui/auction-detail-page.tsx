import { Link, useParams } from "@tanstack/react-router";
import { z } from "zod";
import { mapAuctionDetail } from "../../../entities/auction";
import { ApiError, useAuctionDetail } from "../../../shared/api";
import { PageShell, StateCard } from "../../../shared/ui";
import { AuctionDetails } from "./auction-details";
import styles from "./auction-detail-page.module.css";

const auctionUuidSchema = z.string().uuid();

function AuctionDetailSkeleton() {
  return (
    <main className="container" aria-busy="true">
      <div className={styles.headingSkeleton} />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 6 }, (_, index) => (
          <article key={index} aria-hidden="true">
            <span />
            <span />
            <span />
          </article>
        ))}
      </div>
    </main>
  );
}

function DetailError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  let title = "Не удалось загрузить аукцион";
  let description =
    error instanceof Error
      ? error.message
      : "Проверьте соединение и повторите запрос.";
  let retryAllowed = true;

  if (error instanceof ApiError && error.status === 404) {
    title = "Аукцион не найден";
    description = "Проверьте ссылку или вернитесь к списку аукционов.";
    retryAllowed = false;
  } else if (error instanceof ApiError && error.status === 401) {
    title = "Тестовая сессия недействительна";
    description = "Для просмотра аукциона требуется действующая mock-сессия.";
    retryAllowed = false;
  } else if (error instanceof ApiError && error.status === 503) {
    title = "Сервис временно недоступен";
    description = "Mock upstream не отвечает. Повторите запрос позднее.";
  }

  const traceId = error instanceof ApiError ? error.problem.trace_id : null;

  return (
    <main className="container">
      <StateCard
        title={title}
        description={description}
        tone="danger"
        action={
          <div className={styles.errorActions}>
            {retryAllowed && (
              <button type="button" onClick={onRetry}>
                Повторить
              </button>
            )}
            <Link role="button" className="secondary outline" to="/auctions">
              К списку
            </Link>
          </div>
        }
      />
      {traceId && (
        <details className={styles.technicalDetails}>
          <summary>Техническая информация</summary>
          <code>trace_id: {traceId}</code>
        </details>
      )}
    </main>
  );
}

export function AuctionDetailPage() {
  const params = useParams({ from: "/auctions/$auctionUuid" });
  const parsedUuid = auctionUuidSchema.safeParse(params.auctionUuid);
  const { data, isPending, isError, error, isFetching, refetch } =
    useAuctionDetail(params.auctionUuid, {
      enabled: parsedUuid.success,
    });

  if (!parsedUuid.success) {
    return (
      <DetailError
        error={
          new ApiError(404, {
            code: "invalid_auction_uuid",
            title: "Некорректный идентификатор",
            message: "UUID аукциона имеет неверный формат.",
          })
        }
        onRetry={() => undefined}
      />
    );
  }

  if (isPending) {
    return <AuctionDetailSkeleton />;
  }

  if (isError) {
    return <DetailError error={error} onRetry={() => void refetch()} />;
  }

  const auction = mapAuctionDetail(data);

  return (
    <PageShell
      title={`Аукцион ${auction.cargoNumber}`}
      description={`${auction.auctionType} · ${auction.auctionStatus}`}
    >
      <AuctionDetails
        auction={auction}
        auctionUuid={parsedUuid.data}
        refreshing={isFetching}
        onRefresh={() => void refetch()}
      />
    </PageShell>
  );
}
