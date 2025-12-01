import foodModel from "../models/food.model.js";
import { uploadFile } from "../services/storage.service.js";
import { v4 as UUID } from "uuid";

const createFood = async (req, res) => {
   
    const fileUploadedResult=await uploadFile(req.file.buffer,UUID());

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



export { createFood };