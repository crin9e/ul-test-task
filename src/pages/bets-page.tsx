import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { z } from "zod";
import { countBidParticipants, mapBidRow } from "../entities/bet";
import { getErrorMessage } from "../shared/api/client";
import { useAuctionBets, useAuctionDetail } from "../shared/api/queries";
import {
  ErrorState,
  LoadingState,
  PageShell,
  StateCard,
} from "../shared/ui/state";
import { AuctionBetsList } from "../widgets/auction-bets-list";
import styles from "./bets-page.module.css";

const auctionUuidSchema = z.string().uuid();

export function BetsPage() {
  const params = useParams({ from: "/auctions/$auctionUuid/bets" });
  const search = useSearch({ from: "/auctions/$auctionUuid/bets" });
  const navigate = useNavigate({ from: "/auctions/$auctionUuid/bets" });
  const parsedUuid = auctionUuidSchema.safeParse(params.auctionUuid);
  const detailQuery = useAuctionDetail(params.auctionUuid, {
    enabled: parsedUuid.success,
  });
  const historyHidden =
    detailQuery.data?.trading.hide_bets_history === true ||
    detailQuery.data?.hide_bets_history === true;
  const betsQuery = useAuctionBets(params.auctionUuid, search.all, {
    enabled:
      parsedUuid.success &&
      detailQuery.isSuccess &&
      !historyHidden,
  });

  if (!parsedUuid.success) {
    return (
      <main className="container">
        <StateCard
          title="Некорректная ссылка"
          description="UUID аукциона имеет неверный формат."
          tone="danger"
          action={<Link to="/auctions">К списку аукционов</Link>}
        />
      </main>
    );
  }

  if (detailQuery.isPending) {
    return <LoadingState />;
  }

  if (detailQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(detailQuery.error)}
        onRetry={() => void detailQuery.refetch()}
      />
    );
  }

  if (historyHidden) {
    return (
      <main className="container">
        <StateCard
          title="История ставок скрыта организатором"
          description="Данные о ставках для этого аукциона недоступны."
          action={
            <Link
              to="/auctions/$auctionUuid"
              params={{ auctionUuid: parsedUuid.data }}
            >
              Вернуться к аукциону
            </Link>
          }
        />
      </main>
    );
  }

  if (betsQuery.isPending) {
    return <LoadingState />;
  }

  if (betsQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(betsQuery.error)}
        onRetry={() => void betsQuery.refetch()}
      />
    );
  }

  const currencyCode =
    detailQuery.data.payment.currency_code ?? detailQuery.data.cargo.currency;
  const bets = betsQuery.data.bets;
  const viewModels = bets.map((bet) =>
    mapBidRow(bet, {
      currencyCode,
      hidePlaces: detailQuery.data.trading.hide_places === true,
    }),
  );

  return (
    <PageShell
      title="История ставок"
      description={`Аукцион ${detailQuery.data.main.cargo_num ?? "—"}`}
    >
      <nav className={styles.actions} aria-label="Навигация по ставкам">
        <Link
          className="secondary outline"
          role="button"
          to="/auctions/$auctionUuid"
          params={{ auctionUuid: parsedUuid.data }}
        >
          К аукциону
        </Link>
        <label>
          <input
            type="checkbox"
            role="switch"
            checked={search.all}
            onChange={(event) =>
              void navigate({
                search: { all: event.currentTarget.checked },
              })
            }
          />
          Показать отменённые и отклонённые
        </label>
      </nav>

      <p className={styles.summary}>
        Участников: <strong>{countBidParticipants(bets)}</strong>
        {" · "}
        Ставок: <strong>{bets.length}</strong>
        {betsQuery.isFetching ? " · Обновление…" : ""}
      </p>

      {viewModels.length ? (
        <AuctionBetsList bets={viewModels} />
      ) : (
        <StateCard
          title="Ставок пока нет"
          description="Участники ещё не сделали ни одной ставки."
        />
      )}
    </PageShell>
  );
}
