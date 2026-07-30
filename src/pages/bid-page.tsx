import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { z } from "zod";
import { AuctionBidForm } from "../features/set-auction-bid";
import { getErrorMessage } from "../shared/api/client";
import { useAuctionDetail } from "../shared/api/queries";
import {
  ErrorState,
  LoadingState,
  PageShell,
  StateCard,
} from "../shared/ui/state";

const auctionUuidSchema = z.string().uuid();

export function BidPage() {
  const params = useParams({ from: "/auctions/$auctionUuid/bid" });
  const navigate = useNavigate({ from: "/auctions/$auctionUuid/bid" });
  const parsedUuid = auctionUuidSchema.safeParse(params.auctionUuid);
  const detailQuery = useAuctionDetail(params.auctionUuid, {
    enabled: parsedUuid.success,
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

  if (detailQuery.data.trading.can_set_bet !== true) {
    return (
      <main className="container">
        <StateCard
          title="Приём ставок закрыт"
          description="Для этого аукциона сейчас нельзя сделать или изменить ставку."
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

  const hasBid = detailQuery.data.trading.your?.bet === true;

  return (
    <PageShell
      title={hasBid ? "Изменить ставку" : "Сделать ставку"}
      description={`Аукцион ${detailQuery.data.main.cargo_num ?? "—"}`}
    >
      <AuctionBidForm
        auctionUuid={parsedUuid.data}
        detail={detailQuery.data}
        onSuccess={() =>
          void navigate({
            to: "/auctions/$auctionUuid",
            params: { auctionUuid: parsedUuid.data },
            replace: true,
          })
        }
      />
    </PageShell>
  );
}
