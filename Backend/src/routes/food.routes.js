import express from "express";
import multer from "multer";
import { createFood } from "../controllers/food.controller.js";
import { authenticateFoodPartner } from "../middlewares/auth.middleware.js";

const foodRoutes = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
})

// Food Routes
foodRoutes.post("/", authenticateFoodPartner, upload.single("video"), createFood);




export default foodRoutes;