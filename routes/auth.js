import express from "express";

// middleware
import { requireSignin } from "../middlewares/index.js";

// controllers
import { register, login, logout, currentUser, sendTestEmail, forgotPassword } from "../controllers/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/current-user", requireSignin, currentUser);
router.get("/send-email", sendTestEmail);
router.post("/forgot-password", forgotPassword);

export default router;