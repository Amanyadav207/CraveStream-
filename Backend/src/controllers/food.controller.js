import foodModel from "../models/food.model.js";

const createFood = async (req, res) => {
    res.send("Create Food Endpoint");
    console.log(req.body);
    console.log(req.file);
    
}



export { createFood };