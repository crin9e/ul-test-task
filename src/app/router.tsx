import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { parseAuctionListSearch } from "../features/filter-auctions";
import { AuctionsPage } from "../pages/auctions-page";
import { AuctionDetailPage } from "../pages/auction-detail-page";
import { BetsPage } from "../pages/bets-page";
import { BidPage } from "../pages/bid-page";
import { NotFoundPage } from "../pages/not-found-page";
import {
  parseAppSearch,
  stringifyAppSearch,
} from "../shared/lib/search-params";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
});

const auctionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "auctions",
  validateSearch: parseAuctionListSearch,
  component: AuctionsPage,
});

const auctionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "auctions/$auctionUuid",
  component: AuctionDetailPage,
});

const betsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "auctions/$auctionUuid/bets",
  component: BetsPage,
});

const bidRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "auctions/$auctionUuid/bid",
  component: BidPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <main className="container">
      <h1>Грузовые аукционы</h1>
      <p>Добро пожаловать в приложение.</p>
    </main>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  auctionsRoute,
  auctionDetailRoute,
  betsRoute,
  bidRoute,
]);

export function createAppRouter() {
  return createRouter({
    routeTree,
    parseSearch: parseAppSearch,
    stringifySearch: stringifyAppSearch,
  });
}

export const router = createAppRouter();

export type RouterType = typeof router;
