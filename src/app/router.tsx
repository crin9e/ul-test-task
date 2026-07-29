import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  NotFoundRoute,
} from "@tanstack/react-router";
import { AuctionsPage } from "../pages/auctions-page";
import { NotFoundPage } from "../pages/not-found-page";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const auctionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "auctions",
  component: AuctionsPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <div className="container">
      <h1>Грузовые аукционы</h1>
      <p>Добро пожаловать в приложение.</p>
    </div>
  ),
});

const notFoundRoute = new NotFoundRoute({
  getParentRoute: () => rootRoute,
  component: NotFoundPage,
});

const routeTree = rootRoute.addChildren([indexRoute, auctionsRoute]);

export const router = createRouter({ routeTree, notFoundRoute });

export type RouterType = typeof router;
