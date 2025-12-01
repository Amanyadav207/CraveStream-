import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
    name : {type : String, required: true},
    description : {type : String},
    video:{type: String, required: true},
    price : {type : Number},
    foodPartner : {type: mongoose.Schema.Types.ObjectId, ref: "FoodPartner", required: true}
})

const foodModel = mongoose.model("food",foodSchema)

export default foodModel;