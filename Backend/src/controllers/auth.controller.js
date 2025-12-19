import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import FoodPartner from "../models/foodpartner.model.js";



const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("registerUser: existing user found, sending 400", { email });
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.cookie("token", token, cookieOptions);

        console.log("registerUser: creating new user", { email });
        await newUser.save();
        console.log("registerUser: new user saved, sending 201", { id: newUser._id });
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error("registerUser: caught error", error);
        res.status(500).json({ message: "Server error" });
    }
}

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log("loginUser: user not found, sending 400", { email });
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("loginUser: password mismatch, sending 400", { email });
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.cookie("token", token, cookieOptions);
        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("loginUser: caught error", error);
        res.status(500).json({ message: "Server error" });
    }
}

const logoutUser = (req, res) => {
    res.clearCookie("token", cookieOptions);
    res.status(200).json({ message: "Logout successful" });
}

const foodPartnerResgister = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingPartner = await FoodPartner.findOne({ email });
        if (existingPartner) {
            console.log("foodPartnerResgister: existing partner found, sending 400", { email });
            return res.status(400).json({ message: "Food Partner already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newPartner = new FoodPartner({ name, email, password: hashedPassword });

        const token = jwt.sign({ id: newPartner._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.cookie("token", token, cookieOptions);

        console.log("foodPartnerResgister: creating new partner", { email });
        await newPartner.save();
        console.log("foodPartnerResgister: new partner saved, sending 201", { id: newPartner._id });
        res.status(201).json({
            message: "Food Partner registered successfully",
            partner: {
                id: newPartner._id,
                name: newPartner.name,
                email: newPartner.email
            }
        });
    } catch (error) {
        console.error("foodPartnerResgister: caught error", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Food Partner already exists" });
        }
        res.status(500).json({ message: "Server error" });
    }
}

const foodPartnerLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const partner = await FoodPartner.findOne({ email });
        if (!partner) {
            console.log("foodPartnerLogin: partner not found, sending 400", { email });
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const isMatch = await bcrypt.compare(password, partner.password);
        if (!isMatch) {
            console.log("foodPartnerLogin: password mismatch, sending 400", { email });
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ id: partner._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.cookie("token", token, cookieOptions);
        res.status(200).json({
            message: "Login successful",
            partner: {
                id: partner._id,
                name: partner.name,
                email: partner.email
            }
        });
    } catch (error) {
        console.error("foodPartnerLogin: caught error", error);
        res.status(500).json({ message: "Server error" });
    }
}

export { registerUser, loginUser, logoutUser, foodPartnerResgister, foodPartnerLogin };