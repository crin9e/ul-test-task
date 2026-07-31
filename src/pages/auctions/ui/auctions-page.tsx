import { useNavigate, useSearch } from "@tanstack/react-router";
import { AuctionCard } from "../../../entities/auction";
import {
  AuctionFilters,
  buildAuctionListRequest,
  type AuctionListSearch,
} from "../../../features/filter-auctions";
import { ApiError, useAuctionList } from "../../../shared/api";
import { PageShell, StateCard } from "../../../shared/ui";
import styles from "./auctions-page.module.css";
import { AuctionPagination } from "./auction-pagination";

function AuctionListSkeleton() {
  return (
    <div
      className={styles.auctionGrid}
      aria-label="Загрузка списка аукционов"
      aria-busy="true"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <article className={styles.skeleton} key={index} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </article>
      ))}
    </div>
  );
}

function getListErrorContent(error: unknown): {
  title: string;
  description: string;
  canRetry: boolean;
} {
  if (error instanceof ApiError && error.status === 401) {
    return {
      title: "Тестовая сессия недействительна",
      description:
        "Сбросьте фильтр номера заявки или перезапустите mock-сессию.",
      canRetry: false,
    };
  }
  if (error instanceof ApiError && error.status === 503) {
    return {
      title: "Сервис временно недоступен",
      description:
        "Mock upstream не отвечает. Повторите запрос через несколько секунд.",
      canRetry: true,
    };
  }
  return {
    title: "Не удалось загрузить аукционы",
    description:
      error instanceof Error
        ? error.message
        : "Проверьте соединение и повторите запрос.",
    canRetry: true,
  };
}

export function AuctionsPage() {
  const search = useSearch({ from: "/auctions" });
  const navigate = useNavigate({ from: "/auctions" });
  const request = buildAuctionListRequest(search);
  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    refetch,
  } = useAuctionList(request);

  const updateSearch = (nextSearch: AuctionListSearch) => {
    void navigate({ search: nextSearch });
  };

  const resetFilters = () => {
    updateSearch({ page: 1, perPage: search.perPage });
  };

  const auctions = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const errorContent = isError ? getListErrorContent(error) : null;

  return (
    <PageShell
      title="Грузовые аукционы"
      description="Найдите подходящий маршрут и управляйте своим участием в торгах."
    >
      <div className={styles.summary}>
        <p>
          Найдено: <strong>{isPending ? "…" : total}</strong>
        </p>
        {isFetching && !isPending && (
          <small role="status">Обновляем результаты…</small>
        )}
      </div>

      <div className={styles.listLayout}>
        <div className={styles.filterColumn}>
          <AuctionFilters
            search={search}
            onApply={updateSearch}
            onReset={resetFilters}
          />
        </div>

        <section className={styles.results} aria-label="Список аукционов">
          {isPending ? <AuctionListSkeleton /> : null}

          {isError && errorContent && (
            <StateCard
              title={errorContent.title}
              description={errorContent.description}
              tone="danger"
              action={
                errorContent.canRetry ? (
                  <button type="button" onClick={() => void refetch()}>
                    Повторить
                  </button>
                ) : (
                  <button type="button" onClick={resetFilters}>
                    Сбросить фильтры
                  </button>
                )
              }
            />
          )}

          {!isPending && !isError && auctions.length === 0 && (
            <StateCard
              title="Аукционы не найдены"
              description="Измените параметры поиска или сбросьте все фильтры."
              action={
                <button type="button" onClick={resetFilters}>
                  Сбросить фильтры
                </button>
              }
            />
          )}

          {!isError && auctions.length > 0 && (
            <>
              <div
                className={styles.auctionGrid}
                aria-busy={isFetching || undefined}
              >
                {auctions.map((auction) => (
                  <AuctionCard
                    key={
                      auction.main?.order_uid ??
                      auction.main?.id ??
                      auction.main?.cargo_num
                    }
                    auction={auction}
                  />
                ))}
              </div>
              <AuctionPagination
                meta={data?.meta}
                disabled={isPlaceholderData}
                onPageChange={(page) =>
                  updateSearch({
                    ...search,
                    page,
                  })
                }
              />
            </>
          )}
        </section>
      </div>
    </PageShell>
  );
}
