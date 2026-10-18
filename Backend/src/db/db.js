import mongoose from "mongoose";
import config from "../config.js";
import { logger } from "../observability/logger.js";

mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));

const MAX_ATTEMPTS = Number(process.env.DB_CONNECT_ATTEMPTS) || 12;

// Retry for about a minute so the API tolerates starting before MongoDB.
// If it still fails, exit: Kubernetes restarts the pod with backoff and the
// readiness probe keeps traffic away meanwhile.
const connectDB = async () => {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            await mongoose.connect(config.dbUrl, { serverSelectionTimeoutMS: 5000 });
            logger.info("MongoDB connected");
            return;
        } catch (error) {
            logger.error({ attempt, maxAttempts: MAX_ATTEMPTS, err: error.message }, "MongoDB connection failed");
            if (attempt === MAX_ATTEMPTS) process.exit(1);
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }
}

export default connectDB;
