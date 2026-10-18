import foodModel from "../models/food.model.js";
import { uploadFile } from "../services/storage.service.js";
import { uploads } from "../observability/metrics.js";

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

    let fileUploadedResult;
    try {
        fileUploadedResult = await uploadFile(req.file.buffer, req.file.mimetype);
    } catch {
        uploads.inc({ result: "storage_error" });
        // The video store is a separate dependency: report it as unavailable
        // rather than a generic server error.
        return res.status(502).json({ message: "Video storage is unavailable, please try again later" });
    }

    const fooditem = new foodModel({
        name,
        description: req.body.description,
        video: fileUploadedResult.url,
        price,
        foodPartner: req.foodPartner._id
    })

    try {
        await fooditem.save();
        uploads.inc({ result: "success" });
        req.log.info({ foodId: fooditem._id, bytes: req.file.size }, "food item created");
        res.status(201).json({
            message: "Food item created successfully",
            fooditem
        });
    } catch (error) {
        uploads.inc({ result: "db_error" });
        req.log.error({ err: error }, "food item save failed");
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
        req.log.error({ err: error }, "list food items failed");
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
        req.log.error({ err: error }, "list partner food items failed");
        res.status(500).json({ message: "Server error" });
    }
}

export { createFood, getFoodItems, getPartnerFoodItems };
