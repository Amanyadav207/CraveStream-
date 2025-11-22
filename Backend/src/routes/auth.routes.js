import express from "express"
import { registerUser,loginUser,logoutUser } from "../controllers/auth.controller.js";   

const authRoutes = express.Router();

authRoutes.post("/user/register", registerUser);
authRoutes.post("/user/login", loginUser);
authRoutes.post("/user/logout", logoutUser);
export default authRoutes;  