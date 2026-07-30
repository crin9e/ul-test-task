import { worker } from './server';

export function startMockServer() {
  return worker.start({ onUnhandledRequest: 'bypass' });
}
