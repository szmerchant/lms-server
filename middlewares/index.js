import { expressjwt } from "express-jwt";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

export const requireSignin = expressjwt({
    getToken: (req) => req.cookies.token,
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
});