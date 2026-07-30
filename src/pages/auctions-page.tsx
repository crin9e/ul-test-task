import { Link } from "@tanstack/react-router";
import { useAuctionList } from "../shared/api/queries";
import { ErrorState, LoadingState, PageShell } from "../shared/ui/state";
import styles from "./auctions-page.module.css";

export function AuctionsPage() {
  const { data, isPending, isError, error, refetch } = useAuctionList({
    page: 1,
    per_page: 20,
  });

  if (isPending) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Не удалось загрузить список аукционов."
        }
        onRetry={() => void refetch()}
      />
    );
  }

  const auctions = data.data ?? [];
  return (
    <PageShell
      title="Грузовые аукционы"
      description="Список доступных аукционов и торгов."
    >
      <div className={styles.auctionGrid}>
        {auctions.map((auction) => (
          <article key={auction.main?.order_uid ?? auction.main?.cargo_num}>
            <header>
              <h2>{auction.main?.cargo_num ?? "—"}</h2>
            </header>
            <p>Тип: {auction.main?.auc_type ?? "—"}</p>
            <p>
              Город:{" "}
              {auction.route?.load?.city ?? auction.route?.unload?.city ?? "—"}
            </p>
            <p>Текущая цена: {auction.trading?.price?.current ?? "—"} ₽</p>
            <footer>
              <Link
                role="button"
                to="/auctions/$auctionUuid"
                params={{ auctionUuid: String(auction.main?.order_uid ?? "") }}
              >
                Детали
              </Link>
              <Link
                role="button"
                className="secondary outline"
                to="/auctions/$auctionUuid/bets"
                params={{ auctionUuid: String(auction.main?.order_uid ?? "") }}
              >
                Ставки
              </Link>
            </footer>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
