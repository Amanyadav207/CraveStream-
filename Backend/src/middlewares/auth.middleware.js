import FoodPartner from "../models/foodpartner.model.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import config from "../config.js";

// Returns the decoded token, or sends 401 and returns null.
// Only token problems are 401; DB errors propagate to the error handler (5xx)
// so a database outage is not mistaken for "you are logged out".
const verifyToken = (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        res.status(401).json({ message: "no token provided" });
        return null;
    }
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch {
        res.status(401).json({ message: "invalid or expired token" });
        return null;
    }
}

// Logged in, but as the wrong kind of account -> 403 (not 401, which would
// make the frontend log the user out).
const authenticateRole = (Model, OtherModel, key, forbiddenMessage) => async (req, res, next) => {
    const decoded = verifyToken(req, res);
    if (!decoded) return;

    const account = await Model.findById(decoded.id);
    if (account) {
        req[key] = account;
        return next();
    }
    if (await OtherModel.exists({ _id: decoded.id })) {
        return res.status(403).json({ message: forbiddenMessage });
    }
    res.status(401).json({ message: "unauthorized access" });
}

const authenticateFoodPartner = authenticateRole(FoodPartner, User, "foodPartner", "food partner account required");
const authenticateUser = authenticateRole(User, FoodPartner, "user", "user account required");

export { authenticateFoodPartner, authenticateUser};
