import express from "express";
import multer from "multer";
import { createFood, getFoodItems, getPartnerFoodItems } from "../controllers/food.controller.js";
import { authenticateFoodPartner, authenticateUser } from "../middlewares/auth.middleware.js";

const foodRoutes = express.Router();

// Matches the 10MB limit shown in the partner dashboard UI.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("video/")) return cb(null, true);
        cb(Object.assign(new Error("only video files are allowed"), { status: 400 }));
    },
})

// Food Routes
foodRoutes.post("/", authenticateFoodPartner, upload.single("video"), createFood);
foodRoutes.get("/partner", authenticateFoodPartner, getPartnerFoodItems);

foodRoutes.get("/", authenticateUser, getFoodItems);

export default foodRoutes;
