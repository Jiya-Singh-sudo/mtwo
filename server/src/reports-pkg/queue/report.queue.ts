// ❌ DISABLED - Requires Redis
// Uncomment when Redis is configured

// import { Queue } from 'bullmq';
// 
// export const reportQueue = new Queue('report-generation', {
//   connection: {
//     host: 'localhost',
//     port: 6379,
//   },
// });

export const reportQueue = null; // Placeholder to prevent import errors
