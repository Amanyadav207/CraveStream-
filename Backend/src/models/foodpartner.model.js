import mongoose from "mongoose";

const foodPartnerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
},{
    timestamps: true
});

const FoodPartner = mongoose.model("FoodPartner", foodPartnerSchema);

export default FoodPartner;