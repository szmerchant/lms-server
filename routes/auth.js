import express from "express";

// controllers
import { register, login, logout, currentUser } from "../controllers/auth.js";

// middleware
import { requireSignin } from "../middlewares/index.js"

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/current-user", requireSignin, currentUser);

export default router;