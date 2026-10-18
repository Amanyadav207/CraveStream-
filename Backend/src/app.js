import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config.js";
import authRoutes from "./routes/auth.routes.js"
import foodRoutes from "./routes/food.routes.js"
import healthRoutes from "./routes/health.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import requireDb from "./middlewares/requireDb.middleware.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.disable("x-powered-by");

app.use(cors({
    origin: config.corsOrigin,
    credentials: true
}));

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// Health + version endpoints never touch the DB guard.
app.use("/", healthRoutes);
app.use("/api", healthRoutes);

// Media is served from object storage, not MongoDB.
app.use("/api/media", mediaRoutes);

app.use("/api", requireDb);
app.use("/api", authRoutes);
app.use("/api/food", foodRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
