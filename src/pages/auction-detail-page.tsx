import { Link, useParams } from '@tanstack/react-router';
import { useAuctionDetail } from '../shared/api/queries';
import { ErrorState, LoadingState, PageShell } from '../shared/ui/state';

export function AuctionDetailPage() {
  const params = useParams({ from: '/auctions/$auctionUuid' });
  const { data, isPending, isError, error, refetch } = useAuctionDetail(params.auctionUuid);

  if (isPending) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : 'Не удалось загрузить аукцион.'} onRetry={() => void refetch()} />;
  }

  return (
    <PageShell title={`Аукцион ${data.main?.cargo_num ?? '—'}`} description="Подробности и история ставок.">
      <article>
        <header>
          <h2>Основная информация</h2>
        </header>
        <p>Организатор: {data.organizer?.organization_name ?? '—'}</p>
        <p>Тип: {data.main?.auc_type ?? '—'}</p>
        <p>Статус: {data.trading?.status ?? '—'}</p>
      </article>
      <Link role="button" to="/auctions/$auctionUuid/bets" params={{ auctionUuid: params.auctionUuid }}>
        Посмотреть ставки
      </Link>
    </PageShell>
  );
}
