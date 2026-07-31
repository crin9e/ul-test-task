import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { parseAuctionListSearch } from "../features/filter-auctions";
import { AuctionDetailPage } from "../pages/auction-detail";
import { AuctionsPage } from "../pages/auctions";
import { BetsPage, parseAuctionBetsSearch } from "../pages/bets";
import { BidPage } from "../pages/bid";
import { NotFoundPage } from "../pages/not-found";
import { parseAppSearch, stringifyAppSearch } from "../shared/lib";

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
  validateSearch: parseAuctionBetsSearch,
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
  loader: () => {
    throw redirect({
      href: "auctions",
    });
  },
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
