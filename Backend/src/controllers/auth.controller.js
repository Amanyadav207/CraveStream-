import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

        const token = jwt.sign({id:newUser._id}, process.env.JWT_SECRET, {expiresIn:'1d'});

        res.cookie("token", token);     


        console.log("registerUser: creating new user", { email });
        await newUser.save();
        console.log("registerUser: new user saved, sending 201", { id: newUser._id });
        res.status(201).json({ message: "User registered successfully",
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

        const token = jwt.sign({id:user._id}, process.env.JWT_SECRET, {expiresIn:'1d'});

        res.cookie("token", token);
        res.status(200).json({ message: "Login successful",
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
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
}

export { registerUser, loginUser, logoutUser };