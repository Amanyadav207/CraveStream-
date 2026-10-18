import mongoose from "mongoose";

// Fail fast with 503 when MongoDB is not connected, instead of letting the
// request hang until the driver times out (~30s) and then surface as a
// misleading 401 that logs the user out.
const requireDb = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: "Service temporarily unavailable, please retry" });
    }
    next();
};

export default requireDb;
