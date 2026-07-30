import { Link } from "@tanstack/react-router";
import type {
  AuctionDetailField,
  AuctionDetailViewModel,
} from "../../../entities/auction";
import styles from "./auction-details.module.css";

interface AuctionDetailsProps {
  auction: AuctionDetailViewModel;
  auctionUuid: string;
  refreshing: boolean;
  onRefresh: () => void;
}

function DetailList({ fields }: { fields: AuctionDetailField[] }) {
  return (
    <dl className={styles.detailList}>
      {fields.map((field) => (
        <div key={field.label}>
          <dt>{field.label}</dt>
          <dd>{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AuctionDetails({
  auction,
  auctionUuid,
  refreshing,
  onRefresh,
}: AuctionDetailsProps) {
  return (
    <>
      <nav className={styles.actions} aria-label="Действия с аукционом">
        <Link className="secondary outline" role="button" to="/auctions">
          К списку
        </Link>
        {auction.action.destination === "bid" ? (
          <Link
            role="button"
            to="/auctions/$auctionUuid/bid"
            params={{ auctionUuid }}
          >
            {auction.action.label}
          </Link>
        ) : null}
        {auction.action.destination === "bets" && !auction.historyHidden ? (
          <Link
            role="button"
            to="/auctions/$auctionUuid/bets"
            params={{ auctionUuid }}
          >
            {auction.action.label}
          </Link>
        ) : null}
        {auction.action.destination !== "bets" && !auction.historyHidden ? (
          <Link
            className="secondary"
            role="button"
            to="/auctions/$auctionUuid/bets"
            params={{ auctionUuid }}
          >
            История ставок
          </Link>
        ) : null}
        <button
          type="button"
          className="secondary outline"
          aria-busy={refreshing || undefined}
          disabled={refreshing}
          onClick={onRefresh}
        >
          Обновить
        </button>
      </nav>

      {auction.historyHidden ? (
        <p className={styles.notice}>
          История ставок скрыта организатором.
        </p>
      ) : null}

      <div className={styles.sectionGrid}>
        <article>
          <header>
            <h2>Обзор</h2>
          </header>
          <DetailList fields={auction.overviewFields} />
        </article>

        <article>
          <header>
            <h2>Организатор</h2>
          </header>
          <DetailList fields={auction.organizerFields} />
          {auction.addressesAndContactsHidden ? (
            <p className={styles.notice}>
              Контакты скрыты организатором.
            </p>
          ) : auction.contacts.length ? (
            <div className={styles.contacts}>
              {auction.contacts.map((contact, index) => (
                <section key={`${contact.email}-${contact.phone}-${index}`}>
                  <h3>Контакт {index + 1}</h3>
                  <DetailList
                    fields={[
                      { label: "Имя", value: contact.name },
                      { label: "Телефон", value: contact.phone },
                      { label: "Рабочий телефон", value: contact.workPhone },
                      { label: "Email", value: contact.email },
                    ]}
                  />
                </section>
              ))}
            </div>
          ) : (
            <p>Контакты не указаны.</p>
          )}
        </article>
      </div>

      <article>
        <header>
          <h2>Маршрут</h2>
        </header>
        {auction.addressesAndContactsHidden ? (
          <p className={styles.notice}>
            Точные адреса и контакты маршрутных точек скрыты организатором.
          </p>
        ) : null}
        <ol className={styles.routeList}>
          {auction.routes.map((route) => (
            <li key={`${route.rowNumber}-${route.operation}`}>
              <section className={styles.routePoint}>
                <header>
                  <span className={styles.routeNumber}>{route.rowNumber}</span>
                  <div>
                    <h3>{route.operation}</h3>
                    <p>{route.city}</p>
                  </div>
                </header>
                <DetailList
                  fields={[
                    { label: "Начало", value: route.date },
                    { label: "Окончание", value: route.endDate },
                  ]}
                />
                {route.address ? <p>Адрес: {route.address}</p> : null}
                {route.contractor ? (
                  <p>
                    Контрагент: {route.contractor}
                    {route.contractorInn ? `, ИНН ${route.contractorInn}` : ""}
                  </p>
                ) : null}
                {route.contactName || route.contactPhone ? (
                  <p>
                    Контакт: {route.contactName ?? "—"}
                    {route.contactPhone ? `, ${route.contactPhone}` : ""}
                  </p>
                ) : null}
                {route.comment ? <p>Комментарий: {route.comment}</p> : null}
                <DetailList fields={route.cargoFields} />
              </section>
            </li>
          ))}
        </ol>
      </article>

      <div className={styles.sectionGrid}>
        <article>
          <header>
            <h2>Груз</h2>
          </header>
          {auction.cargoPriceHidden ? (
            <p className={styles.notice}>
              Стоимость груза скрыта организатором.
            </p>
          ) : null}
          <DetailList fields={auction.cargoFields} />
        </article>

        <article>
          <header>
            <h2>Транспорт и требования</h2>
          </header>
          <DetailList fields={auction.vehicleFields} />
        </article>

        <article>
          <header>
            <h2>Оплата</h2>
          </header>
          <DetailList fields={auction.paymentFields} />
        </article>

        <article>
          <header>
            <h2>Торги</h2>
          </header>
          <DetailList fields={auction.tradingFields} />
        </article>
      </div>
    </>
  );
}
