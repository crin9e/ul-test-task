import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { AuctionListItem } from "../../../shared/api/types";
import {
  prefetchAuctionDetail,
  useAuctionDetail,
} from "../../../shared/api/queries";
import { EMPTY_VALUE, formatMoney } from "../model/formatters";
import { mapAuctionListItem } from "../model/view-model";
import styles from "./auction-card.module.css";

interface AuctionCardProps {
  auction: AuctionListItem;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const queryClient = useQueryClient();
  const auctionUuid = auction.main?.order_uid ?? "";
  const { data: prefetchedDetail } = useAuctionDetail(auctionUuid, {
    enabled: false,
  });
  const historyHidden = prefetchedDetail
    ? prefetchedDetail.trading.hide_bets_history === true ||
      prefetchedDetail.hide_bets_history === true
    : undefined;
  const viewModel = mapAuctionListItem(auction, { historyHidden });
  const bidStep = prefetchedDetail
    ? formatMoney(
        prefetchedDetail.trading.price?.step,
        prefetchedDetail.payment.currency_code ?? prefetchedDetail.cargo.currency,
      )
    : null;

  const prefetchDetail = () => {
    if (auctionUuid) {
      void prefetchAuctionDetail(queryClient, auctionUuid);
    }
  };

  return (
    <article
      className={styles.card}
      onMouseEnter={prefetchDetail}
      onFocusCapture={prefetchDetail}
    >
      <header className={styles.header}>
        <div>
          <small>Заявка</small>
          <h2>
            {auctionUuid ? (
              <Link
                to="/auctions/$auctionUuid"
                params={{ auctionUuid }}
                onMouseEnter={prefetchDetail}
                onFocus={prefetchDetail}
              >
                {viewModel.cargoNumber}
              </Link>
            ) : (
              viewModel.cargoNumber
            )}
          </h2>
        </div>
        <div className={styles.badges} aria-label="Статусы аукциона">
          <span>{viewModel.auctionType}</span>
          <span>{viewModel.auctionStatus}</span>
          <span>{viewModel.tradingStatus}</span>
        </div>
      </header>

      <section aria-label="Маршрут">
        <h3>{viewModel.routeSummary}</h3>
        <dl className={styles.details}>
          <div>
            <dt>Погрузка</dt>
            <dd>{viewModel.loadCity}</dd>
            <dd>{viewModel.loadDate}</dd>
          </div>
          <div>
            <dt>Выгрузка</dt>
            <dd>{viewModel.unloadCity}</dd>
            <dd>{viewModel.unloadDate}</dd>
          </div>
        </dl>
      </section>

      <section aria-label="Груз">
        <h3>{viewModel.cargoName}</h3>
        <dl className={styles.compactDetails}>
          <div>
            <dt>Вес</dt>
            <dd>{viewModel.weight}</dd>
          </div>
          <div>
            <dt>Объём</dt>
            <dd>{viewModel.volume}</dd>
          </div>
          <div>
            <dt>Кузов</dt>
            <dd>{viewModel.bodyType}</dd>
          </div>
          {viewModel.truckCount !== null && viewModel.truckCount > 1 ? (
            <div>
              <dt>Машин</dt>
              <dd>{viewModel.truckCount}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section aria-label="Цена и участие">
        <dl className={styles.compactDetails}>
          <div>
            <dt>Текущая цена</dt>
            <dd>
              <strong>{viewModel.currentPrice}</strong>
            </dd>
          </div>
          <div>
            <dt>Цена за км</dt>
            <dd>{viewModel.pricePerKm}</dd>
          </div>
          {bidStep && bidStep !== EMPTY_VALUE ? (
            <div>
              <dt>Шаг ставки</dt>
              <dd>{bidStep}</dd>
            </div>
          ) : null}
          <div>
            <dt>Моя ставка</dt>
            <dd>{viewModel.hasBid ? "Есть" : "Нет"}</dd>
          </div>
        </dl>
      </section>

      <footer className={styles.footer}>
        {viewModel.organizerHidden ? (
          <small>Организатор скрыл название организации</small>
        ) : (
          <small>Организатор: {viewModel.organizerName}</small>
        )}
        {auctionUuid && viewModel.action.destination === "bid" ? (
          <Link
            role="button"
            to="/auctions/$auctionUuid/bid"
            params={{ auctionUuid }}
          >
            {viewModel.action.label}
          </Link>
        ) : null}
        {auctionUuid && viewModel.action.destination === "bets" ? (
          <Link
            role="button"
            to="/auctions/$auctionUuid/bets"
            params={{ auctionUuid }}
          >
            {viewModel.action.label}
          </Link>
        ) : null}
        {viewModel.action.disabled ? (
          <button type="button" disabled title={viewModel.action.label}>
            {viewModel.action.label}
          </button>
        ) : null}
      </footer>
    </article>
  );
}
