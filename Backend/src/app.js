import express from "express"
import authRoutes from "./routes/auth.routes.js"
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api", authRoutes);
export default app;
