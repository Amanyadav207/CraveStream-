import foodModel from "../models/food.model.js";
import jwt from "jsonwebtoken";

const authenticateFoodPartner = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "unauthorized access" });
        }
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        const foodPartner = await foodModel.findById(decoded.id);
        if (!foodPartner) {
            return res.status(401).json({ message: "unauthorized access" });
        }
        req.foodPartner = foodPartner;
        next();
    } catch (error) {
        console.error("authenticateFoodPartner: caught error", error);
        res.status(401).json({ message: "unauthorized access" });       
    }
}

export { authenticateFoodPartner};