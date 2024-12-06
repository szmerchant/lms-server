import express from "express";

// middleware
import { requireSignin } from "../middlewares/index.js";

// controllers
import {
    uploadImage,
    removeImage
} from "../controllers/course.js";

const router = express.Router();

router.post("/course/upload-image", requireSignin, uploadImage);
router.post("/course/remove-image", requireSignin, removeImage);

export default router;