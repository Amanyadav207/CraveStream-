import mongoose from "mongoose";
import config from "../config.js";

mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected"));
mongoose.connection.on("reconnected", () => console.log("MongoDB reconnected"));

// Exit on startup failure: in Kubernetes the pod restarts with backoff until
// MongoDB is reachable, and the readiness probe keeps traffic away meanwhile.
const connectDB = async () => {
    try {
        await mongoose.connect(config.dbUrl, { serverSelectionTimeoutMS: 5000 });
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

export default connectDB;
