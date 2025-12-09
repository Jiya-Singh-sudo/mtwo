import BetterQueue from 'better-queue';
import path from 'path';

// Path where queued jobs are stored persistently
const storeFile = path.join(process.cwd(), '.queue', 'notifications.json');

export const notificationQueue = new BetterQueue(
  // This callback is NOT where the job is processed.
  // The worker will process the job separately.
  (job: any, cb: any) => {
    cb(); 
  },
  {
    // Built-in JSON file store (this is included inside better-queue)
    store: {
      type: 'json',
      path: storeFile,
      saveInterval: 500,     // flush to disk every 0.5 seconds
    },

    maxRetries: 5,
    retryDelay: 2000,        // retry failed jobs after 2 seconds
    concurrent: 1,
    autoResume: true,        // load pending jobs when app starts
  }
);
