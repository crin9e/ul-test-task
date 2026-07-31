export { handlers } from "./handlers";
export {
  CURRENT_USER_SUBSCRIBER_ID,
  mockStore,
  resetMockStore,
  UNAUTHORIZED_AUCTION_UUID,
  UNAVAILABLE_AUCTION_UUID,
} from "./store";

export async function startMockServer() {
  const { startMockServer: startBrowserMockServer } = await import("./browser");
  return startBrowserMockServer();
}
