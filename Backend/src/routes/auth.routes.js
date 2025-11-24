import express from "express"
import { registerUser,loginUser,logoutUser ,foodPartnerLogin,foodPartnerResgister} from "../controllers/auth.controller.js";   

const authRoutes = express.Router();


// User Routes
authRoutes.post("/user/register", registerUser);
authRoutes.post("/user/login", loginUser);
authRoutes.post("/user/logout", logoutUser);

// Food Partner Routes
authRoutes.post("/foodpartner/register", foodPartnerResgister);
authRoutes.post("/foodpartner/login", foodPartnerLogin);

export default authRoutes;  