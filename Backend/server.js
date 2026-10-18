import 'dotenv/config';
import mongoose from 'mongoose';
import config from './src/config.js';
import app from './src/app.js';
import connectDB from './src/db/db.js';
import { initStorage } from './src/services/storage.service.js';
import { logger } from './src/observability/logger.js';

await connectDB();
await initStorage();

const server = app.listen(config.port, () => {
    logger.info({ port: config.port, commit: config.gitSha }, 'server started');
});

// Graceful shutdown: Kubernetes sends SIGTERM before killing a pod. Stop
// accepting new connections, let in-flight requests finish, then close the DB.
let shuttingDown = false;
const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'shutting down gracefully');
    const forceExit = setTimeout(() => {
        logger.error('forced exit after 10s');
        process.exit(1);
    }, 10_000);
    forceExit.unref();
    server.close(async () => {
        await mongoose.disconnect();
        logger.info('shutdown complete');
        process.exit(0);
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
