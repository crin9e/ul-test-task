import { worker } from './server';

export function startMockServer() {
  worker.start({ onUnhandledRequest: 'bypass' });
}
