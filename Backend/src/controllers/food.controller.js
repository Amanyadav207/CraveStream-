import foodModel from "../models/food.model.js";
import { uploadFile } from "../services/storage.service.js";

const createFood = async (req, res) => {

    if (!req.file) {
        return res.status(400).json({ message: "No video file provided" });
    }
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!name) {
        return res.status(400).json({ message: "name is required" });
    }
    const price = req.body.price === undefined || req.body.price === "" ? undefined : Number(req.body.price);
    if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
        return res.status(400).json({ message: "price must be a non-negative number" });
    }

    console.log(`[Food Controller] Received create request. File size: ${req.file.size} bytes`);
    const startTime = Date.now();

    let fileUploadedResult;
    try {
        fileUploadedResult = await uploadFile(req.file.buffer, req.file.mimetype);
    } catch {
        // The video store is a separate dependency: report it as unavailable
        // rather than a generic server error.
        return res.status(502).json({ message: "Video storage is unavailable, please try again later" });
    }
    console.log(`[Food Controller] File upload complete. Time taken: ${Date.now() - startTime}ms`);

    const fooditem = new foodModel({
        name,
        description: req.body.description,
        video: fileUploadedResult.url,
        price,
        foodPartner: req.foodPartner._id
    })

    try {
        await fooditem.save();
        res.status(201).json({
            message: "Food item created successfully",
            fooditem
        });
    } catch (error) {
        console.error("createFood: save failed", error);
        res.status(500).json({ message: "Failed to create food item" });
    }


}

const getFoodItems = async (req, res) => {
    try {
        const foodItems = await foodModel.find({})
        res.status(200).json({
            message: "Food items retrieved successfully",
            foodItems
        });

    } catch (error) {
        console.error("getFoodItems error:", error);
        res.status(500).json({ message: "Server error" });
    }
}



const getPartnerFoodItems = async (req, res) => {
    try {
        const foodItems = await foodModel.find({ foodPartner: req.foodPartner._id });
        res.status(200).json({
            message: "Partner food items retrieved successfully",
            foodItems
        });
    } catch (error) {
        console.error("getPartnerFoodItems error:", error);
        res.status(500).json({ message: "Server error" });
    }
}

export { createFood, getFoodItems, getPartnerFoodItems };
