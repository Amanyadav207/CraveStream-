import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import FoodPartner from "../models/foodpartner.model.js";
import config from "../config.js";



const cookieOptions = {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    maxAge: 24 * 60 * 60 * 1000
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns an error message, or null when the body is valid.
const validateCredentials = ({ name, email, password }, { requireName }) => {
    if (requireName && (typeof name !== "string" || !name.trim())) return "name is required";
    if (typeof email !== "string" || !EMAIL_PATTERN.test(email)) return "a valid email is required";
    if (typeof password !== "string" || password.length < 6) return "password must be at least 6 characters";
    return null;
}

const registerUser = async (req, res) => {
    const invalid = validateCredentials(req.body ?? {}, { requireName: true });
    if (invalid) return res.status(400).json({ message: invalid });
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("registerUser: existing user found, sending 400", { email });
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });

        const token = jwt.sign({ id: newUser._id }, config.jwtSecret, { expiresIn: '1d' });

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
        if (error.code === 11000) {
            return res.status(400).json({ message: "User already exists" });
        }
        res.status(500).json({ message: "Server error" });
    }
}

const loginUser = async (req, res) => {
    const invalid = validateCredentials(req.body ?? {}, { requireName: false });
    if (invalid) return res.status(400).json({ message: invalid });
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

        const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: '1d' });

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
    const invalid = validateCredentials(req.body ?? {}, { requireName: true });
    if (invalid) return res.status(400).json({ message: invalid });
    try {
        const { name, email, password } = req.body;
        const existingPartner = await FoodPartner.findOne({ email });
        if (existingPartner) {
            console.log("foodPartnerResgister: existing partner found, sending 400", { email });
            return res.status(400).json({ message: "Food Partner already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newPartner = new FoodPartner({ name, email, password: hashedPassword });

        const token = jwt.sign({ id: newPartner._id }, config.jwtSecret, { expiresIn: '1d' });

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
    const invalid = validateCredentials(req.body ?? {}, { requireName: false });
    if (invalid) return res.status(400).json({ message: invalid });
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
        const token = jwt.sign({ id: partner._id }, config.jwtSecret, { expiresIn: '1d' });

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

const verifySession = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, config.jwtSecret);
    } catch {
        return res.status(401).json({ message: "Invalid session" });
    }

    try {
        // Check if it's a User
        let user = await User.findById(decoded.id);
        if (user) {
            return res.status(200).json({
                success: true,
                user: { id: user._id, name: user.name, email: user.email },
                role: 'user'
            });
        }

        // Check if it's a Partner
        let partner = await FoodPartner.findById(decoded.id);
        if (partner) {
            return res.status(200).json({
                success: true,
                partner: { id: partner._id, name: partner.name, email: partner.email },
                role: 'partner'
            });
        }

        return res.status(401).json({ message: "Invalid token" });

    } catch (error) {
        // DB problem, not an auth problem: let the error handler return 5xx.
        next(error);
    }
}

export { registerUser, loginUser, logoutUser, foodPartnerResgister, foodPartnerLogin, verifySession };