import { useParams } from "@tanstack/react-router";
import { useAuctionDetail } from "../shared/api/queries";
import { ErrorState, LoadingState, PageShell } from "../shared/ui/state";

export function BidPage() {
  const params = useParams({ from: "/auctions/$auctionUuid/bid" });
  const { data, isPending, isError, error, refetch } = useAuctionDetail(
    params.auctionUuid,
  );

  if (isPending) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Не удалось открыть форму ставки."
        }
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <PageShell
      title="Сделать ставку"
      description="Форма ставки будет добавлена на следующем этапе."
    >
      <article>
        <p>Текущая цена: {data.trading?.price?.current ?? "—"} ₽</p>
        <p>Можно ставить: {data.trading?.can_set_bet ? "Да" : "Нет"}</p>
      </article>
    </PageShell>
  );
}
