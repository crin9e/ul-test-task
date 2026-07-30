import type { BidRowViewModel } from "../../../entities/bet";
import styles from "./auction-bets-list.module.css";

interface AuctionBetsListProps {
  bets: BidRowViewModel[];
}

export function AuctionBetsList({ bets }: AuctionBetsListProps) {
  return (
    <div className={styles.list}>
      {bets.map((bet, index) => (
        <article
          className={styles.bid}
          key={bet.id ?? `${bet.subscriberId}-${bet.createdAt}-${index}`}
        >
          <header className={styles.header}>
            <div>
              <h2>{bet.organizationName}</h2>
              <p>ИНН: {bet.organizationInn}</p>
            </div>
            <div className={styles.badges} aria-label="Признаки ставки">
              {bet.rank !== null ? <span>Место: {bet.rank}</span> : null}
              {bet.isWinner ? <span>Победитель</span> : null}
              {bet.isRejectedOrCancelled ? (
                <span className={styles.danger}>Отменена или отклонена</span>
              ) : null}
              {bet.isCounter ? <span>Встречная ставка</span> : null}
            </div>
          </header>

          <dl className={styles.details}>
            <div>
              <dt>Создана</dt>
              <dd>{bet.createdAt}</dd>
            </div>
            <div>
              <dt>Цена с НДС</dt>
              <dd>
                <strong>{bet.priceWithVat}</strong>
              </dd>
            </div>
            <div>
              <dt>Цена без НДС</dt>
              <dd>{bet.priceWithoutVat}</dd>
            </div>
            <div>
              <dt>Оплата</dt>
              <dd>{bet.paymentType}</dd>
            </div>
            <div>
              <dt>Ставка НДС</dt>
              <dd>{bet.vatRate}</dd>
            </div>
            <div>
              <dt>Контакт</dt>
              <dd>{bet.contactName}</dd>
            </div>
            <div>
              <dt>Телефон</dt>
              <dd>{bet.contactPhone}</dd>
            </div>
            {bet.runNumber !== null ? (
              <div>
                <dt>Номер рейса</dt>
                <dd>{bet.runNumber}</dd>
              </div>
            ) : null}
          </dl>

          {bet.cancellationReason ? (
            <footer>
              Причина отмены: {bet.cancellationReason}
            </footer>
          ) : null}
        </article>
      ))}
    </div>
  );
}
