import BetterQueue from 'better-queue';
import path from 'path';
import { NotificationProcessor } from '../processors/notification.processor';

// Path where the queue JSON file lives
const storeFile = path.join(process.cwd(), '.queue', 'notifications.json');

export const startNotificationWorker = (concurrency = 5) => {
  console.log('📨 Notification Worker started…');

  const processor = new NotificationProcessor();

  const worker = new BetterQueue(
    async (job: any, cb: any) => {
      try {
        await processor.handle(job);
        cb(null); // mark job success
      } catch (err) {
        cb(err);  // mark job failure → triggers retry
      }
    },
    {
      store: {
        type: 'json',
        path: storeFile,
      },
      concurrent: concurrency,
      maxRetries: 5,
      retryDelay: 2000,
      autoResume: true,
    }
  );

  worker.on('task_finish', (taskId: any) => {
    console.log(`✅ Job ${taskId} finished`);
  });

  worker.on('task_failed', (taskId: any, err: any) => {
    console.error(`❌ Job ${taskId} failed:`, err?.message ?? err);
  });

  return worker;
};
