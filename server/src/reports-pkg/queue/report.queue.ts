import { Queue } from 'bullmq';

export const reportQueue = new Queue('report-generation', {
  connection: {
    // host: 'localhost',
    // port: 6379,
  },
});
