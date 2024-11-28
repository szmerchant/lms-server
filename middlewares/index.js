import { expressjwt } from "express-jwt";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

export const requireSignin = expressjwt({
    getToken: (req) => {
        console.log("Token in Cookies:", req.cookies.token);
        return req.cookies.token;
    },
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
});
// Global error handler for JWT errors
export const handleJwtErrors = (err, req, res, next) => {
    if (err.name === "UnauthorizedError") {
        console.error("JWT Error:", err);
        return res.status(401).json({ error: "Unauthorized: Invalid or missing token." });
    }
    next(err); // Pass other errors to the next middleware
};