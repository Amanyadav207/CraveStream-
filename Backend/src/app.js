import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js"
import foodRoutes from "./routes/food.routes.js"
// import {authenticateFoodPartner} from "./middlewares/auth.middleware.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use("/api", authRoutes);
app.use("/api/food", foodRoutes);
// app.use(authenticateFoodPartner);


export default app;
