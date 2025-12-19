import express from "express"
import { registerUser, loginUser, logoutUser, foodPartnerLogin, foodPartnerResgister, verifySession } from "../controllers/auth.controller.js";

const authRoutes = express.Router();


// User Routes
authRoutes.post("/user/register", registerUser);
authRoutes.post("/user/login", loginUser);
authRoutes.post("/user/logout", logoutUser);

// Food Partner Routes
authRoutes.post("/foodpartner/register", foodPartnerResgister);
authRoutes.post("/foodpartner/login", foodPartnerLogin);

// Verify Session
authRoutes.get("/verify", verifySession);

export default authRoutes;  