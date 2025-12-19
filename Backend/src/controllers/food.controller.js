import foodModel from "../models/food.model.js";
import { uploadFile } from "../services/storage.service.js";
import { v4 as UUID } from "uuid";

const createFood = async (req, res) => {

    if (!req.file) {
        return res.status(400).json({ message: "No video file provided" });
    }

    console.log(`[Food Controller] Received create request. File size: ${req.file.size} bytes`);
    const startTime = Date.now();

    const fileUploadedResult = await uploadFile(req.file.buffer, UUID());
    console.log(`[Food Controller] File upload complete. Time taken: ${Date.now() - startTime}ms`);

    const fooditem = new foodModel({
        name: req.body.name,
        description: req.body.description,
        video: fileUploadedResult.url,
        foodPartner: req.foodPartner._id
    })

    try {
        await fooditem.save();
        res.status(201).json({
            message: "Food item created successfully",
            fooditem
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create food item",
            error: error.message
        });
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