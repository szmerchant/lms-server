import { expressjwt } from "express-jwt";
import User from "../models/user.js";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

export const requireSignin = expressjwt({
    getToken: (req) => req.cookies.token,
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
});

export const isInstructor = async (req, res, next) => {
    try {
        const user = await User.findById(req.auth._id).exec();
        if(!user.role.includes("Instructor")) {
            return res.status(403);
        } else {
            next();
        }
    } catch (err) {
        console.log(err);
    }
}