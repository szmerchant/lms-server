import express from "express";

// middleware
import {
    requireSignin,
    isInstructor
} from "../middlewares/index.js";

// controllers
import {
    uploadImage,
    removeImage,
    create
} from "../controllers/course.js";

const router = express.Router();

// image
router.post("/course/upload-image", requireSignin, uploadImage);
router.post("/course/remove-image", requireSignin, removeImage);
// course
router.post("/course", requireSignin, isInstructor, create);

export default router;