// worker.bootstrap.ts
import 'dotenv/config';
import { startNotificationWorker } from './src/notifications/queue/notification.worker';


async function bootstrap() {
  console.log('Starting notification worker...');
  startNotificationWorker(5);
}

bootstrap().catch((err) => {
  console.error('Worker bootstrap failed', err);
  process.exit(1);
});
