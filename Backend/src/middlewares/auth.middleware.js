import FoodPartner from "../models/foodpartner.model.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const authenticateFoodPartner = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "no token provided" });
        }
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        // console.log("authenticateFoodPartner: decoded token", decoded);
        const foodPartner = await FoodPartner.findById(decoded.id);
        if (!foodPartner) {
            return res.status(401).json({ message: "unauthorized access" });
        }
        req.foodPartner = foodPartner;
        next();
    } catch (error) {
        console.error("authenticateFoodPartner: caught error", error);
        res.status(401).json({ message: "err" });       
    }
}

const authenticateUser = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "no token provided" });
        }
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "unauthorized access" });
        }
        req.user = user;
        next();
        
    } catch (error) {
        console.error("authenticateUser: caught error", error);
        res.status(401).json({ message: "err" });
        
    }
}

export { authenticateFoodPartner, authenticateUser};