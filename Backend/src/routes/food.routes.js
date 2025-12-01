import express from "express";
import multer from "multer";
import { createFood,getFoodItems  } from "../controllers/food.controller.js";
import { authenticateFoodPartner , authenticateUser} from "../middlewares/auth.middleware.js";

const foodRoutes = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
})

// Food Routes
foodRoutes.post("/", authenticateFoodPartner, upload.single("video"), createFood);

foodRoutes.get("/", authenticateUser, getFoodItems);

export default foodRoutes;