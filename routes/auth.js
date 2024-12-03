import express from "express";

// middleware
import { requireSignin } from "../middlewares/index.js";

// controllers
import { register, login, logout, currentUser, sendTestEmail } from "../controllers/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/current-user", requireSignin, currentUser);
router.get("/send-email", sendTestEmail);

export default router;