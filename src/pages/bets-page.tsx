import { useParams } from '@tanstack/react-router';
import { useAuctionBets } from '../shared/api/queries';
import { ErrorState, LoadingState, PageShell } from '../shared/ui/state';

export function BetsPage() {
  const params = useParams({ from: '/auctions/$auctionUuid/bets' });
  const { data, isPending, isError, error, refetch } = useAuctionBets(params.auctionUuid);

  if (isPending) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : 'Не удалось загрузить ставки.'} onRetry={() => void refetch()} />;
  }

  const bets = data.bets ?? [];

  return (
    <PageShell title="История ставок" description="Список ставок по аукциону.">
      {bets.length === 0 ? (
        <article>Ставок пока нет.</article>
      ) : (
        <article>
          <ul>
            {bets.map((bet) => (
              <li key={bet.id}>
                <strong>{bet.organization_name}</strong> — {bet.price_with_vat} ₽
              </li>
            ))}
          </ul>
        </article>
      )}
    </PageShell>
  );
}
